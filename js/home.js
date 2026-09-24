// ===== HOME.JS =====
const LOCATIONS = [
  'Connaught Place, Delhi','India Gate, Delhi','Red Fort, Delhi',
  'Chandni Chowk, Delhi','Karol Bagh, Delhi','Saket, Delhi',
  'Hauz Khas, Delhi','Lajpat Nagar, Delhi','Janakpuri, Delhi',
  'DLF Cyber City, Gurugram','Noida Sector 18','IGI Airport T3',
  'New Delhi Railway Station','Hazrat Nizamuddin Station',
  'Rohini, Delhi','Dwarka, Delhi','Vasant Kunj, Delhi',
];

document.addEventListener('DOMContentLoaded', () => {
  loadRecentRides();
  animateStats();
  // Set min date for booking
  const dateInput = document.getElementById('rideDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
});

function loadRecentRides() {
  const container = document.getElementById('recentRides');
  if (!container) return;
  const rides = getRides().filter(r => r.status !== 'cancelled').slice(0, 3);
  if (!rides.length) {
    container.innerHTML = `<div class="empty-state"><span class="es-icon">🚗</span><h3>No rides yet</h3><p>Book your first ride!</p><a href="book.html" class="btn-primary">Book Now</a></div>`;
    return;
  }
  container.innerHTML = rides.map(r => `
    <div class="ride-item" onclick="window.location='history.html'">
      <div class="ri-icon">${vehicleIcon(r.vehicle)}</div>
      <div class="ri-info">
        <div class="ri-route">${r.pickup} → ${r.dropoff}</div>
        <div class="ri-meta">${vehicleIcon(r.vehicle)} ${r.vehicle} &nbsp;•&nbsp; 📅 ${fmtDate(r.date)} &nbsp;•&nbsp; ${statusBadge(r.status)}</div>
      </div>
      <div class="ri-fare">₹${r.fare}</div>
    </div>
  `).join('');
}

function animateStats() {
  const rides = getRides();
  const total = rides.length;
  const spent = rides.filter(r=>r.status==='completed').reduce((s,r)=>s+r.fare,0);
  // Just for display, the static HTML already has values
}

function quickBook() {
  const p = document.getElementById('qbPickup').value.trim();
  const d = document.getElementById('qbDrop').value.trim();
  if (!p || !d) {
    alert('Please enter both pickup and drop locations');
    return;
  }
  sessionStorage.setItem('qt_pickup', p);
  sessionStorage.setItem('qt_drop', d);
  window.location.href = 'book.html';
}

function bookVehicle(type) {
  sessionStorage.setItem('qt_vehicle', type);
  window.location.href = 'book.html';
}
