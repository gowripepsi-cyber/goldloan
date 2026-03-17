// ============================================================
//  app.js  –  Core: auth, routing, utilities, shared helpers
// ============================================================
const App = {
  currentPage: 'dashboard',

  init() {
    DB.init();
    this.setHeaderDate();
    this.checkSession();
  },

  setHeaderDate() {
    const el = document.getElementById('header-date');
    if (el) el.textContent = new Date().toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
  },

  checkSession() {
    const s = DB.get(DB.SESSION);
    if (s && s.userId) { this.showApp(s); this.navigate(s.lastPage || 'dashboard'); }
    else this.showLogin();
  },

  login(username, password) {
    const user = DB.getAll(DB.USERS).find(u => u.username === username && u.password === password);
    if (!user) return false;
    const s = { userId:user.id, username:user.username, name:user.name, role:user.role, lastPage:'dashboard' };
    DB.set(DB.SESSION, s);
    this.showApp(s);
    this.navigate('dashboard');
    return true;
  },

  logout() {
    DB.set(DB.SESSION, null);
    this.showLogin();
  },

  showApp(session) {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    const s = session || DB.get(DB.SESSION);
    if (!s) return;
    const nm = s.name || 'User';
    document.getElementById('header-user-name').textContent = nm;
    document.getElementById('sidebar-user-name').textContent = nm;
    document.getElementById('sidebar-user-role').textContent = s.role === 'admin' ? 'Administrator' : 'Staff';
    const settings = DB.get(DB.SETTINGS);
    if (settings) document.getElementById('sidebar-shop-name').textContent = settings.shopName;
    if (typeof I18n !== 'undefined') I18n.apply();
  },

  showLogin() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    const f = document.getElementById('login-form');
    if (f) f.reset();
  },

  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(`page-${page}`);
    if (target) { target.classList.remove('hidden'); this.currentPage = page; }

    document.querySelectorAll('.nav-item, .nav-sub-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));

    // Open parent nav-group if sub-item active
    const subItem = document.querySelector(`.nav-sub-item[data-page="${page}"]`);
    if (subItem) {
      const group = subItem.closest('.nav-group');
      if (group) group.classList.add('open');
    }

    const s = DB.get(DB.SESSION);
    if (s) { s.lastPage = page; DB.set(DB.SESSION, s); }

    const labels = { dashboard:'Dashboard', customers:'Customers', 'new-loan':'New Pawn', loans:'All Loans',
      'due-collection':'Due Collection', redemption:'Jewel Redemption', accounts:'Bank Accounts',
      pledges:'Bank Pledges', expenses:'Income & Expenses', reports:'Reports', settings:'Settings' };
    const bc = document.getElementById('breadcrumb');
    const bcLabel = (typeof I18n !== 'undefined') ? I18n.t('page-' + page) : (labels[page] || page);
    if (bc) bc.innerHTML = `<span>${bcLabel}</span>`;

    this.renderPage(page);
  },

  renderPage(page) {
    const map = {
      'dashboard':      () => Dashboard.render(),
      'customers':      () => Customers.render(),
      'new-loan':       () => Loans.renderNew(),
      'loans':          () => Loans.renderList(),
      'due-collection': () => Payments.renderDueCollection(),
      'redemption':     () => Payments.renderRedemption(),
      'accounts':       () => Finance.renderAccounts(),
      'pledges':        () => Finance.renderPledges(),
      'expenses':       () => Finance.renderExpenses(),
      'reports':        () => Reports.render(),
      'settings':       () => Settings.render()
    };
    if (map[page]) map[page]();
  },

  // ── Modal ─────────────────────────────────────────────────
  openModal(title, bodyHtml, footerHtml = '') {
    document.getElementById('modal-title').textContent  = title;
    document.getElementById('modal-body').innerHTML     = bodyHtml;
    document.getElementById('modal-footer').innerHTML  = footerHtml;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },
  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  },

  // ── Toast ─────────────────────────────────────────────────
  toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    const icons = { success:'check-circle', error:'times-circle', warning:'exclamation-triangle', info:'info-circle' };
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="fas fa-${icons[type]||'info-circle'}"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
  },

  // ── Helpers ───────────────────────────────────────────────
  fmt(n) {
    const s = DB.get(DB.SETTINGS);
    return `${s?.currency || '₹'}${parseFloat(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  },
  fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
  },
  today() {
    return new Date().toISOString().split('T')[0];
  },
  calcInterest(loan) {
    const ld = new Date(loan.loanDate), now = new Date();
    const months = Math.max(1, (now.getFullYear() - ld.getFullYear())*12 + (now.getMonth() - ld.getMonth()));
    return loan.interestMode === 'percentage'
      ? loan.principal * (loan.interestRate / 100) * months
      : loan.interestRate * months;
  },
  totalPaid(loanId) {
    return DB.getAll(DB.PAYMENTS).filter(p => p.loanId === loanId).reduce((s,p) => s + p.amount, 0);
  },
  loanStatus(loan) {
    if (loan.status === 'Closed') return { label:'Closed', cls:'badge-closed' };
    const diff = Math.floor((new Date(loan.dueDate) - new Date()) / 86400000);
    if (diff < 0)  return { label:'Overdue',  cls:'badge-overdue' };
    if (diff <= 7) return { label:'Due Soon',  cls:'badge-due-soon' };
    return { label:'Active', cls:'badge-active' };
  },
  custName(id) {
    const c = DB.findById(DB.CUSTOMERS, id); return c ? c.name : '—';
  },
  custMobile(id) {
    const c = DB.findById(DB.CUSTOMERS, id); return c ? c.mobile : '—';
  },

  // ── Print helper ──────────────────────────────────────────
  printWindow(html) {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"><title>Print</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:Poppins,sans-serif;font-size:13px;color:#111;padding:20px}
        h1{font-size:18px;margin-bottom:4px}h2{font-size:15px;margin:12px 0 6px}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}
        th{background:#f59e0b;color:#fff}.badge{display:inline-block;padding:2px 8px;border-radius:9px;font-size:11px}
        .text-right{text-align:right}.total-row td{font-weight:700;background:#fff8e1}
        .header{border-bottom:2px solid #f59e0b;padding-bottom:10px;margin-bottom:16px}
        .footer{border-top:1px solid #ccc;margin-top:20px;padding-top:10px;font-size:11px;color:#666;text-align:center}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .info-box{background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:12px}
        .info-row{display:flex;justify-content:space-between;margin:4px 0}
        .label{color:#666}.value{font-weight:600}
        @media print{button{display:none}}
      </style></head><body>${html}
      <script>window.onload=()=>window.print();<\/script>
      </body></html>`);
    w.document.close();
  }
};

// ── Global event handlers ──────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in…';
  btn.disabled = true;
  setTimeout(() => {
    if (App.login(u, p)) {
      err.classList.add('hidden');
    } else {
      err.classList.remove('hidden');
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
      btn.disabled = false;
    }
  }, 600);
}

function togglePassword() {
  const inp = document.getElementById('login-password');
  const eye = document.getElementById('pw-eye');
  if (inp.type === 'password') { inp.type = 'text'; eye.className = 'fas fa-eye-slash'; }
  else { inp.type = 'password'; eye.className = 'fas fa-eye'; }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function toggleNavGroup(el) {
  el.closest('.nav-group').classList.toggle('open');
}

function handleModalOverlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) App.closeModal();
}

// Boot
window.addEventListener('DOMContentLoaded', () => { I18n.init(); App.init(); });
