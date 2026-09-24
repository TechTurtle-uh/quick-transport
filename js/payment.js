// ===== PAYMENT.JS =====
const PROMOS = {
  'FIRST50': { label: '50% off first ride', discount: 50, type: 'percent', walletCredit: 0 },
  'RIDE20':  { label: '₹20 off any ride',   discount: 20, type: 'flat',    walletCredit: 0 },
  'QT100':   { label: '₹100 wallet bonus',  discount: 0,  type: 'wallet',  walletCredit: 100 },
};

let currentTab = 'transactions';

document.addEventListener('DOMContentLoaded', () => {
  updateWalletDisplay();
  renderSummaryBar();
  renderTransactions('transactions');
});

function updateWalletDisplay() {
  const w = getWallet();
  document.getElementById('walletBalance').textContent = w.toFixed(2);
}

function renderSummaryBar() {
  const txns = getTransactions();
  const income  = txns.filter(t=>t.type==='credit').reduce((s,t)=>s+t.amount,0);
  const expense = txns.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0);
  const savings = txns.filter(t=>t.type==='refund').reduce((s,t)=>s+t.amount,0);
  document.getElementById('totalIncome').textContent  = '₹'+income;
  document.getElementById('totalExpense').textContent = '₹'+expense;
  document.getElementById('totalSavings').textContent = '₹'+savings;
}

function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.ptab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTransactions(tab);
}

function renderTransactions(tab) {
  const container = document.getElementById('transactionsList');
  let txns = getTransactions();

  if (tab === 'pending') {
    // Mock a couple pending
    txns = [
      { id:'P-001', type:'debit', label:'Ride in progress: Karol Bagh → Saket', amount:85, date: new Date().toISOString().replace('T',' ').slice(0,16), method:'UPI', icon:'🚗' }
    ];
  } else if (tab === 'refunds') {
    txns = txns.filter(t => t.type === 'refund');
  }

  if (!txns.length) {
    container.innerHTML = `<div class="empty-state"><span class="es-icon">💳</span><h3>No ${tab} found</h3><p>Your ${tab} will appear here</p></div>`;
    return;
  }

  container.innerHTML = txns.map(t => `
    <div class="tx-item">
      <div class="tx-icon ${t.type}">${t.icon || (t.type==='credit'?'↓':t.type==='refund'?'↩':'↑')}</div>
      <div class="tx-info">
        <b>${t.label}</b>
        <span>${fmtDate(t.date)} &nbsp;•&nbsp; ${t.method}</span>
      </div>
      <div class="tx-amount ${t.type}">
        <b>${t.type==='debit'?'-':'+'} ₹${t.amount}</b>
        <span>${t.id}</span>
      </div>
    </div>
  `).join('');
}

// ===== ADD MONEY =====
function openAddMoney() { showModal('addMoneyModal'); }

function setAmount(val) {
  document.getElementById('addMoneyAmt').value = val;
  document.querySelectorAll('.amount-chip').forEach(c => {
    c.classList.toggle('selected', parseInt(c.textContent.replace('₹','')) === val);
  });
}

function processAddMoney() {
  const amt = parseFloat(document.getElementById('addMoneyAmt').value);
  if (!amt || amt < 1) { alert('Enter a valid amount'); return; }
  const method = document.querySelector('input[name=addMethod]:checked');
  const meth = method ? method.value : 'UPI';

  // Simulate payment processing
  const btn = document.querySelector('#addMoneyModal .btn-primary');
  btn.textContent = 'Processing...'; btn.disabled = true;

  setTimeout(() => {
    // Add to wallet
    const w = getWallet();
    setWallet(w + amt);
    updateWalletDisplay();

    // Add transaction
    const txns = getTransactions();
    txns.unshift({
      id: 'TXN-' + Date.now(), type: 'credit',
      label: 'Wallet Top-up', amount: amt,
      date: new Date().toISOString().replace('T',' ').slice(0,16),
      method: meth, icon: '💳'
    });
    setTransactions(txns);
    renderSummaryBar();

    closeModal('addMoneyModal');
    btn.textContent = 'Proceed to Pay'; btn.disabled = false;
    document.getElementById('addMoneyAmt').value = '';
    document.querySelectorAll('.amount-chip').forEach(c=>c.classList.remove('selected'));

    document.getElementById('paySuccessTitle').textContent = 'Money Added!';
    document.getElementById('paySuccessMsg').textContent = `₹${amt.toFixed(2)} added to your wallet via ${meth}`;
    showModal('paySuccessModal');
    renderTransactions(currentTab);
  }, 1500);
}

