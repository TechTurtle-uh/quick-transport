// ===== MAP.JS — India-only Leaflet map with real OSRM routing =====

// Exact coordinates for every suggestion location
const CITY_COORDS = {
  'Connaught Place, Delhi':     [28.6315, 77.2167],
  'India Gate, Delhi':          [28.6129, 77.2295],
  'Red Fort, Delhi':            [28.6562, 77.2410],
  'Chandni Chowk, Delhi':       [28.6506, 77.2334],
  'Karol Bagh, Delhi':          [28.6514, 77.1907],
  'Saket Mall, Delhi':          [28.5244, 77.2066],
  'Hauz Khas Village, Delhi':   [28.5494, 77.2001],
  'Lajpat Nagar, Delhi':        [28.5665, 77.2431],
  'Janakpuri, Delhi':           [28.6289, 77.0862],
  'DLF Cyber City, Gurugram':   [28.4950, 77.0880],
  'Noida Sector 18':            [28.5706, 77.3219],
  'IGI Airport Terminal 3':     [28.5562, 77.0999],
  'New Delhi Railway Station':  [28.6431, 77.2194],
  'Hazrat Nizamuddin Station':  [28.5885, 77.2520],
  'Rohini Sector 5, Delhi':     [28.7150, 77.1100],
  'Dwarka Sector 12, Delhi':    [28.5921, 77.0460],
  'Vasant Kunj, Delhi':         [28.5200, 77.1580],
  'Greater Kailash 1, Delhi':   [28.5492, 77.2378],
  'Pitampura, Delhi':           [28.6985, 77.1420],
  'Mayur Vihar Phase 1, Delhi': [28.6088, 77.2954],
  'Current Location':           [28.6139, 77.2090],
};

// India bounding box — map cannot pan outside India
const INDIA_BOUNDS = L.latLngBounds(
  L.latLng(6.0,  68.0),   // SW corner
  L.latLng(37.5, 97.5)    // NE corner
);
const INDIA_CENTER = [22.5, 80.0];
const INDIA_ZOOM   = 5;

// Map & layer state
window.qtMap       = null;
let pickupMarker   = null;
let dropMarker     = null;
let vehicleMarker  = null;
let routeLayer     = null;
let animInterval   = null;
let animStep       = 0;
let animPoints     = [];
let pickupCoords   = null;
let dropCoords     = null;

// ── Icon factory ─────────────────────────────────────────────────
function makeIcon(emoji, size) {
  size = size || 30;
  return L.divIcon({
    html: '<div style="font-size:' + size + 'px;line-height:1;' +
          'filter:drop-shadow(0 2px 6px rgba(0,0,0,0.55))">' + emoji + '</div>',
    className: '',
    iconAnchor: [size / 2, size],
    iconSize:   [size, size],
    popupAnchor:[0, -size],
  });
}

// ── Init map ──────────────────────────────────────────────────────
function initMap() {
  if (window.qtMap) return;

  window.qtMap = L.map('realMap', {
    center:         INDIA_CENTER,
    zoom:           INDIA_ZOOM,
    minZoom:        4,
    maxZoom:        18,
    maxBounds:      INDIA_BOUNDS,
    maxBoundsViscosity: 1.0,
    zoomControl:    true,
    attributionControl: true,
  });

  // CartoDB Positron — clean, fast, India roads are accurate
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains:  'abcd',
      maxZoom:     19,
    }
  ).addTo(window.qtMap);

  // Constrain view to India
  window.qtMap.setMaxBounds(INDIA_BOUNDS);
}

// ── Coordinate lookup ─────────────────────────────────────────────
function getCoords(name, latOverride, lngOverride) {
  if (latOverride !== undefined) return [latOverride, lngOverride];
  if (CITY_COORDS[name]) return CITY_COORDS[name];
  // fuzzy match
  const lower = name.toLowerCase();
  for (const key of Object.keys(CITY_COORDS)) {
    const kl = key.toLowerCase();
    if (kl.includes(lower) || lower.includes(kl.split(',')[0])) {
      return CITY_COORDS[key];
    }
  }
  // fallback: Delhi centre
  return [28.6139, 77.2090];
}

// ── Set pickup pin ────────────────────────────────────────────────
function setPickupOnMap(name, lat, lng) {
  if (!window.qtMap) initMap();
  pickupCoords = getCoords(name, lat, lng);
  if (pickupMarker) window.qtMap.removeLayer(pickupMarker);
  pickupMarker = L.marker(pickupCoords, { icon: makeIcon('📍', 34) })
    .addTo(window.qtMap)
    .bindTooltip('<b>Pickup:</b> ' + name, { direction: 'top', permanent: false });
  if (!dropCoords) window.qtMap.setView(pickupCoords, 13);
  tryDrawRoute();
}

