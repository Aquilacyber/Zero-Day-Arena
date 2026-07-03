// ============================================================
// lib/score.js — Single source of truth for score calculation.
// ============================================================
// Previously this logic was duplicated inline in server.js
// (dashboard route) and routes/api.js, and NOT available to
// routes/challenges.js or routes/admin.js at all — which is why
// every challenge page, the admin panel, the leaderboard, the
// uploads page, and the writeup page rendered the nav sidebar
// with a hardcoded "0 pts" regardless of the player's real score.
//
// Any route that needs a user's current score should import
// calcUserScore() from here instead of recomputing it.
// ============================================================

const db = require('../database');

/**
 * Calculate a user's current score: (solved * 100) - (hints_used * 20),
 * floored at 0.
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function calcUserScore(userId) {
    if (!userId) return 0;
    const rows = await db.query(
        'SELECT solved_at, hints_used FROM user_progress WHERE user_id = ?',
        [userId]
    );
    const solved  = rows.filter(r => r.solved_at).length;
    const penalty = rows.reduce((s, r) => s + (r.hints_used || 0) * 20, 0);
    return Math.max(0, solved * 100 - penalty);
}

/**
 * Count how many challenges a user has solved.
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function calcUserSolvedCount(userId) {
    if (!userId) return 0;
    const rows = await db.query(
        'SELECT id FROM user_progress WHERE user_id = ? AND solved_at IS NOT NULL',
        [userId]
    );
    return rows.length;
}

module.exports = { calcUserScore, calcUserSolvedCount };
