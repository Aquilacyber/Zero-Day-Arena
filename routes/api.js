const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const db = require('../database');
const {
    getChallengeName,
    getChallengeDifficulty,
    getChallengeSlug,
    TOTAL_CHALLENGES
} = require('../config/challenges');
const { requireAuth } = require('../middleware/auth');
const { getEventState } = require('../config/event');

router.use(requireAuth);

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiters
// ─────────────────────────────────────────────────────────────────────────────
const submitLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.session?.userId ? `user_${req.session.userId}` : ipKeyGenerator(req),
    handler: (req, res) => res.status(429).json({ success: false, message: 'Too many flag attempts — rate limited for 5 minutes.' }),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

const hintLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => req.session?.userId ? `user_${req.session.userId}` : ipKeyGenerator(req),
    handler: (req, res) => res.status(429).json({ success: false, message: 'Too many hint requests — wait a few minutes.' }),
    standardHeaders: true,
    legacyHeaders: false
});

// ─────────────────────────────────────────────────────────────────────────────
// Flag map cache — built once on first submission.
// Bug fix 6: bustFlagCache() exported so admin routes can force a rebuild.
// ─────────────────────────────────────────────────────────────────────────────
let _flagMapCache = null;
async function buildFlagMap() {
    if (_flagMapCache) return _flagMapCache;
    const rows = await db.query('SELECT challenge_id, flag FROM flags');
    const map  = new Map();
    for (const row of rows) {
        const plain = Buffer.from(row.flag, 'base64').toString('utf-8').trim();
        map.set(plain, row.challenge_id);
    }
    _flagMapCache = map;
    return map;
}
function bustFlagCache() { _flagMapCache = null; }

// ─────────────────────────────────────────────────────────────────────────────
// Score helpers
// ─────────────────────────────────────────────────────────────────────────────
async function calcUserScore(userId) {
    const rows = await db.query('SELECT solved_at, hints_used FROM user_progress WHERE user_id = ?', [userId]);
    const solved  = rows.filter(r => r.solved_at).length;
    const penalty = rows.reduce((s, r) => s + (r.hints_used || 0) * 20, 0);
    return Math.max(0, solved * 100 - penalty);
}

async function calcTeamScore(teamId) {
    if (!teamId) return 0;
    const members = await db.query('SELECT id FROM users WHERE team_id = ?', [teamId]);
    if (!members.length) return 0;
    const memberIds = members.map(m => m.id);

    // Collect all unique challenge solves across team members
    const allProgress = await db.query('SELECT user_id, challenge_id, solved_at, hints_used FROM user_progress');
    const teamProgress = allProgress.filter(p => memberIds.includes(p.user_id));

    // De-duplicate: one solve per challenge for the team (earliest solve counts)
    const solvedChallenges = new Map();
    for (const p of teamProgress) {
        if (!p.solved_at) continue;
        const existing = solvedChallenges.get(p.challenge_id);
        if (!existing || p.solved_at < existing.solved_at) {
            solvedChallenges.set(p.challenge_id, p);
        }
    }

    const penalty = teamProgress.reduce((s, p) => s + (p.hints_used || 0) * 20, 0);
    return Math.max(0, solvedChallenges.size * 100 - penalty);
}

// ─────────────────────────────────────────────────────────────────────────────
// First-blood helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if this is the very first solve for the challenge globally */
async function isFirstBlood(challengeId) {
    const existing = await db.query(
        'SELECT id FROM user_progress WHERE challenge_id = ? AND solved_at IS NOT NULL',
        [challengeId]
    );
    // Only first blood if no one else has solved it yet (current solve not yet committed)
    return existing.length === 0;
}

