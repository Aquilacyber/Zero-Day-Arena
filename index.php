<?php include '.secret/flags.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AquilaCyber CTF Lab - Dashboard</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            background: linear-gradient(135deg, #0e0e0e, #1a1a1a);
            color: #f0f0f0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        header {
            background: linear-gradient(90deg, #111, #222);
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        header h1 {
            margin: 0;
            font-size: 2rem;
            color: #00ffff;
            text-shadow: 0 0 10px #00ffff;
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { text-shadow: 0 0 10px #00ffff; }
            to { text-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff; }
        }
        nav a {
            color: #00ffff;
            margin-left: 20px;
            text-decoration: none;
            font-weight: bold;
            padding: 8px 16px;
            border-radius: 5px;
            transition: all 0.3s ease;
            border: 1px solid transparent;
        }
        nav a:hover {
            color: #ff6f61;
            background-color: rgba(255, 111, 97, 0.1);
            border-color: #ff6f61;
            transform: translateY(-2px);
        }
        .welcome {
            text-align: center;
            font-size: 1.5rem;
            color: #ff6f61;
            margin-bottom: 20px;
            animation: fadeIn 1s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .progress {
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0, 255, 255, 0.2);
            animation: slideIn 1s ease-out;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .progress h2 {
            color: #ff6f61;
            margin-bottom: 20px;
            font-size: 1.8rem;
            text-align: center;
        }
        .progress ul {
            list-style: none;
            padding-left: 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
        }
        .progress li {
            background: #333;
            padding: 15px;
            border-radius: 10px;
            font-size: 1rem;
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .progress li:hover {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(255, 111, 97, 0.5);
        }
        .flag-input {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .flag-input input {
            flex: 1;
            padding: 8px;
            border: 1px solid #00ffff;
            border-radius: 5px;
            background: #1a1a1a;
            color: #f0f0f0;
            font-size: 0.9rem;
        }
        .flag-input button {
            padding: 8px 12px;
            background: #00ffff;
            color: #0e0e0e;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .flag-input button:hover {
            background: #ff6f61;
            transform: translateY(-2px);
        }
        .completed {
            color: #00ff00;
            font-weight: bold;
        }
        .challenges {
            animation: slideIn 1s ease-out 0.5s both;
        }
        .challenges h2 {
            color: #00ffff;
            margin-bottom: 20px;
            font-size: 2rem;
            text-align: center;
            text-shadow: 0 0 10px #00ffff;
        }
        .challenge-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .challenge-card {
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 255, 255, 0.2);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .challenge-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
            transition: left 0.5s ease;
        }
        .challenge-card:hover::before {
            left: 100%;
        }
        .challenge-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0, 255, 255, 0.4);
        }
        .challenge-card h3 {
            margin: 0 0 15px 0;
            color: #ff6f61;
            font-size: 1.3rem;
        }
        .challenge-card p {
            margin: 0 0 15px 0;
            font-size: 1rem;
            line-height: 1.5;
        }
        .hint-links {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .hint-link {
            color: #00ffff;
            text-decoration: none;
            padding: 8px 12px;
            border: 1px solid #00ffff;
            border-radius: 5px;
            transition: all 0.3s ease;
            font-size: 0.9rem;
        }
        .hint-link:hover {
            background-color: #00ffff;
            color: #0e0e0e;
            transform: translateY(-2px);
        }
        @media (max-width: 768px) {
            header {
                flex-direction: column;
                gap: 15px;
            }
            header h1 {
                font-size: 1.5rem;
            }
            .container {
                padding: 15px;
            }
            .challenge-grid {
                grid-template-columns: 1fr;
            }
            .progress ul {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>AquilaCyber CTF Lab - Dashboard</h1>
        <nav>
            <a href="homepage/index.html">Home</a>
            <a href="settings.php">Settings</a>
        </nav>
    </header>
    <div class="container">
        <div class="welcome">
            Welcome! Ready to dive into the challenges?
        </div>

        <section class="progress">
            <h2>Your Progress</h2>
            <ul>
                <li id="web-sqli">Web: SQL Injection Challenge - <strong>Not Started</strong>
                    <div class="flag-input">
                        <input type="text" id="flag-web-sqli" placeholder="Enter flag">
                        <button onclick="checkFlag('web-sqli')">Submit</button>
                    </div>
                </li>
                <li id="crypto-xor">Crypto: XOR Challenge - <strong>Not Started</strong>
                    <div class="flag-input">
                        <input type="text" id="flag-crypto-xor" placeholder="Enter flag">
                        <button onclick="checkFlag('crypto-xor')">Submit</button>
                    </div>
                </li>
                <li id="reverse-pyc">Reverse Engineering: CrackMe - <strong>Not Started</strong>
                    <div class="flag-input">
                        <input type="text" id="flag-reverse-pyc" placeholder="Enter flag">
                        <button onclick="checkFlag('reverse-pyc')">Submit</button>
                    </div>
                </li>
                <li id="forensics-stego">Forensics: Steganography - <strong>Not Started</strong>
                    <div class="flag-input">
                        <input type="text" id="flag-forensics-stego" placeholder="Enter flag">
                        <button onclick="checkFlag('forensics-stego')">Submit</button>
                    </div>
                </li>
            </ul>
        </section>

        <section class="challenges">
            <h2>Challenges</h2>
            <div class="challenge-grid">
                <div class="challenge-card">
                    <h3>Web: SQL Injection Challenge</h3>
                    <p>Explore the web application vulnerable to SQL injection attacks. Use your skills to bypass authentication or extract sensitive data.</p>
                    <div class="hint-links">
                        <a href="http://localhost:5001" target="_blank" class="hint-link">Open Challenge</a>
                        <!-- <a href="walkthrough.md#web-sqli" target="_blank" class="hint-link">View Walkthrough</a> -->
                    </div>
                </div>
                <div class="challenge-card">
                    <h3>Crypto: XOR Challenge</h3>
                    <p>Analyze the XOR encryption Python script and decrypt the ciphertext to find the hidden flag.</p>
                    <div class="hint-links">
                        <a href="http://localhost:5002" target="_blank" class="hint-link">Open Challenge</a>
                        <!-- <a href="walkthrough.md#crypto-xor" target="_blank" class="hint-link">View Walkthrough</a> -->
                    </div>
                </div>
                <div class="challenge-card">
                    <h3>Reverse Engineering: CrackMe</h3>
                    <p>Reverse engineer the Python CrackMe script to find the correct input and reveal the flag.</p>
                    <div class="hint-links">
                        <a href="http://localhost:5003" target="_blank" class="hint-link">Open Challenge</a>
                        <!-- <a href="walkthrough.md#reverse-pyc" target="_blank" class="hint-link">View Walkthrough</a> -->
                    </div>
                </div>
                <div class="challenge-card">
                    <h3>Forensics: Steganography</h3>
                    <p>Extract hidden data from the steganography image file and uncover the secret flag.</p>
                    <div class="hint-links">
                        <a href="http://localhost:5004" target="_blank" class="hint-link">Open Challenge</a>
                        <!-- <a href="walkthrough.md#forensics-stego" target="_blank" class="hint-link">View Walkthrough</a> -->
                    </div>
                </div>
            </div>
        </section>
    </div>
    <script>
        const flags = <?php echo json_encode($flags); ?>;
        function checkFlag(challengeId) {
            const input = document.getElementById(`flag-${challengeId}`);
            const li = document.getElementById(challengeId);
            const button = li.querySelector('button');
            const strong = li.querySelector('strong');
            const correctFlag = flags[challengeId];

            if (input.value.trim() === correctFlag) {
                strong.textContent = 'Completed';
                strong.className = 'completed';
                input.disabled = true;
                button.disabled = true;
                button.textContent = '✅';
                alert('Correct! Flag submitted successfully.');
            } else {
                alert('Incorrect flag. Try again.');
            }
        }
    </script>
</body>
</html>
