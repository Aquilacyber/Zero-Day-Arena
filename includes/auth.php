<?php
session_start();

function requireLogin() {
    if (!isset($_SESSION['user'])) {
        header('Location: login.php');
        exit();
    }
}

function currentUser() {
    return $_SESSION['user'] ?? null;
}

function isAdmin() {
    return isset($_SESSION['user']) && ($_SESSION['user']['role'] ?? '') === 'admin';
}
?>
