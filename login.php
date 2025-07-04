<?php
session_start();
if (isset($_SESSION['user'])) {
    header('Location: dashboard.php');
    exit();
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if ($username === 'admin' && $password === 'admin') {
        $_SESSION['user'] = ['username' => $username, 'role' => 'admin'];
        header('Location: dashboard.php');
        exit();
    } else {
        $error = 'Invalid username or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>AquilaCyber CTF Lab - Login</title>
    <style>
        body {
            background-color: #0e0e0e;
            color: #f0f0f0;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .login-container {
            background-color: #1a1a1a;
            padding: 30px 40px;
            border-radius: 12px;
            box-shadow: 0 0 15px #00ffff;
            width: 320px;
            text-align: center;
        }
        h1 {
            margin-bottom: 20px;
            color: #00ffff;
            text-shadow: 0 0 8px #00ffff;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px;
            margin: 10px 0 20px 0;
            border: none;
            border-radius: 6px;
            background-color: #0e0e0e;
            color: #f0f0f0;
            font-size: 1rem;
        }
        input[type="submit"] {
            background-color: #00ffff;
            border: none;
            padding: 12px;
            width: 100%;
            border-radius: 6px;
            font-weight: bold;
            color: #0e0e0e;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        input[type="submit"]:hover {
            background-color: #ff6f61;
            color: #fff;
        }
        .error {
            color: #ff6f61;
            margin-bottom: 15px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>AquilaCyber CTF Lab</h1>
        <form method="POST" action="login.php">
            <input type="text" name="username" placeholder="Username" required autofocus />
            <input type="password" name="password" placeholder="Password" required />
            <?php if ($error): ?>
                <div class="error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            <input type="submit" value="Login" />
        </form>
    </div>
</body>
</html>
