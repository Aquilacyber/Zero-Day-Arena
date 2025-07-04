<?php
session_start();
require_once 'includes/auth.php';
requireLogin();

$user = currentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>AquilaCyber CTF Lab - Dashboard</title>
    <style>
        body {
            background-color: #0e0e0e;
            color: #f0f0f0;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 960px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #111;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #00ffff;
            box-shadow: 0 0 10px #00ffff;
        }
        header h1 {
            margin: 0;
            font-size: 1.8rem;
            text-shadow: 0 0 8px #00ffff;
        }
        nav a {
            color: #00ffff;
            margin-left: 20px;
            text-decoration: none;
            font-weight: bold;
            transition: color 0.3s ease;
        }
        nav a:hover {
            color: #ff6f61;
            text-decoration: underline;
        }
        .welcome {
            margin-top: 20px;
            font-size: 1.2rem;
        }
        .progress {
            margin-top: 30px;
            background-color: #1a1a1a;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 0 15px #00ffff;
        }
        .progress h2 {
            color: #ff6f61;
            margin-bottom: 15px;
        }
        .progress ul {
            list-style: none;
            padding-left: 0;
        }
        .progress li {
            margin-bottom: 10px;
            font-size: 1rem;
        }
        .challenges {
            margin-top: 30px;
        }
        .challenges h2 {
            color: #00ffff;
            margin-bottom: 15px;
        }
        .challenge-card {
            background-color: #1a1a1a;
            border-radius: 12px;
            padding: 15px 20px;
            margin-bottom: 15px;
            box-shadow: 0 0 10px #00ffff;
        }
        .challenge-card h3 {
            margin: 0 0 10px 0;
            color: #ff6f61;
        }
        .challenge-card p {
            margin: 0;
            font-size: 0.95rem;
            line-height: 1.4;
        }
        .hint-link {
            margin-top: 10px;
            display: inline-block;
            color: #00ffff;
            text-decoration: underline;
            cursor: pointer;
        }
        .hint-link:hover {
            color: #ff6f61;
        }
    </style>
</head>
<body>
<header>
    <h1>AquilaCyber CTF Lab - Dashboard</h1>
    <nav>
        <a href="homepage/index.html">Home</a>
        <a href="settings.php">Settings</a>
        <a href="logout.php">Logout</a>
    </nav>
</header>
<div class="container">
    <div class="welcome">
        Welcome, <?= htmlspecialchars($user['username']) ?>! Ready to dive deeper into the challenges?
    </div>

    <section class="progress">
        <h2>Your Progress</h2>
        <ul>
            <li>Web: SQL Injection Challenge - <strong>Not Started</strong></li>
            <li>Crypto: XOR Challenge - <strong>Not Started</strong></li>
            <li>Reverse Engineering: CrackMe - <strong>Not Started</strong></li>
            <li>Forensics: Steganography - <strong>Not Started</strong></li>
        </ul>
    </section>

    <section class="challenges">
        <h2>Challenges</h2>
        <div class="challenge-card">
            <h3>Web: SQL Injection Challenge</h3>
            <p>Explore the web application vulnerable to SQL injection attacks. Use your skills to bypass authentication or extract sensitive data.</p>
            <a href="http://localhost:5001" target="_blank" class="hint-link">Open Challenge</a>
            <a href="walkthrough.md#web-sqli" target="_blank" class="hint-link" style="margin-left: 15px;">View Walkthrough</a>
        </div>
        <div class="challenge-card">
            <h3>Crypto: XOR Challenge</h3>
            <p>Analyze the XOR encryption Python script and decrypt the ciphertext to find the hidden flag.</p>
            <a href="../crypto-xor/challenge.py" target="_blank" class="hint-link">View Challenge</a>
            <a href="walkthrough.md#crypto-xor" target="_blank" class="hint-link" style="margin-left: 15px;">View Walkthrough</a>
        </div>
        <div class="challenge-card">
            <h3>Reverse Engineering: CrackMe</h3>
            <p>Reverse engineer the Python CrackMe script to find the correct input and reveal the flag.</p>
            <a href="../reverse-pyc/crackme.py" target="_blank" class="hint-link">View Challenge</a>
            <a href="walkthrough.md#reverse-pyc" target="_blank" class="hint-link" style="margin-left: 15px;">View Walkthrough</a>
        </div>
        <div class="challenge-card">
            <h3>Forensics: Steganography</h3>
            <p>Extract hidden data from the steganography image file and uncover the secret flag.</p>
            <a href="../forensics-stego/hidden.jpg" target="_blank" class="hint-link">View Challenge</a>
            <a href="walkthrough.md#forensics-stego" target="_blank" class="hint-link" style="margin-left: 15px;">View Walkthrough</a>
        </div>
    </section>
</div>
</body>
</html>
