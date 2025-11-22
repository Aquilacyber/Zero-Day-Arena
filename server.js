const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Constants
const CHALLENGE_NAMES = {
    1: 'Login Bypass', 2: 'Search Bar', 3: 'User Profile', 4: 'Ping Tool',
    5: 'Secret Vault', 6: 'Calculator', 7: 'Settings Panel', 8: 'File Manager',
    9: 'XML Parser', 10: 'URL Fetcher'
};

const CHALLENGE_DIFFICULTIES = {
    1: 'Easy', 2: 'Easy', 3: 'Medium', 4: 'Medium',
    5: 'Hard', 6: 'Hard', 7: 'Medium', 8: 'Easy',
    9: 'Hard', 10: 'Medium'
};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser('secret_key_for_signed_cookies'));
app.use(session({
    secret: 'super_secret_session_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');

app.use('/auth', authRoutes);
app.use('/challenge', challengeRoutes);

// Middleware to check auth
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    next();
};

app.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Get solved challenges
        const solvedRows = await db.query('SELECT challenge_id FROM user_progress WHERE user_id = ?', [userId]);
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
        const totalChallenges = 10;
        const progress = (solved.length / totalChallenges) * 100;

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
            progress: progress,
            solved: solved,
            timeDisplay: timeDisplay,
            user: req.session.username,
            challenges: [
                { id: 1, name: 'Login Bypass', type: 'SQL Injection', difficulty: 'Easy', description: 'A poorly secured authentication system awaits exploitation.', status: solved.includes(1) ? 'Solved' : 'Locked' },
                { id: 2, name: 'Search Bar', type: 'Reflected XSS', difficulty: 'Easy', description: 'User input is reflected without proper sanitization.', status: solved.includes(2) ? 'Solved' : 'Locked' },
                { id: 3, name: 'User Profile', type: 'IDOR', difficulty: 'Medium', description: 'Access control flaws allow unauthorized data access.', status: solved.includes(3) ? 'Solved' : 'Locked' },
                { id: 4, name: 'Ping Tool', type: 'Command Injection', difficulty: 'Medium', description: 'System commands are executed without validation.', status: solved.includes(4) ? 'Solved' : 'Locked' },
                { id: 5, name: 'Secret Vault', type: 'JWT Bypass', difficulty: 'Hard', description: 'Cryptographic tokens protect sensitive resources.', status: solved.includes(5) ? 'Solved' : 'Locked' },
                { id: 6, name: 'Calculator', type: 'Remote Code Execution', difficulty: 'Hard', description: 'Dangerous code evaluation exposes the system.', status: solved.includes(6) ? 'Solved' : 'Locked' },
                { id: 7, name: 'Settings Panel', type: 'CSRF', difficulty: 'Medium', description: 'State-changing operations lack proper protection.', status: solved.includes(7) ? 'Solved' : 'Locked' },
                { id: 8, name: 'File Manager', type: 'File Upload', difficulty: 'Easy', description: 'Unrestricted file uploads create security risks.', status: solved.includes(8) ? 'Solved' : 'Locked' },
                { id: 9, name: 'XML Parser', type: 'XXE', difficulty: 'Hard', description: 'XML processing reveals internal system data.', status: solved.includes(9) ? 'Solved' : 'Locked' },
                { id: 10, name: 'URL Fetcher', type: 'SSRF', difficulty: 'Medium', description: 'Server-side requests can be manipulated.', status: solved.includes(10) ? 'Solved' : 'Locked' }
            ]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/submit', requireAuth, async (req, res) => {
    const flag = req.body.flag;
    const userId = req.session.userId;

    try {
        const rows = await db.query('SELECT * FROM flags');
        let found = false;
        let challengeId = -1;
        let challengeName = '';

        // Using global constant

        for (const row of rows) {
            const decodedFlag = Buffer.from(row.flag, 'base64').toString('utf-8');
            if (decodedFlag.trim() === flag.trim()) {
                found = true;
                challengeId = row.challenge_id;
                challengeName = CHALLENGE_NAMES[challengeId] || 'Unknown Challenge';
                break;
            }
        }

        if (found) {
            // Check if already solved
            const progress = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?', [userId, challengeId]);

            if (!progress) {
                // Insert progress
                await db.run('INSERT INTO user_progress (user_id, challenge_id, solved_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [userId, challengeId]);

                // Calculate new score
                const solvedRows = await db.query('SELECT challenge_id FROM user_progress WHERE user_id = ?', [userId]);
                const solvedCount = solvedRows.length;

                // Calculate total penalty
                let totalPenalty = 0;
                const progressRows = await db.query('SELECT hints_used FROM user_progress WHERE user_id = ?', [userId]);
                progressRows.forEach(row => {
                    totalPenalty += (row.hints_used * 20);
                });

                const newScore = Math.max(0, (solvedCount * 100) - totalPenalty);

                return res.json({
                    success: true,
                    message: `${challengeName} completed!`,
                    newScore: newScore,
                    challengeId: challengeId,
                    challengeName: challengeName
                });
            } else {
                return res.json({ success: false, message: 'Flag already submitted.' });
            }
        } else {
            return res.json({ success: false, message: 'Invalid flag.' });
        }
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: 'Server Error' });
    }
});

