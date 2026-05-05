# Phantom Insider Machine Documentation

## Machine Identity
**Name:** Phantom Insider
**Category:** OSINT
**Difficulty:** Medium/Hard
**Internal Port:** 80 
**Dynamic Flags Supported:** Yes (Supports 3 Dynamic Flags)

## Storyline
"NexaCorp has experienced a catastrophic data leak. The intellectual property was stolen from deep within the R&D network. The only clue left behind is a taunting message posted on an anonymous hacker forum by the handle **'Wraith_99'**. The Incident Response team managed to scrape the forum, the user's linked personal blog, and a segment of a known data breach database before they were taken down. They've hosted this scraped digital footprint on a local investigation server for you. Your objective is to profile 'Wraith_99', uncover their real-world identity to prove they are a NexaCorp insider, track down the physical location of their last known meetup, and use their compromised digital footprint to decrypt the finalized stolen archive."

## Mission Objectives
1. **Evidence Gathering:** Connect to the machine's web interface to explore the scraped Evidence Archive containing the forum, blog, employee directory, and breach dump.
2. **Identity Resolution (Flag 1):** Cross-reference personal details found in the social scrapes with the `NexaCorp_Directory.csv` to find the employee's ID. Access their hidden profile endpoint.
3. **Geo-Location Visual/Exif Intelligence (Flag 2):** Download the image from the suspect's blog and use EXIF analysis tools to find the hidden location data.
4. **Credential Extraction:** Find the suspect's alias in the provided 2024 DarkWeb Breach Dump and crack their MD5 hashed password using standard wordlists.
5. **Data Decryption (Flag 3):** Use the cracked password to extract `stolen_data.zip` and recover the final flag.

## Admin Walkthrough / Solution

1. **Access the Archive:**
   Navigate to the machine's IP in your browser (`http://<machine-ip>`) to view the Digital Evidence Archive.

2. **Uncover the Identity (Flag 1):**
   - Click to view the **Chatter Forum** and **Blog Snapshot**. You will learn the suspect works in **Sales**, has a Golden Retriever named **Baxter**, and drinks **Mocha**.
   - Download the `NexaCorp_Directory.csv`.
   - Read the CSV:
     ```bash
     cat NexaCorp_Directory.csv
     ```
   - Match the clues to **Michael Vance**, whose Employee ID is **E-8931**.
   - Navigate your browser to `http://<machine-ip>/E-8931.html` to capture **Flag 1**.

3. **Extract the Geo-Location (Flag 2):**
   - Download the `meetup_spot.jpg` image linked in the Blog Snapshot.
   - Use `exiftool` to read the image's metadata:
     ```bash
     exiftool meetup_spot.jpg
     ```
   - Look for the `User Comment` or `Image Description` field in the output to find **Flag 2**.

4. **Crack the Credentials:**
   - Download the `breach_dump_2024.txt` file from the main index.
   - Look inside for the `wraith_99` account hash.
   - Put the hash in a text file (e.g., `hash.txt`) and crack it using John The Ripper and the `rockyou.txt` wordlist:
     ```bash
     grep "wraith_99" breach_dump_2024.txt > hash.txt
     john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
     ```
   - John will reveal the password is `liverpool123`.

5. **Decrypt the Data (Flag 3):**
   - Download the `stolen_data.zip` archive.
   - Extract it using the cracked password:
     ```bash
     unzip -P liverpool123 stolen_data.zip
     ```
   - Read the flag inside:
     ```bash
     cat flag3.txt
     ```

## Progressive Hints (Cost/Penalty System)

| Hint Level | Cost | Hint Text |
| :--- | :--- | :--- |
| **Hint 1** | 10 pts | Start by reading the Chatter forum and the Blog. Take notes on anything personal the suspect mentions (pets, drinks, department). Compare those notes against the `NexaCorp_Directory.csv`. |
| **Hint 2** | 20 pts | The ID you found in the directory is the key to Flag 1. Try appending `/E-####.html` to the web server URL to access their secret profile. |
| **Hint 3** | 30 pts | To find Flag 2, download the image from the blog and inspect its metadata. The tool `exiftool` pre-installed on your AttackBox will reveal hidden data attached to the photo. |
| **Hint 4** | 40 pts | For Flag 3, check the `breach_dump_2024.txt` for the suspect's username (`wraith_99`). It's an MD5 hash. Use `john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt` to crack it, then use the password to `unzip` the stolen data archive! |
