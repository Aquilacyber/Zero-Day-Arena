# Security Policy

## This Platform Is Intentionally Vulnerable

Aquila CTF contains **deliberately insecure challenge routes** for educational purposes. The following are features, not bugs:

- SQL injection in the login and search routes
- Reflected XSS in the search output
- IDOR in the profile route
- Command injection in the ping route
- JWT algorithm confusion in the vault route
- RCE via unsafe `vm` sandbox in the calculator
- CSRF in the settings route
- Unrestricted file upload
- XXE in the XML parser
- SSRF in the URL fetcher

**Do not deploy this platform on a public-facing server without network isolation.** It is designed for private networks, LAN events, and isolated VPS environments.

---

## Reporting Real Vulnerabilities

If you find a security issue in the **platform infrastructure itself** — the admin panel, authentication system, session handling, database layer, or anything outside the intentional challenge routes — please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Email: support@aquilacyber.com  
Subject line: `[SECURITY] Brief description`

Include:
- What the vulnerability is and where it exists
- Steps to reproduce
- Potential impact
- Your suggested fix (optional but appreciated)

We aim to acknowledge reports within 48 hours and resolve confirmed issues within 14 days.

---

## Scope

| In scope | Out of scope |
|---|---|
| Authentication bypass on real user accounts | The intentional SQLi challenge login |
| Admin panel privilege escalation | Challenge difficulty complaints |
| Session fixation or hijacking | Expected challenge behaviour |
| Path traversal outside `uploads/` | The intentional upload challenge |
| Information disclosure of real secrets | Flag values (those are meant to be found) |

---

## Deployment Hardening Checklist

Before running a real event:

- [ ] Set strong `SESSION_SECRET` and `JWT_SECRET` in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Run behind a reverse proxy (nginx/Caddy) — do not expose Node directly
- [ ] Restrict network access to your event audience only
- [ ] Create the admin account with `node scripts/create-admin.js` before opening registration
- [ ] Test the full flag submission flow before the event starts