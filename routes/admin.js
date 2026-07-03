const express = require('express');
const router = express.Router();
const db = require('../database');
const { CHALLENGES, TOTAL_CHALLENGES, getChallengeName } = require('../config/challenges');
const { getEventState, loadConfig, saveConfig, clearEventTiming } = require('../config/event');
const { calcUserScore } = require('../lib/score');

// Admin auth guard — must come before all routes
router.use((req, res, next) => {
    if (!req.session.userId || !req.session.isAdmin) {
        return res.status(403).render('error', {
            statusCode: 403,
            title: 'Access Denied',
            message: 'This area is restricted to administrators only.',
            icon: '🔒'
        });
    }
    next();
});

// ── GET /admin ─────────────────────────────────────────────────────────────
// Main dashboard: platform stats, per-challenge solve counts, user table
router.get('/', async (req, res) => {
    try {
        // All users and teams
        const users = await db.query('SELECT id, username, created_at, team_id FROM users');
        const teams = await db.query('SELECT * FROM teams');

        // All progress rows at once — compute everything in JS (avoids N+1)
        const allProgress = await db.query('SELECT * FROM user_progress');

        // Per-user aggregates
        const userMap = {};
        users.forEach(u => {
            userMap[u.id] = {
                id: u.id,
                username: u.username,
                joined: u.created_at,
                solved: 0,
                hints: 0,
                score: 0,
                lastActive: null
            };
        });

        allProgress.forEach(p => {
            const u = userMap[p.user_id];
            if (!u) return;
            if (p.solved_at) {
                u.solved++;
                // Track most recent activity
                if (!u.lastActive || p.solved_at > u.lastActive) u.lastActive = p.solved_at;
            }
            u.hints += (p.hints_used || 0);
        });

        // Score = (solved * 100) - (hints * 20), floor 0
        Object.values(userMap).forEach(u => {
            u.score = Math.max(0, u.solved * 100 - u.hints * 20);
        });

        const userList = Object.values(userMap).sort((a, b) => b.score - a.score);

        // Per-challenge solve counts
        const challengeStats = [];
        for (let id = 1; id <= TOTAL_CHALLENGES; id++) {
            const solveCount = allProgress.filter(p => p.challenge_id === id && p.solved_at).length;
            const ch = CHALLENGES[id];
            challengeStats.push({
                id,
                name: ch.name,
                type: ch.type,
                difficulty: ch.difficulty,
                solves: solveCount,
                solveRate: users.length > 0 ? Math.round((solveCount / users.length) * 100) : 0
            });
        }

        // Platform-level stats
        const totalUsers = users.length;
        const totalSolves = allProgress.filter(p => p.solved_at).length;
        const totalHints = allProgress.reduce((s, p) => s + (p.hints_used || 0), 0);
        const activeUsers = userList.filter(u => u.solved > 0).length;

        const event = getEventState();
        // Hydrate user team names
        const teamMap = {};
        teams.forEach(t => { teamMap[t.id] = t; });
        userList.forEach(u => { u.teamName = u.team_id ? (teamMap[u.team_id]?.name || '—') : null; });

        res.render('admin', {
            title: `Admin — ${event.name}`,
            stats: { totalUsers, totalSolves, totalHints, activeUsers, totalChallenges: TOTAL_CHALLENGES, totalTeams: teams.length },
            userList,
            challengeStats,
            teams: teams.map(t => ({
                ...t,
                memberCount: users.filter(u => u.team_id === t.id).length,
                captain: users.find(u => u.id === t.captain_id)?.username || '—'
            })),
            adminUser: req.session.username,
            adminScore: await calcUserScore(req.session.userId),
            event
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).render('error', {
            statusCode: 500,
            title: 'Admin Error',
            message: 'Could not load admin dashboard.',
            icon: '⚡'
        });
    }
});

// ── POST /admin/reset-user ─────────────────────────────────────────────────
// Wipe all progress for a user (keeps account)
router.post('/reset-user', async (req, res) => {
    const targetId = parseInt(req.body.userId);
    if (isNaN(targetId)) return res.json({ success: false, message: 'Invalid user ID' });

    // Prevent resetting own account from admin panel
    if (targetId === req.session.userId) {
        return res.json({ success: false, message: 'Cannot reset your own account.' });
    }

    try {
        await db.run('DELETE FROM user_progress WHERE user_id = ?', [targetId]);
        return res.json({ success: true, message: 'Progress reset successfully.' });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: 'Database error.' });
    }
});

// ── POST /admin/delete-user ────────────────────────────────────────────────
// Fully delete a user and all their data
router.post('/delete-user', async (req, res) => {
    const targetId = parseInt(req.body.userId);
    if (isNaN(targetId)) return res.json({ success: false, message: 'Invalid user ID' });

    if (targetId === req.session.userId) {
        return res.json({ success: false, message: 'Cannot delete your own account.' });
    }

    try {
        await db.run('DELETE FROM user_progress WHERE user_id = ?', [targetId]);
        await db.run('DELETE FROM users WHERE id = ?', [targetId]);
        return res.json({ success: true, message: 'User deleted.' });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: 'Database error.' });
    }
});

