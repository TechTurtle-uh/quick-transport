// ===== HISTORY.JS =====
let allRides = [];
let cancelTargetId = null;

document.addEventListener('DOMContentLoaded', () => {
  allRides = getRides();
  renderStats();
  renderRides(allRides);
});

function renderStats() {
  const completed = allRides.filter(r => r.status === 'completed');
  const cancelled = allRides.filter(r => r.status === 'cancelled');
  document.getElementById('totalRides').textContent = allRides.length;
  document.getElementById('totalSpent').textContent = '₹' + completed.reduce((s,r)=>s+r.fare,0);
  document.getElementById('totalKms').textContent = completed.reduce((s,r)=>s+(r.distance||0),0).toFixed(0);
  document.getElementById('cancelledRides').textContent = cancelled.length;
}

function renderRides(rides) {
  const container = document.getElementById('ridesContainer');
  if (!rides.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="es-icon">🚗</span>
        <h3>No rides found</h3>
        <p>Try changing your filters or book your first ride</p>
        <a href="book.html" class="btn-primary">Book a Ride</a>
      </div>`;
    return;
  }
  container.innerHTML = rides.map(r => `
    <div class="ride-card" onclick="showDetail('${r.id}')">
      <div class="rc-icon">${vehicleIcon(r.vehicle)}</div>
      <div class="rc-info">
        <div class="rc-route">
          ${r.pickup.split(',')[0]} → ${r.dropoff.split(',')[0]}
          ${statusBadge(r.status)}
        </div>
        <div class="rc-meta">
          <span>📅 ${fmtDate(r.date)}</span>
          <span>${vehicleIcon(r.vehicle)} ${r.vehicle}</span>
          <span>📏 ${r.distance} km</span>
          <span>💳 ${r.payment}</span>
          ${r.driver ? `<span>👤 ${r.driver}</span>` : ''}
        </div>
      </div>
      <div class="rc-right">
        <span class="rc-fare">₹${r.fare}</span>
        <div class="rc-actions" onclick="event.stopPropagation()">
          <button class="btn-details" onclick="showDetail('${r.id}')">Details</button>
          ${r.status === 'completed' || r.status === 'ongoing'
            ? `<button class="btn-cancel" onclick="openCancelModal('${r.id}')">Cancel</button>`
            : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function filterRides() {
  const q = document.getElementById('searchRides').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const vehicle = document.getElementById('filterVehicle').value;
  const sort = document.getElementById('filterSort').value;

  let filtered = [...allRides];
  if (q) filtered = filtered.filter(r =>
    r.pickup.toLowerCase().includes(q) ||
    r.dropoff.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q)
  );
  if (status) filtered = filtered.filter(r => r.status === status);
  if (vehicle) filtered = filtered.filter(r => r.vehicle === vehicle);

  if (sort === 'newest') filtered.sort((a,b) => new Date(b.date)-new Date(a.date));
  else if (sort === 'oldest') filtered.sort((a,b) => new Date(a.date)-new Date(b.date));
  else if (sort === 'fare-high') filtered.sort((a,b) => b.fare-a.fare);
  else if (sort === 'fare-low') filtered.sort((a,b) => a.fare-b.fare);

  renderRides(filtered);
}

function openCancelModal(id) {
  cancelTargetId = id;
  showModal('cancelModal');
}
function closeCancelModal() { closeModal('cancelModal'); cancelTargetId = null; }

function confirmCancel() {
  if (!cancelTargetId) return;
  const rides = getRides();
  const ride = rides.find(r => r.id === cancelTargetId);
  if (ride) {
    ride.status = 'cancelled';
    setRides(rides);
    // Add transaction for cancellation fee
    const txns = getTransactions();
    txns.unshift({
      id: 'TXN-' + Date.now(), type: 'debit',
      label: `Cancellation fee: ${ride.pickup.split(',')[0]} → ${ride.dropoff.split(',')[0]}`,
      amount: 30, date: new Date().toISOString().replace('T',' ').slice(0,16),
      method: 'Wallet', icon: '✕'
    });
    setTransactions(txns);
  }
  closeModal('cancelModal');
  allRides = getRides();
  renderStats();
  filterRides();
  cancelTargetId = null;
}

function showDetail(id) {
  const ride = allRides.find(r => r.id === id);
  if (!ride) return;
  document.getElementById('rideDetailContent').innerHTML = `
    <div class="detail-section">
      <h4>Route</h4>
      <div class="detail-row"><span>From</span><span>${ride.pickup}</span></div>
      <div class="detail-row"><span>To</span><span>${ride.dropoff}</span></div>
      <div class="detail-row"><span>Distance</span><span>${ride.distance} km</span></div>
    </div>
    <div class="detail-section">
      <h4>Trip Details</h4>
      <div class="detail-row"><span>Booking ID</span><span>${ride.id}</span></div>
      <div class="detail-row"><span>Date & Time</span><span>${fmtDate(ride.date)}</span></div>
      <div class="detail-row"><span>Vehicle</span><span>${vehicleIcon(ride.vehicle)} ${ride.vehicle}</span></div>
      <div class="detail-row"><span>Status</span><span>${statusBadge(ride.status)}</span></div>
    </div>
    ${ride.driver ? `
    <div class="detail-section">
      <h4>Driver</h4>
      <div class="detail-row"><span>Name</span><span>${ride.driver}</span></div>
      ${ride.plate ? `<div class="detail-row"><span>Vehicle No.</span><span>${ride.plate}</span></div>` : ''}
      ${ride.rating ? `<div class="detail-row"><span>Rating</span><span>⭐ ${ride.rating}</span></div>` : ''}
    </div>` : ''}
    <div class="detail-section">
      <h4>Payment</h4>
      <div class="detail-row"><span>Method</span><span>${ride.payment}</span></div>
      <div class="detail-row"><span>Fare</span><span style="font-weight:700;color:var(--accent)">₹${ride.fare}</span></div>
    </div>
    ${ride.status === 'completed' || ride.status === 'ongoing' ? `
    <div class="modal-actions" style="margin-top:0">
      <button class="btn-danger" onclick="openCancelModal('${ride.id}');closeDetailModal()">Cancel Ride</button>
    </div>` : ''}
  `;
  showModal('rideDetailModal');
}
function closeDetailModal() { closeModal('rideDetailModal'); }
