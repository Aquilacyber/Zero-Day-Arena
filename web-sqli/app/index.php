<?php
$db = new SQLite3('db.sqlite');
$message = '';
if (isset($_POST['username']) && isset($_POST['password'])) {
    $user = $_POST['username'];
    $pass = $_POST['password'];
    $query = "SELECT * FROM users WHERE username = '$user' AND password = '$pass'";
    $result = $db->query($query);
    if ($result->fetchArray()) {
        $message = "<div class='success'><h2>Welcome Admin</h2><p>Flag: " . file_get_contents("flag.txt") . "</p></div>";
    } else {
        $message = "<div class='error'>Invalid credentials</div>";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AquilaCyber Web SQLi Challenge</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      background: linear-gradient(135deg, #0e0e0e 60%, #00ffff 100%);
      color: #f0f0f0;
      font-family: 'Inter', Arial, sans-serif;
      min-height: 100vh;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: #181c20cc;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,255,255,0.15);
      padding: 32px 28px 24px 28px;
      max-width: 350px;
      width: 100%;
      margin: 32px auto;
      text-align: center;
    }
    h1 {
      color: #00ffff;
      margin-bottom: 8px;
      font-size: 2rem;
      letter-spacing: 1px;
    }
    .subtitle {
      color: #ff6f61;
      margin-bottom: 24px;
      font-size: 1.1rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 12px;
    }
    input[type="text"], input[type="password"] {
      padding: 10px;
      border-radius: 8px;
      border: none;
      background: #23272b;
      color: #f0f0f0;
      font-size: 1rem;
      outline: none;
      transition: box-shadow 0.2s, background 0.2s;
    }
    input[type="text"] {
      background: #fff;
      color: #23272b;
    }
    input[type="text"]:focus {
      box-shadow: 0 0 0 2px #00ffff;
      background: #e6fcff;
      color: #181c20;
    }
    input[type="password"]:focus {
      box-shadow: 0 0 0 2px #00ffff;
      background: #23272b;
      color: #00ffff;
    }
    input[type="submit"] {
      background: linear-gradient(90deg, #00ffff, #ff6f61);
      color: #181c20;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      padding: 12px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    input[type="submit"]:hover {
      background: linear-gradient(90deg, #ff6f61, #00ffff);
      color: #0e0e0e;
    }
    .success {
      background: #00ffcc22;
      color: #00ffcc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      font-weight: bold;
    }
    .error {
      background: #ff6f6122;
      color: #ff6f61;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-weight: bold;
    }
    .footer {
      margin-top: 32px;
      color: #888;
      font-size: 0.95rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AquilaCyber Web SQLi</h1>
    <div class="subtitle">Login to find the flag!<br><span style="font-size:0.95em; color:#2b030b;">(Hint: Try SQL Injection)</span></div>
    <?php if ($message) echo $message; ?>
    <form method="post" autocomplete="off">
      <input name="username" type="text" placeholder="Username" autocomplete="off">
      <input name="password" type="password" placeholder="Password" autocomplete="off">
      <input type="submit" value="Login">
    </form>
  </div>
  <div class="footer">&copy; 2025 AquilaCyber CTF Lab</div>
</body>
</html>
