<?php
// ===== add_money.php — Wallet Top-up =====
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['success'=>false,'message'=>'Invalid method'],405);
if (!isset($_SESSION['user_id']))           jsonResponse(['success'=>false,'message'=>'Unauthorized'],401);

$conn   = getDB();
$uid    = (int)$_SESSION['user_id'];
$amount = (float)($_POST['amount'] ?? 0);
$method = sanitize($conn, $_POST['method'] ?? 'UPI');

if ($amount < 1 || $amount > 50000) jsonResponse(['success'=>false,'message'=>'Amount must be between ₹1 and ₹50,000'],422);

$validMethods = ['UPI','Card','NetBanking'];
if (!in_array($method, $validMethods)) jsonResponse(['success'=>false,'message'=>'Invalid payment method'],422);

// In production: integrate with payment gateway (Razorpay/PayU/Stripe) here
// For demo: directly credit wallet

$conn->query("UPDATE users SET wallet_balance = wallet_balance + $amount WHERE id=$uid");
$conn->query("INSERT INTO transactions (user_id, type, label, amount, method, created_at)
              VALUES ($uid, 'credit', 'Wallet Top-up', $amount, '$method', NOW())");

// Get new balance
$res = $conn->query("SELECT wallet_balance FROM users WHERE id=$uid");
$row = $res->fetch_assoc();

jsonResponse([
    'success'     => true,
    'message'     => "₹{$amount} added to your wallet successfully!",
    'new_balance' => $row['wallet_balance']
]);
$conn->close();
