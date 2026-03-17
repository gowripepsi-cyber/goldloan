// ============================================================
//  payments.js  –  Due Collection + Jewel Redemption
// ============================================================
const Payments = {

  // ── Due Collection ────────────────────────────────────────
  renderDueCollection() {
    const el = document.getElementById('page-due-collection');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-money-bill-wave"></i> Due Collection</h2>
      </div>
      <div class="card mb16">
        <div class="card-body">
          <div class="search-row">
            <div class="search-box wide"><i class="fas fa-search"></i>
              <input type="text" id="dc-search" placeholder="Search by name, mobile, or Loan ID…" oninput="Payments.searchLoans(this.value)">
            </div>
            <select id="dc-status" class="filter-select" onchange="Payments.searchLoans(document.getElementById('dc-search').value)">
              <option value="">All Active</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Active">Active</option>
            </select>
          </div>
        </div>
      </div>
      <div id="collection-cards" class="loan-cards-grid"></div>`;
    this.searchLoans('');
  },

  searchLoans(term) {
    const status = document.getElementById('dc-status')?.value;
    let loans = DB.getAll(DB.LOANS).filter(l => l.status !== 'Closed');
    if (term) {
      const t = term.toLowerCase();
      loans = loans.filter(l =>
        l.id.toLowerCase().includes(t) ||
        App.custName(l.customerId).toLowerCase().includes(t) ||
        App.custMobile(l.customerId).includes(t)
      );
    }
    if (status) loans = loans.filter(l => App.loanStatus(l).label === status);
    loans.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

    const grid = document.getElementById('collection-cards');
    if (!loans.length) { grid.innerHTML = '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><p>No active loans found</p></div>'; return; }

    grid.innerHTML = loans.map(l => {
      const st = App.loanStatus(l);
      const accrued = App.calcInterest(l);
      const paid    = App.totalPaid(l.id);
      const balance = l.principal + accrued - paid;
      const c       = DB.findById(DB.CUSTOMERS, l.customerId);
      return `
        <div class="loan-card ${st.cls.replace('badge-','')}">
          <div class="lc-header">
            <div>
              <div class="lc-id">${l.id}</div>
              <div class="lc-name">${c?.name || '—'}</div>
              <div class="lc-mobile">${c?.mobile || '—'}</div>
            </div>
            <span class="badge ${st.cls}">${st.label}</span>
          </div>
          <div class="lc-body">
            <div class="lc-row"><span>Principal</span><strong>${App.fmt(l.principal)}</strong></div>
            <div class="lc-row"><span>Interest Accrued</span><strong class="text-gold">${App.fmt(accrued)}</strong></div>
            <div class="lc-row"><span>Total Paid</span><strong class="text-green">${App.fmt(paid)}</strong></div>
            <div class="lc-row lc-total"><span>Balance Due</span><strong>${App.fmt(Math.max(0,balance))}</strong></div>
            <div class="lc-row"><span>Due Date</span><span>${App.fmtDate(l.dueDate)}</span></div>
          </div>
          <div class="lc-actions">
            <button class="btn btn-gold btn-full" onclick="Payments.openCollection('${l.id}')">
              <i class="fas fa-rupee-sign"></i> Collect Payment
            </button>
          </div>
        </div>`;
    }).join('');
  },

  openCollection(loanId) {
    const l = DB.findById(DB.LOANS, loanId);
    if (!l) return;
    const c       = DB.findById(DB.CUSTOMERS, l.customerId);
    const accrued = App.calcInterest(l);
    const paid    = App.totalPaid(loanId);
    const balance = Math.max(0, l.principal + accrued - paid);
    const accounts= DB.getAll(DB.ACCOUNTS);

    App.openModal(`Collect Payment — ${loanId}`, `
      <div class="collection-summary">
        <div class="cs-row"><span>Customer</span><strong>${c?.name||'—'} (${c?.mobile||'—'})</strong></div>
        <div class="cs-row"><span>Principal Outstanding</span><strong>${App.fmt(l.principal)}</strong></div>
        <div class="cs-row"><span>Interest Accrued</span><strong class="text-gold">${App.fmt(accrued)}</strong></div>
        <div class="cs-row"><span>Total Paid So Far</span><strong class="text-green">${App.fmt(paid)}</strong></div>
        <div class="cs-row cs-total"><span>Total Balance Due</span><strong>${App.fmt(balance)}</strong></div>
      </div>
      <form id="payment-form" onsubmit="Payments.savePayment(event,'${loanId}',false)">
        <div class="form-row">
          <div class="form-group"><label>Collection Date *</label><input name="date" type="date" value="${App.today()}" required></div>
          <div class="form-group"><label>Payment Method *</label>
            <select name="method" required>
              <option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Amount Collected (₹) *</label>
            <input name="amount" type="number" min="1" step="0.01" value="${balance.toFixed(2)}" required id="pay-amount" oninput="Payments.liveBalance(${balance})">
          </div>
          <div class="form-group"><label>Discount / Benefit (₹)</label>
            <input name="discount" type="number" min="0" step="0.01" value="0" id="pay-discount" oninput="Payments.liveBalance(${balance})">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Settle to Account *</label>
            <select name="settleToAccount" required>
              ${accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Payment Type *</label>
            <select name="type" required>
              <option>Interest</option><option>Principal</option><option>Full Settlement</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label>Remarks</label><input name="remarks" type="text" placeholder="Optional remarks"></div>
        <div class="live-balance" id="live-balance">Remaining after payment: <strong>${App.fmt(balance)}</strong></div>
      </form>`,
      `<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
       <button class="btn btn-gold" onclick="document.getElementById('payment-form').requestSubmit()"><i class="fas fa-save"></i> Save Payment</button>`);
  },

  liveBalance(totalDue) {
    const amt  = parseFloat(document.getElementById('pay-amount')?.value  || 0);
    const disc = parseFloat(document.getElementById('pay-discount')?.value || 0);
    const remaining = Math.max(0, totalDue - amt - disc);
    const el = document.getElementById('live-balance');
    if (el) el.innerHTML = `Remaining after payment: <strong>${App.fmt(remaining)}</strong>`;
  },

  savePayment(e, loanId, isRedemption) {
    e.preventDefault();
    const l  = DB.findById(DB.LOANS, loanId);
    const fd = new FormData(e.target);
    const d  = Object.fromEntries(fd.entries());
    const accrued = App.calcInterest(l);
    const paid    = App.totalPaid(loanId);
    const balance = Math.max(0, l.principal + accrued - paid);
    const payment = {
      id: DB.genId('PAY', DB.PAYMENTS),
      loanId, date: d.date, amount: parseFloat(d.amount),
      method: d.method, discount: parseFloat(d.discount||0),
      settleToAccount: d.settleToAccount, type: d.type,
      remarks: d.remarks || '', runningBalance: Math.max(0, balance - parseFloat(d.amount))
    };
    DB.add(DB.PAYMENTS, payment);

    // Close loan if full settlement or balance zero
    const newBalance = balance - payment.amount - payment.discount;
    if (d.type === 'Full Settlement' || newBalance <= 0 || isRedemption) {
      DB.update(DB.LOANS, loanId, { status: 'Closed' });
      App.toast(`Loan ${loanId} closed — jewel released!`, 'success');
    } else {
      App.toast(`Payment of ${App.fmt(payment.amount)} recorded!`);
    }
    App.closeModal();
    this.printPaymentReceipt(payment, l);
    if (isRedemption) this.renderRedemption(); else this.searchLoans('');
  },

  // ── Jewel Redemption ──────────────────────────────────────
  renderRedemption() {
    const el = document.getElementById('page-redemption');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-unlock"></i> Jewel Redemption</h2>
      </div>
      <div class="card mb16">
        <div class="card-body">
          <div class="search-box wide"><i class="fas fa-search"></i>
            <input type="text" id="redeem-search" placeholder="Search by name, mobile, or Loan ID…" oninput="Payments.searchRedemption(this.value)">
          </div>
        </div>
      </div>
      <div id="redemption-cards" class="loan-cards-grid"></div>`;
    this.searchRedemption('');
  },

  searchRedemption(term) {
    let loans = DB.getAll(DB.LOANS).filter(l => l.status !== 'Closed');
    if (term) {
      const t = term.toLowerCase();
      loans = loans.filter(l =>
        l.id.toLowerCase().includes(t) ||
        App.custName(l.customerId).toLowerCase().includes(t) ||
        App.custMobile(l.customerId).includes(t)
      );
    }
    const grid = document.getElementById('redemption-cards');
    if (!loans.length) { grid.innerHTML = '<div class="empty-state"><i class="fas fa-unlock"></i><p>No active loans</p></div>'; return; }
    grid.innerHTML = loans.map(l => {
      const st = App.loanStatus(l);
      const accrued = App.calcInterest(l);
      const paid    = App.totalPaid(l.id);
      const balance = Math.max(0, l.principal + accrued - paid);
      const c = DB.findById(DB.CUSTOMERS, l.customerId);
      return `
        <div class="loan-card redemption-card">
          <div class="lc-header">
            <div><div class="lc-id">${l.id}</div><div class="lc-name">${c?.name||'—'}</div></div>
            <span class="badge ${st.cls}">${st.label}</span>
          </div>
          <div class="lc-body">
            <div class="lc-row"><span>Principal</span><strong>${App.fmt(l.principal)}</strong></div>
            <div class="lc-row"><span>Total Interest Accrued</span><strong class="text-gold">${App.fmt(accrued)}</strong></div>
            <div class="lc-row"><span>Total Paid</span><strong class="text-green">${App.fmt(paid)}</strong></div>
            <div class="lc-row lc-total"><span>Settlement Amount</span><strong>${App.fmt(balance)}</strong></div>
            ${l.goldItems.map(g=>`<div class="lc-row"><span>${g.type}</span><span>${g.netWeight}g ${g.purity}</span></div>`).join('')}
          </div>
          <div class="lc-actions">
            <button class="btn btn-success btn-full" onclick="Payments.openRedemption('${l.id}')">
              <i class="fas fa-unlock"></i> Redeem Jewel
            </button>
          </div>
        </div>`;
    }).join('');
  },

  openRedemption(loanId) {
    const l = DB.findById(DB.LOANS, loanId);
    if (!l) return;
    const c     = DB.findById(DB.CUSTOMERS, l.customerId);
    const accrued = App.calcInterest(l);
    const paid  = App.totalPaid(loanId);
    const balance = Math.max(0, l.principal + accrued - paid);
    const accounts= DB.getAll(DB.ACCOUNTS);

    App.openModal(`Jewel Redemption — ${loanId}`, `
      <div class="collection-summary">
        <div class="cs-row"><span>Customer</span><strong>${c?.name||'—'}</strong></div>
        <div class="cs-row"><span>Gold Items</span><strong>${l.goldItems.map(g=>g.type).join(', ')}</strong></div>
        <div class="cs-row"><span>Settle Amount</span><strong class="text-gold">${App.fmt(balance)}</strong></div>
      </div>
      <form id="payment-form" onsubmit="Payments.savePayment(event,'${loanId}',true)">
        <div class="form-row">
          <div class="form-group"><label>Redemption Date *</label><input name="date" type="date" value="${App.today()}" required></div>
          <div class="form-group"><label>Payment Method *</label>
            <select name="method" required><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option></select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Amount Received (₹) *</label>
            <input name="amount" type="number" min="1" step="0.01" value="${balance.toFixed(2)}" required>
          </div>
          <div class="form-group"><label>Discount (₹)</label>
            <input name="discount" type="number" min="0" step="0.01" value="0">
          </div>
        </div>
        <input type="hidden" name="type" value="Full Settlement">
        <div class="form-group"><label>Settle to Account *</label>
          <select name="settleToAccount" required>
            ${accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Remarks</label><input name="remarks" type="text" placeholder="e.g. Loan closed, gold returned"></div>
      </form>`,
      `<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
       <button class="btn btn-success" onclick="document.getElementById('payment-form').requestSubmit()"><i class="fas fa-unlock"></i> Redeem & Close Loan</button>`);
  },

  printPaymentReceipt(payment, loan) {
    const c = DB.findById(DB.CUSTOMERS, loan.customerId);
    const s = DB.get(DB.SETTINGS) || {};
    App.printWindow(`
      <div class="header">
        <h1>${s.shopName||'Gold Loan Manager'}</h1>
        <p>${s.address||''} | Ph: ${s.phone||''}</p>
      </div>
      <h2>PAYMENT RECEIPT — ${payment.id}</h2>
      <div class="info-box">
        <div class="info-row"><span class="label">Loan ID</span><span class="value">${payment.loanId}</span></div>
        <div class="info-row"><span class="label">Customer</span><span class="value">${c?.name||'—'} (${c?.mobile||'—'})</span></div>
        <div class="info-row"><span class="label">Date</span><span class="value">${App.fmtDate(payment.date)}</span></div>
        <div class="info-row"><span class="label">Payment Type</span><span class="value">${payment.type}</span></div>
        <div class="info-row"><span class="label">Method</span><span class="value">${payment.method}</span></div>
        <div class="info-row"><span class="label">Amount Paid</span><span class="value" style="font-size:20px;font-weight:700">${App.fmt(payment.amount)}</span></div>
        ${payment.discount ? `<div class="info-row"><span class="label">Discount</span><span class="value">${App.fmt(payment.discount)}</span></div>` : ''}
        <div class="info-row"><span class="label">Balance</span><span class="value">${App.fmt(payment.runningBalance)}</span></div>
        ${payment.remarks ? `<div class="info-row"><span class="label">Remarks</span><span class="value">${payment.remarks}</span></div>` : ''}
      </div>
      <p style="margin-top:40px">Signature: _______________________</p>
      <div class="footer"><p>${s.receiptFooter||''}</p></div>`);
  }
};
