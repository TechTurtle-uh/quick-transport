// ===== QUICK TRANSPORT — APP.JS =====

// MOCK DATA
const MOCK_USER = {
  id: 1,
  first_name: 'Arjun',
  last_name: 'Sharma',
  email: 'arjun@example.com',
  phone: '+91 98765 43210',
  wallet: 750.00
};

const MOCK_RIDES = [
  { id: 'QT-20250628-001', pickup: 'Connaught Place, Delhi', dropoff: 'India Gate, Delhi', vehicle: 'Car', fare: 185, distance: 8.5, status: 'completed', date: '2025-06-28 14:30', driver: 'Rajesh Kumar', rating: 4.8, payment: 'UPI' },
  { id: 'QT-20250627-002', pickup: 'Karol Bagh Metro, Delhi', dropoff: 'Saket Mall, Delhi', vehicle: 'Bike', fare: 67, distance: 9.2, status: 'completed', date: '2025-06-27 09:15', driver: 'Amit Singh', rating: 4.9, payment: 'Cash' },
  { id: 'QT-20250626-003', pickup: 'Chandni Chowk, Delhi', dropoff: 'Lajpat Nagar, Delhi', vehicle: 'Auto', fare: 120, distance: 8.0, status: 'cancelled', date: '2025-06-26 18:45', driver: 'Suresh Yadav', rating: null, payment: 'Wallet' },
  { id: 'QT-20250625-004', pickup: 'DLF Cyber City, Gurugram', dropoff: 'Airport Terminal 3', vehicle: 'SUV', fare: 520, distance: 20.5, status: 'completed', date: '2025-06-25 06:00', driver: 'Vikram Malhotra', rating: 5.0, payment: 'Card' },
  { id: 'QT-20250624-005', pickup: 'Noida Sector 18', dropoff: 'CP Metro Gate 1', vehicle: 'Car', fare: 280, distance: 18.2, status: 'completed', date: '2025-06-24 11:30', driver: 'Pradeep Chauhan', rating: 4.7, payment: 'UPI' },
  { id: 'QT-20250623-006', pickup: 'Hauz Khas Village', dropoff: 'IGI Airport T2', vehicle: 'Car', fare: 340, distance: 22.0, status: 'completed', date: '2025-06-23 04:00', driver: 'Deepak Verma', rating: 4.6, payment: 'Wallet' },
];

const MOCK_TRANSACTIONS = [
  { id: 'TXN-001', type: 'debit', label: 'Ride: CP → India Gate', amount: 185, date: '2025-06-28 14:32', method: 'UPI', icon: '🚗' },
  { id: 'TXN-002', type: 'credit', label: 'Wallet Top-up', amount: 500, date: '2025-06-28 09:00', method: 'UPI', icon: '💳' },
  { id: 'TXN-003', type: 'debit', label: 'Ride: Karol Bagh → Saket', amount: 67, date: '2025-06-27 09:17', method: 'Cash', icon: '🏍️' },
  { id: 'TXN-004', type: 'refund', label: 'Refund: Cancelled Ride', amount: 30, date: '2025-06-26 19:00', method: 'Wallet', icon: '↩️' },
  { id: 'TXN-005', type: 'debit', label: 'Ride: Cyber City → Airport', amount: 520, date: '2025-06-25 06:05', method: 'Card', icon: '🚙' },
  { id: 'TXN-006', type: 'credit', label: 'Promo Cashback RIDE20', amount: 20, date: '2025-06-24 11:35', method: 'Wallet', icon: '🎁' },
];

// ===== UTILS =====
function getUser() {
  const stored = localStorage.getItem('qt_user');
  return stored ? JSON.parse(stored) : null;
}
function setUser(u) {
  localStorage.setItem('qt_user', JSON.stringify(u));
}
function getRides() {
  const stored = localStorage.getItem('qt_rides');
  return stored ? JSON.parse(stored) : [...MOCK_RIDES];
}
function setRides(r) {
  localStorage.setItem('qt_rides', JSON.stringify(r));
}
function getTransactions() {
  const stored = localStorage.getItem('qt_transactions');
  return stored ? JSON.parse(stored) : [...MOCK_TRANSACTIONS];
}
function setTransactions(t) {
  localStorage.setItem('qt_transactions', JSON.stringify(t));
}
function getWallet() {
  return parseFloat(localStorage.getItem('qt_wallet') || MOCK_USER.wallet);
}
function setWallet(v) {
  localStorage.setItem('qt_wallet', v.toFixed(2));
}

// ===== AUTH GUARD =====
function checkAuth() {
  // For demo: initialize user if not set
  if (!getUser()) {
    setUser(MOCK_USER);
    if (!localStorage.getItem('qt_rides')) setRides(MOCK_RIDES);
    if (!localStorage.getItem('qt_transactions')) setTransactions(MOCK_TRANSACTIONS);
    if (!localStorage.getItem('qt_wallet')) setWallet(MOCK_USER.wallet);
  }
  return getUser();
}

// ===== NAVBAR =====
function initNav() {
  const user = checkAuth();
  const avatar = document.getElementById('userAvatar');
  const nameEl = document.getElementById('navUserName');
  if (user) {
    if (avatar) avatar.textContent = user.first_name ? user.first_name[0].toUpperCase() : 'U';
    if (nameEl) nameEl.textContent = user.first_name || 'User';
  }
  // Scroll effect
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}

function toggleNav() {
  document.querySelector('.navbar').classList.toggle('open');
}

// ===== MODAL UTILS =====
function showModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('hidden'); document.body.style.overflow='hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('hidden'); document.body.style.overflow=''; }
}

// ===== VEHICLE ICONS =====
function vehicleIcon(type) {
  return { Bike: '🏍️', Auto: '🛺', Car: '🚗', SUV: '🚙' }[type] || '🚗';
}

// ===== STATUS BADGE =====
function statusBadge(status) {
  const icons = { completed: '✓', cancelled: '✕', ongoing: '▶', pending: '⏳' };
  return `<span class="badge ${status}">${icons[status]||''} ${status.charAt(0).toUpperCase()+status.slice(1)}</span>`;
}

// ===== DATE FORMAT =====
function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// Init on every page
document.addEventListener('DOMContentLoaded', initNav);

// ===== LOGOUT (works without PHP) =====
function logoutUser() {
  localStorage.removeItem('qt_user');
  localStorage.removeItem('qt_rides');
  localStorage.removeItem('qt_transactions');
  localStorage.removeItem('qt_wallet');
  window.location.href = 'index.html';
}
