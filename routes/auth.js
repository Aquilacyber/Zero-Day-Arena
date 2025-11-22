const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// Register Page
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Register Logic
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('register', { error: 'All fields are required' });
    }

    try {
        const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.render('register', { error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Registration failed' });
    }
});

// Login Page
router.get('/login', (req, res) => {
    res.render('auth_login', { error: null }); // Renamed to avoid conflict with challenge login
});

// Login Logic
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.render('auth_login', { error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth_login', { error: 'Invalid credentials' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isAdmin = (user.username === 'admin'); // Simple admin check

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('auth_login', { error: 'Login failed' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
