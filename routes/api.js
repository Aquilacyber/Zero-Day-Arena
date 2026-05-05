const express = require('express');
const router = express.Router();
const db = require('../database');
const { getChallengeName, getChallengeDifficulty, getChallengeSlug, TOTAL_CHALLENGES } = require('../config/challenges');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Flag Submission
router.post('/submit', async (req, res) => {
    const flag = req.body.flag;
    const userId = req.session.userId;

    try {
        const rows = await db.query('SELECT * FROM flags');
        let found = false;
        let challengeId = -1;
        let challengeName = '';

        for (const row of rows) {
            const decodedFlag = Buffer.from(row.flag, 'base64').toString('utf-8');
            if (decodedFlag.trim() === flag.trim()) {
                found = true;
                challengeId = row.challenge_id;
                challengeName = getChallengeName(challengeId);
                break;
            }
        }

        if (found) {
            // Check if already solved
            const progress = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?', [userId, challengeId]);

            if (!progress || !progress.solved_at) {
                if (!progress) {
                    // Insert progress with explicit timestamp (AlaSQL doesn't support CURRENT_TIMESTAMP)
                    await db.run('INSERT INTO user_progress (user_id, challenge_id, solved_at) VALUES (?, ?, ?)', [userId, challengeId, new Date().toISOString()]);
                } else {
                    // Update existing progress row (created by purchasing hints)
                    await db.run('UPDATE user_progress SET solved_at = ? WHERE user_id = ? AND challenge_id = ?', [new Date().toISOString(), userId, challengeId]);
                }

                // Calculate new score
                const solvedRows = await db.query('SELECT challenge_id FROM user_progress WHERE user_id = ? AND solved_at IS NOT NULL', [userId]);
                const solvedCount = solvedRows.length;

                // Calculate total penalty
                let totalPenalty = 0;
                const progressRows = await db.query('SELECT hints_used FROM user_progress WHERE user_id = ?', [userId]);
                progressRows.forEach(row => {
                    totalPenalty += (row.hints_used || 0) * 20;
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

// Hint System
router.post('/hint', async (req, res) => {
    const challengeId = parseInt(req.body.challengeId);
    const userId = req.session.userId;

    // Validate challengeId
    if (isNaN(challengeId) || challengeId < 1 || challengeId > TOTAL_CHALLENGES) {
        return res.json({ success: false, message: 'Invalid challenge ID' });
    }

    try {
        // Calculate current score to verify user can afford hint
        const allProgress = await db.query('SELECT * FROM user_progress WHERE user_id = ?', [userId]);
        const solvedCount = allProgress.filter(p => p.solved_at).length;
        let totalPenalty = 0;
        allProgress.forEach(p => {
            totalPenalty += (p.hints_used || 0) * 20;
        });
        const currentScore = Math.max(0, (solvedCount * 100) - totalPenalty);

        if (currentScore < 20) {
            return res.json({ success: false, message: 'Not enough points for a hint. You need at least 20 points.' });
        }

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

// Get previously purchased hints for a challenge
router.get('/hints/:challengeId', async (req, res) => {
    const challengeId = parseInt(req.params.challengeId);
    const userId = req.session.userId;

    if (isNaN(challengeId) || challengeId < 1 || challengeId > TOTAL_CHALLENGES) {
        return res.json({ hints: [] });
    }

    try {
        const progress = await db.get('SELECT hints_used FROM user_progress WHERE user_id = ? AND challenge_id = ?', [userId, challengeId]);
        const hintsUsed = progress ? (progress.hints_used || 0) : 0;

        if (hintsUsed === 0) {
            return res.json({ hints: [], hintsUsed: 0 });
        }

        // Fetch all hints up to the level the user has purchased
        const hints = await db.query('SELECT level, hint_text FROM hints WHERE challenge_id = ? AND level <= ? ORDER BY level ASC', [challengeId, hintsUsed]);

        return res.json({
            hints: hints.map(h => ({ level: h.level, hint: h.hint_text })),
            hintsUsed: hintsUsed,
            hintsRemaining: 3 - hintsUsed
        });
    } catch (err) {
        console.error(err);
        return res.json({ hints: [], hintsUsed: 0 });
    }
});

// Writeups
const writeups = require('../data/writeups');

router.get('/writeup/:id', async (req, res) => {
    const challengeId = parseInt(req.params.id);
    const userId = req.session.userId;

    // Validate challengeId
    if (isNaN(challengeId) || challengeId < 1 || challengeId > TOTAL_CHALLENGES) {
        return res.status(404).render('error', {
            statusCode: 404,
            title: 'Challenge Not Found',
            message: 'The challenge you are looking for does not exist.',
            icon: '🔍'
        });
    }

    try {
        // Check if user has solved the challenge (not just used hints)
        const progress = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?', [userId, challengeId]);

        if (!progress || !progress.solved_at) {
            return res.status(403).render('error', {
                statusCode: 403,
                title: 'Access Restricted',
                message: 'You must solve this challenge before you can view the writeup. Complete the challenge first, then come back.',
                icon: '🔒',
                challengeId: challengeId,
                challengeSlug: getChallengeSlug(challengeId),
                detail: `Challenge: ${getChallengeName(challengeId)}`
            });
        }

        const writeup = writeups[challengeId];

        if (!writeup) {
            return res.status(404).render('error', {
                statusCode: 404,
                title: 'Writeup Not Found',
                message: 'The writeup for this challenge has not been created yet.',
                icon: '📄'
            });
        }

        res.render('writeup', {
            challenge: {
                name: getChallengeName(challengeId),
                difficulty: getChallengeDifficulty(challengeId)
            },
            writeup: writeup
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            statusCode: 500,
            title: 'Server Error',
            message: 'Something went wrong on our end. Please try again later.',
            icon: '⚡'
        });
    }
});

// Export Progress
router.get('/export-progress', async (req, res) => {
    const userId = req.session.userId;

    try {
        const user = await db.get('SELECT username, created_at FROM users WHERE id = ?', [userId]);
        const progress = await db.query('SELECT * FROM user_progress WHERE user_id = ? AND solved_at IS NOT NULL', [userId]);

        const report = {
            user: user.username,
            joined: user.created_at,
            exported_at: new Date().toISOString(),
            total_solved: progress.length,
            challenges: progress.map(p => ({
                challenge: getChallengeName(p.challenge_id),
                solved_at: p.solved_at,
                hints_used: p.hints_used
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=aquila_report_${user.username}.json`);
        res.send(JSON.stringify(report, null, 2));
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            statusCode: 500,
            title: 'Export Failed',
            message: 'Could not generate your progress report. Please try again.',
            icon: '📊'
        });
    }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await db.query('SELECT id, username FROM users');

        const leaderboard = [];

        for (const user of users) {
            const progressRows = await db.query('SELECT * FROM user_progress WHERE user_id = ?', [user.id]);

            const solvedCount = progressRows.filter(p => p.solved_at).length;
            let totalPenalty = 0;
            progressRows.forEach(p => {
                totalPenalty += (p.hints_used || 0) * 20;
            });

            const score = Math.max(0, (solvedCount * 100) - totalPenalty);

            leaderboard.push({
                username: user.username,
                score: score,
                solved: solvedCount,
                hintsUsed: progressRows.reduce((sum, p) => sum + (p.hints_used || 0), 0)
            });
        }

        // Sort by score descending, then by solved count
        leaderboard.sort((a, b) => b.score - a.score || b.solved - a.solved);

        res.render('leaderboard', {
            title: 'Leaderboard - Aquila CTF',
            leaderboard: leaderboard,
            currentUser: req.session.username,
            totalChallenges: TOTAL_CHALLENGES
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            statusCode: 500,
            title: 'Server Error',
            message: 'Could not load the leaderboard. Please try again.',
            icon: '🏆'
        });
    }
});

module.exports = router;
