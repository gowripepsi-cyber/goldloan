// ============================================================
//  customers.js  –  Customer CRUD
// ============================================================
const Customers = {
  searchTerm: '',
  _pendingPhoto: '',

  render() {
    const el = document.getElementById('page-customers');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-users"></i> Customers</h2>
        <button class="btn btn-gold" onclick="Customers.openForm()"><i class="fas fa-plus"></i> Add Customer</button>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="search-box"><i class="fas fa-search"></i>
            <input type="text" id="cust-search" placeholder="Search by name, mobile, code…" oninput="Customers.search(this.value)">
          </div>
          <span class="record-count" id="cust-count"></span>
        </div>
        <div class="card-body p0">
          <div id="cust-table-wrap"></div>
        </div>
      </div>`;
    this.renderTable('');
  },

  renderTable(term) {
    let data = DB.getAll(DB.CUSTOMERS);
    if (term) data = data.filter(c =>
      c.name.toLowerCase().includes(term) || c.mobile.includes(term) || c.id.toLowerCase().includes(term)
    );
    document.getElementById('cust-count').textContent = `${data.length} record(s)`;
    const wrap = document.getElementById('cust-table-wrap');
    if (!data.length) {
      wrap.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No customers found</p></div>';
      return;
    }
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr>
          <th>Photo</th><th>Code</th><th>Name</th><th>Father/Husband</th>
          <th>Mobile</th><th>ID Proof</th><th>Address</th><th>Active Loans</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${data.map(c => {
            const activeLoans = DB.getAll(DB.LOANS).filter(l => l.customerId === c.id && l.status !== 'Closed').length;
            const photoHtml = c.photo
              ? `<img src="${c.photo}" class="cust-thumb" alt="photo">`
              : `<div class="cust-thumb-placeholder"><i class="fas fa-user"></i></div>`;
            return `<tr>
              <td>${photoHtml}</td>
              <td><span class="code-badge">${c.id}</span></td>
              <td><strong>${c.name}</strong></td>
              <td>${c.fatherName || '—'}</td>
              <td><a href="tel:${c.mobile}" class="link">${c.mobile}</a></td>
              <td>${c.idProofType || '—'}</td>
              <td class="td-truncate">${c.address || '—'}</td>
              <td><span class="badge ${activeLoans ? 'badge-active' : 'badge-closed'}">${activeLoans}</span></td>
              <td class="actions-cell">
                <button class="btn btn-icon-sm btn-info"    title="View"   onclick="Customers.view('${c.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-icon-sm btn-warning" title="Edit"   onclick="Customers.openForm('${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-icon-sm btn-danger"  title="Delete" onclick="Customers.delete('${c.id}')"><i class="fas fa-trash"></i></button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  },

  search(val) {
    this.searchTerm = val.toLowerCase().trim();
    this.renderTable(this.searchTerm);
  },

  openForm(id = null) {
    const c = id ? DB.findById(DB.CUSTOMERS, id) : {};
    const title = id ? 'Edit Customer' : 'Add New Customer';

    // Store existing photo for use during save
    this._pendingPhoto = c.photo || '';

    // Build photo area HTML
    const existingPhoto = c.photo || '';
    const photoAreaInner = existingPhoto
      ? `<img id="photo-preview-img" src="${existingPhoto}" alt="preview">
         <div class="photo-change-overlay"><i class="fas fa-camera"></i> Change</div>`
      : `<div id="photo-preview-placeholder">
           <i class="fas fa-camera"></i>
           <span>Click to upload photo</span>
         </div>`;

    const body = `
      <form id="cust-form" onsubmit="Customers.save(event,'${id||''}')">

        <!-- ── Photo Upload ── -->
        <div class="photo-upload-section">
          <div class="photo-upload-area" id="photo-upload-area"
               onclick="document.getElementById('photo-file-input').click()"
               title="Click to upload customer photo">
            ${photoAreaInner}
          </div>
          <input type="file" id="photo-file-input" accept="image/*"
                 style="display:none" onchange="Customers.previewPhoto(this)">
          <div class="photo-upload-hint">
            <i class="fas fa-info-circle"></i> JPG, PNG or WEBP &nbsp;·&nbsp; Max 2 MB
          </div>
          ${existingPhoto
            ? `<button type="button" class="btn btn-sm btn-outline photo-remove-btn"
                       onclick="Customers.clearPhoto()">
                 <i class="fas fa-times"></i> Remove Photo
               </button>`
            : ''}
        </div>
        <hr class="photo-divider">

        <!-- ── Fields ── -->
        <div class="form-row">
          <div class="form-group"><label>Full Name *</label>
            <input name="name" value="${c.name||''}" required placeholder="Customer full name">
          </div>
          <div class="form-group"><label>Father / Husband Name *</label>
            <input name="fatherName" value="${c.fatherName||''}" required placeholder="Father or Husband name">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Mobile Number *</label>
            <input name="mobile" type="tel" maxlength="10" value="${c.mobile||''}" required placeholder="10-digit mobile">
          </div>
          <div class="form-group"><label>ID Proof Type *</label>
            <select name="idProofType" required>
              ${['Aadhar Card','Voter ID','PAN Card','Driving License','Ration Card'].map(o =>
                `<option ${c.idProofType===o?'selected':''}>${o}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>PAN Number</label>
            <input name="panNumber" value="${c.panNumber||''}" placeholder="ABCDE1234F">
          </div>
          <div class="form-group"><label>Aadhar Number</label>
            <input name="aadharNumber" value="${c.aadharNumber||''}" placeholder="XXXX-XXXX-XXXX">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Nominee Name</label>
            <input name="nomineeName" value="${c.nomineeName||''}" placeholder="Nominee full name">
          </div>
          <div class="form-group"><label>Nominee Relation</label>
            <select name="nomineeRelation">
              <option value="">—Select—</option>
              ${['Father','Mother','Brother','Sister','Spouse','Son','Daughter'].map(o =>
                `<option ${c.nomineeRelation===o?'selected':''}>${o}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label>Address *</label>
          <textarea name="address" rows="2" required placeholder="Full address">${c.address||''}</textarea>
        </div>
      </form>`;

    App.openModal(title, body, `
      <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-gold" onclick="document.getElementById('cust-form').requestSubmit()">
        <i class="fas fa-save"></i> Save Customer
      </button>`);
  },

  // Called when user picks a file from the file input
  previewPhoto(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      App.toast('Photo must be smaller than 2 MB', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      Customers._pendingPhoto = base64;
      const area = document.getElementById('photo-upload-area');
      if (area) {
        area.innerHTML = `
          <img id="photo-preview-img" src="${base64}" alt="preview">
          <div class="photo-change-overlay"><i class="fas fa-camera"></i> Change</div>`;
      }
      // Show remove button if not already shown
      const section = document.querySelector('.photo-upload-section');
      if (section && !document.querySelector('.photo-remove-btn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm btn-outline photo-remove-btn';
        btn.innerHTML = '<i class="fas fa-times"></i> Remove Photo';
        btn.onclick = () => Customers.clearPhoto();
        section.appendChild(btn);
      }
    };
    reader.readAsDataURL(file);
  },

  clearPhoto() {
    Customers._pendingPhoto = '';
    const area = document.getElementById('photo-upload-area');
    if (area) {
      area.innerHTML = `
        <div id="photo-preview-placeholder">
          <i class="fas fa-camera"></i>
          <span>Click to upload photo</span>
        </div>`;
    }
    const fileInput = document.getElementById('photo-file-input');
    if (fileInput) fileInput.value = '';
    const removeBtn = document.querySelector('.photo-remove-btn');
    if (removeBtn) removeBtn.remove();
  },

  save(e, id) {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = Object.fromEntries(f.entries());
    data.photo = Customers._pendingPhoto || '';

    if (id) {
      DB.update(DB.CUSTOMERS, id, data);
      App.toast('Customer updated successfully!');
    } else {
      data.id = DB.genId('CUST', DB.CUSTOMERS);
      data.dateAdded = App.today();
      DB.add(DB.CUSTOMERS, data);
      App.toast('Customer added successfully!');
    }
    App.closeModal();
    this.renderTable(this.searchTerm);
  },

  view(id) {
    const c = DB.findById(DB.CUSTOMERS, id);
    if (!c) return;
    const loans = DB.getAll(DB.LOANS).filter(l => l.customerId === id);

    const photoSection = c.photo
      ? `<div style="text-align:center;margin-bottom:18px">
           <img src="${c.photo}" class="cust-view-photo" alt="${c.name}">
           <div style="font-size:.75rem;color:#888;margin-top:6px">${c.name}</div>
         </div>`
      : `<div style="text-align:center;margin-bottom:18px">
           <div class="cust-view-photo-placeholder"><i class="fas fa-user"></i></div>
           <div style="font-size:.75rem;color:#888;margin-top:6px">No photo</div>
         </div>`;

    App.openModal(`Customer — ${c.name}`, `
      <div class="view-grid">
        ${photoSection}
        <div class="info-box">
          <div class="info-row"><span class="label">Customer ID</span><span class="value">${c.id}</span></div>
          <div class="info-row"><span class="label">Name</span><span class="value">${c.name}</span></div>
          <div class="info-row"><span class="label">Father/Husband</span><span class="value">${c.fatherName||'—'}</span></div>
          <div class="info-row"><span class="label">Mobile</span><span class="value">${c.mobile}</span></div>
          <div class="info-row"><span class="label">ID Proof</span><span class="value">${c.idProofType||'—'}</span></div>
          <div class="info-row"><span class="label">PAN</span><span class="value">${c.panNumber||'—'}</span></div>
          <div class="info-row"><span class="label">Aadhar</span><span class="value">${c.aadharNumber||'—'}</span></div>
          <div class="info-row"><span class="label">Nominee</span><span class="value">${c.nomineeName||'—'} (${c.nomineeRelation||'—'})</span></div>
          <div class="info-row"><span class="label">Address</span><span class="value">${c.address||'—'}</span></div>
          <div class="info-row"><span class="label">Added On</span><span class="value">${App.fmtDate(c.dateAdded)}</span></div>
        </div>
      </div>
      <h4 style="margin:16px 0 8px">Loan History (${loans.length})</h4>
      ${loans.length ? `
        <table class="data-table">
          <thead><tr><th>Loan ID</th><th>Date</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
          <tbody>
            ${loans.map(l => {
              const st = App.loanStatus(l);
              return `<tr>
                <td>${l.id}</td><td>${App.fmtDate(l.loanDate)}</td>
                <td>${App.fmt(l.principal)}</td><td>${App.fmtDate(l.dueDate)}</td>
                <td><span class="badge ${st.cls}">${st.label}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>` : '<p style="color:#888">No loan history</p>'}`,
      `<button class="btn btn-gold" onclick="App.closeModal()">Close</button>`);
  },

  delete(id) {
    const hasLoans = DB.getAll(DB.LOANS).some(l => l.customerId === id && l.status !== 'Closed');
    if (hasLoans) { App.toast('Cannot delete: customer has active loans', 'error'); return; }
    if (!confirm('Delete this customer? This action cannot be undone.')) return;
    DB.delete(DB.CUSTOMERS, id);
    App.toast('Customer deleted', 'warning');
    this.renderTable(this.searchTerm);
  }
};
