<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Invalid request method'], 405);
}

$conn = getDB();
$email    = sanitize($conn, $_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    jsonResponse(['success' => false, 'message' => 'Email and password are required'], 422);
}

$res = $conn->query("SELECT id, first_name, last_name, email, phone, password, wallet_balance FROM users WHERE email = '$email' LIMIT 1");
if (!$res || $res->num_rows === 0) {
    jsonResponse(['success' => false, 'message' => 'Invalid email or password'], 401);
}

$user = $res->fetch_assoc();
if (!password_verify($password, $user['password'])) {
    jsonResponse(['success' => false, 'message' => 'Invalid email or password'], 401);
}

// Update last login
$conn->query("UPDATE users SET last_login = NOW() WHERE id = {$user['id']}");

$_SESSION['user_id']    = $user['id'];
$_SESSION['user_name']  = $user['first_name'];
$_SESSION['user_email'] = $user['email'];

unset($user['password']); // Never return password hash
jsonResponse([
    'success'  => true,
    'message'  => 'Login successful',
    'user'     => $user,
    'redirect' => '../home.html'
]);

$conn->close();
