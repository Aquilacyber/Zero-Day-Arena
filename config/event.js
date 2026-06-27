// ============================================================
// config/event.js — CTF Event Timing Configuration
// ============================================================
// Settings are stored in a JSON file (event-config.json) in the
// same directory as the database (DB_PATH). Admin can update
// them live from the Admin Panel → Event tab without touching
// any env vars or restarting the server.
//
// The file is read fresh on every request via getEventState(),
// so changes take effect immediately after saving.
// ============================================================

const fs   = require('fs');
const path = require('path');

// Store event config next to the database file
const dbPath        = process.env.DB_PATH || path.join(__dirname, '..', 'aquila.json');
const CONFIG_PATH   = path.join(path.dirname(dbPath), 'event-config.json');

// ── Default (blank) config ────────────────────────────────────
const DEFAULT_CONFIG = {
    name:   'Aquila CTF',
    start:  null,   // ISO string or null
    end:    null,
    freeze: null,
};

// ── Read helpers ──────────────────────────────────────────────

/** Load config from disk. Returns DEFAULT_CONFIG on any error. */
function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG };
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
            name:   parsed.name   || DEFAULT_CONFIG.name,
            start:  parsed.start  || null,
            end:    parsed.end    || null,
            freeze: parsed.freeze || null,
        };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

/** Persist config to disk. Throws on write error so callers can handle. */
function saveConfig(cfg) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

/** Clear all timing fields, keep the name. */
function clearEventTiming() {
    const cfg = loadConfig();
    cfg.start  = null;
    cfg.end    = null;
    cfg.freeze = null;
    saveConfig(cfg);
}

// ── Public API ────────────────────────────────────────────────

/**
 * Full event state snapshot for a given moment (defaults to now).
 * Reads config from disk on every call — no restart required after changes.
 *
 * @returns {{
 *   name: string,
 *   mode: 'open'|'scheduled'|'running'|'ended',
 *   submissionsOpen: boolean,
 *   isFrozen: boolean,
 *   isEnded: boolean,
 *   startMs:  number|null,
 *   endMs:    number|null,
 *   freezeMs: number|null,
 *   ctfStart:  Date|null,
 *   ctfEnd:    Date|null,
 *   ctfFreeze: Date|null,
 *   hasStart:  boolean,
 *   hasEnd:    boolean,
 *   hasFreeze: boolean,
 *   configPath: string,        // for admin display
 *   rawConfig: object,         // raw strings for populating form fields
 * }}
 */
function getEventState(now = new Date()) {
    const cfg = loadConfig();

    const ctfStart  = cfg.start  ? new Date(cfg.start)  : null;
    const ctfEnd    = cfg.end    ? new Date(cfg.end)    : null;
    const ctfFreeze = cfg.freeze ? new Date(cfg.freeze) : null;

    const hasStart  = ctfStart  instanceof Date && !isNaN(ctfStart.getTime());
    const hasEnd    = ctfEnd    instanceof Date && !isNaN(ctfEnd.getTime());
    const hasFreeze = ctfFreeze instanceof Date && !isNaN(ctfFreeze.getTime());

    const started = hasStart ? now >= ctfStart : true;
    const ended   = hasEnd   ? now >= ctfEnd   : false;
    const frozen  = hasFreeze && !ended ? now >= ctfFreeze : false;

    let mode;
    if (ended)         mode = 'ended';
    else if (!started) mode = 'scheduled';
    else if (hasEnd)   mode = 'running';
    else               mode = 'open';

    return {
        name: cfg.name || DEFAULT_CONFIG.name,
        mode,
        submissionsOpen: started && !ended,
        isFrozen: frozen,
        isEnded: ended,
        startMs:  hasStart  ? ctfStart.getTime()  : null,
        endMs:    hasEnd    ? ctfEnd.getTime()    : null,
        freezeMs: hasFreeze ? ctfFreeze.getTime() : null,
        ctfStart:  ctfStart  || null,
        ctfEnd:    ctfEnd    || null,
        ctfFreeze: ctfFreeze || null,
        hasStart,
        hasEnd,
        hasFreeze,
        configPath: CONFIG_PATH,
        rawConfig: cfg,
    };
}

module.exports = { getEventState, loadConfig, saveConfig, clearEventTiming, CONFIG_PATH };