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

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_jwt_key';

router.use(requireAuth);

// Challenge 1: SQL Injection
router.get('/login', (req, res) => {
    res.render('login', { error: null });
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
            res.render('login', { error: null, success: 'Logged in! Flag: CTF{sqli_master_bypass_1337}' });
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    } catch (err) {
        res.render('login', { error: 'Database error: ' + err.message });
    }
});

// Challenge 2: XSS
router.get('/search', (req, res) => {
    const query = req.query.q || '';
    // Inject the flag into a non-HttpOnly cookie so XSS payloads can steal it
    res.cookie('secret_flag', 'CTF{xss_alert_popup_king}', { httpOnly: false });
    res.render('search', { query });
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
                flag = 'CTF{idor_profile_peeking_007}';
            }
            // Mocking isAdmin for the view since we only selected username
            const userView = { ...row, isAdmin: row.username === 'admin' };
            res.render('profile', { user: userView, flag });
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
    res.render('ping', { output: null });
});

router.post('/ping', (req, res) => {
    const ip = req.body.ip;
    
    // WAF Filter: Prevent directory traversal, wildcards, and reading sensitive files
    const wafRegex = /(\.\.|\\|\/|\*|\?|aquila|database|server|challenges|api|xxe|calc|ssrf|upload|json|js)/i;
    if (wafRegex.test(ip)) {
        return res.render('ping', { output: 'WAF ALERT: Malicious payload or access to restricted files detected and blocked.' });
    }

    // VULNERABLE: Direct concatenation
    // Use -c on Linux (Docker) and -n on Windows (local dev)
    const pingFlag = process.platform === 'win32' ? '-n' : '-c';
    const sandboxPath = path.join(__dirname, '../ping_sandbox');
    exec(`ping ${pingFlag} 1 ${ip}`, { timeout: 10000, cwd: sandboxPath }, (error, stdout, stderr) => {
        res.render('ping', { output: stdout || stderr });
    });
});

// Challenge 5: JWT Bypass
router.get('/vault', (req, res) => {
    // If no token, give a guest token
    if (!req.cookies.token) {
        const token = jwt.sign({ username: req.session.username || 'guest', role: 'guest' }, SECRET_KEY);
        res.cookie('token', token);
        return res.render('vault', { user: { username: req.session.username || 'guest', role: 'guest' }, flag: null });
    }

    const token = req.cookies.token;
    try {
        const decoded = jwt.decode(token, { complete: true });

        if (decoded && decoded.header.alg === 'none') {
            if (decoded.payload.role === 'admin') {
                return res.render('vault', { user: decoded.payload, flag: 'CTF{jwt_none_algo_master}' });
            }
        }

        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                const base64UrlHeader = token.split('.')[0];
                const header = JSON.parse(Buffer.from(base64UrlHeader, 'base64').toString());

                if (header.alg === 'none' || header.alg === 'NONE') {
                    const base64UrlPayload = token.split('.')[1];
                    const payload = JSON.parse(Buffer.from(base64UrlPayload, 'base64').toString());
                    if (payload.role === 'admin') {
                        return res.render('vault', { user: payload, flag: 'CTF{jwt_none_algo_master}' });
                    }
                    return res.render('vault', { user: payload, flag: null });
                }

                return res.render('vault', { user: { username: 'guest', role: 'guest' }, flag: null, error: 'Invalid Token Signature' });
            }

            if (user.role === 'admin') {
                res.render('vault', { user, flag: 'CTF{jwt_none_algo_master}' });
            } else {
                res.render('vault', { user, flag: null });
            }
        });
    } catch (e) {
        res.render('vault', { user: null, flag: null, error: 'Token Error' });
    }
});

// Challenge 6: Calculator (RCE via eval)
router.get('/calculator', (req, res) => {
    res.render('calculator', { title: 'Calculator - RCE Challenge', result: null });
});

const vm = require('vm');

router.post('/calculator', (req, res) => {
    const expression = req.body.expression;
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
                        return fs.readFileSync('flag_calc.txt', 'utf8');
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
    res.render('calculator', { title: 'Calculator - RCE Challenge', result: result });
});

// Challenge 7: CSRF (Settings Panel)
router.get('/csrf', (req, res) => {
    // Use session for settings in this challenge
    const settings = req.session.csrfSettings || { email: 'user@example.com', theme: 'dark' };
    res.render('csrf', { title: 'Settings Panel - CSRF Challenge', settings: settings, message: null });
});

router.all('/csrf/update', (req, res) => {
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
    
    // If it lacks a referer/origin, or they don't match the host, it's a successful CSRF!
    const isCsrf = (referer && !referer.includes(host)) || (origin && !origin.includes(host)) || (!referer && !origin);

    if (isCsrf) {
        return res.render('csrf', {
            title: 'Settings Panel - CSRF Challenge',
            settings: newSettings,
            message: 'Settings updated! Flag: CTF{csrf_token_bypass_ninja}'
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
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.get('/upload', (req, res) => {
    res.render('upload', { title: 'File Manager - Upload Challenge', message: null });
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
router.get('/uploads', (req, res) => {
    const files = fs.readdirSync(uploadDir);
    let html = '<h1>Uploaded Files</h1><ul>';
    files.forEach(file => {
        html += `<li><a href="/uploads/${file}">${file}</a></li>`;
    });
    html += '</ul><p>Flag: CTF{file_upload_shell_master}</p>';
    res.send(html);
});

// Challenge 9: XXE (XML Parser)
router.get('/xxe', (req, res) => {
    res.render('xxe', { title: 'XML Parser - XXE Challenge', result: null });
});

router.post('/xxe', (req, res) => {
    let xml = req.body.xml;

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
                // Handle file:/// prefix or direct paths
                let targetPath = entityPath.replace(/^file:\/\/\//, '');
                if (!path.isAbsolute(targetPath)) {
                    targetPath = path.resolve(__dirname, '..', targetPath);
                } else if (process.platform === 'win32' && targetPath.startsWith('app/')) {
                    // Fallback for paths written in Unix-style for Docker environments
                    targetPath = path.resolve(__dirname, '..', targetPath.replace('app/', ''));
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
    res.render('ssrf', { title: 'URL Fetcher - SSRF Challenge', content: null });
});

router.post('/ssrf', async (req, res) => {
    const url = req.body.url;

    try {
        // VULNERABLE: No URL validation, allows internal requests
        const response = await axios.get(url);
        res.render('ssrf', { title: 'URL Fetcher - SSRF Challenge', content: typeof response.data === 'object' ? JSON.stringify(response.data) : response.data });
    } catch (e) {
        res.render('ssrf', { title: 'URL Fetcher - SSRF Challenge', content: 'Error: ' + e.message });
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
