# 🦅 AQUILA CTF Platform

A modern, feature-rich Capture The Flag (CTF) platform designed for learning web security vulnerabilities and OSINT techniques. Built with Node.js, Express, and EJS, featuring **13 intentionally vulnerable challenges** across 11 labs covering common web security issues and open-source intelligence.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 📸 Screenshots

### Dashboard
> The main hub — challenge grid, live progress tracking, and flag submission.

![Dashboard](docs/screenshots/dashboard.png)

### Phantom Insider — OSINT Lab
> A multi-stage corporate insider threat investigation with digital evidence analysis.

![Phantom Insider](docs/screenshots/phantom-insider.png)

### Calculator RCE Lab
> Exploit dangerous code evaluation.

![Calculator](docs/screenshots/calculator.png)

---

## ⚠️ Security Warning

**DO NOT DEPLOY TO PRODUCTION OR EXPOSE TO THE INTERNET**

This platform contains **intentionally vulnerable code** for educational purposes. It should only be run locally in a safe, isolated environment.

---

## 🎯 Features

### Core Functionality
- ✅ **13 Security Challenges** — SQL Injection, XSS, IDOR, Command Injection, JWT Bypass, RCE, CSRF, File Upload, XXE, SSRF, and a multi-stage OSINT Lab
- ✅ **User Authentication** — Secure registration and login with bcrypt password hashing
- ✅ **Progress Tracking** — Persistent user progress with session management
- ✅ **Scoring System** — Points-based scoring with hint penalties
- ✅ **Hint System** — 3-level progressive hints for each challenge (-20 points per hint)
- ✅ **Writeup System** — Detailed solutions unlocked after solving challenges
- ✅ **Leaderboard** — Multi-user score rankings
- ✅ **Progress Export** — Download your progress as JSON
- ✅ **Completion Certificate** — Auto-generated downloadable certificate with confetti celebration

### UI/UX Features
- 🌓 **Dark/Light Mode** — Toggle between themes with persistence
- ⌨️ **Keyboard Shortcuts** — `Ctrl+J` (theme), `Ctrl+Enter` (submit), `Esc` (close)
- 🎨 **Modern Design** — Glassmorphism, gradients, and smooth animations
- 🔊 **Sound Effects** — Audio feedback for actions
- ⏱️ **Live Timer** — Track your solving time
- 📊 **Progress Bar** — Visual progress indicator
- 🎉 **Completion Celebration** — Fullscreen confetti and certificate on 100% completion

### Security Isolation
- 🔒 **Sandboxed RCE** — Calculator lab uses a VM sandbox to prevent cross-challenge flag leakage
- 🔒 **WAF-Protected Command Injection** — Ping lab restricts access to sensitive files via regex filtering
- 🔒 **Filesystem Isolation** — Command execution runs inside a dedicated `ping_sandbox/` directory

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

- **Node.js** v18.0.0 or higher
- **npm** (comes with Node.js)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/AquilaCyber/CTF.git
   cd CTF
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   > Flag files (`flag_calc.txt`, `flag_xxe.txt`, `ping_sandbox/flag_ping.txt`) are auto-generated on first startup.

### Dependencies

The platform uses the following packages:
- `express` — Web framework
- `ejs` — Templating engine
- `bcryptjs` — Password hashing
- `express-session` — Session management
- `cookie-parser` — Cookie handling
- `alasql` — In-memory database with file persistence
- `multer` — File upload handling
- `axios` — HTTP client
- `jsonwebtoken` — JWT handling
- `sharp` — Image processing (for OSINT lab evidence generation)

---

## 🐳 Docker Quick Start (Recommended)

### Prerequisites

