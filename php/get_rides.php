<?php
// ===== get_rides.php =====
require_once 'config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) jsonResponse(['success'=>false,'message'=>'Unauthorized'],401);

$conn   = getDB();
$uid    = (int)$_SESSION['user_id'];
$status = sanitize($conn, $_GET['status'] ?? '');
$vehicle= sanitize($conn, $_GET['vehicle'] ?? '');
$sort   = sanitize($conn, $_GET['sort'] ?? 'newest');
$search = sanitize($conn, $_GET['search'] ?? '');

$where = ["user_id=$uid"];
if ($status)  $where[] = "status='$status'";
if ($vehicle) $where[] = "vehicle='$vehicle'";
if ($search)  $where[] = "(pickup LIKE '%$search%' OR dropoff LIKE '%$search%' OR booking_id LIKE '%$search%')";

$orderBy = match($sort) {
    'oldest'   => 'created_at ASC',
    'fare-high'=> 'fare DESC',
    'fare-low' => 'fare ASC',
    default    => 'created_at DESC'
};

$sql = "SELECT * FROM rides WHERE " . implode(' AND ', $where) . " ORDER BY $orderBy";
$res = $conn->query($sql);

$rides = [];
while ($row = $res->fetch_assoc()) $rides[] = $row;

jsonResponse(['success'=>true,'rides'=>$rides,'count'=>count($rides)]);
$conn->close();
