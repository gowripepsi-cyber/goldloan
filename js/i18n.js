// ============================================================
//  i18n.js  –  Internationalisation: English ↔ தமிழ்
// ============================================================

const I18n = {
  current: 'en',

  translations: {
    en: {
      // Sidebar brand
      'brand-tag': 'Pawn Shop System',
      // Nav items
      'nav-dashboard': 'Dashboard',
      'nav-customers': 'Customers',
      'nav-pawn-transactions': 'Pawn Transactions',
      'nav-new-pawn': 'New Pawn',
      'nav-all-loans': 'All Loans',
      'nav-collections': 'Collections',
      'nav-due-collection': 'Due Collection',
      'nav-redemption': 'Jewel Redemption',
      'nav-finance': 'Finance',
      'nav-bank-accounts': 'Bank Accounts',
      'nav-bank-pledges': 'Bank Pledges',
      'nav-income-expenses': 'Income & Expenses',
      'nav-reports': 'Reports',
      'nav-settings': 'Settings',
      // Roles
      'role-admin': 'Administrator',
      'role-staff': 'Staff',
      // Language button
      'lang-btn': 'தமிழ்',
      // Header breadcrumb labels
      'page-dashboard': 'Dashboard',
      'page-customers': 'Customers',
      'page-new-loan': 'New Pawn',
      'page-loans': 'All Loans',
      'page-due-collection': 'Due Collection',
      'page-redemption': 'Jewel Redemption',
      'page-accounts': 'Bank Accounts',
      'page-pledges': 'Bank Pledges',
      'page-expenses': 'Income & Expenses',
      'page-reports': 'Reports',
      'page-settings': 'Settings',
      // Login
      'login-title': 'Gold Loan Manager',
      'login-subtitle': 'Pawn Shop Management System',
      'login-username-label': 'Username',
      'login-username-placeholder': 'Enter username',
      'login-password-label': 'Password',
      'login-password-placeholder': 'Enter password',
      'login-btn': 'Sign In',
      'login-error': 'Invalid username or password',
      'login-footer': 'Default: <strong>admin</strong> / <strong>admin123</strong>',
    },
    ta: {
      // Sidebar brand
      'brand-tag': 'அடகு கடை அமைப்பு',
      // Nav items
      'nav-dashboard': 'டாஷ்போர்டு',
      'nav-customers': 'வாடிக்கையாளர்கள்',
      'nav-pawn-transactions': 'அடகு பரிவர்த்தனைகள்',
      'nav-new-pawn': 'புதிய அடகு',
      'nav-all-loans': 'அனைத்து கடன்கள்',
      'nav-collections': 'வசூல்கள்',
      'nav-due-collection': 'நிலுவை வசூல்',
      'nav-redemption': 'நகை மீட்பு',
      'nav-finance': 'நிதி',
      'nav-bank-accounts': 'வங்கி கணக்குகள்',
      'nav-bank-pledges': 'வங்கி அடமானங்கள்',
      'nav-income-expenses': 'வருமானம் & செலவுகள்',
      'nav-reports': 'அறிக்கைகள்',
      'nav-settings': 'அமைப்புகள்',
      // Roles
      'role-admin': 'நிர்வாகி',
      'role-staff': 'பணியாளர்',
      // Language button
      'lang-btn': 'English',
      // Header breadcrumb labels
      'page-dashboard': 'டாஷ்போர்டு',
      'page-customers': 'வாடிக்கையாளர்கள்',
      'page-new-loan': 'புதிய அடகு',
      'page-loans': 'அனைத்து கடன்கள்',
      'page-due-collection': 'நிலுவை வசூல்',
      'page-redemption': 'நகை மீட்பு',
      'page-accounts': 'வங்கி கணக்குகள்',
      'page-pledges': 'வங்கி அடமானங்கள்',
      'page-expenses': 'வருமானம் & செலவுகள்',
      'page-reports': 'அறிக்கைகள்',
      'page-settings': 'அமைப்புகள்',
      // Login
      'login-title': 'தங்க கடன் மேலாளர்',
      'login-subtitle': 'அடகு கடை மேலாண்மை அமைப்பு',
      'login-username-label': 'பயனர் பெயர்',
      'login-username-placeholder': 'பயனர் பெயரை உள்ளிடவும்',
      'login-password-label': 'கடவுச்சொல்',
      'login-password-placeholder': 'கடவுச்சொல்லை உள்ளிடவும்',
      'login-btn': 'உள்நுழை',
      'login-error': 'தவறான பயனர் பெயர் அல்லது கடவுச்சொல்',
      'login-footer': 'இயல்புநிலை: <strong>admin</strong> / <strong>admin123</strong>',
    }
  },

  t(key) {
    return this.translations[this.current]?.[key] || this.translations['en'][key] || key;
  },

  toggle() {
    this.current = this.current === 'en' ? 'ta' : 'en';
    localStorage.setItem('gl_lang', this.current);
    this.apply();
  },

  init() {
    this.current = localStorage.getItem('gl_lang') || 'en';
    this.apply();
  },

  apply() {
    const t = this.t.bind(this);
    const lang = this.current;

    // ── Language toggle button label
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      const labelEl = langBtn.querySelector('.lang-btn-label');
      if (labelEl) labelEl.textContent = t('lang-btn');
    }

    // ── Sidebar brand tag
    const brandTag = document.querySelector('.brand-tag');
    if (brandTag) brandTag.textContent = t('brand-tag');

    // ── Nav items (use data-i18n attribute)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    // ── Sidebar user role
    const roleEl = document.getElementById('sidebar-user-role');
    if (roleEl) {
      const s = (typeof DB !== 'undefined') ? DB.get(DB.SESSION) : null;
      if (s) roleEl.textContent = s.role === 'admin' ? t('role-admin') : t('role-staff');
    }

    // ── Login page texts
    const loginTitle = document.querySelector('.login-title');
    if (loginTitle) loginTitle.textContent = t('login-title');
    const loginSubtitle = document.querySelector('.login-subtitle');
    if (loginSubtitle) loginSubtitle.textContent = t('login-subtitle');

    const unLabel = document.querySelector('label[for="login-username"]');
    if (unLabel) unLabel.innerHTML = `<i class="fas fa-user"></i> ${t('login-username-label')}`;
    const unInput = document.getElementById('login-username');
    if (unInput) unInput.placeholder = t('login-username-placeholder');

    const pwLabel = document.querySelector('label[for="login-password"]');
    if (pwLabel) pwLabel.innerHTML = `<i class="fas fa-lock"></i> ${t('login-password-label')}`;
    const pwInput = document.getElementById('login-password');
    if (pwInput) pwInput.placeholder = t('login-password-placeholder');

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn && !loginBtn.disabled)
      loginBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> ${t('login-btn')}`;

    const loginFooter = document.querySelector('.login-footer');
    if (loginFooter) loginFooter.innerHTML = t('login-footer');

    const loginError = document.getElementById('login-error');
    if (loginError) loginError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${t('login-error')}`;

    // ── Breadcrumb (refresh current page label)
    if (typeof App !== 'undefined') {
      const page = App.currentPage;
      const bc = document.getElementById('breadcrumb');
      if (bc) bc.innerHTML = `<span>${t('page-' + page) || page}</span>`;
    }

    // ── lang attribute on <html>
    document.documentElement.lang = lang === 'ta' ? 'ta' : 'en';
  }
};