/** Record a first-blood event for the notification queue */
async function recordFirstBlood(challengeId, userId, teamId) {
    await db.run(
        'INSERT INTO first_blood (challenge_id, user_id, team_id, solved_at, delivered) VALUES (?, ?, ?, ?, ?)',
        [challengeId, userId, teamId || null, new Date().toISOString(), 0]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /submit — Flag submission with team credit + first-blood
// ─────────────────────────────────────────────────────────────────────────────
router.post('/submit', submitLimiter, async (req, res) => {
    const flag   = (req.body.flag || '').trim();
    const userId = req.session.userId;

    // Bug fix 9: always read team_id fresh from DB — session.teamId may be stale
    // if admin deleted the team while the user was logged in.
    const userRow = await db.get('SELECT team_id FROM users WHERE id = ?', [userId]);
    const teamId  = userRow?.team_id || null;
    // Sync session so dashboard shows correct state on next load
    if (req.session.teamId !== teamId) req.session.teamId = teamId;

    if (!flag) return res.json({ success: false, message: 'No flag provided.' });

    const event = getEventState();
    if (!event.submissionsOpen && event.isEnded)
        return res.json({ success: false, message: 'The CTF event has ended. Flag submissions are closed.' });
    if (!event.submissionsOpen && !event.isEnded)
        return res.json({ success: false, message: 'The CTF event has not started yet.' });

    try {
        const flagMap     = await buildFlagMap();
        const challengeId = flagMap.get(flag);
        if (!challengeId) return res.json({ success: false, message: 'Invalid flag.' });

        // Check if this user already solved it
        const progress = await db.get(
            'SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?',
            [userId, challengeId]
        );
        if (progress?.solved_at)
            return res.json({ success: false, message: 'Flag already submitted.' });

        // Bug fix 3: batch teammate-solve check — one query not N queries
        if (teamId) {
            const members = await db.query('SELECT id FROM users WHERE team_id = ?', [teamId]);
            const teammateIds = members.map(m => m.id).filter(id => id !== userId && id != null);
            if (teammateIds.length > 0) {
                // Bug fix: must select user_id, not just id — the dupe check below
                // reads p.user_id, which was previously always undefined (always false).
                const teamProgress = await db.query(
                    'SELECT id, user_id FROM user_progress WHERE challenge_id = ? AND solved_at IS NOT NULL',
                    [challengeId]
                );
                const solvedByTeammate = teamProgress.some(p => teammateIds.includes(p.user_id));
                if (solvedByTeammate) {
                    return res.json({
                        success: false,
                        message: 'Your team already solved this challenge — score already credited.'
                    });
                }
            }
        }

        // First-blood check BEFORE committing the solve
        const firstBlood = await isFirstBlood(challengeId);

        const now = new Date().toISOString();
        if (progress) {
            await db.run(
                'UPDATE user_progress SET solved_at = ? WHERE user_id = ? AND challenge_id = ?',
                [now, userId, challengeId]
            );
        } else {
            await db.run(
                'INSERT INTO user_progress (user_id, challenge_id, solved_at, hints_used) VALUES (?, ?, ?, ?)',
                [userId, challengeId, now, 0]
            );
        }

        if (firstBlood) await recordFirstBlood(challengeId, userId, teamId);

        const newScore = await calcUserScore(userId);

        // Bug fix 2: avoid redundant full-table scan in calcTeamScore after submit.
        // Instead, fetch team member ids + their progress in two targeted queries.
        let newTeamScore = null;
        if (teamId) {
            const tmembers = await db.query('SELECT id FROM users WHERE team_id = ?', [teamId]);
            const tmemberIds = tmembers.map(m => m.id).filter(id => id != null);
            if (tmemberIds.length > 0) {
                const tprogress = await db.query('SELECT user_id, challenge_id, solved_at, hints_used FROM user_progress');
                const tRows = tprogress.filter(p => tmemberIds.includes(p.user_id));
                const tUnique = new Map();
                for (const p of tRows) {
                    if (!p.solved_at) continue;
                    const ex = tUnique.get(p.challenge_id);
                    if (!ex || p.solved_at < ex.solved_at) tUnique.set(p.challenge_id, p);
                }
                const tPenalty = tRows.reduce((s, p) => s + (p.hints_used || 0) * 20, 0);
                newTeamScore = Math.max(0, tUnique.size * 100 - tPenalty);
            }
        }
        const challengeName = getChallengeName(challengeId);

        return res.json({
            success: true,
            message: `${challengeName} completed!`,
            newScore,
            newTeamScore,
            challengeId,
            challengeName,
            firstBlood
        });
    } catch (err) {
        console.error('[submit]', err);
        return res.json({ success: false, message: 'Server error.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /notifications — First-blood polling endpoint
// Dashboard polls this every 30s. Returns undelivered first-blood events,
// marks them delivered so they don't repeat.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/notifications', async (req, res) => {
    try {
        const undelivered = await db.query(
            'SELECT * FROM first_blood WHERE delivered = ?', [0]
        );

        if (undelivered.length === 0) return res.json({ notifications: [] });

        // Mark all as delivered
        for (const fb of undelivered) {
            await db.run('UPDATE first_blood SET delivered = 1 WHERE id = ?', [fb.id]);
        }

        // Hydrate with username and team name
        const notifications = [];
        for (const fb of undelivered) {
            const user = await db.get('SELECT username FROM users WHERE id = ?', [fb.user_id]);
            let teamName = null;
            if (fb.team_id) {
                const team = await db.get('SELECT name FROM teams WHERE id = ?', [fb.team_id]);
                teamName = team?.name || null;
            }
            notifications.push({
                challengeId:   fb.challenge_id,
                challengeName: getChallengeName(fb.challenge_id),
                username:      user?.username || 'Unknown',
                teamName,
                solvedAt:      fb.solved_at,
            });
        }

        return res.json({ notifications });
    } catch (err) {
        console.error('[notifications]', err);
        return res.json({ notifications: [] });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /hint
// ─────────────────────────────────────────────────────────────────────────────
router.post('/hint', hintLimiter, async (req, res) => {
    const challengeId = parseInt(req.body.challengeId);
    const userId      = req.session.userId;

    if (isNaN(challengeId) || challengeId < 1 || challengeId > TOTAL_CHALLENGES)
        return res.json({ success: false, message: 'Invalid challenge ID.' });

    try {
        const currentScore = await calcUserScore(userId);
        if (currentScore < 20)
            return res.json({ success: false, message: 'Not enough points for a hint. You need at least 20 points.' });

        const progress = await db.get(
            'SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?',
            [userId, challengeId]
        );
        const currentHintsUsed = progress?.hints_used || 0;
        const nextLevel = currentHintsUsed + 1;

        if (nextLevel > 3)
            return res.json({ success: false, message: 'No more hints available for this challenge.' });

        const hint = await db.get(
            'SELECT hint_text FROM hints WHERE challenge_id = ? AND level = ?',
            [challengeId, nextLevel]
        );
        if (!hint) return res.json({ success: false, message: 'Hint not found.' });

        if (progress) {
            await db.run(
                'UPDATE user_progress SET hints_used = ? WHERE user_id = ? AND challenge_id = ?',
                [nextLevel, userId, challengeId]
            );
        } else {
            await db.run(
                'INSERT INTO user_progress (user_id, challenge_id, hints_used) VALUES (?, ?, ?)',
                [userId, challengeId, nextLevel]
            );
        }

        return res.json({
            success: true,
            hint: hint.hint_text,
            level: nextLevel,
            penalty: 20,
            hintsRemaining: 3 - nextLevel
        });
    } catch (err) {
        console.error('[hint]', err);
        return res.json({ success: false, message: 'Server error.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /hints/:challengeId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/hints/:challengeId', async (req, res) => {
    const challengeId = parseInt(req.params.challengeId);
    const userId      = req.session.userId;
    if (isNaN(challengeId) || challengeId < 1 || challengeId > TOTAL_CHALLENGES)
        return res.json({ hints: [], hintsUsed: 0 });

    try {
        const progress = await db.get(
            'SELECT hints_used FROM user_progress WHERE user_id = ? AND challenge_id = ?',
            [userId, challengeId]
        );
        const hintsUsed = progress?.hints_used || 0;
        if (hintsUsed === 0) return res.json({ hints: [], hintsUsed: 0 });

        const hints = await db.query(
            'SELECT level, hint_text FROM hints WHERE challenge_id = ? AND level <= ? ORDER BY level ASC',
            [challengeId, hintsUsed]
        );
        return res.json({
            hints: hints.map(h => ({ level: h.level, hint: h.hint_text })),
            hintsUsed,
            hintsRemaining: 3 - hintsUsed
        });
    } catch (err) {
        console.error('[hints get]', err);
        return res.json({ hints: [], hintsUsed: 0 });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /writeup/:id
// ─────────────────────────────────────────────────────────────────────────────
const writeups = require('../data/writeups');

router.get('/writeup/:id', async (req, res) => {
    const challengeId = parseInt(req.params.id);
    const userId      = req.session.userId;
    if (isNaN(challengeId) || challengeId < 1 || challengeId > TOTAL_CHALLENGES)
        return res.status(404).render('error', { statusCode: 404, title: 'Challenge Not Found', message: 'Does not exist.', icon: '🔍' });

    try {
        const progress = await db.get(
            'SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?',
            [userId, challengeId]
        );
        if (!progress?.solved_at)
            return res.status(403).render('error', {
                statusCode: 403, title: 'Access Restricted',
                message: 'Solve this challenge first.', icon: '🔒',
                challengeId, challengeSlug: getChallengeSlug(challengeId),
                detail: `Challenge: ${getChallengeName(challengeId)}`
            });

        const writeup = writeups[challengeId];
        if (!writeup)
            return res.status(404).render('error', { statusCode: 404, title: 'Writeup Not Found', message: 'Not created yet.', icon: '📄' });

        res.render('writeup', {
            challenge: { name: getChallengeName(challengeId), difficulty: getChallengeDifficulty(challengeId) },
            writeup,
            user:    req.session.username || '',
            isAdmin: req.session.isAdmin  || false
        });
    } catch (err) {
        console.error('[writeup]', err);
        res.status(500).render('error', { statusCode: 500, title: 'Server Error', message: 'Try again.', icon: '⚡' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /export-progress
// ─────────────────────────────────────────────────────────────────────────────
router.get('/export-progress', async (req, res) => {
    const userId = req.session.userId;
    try {
        const user     = await db.get('SELECT username, created_at FROM users WHERE id = ?', [userId]);
        const progress = await db.query('SELECT * FROM user_progress WHERE user_id = ? AND solved_at IS NOT NULL', [userId]);
        const report   = {
            user: user.username, joined: user.created_at,
            exported_at: new Date().toISOString(), total_solved: progress.length,
            challenges: progress.map(p => ({
                challenge: getChallengeName(p.challenge_id),
                solved_at: p.solved_at, hints_used: p.hints_used
            }))
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=aquila_report_${user.username}.json`);
        res.send(JSON.stringify(report, null, 2));
    } catch (err) {
        console.error('[export]', err);
        res.status(500).render('error', { statusCode: 500, title: 'Export Failed', message: 'Could not generate report.', icon: '📊' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /leaderboard — Individual + Team views with freeze support
// ─────────────────────────────────────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
    const viewMode = req.query.view === 'teams' ? 'teams' : 'individual';

    try {
        const event       = getEventState();
        const allUsers    = await db.query('SELECT id, username, team_id FROM users');
        const allProgress = await db.query('SELECT user_id, challenge_id, solved_at, hints_used FROM user_progress');
        const allTeams    = await db.query('SELECT id, name, code, captain_id FROM teams');

        const freezeIso = (event.isFrozen && event.freezeMs)
            ? new Date(event.freezeMs).toISOString() : null;

        // Group progress by user
        const progressByUser = {};
        for (const row of allProgress) {
            if (!progressByUser[row.user_id]) progressByUser[row.user_id] = [];
            progressByUser[row.user_id].push(row);
        }

        // ── Individual leaderboard ─────────────────────────────
        const individualBoard = allUsers.map(user => {
            const rows = progressByUser[user.id] || [];
            const scored = freezeIso
                ? rows.filter(r => r.solved_at && r.solved_at <= freezeIso)
                : rows.filter(r => r.solved_at);
            const penalty   = rows.reduce((s, r) => s + (r.hints_used || 0) * 20, 0);
            const hintsUsed = rows.reduce((s, r) => s + (r.hints_used || 0), 0);
            const team = allTeams.find(t => t.id === user.team_id);
            return {
                username:  user.username,
                teamName:  team?.name || null,
                score:     Math.max(0, scored.length * 100 - penalty),
                solved:    scored.length,
                hintsUsed,
            };
        }).sort((a, b) => b.score - a.score || b.solved - a.solved);

        // ── Team leaderboard ────────────────────────────────────
        const teamBoard = allTeams.map(team => {
            const members = allUsers.filter(u => u.team_id === team.id);
            const memberIds = members.map(m => m.id);

            // All progress rows for team members
            const teamRows = allProgress.filter(p => memberIds.includes(p.user_id));

            // De-duplicate solves: one per challenge (earliest by member)
            const uniqueSolves = new Map();
            for (const p of teamRows) {
                if (!p.solved_at) continue;
                if (freezeIso && p.solved_at > freezeIso) continue;
                const ex = uniqueSolves.get(p.challenge_id);
                if (!ex || p.solved_at < ex.solved_at) uniqueSolves.set(p.challenge_id, p);
            }

            const penalty   = teamRows.reduce((s, p) => s + (p.hints_used || 0) * 20, 0);
            const hintsUsed = teamRows.reduce((s, p) => s + (p.hints_used || 0), 0);
            const captain   = allUsers.find(u => u.id === team.captain_id);

            return {
                teamName:    team.name,
                teamCode:    team.code,
                captain:     captain?.username || '—',
                memberCount: members.length,
                score:       Math.max(0, uniqueSolves.size * 100 - penalty),
                solved:      uniqueSolves.size,
                hintsUsed,
            };
        }).sort((a, b) => b.score - a.score || b.solved - a.solved);

        res.render('leaderboard', {
            title:         `Leaderboard — ${event.name}`,
            individualBoard,
            teamBoard,
            viewMode,
            currentUser:   req.session.username,
            currentTeamId: req.session.teamId || null,
            totalChallenges: TOTAL_CHALLENGES,
            hasTeams:      allTeams.length > 0,
            event,
            user:    req.session.username || '',
            isAdmin: req.session.isAdmin  || false
        });
    } catch (err) {
        console.error('[leaderboard]', err);
        res.status(500).render('error', { statusCode: 500, title: 'Server Error', message: 'Could not load leaderboard.', icon: '🏆' });
    }
});

module.exports = router;
module.exports.bustFlagCache = bustFlagCache;