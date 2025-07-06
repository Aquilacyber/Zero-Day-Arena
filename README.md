
# 🦅 AquilaCyber CTF Lab 🦅

Welcome to the **AquilaCyber CTF Lab** — your all-in-one playground for learning, hacking, and having fun! Step into the shoes of a digital detective, a cryptanalyst, a reverse engineer, and a forensics wizard. Each challenge is crafted to teach, surprise, and entertain. Whether you’re a beginner or a seasoned hacker, you’ll find something to test your skills and spark your curiosity.

> **"The best way to learn cybersecurity is to break things — and then fix them!"**


## 🚩 What’s Inside?

You’ll tackle four unique, hands-on challenges:

- **Web Security (SQL Injection):** Hack your way past login forms and extract secrets from a vulnerable web app. Learn the art of SQLi in a safe, legal environment.
- **Cryptography (XOR):** Can you outsmart a classic XOR cipher? Solve riddles, analyze ciphertext, and discover the flag — all in a beautiful web interface.
- **Reverse Engineering (CrackMe):** Dive into Python bytecode and .pyc files. Reverse engineer the logic, break the obfuscation, and claim your flag!
- **Forensics (Steganography):** Download a mysterious image, use your favorite stego tools, and reveal the flag hidden in the pixels. No upload needed — just pure analysis.

Each challenge is web-based, visually modern, and comes with hints and narrative to guide you.


## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:

- **PHP 7.4+** (for the homepage)
- **Python 3.x** (for the web challenges)
- **Docker & Docker Compose** (for the SQLi challenge)
- **Git** (optional, for cloning)

No need to install extra Python packages — the setup script will handle it for you!


### 🛠️ Setup

Clone the repo and run the setup script. It will check dependencies, install what’s missing, and launch everything for you:

```bash
./setup.sh
```



### 🌐 Launching the CTF

Once setup is complete, open your browser and jump into the action:

- 🏠 **Homepage:** [http://localhost:8000/homepage/index.html](http://localhost:8000/homepage/index.html) — Start here for the story, challenge links, and tips.
- 🕸️ **Web: SQL Injection:** [http://localhost:5001](http://localhost:5001) — Hack the login and dig into the database.
- 🔐 **Crypto: XOR Challenge:** [http://localhost:5002](http://localhost:5002) — Decrypt the message, solve the riddle, and claim your flag.
- 🕵️‍♂️ **Reverse Engineering: CrackMe:** [http://localhost:5003](http://localhost:5003) — Reverse engineer the .pyc logic and break the challenge.
- 🖼️ **Forensics: Steganography:** [http://localhost:5004](http://localhost:5004) — Download the image, extract the flag, and verify it online.

All challenges are web-based. No more running scripts by hand — just click and hack!


## 💡 Tips for Success

- 🔎 **Explore everything:** Inspect source code, try edge cases, and don’t be afraid to break things.
- 🧩 **Use the hints:** Each challenge has built-in hints or riddles. If you’re stuck, look for clues!
- 🛠️ **Try different tools:** For stego, use zsteg, stegsolve, or online LSB tools. For reversing, try pycdc, uncompyle6, or just a hex editor.
- 🧠 **Think like an attacker:** What would a real hacker do? Try SQL injection payloads, brute force, or code analysis.
- 💬 **Ask for help:** Stuck? Collaborate with friends or search online. Learning is the goal!
- 🎉 **Have fun:** The best hackers are the ones who enjoy the puzzle.


## 🤝 Contributing

Want to add your own challenge, improve the UI, or make the lab even more fun? Fork the repo, open a pull request, or suggest ideas. All contributions are welcome!


## 📜 License & Disclaimer

This project is for educational and ethical hacking purposes only. Please use responsibly and do not attack systems you do not own or have permission to test.


---

Happy hacking, and may the flags be ever in your favor! 🦅🔥
