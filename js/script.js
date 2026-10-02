(function () {
  'use strict';

  const qs = (selector, parent = document) => parent.querySelector(selector);
  const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  /*
   * data.js yang diberikan UT menggunakan beberapa struktur data berbeda:
   * - dataPengguna : array user untuk login
   * - dataBahanAjar : array stok bahan ajar
   * - dataTracking : object dengan nomor DO sebagai key
   * Fungsi di bawah menormalkan data tracking tanpa mengubah file data.js asli.
   */
  function getTrackingList() {
    if (typeof dataTracking === 'undefined' || !dataTracking) return [];

    return Object.entries(dataTracking).map(([nomorDO, item]) => ({
      nomorDO,
      ...item,
      progress: getTrackingProgress(item.status)
    }));
  }

  function getTrackingProgress(status = '') {
    const value = status.toLowerCase();
    if (value.includes('selesai')) return 100;
    if (value.includes('dalam perjalanan')) return 70;
    if (value.includes('dikirim')) return 85;
    if (value.includes('diproses')) return 40;
    if (value.includes('diterima')) return 20;
    return 25;
  }

  function showToast(message, type = 'info') {
    const container = qs('#toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const title = type === 'error' ? 'Perhatian' : type === 'success' ? 'Berhasil' : 'Info';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const span = document.createElement('span');
    span.textContent = message;
    toast.append(strong, span);

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 30);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    return container;
  }

  function initModals() {
    qsa('[data-modal-open]').forEach((button) => {
      button.addEventListener('click', () => openModal(button.dataset.modalOpen));
    });

    qsa('[data-modal-close]').forEach((button) => {
      button.addEventListener('click', closeParentModal);
    });

    qsa('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) backdrop.hidden = true;
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        qsa('.modal-backdrop').forEach((modal) => { modal.hidden = true; });
      }
    });
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.hidden = false;
  }

  function closeParentModal(event) {
    const backdrop = event.currentTarget.closest('.modal-backdrop');
    if (backdrop) backdrop.hidden = true;
  }

  function getInitials(name = 'Admin') {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  function getCurrentUser() {
    return {
      nama: sessionStorage.getItem('sittaUser') || 'Admin SITTA',
      role: sessionStorage.getItem('sittaRole') || 'Administrator',
      lokasi: sessionStorage.getItem('sittaLocation') || 'Pusat'
    };
  }

  function initLogin() {
    const form = qs('#loginForm');
    if (!form) return;

    const email = qs('#email');
    const password = qs('#password');
    const emailError = qs('#emailError');
    const passwordError = qs('#passwordError');
    const toggle = qs('#togglePassword');

    const params = new URLSearchParams(window.location.search);
    const requestedPage = params.get('from');
    const allowedTargets = ['dashboard.html', 'tracking.html', 'stok.html'];
    const loginTarget = allowedTargets.includes(requestedPage) ? requestedPage : 'dashboard.html';

    if (params.get('required') === '1') {
      showToast('Silakan login terlebih dahulu untuk mengakses halaman tersebut.', 'info');
      window.history.replaceState({}, document.title, 'login.html');
    }

    toggle?.addEventListener('click', () => {
      const showing = password.type === 'text';
      password.type = showing ? 'password' : 'text';
      toggle.textContent = showing ? 'Lihat' : 'Sembunyikan';
      toggle.setAttribute('aria-label', showing ? 'Tampilkan password' : 'Sembunyikan password');
    });

    function validate() {
      let valid = true;
      emailError.textContent = '';
      passwordError.textContent = '';
      email.classList.remove('input-error');
      password.classList.remove('input-error');

      if (!email.value.trim()) {
        emailError.textContent = 'Email wajib diisi.';
        email.classList.add('input-error');
        valid = false;
      } else if (!email.validity.valid) {
        emailError.textContent = 'Format email belum valid.';
        email.classList.add('input-error');
        valid = false;
      }

      if (!password.value) {
        passwordError.textContent = 'Password wajib diisi.';
        password.classList.add('input-error');
        valid = false;
      }
      return valid;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validate()) return;

      const credentialEmail = email.value.trim().toLowerCase();
      const users = window.SittaStore ? window.SittaStore.getUsers() : (typeof dataPengguna !== 'undefined' ? dataPengguna : []);
      const account = users.find((user) => String(user.email || '').toLowerCase() === credentialEmail && user.password === password.value);

      if (!account) {
        // Pesan mengikuti requirement tugas.
        showToast('email/password yang anda masukkan salah', 'error');
        return;
      }

      if (window.SittaAuth) {
        window.SittaAuth.login(account);
      }
      window.location.href = loginTarget;
    });

    qs('#forgotForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = qs('#forgotEmail');
      const newPassword = qs('#forgotNewPassword');
      const confirmPassword = qs('#forgotConfirmPassword');

      if (!input.checkValidity() || newPassword.value.length < 6) {
        if (!input.checkValidity()) input.reportValidity();
        else showToast('Password baru minimal 6 karakter.', 'error');
        return;
      }

      if (newPassword.value !== confirmPassword.value) {
        showToast('Konfirmasi password tidak sama.', 'error');
        return;
      }

      try {
        if (!window.SittaStore) throw new Error('Data store belum siap.');
        window.SittaStore.resetPassword(input.value, newPassword.value);
        qs('#forgotModal').hidden = true;
        event.target.reset();
        showToast('Password berhasil diperbarui. Silakan login dengan password baru.', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

    qs('#registerForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = qs('#regName').value.trim();
      const emailValue = qs('#regEmail');
      const passwordValue = qs('#regPassword').value;
      const confirmPassword = qs('#regConfirmPassword').value;
      const role = qs('#regRole').value;
      const lokasi = qs('#regLocation').value.trim();

      if (!name || !emailValue.checkValidity() || passwordValue.length < 6 || !lokasi) {
        if (!emailValue.checkValidity()) emailValue.reportValidity();
        else if (passwordValue.length < 6) showToast('Password minimal 6 karakter.', 'error');
        else showToast('Lengkapi data registrasi.', 'error');
        return;
      }

      if (passwordValue !== confirmPassword) {
        showToast('Konfirmasi password tidak sama.', 'error');
        return;
      }

      try {
        if (!window.SittaStore) throw new Error('Data store belum siap.');
        const user = window.SittaStore.registerUser({
          nama: name,
          email: emailValue.value,
          password: passwordValue,
          role,
          lokasi
        });
        qs('#registerModal').hidden = true;
        event.target.reset();
        showToast(`Akun ${user.nama} berhasil didaftarkan. Data pengguna tersimpan di browser untuk prototype ini.`, 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }

  function initDashboard() {
    if (!qs('#greeting')) return;

    const currentUser = getCurrentUser();
    const hour = new Date().getHours();
    const part = hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 19 ? 'sore' : 'malam';

    qs('#greeting').textContent = `Selamat ${part}, ${currentUser.nama} 👋`;
    qs('#localDate').textContent = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }).format(new Date());

    if (qs('#profileButton')) {
      qs('#profileButton .avatar').textContent = getInitials(currentUser.nama);
      qs('#profileButton .profile-text strong').textContent = currentUser.nama;
      qs('#profileButton .profile-text small').textContent = `${currentUser.role} • ${currentUser.lokasi}`;
    }

    const stockData = window.SittaStore ? window.SittaStore.getStocks() : (Array.isArray(dataBahanAjar) ? dataBahanAjar : []);
    qs('#totalStock').textContent = stockData
      .reduce((sum, item) => sum + Number(item.stok || 0), 0)
      .toLocaleString('id-ID');

    const trackingList = getTrackingList();
    const progressList = qs('#progressList');
    if (progressList) {
      progressList.innerHTML = '';
      trackingList.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'progress-row';

        const main = document.createElement('div');
        main.className = 'progress-main';
        main.innerHTML = `<div><strong>DO ${item.nomorDO}</strong><span>${item.nama} • ${item.status}</span></div><b>${item.progress}%</b>`;

        const track = document.createElement('div');
        track.className = 'progress-track';
        const fill = document.createElement('span');
        fill.style.width = `${item.progress}%`;
        track.appendChild(fill);

        row.append(main, track);
        progressList.appendChild(row);
      });
    }

    const preview = qs('#stockPreview');
    if (preview) {
      preview.innerHTML = '';
      stockData.slice(0, 5).forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><code>${item.kodeBarang}</code></td><td>${item.namaBarang}</td><td><strong>${Number(item.stok).toLocaleString('id-ID')}</strong></td>`;
        preview.appendChild(tr);
      });
    }

    const history = qs('#historyList');
    if (history) {
      history.innerHTML = '';
      const historyItems = trackingList.map((item) => ({
        title: `DO ${item.nomorDO} • ${item.status}`,
        subtitle: `${item.nama} • ${item.ekspedisi}`,
        time: item.tanggalKirim
      }));

      historyItems.forEach((item) => {
        const node = document.createElement('div');
        node.className = 'timeline-item';
        node.innerHTML = `<span class="timeline-dot"></span><div><strong>${item.title}</strong><p>${item.subtitle}</p><small>${item.time}</small></div>`;
        history.appendChild(node);
      });
    }

    qs('#reportToggle')?.addEventListener('click', () => {
      const menu = qs('#reportMenu');
      const expanded = qs('#reportToggle').getAttribute('aria-expanded') === 'true';
      qs('#reportToggle').setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open', !expanded);
    });

    qsa('[data-scroll-target]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const target = document.getElementById(link.dataset.scrollTarget);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    qs('#logoutButton')?.addEventListener('click', () => {
      if (window.SittaAuth) {
        window.SittaAuth.logout();
      } else {
        sessionStorage.clear();
      }
      window.location.href = 'login.html';
    });

    qs('#profileButton')?.addEventListener('click', () => {
      showToast(`${currentUser.nama} • ${currentUser.role} • ${currentUser.lokasi}`, 'info');
    });

    initTheme();
  }

  function initTracking() {
    const form = qs('#trackingForm');
    if (!form) return;
    const input = qs('#doNumber');

    function search(value) {
      const code = value.trim().replace(/^DO[- ]?/i, '');
      const trackingList = getTrackingList();
      const result = trackingList.find((item) => item.nomorDO === code || `DO-${item.nomorDO}`.toUpperCase() === value.trim().toUpperCase());
      renderTracking(result);
      if (!result) showToast('Nomor Delivery Order tidak ditemukan pada data dummy.', 'error');
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!input.value.trim()) {
        input.focus();
        showToast('Nomor Delivery Order wajib diisi.', 'error');
        return;
      }
      search(input.value);
    });

    qsa('[data-demo-do]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.dataset.demoDo;
        search(input.value);
      });
    });
  }

  function renderTracking(item) {
    const result = qs('#trackingResult');
    const empty = qs('#trackingEmpty');
    if (!item) {
      result.hidden = true;
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    result.hidden = false;

    const statusClass = item.progress === 100
      ? 'status-success'
      : item.progress >= 60
        ? 'status-warning'
        : 'status-info';

    const journey = Array.isArray(item.perjalanan) ? item.perjalanan : [];
    const completedCount = Math.min(journey.length, Math.max(1, Math.round(journey.length * (item.progress / 100))));

    const journeyHtml = journey.map((step, index) => `
      <div class="journey-item ${index < completedCount ? 'done' : ''}">
        <span class="timeline-dot"></span>
        <div>
          <strong>${step.keterangan}</strong>
          <small>${step.waktu}</small>
        </div>
      </div>
    `).join('');

    result.innerHTML = `
      <section class="panel tracking-summary">
        <div class="tracking-title">
          <div>
            <p class="eyebrow">DELIVERY ORDER</p>
            <h2>${item.nomorDO}</h2>
            <p>${item.nama}</p>
          </div>
          <span class="status-pill ${statusClass}">${item.status}</span>
        </div>

        <div class="big-progress">
          <div class="big-progress-label"><span>Progress pengiriman (simulasi)</span><strong>${item.progress}%</strong></div>
          <div class="progress-track"><span style="width:${item.progress}%"></span></div>
        </div>

        <div class="tracking-grid">
          <div><span>Ekspedisi</span><strong>${item.ekspedisi}</strong></div>
          <div><span>Tanggal Kirim</span><strong>${item.tanggalKirim}</strong></div>
          <div><span>Jenis Paket</span><strong>${item.paket}</strong></div>
          <div><span>Total Pembayaran</span><strong>${item.total}</strong></div>
          <div><span>Jumlah Riwayat</span><strong>${journey.length} event</strong></div>
        </div>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div><p class="eyebrow">RIWAYAT PERJALANAN</p><h2>Timeline Pengiriman</h2></div>
        </div>
        <div class="journey-list">${journeyHtml}</div>
      </section>
    `;
  }

  function initStock() {
    const body = qs('#stockTableBody');
    if (!body) return;

    let currentData = window.SittaStore ? window.SittaStore.getStocks() : (Array.isArray(dataBahanAjar) ? [...dataBahanAjar] : []);
    let uploadedCoverDataUrl = '';
    let uploadedCoverName = '';

    function status(stok) {
      if (stok <= 100) return { text: 'Menipis', className: 'status-danger' };
      if (stok <= 250) return { text: 'Perlu dipantau', className: 'status-warning' };
      return { text: 'Aman', className: 'status-success' };
    }

    function render(filter = '') {
      const keyword = filter.trim().toLowerCase();
      const filtered = currentData.filter((item) => {
        const searchable = [item.kodeLokasi, item.kodeBarang, item.namaBarang, item.jenisBarang, item.edisi]
          .join(' ')
          .toLowerCase();
        return searchable.includes(keyword);
      });

      body.innerHTML = '';

      filtered.forEach((item, index) => {
        const originalIndex = currentData.indexOf(item);
        const st = status(Number(item.stok));
        const tr = document.createElement('tr');
        const cover = item.cover || '';

        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${cover ? `<img class="stock-cover-thumb" src="${cover}" alt="Cover ${item.namaBarang}" loading="lazy">` : '<span class="stock-cover-empty">—</span>'}</td>
          <td><code>${item.kodeLokasi}</code></td>
          <td><code>${item.kodeBarang}</code></td>
          <td><strong>${item.namaBarang}</strong></td>
          <td>${item.jenisBarang}</td>
          <td>${item.edisi}</td>
          <td><strong>${Number(item.stok).toLocaleString('id-ID')}</strong></td>
          <td><span class="status-pill ${st.className}">${st.text}</span></td>
          <td><button class="table-action" type="button" data-delete-index="${originalIndex}" aria-label="Hapus ${item.kodeBarang}">Hapus</button></td>
        `;
        body.appendChild(tr);
      });

      qs('#stockCount').textContent = `${filtered.length} data`;

      qsa('[data-delete-index]').forEach((button) => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.deleteIndex);
          const removed = window.SittaStore ? window.SittaStore.removeStock(index) : currentData.splice(index, 1)[0];
          currentData = window.SittaStore ? window.SittaStore.getStocks() : currentData;
          render(qs('#stockSearch').value);
          showToast(`${removed.kodeBarang} dihapus dari data stok.`, 'success');
        });
      });
    }

    function resetCoverState() {
      uploadedCoverDataUrl = '';
      uploadedCoverName = '';
      const preview = qs('#coverPreview');
      if (preview) {
        preview.hidden = true;
        preview.src = '';
      }
      const fileInput = qs('#stockCoverFile');
      if (fileInput) fileInput.value = '';
    }

    function prepareImage(file) {
      return new Promise((resolve, reject) => {
        if (!file) {
          resolve({ dataUrl: '', name: '' });
          return;
        }
        if (!file.type.startsWith('image/')) {
          reject(new Error('File cover harus berupa gambar.'));
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error('Ukuran gambar maksimal 5 MB.'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const image = new Image();
          image.onload = () => {
            const maxWidth = 1200;
            const maxHeight = 1600;
            const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve({
              dataUrl: canvas.toDataURL('image/jpeg', 0.82),
              name: file.name
            });
          };
          image.onerror = () => reject(new Error('Cover tidak dapat dibaca sebagai gambar.'));
          image.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file cover.'));
        reader.readAsDataURL(file);
      });
    }

    render();

    qs('#stockSearch')?.addEventListener('input', (event) => render(event.target.value));
    qs('#addStockButton')?.addEventListener('click', () => {
      resetCoverState();
      openModal('stockModal');
    });

    qs('#stockCoverFile')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const result = await prepareImage(file);
        uploadedCoverDataUrl = result.dataUrl;
        uploadedCoverName = result.name;
        const preview = qs('#coverPreview');
        if (preview) {
          preview.src = uploadedCoverDataUrl;
          preview.hidden = false;
        }
        qs('#coverFileName').textContent = result.name;
      } catch (error) {
        resetCoverState();
        showToast(error.message, 'error');
      }
    });

    qs('#stockForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();

      const lokasi = qs('#stockLocation').value.trim().toUpperCase();
      const code = qs('#stockCode').value.trim().toUpperCase();
      const name = qs('#stockName').value.trim();
      const type = qs('#stockType').value;
      const edition = Number(qs('#stockEdition').value);
      const qty = Number(qs('#stockQty').value);

      if (!lokasi || !code || !name || Number.isNaN(edition) || Number.isNaN(qty) || edition < 1 || qty < 0) {
        showToast('Lengkapi data stok dengan benar.', 'error');
        return;
      }

      if (!uploadedCoverDataUrl) {
        showToast('Silakan upload cover bahan ajar.', 'error');
        return;
      }

      const newItem = {
        kodeLokasi: lokasi,
        kodeBarang: code,
        namaBarang: name,
        jenisBarang: type,
        edisi: String(edition),
        stok: qty,
        cover: uploadedCoverDataUrl,
        coverName: uploadedCoverName,
        coverStorage: 'localStorage'
      };

      if (window.SittaStore) {
        window.SittaStore.addStock(newItem);
        currentData = window.SittaStore.getStocks();
      } else {
        currentData.push(newItem);
      }

      render(qs('#stockSearch').value);
      qs('#stockModal').hidden = true;
      event.target.reset();
      resetCoverState();
      showToast(`${code} berhasil ditambahkan melalui JavaScript DOM. Cover tersimpan di browser.`, 'success');
    });

    qs('#stockModal')?.addEventListener('click', (event) => {
      if (event.target.matches('[data-modal-close]')) resetCoverState();
    });
  }

  function initTheme() {
    const button = qs('#themeToggle');
    if (!button) return;

    const saved = localStorage.getItem('sittaTheme');
    if (saved === 'dark') document.documentElement.dataset.theme = 'dark';

    button.addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      document.documentElement.dataset.theme = dark ? '' : 'dark';
      localStorage.setItem('sittaTheme', dark ? 'light' : 'dark');
    });
  }

  initModals();
  initLogin();
  initDashboard();
  initTracking();
  initStock();
})();
