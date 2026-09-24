// ===== AUTH.JS =====

function switchCard(type) {
  const login = document.getElementById('loginCard');
  const reg = document.getElementById('registerCard');
  if (type === 'register') {
    login.classList.add('hidden');
    reg.classList.remove('hidden');
    reg.style.animation = 'slideUp .4s cubic-bezier(.16,1,.3,1)';
  } else {
    reg.classList.add('hidden');
    login.classList.remove('hidden');
    login.style.animation = 'slideUp .4s cubic-bezier(.16,1,.3,1)';
  }
}

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type = 'password';
    btn.textContent = '👁';
  }
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}
function clearErrs(...ids) { ids.forEach(id => showErr(id, '')); }

// LOGIN
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  clearErrs('loginEmailErr', 'loginPasswordErr');
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPassword').value;
  let ok = true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('loginEmailErr', 'Enter a valid email address'); ok = false;
  }
  if (!pw || pw.length < 4) {
    showErr('loginPasswordErr', 'Password is required'); ok = false;
  }
  if (!ok) return;

  const btn = this.querySelector('button[type=submit]');
  btn.textContent = 'Signing in...'; btn.disabled = true;

  // Demo login
  setTimeout(() => {
    const stored = localStorage.getItem('qt_user');
    let user = stored ? JSON.parse(stored) : null;

    // For demo: accept any credentials and set up mock user
    if (!user) {
      user = {
        id: 1, first_name: 'Arjun', last_name: 'Sharma',
        email: email, phone: '+91 98765 43210', wallet: 750
      };
    }
    user.email = email;
    localStorage.setItem('qt_user', JSON.stringify(user));

    // Init rides/transactions if needed
    if (!localStorage.getItem('qt_rides')) {
      localStorage.setItem('qt_rides', JSON.stringify(window.MOCK_RIDES || []));
    }
    if (!localStorage.getItem('qt_wallet')) {
      localStorage.setItem('qt_wallet', '750.00');
    }

    showAlert('loginAlert', 'success', '✓ Welcome back! Redirecting...');
    setTimeout(() => window.location.href = 'home.html', 800);
  }, 900);
});

// REGISTER
document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const fields = {
    first_name: document.getElementById('regFirstName').value.trim(),
    last_name: document.getElementById('regLastName').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    phone: document.getElementById('regPhone').value.trim(),
    password: document.getElementById('regPassword').value,
    confirm: document.getElementById('regConfirm').value
  };
  clearErrs('regFirstNameErr','regEmailErr','regPhoneErr','regPasswordErr','regConfirmErr');
  let ok = true;

  if (!fields.first_name || fields.first_name.length < 2) {
    showErr('regFirstNameErr', 'Enter your first name'); ok = false;
  }
  if (!fields.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    showErr('regEmailErr', 'Enter a valid email'); ok = false;
  }
  if (!fields.phone || fields.phone.replace(/\D/g,'').length < 10) {
    showErr('regPhoneErr', 'Enter a valid phone number'); ok = false;
  }
  if (!fields.password || fields.password.length < 8) {
    showErr('regPasswordErr', 'Password must be at least 8 characters'); ok = false;
  }
  if (fields.password !== fields.confirm) {
    showErr('regConfirmErr', 'Passwords do not match'); ok = false;
  }
  if (!ok) return;

  const btn = this.querySelector('button[type=submit]');
  btn.textContent = 'Creating account...'; btn.disabled = true;

  setTimeout(() => {
    const user = {
      id: Date.now(),
      first_name: fields.first_name,
      last_name: fields.last_name,
      email: fields.email,
      phone: fields.phone,
      wallet: 100 // Welcome bonus
    };
    localStorage.setItem('qt_user', JSON.stringify(user));
    localStorage.setItem('qt_wallet', '100.00');
    localStorage.removeItem('qt_rides');
    localStorage.removeItem('qt_transactions');

    showAlert('registerAlert', 'success', '✓ Account created! Welcome bonus ₹100 added. Redirecting...');
    setTimeout(() => window.location.href = 'home.html', 1200);
  }, 1000);
});

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert ${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
}

// Auto-redirect if already logged in
document.addEventListener('DOMContentLoaded', () => {
  // For demo, always show login (don't auto-redirect)
});
