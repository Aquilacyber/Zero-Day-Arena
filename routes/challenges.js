const express = require('express');
const router = express.Router();
const db = require('../database');
const { exec } = require('child_process');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// libxmljs removed for cross-platform compatibility

// ─────────────────────────────────────────────────────────────
// Feature 3: Flag helper — single source of truth is the DB.
// Fetches the plaintext flag for a given challenge_id.
// ─────────────────────────────────────────────────────────────
async function getFlag(challengeId) {
    const row = await db.get('SELECT flag FROM flags WHERE challenge_id = ?', [challengeId]);
    if (!row) return null;
    return Buffer.from(row.flag, 'base64').toString('utf-8').trim();
}

// Inject session user info into every render so the nav partial has what it needs
function navCtx(req) {
    return {
        // Use 'navUser' not 'user' — some challenge views (vault, profile) pass
        // their own 'user' object. Spreading as 'user' would overwrite it and crash.
        navUser: req.session.username || '',
        isAdmin: req.session.isAdmin  || false,
        score:   0
    };
}

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_jwt_key';

router.use(requireAuth);

// Challenge 1: SQL Injection
router.get('/login', (req, res) => {
    res.render('login', { ...navCtx(req), error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // VULNERABLE QUERY - SQLite specific
    // Note: SQLite uses different syntax than MySQL/Postgres sometimes, but basic OR '1'='1 works
    const query = `SELECT * FROM idor_users WHERE username = '${username}' AND password = '${password}'`;

    try {
        // Using db.query (wrapper for db.all)
        const rows = await db.query(query);
        const row = rows[0];
        if (row) {
            const flag1 = await getFlag(1);
            res.render('login', { ...navCtx(req), error: null, success: `Logged in! Flag: ${flag1}` });
        } else {
            res.render('login', { ...navCtx(req), error: 'Invalid credentials' });
        }
    } catch (err) {
        res.render('login', { error: 'Database error: ' + err.message });
    }
});

// Challenge 2: XSS
router.get('/search', async (req, res) => {
    const query = req.query.q || '';
    // Inject the flag into a non-HttpOnly cookie so XSS payloads can steal it
    const flag2 = await getFlag(2);
    res.cookie('secret_flag', flag2, { httpOnly: false });
    res.render('search', { ...navCtx(req), query });
});

// Challenge 3: IDOR
router.get('/profile', async (req, res) => {
    // In the new auth system, we have a real user ID in session
    // But for the challenge, we simulate the vulnerability

    if (!req.query.id) {
        return res.redirect(`/challenge/profile?id=${req.session.userId}`);
    }
    const userId = parseInt(req.query.id, 10);

    try {
        // FIXED: Parameterized query to prevent SQLi, focusing the challenge purely on IDOR
        const row = await db.get('SELECT username FROM idor_users WHERE id = ?', [userId]);

        if (row) {
            let flag = null;
            if (row.username === 'admin') {
                flag = await getFlag(3);
            }
            // Mocking isAdmin for the view since we only selected username
            const userView = { ...row, isAdmin: row.username === 'admin' };
            res.render('profile', { ...navCtx(req),  user: userView, flag });
        } else {
            res.status(404).render('error', {
                statusCode: 404,
                title: 'User Not Found',
                message: 'The user profile you are looking for does not exist. Try a different ID.',
                icon: '👤'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            statusCode: 500,
            title: 'Database Error',
            message: 'An error occurred while fetching user data. Please try again.',
            icon: '🗄️'
        });
    }
});

// Challenge 4: Command Injection
router.get('/ping', (req, res) => {
    res.render('ping', { ...navCtx(req), output: null });
});

router.post('/ping', (req, res) => {
    const ip = (req.body.ip || '').trim();

    if (!ip) {
        return res.render('ping', { output: 'Error: No target provided.' });
    }

    // ── Intentional WAF (Challenge 4 design notes) ──────────────────────────
    // This WAF is deliberately weak — that IS the challenge.
    //
    // What it blocks:   path separators (/ \), traversal (..),
    //                   wildcards (* ?), and specific filenames that would
    //                   let players read OTHER challenge flags (out of scope).
    //
    // What it does NOT block (intentional bypasses players should discover):
    //   - Semicolons/pipes:  8.8.8.8; id
    //   - Backticks/subshell: 8.8.8.8`id`
    //   - $() subshell:     8.8.8.8 $(id)
    //   - Environment vars: 8.8.8.8; echo $PATH
    //   - Newlines (%0a):   8.8.8.8%0aid
    //
    // The flag (flag_ping.txt) lives in ping_sandbox/ which is set as cwd,
    // so players can read it with:  8.8.8.8; cat flag_ping.txt
    //
    // To make this a harder "WAF bypass" challenge, tighten the regex here.
    // To make it a clean CMDi with no WAF pretense, remove the regex entirely.
    // ────────────────────────────────────────────────────────────────────────
    const wafBlacklist = [
        /\.\./,              // directory traversal
        /[/\\]/,           // path separators
        /[*?]/,              // wildcards
        // Block filenames that belong to OTHER challenges (flag isolation)
        /aquila|database|server|challenges|api|xxe|calc|ssrf|upload/i,
        /\.json/i,
        /\.js/i,
    ];

    const isBlocked = wafBlacklist.some(rx => rx.test(ip));
    if (isBlocked) {
        return res.render('ping', {
            output: '[ WAF BLOCKED ] Restricted characters or filenames detected.\nHint: the WAF has gaps — think about what it does NOT check.'
        });
    }

    const pingFlag = process.platform === 'win32' ? '-n' : '-c';
    const sandboxPath = path.join(__dirname, '../ping_sandbox');

    exec(
        `ping ${pingFlag} 1 ${ip}`,
        { timeout: 10000, cwd: sandboxPath, shell: true },
        (error, stdout, stderr) => {
            res.render('ping', { output: stdout || stderr || error?.message || 'No output.' });
        }
    );
});

// Challenge 5: JWT Bypass
router.get('/vault', async (req, res) => {
    // If no token, give a guest token
    if (!req.cookies.token) {
        const token = jwt.sign({ username: req.session.username || 'guest', role: 'guest' }, SECRET_KEY);
        res.cookie('token', token);
        return res.render('vault', { ...navCtx(req),  user: { username: req.session.username || 'guest', role: 'guest' }, flag: null });
    }

    const token = req.cookies.token;
    try {
        const decoded = jwt.decode(token, { complete: true });

        if (decoded && decoded.header.alg === 'none') {
            if (decoded.payload.role === 'admin') {
                const flag5 = await getFlag(5); return res.render('vault', { ...navCtx(req),  user: decoded.payload, flag: flag5 });
            }
        }

        jwt.verify(token, SECRET_KEY, async (err, user) => {
            if (err) {
                const base64UrlHeader = token.split('.')[0];
                const header = JSON.parse(Buffer.from(base64UrlHeader, 'base64').toString());

                if (header.alg === 'none' || header.alg === 'NONE') {
                    const base64UrlPayload = token.split('.')[1];
                    const payload = JSON.parse(Buffer.from(base64UrlPayload, 'base64').toString());
                    if (payload.role === 'admin') {
                        return res.render('vault', { ...navCtx(req),  user: payload, flag: await getFlag(5) });
                    }
                    return res.render('vault', { ...navCtx(req),  user: payload, flag: null });
                }

                return res.render('vault', { ...navCtx(req),  user: { username: 'guest', role: 'guest' }, flag: null, error: 'Invalid Token Signature' });
            }

            if (user.role === 'admin') {
                res.render('vault', { ...navCtx(req),  user, flag: await getFlag(5) });
            } else {
                res.render('vault', { ...navCtx(req),  user, flag: null });
            }
        });
    } catch (e) {
        res.render('vault', { ...navCtx(req),  user: null, flag: null, error: 'Token Error' });
    }
});

// Challenge 6: Calculator (RCE via eval)
router.get('/calculator', (req, res) => {
    res.render('calculator', { ...navCtx(req), title: 'Calculator - RCE Challenge', result: null });
});

const vm = require('vm');

router.post('/calculator', (req, res) => {
    const expression = req.body.expression || '';
    let result;
    try {
        // VULNERABLE CONCEPT: Executing arbitrary string as code.
        // FIXED FOR CTF ISOLATION: We use a VM sandbox instead of raw eval() 
        // to prevent players from dumping the database or reading other flags.
        const sandbox = {
            require: (module) => {
                if (module === 'fs') return sandbox.fs;
                throw new Error('WAF Blocked: Module not allowed');
            },
            fs: {
                readFileSync: (file) => {
                    if (file === 'flag_calc.txt') {
                        // Bug fix 1: use __dirname-relative path so it works regardless of process.cwd()
                        return fs.readFileSync(path.join(__dirname, '..', 'flag_calc.txt'), 'utf8');
                    }
                    throw new Error('WAF Blocked: You only have permissions to read flag_calc.txt');
                }
            },
            Math: Math,
            parseInt: parseInt,
            parseFloat: parseFloat
        };
        
        const context = vm.createContext(sandbox);
        result = vm.runInContext(expression, context, { timeout: 1000 });
    } catch (e) {
        result = 'Error: ' + e.message;
    }
    res.render('calculator', { ...navCtx(req), title: 'Calculator - RCE Challenge', result: result });
});

// Challenge 7: CSRF (Settings Panel)
router.get('/csrf', (req, res) => {
    // Use session for settings in this challenge
    const settings = req.session.csrfSettings || { email: 'user@example.com', theme: 'dark' };
    res.render('csrf', { ...navCtx(req), title: 'Settings Panel - CSRF Challenge', settings: settings, message: null });
});

router.all('/csrf/update', async (req, res) => {
    // VULNERABLE: No CSRF token validation
    const newSettings = {
        email: req.body.email || req.query.email || 'user@example.com',
        theme: req.body.theme || req.query.theme || 'dark'
    };
    req.session.csrfSettings = newSettings;

    // Check if request is a cross-site request (CSRF attack)
    const referer = req.get('Referer') || '';
    const origin = req.get('Origin') || '';
    const host = req.get('host') || '';
    
    // Bug fix 6: correct CSRF detection.
    // Only flag as CSRF when an origin/referer is PRESENT but doesn't match our host.
    // No-referer/no-origin = browser privacy stripping (same-site), not a forgery.
    // True cross-site requests always include an Origin header in modern browsers.
    const isCsrf = (origin && !origin.includes(host)) || (!origin && referer && !referer.includes(host));

    if (isCsrf) {
        return res.render('csrf', {
            title: 'Settings Panel - CSRF Challenge',
            settings: newSettings,
            message: `Settings updated! Flag: ${await getFlag(7)}`
        });
    }

    res.render('csrf', { title: 'Settings Panel - CSRF Challenge', settings: newSettings, message: 'Settings updated successfully!' });
});

// Challenge 8: File Upload
const uploadDir = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Bug fix 2: strip path separators from originalname to prevent traversal
        // e.g. "../../etc/passwd" → "etc_passwd"
        const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});

// Bug fix 3: cap upload size at 5MB — prevents DoS via large file uploads
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/upload', (req, res) => {
    res.render('upload', { ...navCtx(req), title: 'File Manager - Upload Challenge', message: null });
});