// ── Set drop pin ──────────────────────────────────────────────────
function setDropOnMap(name, lat, lng) {
  if (!window.qtMap) initMap();
  dropCoords = getCoords(name, lat, lng);
  if (dropMarker) window.qtMap.removeLayer(dropMarker);
  dropMarker = L.marker(dropCoords, { icon: makeIcon('🏁', 34) })
    .addTo(window.qtMap)
    .bindTooltip('<b>Drop:</b> ' + name, { direction: 'top', permanent: false });
  if (!pickupCoords) window.qtMap.setView(dropCoords, 13);
  tryDrawRoute();
}

// ── Fetch real road route from OSRM ──────────────────────────────
function tryDrawRoute() {
  if (!pickupCoords || !dropCoords) return;

  // Clean old route + animation
  if (routeLayer)  { window.qtMap.removeLayer(routeLayer); routeLayer = null; }
  stopAnim();

  const [lat1, lon1] = pickupCoords;
  const [lat2, lon2] = dropCoords;
  const url = 'https://router.project-osrm.org/route/v1/driving/' +
    lon1 + ',' + lat1 + ';' + lon2 + ',' + lat2 +
    '?overview=full&geometries=geojson';

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.code !== 'Ok' || !data.routes || !data.routes.length) {
        drawStraightLine(); // fallback
        return;
      }
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      drawRoute(coords);

      // Update distance from actual route
      const distKm = +(data.routes[0].distance / 1000).toFixed(1);
      if (window.bookingData) window.bookingData.distance = distKm;
      if (typeof updateMapInfo === 'function') updateMapInfo();
      const distEl = document.getElementById('rsDist');
      if (distEl) distEl.innerHTML = 'Est. distance: <span>' + distKm + ' km</span>';
      const cfDistEl = document.getElementById('cfDist');
      if (cfDistEl) cfDistEl.textContent = distKm + ' km';
    })
    .catch(() => drawStraightLine());
}

// ── Draw route polyline & start vehicle animation ─────────────────
function drawRoute(coords) {
  // Outer glow line
  L.polyline(coords, {
    color:     '#000',
    weight:    8,
    opacity:   0.15,
  }).addTo(window.qtMap);

  // Main orange route line
  routeLayer = L.polyline(coords, {
    color:     '#F7A700',
    weight:    5,
    opacity:   0.9,
    lineJoin:  'round',
    lineCap:   'round',
  }).addTo(window.qtMap);

  window.qtMap.fitBounds(routeLayer.getBounds().pad(0.15));

  animPoints = coords;
  placeVehicle(coords[0]);
  setTimeout(startAnim, 600);
}

function drawStraightLine() {
  const pts = [pickupCoords, dropCoords];
  routeLayer = L.polyline(pts, {
    color: '#F7A700', weight: 4,
    dashArray: '10,8', opacity: 0.8,
  }).addTo(window.qtMap);
  window.qtMap.fitBounds(
    L.latLngBounds(pickupCoords, dropCoords).pad(0.2)
  );
  animPoints = pts;
  placeVehicle(pts[0]);
  setTimeout(startAnim, 600);
}

// ── Vehicle marker ────────────────────────────────────────────────
function getVehicleEmoji() {
  const sel = document.querySelector('input[name=vehicle]:checked');
  return { Bike:'🏍️', Auto:'🛺', Car:'🚗', SUV:'🚙' }[sel ? sel.value : 'Car'] || '🚗';
}

function placeVehicle(latlng) {
  if (vehicleMarker) window.qtMap.removeLayer(vehicleMarker);
  vehicleMarker = L.marker(latlng, {
    icon: makeIcon(getVehicleEmoji(), 32),
    zIndexOffset: 1000,
  }).addTo(window.qtMap);
}

function updateVehicleOnMap() {
  if (vehicleMarker) vehicleMarker.setIcon(makeIcon(getVehicleEmoji(), 32));
}

// ── Animation along route ─────────────────────────────────────────
function startAnim() {
  if (!animPoints.length || !vehicleMarker) return;
  stopAnim();
  animStep = 0;
  animInterval = setInterval(() => {
    if (!vehicleMarker) return;
    if (animStep >= animPoints.length) { animStep = 0; }
    vehicleMarker.setLatLng(animPoints[animStep]);
    animStep++;
  }, 150);
}

function stopAnim() {
  if (animInterval) { clearInterval(animInterval); animInterval = null; }
  if (vehicleMarker) { window.qtMap.removeLayer(vehicleMarker); vehicleMarker = null; }
}

// ── Boot map on page load ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
});
