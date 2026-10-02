(function () {
  'use strict';

  // Simulasi autentikasi front-end menggunakan sessionStorage.
  // sessionStorage dipakai agar sesi otomatis hilang ketika tab/browser session berakhir.
  const AUTH_KEY = 'sittaAuth';
  const LOGIN_PAGE = 'login.html';
  const DEFAULT_PROTECTED_PAGE = 'dashboard.html';

  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function protectPage() {
    if (!isAuthenticated()) {
      const current = window.location.pathname.split('/').pop() || DEFAULT_PROTECTED_PAGE;
      const target = `${LOGIN_PAGE}?required=1&from=${encodeURIComponent(current)}`;
      window.location.replace(target);
      return false;
    }
    return true;
  }

  function protectLoginPage() {
    if (isAuthenticated()) {
      window.location.replace(DEFAULT_PROTECTED_PAGE);
      return false;
    }
    return true;
  }

  // Halaman yang tidak boleh dibuka tanpa autentikasi.
  const protectedPages = ['dashboard.html', 'tracking.html', 'stok.html'];
  const currentPage = window.location.pathname.split('/').pop() || '';

  if (protectedPages.includes(currentPage)) {
    protectPage();
  }

  if (currentPage === 'login.html') {
    protectLoginPage();
  }

  window.SittaAuth = {
    AUTH_KEY,
    isAuthenticated,
    protectPage,
    protectLoginPage,
    login(user) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem('sittaUser', user.nama);
      sessionStorage.setItem('sittaRole', user.role);
      sessionStorage.setItem('sittaLocation', user.lokasi);
      sessionStorage.setItem('sittaUserId', String(user.id));
      sessionStorage.setItem('sittaEmail', user.email || '');
    },
    logout() {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem('sittaUser');
      sessionStorage.removeItem('sittaRole');
      sessionStorage.removeItem('sittaLocation');
      sessionStorage.removeItem('sittaUserId');
      sessionStorage.removeItem('sittaEmail');
    }
  };
})();
