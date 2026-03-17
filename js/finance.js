// ============================================================
//  finance.js  –  Bank Accounts, Bank Pledges, Income & Expenses
// ============================================================
const Finance = {

  // ── Bank Accounts ─────────────────────────────────────────
  renderAccounts() {
    const accounts = DB.getAll(DB.ACCOUNTS);
    const loans    = DB.getAll(DB.LOANS);
    const payments = DB.getAll(DB.PAYMENTS);
    const expenses = DB.getAll(DB.EXPENSES);

    const el = document.getElementById('page-accounts');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-wallet"></i> Bank Accounts</h2>
        <button class="btn btn-gold" onclick="Finance.openAccountForm()"><i class="fas fa-plus"></i> Add Account</button>
      </div>
      <div class="accounts-grid">
        ${accounts.map(a => {
          const bal = this.calcAccountBalance(a, loans, payments, expenses);
          return `
            <div class="account-card">
              <div class="ac-icon ${a.type==='cash'?'ac-cash':'ac-bank'}">
                <i class="fas fa-${a.type==='cash'?'money-bill-alt':'university'}"></i>
              </div>
              <div class="ac-body">
                <div class="ac-name">${a.name}</div>
                ${a.bankName ? `<div class="ac-bank">${a.bankName} — ${a.accountNumber}</div>` : ''}
                <div class="ac-balance">${App.fmt(bal)}</div>
                <div class="ac-label">Current Balance</div>
                <div class="ac-opening">Opening: ${App.fmt(a.openingBalance)}</div>
              </div>
              <div class="ac-actions">
                <button class="btn btn-icon-sm btn-warning" title="Edit" onclick="Finance.openAccountForm('${a.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-icon-sm btn-danger" title="Delete" onclick="Finance.deleteAccount('${a.id}')"><i class="fas fa-trash"></i></button>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  },

  calcAccountBalance(account, loans, payments, expenses) {
    const id = account.id;
    let bal = account.openingBalance;
    // Subtract loans issued from this account
    loans.forEach(l => { if (l.issueFromAccount === id) bal -= l.principal; });
    // Add payments received into this account
    payments.forEach(p => { if (p.settleToAccount === id) bal += p.amount; });
    // Add/subtract expenses
    expenses.forEach(ex => {
      if (ex.account === id) {
        if (ex.type === 'Expense') bal -= ex.amount;
        else                       bal += ex.amount;
      }
    });
    return bal;
  },

  openAccountForm(id = null) {
    const a = id ? DB.findById(DB.ACCOUNTS, id) : {};
    App.openModal(id ? 'Edit Account' : 'Add Account', `
      <form id="acct-form" onsubmit="Finance.saveAccount(event,'${id||''}')">
        <div class="form-group"><label>Account Name *</label><input name="name" value="${a.name||''}" required placeholder="e.g. Cash in Hand"></div>
        <div class="form-group"><label>Account Type *</label>
          <select name="type">
            <option value="cash" ${a.type==='cash'?'selected':''}>Cash</option>
            <option value="bank" ${a.type==='bank'?'selected':''}>Bank</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Bank Name</label><input name="bankName" value="${a.bankName||''}" placeholder="e.g. SBI"></div>
          <div class="form-group"><label>Account Number</label><input name="accountNumber" value="${a.accountNumber||''}" placeholder="Account number"></div>
        </div>
        <div class="form-group"><label>Opening Balance (₹) *</label><input name="openingBalance" type="number" step="0.01" value="${a.openingBalance||0}" required></div>
      </form>`,
      `<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
       <button class="btn btn-gold" onclick="document.getElementById('acct-form').requestSubmit()"><i class="fas fa-save"></i> Save</button>`);
  },

  saveAccount(e, id) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    d.openingBalance = parseFloat(d.openingBalance);
    if (id) { DB.update(DB.ACCOUNTS, id, d); App.toast('Account updated!'); }
    else { d.id = DB.genId('ACCT', DB.ACCOUNTS); d.dateAdded = App.today(); DB.add(DB.ACCOUNTS, d); App.toast('Account added!'); }
    App.closeModal(); this.renderAccounts();
  },

  deleteAccount(id) {
    const inUse = DB.getAll(DB.LOANS).some(l => l.issueFromAccount === id) ||
                  DB.getAll(DB.PAYMENTS).some(p => p.settleToAccount === id);
    if (inUse) { App.toast('Cannot delete: account is used in transactions', 'error'); return; }
    if (!confirm('Delete this account?')) return;
    DB.delete(DB.ACCOUNTS, id); App.toast('Account deleted', 'warning'); this.renderAccounts();
  },

  // ── Bank Pledges ──────────────────────────────────────────
  renderPledges() {
    const pledges  = DB.getAll(DB.PLEDGES);
    const accounts = DB.getAll(DB.ACCOUNTS);
    const el = document.getElementById('page-pledges');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-building"></i> Bank Pledges</h2>
        <button class="btn btn-gold" onclick="Finance.openPledgeForm()"><i class="fas fa-plus"></i> New Pledge</button>
      </div>
      <div class="card">
        <div class="card-body p0">
          ${pledges.length ? `
            <table class="data-table">
              <thead><tr><th>Pledge ID</th><th>Linked Loan</th><th>Customer</th><th>Bank Account</th><th>Pledge Amt</th><th>Rate</th><th>Pledge Date</th><th>Maturity</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                ${pledges.map(p => {
                  const loan = DB.findById(DB.LOANS, p.loanId);
                  const acct = DB.findById(DB.ACCOUNTS, p.bankAccountId);
                  return `<tr>
                    <td>${p.id}</td>
                    <td>${p.loanId}</td>
                    <td>${loan ? App.custName(loan.customerId) : '—'}</td>
                    <td>${acct?.name||'—'}</td>
                    <td>${App.fmt(p.pledgeAmount)}</td>
                    <td>${p.interestRate}%/mo</td>
                    <td>${App.fmtDate(p.pledgeDate)}</td>
                    <td>${App.fmtDate(p.maturityDate)}</td>
                    <td><span class="badge ${p.status==='Active'?'badge-active':'badge-closed'}">${p.status}</span></td>
                    <td>
                      ${p.status==='Active'?`<button class="btn btn-sm btn-success" onclick="Finance.closePledge('${p.id}')">Close</button>`:''}
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>` : '<div class="empty-state"><i class="fas fa-building"></i><p>No bank pledges yet</p></div>'}
        </div>
      </div>`;
  },

  openPledgeForm() {
    const activeLoans = DB.getAll(DB.LOANS).filter(l => l.status !== 'Closed');
    const bankAccts   = DB.getAll(DB.ACCOUNTS).filter(a => a.type === 'bank');
    if (!activeLoans.length) { App.toast('No active loans to pledge', 'warning'); return; }
    App.openModal('New Bank Pledge', `
      <form id="pledge-form" onsubmit="Finance.savePledge(event)">
        <div class="form-group"><label>Link to Loan *</label>
          <select name="loanId" required>
            <option value="">— Select Loan —</option>
            ${activeLoans.map(l => `<option value="${l.id}">${l.id} — ${App.custName(l.customerId)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Bank Account *</label>
            <select name="bankAccountId" required>
              ${bankAccts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Pledge Amount (₹) *</label><input name="pledgeAmount" type="number" min="1" step="0.01" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Interest Rate (% / month) *</label><input name="interestRate" type="number" step="0.01" required value="1.5"></div>
          <div class="form-group"><label>Pledge Date *</label><input name="pledgeDate" type="date" value="${App.today()}" required></div>
          <div class="form-group"><label>Maturity Date *</label><input name="maturityDate" type="date" required></div>
        </div>
      </form>`,
      `<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
       <button class="btn btn-gold" onclick="document.getElementById('pledge-form').requestSubmit()"><i class="fas fa-save"></i> Save Pledge</button>`);
  },

  savePledge(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    d.id = DB.genId('PLG', DB.PLEDGES);
    d.pledgeAmount = parseFloat(d.pledgeAmount);
    d.interestRate = parseFloat(d.interestRate);
    d.status = 'Active';
    DB.add(DB.PLEDGES, d);
    App.toast('Pledge recorded!'); App.closeModal(); this.renderPledges();
  },

  closePledge(id) {
    if (!confirm('Mark this pledge as repaid?')) return;
    DB.update(DB.PLEDGES, id, { status: 'Repaid' });
    App.toast('Pledge closed!'); this.renderPledges();
  },

  // ── Income & Expenses ─────────────────────────────────────
  renderExpenses() {
    const el = document.getElementById('page-expenses');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-receipt"></i> Income & Expenses</h2>
        <button class="btn btn-gold" onclick="Finance.openExpenseForm()"><i class="fas fa-plus"></i> Add Entry</button>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="filter-row">
            <select id="exp-filter" class="filter-select" onchange="Finance.renderExpenseTable()">
              <option value="">All</option><option value="Income">Income</option><option value="Expense">Expense</option>
            </select>
          </div>
        </div>
        <div class="card-body p0"><div id="exp-table"></div></div>
      </div>`;
    this.renderExpenseTable();
  },

  renderExpenseTable() {
    const filter = document.getElementById('exp-filter')?.value;
    let data = DB.getAll(DB.EXPENSES);
    if (filter) data = data.filter(e => e.type === filter);
    data.sort((a,b) => new Date(b.date)-new Date(a.date));
    const totalIncome  = data.filter(e=>e.type==='Income').reduce((s,e)=>s+e.amount,0);
    const totalExpense = data.filter(e=>e.type==='Expense').reduce((s,e)=>s+e.amount,0);

    const wrap = document.getElementById('exp-table');
    wrap.innerHTML = `
      ${data.length ? `
        <table class="data-table">
          <thead><tr><th>ID</th><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th><th>Actions</th></tr></thead>
          <tbody>
            ${data.map(e => `<tr>
              <td>${e.id}</td>
              <td>${App.fmtDate(e.date)}</td>
              <td><span class="badge ${e.type==='Income'?'badge-active':'badge-overdue'}">${e.type}</span></td>
              <td>${e.category}</td>
              <td>${e.description||'—'}</td>
              <td class="${e.type==='Income'?'text-green':'text-red'}">${App.fmt(e.amount)}</td>
              <td><button class="btn btn-icon-sm btn-danger" onclick="Finance.deleteExpense('${e.id}')"><i class="fas fa-trash"></i></button></td>
            </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="5" class="text-right"><strong>Net</strong></td>
              <td class="${totalIncome-totalExpense>=0?'text-green':'text-red'}"><strong>${App.fmt(totalIncome-totalExpense)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>` : '<div class="empty-state"><i class="fas fa-receipt"></i><p>No entries found</p></div>'}`;
  },

  openExpenseForm() {
    const accounts = DB.getAll(DB.ACCOUNTS);
    App.openModal('Add Income / Expense Entry', `
      <form id="exp-form" onsubmit="Finance.saveExpense(event)">
        <div class="form-row">
          <div class="form-group"><label>Type *</label>
            <select name="type" required>
              <option value="Expense">Expense</option><option value="Income">Income</option>
            </select>
          </div>
          <div class="form-group"><label>Category *</label>
            <select name="category" required>
              ${['Rent','Electricity','Salary','Stationery','Maintenance','Other Expense','Other Income'].map(c=>`<option>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Amount (₹) *</label><input name="amount" type="number" min="0.01" step="0.01" required></div>
          <div class="form-group"><label>Date *</label><input name="date" type="date" value="${App.today()}" required></div>
        </div>
        <div class="form-group"><label>Account *</label>
          <select name="account" required>
            ${accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Description</label><input name="description" type="text" placeholder="Optional description"></div>
      </form>`,
      `<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
       <button class="btn btn-gold" onclick="document.getElementById('exp-form').requestSubmit()"><i class="fas fa-save"></i> Save</button>`);
  },

  saveExpense(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    d.id = DB.genId('EXP', DB.EXPENSES); d.amount = parseFloat(d.amount);
    DB.add(DB.EXPENSES, d);
    App.toast('Entry saved!'); App.closeModal(); this.renderExpenses();
  },

  deleteExpense(id) {
    if (!confirm('Delete this entry?')) return;
    DB.delete(DB.EXPENSES, id); App.toast('Entry deleted', 'warning'); this.renderExpenseTable();
  }
};
