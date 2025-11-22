const express = require('express');
const router = express.Router();
const db = require('../database');
const { exec } = require('child_process');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SECRET_KEY = 'super_secret_session_key'; // Using session key for consistency

// Middleware to check auth
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    next();
};

router.use(requireAuth);

// Challenge 1: SQL Injection
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // VULNERABLE QUERY - SQLite specific
    // Note: SQLite uses different syntax than MySQL/Postgres sometimes, but basic OR '1'='1 works
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

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
    res.render('search', { query });
});

// Challenge 3: IDOR
router.get('/profile', async (req, res) => {
    // In the new auth system, we have a real user ID in session
    // But for the challenge, we simulate the vulnerability

    // Default to current user if no ID provided, but allow ID parameter for IDOR
    const userId = req.query.id || req.session.userId;

    try {
        // VULNERABLE: No check if the requested ID matches the logged-in user
        const row = await db.get(`SELECT username FROM users WHERE id = ${userId}`);

        if (row) {
            let flag = null;
            if (row.username === 'admin') {
                flag = 'CTF{idor_profile_peeking_007}';
            }
            // Mocking isAdmin for the view since we only selected username
            const userView = { ...row, isAdmin: row.username === 'admin' };
            res.render('profile', { user: userView, flag });
        } else {
            res.send('User not found');
        }
    } catch (err) {
        res.send('Database error: ' + err.message);
    }
});

// Challenge 4: Command Injection
router.get('/ping', (req, res) => {
    res.render('ping', { output: null });
});

router.post('/ping', (req, res) => {
    const ip = req.body.ip;
    // VULNERABLE: Direct concatenation
    exec(`ping -n 1 ${ip}`, (error, stdout, stderr) => {
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

router.post('/calculator', (req, res) => {
    const expression = req.body.expression;
    let result;
    try {
        // VULNERABLE: Using eval() - allows arbitrary code execution
        result = eval(expression);
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

router.post('/csrf/update', (req, res) => {
    // VULNERABLE: No CSRF token validation
    const newSettings = {
        email: req.body.email || 'user@example.com',
        theme: req.body.theme || 'dark'
    };
    req.session.csrfSettings = newSettings;

    // Check if flag is in the email field (attacker would set it via CSRF)
    if (req.body.email && req.body.email.includes('CTF{')) {
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
    fs.mkdirSync(uploadDir);
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
        message: `File uploaded: ${req.file.filename}. Access it at /challenge/uploads`
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
    const xml = req.body.xml;

    try {
        // VULNERABLE: XML External Entity processing enabled
        const libxmljs = require('libxmljs');
        const xmlDoc = libxmljs.parseXml(xml, { noent: true, dtdload: true });
        const data = xmlDoc.get('//data');
        const result = data ? data.text() : 'No data found';

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

// Internal endpoint for SSRF challenge
router.get('/internal/flag', (req, res) => {
    res.send('CTF{ssrf_internal_access_hacker}');
});

module.exports = router;
