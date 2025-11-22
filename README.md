# 🦅 AQUILA CTF Platform

A modern, feature-rich Capture The Flag (CTF) platform designed for learning web security vulnerabilities. Built with Node.js, Express, and EJS, featuring 10 intentionally vulnerable challenges covering common web security issues.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ⚠️ Security Warning

**DO NOT DEPLOY TO PRODUCTION OR EXPOSE TO THE INTERNET**

This platform contains **intentionally vulnerable code** for educational purposes. It should only be run locally in a safe, isolated environment.

---

## 🎯 Features

### Core Functionality
- ✅ **10 Web Security Challenges** - SQL Injection, XSS, IDOR, Command Injection, JWT Bypass, RCE, CSRF, File Upload, XXE, SSRF
- ✅ **User Authentication** - Secure registration and login with bcrypt password hashing
- ✅ **Progress Tracking** - Persistent user progress with session management
- ✅ **Scoring System** - Points-based scoring with hint penalties
- ✅ **Hint System** - 3-level hints for each challenge (-20 points per hint)
- ✅ **Writeup System** - Detailed solutions unlocked after solving challenges
- ✅ **Progress Export** - Download your progress as JSON

### UI/UX Features
- 🌓 **Dark/Light Mode** - Toggle between themes with persistence
- ⌨️ **Keyboard Shortcuts** - `Ctrl+J` (theme), `Ctrl+Enter` (submit), `Esc` (close)
- 🎨 **Modern Design** - Glassmorphism, gradients, and smooth animations
- 🔊 **Sound Effects** - Audio feedback for actions
- ⏱️ **Live Timer** - Track your solving time
- 📊 **Progress Bar** - Visual progress indicator

