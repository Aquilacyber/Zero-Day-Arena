# AQUILA CTF Platform

A self-hosted Capture The Flag platform built by **AquilaCyber Defenders** for cybersecurity education across African university chapters. Features 13 intentionally vulnerable challenges, team mode, a live event system, and a full admin control panel.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)
![Platform](https://img.shields.io/badge/platform-AquilaCyber%20Defenders-FF6B2C)

---

## Security Warning

**DO NOT DEPLOY ON A PUBLIC-FACING SERVER.**

This platform contains **intentionally vulnerable code** for educational purposes. Run it only on private networks, isolated VPS environments, or locally on your machine. See [SECURITY.md](SECURITY.md) for deployment hardening steps.

---

## What's in v3.0

- **Brand redesign** — AquilaCyber Defenders color system (Navy `#1C2147` + Orange `#FF6B2C`)
- **Global navigation sidebar** — persistent across every page with SVG icons, player card, and mobile drawer
- **Challenge page identity** — every challenge has a consistent header with breadcrumb, type badge, difficulty, and points
- **Team mode** — create or join teams during registration; team scores are de-duplicated across members
- **Admin control panel** — user management, challenge stats, event control, team management, danger zone
- **Live event system** — set start/end/freeze times from the admin panel with no restart required
- **Scoreboard freeze** — leaderboard locks at a set time so players can't see who's catching up in the final stretch
- **First-blood notifications** — real-time broadcast when a challenge is solved for the first time
- **Live leaderboard** — polls every 30 seconds with animated rank-change indicators
- **Score breakdown** — shows solve count, hint penalties, and max possible score
- **Rate limiting** — flag submissions and hint requests are rate-limited per user
- **Mobile-first responsive** — full sidebar collapses to drawer on mobile, grid reflows to single column
- **Dark/light mode** — persisted in localStorage, no flash of wrong theme (FOUC-free)

---

## Screenshots

### Dashboard
The main hub — challenge grid with sub-flag progress, live score breakdown, flag submission, and event status banner.

![Dashboard](docs/screenshots/dashboard.png)

### Phantom Insider — OSINT Lab
Multi-stage corporate insider threat investigation with digital evidence analysis.

![Phantom Insider](docs/screenshots/phantom-insider.png)

### Calculator RCE Lab
Exploit dangerous code evaluation in a sandboxed environment.

![Calculator](docs/screenshots/calculator.png)

---

## Quick Start

### Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/AquilaCyber/CTF-Master.git
cd CTF-Master

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — set SESSION_SECRET and JWT_SECRET to strong random values

# 3. Create the admin account BEFORE starting the server
node scripts/create-admin.js yourpassword

# 4. Start the platform
docker compose up --build
```

Navigate to **http://localhost:3000** and log in as `admin`.

```bash
# Stop
docker compose down

# Full reset (wipe all data)
docker compose down -v
```

### Local (No Docker)

```bash
git clone https://github.com/AquilaCyber/CTF-Master.git
cd CTF-Master
npm install
cp .env.example .env     # edit SESSION_SECRET and JWT_SECRET
node scripts/create-admin.js yourpassword
npm start
```

### Development (Hot-reload)

```bash
docker compose -f docker-compose.dev.yml up --build
# or
npm run dev
```

Changes to `.js` and `.ejs` files restart the server automatically via `node --watch`.

---

## Admin Account

The admin account must be created before (or after restarting) the server:

```bash
# Local
node scripts/create-admin.js yourpassword

# Docker (while container is running — must restart after)
docker exec -it aquila-ctf node scripts/create-admin.js yourpassword
docker compose restart
```

Log in at `/auth/login` with username `admin`. The admin link appears in the navigation sidebar.

---

## Challenges

### Web Security Labs (1–10)

| # | Lab | Type | Difficulty |
|---|-----|------|-----------|
| 1 | Login Bypass | SQL Injection | Easy |
| 2 | XSS Search | Reflected XSS | Easy |
| 3 | User Profile | IDOR | Medium |
| 4 | Ping Tool | Command Injection | Medium |
| 5 | Secret Vault | JWT Bypass | Hard |
| 6 | Calculator | Remote Code Execution | Hard |
| 7 | Settings Panel | CSRF | Medium |
| 8 | File Manager | File Upload | Easy |
| 9 | XML Parser | XXE | Hard |
| 10 | URL Fetcher | SSRF | Medium |

### OSINT Lab — Phantom Insider (11–13)

| # | Sub-Flag | Description |
|---|----------|-------------|
| 11 | Identity Resolution | Cross-reference digital evidence to identify the insider |
| 12 | Geo-Location Intel | Extract hidden metadata from recovered media (EXIF) |
| 13 | Data Decryption | Crack credentials and decrypt the stolen data archive |

### Scoring

- **Base**: 100 points per flag (13 flags, 1,300 points maximum)
- **Hint penalty**: -20 points per hint (3 hints available per challenge)
- **Team scoring**: challenges are de-duplicated across team members — one solve per challenge per team

---

## Team Mode

Teams are created or joined at registration.

- **Create a team** — choose a name; a 6-character join code is generated automatically
- **Join a team** — enter the captain's join code
- **Solo** — play individually with no team affiliation

Team scores appear on a separate leaderboard tab. Only one team member needs to solve each challenge for the team to get credit.

---

## Event System

Configure timed events from the **Admin Panel → Event tab** with no restart required:

| Setting | Description |
|---------|-------------|
| **Event Name** | Display name shown on dashboard and leaderboard |
| **Start Time** | Flag submissions blocked until this time |
| **End Time** | Flag submissions close at this time |
| **Freeze Time** | Leaderboard stops updating (solves still count for final score) |

Quick presets (1h, 2h, 4h, 8h) fill the form automatically with a freeze 15 minutes before the end.

The dashboard shows the correct countdown/banner for each state (scheduled, running, frozen, ended) and submission is blocked server-side after the event ends.

---

## Project Structure

```
CTF-Master/
├── server.js                  # Entry point — middleware, routes, flag file generation
├── database.js                # AlaSQL wrapper with JSON persistence + auto-increment restore
├── package.json
├── Dockerfile                 # Production multi-stage build
├── Dockerfile.dev             # Development image (hot-reload, not for production)
├── docker-compose.yml         # Production compose
├── docker-compose.dev.yml     # Development compose (source volume mount)
├── .env.example               # Environment variable template
│
├── config/
│   ├── challenges.js          # Challenge metadata, card builder, slug/name/difficulty helpers
│   └── event.js               # Event state engine (reads event-config.json, no env vars)
│
├── middleware/
│   └── auth.js                # requireAuth session guard
│
├── routes/
│   ├── auth.js                # Register (with team create/join), login, logout
│   ├── api.js                 # Flag submit, hints, notifications, leaderboard, writeups, export
│   ├── challenges.js          # All 13 challenge routes
│   └── admin.js               # Admin panel — users, teams, challenges, event, danger zone
│
├── views/
│   ├── index.ejs              # Dashboard
│   ├── leaderboard.ejs        # Individual + team leaderboard with live rank indicators
│   ├── auth_login.ejs         # Login page
│   ├── register.ejs           # Registration with team options
│   ├── admin.ejs              # Admin control panel
│   ├── writeup.ejs            # Post-solve writeup template
│   ├── error.ejs              # Error page
│   ├── phantom-insider.ejs    # OSINT Lab (challenges 11-13)
│   ├── login.ejs              # Challenge 1: SQL Injection
│   ├── search.ejs             # Challenge 2: XSS
│   ├── profile.ejs            # Challenge 3: IDOR
│   ├── ping.ejs               # Challenge 4: Command Injection
│   ├── vault.ejs              # Challenge 5: JWT Bypass
│   ├── calculator.ejs         # Challenge 6: RCE
│   ├── csrf.ejs               # Challenge 7: CSRF
│   ├── upload.ejs             # Challenge 8: File Upload
│   ├── xxe.ejs                # Challenge 9: XXE
│   ├── ssrf.ejs               # Challenge 10: SSRF
│   └── partials/
│       ├── nav.ejs            # Global navigation sidebar (SVG icons, theme toggle, mobile drawer)
│       ├── challenge_header.ejs # Per-challenge identity header (breadcrumb, type, difficulty, points)
│       ├── modal.ejs          # AquilaModal dialog system
│       └── hint_script.ejs    # Hint purchase UI component
│
├── scripts/
│   ├── create-admin.js        # Create/reset admin account (run before starting server)
│   └── clean-dev.sh           # Remove dev data before pushing (dev-data/, dev-uploads/, aquila.json)
│
├── data/
│   └── writeups.js            # Post-solve writeup content for all 13 challenges
│
├── public/
│   ├── style.css              # Full design system (Defenders brand, dark/light mode, responsive)
│   └── theme.js               # Inline theme initialiser (prevents FOUC)
│
├── phantom-insider/
│   ├── generate.js            # Evidence generator (EXIF injection, password-protected zip)
│   ├── meetup_base.png        # Base image for EXIF injection
│   └── static/                # Pre-generated evidence served at /phantom-lab/
│       ├── index.html
│       ├── chatter_archive.html
│       ├── blog_snapshot.html
│       ├── NexaCorp_Directory.csv
│       ├── breach_dump_2024.txt
│       ├── meetup_spot.jpg    # Contains EXIF flag (challenge 12)
│       ├── stolen_data.zip    # Password-protected archive (challenge 13)
│       └── E-8931.html        # Suspect profile page (challenge 11)
│
├── uploads/                   # File upload directory (Challenge 8)
├── ping_sandbox/              # Isolated working directory for Command Injection
├── data-persist/              # Runtime data (event-config.json) — gitignored
└── docs/
    └── screenshots/
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Runtime mode | `production` |
| `PORT` | Server port | `3000` |
| `SESSION_SECRET` | Session signing key — **change this** | — |
| `JWT_SECRET` | JWT signing key for Vault challenge | `super_secret_jwt_key` |
| `DB_PATH` | Database file path | `./aquila.json` |

> **Note:** Event timing (start/end/freeze) is configured in the Admin Panel, not via environment variables. Settings are saved to `data-persist/event-config.json`.

### Admin Panel

Access at `/admin` after logging in as `admin`.

**Users tab** — view all registered users with scores and solve counts; reset or delete individual users.

**Teams tab** — list all teams with member counts and join codes; delete teams (members become solo).

**Challenges tab** — per-challenge solve rates with visual bars showing which challenges are too easy or too hard.

**Event tab** — set event name, start/end/freeze times, or use quick presets. Changes take effect immediately with no restart.

**Danger Zone tab** — manually grant solves to users; reset all progress across the entire platform.

---

## Technologies

### Backend
- **Node.js 18+** with **Express 5**
- **AlaSQL** — in-memory SQL with JSON file persistence
- **bcryptjs** — password hashing (10 salt rounds)
- **express-session** — session management
- **express-rate-limit** — per-user rate limiting on flag submission and hints
- **jsonwebtoken** — JWT for Vault challenge
- **multer** — file uploads (5MB limit, filename sanitisation)
- **axios** — HTTP client for SSRF challenge

### Frontend
- **EJS** templates with shared partials (`nav.ejs`, `challenge_header.ejs`, `modal.ejs`)
- **Vanilla CSS** — custom design system with CSS variables (no frameworks)
- **Space Grotesk** + **Share Tech Mono** — typography
- **Inline SVG icons** — no emoji, no icon font dependencies
- **Web Audio API** — sound feedback on flag submission
- **html2canvas** — downloadable completion certificate
- **canvas-confetti** — completion celebration

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Submit flag (when input is focused) |
| `Ctrl+J` | Toggle dark/light mode |
| `Esc` | Close modals |

---

## Troubleshooting

### Port already in use

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Can't log in as admin

The `create-admin.js` script writes to the JSON file on disk. A **running server will not see this change** — it holds its own copy of the database in memory. After running the script, restart the server:

```bash
# Docker
docker compose restart

# Local
# Stop the running process (Ctrl+C), then run again:
npm start
```

### Database corrupted

```bash
rm aquila.json
npm start     # re-seeds automatically
```

### OSINT lab images not loading

```bash
node phantom-insider/generate.js
```

Requires `sharp` to be installed (`npm install`).

### Flag files missing (Calculator / XXE / CMDi)

The server generates `flag_calc.txt`, `flag_xxe.txt`, and `ping_sandbox/flag_ping.txt` automatically on startup from the database. If they're missing, simply restart the server.

### Clean dev data before pushing

```bash
bash scripts/clean-dev.sh
```

Removes `dev-data/`, `dev-uploads/`, `aquila.json`, and flag files.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to report bugs, propose new challenges, and submit pull requests.

See [SECURITY.md](SECURITY.md) for responsible disclosure and deployment hardening checklist.

---

## Community

Built for and by the **AquilaCyber Defenders** — Africa's cybersecurity talent pipeline.

- Website: [alturacyber.com/aquilacyber](https://alturacyber.com/aquilacyber)
- Twitter/X: [@aquila_cyber](https://twitter.com/aquila_cyber)
- LinkedIn: [AquilaCyber](https://linkedin.com/company/aquilacyber)
- Email: support@aquilacyber.com

---

## License

MIT License — see [LICENSE](LICENSE) for details.

**Educational use only.** The authors are not responsible for misuse of this software.
