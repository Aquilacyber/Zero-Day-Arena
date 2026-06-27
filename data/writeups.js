module.exports = {
    1: {
        analysis: "The application constructs a SQL query by directly concatenating user input into the query string. This allows an attacker to manipulate the query structure.",
        steps: [
            "Identify the login form fields 'username' and 'password'.",
            "Input a payload that closes the string literal and adds a tautology.",
            "Payload: admin' OR '1'='1",
            "The resulting query becomes: SELECT * FROM users WHERE username = 'admin' OR '1'='1'..."
        ],
        remediation: "Use parameterized queries (prepared statements) to separate code from data."
    },
    2: {
        analysis: "The application reflects the search query parameter directly into the HTML response without proper escaping or sanitization.",
        steps: [
            "Enter a search term containing HTML characters.",
            "Inject a script tag to execute JavaScript.",
            "Payload: <script>alert(document.cookie)</script>"
        ],
        remediation: "Contextually encode all user-supplied data before rendering it in the browser."
    },
    3: {
        analysis: "The application uses an insecure direct object reference (IDOR) to retrieve user profiles. It trusts the 'id' parameter without verifying if the logged-in user is authorized to access that resource.",
        steps: [
            "Log in and observe the URL: /challenge/profile?id=2",
            "Change the 'id' parameter to other values to enumerate users.",
            "The admin user has ID 7. Access /challenge/profile?id=7 to view the admin profile and flag."
        ],
        remediation: "Implement proper access control checks to ensure the user is authorized to access the requested resource."
    },
    4: {
        analysis: "The application passes user input directly to a system shell command (ping) without validation.",
        steps: [
            "Enter a valid IP address to verify functionality.",
            "Append a command separator (; or &&) followed by a malicious command.",
            "Payload: 127.0.0.1 && type flag_ping.txt (Windows) or 127.0.0.1 && cat flag_ping.txt (Linux)"
        ],
        remediation: "Avoid calling system commands if possible. If necessary, use APIs that don't invoke a shell, or strictly validate input against an allowlist."
    },
    5: {
        analysis: "The application accepts JWTs with the 'none' algorithm, which bypasses signature verification.",
        steps: [
            "Capture the session cookie 'token'.",
            "Decode the JWT header and payload.",
            "Change the header 'alg' to 'none'.",
            "Change the payload 'role' to 'admin'.",
            "Re-encode the JWT (without a signature) and replace the cookie."
        ],
        remediation: "Configure the JWT library to reject the 'none' algorithm and enforce a strong signing algorithm like HS256 or RS256."
    },
    6: {
        analysis: "The application uses the dangerous eval() function to evaluate the mathematical expression.",
        steps: [
            "Identify that the input is being evaluated as code.",
            "Inject Node.js code to read the file system.",
            "Payload: require('fs').readFileSync('flag_calc.txt','utf8')"
        ],
        remediation: "Never use eval(). Use a safe math parsing library instead."
    },
    7: {
        analysis: "The settings update form lacks a CSRF token, allowing attackers to forge requests on behalf of authenticated users.",
        steps: [
            "Create a malicious HTML page with a hidden form targeting /challenge/csrf/update.",
            "Set the form values to the desired payload.",
            "Use JavaScript to auto-submit the form when the victim visits the page."
        ],
        remediation: "Implement anti-CSRF tokens (Synchronizer Token Pattern) for all state-changing requests."
    },
    8: {
        analysis: "The file upload function does not validate the file type or extension, allowing the upload of arbitrary files.",
        steps: [
            "Create a text file containing a message or code.",
            "Upload the file via the form.",
            "Access the directory listing at /challenge/uploads to find the flag."
        ],
        remediation: "Validate file types against an allowlist, rename uploaded files, and store them outside the web root if possible."
    },
    9: {
        analysis: "The XML parser is configured to resolve external entities (XXE), allowing attackers to read local files or perform SSRF.",
        steps: [
            "Intercept the XML request.",
            "Inject a DOCTYPE definition with an external entity pointing to a local file.",
            "Payload: <!DOCTYPE foo [<!ENTITY xxe SYSTEM 'flag_xxe.txt'>]>",
            "Reference the entity &xxe; in the XML data."
        ],
        remediation: "Disable DTD processing and external entity resolution in the XML parser configuration."
    },
    10: {
        analysis: "The application fetches a URL provided by the user without validating the destination, allowing access to internal services.",
        steps: [
            "Identify the URL fetching functionality.",
            "Provide a URL pointing to an internal resource.",
            "Payload: http://localhost:3000/internal/flag"
        ],
        remediation: "Validate user-supplied URLs against an allowlist of permitted domains and protocols. Block access to internal IP ranges."
    },
    11: {
        analysis: "Phantom Insider is a multi-stage OSINT investigation requiring intelligence gathering, forensic analysis, and password cracking to expose an insider threat.",
        steps: [
            "Flag 1: Review the Chatter archive and Blog snapshot. Note the insider's pet name and department. Cross-reference this with the NexaCorp Employee Directory CSV to identify the employee ID (E-8931) and access their profile page.",
            "Flag 2: Download 'meetup_spot.jpg' from the blog. Use an EXIF viewer or 'exiftool' to inspect the image metadata. The flag is hidden inside the 'ImageDescription' field.",
            "Flag 3: Search 'breach_dump_2024.txt' for the suspect's username to find an MD5 hash. Crack it using John the Ripper and the rockyou wordlist. Use the cracked password to extract the 'stolen_data.zip' archive and read the final flag."
        ],
        remediation: "Enforce strict metadata stripping on uploaded images, mandate strong password policies to prevent dictionary attacks, and implement robust access controls to prevent unauthorized data exfiltration."
    }
};