<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Invalid request method'], 405);
}

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized. Please login.'], 401);
}

$conn   = getDB();
$uid    = (int)$_SESSION['user_id'];

$pickup    = sanitize($conn, $_POST['pickup']   ?? '');
$dropoff   = sanitize($conn, $_POST['dropoff']  ?? '');
$vehicle   = sanitize($conn, $_POST['vehicle']  ?? '');
$date_time = sanitize($conn, $_POST['datetime'] ?? '');
$payment   = sanitize($conn, $_POST['payment']  ?? 'Cash');
$distance  = (float)($_POST['distance'] ?? 0);
$fare      = (float)($_POST['fare']     ?? 0);

// Validation
$validVehicles = ['Bike','Auto','Car','SUV'];
if (!$pickup || !$dropoff)                       jsonResponse(['success'=>false,'message'=>'Pickup and dropoff are required'],422);
if (!in_array($vehicle, $validVehicles))          jsonResponse(['success'=>false,'message'=>'Invalid vehicle type'],422);
if ($distance <= 0 || $fare <= 0)                jsonResponse(['success'=>false,'message'=>'Invalid fare calculation'],422);

// Generate booking ID
$booking_id = 'QT-' . date('Ymd') . '-' . str_pad(rand(1,999), 3, '0', STR_PAD_LEFT);

// Assign mock driver
$drivers = ['Rajesh Kumar','Amit Singh','Suresh Yadav','Vikram Malhotra','Pradeep Chauhan'];
$driver  = $drivers[array_rand($drivers)];

$scheduled_at = $date_time ? "'$date_time'" : 'NOW()';

$stmt = $conn->prepare("INSERT INTO rides
    (booking_id, user_id, pickup, dropoff, vehicle, distance, fare, payment_method, driver_name, status, scheduled_at, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,'completed',NOW(),NOW())");
$stmt->bind_param('sissssdss', $booking_id, $uid, $pickup, $dropoff, $vehicle, $distance, $fare, $payment, $driver);

if (!$stmt->execute()) {
    jsonResponse(['success'=>false,'message'=>'Booking failed. Please try again.'],500);
}

$ride_id = $conn->insert_id;

// Record transaction
$label = "Ride: " . substr($pickup,0,25) . " → " . substr($dropoff,0,25);
$conn->query("INSERT INTO transactions (user_id, ride_id, type, label, amount, method, created_at)
              VALUES ($uid, $ride_id, 'debit', '$label', $fare, '$payment', NOW())");

// Deduct from wallet if Wallet payment
if ($payment === 'Wallet') {
    $res = $conn->query("SELECT wallet_balance FROM users WHERE id=$uid");
    $row = $res->fetch_assoc();
    $new_bal = max(0, $row['wallet_balance'] - $fare);
    $conn->query("UPDATE users SET wallet_balance=$new_bal WHERE id=$uid");
}

jsonResponse([
    'success'    => true,
    'message'    => 'Ride booked successfully!',
    'booking_id' => $booking_id,
    'driver'     => $driver,
    'ride_id'    => $ride_id
]);

$conn->close();
