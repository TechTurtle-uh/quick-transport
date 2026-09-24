<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Invalid request method'], 405);
}

$conn = getDB();

$first_name      = sanitize($conn, $_POST['first_name'] ?? '');
$last_name       = sanitize($conn, $_POST['last_name'] ?? '');
$email           = sanitize($conn, $_POST['email'] ?? '');
$phone           = sanitize($conn, $_POST['phone'] ?? '');
$password        = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';

// ---- Validation ----
$errors = [];
if (strlen($first_name) < 2)            $errors[] = 'First name must be at least 2 characters';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email address';
if (strlen(preg_replace('/\D/','',$phone)) < 10) $errors[] = 'Invalid phone number';
if (strlen($password) < 8)             $errors[] = 'Password must be at least 8 characters';
if ($password !== $confirm_password)   $errors[] = 'Passwords do not match';

if ($errors) {
    jsonResponse(['success' => false, 'message' => implode('. ', $errors)], 422);
}

// Check duplicate email
$res = $conn->query("SELECT id FROM users WHERE email = '$email' LIMIT 1");
if ($res && $res->num_rows > 0) {
    jsonResponse(['success' => false, 'message' => 'An account with this email already exists'], 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$wallet = 100.00; // Welcome bonus

$stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, phone, password, wallet_balance, created_at) VALUES (?,?,?,?,?,?,NOW())");
$stmt->bind_param('sssssd', $first_name, $last_name, $email, $phone, $hash, $wallet);

if ($stmt->execute()) {
    $user_id = $conn->insert_id;

    // Log welcome bonus transaction
    $conn->query("INSERT INTO transactions (user_id, type, label, amount, method, created_at)
                  VALUES ($user_id, 'credit', 'Welcome Bonus', 100.00, 'Wallet', NOW())");

    $_SESSION['user_id'] = $user_id;
    $_SESSION['user_name'] = $first_name;
    jsonResponse(['success' => true, 'message' => 'Account created successfully! Welcome bonus ₹100 added.', 'redirect' => '../home.html']);
} else {
    jsonResponse(['success' => false, 'message' => 'Registration failed. Please try again.'], 500);
}

$conn->close();
