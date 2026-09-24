// ===== HELP.JS =====

document.addEventListener('DOMContentLoaded', () => {
  // nothing extra needed — FAQs are static HTML
});

function toggleFAQ(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  // Open clicked if it was closed
  if (!isOpen) item.classList.add('open');
}

function searchFAQ() {
  const q = document.getElementById('helpSearch').value.toLowerCase();
  document.querySelectorAll('.faq-item').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(q) ? '' : 'none';
    if (q && text.includes(q)) item.classList.add('open');
    else if (q && !text.includes(q)) item.classList.remove('open');
  });
}

function filterFAQ(cat) {
  document.getElementById('helpSearch').value = '';
  document.querySelectorAll('.faq-item').forEach(item => {
    const itemCat = item.dataset.cat;
    item.style.display = (itemCat === cat || !cat) ? '' : 'none';
    item.classList.remove('open');
  });
  // Highlight active filter button
  document.querySelectorAll('.help-quick button').forEach(b => b.style.borderColor = '');
}

// ===== LIVE CHAT =====
const BOT_REPLIES = {
  'book': 'To book a ride, go to the "Book Ride" page. Enter your pickup and drop locations, choose a vehicle, and confirm!',
  'cancel': 'You can cancel a ride from the Ride History page. A ₹30 cancellation fee may apply if a driver is already assigned.',
  'payment': 'We accept Cash, UPI, Credit/Debit Cards, and QT Wallet. You can manage payment methods in the Payments section.',
  'refund': 'Refunds are processed within 3–5 business days for card/UPI payments. Wallet refunds are instant.',
  'promo': 'Active promo codes: FIRST50 (50% off first ride), RIDE20 (₹20 off), QT100 (₹100 wallet bonus).',
  'driver': 'All our drivers are background-verified and trained. You can rate your driver after each completed ride.',
  'wallet': 'Your QT Wallet can be topped up via UPI, Card, or Net Banking. Use it for instant, seamless payments.',
  'safety': 'Your safety is our priority. All drivers are verified. Use the SOS button during any ride for emergency help.',
  'hello': "Hi there! 👋 I'm the Quick Transport support bot. How can I help you today?",
  'hi': "Hello! 👋 How can I assist you with Quick Transport?",
  'thanks': "You're welcome! Is there anything else I can help you with?",
  'help': 'I can help with booking rides, cancellations, payments, refunds, promo codes, safety, and more. What do you need?',
};

function openLiveChat() {
  document.getElementById('chatWidget').classList.remove('hidden');
  document.getElementById('chatInput').focus();
}

function closeLiveChat() {
  document.getElementById('chatWidget').classList.add('hidden');
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  addChatMsg(msg, 'user');
  input.value = '';

  // Bot reply
  setTimeout(() => {
    const lower = msg.toLowerCase();
    let reply = "I'll connect you with a support agent shortly. Is there anything else I can help with?";
    for (const [key, val] of Object.entries(BOT_REPLIES)) {
      if (lower.includes(key)) { reply = val; break; }
    }
    addChatMsg(reply, 'bot');
  }, 700);
}

function addChatMsg(text, role) {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `cw-msg ${role}`;
  div.innerHTML = `<div class="cw-bubble">${text}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ===== CONTACT FORM =====
function submitContact() {
  const subject = document.getElementById('subject').value;
  const desc = document.getElementById('issueDesc').value.trim();
  const alert = document.getElementById('contactAlert');

  if (!subject) { showContactAlert('error', 'Please select a subject'); return; }
  if (!desc || desc.length < 20) { showContactAlert('error', 'Please describe your issue in at least 20 characters'); return; }

  const btn = document.querySelector('#contactForm .btn-primary');
  btn.textContent = 'Submitting...'; btn.disabled = true;

  setTimeout(() => {
    showContactAlert('success', '✓ Support ticket created! We\'ll respond within 24 hours. Ticket ID: #QT' + Math.floor(Math.random()*90000+10000));
    document.getElementById('contactForm').reset();
    btn.textContent = 'Submit Request'; btn.disabled = false;
  }, 1200);
}

function showContactAlert(type, msg) {
  const el = document.getElementById('contactAlert');
  el.className = `alert ${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
