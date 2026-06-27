# Contributing to Aquila CTF Platform

Thanks for wanting to contribute! This is a community project built by and for AquilaCyber and the wider African cybersecurity education community.

---

## Ways to Contribute

- **Bug reports** — open an issue with steps to reproduce
- **Bug fixes** — open a PR against `main`; include a description of what was broken and how you fixed it
- **New challenges** — see the Challenge Guidelines below
- **UI/UX improvements** — screenshots or mockups help when proposing visual changes
- **Documentation** — corrections, translations, and better examples are always welcome

---

## Getting Started

```bash
git clone https://github.com/AquilaCyber/CTF-Master.git
cd CTF-Master
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Files are hot-reloaded — edit any `.js` or `.ejs` file and the server restarts automatically.

---

## Challenge Guidelines

Before submitting a new built-in challenge:

1. **Open an issue first** — describe the vulnerability class, difficulty, and intended learning outcome. We'll confirm it fits before you build it.
2. Each challenge needs: a route handler, a view, a flag seeded in `database.js`, 3 hint levels, and a writeup.
3. Follow the existing pattern in `routes/challenges.js` and `views/`.
4. The challenge must be **intentionally vulnerable** — document exactly what the vulnerability is and why it exists.
5. Do not include real credentials, API keys, or personally identifying information in challenge assets.
6. Test that the challenge is solvable end-to-end before submitting the PR.

---

## Code Style

- Node.js / Express — match the existing patterns
- `async/await` throughout — no raw Promise chains or callbacks except where required (e.g. `exec`)
- Parameterised queries only — never string-concatenate SQL
- Keep route files focused — business logic in routes, not in `server.js`
- EJS views — use CSS variables from `public/style.css`, not inline colour values

---

## Pull Request Process

1. Fork the repo and create a branch: `git checkout -b fix/your-fix-name`
2. Make your changes and test locally with Docker
3. Run `node --check` on any JS files you modified
4. Open a PR against `main` with a clear description of the change
5. A maintainer will review within a few days

---

## Code of Conduct

Be respectful. This project is built for education — everyone from beginners to experienced practitioners is welcome. Issues and PRs that are hostile or dismissive will be closed.

---

## Contact

- GitHub Issues — preferred for bugs and feature requests
- Email: support@aquilacyber.com
- X/Twitter: [@aquila_cyber](https://twitter.com/aquila_cyber)