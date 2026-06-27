#!/usr/bin/env node
// ============================================================
// scripts/create-admin.js
// ============================================================
// Creates (or resets the password of) the admin user.
// Run this once before your first event, or any time you get
// locked out.
//
// Usage:
//   node scripts/create-admin.js <password>
//   node scripts/create-admin.js              (prompts for password)
//
// Docker:
//   docker exec -it aquila-ctf-dev node scripts/create-admin.js <password>
// ============================================================

const path   = require('path');
const bcrypt = require('bcryptjs');

// Load .env if present (same as server does)
try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {}

const db = require('../database');

async function main() {
    // ── Get password ─────────────────────────────────────────
    let password = process.argv[2];

    if (!password) {
        // Interactive prompt fallback
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        password = await new Promise(resolve => {
            rl.question('Enter admin password: ', ans => { rl.close(); resolve(ans.trim()); });
        });
    }

    if (!password || password.length < 6) {
        console.error('❌  Password must be at least 6 characters.');
        process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);
    const now  = new Date().toISOString();

    // Wait for DB to initialise
    await new Promise(r => setTimeout(r, 600));

    const existing = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);

    if (existing) {
        await db.run('UPDATE users SET password = ? WHERE username = ?', [hash, 'admin']);
        console.log('✅  Admin password updated. Login at /auth/login with username: admin');
    } else {
        await db.run(
            'INSERT INTO users (username, password, created_at, team_id) VALUES (?, ?, ?, ?)',
            ['admin', hash, now, null]
        );
        console.log('✅  Admin user created. Login at /auth/login with username: admin');
    }

    console.log('   Password: ' + '*'.repeat(password.length) + ' (set as provided)');
    process.exit(0);
}

main().catch(err => {
    console.error('❌  Error:', err.message);
    process.exit(1);
});