app.post('/hint', requireAuth, async (req, res) => {
    const challengeId = parseInt(req.body.challengeId);
    const userId = req.session.userId;

    // Validate challengeId
    if (isNaN(challengeId) || challengeId < 1 || challengeId > 10) {
        return res.json({ success: false, message: 'Invalid challenge ID' });
    }

    try {
        // Get current progress
        let progress = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?', [userId, challengeId]);

        let currentHintsUsed = progress ? progress.hints_used : 0;
        let nextLevel = currentHintsUsed + 1;

        if (nextLevel > 3) {
            return res.json({ success: false, message: 'No more hints available for this challenge.' });
        }

        // Get hint text
        const hint = await db.get('SELECT hint_text FROM hints WHERE challenge_id = ? AND level = ?', [challengeId, nextLevel]);

        if (!hint) {
            return res.json({ success: false, message: 'Hint not found.' });
        }

        // Update progress
        if (progress) {
            await db.run('UPDATE user_progress SET hints_used = ? WHERE user_id = ? AND challenge_id = ?', [nextLevel, userId, challengeId]);
        } else {
            // Create progress entry if not exists (not solved yet, but using hints)
            await db.run('INSERT INTO user_progress (user_id, challenge_id, hints_used) VALUES (?, ?, ?)', [userId, challengeId, nextLevel]);
        }

        return res.json({
            success: true,
            hint: hint.hint_text,
            level: nextLevel,
            penalty: 20,
            hintsRemaining: 3 - nextLevel
        });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: 'Server Error' });
    }
});

// Writeups Data
const writeups = require('./data/writeups');

app.get('/writeup/:id', requireAuth, async (req, res) => {
    const challengeId = parseInt(req.params.id);
    const userId = req.session.userId;

    // Validate challengeId
    if (isNaN(challengeId) || challengeId < 1 || challengeId > 10) {
        return res.status(404).send('Invalid challenge ID');
    }

    try {
        // Check if user has solved the challenge (not just used hints)
        const progress = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?', [userId, challengeId]);

        if (!progress || !progress.solved_at) {
            return res.status(403).send('You must solve the challenge first to view the writeup.');
        }

        // Using global constants

        const writeup = writeups[challengeId];

        if (!writeup) {
            return res.status(404).send('Writeup not found.');
        }

        res.render('writeup', {
            challenge: {
                name: CHALLENGE_NAMES[challengeId],
                difficulty: CHALLENGE_DIFFICULTIES[challengeId]
            },
            writeup: writeup
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/export-progress', requireAuth, async (req, res) => {
    const userId = req.session.userId;

    try {
        const user = await db.get('SELECT username, created_at FROM users WHERE id = ?', [userId]);
        const progress = await db.query('SELECT * FROM user_progress WHERE user_id = ?', [userId]);

        // Using global constant

        const report = {
            user: user.username,
            joined: user.created_at,
            exported_at: new Date().toISOString(),
            total_solved: progress.length,
            challenges: progress.map(p => ({
                challenge: CHALLENGE_NAMES[p.challenge_id],
                solved_at: p.solved_at,
                hints_used: p.hints_used
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=aquila_report_${user.username}.json`);
        res.send(JSON.stringify(report, null, 2));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

