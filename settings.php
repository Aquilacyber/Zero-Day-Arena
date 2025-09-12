<?php
include 'includes/auth.php';
requireLogin();

include 'includes/auth_header.php';
?>

<h1>User Profile</h1>
<p>Welcome, <?php echo htmlspecialchars(currentUser()['username'] ?? 'Guest'); ?>!</p>

<?php
include 'includes/footer.php';
?>
