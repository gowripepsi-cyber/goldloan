// ============================================================
//  db.js  –  localStorage data layer for Gold Loan Manager
// ============================================================
const DB = {
  CUSTOMERS: 'gl_customers', LOANS: 'gl_loans', PAYMENTS: 'gl_payments',
  ACCOUNTS:  'gl_accounts',  EXPENSES: 'gl_expenses', PLEDGES: 'gl_pledges',
  SETTINGS:  'gl_settings',  USERS: 'gl_users', SESSION: 'gl_session',

  get(key)          { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val)     { localStorage.setItem(key, JSON.stringify(val)); },
  getAll(key)       { return this.get(key) || []; },
  saveAll(key, arr) { this.set(key, arr); },

  add(key, rec)  { const d = this.getAll(key); d.push(rec); this.saveAll(key, d); return rec; },
  findById(key, id) { return this.getAll(key).find(r => r.id === id) || null; },
  update(key, id, upd) {
    const d = this.getAll(key), i = d.findIndex(r => r.id === id);
    if (i === -1) return false; d[i] = { ...d[i], ...upd }; this.saveAll(key, d); return d[i];
  },
  delete(key, id) {
    const d = this.getAll(key), f = d.filter(r => r.id !== id);
    this.saveAll(key, f); return f.length < d.length;
  },

  genId(prefix, key) {
    const yr = new Date().getFullYear();
    if (prefix === 'GL') {
      const p = `GL-${yr}-`, ex = this.getAll(key).filter(r => r.id.startsWith(p));
      return p + String(ex.length + 1).padStart(3, '0');
    }
    return `${prefix}-${String(this.getAll(key).length + 1).padStart(3, '0')}`;
  },

  init() { if (!this.get(this.USERS)) this.seed(); },

  seed() {
    this.set(this.SETTINGS, {
      shopName:'Sri Lakshmi Gold Loans', address:'45 Gandhi Street, Chennai – 600001',
      phone:'9876543210', licenseNo:'GL-TN-2024-001', gstNo:'33ABCDE1234F1Z5',
      receiptHeader:'Sri Lakshmi Gold Loans', receiptFooter:'Thank you for your trust!',
      defaultInterestRate:2, defaultDuration:12, currency:'₹'
    });
    this.set(this.USERS, [
      { id:'USR-001', name:'Administrator', username:'admin', password:'admin123', role:'admin', dateAdded:'2026-01-01' }
    ]);
    this.set(this.ACCOUNTS, [
      { id:'ACCT-001', name:'Cash in Hand', accountNumber:'', bankName:'', openingBalance:500000, type:'cash', dateAdded:'2026-01-01' },
      { id:'ACCT-002', name:'SBI Savings Account', accountNumber:'1234567890', bankName:'State Bank of India', openingBalance:200000, type:'bank', dateAdded:'2026-01-01' }
    ]);
    this.set(this.CUSTOMERS, [
      { id:'CUST-001', name:'Ravi Kumar',     fatherName:'Suresh Kumar',  mobile:'9876543210', idProofType:'Aadhar',          panNumber:'ABCDE1234F', aadharNumber:'1234-5678-9012', nomineeName:'Priya Kumar',  nomineeRelation:'Spouse', address:'45 Gandhi Nagar, Chennai', photo:'', dateAdded:'2026-01-15' },
      { id:'CUST-002', name:'Meena Devi',     fatherName:'Krishnan',       mobile:'9876541234', idProofType:'Voter ID',         panNumber:'',           aadharNumber:'9876-5432-1012', nomineeName:'Suresh',       nomineeRelation:'Son',    address:'78 Anna Street, Chennai',  photo:'', dateAdded:'2026-01-20' },
      { id:'CUST-003', name:'Selvam Pillai',  fatherName:'Murugan Pillai', mobile:'9988776655', idProofType:'PAN',              panNumber:'XYZAB5678G', aadharNumber:'5678-1234-9090', nomineeName:'Kamala Pillai',nomineeRelation:'Spouse', address:'12 Nehru Road, Chennai',   photo:'', dateAdded:'2026-02-01' },
      { id:'CUST-004', name:'Lakshmi Priya',  fatherName:'Ramesh',         mobile:'9765432100', idProofType:'Aadhar',          panNumber:'PQRST9012H', aadharNumber:'3456-7890-1234', nomineeName:'Ramesh',       nomineeRelation:'Father', address:'33 Temple Street, Chennai',photo:'', dateAdded:'2026-02-10' },
      { id:'CUST-005', name:'Arjun Sharma',   fatherName:'Vijay Sharma',   mobile:'9654321076', idProofType:'Driving License', panNumber:'MNOPQ3456I', aadharNumber:'7890-1234-5678', nomineeName:'Anita Sharma', nomineeRelation:'Spouse', address:'56 MG Road, Chennai',       photo:'', dateAdded:'2026-02-15' }
    ]);
    this.set(this.LOANS, [
      { id:'GL-2026-001', customerId:'CUST-001', loanDate:'2026-01-15', dueDate:'2027-01-15',
        goldItems:[{ type:'Necklace', description:'Gold Necklace', grossWeight:22.5, netWeight:20.0, purity:'22K', value:105000, photo:'' }],
        totalNetWeight:20.0, totalEstimatedValue:105000, principal:80000, interestMode:'percentage', interestRate:2, issueFromAccount:'ACCT-001', notes:'', status:'Active' },
      { id:'GL-2026-002', customerId:'CUST-002', loanDate:'2026-01-20', dueDate:'2027-01-20',
        goldItems:[{ type:'Bangles', description:'2 Gold Bangles', grossWeight:30, netWeight:27, purity:'22K', value:141750, photo:'' },
                   { type:'Ring',    description:'Gold Ring',      grossWeight:5,  netWeight:4.5, purity:'22K', value:23625,  photo:'' }],
        totalNetWeight:31.5, totalEstimatedValue:165375, principal:120000, interestMode:'percentage', interestRate:2, issueFromAccount:'ACCT-001', notes:'', status:'Active' },
      { id:'GL-2026-003', customerId:'CUST-003', loanDate:'2026-02-01', dueDate:'2027-02-01',
        goldItems:[{ type:'Chain', description:'Gold Chain 18"', grossWeight:15, netWeight:13.5, purity:'18K', value:51975, photo:'' }],
        totalNetWeight:13.5, totalEstimatedValue:51975, principal:40000, interestMode:'percentage', interestRate:2.5, issueFromAccount:'ACCT-001', notes:'', status:'Active' },
      { id:'GL-2026-004', customerId:'CUST-004', loanDate:'2026-02-10', dueDate:'2026-03-10',
        goldItems:[{ type:'Earrings', description:'Gold Stud Earrings', grossWeight:8, netWeight:7, purity:'22K', value:36750, photo:'' }],
        totalNetWeight:7.0, totalEstimatedValue:36750, principal:30000, interestMode:'percentage', interestRate:2, issueFromAccount:'ACCT-001', notes:'', status:'Overdue' },
      { id:'GL-2026-005', customerId:'CUST-005', loanDate:'2026-02-15', dueDate:'2026-08-15',
        goldItems:[{ type:'Necklace', description:'Gold Mangalsutra', grossWeight:18, netWeight:16, purity:'22K', value:84000, photo:'' }],
        totalNetWeight:16.0, totalEstimatedValue:84000, principal:65000, interestMode:'percentage', interestRate:2, issueFromAccount:'ACCT-001', notes:'', status:'Active' },
      { id:'GL-2026-006', customerId:'CUST-001', loanDate:'2026-01-01', dueDate:'2026-07-01',
        goldItems:[{ type:'Ring', description:'Diamond Ring', grossWeight:6, netWeight:5.5, purity:'18K', value:21175, photo:'' }],
        totalNetWeight:5.5, totalEstimatedValue:21175, principal:15000, interestMode:'percentage', interestRate:2, issueFromAccount:'ACCT-001', notes:'', status:'Closed' }
    ]);
    this.set(this.PAYMENTS, [
      { id:'PAY-001', loanId:'GL-2026-001', date:'2026-02-15', amount:1600,  method:'Cash', discount:0, settleToAccount:'ACCT-001', type:'Interest',        remarks:'Feb interest',  runningBalance:80000 },
      { id:'PAY-002', loanId:'GL-2026-001', date:'2026-03-15', amount:1600,  method:'UPI',  discount:0, settleToAccount:'ACCT-001', type:'Interest',        remarks:'Mar interest',  runningBalance:80000 },
      { id:'PAY-003', loanId:'GL-2026-002', date:'2026-02-20', amount:2400,  method:'Cash', discount:0, settleToAccount:'ACCT-001', type:'Interest',        remarks:'Feb interest',  runningBalance:120000 },
      { id:'PAY-004', loanId:'GL-2026-003', date:'2026-03-01', amount:1000,  method:'Cash', discount:0, settleToAccount:'ACCT-001', type:'Interest',        remarks:'Mar interest',  runningBalance:40000 },
      { id:'PAY-005', loanId:'GL-2026-006', date:'2026-02-01', amount:300,   method:'Cash', discount:0, settleToAccount:'ACCT-001', type:'Interest',        remarks:'',              runningBalance:15000 },
      { id:'PAY-006', loanId:'GL-2026-006', date:'2026-03-01', amount:15300, method:'Cash', discount:0, settleToAccount:'ACCT-001', type:'Full Settlement', remarks:'Loan closed',   runningBalance:0 }
    ]);
    this.set(this.EXPENSES, [
      { id:'EXP-001', type:'Expense', category:'Rent',         amount:15000, date:'2026-03-01', description:'Shop Rent – March 2026',    account:'ACCT-001' },
      { id:'EXP-002', type:'Expense', category:'Electricity',  amount:2500,  date:'2026-03-05', description:'EB Bill – February 2026',   account:'ACCT-001' },
      { id:'EXP-003', type:'Income',  category:'Other Income', amount:5000,  date:'2026-03-10', description:'Valuation Charges',          account:'ACCT-001' }
    ]);
    this.set(this.PLEDGES, []);
  }
};