---

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Challenges](#-challenges)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Technologies](#-technologies)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Installation

### Prerequisites

- **Node.js** v14.0.0 or higher
- **npm** (comes with Node.js)

### Steps

1. **Clone or download the repository**
   ```bash
   cd aquila_ctf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm list
   ```

### Dependencies

The platform uses the following packages:
- `express` - Web framework
- `ejs` - Templating engine
- `bcryptjs` - Password hashing
- `express-session` - Session management
- `alasql` - In-memory database with file persistence
- `multer` - File upload handling
- `axios` - HTTP client
- `jsonwebtoken` - JWT handling

---

## 🎮 Quick Start

### 1. Start the Server

```bash
node server.js
```

You should see:
```
Database initialized (AlaSQL with persistence)
Server running on http://localhost:3000
```

### 2. Open Your Browser

Navigate to: **http://localhost:3000**

### 3. Create an Account

- Click **"Register"**
- Choose a username and password
- Click **"Create Account"**

### 4. Start Solving Challenges

- Login with your credentials
- Browse the 10 challenges on the dashboard
- Click **"Start"** on any challenge to begin
- Submit flags in the format: `CTF{...}`

### 5. Stop the Server

Press `Ctrl+C` in the terminal to stop the server.

---

## 🎯 Challenges

| # | Challenge | Type | Difficulty | Description |
|---|-----------|------|------------|-------------|
| 1 | **Login Bypass** | SQL Injection | 🟢 Easy | Exploit poorly secured authentication |
| 2 | **Search Bar** | Reflected XSS | 🟢 Easy | Inject malicious scripts via search |
| 3 | **User Profile** | IDOR | 🟡 Medium | Access unauthorized user data |
| 4 | **Ping Tool** | Command Injection | 🟡 Medium | Execute system commands |
| 5 | **Secret Vault** | JWT Bypass | 🔴 Hard | Bypass JWT authentication |
| 6 | **Calculator** | Remote Code Execution | 🔴 Hard | Exploit dangerous code evaluation |
| 7 | **Settings Panel** | CSRF | 🟡 Medium | Forge cross-site requests |
| 8 | **File Manager** | File Upload | 🟢 Easy | Upload unrestricted files |
| 9 | **XML Parser** | XXE | 🔴 Hard | Extract data via XML entities |
| 10 | **URL Fetcher** | SSRF | 🟡 Medium | Access internal resources |

### Scoring

- **Base Points**: 100 points per challenge
- **Hint Penalty**: -20 points per hint used
- **Maximum Score**: 1000 points (all challenges, no hints)

---

## 📖 Usage Guide

### Dashboard

The main dashboard displays:
- **Header**: User info, theme toggle, logout button
- **Progress Panel**: Score, timer, progress bar
- **Flag Submission**: Input field to submit flags
- **Challenge Grid**: All 10 challenges with status badges
- **Footer**: Export progress link

### Solving a Challenge

1. **Click "Start"** on a challenge card
2. **Explore** the vulnerable application
3. **Exploit** the vulnerability to find the flag
4. **Return** to the dashboard
5. **Submit** the flag in the format `CTF{...}`
6. **View Writeup** (unlocked after solving)

### Using Hints

1. On any challenge page, click **"Get Hint"**
2. Each challenge has **3 levels** of hints
3. Each hint costs **-20 points**
4. Hints are revealed progressively

### Viewing Writeups

1. Solve a challenge to unlock its writeup
2. Click the **"Writeup"** button on the challenge card
3. Read the detailed analysis, exploitation steps, and remediation advice

### Exporting Progress

1. Scroll to the footer
2. Click **"Download Progress Report (JSON)"**
3. A JSON file will download with your progress

### Keyboard Shortcuts

- `Ctrl+J` - Toggle dark/light mode
- `Ctrl+Enter` - Submit flag (when input is focused)
- `Esc` - Close modals

---

## 📁 Project Structure

```
aquila_ctf/
├── server.js                 # Main server file
├── database.js              # Database wrapper (AlaSQL)
├── package.json             # Dependencies
├── aquila.json             # Database file (auto-generated)
│
├── routes/
│   ├── auth.js             # Authentication routes
│   └── challenges.js       # Challenge routes
│
├── views/
│   ├── index.ejs           # Dashboard
│   ├── auth_login.ejs      # Login page
│   ├── register.ejs        # Registration page
│   ├── writeup.ejs         # Writeup template
│   ├── login.ejs           # Challenge 1: SQL Injection
│   ├── search.ejs          # Challenge 2: XSS
│   ├── profile.ejs         # Challenge 3: IDOR
│   ├── ping.ejs            # Challenge 4: Command Injection
│   ├── vault.ejs           # Challenge 5: JWT Bypass
│   ├── calculator.ejs      # Challenge 6: RCE
│   ├── csrf.ejs            # Challenge 7: CSRF
│   ├── upload.ejs          # Challenge 8: File Upload
│   ├── xxe.ejs             # Challenge 9: XXE
│   └── ssrf.ejs            # Challenge 10: SSRF
│
├── public/
│   ├── style.css           # Main stylesheet
│   └── uploads/            # File upload directory
│
└── data/
    └── writeups.js         # Writeup content
```

---

## 🛠️ Technologies

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **AlaSQL** - In-memory SQL database with JSON persistence
- **bcryptjs** - Password hashing
- **express-session** - Session management

### Frontend
- **EJS** - Templating engine
- **Vanilla CSS** - Styling with CSS variables
- **Vanilla JavaScript** - Client-side interactivity
- **Web Audio API** - Sound effects

### Security (Platform)
- **bcrypt** - Password hashing (10 salt rounds)
- **Session-based authentication** - Secure session management
- **Parameterized queries** - SQL injection prevention (where appropriate)

---

## ⚙️ Configuration

### Environment Variables (Optional)

For production use (not recommended for this CTF), you can set:

```bash
# Session secret
SESSION_SECRET=your_secret_key_here

# Port
PORT=3000
```

### Session Configuration

Default session settings in `server.js`:
```javascript
{
    secret: 'super_secret_session_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}
```

### Database

- **Type**: AlaSQL (in-memory with file persistence)
- **File**: `aquila.json` (auto-created)
- **Location**: Project root directory

To reset the database, simply delete `aquila.json` and restart the server.

---

## 🔧 Troubleshooting

### Server won't start

**Problem**: Port 3000 is already in use

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database errors

**Problem**: Corrupted `aquila.json`

**Solution**:
```bash
# Delete the database file
rm aquila.json  # Linux/Mac
del aquila.json  # Windows

# Restart the server
node server.js
```

### Session issues

**Problem**: Can't login or session expires immediately

**Solution**:
1. Clear browser cookies for `localhost:3000`
2. Restart the server
3. Try a different browser

### Missing dependencies

**Problem**: `Cannot find module 'express'`

**Solution**:
```bash
npm install
```

---

## 🎓 Learning Resources

### Recommended Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [HackTricks](https://book.hacktricks.xyz/)

### Challenge-Specific Resources

- **SQL Injection**: [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- **XSS**: [OWASP XSS](https://owasp.org/www-community/attacks/xss/)
- **IDOR**: [OWASP IDOR](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)
- **Command Injection**: [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- **JWT**: [JWT.io](https://jwt.io/)
- **XXE**: [OWASP XXE](https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing)
- **SSRF**: [OWASP SSRF](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery)

---

## 🤝 Contributing

This is an educational project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Ideas for Contributions

- Additional challenges
- Improved writeups
- UI/UX enhancements
- Bug fixes
- Documentation improvements

---

## 📝 License

This project is licensed under the MIT License.

**Educational Use Only**: This software is provided for educational purposes. The authors are not responsible for any misuse of this software.

---

## 🙏 Acknowledgments

- Inspired by platforms like HackTheBox, TryHackMe, and OverTheWire
- Built for cybersecurity education and training
- Special thanks to the OWASP community

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the code comments
3. Consult the writeups after solving challenges

---

## 🎉 Happy Hacking!

Remember: The goal is to **learn**, not just to solve. Take time to understand each vulnerability and how to prevent it in real applications.

**Good luck, and may the flags be with you!** 🚩
