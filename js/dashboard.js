// ============================================================
//  dashboard.js  –  KPI cards + Charts
// ============================================================
const Dashboard = {
  charts: {},

  render() {
    const loans    = DB.getAll(DB.LOANS);
    const payments = DB.getAll(DB.PAYMENTS);
    const customers= DB.getAll(DB.CUSTOMERS);
    const today    = App.today();

    const active   = loans.filter(l => l.status !== 'Closed');
    const overdue  = active.filter(l => new Date(l.dueDate) < new Date() && l.status !== 'Closed');
    const todayPay = payments.filter(p => p.date === today).reduce((s,p) => s+p.amount, 0);
    const monthPay = payments.filter(p => p.date?.startsWith(today.slice(0,7))).reduce((s,p) => s+p.amount, 0);
    const totalPrincipal = active.reduce((s,l) => s+l.principal, 0);

    const recentLoans = [...loans].sort((a,b) => new Date(b.loanDate)-new Date(a.loanDate)).slice(0,5);

    const el = document.getElementById('page-dashboard');
    el.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-chart-pie"></i> Dashboard</h2>
        <div class="page-actions">
          <button class="btn btn-gold" onclick="App.navigate('new-loan')"><i class="fas fa-plus"></i> New Pawn</button>
          <button class="btn btn-outline" onclick="App.navigate('customers')"><i class="fas fa-user-plus"></i> Add Customer</button>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon"><i class="fas fa-gem"></i></div>
          <div class="kpi-body">
            <div class="kpi-value">${active.length}</div>
            <div class="kpi-label">Active Loans</div>
          </div>
        </div>
        <div class="kpi-card kpi-gold">
          <div class="kpi-icon"><i class="fas fa-rupee-sign"></i></div>
          <div class="kpi-body">
            <div class="kpi-value">${App.fmt(totalPrincipal)}</div>
            <div class="kpi-label">Total Principal Lent</div>
          </div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-icon"><i class="fas fa-hand-holding-usd"></i></div>
          <div class="kpi-body">
            <div class="kpi-value">${App.fmt(todayPay)}</div>
            <div class="kpi-label">Today's Collections</div>
          </div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon"><i class="fas fa-users"></i></div>
          <div class="kpi-body">
            <div class="kpi-value">${customers.length}</div>
            <div class="kpi-label">Total Customers</div>
          </div>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-icon"><i class="fas fa-calendar-check"></i></div>
          <div class="kpi-body">
            <div class="kpi-value">${App.fmt(monthPay)}</div>
            <div class="kpi-label">This Month Collections</div>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="kpi-body">
            <div class="kpi-value">${overdue.length}</div>
            <div class="kpi-label">Overdue Loans</div>
          </div>
        </div>
      </div>

      <!-- CHARTS ROW -->
      <div class="chart-row">
        <div class="card chart-card">
          <div class="card-header"><h3><i class="fas fa-bar-chart"></i> Monthly Disbursements</h3></div>
          <div class="card-body"><canvas id="chartDisburse" height="200"></canvas></div>
        </div>
        <div class="card chart-card">
          <div class="card-header"><h3><i class="fas fa-pie-chart"></i> Loan Status</h3></div>
          <div class="card-body"><canvas id="chartStatus" height="200"></canvas></div>
        </div>
      </div>

      <!-- QUICK ACCESS + RECENT LOANS -->
      <div class="dashboard-bottom">
        <div class="card quick-access-card">
          <div class="card-header"><h3><i class="fas fa-bolt"></i> Quick Access</h3></div>
          <div class="card-body">
            <div class="quick-grid">
              <button class="quick-btn" onclick="App.navigate('new-loan')"><i class="fas fa-plus-circle"></i><span>New Pawn</span></button>
              <button class="quick-btn" onclick="App.navigate('customers')"><i class="fas fa-user-plus"></i><span>Add Customer</span></button>
              <button class="quick-btn" onclick="App.navigate('due-collection')"><i class="fas fa-money-bill-wave"></i><span>Due Collection</span></button>
              <button class="quick-btn" onclick="App.navigate('redemption')"><i class="fas fa-unlock"></i><span>Redemption</span></button>
              <button class="quick-btn" onclick="App.navigate('reports')"><i class="fas fa-file-alt"></i><span>Reports</span></button>
              <button class="quick-btn" onclick="App.navigate('settings')"><i class="fas fa-cog"></i><span>Settings</span></button>
            </div>
          </div>
        </div>

        <div class="card recent-card">
          <div class="card-header">
            <h3><i class="fas fa-history"></i> Recent Loans</h3>
            <button class="btn btn-sm btn-outline" onclick="App.navigate('loans')">View All</button>
          </div>
          <div class="card-body p0">
            <table class="data-table">
              <thead><tr><th>Loan ID</th><th>Customer</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                ${recentLoans.map(l => {
                  const st = App.loanStatus(l);
                  return `<tr>
                    <td><a href="#" class="link" onclick="Loans.viewLoan('${l.id}');return false;">${l.id}</a></td>
                    <td>${App.custName(l.customerId)}</td>
                    <td>${App.fmt(l.principal)}</td>
                    <td>${App.fmtDate(l.loanDate)}</td>
                    <td><span class="badge ${st.cls}">${st.label}</span></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.renderCharts(loans, payments);
  },

  renderCharts(loans, payments) {
    // Destroy old charts
    Object.values(this.charts).forEach(c => c.destroy());
    this.charts = {};

    // Monthly disbursements (last 6 months)
    const months = [];
    const amounts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      months.push(d.toLocaleString('en-IN',{month:'short',year:'2-digit'}));
      amounts.push(loans.filter(l => l.loanDate?.startsWith(key)).reduce((s,l) => s+l.principal, 0));
    }

    const ctx1 = document.getElementById('chartDisburse');
    if (ctx1) {
      this.charts.disburse = new Chart(ctx1, {
        type: 'bar',
        data: { labels: months, datasets: [{ label:'Principal (₹)', data: amounts,
          backgroundColor:'rgba(245,158,11,0.7)', borderColor:'#f59e0b', borderWidth:2, borderRadius:6 }] },
        options: { responsive:true, plugins:{ legend:{display:false} },
          scales:{ y:{ ticks:{ callback: v => '₹'+v.toLocaleString('en-IN') } } } }
      });
    }

    // Status breakdown
    const statusCounts = { Active:0, Overdue:0, 'Due Soon':0, Closed:0 };
    loans.forEach(l => { const s = App.loanStatus(l); statusCounts[s.label] = (statusCounts[s.label]||0)+1; });
    const ctx2 = document.getElementById('chartStatus');
    if (ctx2) {
      this.charts.status = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{ data: Object.values(statusCounts),
            backgroundColor:['#10b981','#f43f5e','#f97316','#94a3b8'],
            borderWidth:0 }]
        },
        options: { responsive:true, cutout:'65%',
          plugins:{ legend:{ position:'bottom', labels:{ padding:15 } } } }
      });
    }
  }
};
