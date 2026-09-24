<?php
// ===== cancel_ride.php =====
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['success'=>false,'message'=>'Invalid method'],405);
if (!isset($_SESSION['user_id']))           jsonResponse(['success'=>false,'message'=>'Unauthorized'],401);

$conn = getDB();
$uid  = (int)$_SESSION['user_id'];
$rid  = sanitize($conn, $_POST['ride_id'] ?? '');

if (!$rid) jsonResponse(['success'=>false,'message'=>'Ride ID required'],422);

// Verify ownership
$res = $conn->query("SELECT id, status, payment_method, fare FROM rides WHERE booking_id='$rid' AND user_id=$uid LIMIT 1");
if (!$res || $res->num_rows===0) jsonResponse(['success'=>false,'message'=>'Ride not found'],404);

$ride = $res->fetch_assoc();
if ($ride['status'] === 'cancelled') jsonResponse(['success'=>false,'message'=>'Ride already cancelled'],409);

// Apply cancellation
$conn->query("UPDATE rides SET status='cancelled', updated_at=NOW() WHERE id={$ride['id']}");

// Cancellation fee ₹30
$fee = 30;
$conn->query("INSERT INTO transactions (user_id, ride_id, type, label, amount, method, created_at)
              VALUES ($uid, {$ride['id']}, 'debit', 'Cancellation fee', $fee, 'Wallet', NOW())");

// If paid by wallet/UPI/card, issue refund minus fee
if (in_array($ride['payment_method'], ['Wallet','UPI','Card'])) {
    $refund = max(0, $ride['fare'] - $fee);
    if ($refund > 0 && $ride['payment_method'] === 'Wallet') {
        $conn->query("UPDATE users SET wallet_balance = wallet_balance + $refund WHERE id=$uid");
        $conn->query("INSERT INTO transactions (user_id, ride_id, type, label, amount, method, created_at)
                      VALUES ($uid, {$ride['id']}, 'refund', 'Ride cancellation refund', $refund, 'Wallet', NOW())");
    }
}

jsonResponse(['success'=>true,'message'=>'Ride cancelled successfully']);
$conn->close();
