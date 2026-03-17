// ============================================================
//  reports.js  –  All report types with print
// ============================================================
const Reports = {
  active: 'pawn',

  render() {
    const el = document.getElementById('page-reports');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-file-alt"></i> Reports</h2>
      </div>
      <div class="report-tabs">
        ${[
          ['pawn','Pawn Report'],['collection','Collection Report'],
          ['overdue','Overdue Report'],['stock','Stock Report'],
          ['cashflow','Cashflow Report'],['daily','Daily Summary']
        ].map(([id,label]) =>
          `<button class="report-tab ${this.active===id?'active':''}" onclick="Reports.switchTab('${id}')">${label}</button>`
        ).join('')}
      </div>
      <div id="report-content"></div>`;
    this.switchTab(this.active);
  },

  switchTab(id) {
    this.active = id;
    document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
    const btn = document.querySelector(`.report-tab[onclick*="'${id}'"]`);
    if (btn) btn.classList.add('active');
    const methods = { pawn:this.pawnReport, collection:this.collectionReport,
      overdue:this.overdueReport, stock:this.stockReport, cashflow:this.cashflowReport, daily:this.dailyReport };
    methods[id]?.call(this);
  },

  pawnReport() {
    const today = App.today(), monthStart = today.slice(0,7)+'-01';
    const wrap = document.getElementById('report-content');
    wrap.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Pawn Report</h3>
          <div class="filter-row">
            <input type="date" id="rp-from" value="${monthStart}">
            <input type="date" id="rp-to"   value="${today}">
            <select id="rp-status" class="filter-select">
              <option value="">All</option><option>Active</option><option>Overdue</option><option>Due Soon</option><option>Closed</option>
            </select>
            <button class="btn btn-gold" onclick="Reports.runPawnReport()"><i class="fas fa-filter"></i> Filter</button>
            <button class="btn btn-outline" onclick="Reports.printPawnReport()"><i class="fas fa-print"></i> Print</button>
          </div>
        </div>
        <div class="card-body p0" id="rp-table"></div>
      </div>`;
    this.runPawnReport();
  },

  runPawnReport() {
    const from   = document.getElementById('rp-from')?.value;
    const to     = document.getElementById('rp-to')?.value;
    const status = document.getElementById('rp-status')?.value;
    let loans = DB.getAll(DB.LOANS);
    if (from) loans = loans.filter(l => l.loanDate >= from);
    if (to)   loans = loans.filter(l => l.loanDate <= to);
    if (status) loans = loans.filter(l => App.loanStatus(l).label === status);
    loans.sort((a,b) => new Date(b.loanDate)-new Date(a.loanDate));
    const total = loans.reduce((s,l) => s+l.principal, 0);
    document.getElementById('rp-table').innerHTML = this._loanTable(loans, total);
  },

  _loanTable(loans, total) {
    if (!loans.length) return '<div class="empty-state"><i class="fas fa-file-alt"></i><p>No records</p></div>';
    return `<table class="data-table">
      <thead><tr><th>Loan ID</th><th>Customer</th><th>Mobile</th><th>Gold Wt (g)</th><th>Principal</th><th>Rate</th><th>Loan Date</th><th>Due Date</th><th>Status</th></tr></thead>
      <tbody>${loans.map(l => {
        const st = App.loanStatus(l);
        return `<tr><td>${l.id}</td><td>${App.custName(l.customerId)}</td><td>${App.custMobile(l.customerId)}</td>
          <td>${l.totalNetWeight?.toFixed(2)}</td><td>${App.fmt(l.principal)}</td>
          <td>${l.interestRate}${l.interestMode==='percentage'?'%':'₹'}/mo</td>
          <td>${App.fmtDate(l.loanDate)}</td><td>${App.fmtDate(l.dueDate)}</td>
          <td><span class="badge ${st.cls}">${st.label}</span></td></tr>`;
      }).join('')}</tbody>
      <tfoot><tr class="total-row"><td colspan="4" class="text-right"><strong>Total (${loans.length} loans)</strong></td>
        <td><strong>${App.fmt(total)}</strong></td><td colspan="4"></td></tr></tfoot>
    </table>`;
  },

  printPawnReport() {
    const from = document.getElementById('rp-from')?.value;
    const to   = document.getElementById('rp-to')?.value;
    let loans  = DB.getAll(DB.LOANS);
    if (from) loans = loans.filter(l => l.loanDate >= from);
    if (to)   loans = loans.filter(l => l.loanDate <= to);
    const total = loans.reduce((s,l) => s+l.principal, 0);
    const s = DB.get(DB.SETTINGS)||{};
    App.printWindow(`
      <div class="header"><h1>${s.shopName||''}</h1><p>Pawn Report: ${App.fmtDate(from)} to ${App.fmtDate(to)}</p></div>
      ${this._loanTable(loans, total)}`);
  },

  collectionReport() {
    const today = App.today(), monthStart = today.slice(0,7)+'-01';
    document.getElementById('report-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Collection Report</h3>
          <div class="filter-row">
            <input type="date" id="cr-from" value="${monthStart}">
            <input type="date" id="cr-to"   value="${today}">
            <button class="btn btn-gold" onclick="Reports.runCollectionReport()"><i class="fas fa-filter"></i> Filter</button>
            <button class="btn btn-outline" onclick="Reports.printCollectionReport()"><i class="fas fa-print"></i> Print</button>
          </div>
        </div>
        <div class="card-body p0" id="cr-table"></div>
      </div>`;
    this.runCollectionReport();
  },

  runCollectionReport() {
    const from = document.getElementById('cr-from')?.value;
    const to   = document.getElementById('cr-to')?.value;
    let payments = DB.getAll(DB.PAYMENTS);
    if (from) payments = payments.filter(p => p.date >= from);
    if (to)   payments = payments.filter(p => p.date <= to);
    payments.sort((a,b) => new Date(b.date)-new Date(a.date));
    const total = payments.reduce((s,p) => s+p.amount, 0);
    const el = document.getElementById('cr-table');
    el.innerHTML = payments.length ? `
      <table class="data-table">
        <thead><tr><th>Pay ID</th><th>Loan ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Method</th><th>Type</th><th>Remarks</th></tr></thead>
        <tbody>${payments.map(p => {
          const loan = DB.findById(DB.LOANS, p.loanId);
          return `<tr><td>${p.id}</td><td>${p.loanId}</td>
            <td>${loan ? App.custName(loan.customerId) : '—'}</td>
            <td>${App.fmtDate(p.date)}</td><td class="text-green">${App.fmt(p.amount)}</td>
            <td>${p.method}</td><td>${p.type}</td><td>${p.remarks||'—'}</td></tr>`;
        }).join('')}</tbody>
        <tfoot><tr class="total-row"><td colspan="4" class="text-right"><strong>Total</strong></td>
          <td class="text-green"><strong>${App.fmt(total)}</strong></td><td colspan="3"></td></tr></tfoot>
      </table>` : '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><p>No collections in this period</p></div>';
  },

  printCollectionReport() {
    const from = document.getElementById('cr-from')?.value;
    const to   = document.getElementById('cr-to')?.value;
    let payments = DB.getAll(DB.PAYMENTS);
    if (from) payments = payments.filter(p => p.date >= from);
    if (to)   payments = payments.filter(p => p.date <= to);
    const total = payments.reduce((s,p) => s+p.amount, 0);
    const s = DB.get(DB.SETTINGS)||{};
    App.printWindow(`
      <div class="header"><h1>${s.shopName||''}</h1><p>Collection Report: ${App.fmtDate(from)} to ${App.fmtDate(to)}</p></div>
      <table><thead><tr><th>Pay ID</th><th>Loan ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Method</th><th>Type</th></tr></thead>
      <tbody>${payments.map(p=>{
        const loan=DB.findById(DB.LOANS,p.loanId);
        return `<tr><td>${p.id}</td><td>${p.loanId}</td><td>${loan?App.custName(loan.customerId):'—'}</td><td>${App.fmtDate(p.date)}</td><td>${App.fmt(p.amount)}</td><td>${p.method}</td><td>${p.type}</td></tr>`;
      }).join('')}</tbody>
      <tfoot><tr class="total-row"><td colspan="4" class="text-right"><strong>Total</strong></td><td><strong>${App.fmt(total)}</strong></td><td colspan="2"></td></tr></tfoot>
      </table>`);
  },

  overdueReport() {
    const overdue = DB.getAll(DB.LOANS).filter(l => l.status !== 'Closed' && new Date(l.dueDate) < new Date());
    document.getElementById('report-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Overdue Loans (${overdue.length})</h3>
          <button class="btn btn-outline" onclick="Reports.printOverdue()"><i class="fas fa-print"></i> Print</button>
        </div>
        <div class="card-body p0">
          ${overdue.length ? `<table class="data-table">
            <thead><tr><th>Loan ID</th><th>Customer</th><th>Mobile</th><th>Principal</th><th>Accrued Interest</th><th>Total Due</th><th>Due Date</th><th>Days Overdue</th></tr></thead>
            <tbody>${overdue.map(l => {
              const accrued = App.calcInterest(l);
              const paid    = App.totalPaid(l.id);
              const due     = Math.max(0, l.principal + accrued - paid);
              const days    = Math.floor((new Date()-new Date(l.dueDate))/86400000);
              return `<tr class="overdue-row"><td>${l.id}</td><td>${App.custName(l.customerId)}</td>
                <td>${App.custMobile(l.customerId)}</td><td>${App.fmt(l.principal)}</td>
                <td class="text-gold">${App.fmt(accrued)}</td><td class="text-red"><strong>${App.fmt(due)}</strong></td>
                <td>${App.fmtDate(l.dueDate)}</td><td class="text-red">${days} days</td></tr>`;
            }).join('')}</tbody>
          </table>` : '<div class="empty-state"><i class="fas fa-check-circle" style="color:#10b981"></i><p>No overdue loans!</p></div>'}
        </div>
      </div>`;
  },

  printOverdue() {
    const overdue = DB.getAll(DB.LOANS).filter(l => l.status!=='Closed' && new Date(l.dueDate)<new Date());
    const s = DB.get(DB.SETTINGS)||{};
    App.printWindow(`
      <div class="header"><h1>${s.shopName||''}</h1><p>Overdue Loans Report — ${new Date().toLocaleDateString('en-IN')}</p></div>
      <table><thead><tr><th>Loan ID</th><th>Customer</th><th>Mobile</th><th>Principal</th><th>Total Due</th><th>Due Date</th><th>Days Overdue</th></tr></thead>
      <tbody>${overdue.map(l=>{
        const accrued=App.calcInterest(l),paid=App.totalPaid(l.id),due=Math.max(0,l.principal+accrued-paid);
        const days=Math.floor((new Date()-new Date(l.dueDate))/86400000);
        return `<tr><td>${l.id}</td><td>${App.custName(l.customerId)}</td><td>${App.custMobile(l.customerId)}</td><td>${App.fmt(l.principal)}</td><td>${App.fmt(due)}</td><td>${App.fmtDate(l.dueDate)}</td><td>${days}</td></tr>`;
      }).join('')}</tbody></table>`);
  },

  stockReport() {
    const loans = DB.getAll(DB.LOANS);
    const active = loans.filter(l => l.status !== 'Closed');
    const closed = loans.filter(l => l.status === 'Closed');
    const totalByPurity = {};
    active.forEach(l => l.goldItems.forEach(g => {
      if (!totalByPurity[g.purity]) totalByPurity[g.purity] = { wt:0, val:0 };
      totalByPurity[g.purity].wt  += g.netWeight;
      totalByPurity[g.purity].val += g.value;
    }));
    document.getElementById('report-content').innerHTML = `
      <div class="card">
        <div class="card-header"><h3>Stock Report (Gold in Custody)</h3>
          <button class="btn btn-outline" onclick="Reports.printStock()"><i class="fas fa-print"></i> Print</button>
        </div>
        <div class="card-body">
          <div class="kpi-grid mini">
            <div class="kpi-card kpi-gold"><div class="kpi-icon"><i class="fas fa-gem"></i></div>
              <div class="kpi-body"><div class="kpi-value">${active.reduce((s,l)=>s+(l.totalNetWeight||0),0).toFixed(2)} g</div><div class="kpi-label">Total Gold in Stock</div></div>
            </div>
            <div class="kpi-card kpi-green"><div class="kpi-icon"><i class="fas fa-rupee-sign"></i></div>
              <div class="kpi-body"><div class="kpi-value">${App.fmt(active.reduce((s,l)=>s+(l.totalEstimatedValue||0),0))}</div><div class="kpi-label">Total Estimated Value</div></div>
            </div>
            <div class="kpi-card kpi-blue"><div class="kpi-icon"><i class="fas fa-box"></i></div>
              <div class="kpi-body"><div class="kpi-value">${active.length}</div><div class="kpi-label">Active Pawn Lots</div></div>
            </div>
            <div class="kpi-card kpi-purple"><div class="kpi-icon"><i class="fas fa-check"></i></div>
              <div class="kpi-body"><div class="kpi-value">${closed.length}</div><div class="kpi-label">Redeemed Lots</div></div>
            </div>
          </div>
          <h4 style="margin:20px 0 12px">Stock by Purity</h4>
          <table class="data-table">
            <thead><tr><th>Purity</th><th>Net Weight (g)</th><th>Estimated Value</th></tr></thead>
            <tbody>${Object.entries(totalByPurity).map(([p,d])=>`
              <tr><td><strong>${p}</strong></td><td>${d.wt.toFixed(2)} g</td><td>${App.fmt(d.val)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  printStock() {
    const active = DB.getAll(DB.LOANS).filter(l=>l.status!=='Closed');
    const s = DB.get(DB.SETTINGS)||{};
    const totalWt = active.reduce((s,l)=>s+(l.totalNetWeight||0),0);
    const totalVal= active.reduce((s,l)=>s+(l.totalEstimatedValue||0),0);
    App.printWindow(`
      <div class="header"><h1>${s.shopName||''}</h1><p>Stock Report — ${new Date().toLocaleDateString('en-IN')}</p></div>
      <p>Total Gold: <strong>${totalWt.toFixed(2)} g</strong> &nbsp;|&nbsp; Estimated Value: <strong>${App.fmt(totalVal)}</strong></p>
      <table><thead><tr><th>Loan ID</th><th>Customer</th><th>Items</th><th>Net Wt (g)</th><th>Value</th><th>Due Date</th></tr></thead>
      <tbody>${active.map(l=>`<tr><td>${l.id}</td><td>${App.custName(l.customerId)}</td>
        <td>${l.goldItems.map(g=>g.type).join(', ')}</td><td>${l.totalNetWeight?.toFixed(2)}</td>
        <td>${App.fmt(l.totalEstimatedValue)}</td><td>${App.fmtDate(l.dueDate)}</td></tr>`).join('')}
      </tbody></table>`);
  },

  cashflowReport() {
    const loans    = DB.getAll(DB.LOANS);
    const payments = DB.getAll(DB.PAYMENTS);
    const expenses = DB.getAll(DB.EXPENSES);
    const rows = [];
    loans.forEach(l    => rows.push({ date:l.loanDate, desc:`Loan Issued — ${l.id} (${App.custName(l.customerId)})`,  type:'Out', amount:l.principal }));
    payments.forEach(p => rows.push({ date:p.date,     desc:`Payment Received — ${p.loanId} (${p.type})`,              type:'In',  amount:p.amount    }));
    expenses.forEach(e => rows.push({ date:e.date,     desc:`${e.type} — ${e.category}: ${e.description}`,             type:e.type==='Income'?'In':'Out', amount:e.amount }));
    rows.sort((a,b) => new Date(a.date)-new Date(b.date));
    let running = 0;
    const rowsWithBalance = rows.map(r => { running += r.type==='In' ? r.amount : -r.amount; return { ...r, running }; });

    document.getElementById('report-content').innerHTML = `
      <div class="card">
        <div class="card-header"><h3>Cashflow Report</h3>
          <button class="btn btn-outline" onclick="Reports.printCashflow()"><i class="fas fa-print"></i> Print</button>
        </div>
        <div class="card-body p0">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Description</th><th>Flow</th><th>Amount</th><th>Running Balance</th></tr></thead>
            <tbody>${rowsWithBalance.map(r=>`<tr>
              <td>${App.fmtDate(r.date)}</td><td>${r.desc}</td>
              <td><span class="badge ${r.type==='In'?'badge-active':'badge-overdue'}">${r.type}</span></td>
              <td class="${r.type==='In'?'text-green':'text-red'}">${App.fmt(r.amount)}</td>
              <td><strong>${App.fmt(r.running)}</strong></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  printCashflow() {
    const s = DB.get(DB.SETTINGS)||{};
    const loans=DB.getAll(DB.LOANS),payments=DB.getAll(DB.PAYMENTS),expenses=DB.getAll(DB.EXPENSES);
    const rows=[];
    loans.forEach(l=>rows.push({date:l.loanDate,desc:`Loan — ${l.id}`,type:'Out',amount:l.principal}));
    payments.forEach(p=>rows.push({date:p.date,desc:`Payment — ${p.loanId}`,type:'In',amount:p.amount}));
    expenses.forEach(e=>rows.push({date:e.date,desc:`${e.category}`,type:e.type==='Income'?'In':'Out',amount:e.amount}));
    rows.sort((a,b)=>new Date(a.date)-new Date(b.date));
    let run=0;
    App.printWindow(`
      <div class="header"><h1>${s.shopName||''}</h1><p>Cashflow Report — ${new Date().toLocaleDateString('en-IN')}</p></div>
      <table><thead><tr><th>Date</th><th>Description</th><th>Flow</th><th>Amount</th><th>Balance</th></tr></thead>
      <tbody>${rows.map(r=>{run+=r.type==='In'?r.amount:-r.amount;return `<tr><td>${App.fmtDate(r.date)}</td><td>${r.desc}</td><td>${r.type}</td><td>${App.fmt(r.amount)}</td><td>${App.fmt(run)}</td></tr>`;}).join('')}
      </tbody></table>`);
  },

  dailyReport() {
    const today = App.today();
    const newLoans = DB.getAll(DB.LOANS).filter(l=>l.loanDate===today);
    const todayPay = DB.getAll(DB.PAYMENTS).filter(p=>p.date===today);
    const totalDisb  = newLoans.reduce((s,l)=>s+l.principal,0);
    const totalColl  = todayPay.reduce((s,p)=>s+p.amount,0);

    document.getElementById('report-content').innerHTML = `
      <div class="card">
        <div class="card-header"><h3>Daily Summary — ${App.fmtDate(today)}</h3>
          <button class="btn btn-outline" onclick="Reports.printDaily()"><i class="fas fa-print"></i> Print</button>
        </div>
        <div class="card-body">
          <div class="kpi-grid mini">
            <div class="kpi-card kpi-blue"><div class="kpi-icon"><i class="fas fa-gem"></i></div><div class="kpi-body"><div class="kpi-value">${newLoans.length}</div><div class="kpi-label">New Loans Today</div></div></div>
            <div class="kpi-card kpi-gold"><div class="kpi-icon"><i class="fas fa-rupee-sign"></i></div><div class="kpi-body"><div class="kpi-value">${App.fmt(totalDisb)}</div><div class="kpi-label">Disbursed Today</div></div></div>
            <div class="kpi-card kpi-green"><div class="kpi-icon"><i class="fas fa-hand-holding-usd"></i></div><div class="kpi-body"><div class="kpi-value">${App.fmt(totalColl)}</div><div class="kpi-label">Collected Today</div></div></div>
          </div>
          <h4 style="margin:20px 0 10px">New Loans (${newLoans.length})</h4>
          ${newLoans.length?`<table class="data-table"><thead><tr><th>Loan ID</th><th>Customer</th><th>Principal</th></tr></thead>
            <tbody>${newLoans.map(l=>`<tr><td>${l.id}</td><td>${App.custName(l.customerId)}</td><td>${App.fmt(l.principal)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No new loans today</p>'}
          <h4 style="margin:20px 0 10px">Collections (${todayPay.length})</h4>
          ${todayPay.length?`<table class="data-table"><thead><tr><th>Pay ID</th><th>Loan</th><th>Customer</th><th>Amount</th><th>Method</th></tr></thead>
            <tbody>${todayPay.map(p=>{const l=DB.findById(DB.LOANS,p.loanId);return `<tr><td>${p.id}</td><td>${p.loanId}</td><td>${l?App.custName(l.customerId):'—'}</td><td>${App.fmt(p.amount)}</td><td>${p.method}</td></tr>`;}).join('')}</tbody></table>` : '<p class="muted">No collections today</p>'}
        </div>
      </div>`;
  },

  printDaily() {
    const today=App.today();
    const newLoans=DB.getAll(DB.LOANS).filter(l=>l.loanDate===today);
    const todayPay=DB.getAll(DB.PAYMENTS).filter(p=>p.date===today);
    const s=DB.get(DB.SETTINGS)||{};
    App.printWindow(`
      <div class="header"><h1>${s.shopName||''}</h1><p>Daily Summary — ${App.fmtDate(today)}</p></div>
      <p>New Loans: <strong>${newLoans.length}</strong> &nbsp;|&nbsp; Disbursed: <strong>${App.fmt(newLoans.reduce((s,l)=>s+l.principal,0))}</strong> &nbsp;|&nbsp; Collected: <strong>${App.fmt(todayPay.reduce((s,p)=>s+p.amount,0))}</strong></p>
      <h2>New Loans</h2>
      <table><thead><tr><th>Loan ID</th><th>Customer</th><th>Principal</th><th>Rate</th></tr></thead>
      <tbody>${newLoans.map(l=>`<tr><td>${l.id}</td><td>${App.custName(l.customerId)}</td><td>${App.fmt(l.principal)}</td><td>${l.interestRate}%</td></tr>`).join('')}</tbody></table>
      <h2>Collections</h2>
      <table><thead><tr><th>Pay ID</th><th>Loan</th><th>Customer</th><th>Amount</th><th>Method</th></tr></thead>
      <tbody>${todayPay.map(p=>{const l=DB.findById(DB.LOANS,p.loanId);return `<tr><td>${p.id}</td><td>${p.loanId}</td><td>${l?App.custName(l.customerId):'—'}</td><td>${App.fmt(p.amount)}</td><td>${p.method}</td></tr>`;}).join('')}</tbody></table>`);
  }
};