// ── POST /admin/mark-solved ────────────────────────────────────────────────
// Manually grant a solve to a user for a challenge
router.post('/mark-solved', async (req, res) => {
    const targetId = parseInt(req.body.userId);
    const challengeId = parseInt(req.body.challengeId);

    if (isNaN(targetId) || isNaN(challengeId) || challengeId < 1 || challengeId > TOTAL_CHALLENGES) {
        return res.json({ success: false, message: 'Invalid parameters.' });
    }

    try {
        const existing = await db.get(
            'SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?',
            [targetId, challengeId]
        );

        if (existing && existing.solved_at) {
            return res.json({ success: false, message: 'Already marked as solved.' });
        }

        const now = new Date().toISOString();
        if (existing) {
            await db.run(
                'UPDATE user_progress SET solved_at = ? WHERE user_id = ? AND challenge_id = ?',
                [now, targetId, challengeId]
            );
        } else {
            await db.run(
                'INSERT INTO user_progress (user_id, challenge_id, solved_at, hints_used) VALUES (?, ?, ?, ?)',
                [targetId, challengeId, now, 0]
            );
        }

        return res.json({ success: true, message: `Challenge ${getChallengeName(challengeId)} marked as solved.` });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: 'Database error.' });
    }
});

// ── POST /admin/reset-all ──────────────────────────────────────────────────
// Nuclear option: wipe ALL progress for ALL users
router.post('/reset-all', async (req, res) => {
    if (req.body.confirm !== 'RESET') {
        return res.json({ success: false, message: 'Confirmation string mismatch.' });
    }
    try {
        await db.run('DELETE FROM user_progress WHERE id > 0', []);
        return res.json({ success: true, message: 'All progress cleared. Platform reset.' });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: 'Database error.' });
    }
});

// ── POST /admin/delete-team ───────────────────────────────────────────────────
router.post('/delete-team', async (req, res) => {
    const teamId = parseInt(req.body.teamId);
    if (isNaN(teamId)) return res.json({ success: false, message: 'Invalid team ID.' });
    try {
        // Unlink all members first
        await db.run('UPDATE users SET team_id = NULL WHERE team_id = ?', [teamId]);
        await db.run('DELETE FROM teams WHERE id = ?', [teamId]);
        return res.json({ success: true, message: 'Team deleted. Members moved to solo.' });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: 'Database error.' });
    }
});

// ── GET /admin/event ───────────────────────────────────────────────────────
// Returns current event config as JSON (for admin panel tab)
router.get('/event', (req, res) => {
    try {
        const event = getEventState();
        res.json({ success: true, event });
    } catch (err) {
        res.json({ success: false, message: 'Could not load event config.' });
    }
});

// ── POST /admin/event/save ─────────────────────────────────────────────────
// Save event config from admin panel form
router.post('/event/save', (req, res) => {
    try {
        const { name, start, end, freeze } = req.body;

        // Basic validation
        const cfg = {
            name:   ((name || '').trim() || 'Aquila CTF').slice(0, 80), // Bug fix 8: fall back to default if blank
            start:  start  && start.trim()  ? new Date(start.trim()).toISOString()  : null,
            end:    end    && end.trim()    ? new Date(end.trim()).toISOString()    : null,
            freeze: freeze && freeze.trim() ? new Date(freeze.trim()).toISOString() : null,
        };

        // Validate parsed dates
        if (cfg.start  && isNaN(new Date(cfg.start).getTime()))  return res.json({ success: false, message: 'Invalid start date.' });
        if (cfg.end    && isNaN(new Date(cfg.end).getTime()))    return res.json({ success: false, message: 'Invalid end date.' });
        if (cfg.freeze && isNaN(new Date(cfg.freeze).getTime())) return res.json({ success: false, message: 'Invalid freeze date.' });

        if (cfg.start && cfg.end && new Date(cfg.start) >= new Date(cfg.end)) {
            return res.json({ success: false, message: 'Start time must be before end time.' });
        }
        if (cfg.freeze && cfg.end && new Date(cfg.freeze) >= new Date(cfg.end)) {
            return res.json({ success: false, message: 'Freeze time must be before end time.' });
        }
        if (cfg.freeze && cfg.start && new Date(cfg.freeze) <= new Date(cfg.start)) {
            return res.json({ success: false, message: 'Freeze time must be after start time.' });
        }

        saveConfig(cfg);
        const event = getEventState();
        return res.json({ success: true, message: 'Event config saved.', event });
    } catch (err) {
        console.error('[admin/event/save]', err);
        return res.json({ success: false, message: 'Failed to save: ' + err.message });
    }
});

// ── POST /admin/event/start-now ────────────────────────────────────────────
// Quick action: start event immediately (preserves existing end/freeze)
router.post('/event/start-now', (req, res) => {
    try {
        const cfg = loadConfig();
        cfg.start = new Date().toISOString();
        saveConfig(cfg);
        return res.json({ success: true, message: 'Event started now.', event: getEventState() });
    } catch (err) {
        return res.json({ success: false, message: err.message });
    }
});

// ── POST /admin/event/clear ────────────────────────────────────────────────
// Clear all timing — return to open/dev mode
router.post('/event/clear', (req, res) => {
    try {
        clearEventTiming();
        return res.json({ success: true, message: 'Event timing cleared. Platform is now in open mode.', event: getEventState() });
    } catch (err) {
        return res.json({ success: false, message: err.message });
    }
});

module.exports = router;