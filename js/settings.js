// ============================================================
//  settings.js  –  Shop Details + User Management
// ============================================================
const Settings = {
  activeTab: 'shop',

  render() {
    const el = document.getElementById('page-settings');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-cog"></i> Settings</h2>
      </div>
      <div class="report-tabs">
        <button class="report-tab ${this.activeTab==='shop'?'active':''}"  onclick="Settings.switchTab('shop')">Shop Details</button>
        <button class="report-tab ${this.activeTab==='users'?'active':''}" onclick="Settings.switchTab('users')">User Management</button>
        <button class="report-tab ${this.activeTab==='pw'?'active':''}"    onclick="Settings.switchTab('pw')">Change Password</button>
        <button class="report-tab ${this.activeTab==='data'?'active':''}"  onclick="Settings.switchTab('data')">Data Management</button>
      </div>
      <div id="settings-content"></div>`;
    this.switchTab(this.activeTab);
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
    const btn = document.querySelector(`.report-tab[onclick*="'${tab}'"]`);
    if (btn) btn.classList.add('active');
    const methods = { shop:this.shopTab, users:this.usersTab, pw:this.pwTab, data:this.dataTab };
    methods[tab]?.call(this);
  },

  shopTab() {
    const s = DB.get(DB.SETTINGS) || {};
    document.getElementById('settings-content').innerHTML = `
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-store"></i> Shop Details</h3></div>
        <div class="card-body">
          <form id="shop-form" onsubmit="Settings.saveShop(event)">
            <div class="form-row">
              <div class="form-group"><label>Shop Name *</label><input name="shopName" value="${s.shopName||''}" required placeholder="Your shop name"></div>
              <div class="form-group"><label>Phone Number *</label><input name="phone" value="${s.phone||''}" required placeholder="Contact number"></div>
            </div>
            <div class="form-group"><label>Address *</label><textarea name="address" rows="3" required placeholder="Shop full address">${s.address||''}</textarea></div>
            <div class="form-row">
              <div class="form-group"><label>License Number</label><input name="licenseNo" value="${s.licenseNo||''}" placeholder="Shop license number"></div>
              <div class="form-group"><label>GST Number</label><input name="gstNo" value="${s.gstNo||''}" placeholder="GST registration number"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Default Interest Rate (%) *</label><input name="defaultInterestRate" type="number" step="0.01" value="${s.defaultInterestRate||2}" required></div>
              <div class="form-group"><label>Default Loan Duration (months)</label><input name="defaultDuration" type="number" value="${s.defaultDuration||12}"></div>
              <div class="form-group"><label>Currency Symbol</label><input name="currency" value="${s.currency||'₹'}" maxlength="3"></div>
            </div>
            <hr style="margin:16px 0">
            <h4 style="margin-bottom:12px">Receipt Settings</h4>
            <div class="form-group"><label>Receipt Header Text</label><input name="receiptHeader" value="${s.receiptHeader||''}" placeholder="Shown at top of receipts"></div>
            <div class="form-group"><label>Receipt Footer Text</label><input name="receiptFooter" value="${s.receiptFooter||''}" placeholder="Shown at bottom of receipts"></div>
            <div class="form-actions form-actions-inline">
              <button type="submit" class="btn btn-gold"><i class="fas fa-save"></i> Save Shop Settings</button>
            </div>
          </form>
        </div>
      </div>`;
  },

  saveShop(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    d.defaultInterestRate = parseFloat(d.defaultInterestRate);
    d.defaultDuration     = parseInt(d.defaultDuration);
    DB.set(DB.SETTINGS, d);
    document.getElementById('sidebar-shop-name').textContent = d.shopName;
    App.toast('Shop settings saved successfully!');
  },

  usersTab() {
    const users = DB.getAll(DB.USERS);
    document.getElementById('settings-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-users-cog"></i> User Management</h3>
          <button class="btn btn-gold" onclick="Settings.openUserForm()"><i class="fas fa-plus"></i> Add User</button>
        </div>
        <div class="card-body p0">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Role</th><th>Date Added</th><th>Actions</th></tr></thead>
            <tbody>
              ${users.map(u => `<tr>
                <td>${u.id}</td>
                <td><strong>${u.name}</strong></td>
                <td>${u.username}</td>
                <td><span class="badge ${u.role==='admin'?'badge-active':'badge-closed'}">${u.role==='admin'?'Administrator':'Staff'}</span></td>
                <td>${App.fmtDate(u.dateAdded)}</td>
                <td class="actions-cell">
                  <button class="btn btn-icon-sm btn-warning" onclick="Settings.openUserForm('${u.id}')"><i class="fas fa-edit"></i></button>
                  ${users.length > 1 ? `<button class="btn btn-icon-sm btn-danger" onclick="Settings.deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  openUserForm(id = null) {
    const u = id ? DB.findById(DB.USERS, id) : {};
    App.openModal(id ? 'Edit User' : 'Add User', `
      <form id="user-form" onsubmit="Settings.saveUser(event,'${id||''}')">
        <div class="form-row">
          <div class="form-group"><label>Full Name *</label><input name="name" value="${u.name||''}" required placeholder="Full name"></div>
          <div class="form-group"><label>Username *</label><input name="username" value="${u.username||''}" required placeholder="Login username"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${id?'New Password (leave blank to keep)':'Password *'}</label><input name="password" type="password" ${id?'':'required'} placeholder="Password"></div>
          <div class="form-group"><label>Role *</label>
            <select name="role" required>
              <option value="admin" ${u.role==='admin'?'selected':''}>Administrator</option>
              <option value="staff" ${u.role==='staff'?'selected':''}>Staff</option>
            </select>
          </div>
        </div>
      </form>`,
      `<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
       <button class="btn btn-gold" onclick="document.getElementById('user-form').requestSubmit()"><i class="fas fa-save"></i> Save User</button>`);
  },

  saveUser(e, id) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    // Check username unique
    const existing = DB.getAll(DB.USERS).find(u => u.username === d.username && u.id !== id);
    if (existing) { App.toast('Username already exists!', 'error'); return; }
    if (id) {
      const updates = { name:d.name, username:d.username, role:d.role };
      if (d.password) updates.password = d.password;
      DB.update(DB.USERS, id, updates);
      App.toast('User updated!');
    } else {
      d.id = DB.genId('USR', DB.USERS); d.dateAdded = App.today();
      DB.add(DB.USERS, d); App.toast('User added!');
    }
    App.closeModal(); this.usersTab();
  },

  deleteUser(id) {
    const session = DB.get(DB.SESSION);
    if (session && session.userId === id) { App.toast('Cannot delete your own account!', 'error'); return; }
    if (!confirm('Delete this user?')) return;
    DB.delete(DB.USERS, id); App.toast('User deleted', 'warning'); this.usersTab();
  },

  pwTab() {
    document.getElementById('settings-content').innerHTML = `
      <div class="card" style="max-width:480px">
        <div class="card-header"><h3><i class="fas fa-key"></i> Change Password</h3></div>
        <div class="card-body">
          <form id="pw-form" onsubmit="Settings.changePassword(event)">
            <div class="form-group"><label>Current Password *</label><input name="current" type="password" required placeholder="Current password"></div>
            <div class="form-group"><label>New Password *</label><input name="newpw" type="password" required placeholder="New password" minlength="6"></div>
            <div class="form-group"><label>Confirm New Password *</label><input name="confirm" type="password" required placeholder="Re-enter new password"></div>
            <button type="submit" class="btn btn-gold"><i class="fas fa-save"></i> Update Password</button>
          </form>
        </div>
      </div>`;
  },

  changePassword(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    const session = DB.get(DB.SESSION);
    const user    = DB.findById(DB.USERS, session.userId);
    if (!user) return;
    if (user.password !== d.current)  { App.toast('Current password is incorrect', 'error');    return; }
    if (d.newpw !== d.confirm)        { App.toast('New passwords do not match', 'error');        return; }
    if (d.newpw.length < 6)           { App.toast('Password must be at least 6 characters', 'error'); return; }
    DB.update(DB.USERS, user.id, { password: d.newpw });
    App.toast('Password changed successfully!');
    e.target.reset();
  },

  dataTab() {
    const loans     = DB.getAll(DB.LOANS).length;
    const customers = DB.getAll(DB.CUSTOMERS).length;
    const payments  = DB.getAll(DB.PAYMENTS).length;
    document.getElementById('settings-content').innerHTML = `
      <div class="card" style="max-width:560px">
        <div class="card-header"><h3><i class="fas fa-database"></i> Data Management</h3></div>
        <div class="card-body">
          <div class="info-box" style="margin-bottom:16px">
            <div class="info-row"><span class="label">Customers</span><span class="value">${customers}</span></div>
            <div class="info-row"><span class="label">Loans</span><span class="value">${loans}</span></div>
            <div class="info-row"><span class="label">Payments</span><span class="value">${payments}</span></div>
            <div class="info-row"><span class="label">Storage Used</span><span class="value">${(JSON.stringify(localStorage).length/1024).toFixed(1)} KB</span></div>
          </div>
          <div class="danger-zone">
            <h4><i class="fas fa-exclamation-triangle"></i> Danger Zone</h4>
            <p>Export all data before clearing. This cannot be undone.</p>
            <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap">
              <button class="btn btn-outline" onclick="Settings.exportData()"><i class="fas fa-download"></i> Export Data (JSON)</button>
              <button class="btn btn-danger" onclick="Settings.clearData()"><i class="fas fa-trash"></i> Clear All Data</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  exportData() {
    const data = {
      customers: DB.getAll(DB.CUSTOMERS), loans: DB.getAll(DB.LOANS),
      payments:  DB.getAll(DB.PAYMENTS),  accounts: DB.getAll(DB.ACCOUNTS),
      expenses:  DB.getAll(DB.EXPENSES),  pledges: DB.getAll(DB.PLEDGES),
      settings:  DB.get(DB.SETTINGS),     exported: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `goldloan_backup_${App.today()}.json`;
    a.click();
    App.toast('Data exported successfully!');
  },

  clearData() {
    if (!confirm('⚠️ This will DELETE ALL data permanently. Are you sure?')) return;
    if (!confirm('LAST WARNING: All customers, loans, and payments will be lost. Continue?')) return;
    const session = DB.get(DB.SESSION);
    const keys = [DB.CUSTOMERS, DB.LOANS, DB.PAYMENTS, DB.ACCOUNTS, DB.EXPENSES, DB.PLEDGES, DB.SETTINGS, DB.USERS];
    keys.forEach(k => localStorage.removeItem(k));
    DB.init(); // re-seed
    DB.set(DB.SESSION, session);
    App.toast('All data cleared and reset to defaults', 'warning');
    this.render();
  }
};
