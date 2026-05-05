# Phantom Insider — OSINT Lab

**Category:** OSINT | **Difficulty:** Hard | **Flags:** 3 (300 pts total)

## Overview

An insider threat investigation lab where players analyze scraped digital evidence (forum posts, blog snapshots, employee directories, breach dumps) to identify a corporate spy, extract hidden metadata, and decrypt stolen files.

## Setup

### Node.js Mode (Local Development)
```bash
# Generate evidence files (run once)
node phantom-insider/generate.js

# Start the platform
npm start
```
Evidence served at: `http://localhost:3000/phantom-lab/`

### Docker Mode
The original `Dockerfile` and `generate_footprint.py` can be used as a standalone container:
```bash
docker build -t phantom-insider ./phantom-insider
docker run -p 3001:80 -e FLAG_ONE=... -e FLAG_TWO=... -e FLAG_THREE=... phantom-insider
```

## Files

| File | Purpose |
|---|---|
| `generate.js` | Node.js script — generates EXIF image + encrypted ZIP |
| `generate_footprint.py` | Python script — original Docker generator |
| `Dockerfile` | Standalone nginx container (Docker mode) |
| `entrypoint.sh` | Docker entrypoint |
| `PhantomInsider_Documentation.md` | Full walkthrough & solution guide |
| `static/` | Generated evidence files (gitignored) |
