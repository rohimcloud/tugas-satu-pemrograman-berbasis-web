(function () {
  'use strict';

  const USERS_KEY = 'sittaUsers';
  const STOCK_KEY = 'sittaStocks';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return clone(fallback);
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : clone(fallback);
    } catch (error) {
      console.warn('Gagal membaca localStorage:', error);
      return clone(fallback);
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const seedUsers = typeof dataPengguna !== 'undefined' && Array.isArray(dataPengguna) ? dataPengguna : [];
  const seedStocks = typeof dataBahanAjar !== 'undefined' && Array.isArray(dataBahanAjar) ? dataBahanAjar : [];

  let users = read(USERS_KEY, seedUsers);
  let stocks = read(STOCK_KEY, seedStocks);

  // Expose the active front-end data using the same variable names as data.js.
  window.dataPengguna = users;
  window.dataBahanAjar = stocks;

  function saveUsers(nextUsers) {
    users = clone(nextUsers);
    write(USERS_KEY, users);
    window.dataPengguna = users;
    return users;
  }

  function saveStocks(nextStocks) {
    stocks = clone(nextStocks);
    write(STOCK_KEY, stocks);
    window.dataBahanAjar = stocks;
    return stocks;
  }

  function getUsers() {
    return clone(users);
  }

  function getStocks() {
    return clone(stocks);
  }

  function findUserByEmail(email) {
    const target = String(email || '').trim().toLowerCase();
    return users.find((user) => String(user.email || '').toLowerCase() === target) || null;
  }

  function registerUser(payload) {
    const name = String(payload.nama || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const role = String(payload.role || 'UPBJJ-UT').trim();
    const lokasi = String(payload.lokasi || 'UPBJJ Jakarta').trim();

    if (!name || !email || !password) {
      throw new Error('Data registrasi belum lengkap.');
    }

    if (findUserByEmail(email)) {
      throw new Error('Email tersebut sudah terdaftar.');
    }

    const nextId = users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 0) + 1;
    const newUser = { id: nextId, nama: name, email, password, role, lokasi };
    saveUsers([...users, newUser]);
    return newUser;
  }

  function resetPassword(email, newPassword) {
    const target = String(email || '').trim().toLowerCase();
    const index = users.findIndex((user) => String(user.email || '').toLowerCase() === target);
    if (index === -1) throw new Error('Email tidak ditemukan pada data pengguna.');

    const nextUsers = clone(users);
    nextUsers[index].password = newPassword;
    saveUsers(nextUsers);
    return nextUsers[index];
  }

  function addStock(item) {
    const nextStocks = [...stocks, clone(item)];
    saveStocks(nextStocks);
    return item;
  }

  function removeStock(index) {
    const nextStocks = clone(stocks);
    const removed = nextStocks.splice(index, 1)[0];
    saveStocks(nextStocks);
    return removed;
  }

  function resetDemoData() {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(STOCK_KEY);
    users = clone(seedUsers);
    stocks = clone(seedStocks);
    window.dataPengguna = users;
    window.dataBahanAjar = stocks;
    return { users: getUsers(), stocks: getStocks() };
  }

  window.SittaStore = {
    USERS_KEY,
    STOCK_KEY,
    getUsers,
    getStocks,
    findUserByEmail,
    registerUser,
    resetPassword,
    addStock,
    removeStock,
    saveUsers,
    saveStocks,
    resetDemoData
  };
})();