- **Docker** and **Docker Compose** installed ([Get Docker](https://docs.docker.com/get-docker/))

### 1. Build and Start

```bash
docker compose up --build
```

You should see:
```
aquila-ctf  | Database initialized (AlaSQL with persistence)
aquila-ctf  | Server running on http://localhost:3000
```

### 2. Open Your Browser

Navigate to: **http://localhost:3000**

### 3. Stop the Platform

```bash
docker compose down
```

### 4. Reset All Data

To wipe all user data, progress, and uploads:
```bash
docker compose down -v
```

### Standalone Docker (without Compose)

```bash
# Build the image
docker build -t aquila-ctf .

# Run the container
docker run -p 3000:3000 --name aquila-ctf aquila-ctf

# Stop and remove
docker stop aquila-ctf && docker rm aquila-ctf
```

---

## 🎮 Manual Quick Start (Without Docker)

### 1. Start the Server

```bash
npm start
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
- Browse the 11 challenge labs on the dashboard
- Click **"Start"** or **"Investigate"** on any challenge to begin
- Submit flags in the format: `CTF{...}` or `PI{...}` (for OSINT challenges)

### 5. Stop the Server

Press `Ctrl+C` in the terminal to stop the server.

---

## 🎯 Challenges

### Web Security Labs (Challenges 1–10)

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

### OSINT Lab — Phantom Insider (Challenges 11–13)

| # | Sub-Flag | Description |
|---|----------|-------------|
| 11 | **Identity Resolution** | Cross-reference digital evidence to identify the insider |
| 12 | **Geo-Location Intel** | Extract hidden intelligence from recovered media (EXIF) |
| 13 | **Data Decryption** | Crack credentials and decrypt the stolen data archive |

The Phantom Insider lab is a grouped, multi-stage OSINT investigation where you uncover a corporate insider threat using chat logs, blog snapshots, employee directories, image metadata, breach dumps, and encrypted archives.

### Scoring

- **Base Points**: 100 points per flag (13 flags total)
- **Hint Penalty**: -20 points per hint used (3 hints available per challenge)
- **Maximum Score**: 1,300 points (all challenges, no hints)

---

## 📖 Usage Guide

### Dashboard

The main dashboard displays:
- **Header**: User info, theme toggle, logout button
- **Progress Panel**: Score, timer, progress bar
- **Flag Submission**: Input field to submit flags
- **Challenge Grid**: All 11 labs with status badges (Locked / Partial / Solved)
- **Footer**: Leaderboard and export progress links

### Solving a Challenge

1. **Click "Start"** (or **"Investigate"** for the OSINT lab) on a challenge card
2. **Explore** the vulnerable application
3. **Exploit** the vulnerability to find the flag
4. **Return** to the dashboard
5. **Submit** the flag in the format `CTF{...}` or `PI{...}`
6. **View Writeup** (unlocked after solving)

### Using Hints

1. On any challenge page, click **"Get Hint"**
2. Each challenge has **3 levels** of hints
3. Each hint costs **-20 points**
4. Hints are persistent — they remain visible even if you navigate away

### Viewing Writeups

1. Solve a challenge to unlock its writeup
2. Click the **"Writeup"** button on the challenge card
3. Read the detailed analysis, exploitation steps, and remediation advice

### Completion Certificate

When all 13 flags are captured:
1. A fullscreen celebration appears with confetti 🎉
2. A personalized **Certificate of Excellence** is displayed with your name, score, and date
3. Click **"Download Certificate"** to save a high-resolution PNG
4. Links to the AquilaCyber website and WhatsApp community are provided

### Keyboard Shortcuts

- `Ctrl+J` — Toggle dark/light mode
- `Ctrl+Enter` — Submit flag (when input is focused)
- `Esc` — Close modals

---

## 📁 Project Structure

```
aquila_ctf/
├── server.js                 # Main server (auto-generates flag files on startup)
├── database.js               # Database wrapper (AlaSQL with JSON persistence)
├── package.json              # Dependencies
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker Compose configuration
├── .env.example              # Environment variable template
│
├── config/
│   └── challenges.js         # Challenge metadata & card builder
│
├── middleware/
│   └── auth.js               # Authentication middleware
│
├── routes/
│   ├── auth.js               # Authentication routes (login/register/logout)
│   ├── api.js                # API routes (submit, hints, writeups, leaderboard)
│   └── challenges.js         # Challenge routes (all 13 challenges)
│
├── views/
│   ├── index.ejs             # Dashboard
│   ├── auth_login.ejs        # Login page
│   ├── register.ejs          # Registration page
│   ├── leaderboard.ejs       # Leaderboard page
│   ├── writeup.ejs           # Writeup template
│   ├── error.ejs             # Error page
│   ├── phantom-insider.ejs   # OSINT Lab (Challenges 11-13)
│   ├── login.ejs             # Challenge 1: SQL Injection
│   ├── search.ejs            # Challenge 2: XSS
│   ├── profile.ejs           # Challenge 3: IDOR
│   ├── ping.ejs              # Challenge 4: Command Injection
│   ├── vault.ejs             # Challenge 5: JWT Bypass
│   ├── calculator.ejs        # Challenge 6: RCE
│   ├── csrf.ejs              # Challenge 7: CSRF
│   ├── upload.ejs            # Challenge 8: File Upload
│   ├── xxe.ejs               # Challenge 9: XXE
│   ├── ssrf.ejs              # Challenge 10: SSRF
│   └── partials/
│       └── hint_script.ejs   # Reusable hint UI component
│
├── phantom-insider/
│   ├── generate.js           # Evidence file generator (meetup_spot.jpg, stolen_data.zip)
│   ├── meetup_base.png       # Base image for EXIF injection
│   └── static/               # Pre-generated evidence files served at /phantom-lab/
│       ├── index.html         # Lab landing page
│       ├── chatter_archive.html
│       ├── blog_snapshot.html
│       ├── NexaCorp_Directory.csv
│       ├── breach_dump_2024.txt
│       ├── meetup_spot.jpg    # Contains EXIF flag
│       ├── stolen_data.zip    # Password-protected archive
│       └── E-8931.html        # Suspect profile page
│
├── data/
│   └── writeups.js           # Writeup content for all challenges
│
├── public/
│   ├── style.css             # Main stylesheet
│   └── theme.js              # Theme persistence script
│
└── uploads/                  # File upload directory (Challenge 8)
```

---

## 🛠️ Technologies

### Backend
- **Node.js** — Runtime environment
- **Express.js 5** — Web framework
- **AlaSQL** — In-memory SQL database with JSON persistence
- **bcryptjs** — Password hashing
- **express-session** — Session management
- **sharp** — Image processing (EXIF injection for OSINT lab)

### Frontend
- **EJS** — Templating engine
- **Vanilla CSS** — Styling with CSS variables and glassmorphism
- **Vanilla JavaScript** — Client-side interactivity
- **Web Audio API** — Sound effects
- **html2canvas** — Certificate generation
- **canvas-confetti** — Completion celebration

### Security (Platform)
- **bcrypt** — Password hashing (10 salt rounds)
- **Session-based authentication** — Secure session management
- **VM Sandbox** — Isolated code execution for Calculator challenge
- **WAF Filtering** — Regex-based protection against cross-challenge exploitation
- **Filesystem Isolation** — Sandboxed working directory for command injection

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Session secret
SESSION_SECRET=your_secret_key_here

# JWT secret for Challenge 5
JWT_SECRET=super_secret_jwt_key

# Port
PORT=3000

# Database path
DB_PATH=./aquila.json
```

### Database

- **Type**: AlaSQL (in-memory with file persistence)
- **File**: `aquila.json` (auto-created on first run)
- **Location**: Project root (or `DB_PATH` if set)

To reset all data, delete `aquila.json` and restart the server.

### Regenerating OSINT Evidence

If you need to regenerate the Phantom Insider evidence files:

```bash
node phantom-insider/generate.js
```

> **Note**: Requires `sharp` to be installed. The generator creates `meetup_spot.jpg` (with EXIF flag) and `stolen_data.zip` (password-protected archive).

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
rm aquila.json    # Linux/Mac
del aquila.json   # Windows

# Restart the server
npm start
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

### OSINT Lab images not loading

**Problem**: `meetup_spot.jpg` is missing or empty

**Solution**:
```bash
node phantom-insider/generate.js
```

### Command Injection not showing full output

**Problem**: Ping output is truncated

**Solution**: The command execution has a 10-second timeout. If the target IP is unreachable, Windows may take longer to respond. Use `127.0.0.1` for reliable results.

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
- **OSINT**: [OSINT Framework](https://osintframework.com/)

---

## 🤝 Contributing

This is an educational project by the AquilaCyber community. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Ideas for Contributions

- Additional challenges (e.g., Deserialization, Prototype Pollution)
- Improved writeups with diagrams
- Mobile-responsive UI enhancements
- Docker Compose multi-service setups
- Bug fixes and documentation improvements

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