function openWithdraw() {
  alert('Withdrawal feature coming soon! Funds can be used for rides.');
}

// ===== PROMO =====
function fillPromo(code) {
  document.getElementById('promoCode').value = code;
  applyPromo();
}

function applyPromo() {
  const code = document.getElementById('promoCode').value.trim().toUpperCase();
  const msg = document.getElementById('promoMsg');
  const promo = PROMOS[code];
  if (!promo) {
    msg.textContent = '✕ Invalid promo code'; msg.className = 'promo-msg err'; return;
  }
  if (promo.type === 'wallet' && promo.walletCredit > 0) {
    const w = getWallet();
    setWallet(w + promo.walletCredit);
    updateWalletDisplay();
    const txns = getTransactions();
    txns.unshift({
      id:'TXN-'+Date.now(), type:'credit',
      label:`Promo Cashback ${code}`, amount: promo.walletCredit,
      date: new Date().toISOString().replace('T',' ').slice(0,16),
      method:'Wallet', icon:'🎁'
    });
    setTransactions(txns);
    renderTransactions(currentTab);
    renderSummaryBar();
    msg.textContent = `✓ ${promo.label} — ₹${promo.walletCredit} added to wallet!`;
  } else {
    msg.textContent = `✓ ${promo.label} — Applied on next ride!`;
  }
  msg.className = 'promo-msg ok';
}

// ===== UPI =====
function addUpi() {
  const upi = prompt('Enter your UPI ID (e.g. name@upi):');
  if (upi && upi.includes('@')) {
    alert(`UPI ID "${upi}" added successfully!`);
  } else if (upi) {
    alert('Please enter a valid UPI ID');
  }
}

// ===== CARD =====
function openAddCard() { showModal('addCardModal'); }

function formatCard(inp) {
  let v = inp.value.replace(/\D/g,'').slice(0,16);
  inp.value = v.replace(/(.{4})/g,'$1 ').trim();
  const last4 = v.slice(-4) || '0000';
  document.getElementById('cpLast4').textContent = last4;
}

function formatExpiry(inp) {
  let v = inp.value.replace(/\D/g,'').slice(0,4);
  if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2);
  inp.value = v;
  document.getElementById('cpExp').textContent = v || 'MM/YY';
}

function updateCardPreview() {
  const name = document.getElementById('cardName').value || 'Card Holder';
  document.getElementById('cpName').textContent = name.toUpperCase();
}

function saveCard() {
  const num = document.getElementById('cardNumber').value.replace(/\s/g,'');
  const exp = document.getElementById('cardExpiry').value;
  const cvv = document.getElementById('cardCvv').value;
  const name = document.getElementById('cardName').value.trim();

  if (num.length < 16) { alert('Enter a valid 16-digit card number'); return; }
  if (!/^\d{2}\/\d{2}$/.test(exp)) { alert('Enter valid expiry (MM/YY)'); return; }
  if (cvv.length < 3) { alert('Enter valid CVV'); return; }
  if (!name) { alert('Enter name on card'); return; }

  const btn = document.querySelector('#addCardModal .btn-primary');
  btn.textContent = 'Saving...'; btn.disabled = true;

  setTimeout(() => {
    closeModal('addCardModal');
    btn.textContent = 'Save Card'; btn.disabled = false;
    // Clear fields
    ['cardNumber','cardExpiry','cardCvv','cardName'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('cpLast4').textContent = '0000';
    document.getElementById('cpName').textContent = 'Card Holder';
    document.getElementById('cpExp').textContent = 'MM/YY';

    document.getElementById('paySuccessTitle').textContent = 'Card Added!';
    document.getElementById('paySuccessMsg').textContent = `Card ending in ${num.slice(-4)} saved securely`;
    showModal('paySuccessModal');
  }, 1000);
}
