const alasql = require('alasql');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'aquila.json');

// Initialize Database
const init = () => {
    try {
        // Core tables
        alasql('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT, username STRING, password STRING, created_at STRING, team_id INT)');
        alasql('CREATE TABLE IF NOT EXISTS flags (id INT, challenge_id INT, flag STRING)');
        alasql('CREATE TABLE IF NOT EXISTS hints (id INT, challenge_id INT, level INT, hint_text STRING)');
        alasql('CREATE TABLE IF NOT EXISTS user_progress (id INT AUTO_INCREMENT, user_id INT, challenge_id INT, solved_at STRING, hints_used INT)');
        alasql('CREATE TABLE IF NOT EXISTS idor_users (id INT, username STRING, password STRING, created_at STRING)');

        // Team mode tables
        alasql('CREATE TABLE IF NOT EXISTS teams (id INT AUTO_INCREMENT, name STRING, code STRING, created_at STRING, captain_id INT)');

        // First-blood notification queue — consumed by polling endpoint, cleared after delivery
        alasql('CREATE TABLE IF NOT EXISTS first_blood (id INT AUTO_INCREMENT, challenge_id INT, user_id INT, team_id INT, solved_at STRING, delivered INT)');

        // Load persisted data
        if (fs.existsSync(dbPath)) {
            const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

            alasql.tables.users.data        = data.users        || [];
            alasql.tables.flags.data        = data.flags        || [];
            alasql.tables.hints.data        = data.hints        || [];
            alasql.tables.user_progress.data = data.user_progress || [];
            alasql.tables.idor_users.data   = data.idor_users   || [];
            alasql.tables.teams.data        = data.teams        || [];
            alasql.tables.first_blood.data  = data.first_blood  || [];

            // Restore AUTO_INCREMENT counters
            _restoreCounter('users',         data.users);
            _restoreCounter('user_progress', data.user_progress);
            _restoreCounter('teams',         data.teams);
            _restoreCounter('first_blood',   data.first_blood);

            // Migrate existing users: add team_id column if missing
            alasql.tables.users.data = alasql.tables.users.data.map(u => ({
                team_id: null, ...u
            }));
        } else {
            seedData();
        }

        console.log('Database initialized (AlaSQL with persistence)');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
};

function _restoreCounter(table, rows) {
    if (!rows || rows.length === 0) return;
    const ids = rows.map(r => r.id).filter(id => id != null && !isNaN(id));
    if (ids.length === 0) return;
    // Bug fix 1: AlaSQL identities.value is the NEXT value to use (not current max).
    // Setting it to max(ids) causes the next INSERT to reuse that id (duplicate).
    // Must set to max(ids) + 1 so next insert gets max+1.
    const nextId = Math.max(...ids) + 1;
    if (alasql.tables[table]?.identities) {
        alasql.tables[table].identities.id = { value: nextId, step: 1 };
    }
}

const seedData = () => {
    alasql.tables.idor_users.data = [
        { id: 1, username: 'jdoe',     password: 'unknown', created_at: new Date().toISOString() },
        { id: 2, username: 'smith',    password: 'unknown', created_at: new Date().toISOString() },
        { id: 3, username: 'neo',      password: 'unknown', created_at: new Date().toISOString() },
        { id: 4, username: 'trinity',  password: 'unknown', created_at: new Date().toISOString() },
        { id: 5, username: 'morpheus', password: 'unknown', created_at: new Date().toISOString() },
        { id: 6, username: 'cipher',   password: 'unknown', created_at: new Date().toISOString() },
        { id: 7, username: 'admin',    password: 'unknown', created_at: new Date().toISOString() },
        { id: 8, username: 'tank',     password: 'unknown', created_at: new Date().toISOString() },
    ];

    alasql.tables.flags.data = [
        { id: 1,  challenge_id: 1,  flag: 'Q1RGe3NxbGlfbWFzdGVyX2J5cGFzc18xMzM3fQ==' },
        { id: 2,  challenge_id: 2,  flag: 'Q1RGe3hzc19hbGVydF9wb3B1cF9raW5nfQ==' },
        { id: 3,  challenge_id: 3,  flag: 'Q1RGe2lkb3JfcHJvZmlsZV9wZWVraW5nXzAwN30=' },
        { id: 4,  challenge_id: 4,  flag: 'Q1RGe2NtZF9pbmpfcm9vdF9hY2Nlc3NfcHduZWR9' },
        { id: 5,  challenge_id: 5,  flag: 'Q1RGe2p3dF9ub25lX2FsZ29fbWFzdGVyfQ==' },
        { id: 6,  challenge_id: 6,  flag: 'Q1RGe3JjZV9ldmFsX2lzX2V2aWxfbWF0aH0=' },
        { id: 7,  challenge_id: 7,  flag: 'Q1RGe2NzcmZfdG9rZW5fYnlwYXNzX25pbmphfQ==' },
        { id: 8,  challenge_id: 8,  flag: 'Q1RGe2ZpbGVfdXBsb2FkX3NoZWxsX21hc3Rlcn0=' },
        { id: 9,  challenge_id: 9,  flag: 'Q1RGe3h4ZV9lbnRpdHlfZXhwYW5zaW9uX3Byb30=' },
        { id: 10, challenge_id: 10, flag: 'Q1RGe3NzcmZfaW50ZXJuYWxfYWNjZXNzX2hhY2tlcn0=' },
        { id: 11, challenge_id: 11, flag: 'UEl7aWRlbnRpdHlfY29uZmlybWVkX25leGFjb3JwX2luc2lkZXJ9' },
        { id: 12, challenge_id: 12, flag: 'UEl7ZXhpZl9nZW9sb2NhdGlvbl9leHRyYWN0ZWR9' },
        { id: 13, challenge_id: 13, flag: 'UEl7YXJjaGl2ZV9kZWNyeXB0ZWRfZGF0YV9yZWNvdmVyZWR9' },
    ];

    alasql.tables.hints.data = [
        { id: 1,  challenge_id: 1,  level: 1, hint_text: "Try entering special characters in the login form. What happens with quotes?" },
        { id: 2,  challenge_id: 1,  level: 2, hint_text: "SQL comments can help bypass authentication. Try using -- or #" },
        { id: 3,  challenge_id: 1,  level: 3, hint_text: "Use: admin' OR '1'='1 as the username" },
        { id: 4,  challenge_id: 2,  level: 1, hint_text: "The search results are displayed without sanitization. Can you inject HTML?" },
        { id: 5,  challenge_id: 2,  level: 2, hint_text: "Try using <script> tags in your search query" },
        { id: 6,  challenge_id: 2,  level: 3, hint_text: "Search for: <script>alert(document.cookie)</script>" },
        { id: 7,  challenge_id: 3,  level: 1, hint_text: "Notice the user ID in the URL. What if you change it?" },
        { id: 8,  challenge_id: 3,  level: 2, hint_text: "Try accessing /challenge/profile?id=7" },
        { id: 9,  challenge_id: 3,  level: 3, hint_text: "The admin user has ID 7. Access their profile directly." },
        { id: 10, challenge_id: 4,  level: 1, hint_text: "The ping command is executed directly. Can you chain commands?" },
        { id: 11, challenge_id: 4,  level: 2, hint_text: "Use && or ; to execute multiple commands" },
        { id: 12, challenge_id: 4,  level: 3, hint_text: "Try: 127.0.0.1; cat flag_ping.txt" },
        { id: 13, challenge_id: 5,  level: 1, hint_text: "Inspect your cookies. There's a JWT token. Can you decode it?" },
        { id: 14, challenge_id: 5,  level: 2, hint_text: "JWT tokens have 3 parts. The header specifies the algorithm. What if it's 'none'?" },
        { id: 15, challenge_id: 5,  level: 3, hint_text: "Create a token with alg:none and role:admin, then replace your cookie" },
        { id: 16, challenge_id: 6,  level: 1, hint_text: "The calculator uses eval(). This is extremely dangerous." },
        { id: 17, challenge_id: 6,  level: 2, hint_text: "You can access Node.js globals through the pre-loaded 'fs' object." },
        { id: 18, challenge_id: 6,  level: 3, hint_text: "Try: require('fs').readFileSync('flag_calc.txt','utf8') or fs.readFileSync('flag_calc.txt','utf8')" },
        { id: 19, challenge_id: 7,  level: 1, hint_text: "The settings form doesn't validate the request origin. Can you forge a request?" },
        { id: 20, challenge_id: 7,  level: 2, hint_text: "Create an HTML page with a form that submits to /challenge/csrf/update" },
        { id: 21, challenge_id: 7,  level: 3, hint_text: "Use: window.location.href = 'http://localhost:3000/challenge/csrf/update?email=hacked@evil.com&theme=dark'" },
        { id: 22, challenge_id: 8,  level: 1, hint_text: "The upload doesn't check file types. What can you upload?" },
        { id: 23, challenge_id: 8,  level: 2, hint_text: "Try uploading a .txt file and see where it's stored" },
        { id: 24, challenge_id: 8,  level: 3, hint_text: "Upload any file, then access /challenge/uploads to see the directory listing" },
        { id: 25, challenge_id: 9,  level: 1, hint_text: "XML External Entities can read local files. Research XXE attacks." },
        { id: 26, challenge_id: 9,  level: 2, hint_text: "Define an entity that reads a file: <!ENTITY xxe SYSTEM 'file:///app/flag_xxe.txt'>" },
        { id: 27, challenge_id: 9,  level: 3, hint_text: "Submit XML with: <?xml version='1.0'?><!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///app/flag_xxe.txt'>]><data>&xxe;</data>" },
        { id: 28, challenge_id: 10, level: 1, hint_text: "The URL fetcher makes requests on behalf of the server. Can you access internal resources?" },
        { id: 29, challenge_id: 10, level: 2, hint_text: "Try accessing localhost or 127.0.0.1" },
        { id: 30, challenge_id: 10, level: 3, hint_text: "Fetch: http://localhost:3000/internal/flag" },
        { id: 31, challenge_id: 11, level: 1, hint_text: "Read the Chatter forum and Blog carefully. Note the suspect's department, pet name, and favorite drink." },
        { id: 32, challenge_id: 11, level: 2, hint_text: "Cross-reference the personal details with the NexaCorp_Directory.csv file." },
        { id: 33, challenge_id: 11, level: 3, hint_text: "Found Employee ID E-8931? Navigate to /phantom-lab/E-8931.html to confirm the identity." },
        { id: 34, challenge_id: 12, level: 1, hint_text: "Download the meetup_spot.jpg image from the blog snapshot." },
        { id: 35, challenge_id: 12, level: 2, hint_text: "Images can contain hidden metadata. Research EXIF data extraction tools." },
        { id: 36, challenge_id: 12, level: 3, hint_text: "Use 'exiftool meetup_spot.jpg' and look for the UserComment or ImageDescription field." },
        { id: 37, challenge_id: 13, level: 1, hint_text: "Check the breach_dump_2024.txt for the wraith_99 username. The hash format is MD5." },
        { id: 38, challenge_id: 13, level: 2, hint_text: "Use John the Ripper with rockyou.txt wordlist: john --format=raw-md5 --wordlist=rockyou.txt hash.txt" },
        { id: 39, challenge_id: 13, level: 3, hint_text: "The cracked password is the key to stolen_data.zip. Use: unzip -P [password] stolen_data.zip" },
    ];

    save();
};

const save = () => {
    try {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dbPath, JSON.stringify({
            users:         alasql.tables.users.data,
            flags:         alasql.tables.flags.data,
            hints:         alasql.tables.hints.data,
            user_progress: alasql.tables.user_progress.data,
            idor_users:    alasql.tables.idor_users.data,
            teams:         alasql.tables.teams.data,
            first_blood:   alasql.tables.first_blood.data,
        }, null, 2));
    } catch (err) {
        console.error('Database save error:', err);
    }
};

const query = async (sql, params = []) => alasql(sql, params);
const run   = async (sql, params = []) => { alasql(sql, params); save(); return { changes: 1, lastID: 0 }; };
const get   = async (sql, params = []) => alasql(sql, params)[0];

init();
module.exports = { query, run, get };