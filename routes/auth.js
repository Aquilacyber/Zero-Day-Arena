const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../database');

const USERNAME_MIN = 3;
const USERNAME_MAX = 24;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72;
const USERNAME_REGEX = /^[a-zA-Z0-9_\-]+$/;
const TEAM_NAME_MAX = 32;
// Bug fix: team names previously had no character restriction (only a
// length cap), unlike usernames. Team names are rendered into an inline
// onclick handler in the admin panel, so unrestricted characters allowed
// stored XSS reaching an admin's session. Restrict to the same safe set
// as usernames, plus spaces, so team names still feel natural.
const TEAM_NAME_REGEX = /^[a-zA-Z0-9_\- ]+$/;

const redirectIfAuth = (req, res, next) => {
    if (req.session.userId) return res.redirect('/');
    next();
};

// ── Generate a short unique team join code ─────────────────────
function generateTeamCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F9B2"
}

// ── Register Page ──────────────────────────────────────────────
router.get('/register', redirectIfAuth, (req, res) => {
    res.render('register', { error: null });
});

// ── Register Logic ─────────────────────────────────────────────
router.post('/register', redirectIfAuth, async (req, res) => {
    const username   = (req.body.username   || '').trim();
    const password   = req.body.password    || '';
    const teamAction = req.body.team_action || 'none';   // 'create' | 'join' | 'none'
    const teamName   = (req.body.team_name  || '').trim();
    const teamCode   = (req.body.team_code  || '').trim().toUpperCase();

    const fail = (msg) => res.render('register', { error: msg });

    // ── User validation ────────────────────────────────────────
    if (!username || !password) return fail('All fields are required.');
    if (username.length < USERNAME_MIN || username.length > USERNAME_MAX)
        return fail(`Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`);
    if (!USERNAME_REGEX.test(username))
        return fail('Username may only contain letters, numbers, underscores, and hyphens.');
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX)
        return fail(`Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`);

    // ── Team validation ────────────────────────────────────────
    if (teamAction === 'create' && !teamName)
        return fail('Please enter a team name.');
    if (teamAction === 'create' && teamName.length > TEAM_NAME_MAX)
        return fail(`Team name must be ${TEAM_NAME_MAX} characters or fewer.`);
    if (teamAction === 'create' && !TEAM_NAME_REGEX.test(teamName))
        return fail('Team name may only contain letters, numbers, spaces, underscores, and hyphens.');
    if (teamAction === 'join' && !teamCode)
        return fail('Please enter a team code.');

    try {
        // Duplicate username check
        const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) return fail('Username already taken.');

        let teamId = null;

        if (teamAction === 'create') {
            // Duplicate team name check
            const existingTeam = await db.get('SELECT id FROM teams WHERE name = ?', [teamName]);
            if (existingTeam) return fail('Team name already taken. Choose another.');

            // Bug fix 4: retry on code collision (astronomically rare but defensive)
            let code, codeUnique = false;
            for (let attempt = 0; attempt < 10; attempt++) {
                code = generateTeamCode();
                const taken = await db.get('SELECT id FROM teams WHERE code = ?', [code]);
                if (!taken) { codeUnique = true; break; }
            }
            if (!codeUnique) return fail('Could not generate a unique team code. Please try again.');

            const now = new Date().toISOString();
            await db.run(
                'INSERT INTO teams (name, code, created_at, captain_id) VALUES (?, ?, ?, ?)',
                [teamName, code, now, 0]
            );
            const newTeam = await db.get('SELECT id FROM teams WHERE code = ?', [code]);
            teamId = newTeam.id;
        } else if (teamAction === 'join') {
            const team = await db.get('SELECT id FROM teams WHERE code = ?', [teamCode]);
            if (!team) return fail(`No team found with code "${teamCode}". Check the code and try again.`);
            teamId = team.id;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run(
            'INSERT INTO users (username, password, created_at, team_id) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, new Date().toISOString(), teamId]
        );

        // If they created a team, set themselves as captain
        if (teamAction === 'create' && teamId) {
            const newUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
            await db.run('UPDATE teams SET captain_id = ? WHERE id = ?', [newUser.id, teamId]);
        }

        res.redirect('/auth/login');
    } catch (err) {
        console.error('[register]', err);
        fail('Registration failed. Please try again.');
    }
});

// ── Login Page ─────────────────────────────────────────────────
router.get('/login', redirectIfAuth, (req, res) => {
    res.render('auth_login', { error: null });
});

// ── Login Logic ────────────────────────────────────────────────
router.post('/login', redirectIfAuth, async (req, res) => {
    const username = (req.body.username || '').trim();
    const password = req.body.password  || '';

    if (!username || !password)
        return res.render('auth_login', { error: 'All fields are required.' });

    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        const dummyHash = '$2a$10$invalidhashfortimingprotection000000000000000000000000';
        const isMatch = user
            ? await bcrypt.compare(password, user.password)
            : await bcrypt.compare(password, dummyHash).then(() => false);

        if (!user || !isMatch)
            return res.render('auth_login', { error: 'Invalid credentials.' });

        req.session.userId   = user.id;
        req.session.username = user.username;
        req.session.teamId   = user.team_id || null;
        req.session.isAdmin  = (user.username === 'admin');

        res.redirect('/');
    } catch (err) {
        console.error('[login]', err);
        res.render('auth_login', { error: 'Login failed. Please try again.' });
    }
});

// ── Logout ─────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('[logout] Session destroy error:', err);
        res.clearCookie('connect.sid');
        res.redirect('/auth/login');
    });
});

module.exports = router;