router.post('/upload', upload.single('file'), (req, res) => {
    // VULNERABLE: No file type validation
    if (!req.file) {
        return res.render('upload', { title: 'File Manager - Upload Challenge', message: 'No file uploaded' });
    }

    res.render('upload', {
        title: 'File Manager - Upload Challenge',
        message: `File uploaded: ${req.file.filename}. Access the directory listing at /challenge/uploads to verify.`
    });
});

// Serve uploaded files with directory listing
router.get('/uploads', async (req, res) => {
    const files = fs.readdirSync(uploadDir);
    let html = '<h1>Uploaded Files</h1><ul>';
    files.forEach(file => {
        html += `<li><a href="/uploads/${file}">${file}</a></li>`;
    });
    const flag8 = await getFlag(8); html += `</ul><p>Flag: ${flag8}</p>`;
    res.send(html);
});

// Challenge 9: XXE (XML Parser)
router.get('/xxe', (req, res) => {
    res.render('xxe', { ...navCtx(req), title: 'XML Parser - XXE Challenge', result: null });
});

router.post('/xxe', (req, res) => {
    let xml = req.body.xml || '';

    try {
        if (!xml || typeof xml !== 'string') {
            throw new Error('Invalid XML payload.');
        }

        // --- PURE JS XXE EMULATOR ---
        // To avoid compiling libxmljs on Windows, we simulate the vulnerable parser.
        // It looks for DTD entities with SYSTEM paths and replaces &entity; in the payload.
        
        let resolvedXml = xml;
        
        // 1. Find all external entities defined in the DOCTYPE
        const entityRegex = /<!ENTITY\s+([a-zA-Z0-9_-]+)\s+SYSTEM\s+["']([^"']+)["']\s*>/g;
        let match;
        
        while ((match = entityRegex.exec(xml)) !== null) {
            const entityName = match[1];
            const entityPath = match[2];
            
            // Vulnerability: Resolving local file system path
            let fileContent = '';
            try {
                // Handle file:/// prefix or direct paths.
                // Bug fix: payloads are written as file:///app/flag_xxe.txt because
                // /app is the app root INSIDE the Docker container. Outside Docker
                // (local dev, tests) there is no /app, so we strip a leading "app/"
                // segment and always resolve relative to the actual project root
                // (__dirname/..) regardless of platform or whether the stripped
                // path looks absolute. This matches how flag_calc.txt is resolved.
                let targetPath = entityPath.replace(/^file:\/\/\//, '');
                targetPath = targetPath.replace(/^app\//, '');
                if (!path.isAbsolute(targetPath)) {
                    targetPath = path.resolve(__dirname, '..', targetPath);
                }
                
                if (fs.existsSync(targetPath)) {
                    fileContent = fs.readFileSync(targetPath, 'utf8');
                } else {
                    fileContent = `[File not found: ${targetPath}]`;
                }
            } catch (fsErr) {
                fileContent = `[Error reading file]`;
            }
            
            // 2. Expand the entity in the rest of the XML
            const entityRef = new RegExp(`&${entityName};`, 'g');
            resolvedXml = resolvedXml.replace(entityRef, fileContent);
        }

        // 3. Extract the <data> node
        const dataRegex = /<data>([\s\S]*?)<\/data>/;
        const dataMatch = dataRegex.exec(resolvedXml);
        
        const result = dataMatch ? dataMatch[1] : 'No data found';

        res.render('xxe', { title: 'XML Parser - XXE Challenge', result: result });
    } catch (e) {
        res.render('xxe', { title: 'XML Parser - XXE Challenge', result: 'Error: ' + e.message });
    }
});

// Challenge 10: SSRF (URL Fetcher)
router.get('/ssrf', (req, res) => {
    res.render('ssrf', { ...navCtx(req), title: 'URL Fetcher - SSRF Challenge', content: null });
});

router.post('/ssrf', async (req, res) => {
    const url = (req.body.url || '').trim();

    // Bug fix 5: guard against empty URL before making any request
    if (!url) {
        return res.render('ssrf', { title: 'URL Fetcher - SSRF Challenge', content: 'Error: No URL provided.' });
    }

    try {
        // VULNERABLE: No URL validation, allows internal requests — that IS the challenge.
        // Bug fix 4: add timeout so a slow/hung target can't freeze the server indefinitely
        const response = await axios.get(url, {
            timeout: 8000,
            maxRedirects: 5,
            // Return response even on non-2xx so error pages are shown to the player
            validateStatus: () => true
        });
        const body = typeof response.data === 'object'
            ? JSON.stringify(response.data, null, 2)
            : String(response.data);
        res.render('ssrf', { title: 'URL Fetcher - SSRF Challenge', content: body });
    } catch (e) {
        const msg = e.code === 'ECONNABORTED' ? 'Request timed out.' : e.message;
        res.render('ssrf', { title: 'URL Fetcher - SSRF Challenge', content: 'Error: ' + msg });
    }
});

// Challenge 11-13: Phantom Insider (OSINT Lab)
router.get('/phantom-insider', async (req, res) => {
    const userId = req.session.userId;
    try {
        const progress11 = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = 11', [userId]);
        const progress12 = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = 12', [userId]);
        const progress13 = await db.get('SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = 13', [userId]);

        const subFlags = [
            { id: 11, label: 'Identity Resolution', solved: !!(progress11 && progress11.solved_at) },
            { id: 12, label: 'Geo-Location Intel', solved: !!(progress12 && progress12.solved_at) },
            { id: 13, label: 'Data Decryption', solved: !!(progress13 && progress13.solved_at) }
        ];

        res.render('phantom-insider', { subFlags });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            statusCode: 500,
            title: 'Server Error',
            message: 'Could not load the Phantom Insider lab.',
            icon: '👻'
        });
    }
});

module.exports = router;