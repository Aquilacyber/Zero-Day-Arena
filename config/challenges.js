/**
 * Shared challenge metadata for the Aquila CTF platform.
 * Single source of truth for challenge names, difficulties, types,
 * descriptions, and URL slugs.
 */

const CHALLENGES = {
    1: {
        name: 'Login Bypass',
        type: 'SQL Injection',
        difficulty: 'Easy',
        description: 'A poorly secured authentication system awaits exploitation.',
        slug: 'login'
    },
    2: {
        name: 'Search Bar',
        type: 'Reflected XSS',
        difficulty: 'Easy',
        description: 'User input is reflected without proper sanitization.',
        slug: 'search'
    },
    3: {
        name: 'User Profile',
        type: 'IDOR',
        difficulty: 'Medium',
        description: 'Access control flaws allow unauthorized data access.',
        slug: 'profile'
    },
    4: {
        name: 'Ping Tool',
        type: 'Command Injection',
        difficulty: 'Medium',
        description: 'System commands are executed without validation.',
        slug: 'ping'
    },
    5: {
        name: 'Secret Vault',
        type: 'JWT Bypass',
        difficulty: 'Hard',
        description: 'Cryptographic tokens protect sensitive resources.',
        slug: 'vault'
    },
    6: {
        name: 'Calculator',
        type: 'Remote Code Execution',
        difficulty: 'Hard',
        description: 'Dangerous code evaluation exposes the system.',
        slug: 'calculator'
    },
    7: {
        name: 'Settings Panel',
        type: 'CSRF',
        difficulty: 'Medium',
        description: 'State-changing operations lack proper protection.',
        slug: 'csrf'
    },
    8: {
        name: 'File Manager',
        type: 'File Upload',
        difficulty: 'Easy',
        description: 'Unrestricted file uploads create security risks.',
        slug: 'upload'
    },
    9: {
        name: 'XML Parser',
        type: 'XXE',
        difficulty: 'Hard',
        description: 'XML processing reveals internal system data.',
        slug: 'xxe'
    },
    10: {
        name: 'URL Fetcher',
        type: 'SSRF',
        difficulty: 'Medium',
        description: 'Server-side requests can be manipulated.',
        slug: 'ssrf'
    },
    // Phantom Insider — OSINT Lab (3 sub-flags, grouped as one challenge)
    11: {
        name: 'Phantom Insider',
        type: 'OSINT',
        difficulty: 'Hard',
        description: 'Investigate a corporate insider threat. Uncover the suspect\'s identity from digital evidence.',
        slug: 'phantom-insider',
        group: 'phantom-insider',
        subFlag: 1,
        subLabel: 'Identity Resolution'
    },
    12: {
        name: 'Phantom Insider',
        type: 'OSINT',
        difficulty: 'Hard',
        description: 'Extract hidden intelligence from recovered media files.',
        slug: 'phantom-insider',
        group: 'phantom-insider',
        subFlag: 2,
        subLabel: 'Geo-Location Intel'
    },
    13: {
        name: 'Phantom Insider',
        type: 'OSINT',
        difficulty: 'Hard',
        description: 'Crack credentials and decrypt the stolen data archive.',
        slug: 'phantom-insider',
        group: 'phantom-insider',
        subFlag: 3,
        subLabel: 'Data Decryption'
    }
};

const TOTAL_CHALLENGES = Object.keys(CHALLENGES).length;

/**
 * Build the challenge card list for the dashboard view.
 * Groups multi-flag challenges (like Phantom Insider) into a single card.
 * @param {number[]} solved - Array of solved challenge IDs.
 * @returns {Object[]} Array of challenge card objects.
 */
function buildChallengeCards(solved) {
    const cards = [];
    const grouped = {};

    Object.entries(CHALLENGES).forEach(([id, ch]) => {
        const numId = parseInt(id);
        if (ch.group) {
            // Grouped challenge (multi-flag)
            if (!grouped[ch.group]) {
                grouped[ch.group] = {
                    id: numId,
                    name: ch.name,
                    type: ch.type,
                    difficulty: ch.difficulty,
                    description: ch.description,
                    slug: ch.slug,
                    isGrouped: true,
                    subFlags: [],
                    subIds: []
                };
            }
            grouped[ch.group].subFlags.push({
                id: numId,
                label: ch.subLabel,
                solved: solved.includes(numId)
            });
            grouped[ch.group].subIds.push(numId);
        } else {
            // Standard single-flag challenge
            cards.push({
                id: numId,
                name: ch.name,
                type: ch.type,
                difficulty: ch.difficulty,
                description: ch.description,
                slug: ch.slug,
                status: solved.includes(numId) ? 'Solved' : 'Locked'
            });
        }
    });

    // Add grouped challenges as single cards
    Object.values(grouped).forEach(g => {
        const solvedCount = g.subFlags.filter(f => f.solved).length;
        const totalCount = g.subFlags.length;
        g.status = solvedCount === totalCount ? 'Solved' : (solvedCount > 0 ? 'Partial' : 'Locked');
        g.solvedCount = solvedCount;
        g.totalCount = totalCount;
        cards.push(g);
    });

    return cards;
}

/**
 * Get the display name for a challenge by ID.
 * @param {number} id - Challenge ID.
 * @returns {string} Challenge name or 'Unknown Challenge'.
 */
function getChallengeName(id) {
    return CHALLENGES[id]?.name || 'Unknown Challenge';
}

/**
 * Get the difficulty for a challenge by ID.
 * @param {number} id - Challenge ID.
 * @returns {string} Difficulty level.
 */
function getChallengeDifficulty(id) {
    return CHALLENGES[id]?.difficulty || 'Unknown';
}

/**
 * Get the slug for a challenge by ID.
 * @param {number} id - Challenge ID.
 * @returns {string} Challenge slug or ''.
 */
function getChallengeSlug(id) {
    return CHALLENGES[id]?.slug || '';
}

module.exports = {
    CHALLENGES,
    TOTAL_CHALLENGES,
    buildChallengeCards,
    getChallengeName,
    getChallengeDifficulty,
    getChallengeSlug
};
