const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Config
const { buildChallengeCards, TOTAL_CHALLENGES } = require('./config/challenges');
const { getEventState } = require('./config/event');

// Auto-generate flag files if missing.
// Bug fix 2: read flag content from DB (single source of truth) instead of hardcoding.
// Falls back to DB values at startup so file contents always match the flags table.
const generateFlagFiles = async () => {
    const fileChallenges = [
        { path: path.join(__dirname, 'flag_calc.txt'),                   challengeId: 6  },
        { path: path.join(__dirname, 'flag_xxe.txt'),                    challengeId: 9  },
        { path: path.join(__dirname, 'ping_sandbox', 'flag_ping.txt'),   challengeId: 4  },
    ];
    for (const { path: fp, challengeId } of fileChallenges) {
        if (!fs.existsSync(fp)) {
            try {
                const row = await db.get('SELECT flag FROM flags WHERE challenge_id = ?', [challengeId]);
                if (row) {
                    const plain = Buffer.from(row.flag, 'base64').toString('utf-8').trim();
                    fs.mkdirSync(path.dirname(fp), { recursive: true });
                    fs.writeFileSync(fp, plain);
                    console.log(`[flags] Generated ${path.basename(fp)}`);
                }
            } catch (err) {
                console.error(`[flags] Could not generate ${path.basename(fp)}:`, err.message);
            }
        }
    }
};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
// Bug fix: express's body parsers leave req.body as `undefined` (not `{}`)
// when a request has no matching Content-Type — e.g. a POST with no body,
// or certain CSRF-style cross-origin requests. Any route reading
// req.body.someField in that case throws "Cannot read properties of
// undefined", crashing the request with a 500 and leaking a stack trace.
// This is especially bad here since it's attack-shaped traffic that
// triggers it. Normalise req.body to always be an object.
app.use((req, res, next) => {
    if (req.body === undefined) req.body = {};
    next();
});
app.use(cookieParser(process.env.SESSION_SECRET || 'secret_key_for_signed_cookies')); // Bug fix 7: use SESSION_SECRET env var
app.use(session({
    secret: process.env.SESSION_SECRET || 'aquila_ctf_platform_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,   // 24 hours
        httpOnly: true,                  // Bug fix 1: JS cannot read the session cookie
        secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod
        sameSite: 'lax'                  // CSRF protection at cookie level
    }
}));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/phantom-lab', express.static(path.join(__dirname, 'phantom-insider', 'static')));
app.set('view engine', 'ejs');

// Routes
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/challenge', challengeRoutes);
app.use('/admin', adminRoutes);
// Internal endpoint for SSRF challenge (must be at root level, not under /challenge)
app.get('/internal/flag', async (req, res) => {
    // Bug fix 1: flag served from DB, not hardcoded
    try {
        const row = await db.get('SELECT flag FROM flags WHERE challenge_id = ?', [10]);
        const plain = row ? Buffer.from(row.flag, 'base64').toString('utf-8').trim() : '';
        res.send(plain);
    } catch (err) {
        console.error('[internal/flag]', err);
        res.status(500).send('Error');
    }
});

app.use('/', apiRoutes);

app.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Get solved challenges
        const solvedRows = await db.query('SELECT challenge_id FROM user_progress WHERE user_id = ? AND solved_at IS NOT NULL', [userId]);
        const solved = solvedRows.map(row => row.challenge_id);

        // Initialize timer if not present (using session now)
        if (!req.session.startTime) {
            req.session.startTime = Date.now();
        }

        const score = solved.length * 100; // Base score, need to subtract hints

        // Calculate actual score with hint penalties
        let totalPenalty = 0;
        const progressRows = await db.query('SELECT hints_used FROM user_progress WHERE user_id = ?', [userId]);
        progressRows.forEach(row => {
            totalPenalty += (row.hints_used || 0) * 20;
        });

        const finalScore = Math.max(0, score - totalPenalty);
        const progressPercent = (solved.length / TOTAL_CHALLENGES) * 100;

        // Calculate elapsed time
        const startTime = req.session.startTime;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;
        const timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const event = getEventState();

        // Fetch team info if user is on a team
        let team = null;
        if (req.session.teamId) {
            try {
                team = await db.get('SELECT name, code FROM teams WHERE id = ?', [req.session.teamId]);
            } catch (_) {}
        }

        res.render('index', {
            title: event.name,
            score: finalScore,
            progress: progressPercent,
            solved: solved,              // array of solved challenge IDs (for buildChallengeCards)
            solvedCount: solved.length,  // scalar count for display in templates
            timeDisplay: timeDisplay,
            startTime: req.session.startTime,
            user: req.session.username,
            isAdmin: req.session.isAdmin || false,
            challenges: buildChallengeCards(solved),
            totalChallenges: TOTAL_CHALLENGES,
            event,
            team,
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            statusCode: 500,
            title: 'Server Error',
            message: 'Something went wrong loading the dashboard. Please try again.',
            icon: '⚡'
        });
    }
});

// 404 Catch-all — must be after all route definitions
app.use((req, res) => {
    res.status(404).render('error', {
        statusCode: 404,
        title: 'Page Not Found',
        message: 'The page you are looking for doesn\'t exist or has been moved.',
        icon: '🔍'
    });
});

// Generate flag files from DB after everything is initialised
generateFlagFiles().catch(err => console.error('[flags] Init error:', err));

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received. Shutting down...');
    server.close(() => {
        process.exit(0);
    });
});