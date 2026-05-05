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

// Auto-generate flag files if missing (for native npm start after fresh git clone)
const flagFiles = [
    { path: path.join(__dirname, 'flag_calc.txt'), content: 'CTF{rce_eval_is_evil_math}' },
    { path: path.join(__dirname, 'flag_xxe.txt'), content: 'CTF{xxe_entity_expansion_pro}' },
    { path: path.join(__dirname, 'ping_sandbox', 'flag_ping.txt'), content: 'CTF{cmd_inj_root_access_pwned}' }
];
flagFiles.forEach(({ path: fp, content }) => {
    if (!fs.existsSync(fp)) {
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, content);
    }
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser('secret_key_for_signed_cookies'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'aquila_ctf_platform_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/phantom-lab', express.static(path.join(__dirname, 'phantom-insider', 'static')));
app.set('view engine', 'ejs');

// Routes
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const apiRoutes = require('./routes/api');

app.use('/auth', authRoutes);
app.use('/challenge', challengeRoutes);
// Internal endpoint for SSRF challenge (must be at root level, not under /challenge)
app.get('/internal/flag', (req, res) => {
    res.send('CTF{ssrf_internal_access_hacker}');
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
            totalPenalty += (row.hints_used * 20);
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

        res.render('index', {
            title: 'Aquila CTF',
            score: finalScore,
            progress: progressPercent,
            solved: solved,
            timeDisplay: timeDisplay,
            startTime: req.session.startTime,
            user: req.session.username,
            challenges: buildChallengeCards(solved),
            totalChallenges: TOTAL_CHALLENGES
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
