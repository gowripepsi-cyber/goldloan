// ============================================================
//  loans.js  –  New Pawn Entry + Loan List + View + Receipt
// ============================================================
const Loans = {
  itemCount: 1,

  // ── New Pawn Form ─────────────────────────────────────────
  renderNew() {
    const settings  = DB.get(DB.SETTINGS) || {};
    const customers = DB.getAll(DB.CUSTOMERS);
    const accounts  = DB.getAll(DB.ACCOUNTS);
    const today     = App.today();
    const dueDate   = new Date(); dueDate.setMonth(dueDate.getMonth() + (settings.defaultDuration||12));
    const dueDef    = dueDate.toISOString().split('T')[0];

    this.itemCount  = 1;
    const el = document.getElementById('page-new-loan');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-plus-circle"></i> New Pawn Entry</h2>
        <button class="btn btn-outline" onclick="App.navigate('loans')"><i class="fas fa-list"></i> View All Loans</button>
      </div>

      <form id="loan-form" onsubmit="Loans.saveLoan(event)">
        <!-- Customer -->
        <div class="card mb16">
          <div class="card-header"><h3><i class="fas fa-user"></i> Customer Details</h3></div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>Select Customer *</label>
                <select name="customerId" id="loan-customer" required onchange="Loans.fillCustomer(this.value)">
                  <option value="">— Select Customer —</option>
                  ${customers.map(c => `<option value="${c.id}">${c.name} — ${c.mobile}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Customer Info</label>
                <div id="cust-info-box" class="info-inline">Select a customer above</div>
              </div>
              <div class="form-group" style="flex:0 0 auto;align-self:flex-end">
                <button type="button" class="btn btn-outline" onclick="Loans.quickAddCustomer()">
                  <i class="fas fa-user-plus"></i> New Customer
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Gold Items -->
        <div class="card mb16">
          <div class="card-header">
            <h3><i class="fas fa-gem"></i> Gold Items</h3>
            <button type="button" class="btn btn-sm btn-gold" onclick="Loans.addItemRow()"><i class="fas fa-plus"></i> Add Item</button>
          </div>
          <div class="card-body p0">
            <div class="table-responsive">
              <table class="data-table items-table">
                <thead>
                  <tr>
                    <th>#</th><th>Item Type</th><th>Description</th>
                    <th>Gross Wt (g)</th><th>Net Wt (g)</th><th>Purity</th>
                    <th>Est. Value (₹)</th><th></th>
                  </tr>
                </thead>
                <tbody id="items-tbody">
                  ${this.itemRowHTML(1)}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right"><strong>Totals:</strong></td>
                    <td><strong id="total-net-wt">0.00</strong> g</td>
                    <td></td>
                    <td><strong id="total-est-val">₹0.00</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Loan Details -->
        <div class="card mb16">
          <div class="card-header"><h3><i class="fas fa-file-invoice-dollar"></i> Loan Details</h3></div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>Loan Date *</label>
                <input name="loanDate" type="date" value="${today}" required>
              </div>
              <div class="form-group">
                <label>Due Date *</label>
                <input name="dueDate" type="date" value="${dueDef}" required>
              </div>
              <div class="form-group">
                <label>Loan Amount (₹) *</label>
                <input name="principal" type="number" min="1" step="0.01" required placeholder="Principal amount" oninput="Loans.calcSummary()">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Interest Mode *</label>
                <select name="interestMode" onchange="Loans.toggleInterestMode(this)">
                  <option value="percentage">Percentage (% / month)</option>
                  <option value="fixed">Fixed Amount (₹ / month)</option>
                </select>
              </div>
              <div class="form-group">
                <label id="rate-label">Interest Rate (% / month) *</label>
                <input name="interestRate" type="number" min="0" step="0.01" value="${settings.defaultInterestRate||2}" required oninput="Loans.calcSummary()">
              </div>
              <div class="form-group">
                <label>Issue From Account *</label>
                <select name="issueFromAccount" required>
                  ${accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea name="notes" rows="2" placeholder="Any remarks…"></textarea>
            </div>

            <!-- Summary Box -->
            <div class="loan-summary" id="loan-summary">
              <div class="summary-row"><span>Monthly Interest</span><span id="sum-monthly">₹0.00</span></div>
              <div class="summary-row"><span>Total Interest (full term)</span><span id="sum-total-int">₹0.00</span></div>
              <div class="summary-row summary-total"><span>Total Repayable</span><span id="sum-repayable">₹0.00</span></div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="App.navigate('loans')">Cancel</button>
          <button type="submit" class="btn btn-gold"><i class="fas fa-save"></i> Save Loan & Print Receipt</button>
        </div>
      </form>`;
  },

  itemRowHTML(n) {
    const types = ['Ring','Necklace','Chain','Bangles','Earrings','Pendant','Anklet','Others'];
    return `
      <tr id="item-row-${n}">
        <td>${n}</td>
        <td><select class="item-type" onchange="Loans.calcTotals()">
          ${types.map(t => `<option>${t}</option>`).join('')}
        </select></td>
        <td><input class="item-desc" type="text" placeholder="Description"></td>
        <td><input class="item-gross" type="number" min="0" step="0.01" placeholder="0.00" oninput="Loans.calcTotals()"></td>
        <td><input class="item-net"   type="number" min="0" step="0.01" placeholder="0.00" oninput="Loans.calcTotals()"></td>
        <td><select class="item-purity">
          <option>22K</option><option>24K</option><option>18K</option><option>14K</option>
        </select></td>
        <td><input class="item-value" type="number" min="0" step="0.01" placeholder="0.00" oninput="Loans.calcTotals()"></td>
        <td>${n > 1 ? `<button type="button" class="btn btn-icon-sm btn-danger" onclick="Loans.removeItem(${n})"><i class="fas fa-trash"></i></button>` : ''}</td>
      </tr>`;
  },

  addItemRow() {
    this.itemCount++;
    const tbody = document.getElementById('items-tbody');
    tbody.insertAdjacentHTML('beforeend', this.itemRowHTML(this.itemCount));
  },

  removeItem(n) { document.getElementById(`item-row-${n}`)?.remove(); this.calcTotals(); },

  calcTotals() {
    const rows = document.querySelectorAll('#items-tbody tr');
    let netWt = 0, estVal = 0;
    rows.forEach(r => {
      netWt  += parseFloat(r.querySelector('.item-net')?.value  || 0);
      estVal += parseFloat(r.querySelector('.item-value')?.value || 0);
    });
    document.getElementById('total-net-wt').textContent = netWt.toFixed(2);
    document.getElementById('total-est-val').textContent = App.fmt(estVal);
    this.calcSummary();
  },

  calcSummary() {
    const principal    = parseFloat(document.querySelector('[name="principal"]')?.value || 0);
    const rate         = parseFloat(document.querySelector('[name="interestRate"]')?.value || 0);
    const loanDateEl   = document.querySelector('[name="loanDate"]');
    const dueDateEl    = document.querySelector('[name="dueDate"]');
    const mode         = document.querySelector('[name="interestMode"]')?.value;
    if (!loanDateEl || !dueDateEl) return;
    const months = Math.max(1, Math.round((new Date(dueDateEl.value) - new Date(loanDateEl.value)) / (30*86400*1000)));
    const monthly   = mode === 'percentage' ? principal * (rate/100) : rate;
    const totalInt  = monthly * months;
    const repayable = principal + totalInt;
    document.getElementById('sum-monthly')?.setAttribute('data-val', monthly);
    if (document.getElementById('sum-monthly'))   document.getElementById('sum-monthly').textContent   = App.fmt(monthly);
    if (document.getElementById('sum-total-int')) document.getElementById('sum-total-int').textContent = App.fmt(totalInt);
    if (document.getElementById('sum-repayable')) document.getElementById('sum-repayable').textContent = App.fmt(repayable);
  },

  toggleInterestMode(sel) {
    const lbl = document.getElementById('rate-label');
    if (lbl) lbl.textContent = sel.value === 'percentage' ? 'Interest Rate (% / month) *' : 'Monthly Interest (₹) *';
    this.calcSummary();
  },

  fillCustomer(id) {
    const c = DB.findById(DB.CUSTOMERS, id);
    const box = document.getElementById('cust-info-box');
    if (!box) return;
    if (c) box.innerHTML = `<strong>${c.name}</strong> | ${c.mobile} | ${c.idProofType}: ${c.aadharNumber||c.panNumber||'—'}`;
    else box.textContent = 'Select a customer above';
  },

  quickAddCustomer() {
    Customers.openForm();
  },

  collectItems() {
    const rows = document.querySelectorAll('#items-tbody tr');
    const items = [];
    rows.forEach(r => {
      items.push({
        type:        r.querySelector('.item-type')?.value   || '',
        description: r.querySelector('.item-desc')?.value   || '',
        grossWeight: parseFloat(r.querySelector('.item-gross')?.value || 0),
        netWeight:   parseFloat(r.querySelector('.item-net')?.value   || 0),
        purity:      r.querySelector('.item-purity')?.value || '22K',
        value:       parseFloat(r.querySelector('.item-value')?.value || 0),
        photo: ''
      });
    });
    return items;
  },

  saveLoan(e) {
    e.preventDefault();
    const f   = e.target;
    const fd  = new FormData(f);
    const d   = Object.fromEntries(fd.entries());
    const items = this.collectItems();
    if (!d.customerId) { App.toast('Please select a customer', 'error'); return; }
    if (!items.length || items.every(i => !i.netWeight)) { App.toast('Add at least one gold item', 'error'); return; }

    const loan = {
      id:               DB.genId('GL', DB.LOANS),
      customerId:       d.customerId,
      loanDate:         d.loanDate,
      dueDate:          d.dueDate,
      goldItems:        items,
      totalNetWeight:   items.reduce((s,i) => s+i.netWeight, 0),
      totalEstimatedValue: items.reduce((s,i) => s+i.value, 0),
      principal:        parseFloat(d.principal),
      interestMode:     d.interestMode,
      interestRate:     parseFloat(d.interestRate),
      issueFromAccount: d.issueFromAccount,
      notes:            d.notes || '',
      status:           'Active'
    };
    DB.add(DB.LOANS, loan);
    App.toast(`Loan ${loan.id} created successfully!`);
    this.printReceipt(loan);
    App.navigate('loans');
  },

  // ── Loan List ─────────────────────────────────────────────
  renderList(filter = '') {
    const el = document.getElementById('page-loans');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-list"></i> All Loans</h2>
        <button class="btn btn-gold" onclick="App.navigate('new-loan')"><i class="fas fa-plus"></i> New Pawn</button>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="filter-row">
            <div class="search-box"><i class="fas fa-search"></i>
              <input type="text" id="loan-search" placeholder="Search by ID, customer…" oninput="Loans.filterList(this.value, document.getElementById('loan-status-filter').value)">
            </div>
            <select id="loan-status-filter" class="filter-select" onchange="Loans.filterList(document.getElementById('loan-search').value, this.value)">
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Overdue">Overdue</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <span class="record-count" id="loan-count"></span>
        </div>
        <div class="card-body p0"><div id="loan-table-wrap"></div></div>
      </div>`;
    this.renderLoanTable('', '');
  },

  filterList(term, status) { this.renderLoanTable(term.toLowerCase(), status); },

  renderLoanTable(term, status) {
    let loans = DB.getAll(DB.LOANS);
    if (term)   loans = loans.filter(l => l.id.toLowerCase().includes(term) || App.custName(l.customerId).toLowerCase().includes(term));
    if (status) loans = loans.filter(l => App.loanStatus(l).label === status);
    loans = loans.sort((a,b) => new Date(b.loanDate) - new Date(a.loanDate));
    document.getElementById('loan-count').textContent = `${loans.length} record(s)`;
    const wrap = document.getElementById('loan-table-wrap');
    if (!loans.length) { wrap.innerHTML = '<div class="empty-state"><i class="fas fa-gem"></i><p>No loans found</p></div>'; return; }
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Loan ID</th><th>Customer</th><th>Gold Wt (g)</th><th>Principal</th><th>Rate</th><th>Loan Date</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${loans.map(l => {
            const st = App.loanStatus(l);
            return `<tr>
              <td><strong>${l.id}</strong></td>
              <td>${App.custName(l.customerId)}<br><small class="muted">${App.custMobile(l.customerId)}</small></td>
              <td>${l.totalNetWeight?.toFixed(2)} g</td>
              <td>${App.fmt(l.principal)}</td>
              <td>${l.interestRate}${l.interestMode==='percentage'?'%':'₹'}/mo</td>
              <td>${App.fmtDate(l.loanDate)}</td>
              <td>${App.fmtDate(l.dueDate)}</td>
              <td><span class="badge ${st.cls}">${st.label}</span></td>
              <td class="actions-cell">
                <button class="btn btn-icon-sm btn-info"    title="View"    onclick="Loans.viewLoan('${l.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-icon-sm btn-success" title="Collect" onclick="App.navigate('due-collection')" ${l.status==='Closed'?'disabled':''}><i class="fas fa-rupee-sign"></i></button>
                <button class="btn btn-icon-sm btn-gold"    title="Receipt" onclick="Loans.printReceipt(DB.findById(DB.LOANS,'${l.id}'))"><i class="fas fa-print"></i></button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  },

  viewLoan(id) {
    const l = DB.findById(DB.LOANS, id);
    if (!l) return;
    const c       = DB.findById(DB.CUSTOMERS, l.customerId);
    const st      = App.loanStatus(l);
    const accrued = App.calcInterest(l);
    const paid    = App.totalPaid(id);
    const payments= DB.getAll(DB.PAYMENTS).filter(p => p.loanId === id);
    App.openModal(`Loan Details — ${l.id}`, `
      <div class="two-col-grid">
        <div class="info-box">
          <h4 class="info-title">Loan Info</h4>
          <div class="info-row"><span class="label">Loan ID</span><span class="value">${l.id}</span></div>
          <div class="info-row"><span class="label">Status</span><span class="badge ${st.cls}">${st.label}</span></div>
          <div class="info-row"><span class="label">Loan Date</span><span class="value">${App.fmtDate(l.loanDate)}</span></div>
          <div class="info-row"><span class="label">Due Date</span><span class="value">${App.fmtDate(l.dueDate)}</span></div>
          <div class="info-row"><span class="label">Principal</span><span class="value">${App.fmt(l.principal)}</span></div>
          <div class="info-row"><span class="label">Interest Rate</span><span class="value">${l.interestRate}${l.interestMode==='percentage'?'%':'₹'}/month</span></div>
          <div class="info-row"><span class="label">Accrued Interest</span><span class="value highlight">${App.fmt(accrued)}</span></div>
          <div class="info-row"><span class="label">Total Paid</span><span class="value">${App.fmt(paid)}</span></div>
        </div>
        <div class="info-box">
          <h4 class="info-title">Customer</h4>
          <div class="info-row"><span class="label">Name</span><span class="value">${c?.name||'—'}</span></div>
          <div class="info-row"><span class="label">Mobile</span><span class="value">${c?.mobile||'—'}</span></div>
          <div class="info-row"><span class="label">ID Proof</span><span class="value">${c?.idProofType||'—'}</span></div>
          <h4 class="info-title" style="margin-top:12px">Gold Items</h4>
          ${l.goldItems.map((g,i) => `<div class="info-row"><span class="label">${i+1}. ${g.type}</span><span class="value">${g.netWeight}g ${g.purity} — ${App.fmt(g.value)}</span></div>`).join('')}
          <div class="info-row"><span class="label">Total Net Wt</span><span class="value">${l.totalNetWeight?.toFixed(2)} g</span></div>
        </div>
      </div>
      <h4 style="margin:16px 0 8px">Payment History (${payments.length})</h4>
      ${payments.length ? `<table class="data-table"><thead><tr><th>Pay ID</th><th>Date</th><th>Amount</th><th>Method</th><th>Type</th></tr></thead><tbody>
        ${payments.map(p=>`<tr><td>${p.id}</td><td>${App.fmtDate(p.date)}</td><td>${App.fmt(p.amount)}</td><td>${p.method}</td><td>${p.type}</td></tr>`).join('')}
      </tbody></table>` : '<p style="color:#888">No payments yet</p>'}`,
      `<button class="btn btn-outline" onclick="App.closeModal()">Close</button>
       <button class="btn btn-gold" onclick="Loans.printReceipt(DB.findById(DB.LOANS,'${id}'))"><i class="fas fa-print"></i> Print</button>`);
  },

  printReceipt(loan) {
    if (!loan) return;
    const c   = DB.findById(DB.CUSTOMERS, loan.customerId);
    const s   = DB.get(DB.SETTINGS) || {};
    const monthly = loan.interestMode === 'percentage' ? loan.principal*(loan.interestRate/100) : loan.interestRate;
    App.printWindow(`
      <div class="header">
        <h1>${s.shopName||'Gold Loan Manager'}</h1>
        <p>${s.address||''} | Ph: ${s.phone||''}</p>
        ${s.licenseNo?`<p>License: ${s.licenseNo}</p>`:''}
      </div>
      <h2>GOLD LOAN RECEIPT — ${loan.id}</h2>
      <div class="two-col">
        <div class="info-box">
          <p><span class="label">Customer:</span> <span class="value">${c?.name||'—'}</span></p>
          <p><span class="label">Mobile:</span> <span class="value">${c?.mobile||'—'}</span></p>
          <p><span class="label">Address:</span> <span class="value">${c?.address||'—'}</span></p>
          <p><span class="label">ID Proof:</span> <span class="value">${c?.idProofType||'—'}</span></p>
        </div>
        <div class="info-box">
          <p><span class="label">Loan ID:</span> <span class="value">${loan.id}</span></p>
          <p><span class="label">Loan Date:</span> <span class="value">${App.fmtDate(loan.loanDate)}</span></p>
          <p><span class="label">Due Date:</span> <span class="value">${App.fmtDate(loan.dueDate)}</span></p>
          <p><span class="label">Principal:</span> <span class="value">${App.fmt(loan.principal)}</span></p>
          <p><span class="label">Rate:</span> <span class="value">${loan.interestRate}${loan.interestMode==='percentage'?'%':'₹'}/mo = ${App.fmt(monthly)}/mo</span></p>
        </div>
      </div>
      <h2>Gold Items Pledged</h2>
      <table><thead><tr><th>#</th><th>Type</th><th>Description</th><th>Gross Wt(g)</th><th>Net Wt(g)</th><th>Purity</th><th>Value</th></tr></thead>
        <tbody>${loan.goldItems.map((g,i)=>`<tr><td>${i+1}</td><td>${g.type}</td><td>${g.description}</td><td>${g.grossWeight}</td><td>${g.netWeight}</td><td>${g.purity}</td><td>${App.fmt(g.value)}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="4" class="text-right">Total</td><td>${loan.totalNetWeight?.toFixed(2)}</td><td></td><td>${App.fmt(loan.totalEstimatedValue)}</td></tr>
        </tbody>
      </table>
      <p style="margin-top:40px">Signature (Customer): _______________________&nbsp;&nbsp;&nbsp; Signature (Shop): _______________________</p>
      <div class="footer"><p>${s.receiptFooter||''}</p></div>`);
  }
};
