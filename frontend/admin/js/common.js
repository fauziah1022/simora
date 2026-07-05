/* ==========================================================================
   SIMORA - common.js
   Digunakan di semua halaman: auth guard, render sidebar/topbar, toast,
   helper localStorage, dan konfigurasi endpoint API backend (Express+PG).
   ========================================================================== */

/* ============================= KONFIGURASI API =============================
   Frontend ini sudah disiapkan untuk integrasi backend Express.js + PostgreSQL.
   Saat backend sudah tersedia, cukup ganti USE_API menjadi true.
============================================================================ */
const API_BASE_URL = 'http://localhost:3000/api';
const USE_API = false; // set true jika backend Express sudah berjalan

const API_ENDPOINTS = {
  login: `${API_BASE_URL}/login`,
  mobil: `${API_BASE_URL}/mobil`,
  customer: `${API_BASE_URL}/customer`,
  rental: `${API_BASE_URL}/rental`,
  pengembalian: `${API_BASE_URL}/pengembalian`,
  laporan: `${API_BASE_URL}/laporan`,
};

/**
 * Wrapper fetch generik ke REST API backend.
 * Dipakai oleh masing-masing file JS halaman ketika USE_API = true.
 */
async function apiRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ============================= AUTH GUARD ============================= */
function checkAuth() {
  const isLoggedIn = localStorage.getItem('simora_logged_in');
  const role = localStorage.getItem('simora_role');
  if (isLoggedIn !== 'true' || role !== 'admin') {
    window.location.href = 'index.html';
  }
}

function doLogout() {
  localStorage.removeItem('simora_logged_in');
  localStorage.removeItem('simora_admin_name');
  localStorage.removeItem('simora_role');
  window.location.href = 'index.html';
}

/* ============================= STORAGE HELPER ============================= */
const Storage = {
  get(key, fallback = []) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  seedIfEmpty(key, seedData) {
    const raw = localStorage.getItem(key);
    if (!raw) this.set(key, seedData);
  }
};

/* ============================= FORMAT HELPER ============================= */
function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

/* ============================= TOAST ============================= */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = {
    success: 'fa-circle-check',
    danger: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation'
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type === 'success' ? '' : type}`.trim();
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.success}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ============================= CONFIRM DIALOG ============================= */
function showConfirm(message, onConfirm) {
  const existing = document.getElementById('confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:380px; text-align:center;">
      <div class="modal-body">
        <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3 style="margin-bottom:8px; color:#fff;">Konfirmasi</h3>
        <p style="color: var(--text-muted); font-size:13px;">${message}</p>
      </div>
      <div class="modal-foot" style="justify-content:center;">
        <button class="btn btn-outline" id="confirm-cancel">Batal</button>
        <button class="btn btn-danger" id="confirm-ok">Ya, Hapus</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#confirm-ok').addEventListener('click', () => {
    onConfirm();
    overlay.remove();
  });
}

/* ============================= SEED DATA DUMMY ============================= */
const CABANG_LIST = ['Pusat', 'Bandung', 'Garut', 'Tasikmalaya'];

function seedInitialData() {
  Storage.seedIfEmpty('simora_mobil', [
    { id: 'MBL-001', nama: 'Toyota Fortuner', plat: 'B 1023 FTR', merk: 'Toyota', tahun: 2023, harga: 750000, cabang: 'Pusat', status: 'Tersedia', foto: '' },
    { id: 'MBL-002', nama: 'Honda CR-V', plat: 'B 2045 CRV', merk: 'Honda', tahun: 2022, harga: 650000, cabang: 'Pusat', status: 'Disewa', foto: '' },
    { id: 'MBL-003', nama: 'Daihatsu Xenia', plat: 'B 3067 XEN', merk: 'Daihatsu', tahun: 2022, harga: 320000, cabang: 'Pusat', status: 'Tersedia', foto: '' },
    { id: 'MBL-004', nama: 'Mitsubishi Pajero Sport', plat: 'B 4089 PJR', merk: 'Mitsubishi', tahun: 2023, harga: 850000, cabang: 'Pusat', status: 'Tersedia', foto: 'img/pajero.jpg' },
    { id: 'MBL-005', nama: 'Toyota Avanza', plat: 'D 5678 XYZ', merk: 'Toyota', tahun: 2021, harga: 350000, cabang: 'Bandung', status: 'Disewa', foto: '' },
    { id: 'MBL-006', nama: 'Honda Brio', plat: 'D 6712 BRO', merk: 'Honda', tahun: 2023, harga: 300000, cabang: 'Bandung', status: 'Tersedia', foto: '' },
    { id: 'MBL-007', nama: 'Mitsubishi Xpander', plat: 'D 7734 XPD', merk: 'Mitsubishi', tahun: 2023, harga: 400000, cabang: 'Bandung', status: 'Tersedia', foto: '' },
    { id: 'MBL-008', nama: 'Suzuki Ertiga', plat: 'D 8856 ERT', merk: 'Suzuki', tahun: 2022, harga: 340000, cabang: 'Bandung', status: 'Disewa', foto: '' },
    { id: 'MBL-009', nama: 'Honda Brio', plat: 'Z 9012 BRG', merk: 'Honda', tahun: 2022, harga: 290000, cabang: 'Garut', status: 'Tersedia', foto: '' },
    { id: 'MBL-010', nama: 'Toyota Calya', plat: 'Z 1034 CLY', merk: 'Toyota', tahun: 2021, harga: 250000, cabang: 'Garut', status: 'Disewa', foto: '' },
    { id: 'MBL-011', nama: 'Daihatsu Ayla', plat: 'Z 2056 AYL', merk: 'Daihatsu', tahun: 2023, harga: 230000, cabang: 'Garut', status: 'Tersedia', foto: '' },
    { id: 'MBL-012', nama: 'Suzuki APV', plat: 'Z 3078 APV', merk: 'Suzuki', tahun: 2020, harga: 310000, cabang: 'Garut', status: 'Tersedia', foto: '' },
    { id: 'MBL-013', nama: 'Toyota Innova Reborn', plat: 'Z 4090 INV', merk: 'Toyota', tahun: 2020, harga: 550000, cabang: 'Tasikmalaya', status: 'Disewa', foto: '' },
    { id: 'MBL-014', nama: 'Toyota Rush', plat: 'Z 5112 RSH', merk: 'Toyota', tahun: 2022, harga: 380000, cabang: 'Tasikmalaya', status: 'Tersedia', foto: '' },
    { id: 'MBL-015', nama: 'Honda Mobilio', plat: 'Z 6134 MBL', merk: 'Honda', tahun: 2021, harga: 320000, cabang: 'Tasikmalaya', status: 'Tersedia', foto: '' },
    { id: 'MBL-016', nama: 'Daihatsu Xenia', plat: 'Z 7156 XNT', merk: 'Daihatsu', tahun: 2022, harga: 310000, cabang: 'Tasikmalaya', status: 'Disewa', foto: '' },
  ]);

  Storage.seedIfEmpty('simora_customer', [
    { id: 'CUST-001', nama: 'Dewi Lestari', nik: '3171010101930001', hp: '081399988801', alamat: 'Jl. Sudirman No. 1, Jakarta', email: 'dewi.lestari@mail.com', cabang: 'Pusat' },
    { id: 'CUST-002', nama: 'Hendra Gunawan', nik: '3171010101880002', hp: '081399988802', alamat: 'Jl. Thamrin No. 12, Jakarta', email: 'hendra.gunawan@mail.com', cabang: 'Pusat' },
    { id: 'CUST-003', nama: 'Maya Puspita', nik: '3171010101910003', hp: '081399988803', alamat: 'Jl. Gatot Subroto No. 8, Jakarta', email: 'maya.puspita@mail.com', cabang: 'Pusat' },
    { id: 'CUST-004', nama: 'Reza Firmansyah', nik: '3171010101950004', hp: '081399988804', alamat: 'Jl. Rasuna Said No. 20, Jakarta', email: 'reza.firmansyah@mail.com', cabang: 'Pusat' },
    { id: 'CUST-005', nama: 'Nadia Salsabila', nik: '3171010101920005', hp: '081399988805', alamat: 'Jl. Kuningan No. 5, Jakarta', email: 'nadia.salsabila@mail.com', cabang: 'Pusat' },
    { id: 'CUST-006', nama: 'Budi Santoso', nik: '3273010101900006', hp: '081234567806', alamat: 'Jl. Merdeka No. 10, Bandung', email: 'budi.santoso@mail.com', cabang: 'Bandung' },
    { id: 'CUST-007', nama: 'Siti Aminah', nik: '3273010101920007', hp: '081298765407', alamat: 'Jl. Asia Afrika No. 5, Bandung', email: 'siti.aminah@mail.com', cabang: 'Bandung' },
    { id: 'CUST-008', nama: 'Fajar Ramadhan', nik: '3273010101890008', hp: '081298765408', alamat: 'Jl. Dago No. 45, Bandung', email: 'fajar.ramadhan@mail.com', cabang: 'Bandung' },
    { id: 'CUST-009', nama: 'Lina Marlina', nik: '3273010101940009', hp: '081298765409', alamat: 'Jl. Riau No. 30, Bandung', email: 'lina.marlina@mail.com', cabang: 'Bandung' },
    { id: 'CUST-010', nama: 'Yusuf Maulana', nik: '3273010101910010', hp: '081298765410', alamat: 'Jl. Buah Batu No. 18, Bandung', email: 'yusuf.maulana@mail.com', cabang: 'Bandung' },
    { id: 'CUST-011', nama: 'Andi Wijaya', nik: '3204010101880011', hp: '081311122211', alamat: 'Jl. Ciledug No. 22, Garut', email: 'andi.wijaya@mail.com', cabang: 'Garut' },
    { id: 'CUST-012', nama: 'Putri Handayani', nik: '3204010101930012', hp: '081311122212', alamat: 'Jl. Cimanuk No. 14, Garut', email: 'putri.handayani@mail.com', cabang: 'Garut' },
    { id: 'CUST-013', nama: 'Agus Setiadi', nik: '3204010101890013', hp: '081311122213', alamat: 'Jl. Otista No. 9, Garut', email: 'agus.setiadi@mail.com', cabang: 'Garut' },
    { id: 'CUST-014', nama: 'Rani Oktaviani', nik: '3204010101920014', hp: '081311122214', alamat: 'Jl. Guntur No. 3, Garut', email: 'rani.oktaviani@mail.com', cabang: 'Garut' },
    { id: 'CUST-015', nama: 'Dedi Kurniawan', nik: '3204010101870015', hp: '081311122215', alamat: 'Jl. Pembangunan No. 7, Garut', email: 'dedi.kurniawan@mail.com', cabang: 'Garut' },
    { id: 'CUST-016', nama: 'Rina Kartika', nik: '3278010101950016', hp: '081355566616', alamat: 'Jl. Cihideung No. 8, Tasikmalaya', email: 'rina.kartika@mail.com', cabang: 'Tasikmalaya' },
    { id: 'CUST-017', nama: 'Bayu Anggara', nik: '3278010101890017', hp: '081355566617', alamat: 'Jl. HZ Mustofa No. 25, Tasikmalaya', email: 'bayu.anggara@mail.com', cabang: 'Tasikmalaya' },
    { id: 'CUST-018', nama: 'Sinta Amelia', nik: '3278010101940018', hp: '081355566618', alamat: 'Jl. Sutisna Senjaya No. 11, Tasikmalaya', email: 'sinta.amelia@mail.com', cabang: 'Tasikmalaya' },
    { id: 'CUST-019', nama: 'Wahyu Hidayat', nik: '3278010101910019', hp: '081355566619', alamat: 'Jl. Yudanegara No. 6, Tasikmalaya', email: 'wahyu.hidayat@mail.com', cabang: 'Tasikmalaya' },
    { id: 'CUST-020', nama: 'Fitriani Nur', nik: '3278010101930020', hp: '081355566620', alamat: 'Jl. Empang No. 2, Tasikmalaya', email: 'fitriani.nur@mail.com', cabang: 'Tasikmalaya' },
  ]);

  Storage.seedIfEmpty('simora_rental', [
    { id: 'RNT-001', mobilId: 'MBL-002', customerId: 'CUST-001', cabang: 'Pusat', tglRental: '2026-06-25', tglKembali: '2026-07-01', status: 'Berjalan' },
    { id: 'RNT-002', mobilId: 'MBL-001', customerId: 'CUST-003', cabang: 'Pusat', tglRental: '2026-06-10', tglKembali: '2026-06-15', status: 'Selesai' },
    { id: 'RNT-003', mobilId: 'MBL-004', customerId: 'CUST-002', cabang: 'Pusat', tglRental: '2026-06-05', tglKembali: '2026-06-08', status: 'Dibatalkan' },
    { id: 'RNT-004', mobilId: 'MBL-003', customerId: 'CUST-004', cabang: 'Pusat', tglRental: '2026-06-18', tglKembali: '2026-06-21', status: 'Selesai' },
    { id: 'RNT-005', mobilId: 'MBL-005', customerId: 'CUST-006', cabang: 'Bandung', tglRental: '2026-06-28', tglKembali: '2026-07-03', status: 'Berjalan' },
    { id: 'RNT-006', mobilId: 'MBL-008', customerId: 'CUST-007', cabang: 'Bandung', tglRental: '2026-06-29', tglKembali: '2026-07-05', status: 'Berjalan' },
    { id: 'RNT-007', mobilId: 'MBL-006', customerId: 'CUST-008', cabang: 'Bandung', tglRental: '2026-06-01', tglKembali: '2026-06-04', status: 'Selesai' },
    { id: 'RNT-008', mobilId: 'MBL-007', customerId: 'CUST-009', cabang: 'Bandung', tglRental: '2026-06-12', tglKembali: '2026-06-14', status: 'Selesai' },
    { id: 'RNT-009', mobilId: 'MBL-010', customerId: 'CUST-011', cabang: 'Garut', tglRental: '2026-06-30', tglKembali: '2026-07-06', status: 'Berjalan' },
    { id: 'RNT-010', mobilId: 'MBL-009', customerId: 'CUST-012', cabang: 'Garut', tglRental: '2026-06-01', tglKembali: '2026-06-04', status: 'Selesai' },
    { id: 'RNT-011', mobilId: 'MBL-011', customerId: 'CUST-013', cabang: 'Garut', tglRental: '2026-06-15', tglKembali: '2026-06-18', status: 'Dibatalkan' },
    { id: 'RNT-012', mobilId: 'MBL-012', customerId: 'CUST-014', cabang: 'Garut', tglRental: '2026-06-20', tglKembali: '2026-06-23', status: 'Selesai' },
    { id: 'RNT-013', mobilId: 'MBL-013', customerId: 'CUST-016', cabang: 'Tasikmalaya', tglRental: '2026-06-27', tglKembali: '2026-07-02', status: 'Berjalan' },
    { id: 'RNT-014', mobilId: 'MBL-016', customerId: 'CUST-017', cabang: 'Tasikmalaya', tglRental: '2026-06-01', tglKembali: '2026-06-04', status: 'Selesai' },
    { id: 'RNT-015', mobilId: 'MBL-014', customerId: 'CUST-018', cabang: 'Tasikmalaya', tglRental: '2026-06-10', tglKembali: '2026-06-12', status: 'Selesai' },
    { id: 'RNT-016', mobilId: 'MBL-015', customerId: 'CUST-019', cabang: 'Tasikmalaya', tglRental: '2026-06-22', tglKembali: '2026-06-24', status: 'Dibatalkan' },
  ]);

  Storage.seedIfEmpty('simora_pengembalian', [
    { id: 'PGB-001', rentalId: 'RNT-002', tglKembaliAktual: '2026-06-16', denda: 100000, keterangan: 'Terlambat 1 hari' },
    { id: 'PGB-002', rentalId: 'RNT-004', tglKembaliAktual: '2026-06-21', denda: 0, keterangan: 'Tepat waktu' },
    { id: 'PGB-003', rentalId: 'RNT-007', tglKembaliAktual: '2026-06-04', denda: 0, keterangan: 'Tepat waktu' },
    { id: 'PGB-004', rentalId: 'RNT-008', tglKembaliAktual: '2026-06-16', denda: 200000, keterangan: 'Terlambat 2 hari' },
    { id: 'PGB-005', rentalId: 'RNT-010', tglKembaliAktual: '2026-06-04', denda: 0, keterangan: 'Tepat waktu' },
    { id: 'PGB-006', rentalId: 'RNT-012', tglKembaliAktual: '2026-06-24', denda: 100000, keterangan: 'Terlambat 1 hari' },
    { id: 'PGB-007', rentalId: 'RNT-014', tglKembaliAktual: '2026-06-04', denda: 0, keterangan: 'Tepat waktu' },
    { id: 'PGB-008', rentalId: 'RNT-015', tglKembaliAktual: '2026-06-13', denda: 100000, keterangan: 'Terlambat 1 hari' },
  ]);
}

/* ============================= SIDEBAR & TOPBAR ============================= */
const MENU_ITEMS = [
  { href: 'dashboard.html', icon: 'fa-gauge-high', label: 'Dashboard' },
  { href: 'mobil.html', icon: 'fa-car', label: 'Data Mobil' },
  { href: 'customer.html', icon: 'fa-users', label: 'Customer' },
  { href: 'rental.html', icon: 'fa-file-signature', label: 'Rental' },
  { href: 'pengembalian.html', icon: 'fa-rotate-left', label: 'Pengembalian' },
  { href: 'monitoring.html', icon: 'fa-server', label: 'Monitoring Node' },
  { href: 'laporan.html', icon: 'fa-chart-column', label: 'Laporan' },
];

function renderSidebar(activePage) {
  const menuHtml = MENU_ITEMS.map(item => `
    <li>
      <a href="${item.href}" class="${activePage === item.href ? 'active' : ''}">
        <i class="fa-solid ${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    </li>`).join('');

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="logo-mark">
          <img src="img/logo.png" alt="Logo SIMORA" onerror="this.style.display='none'; this.parentElement.textContent='SM';">
        </div>
        <div class="brand-text">
          <h1>SIMORA</h1>
          <span>Rental Terdistribusi</span>
        </div>
      </div>
      <div class="sidebar-menu">
        <div class="menu-label">Menu Utama</div>
        <ul>${menuHtml}</ul>
      </div>
      <div class="sidebar-footer">
        <a href="#" id="logout-link">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Logout</span>
        </a>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>`;
}

function renderTopbar(title, subtitle) {
  const adminName = localStorage.getItem('simora_admin_name') || 'Administrator';
  const initials = adminName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return `
    <header class="topbar">
      <div class="topbar-left">
        <button class="burger-btn" id="burgerBtn"><i class="fa-solid fa-bars"></i></button>
        <div class="topbar-title">
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
      </div>
      <div class="topbar-right">
        <button class="topbar-icon-btn"><i class="fa-solid fa-bell"></i><span class="dot"></span></button>
        <button class="topbar-icon-btn"><i class="fa-solid fa-gear"></i></button>
        <div class="admin-profile">
          <div class="avatar">${initials}</div>
          <div class="info">
            <h4>${adminName}</h4>
            <span>Super Admin</span>
          </div>
        </div>
      </div>
    </header>`;
}

/**
 * Membangun kerangka layout (sidebar + topbar) ke dalam elemen dengan
 * id="app-shell". Dipanggil oleh setiap file JS halaman.
 */
function initLayout(activePage, title, subtitle) {
  checkAuth();
  seedInitialData();
  const shell = document.getElementById('app-shell');
  if (!shell) return;

  shell.innerHTML = `
    ${renderSidebar(activePage)}
    <div class="main-content">
      ${renderTopbar(title, subtitle)}
      <div class="page-content" id="page-content"></div>
    </div>`;

  document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    showConfirmLogout();
  });

  const burgerBtn = document.getElementById('burgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (burgerBtn) {
    burgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

function showConfirmLogout() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:380px; text-align:center;">
      <div class="modal-body">
        <div class="confirm-icon"><i class="fa-solid fa-right-from-bracket"></i></div>
        <h3 style="margin-bottom:8px; color:#fff;">Keluar Aplikasi?</h3>
        <p style="color: var(--text-muted); font-size:13px;">Anda akan keluar dari sesi Admin SIMORA.</p>
      </div>
      <div class="modal-foot" style="justify-content:center;">
        <button class="btn btn-outline" id="logout-cancel">Batal</button>
        <button class="btn btn-danger" id="logout-ok">Ya, Logout</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#logout-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#logout-ok').addEventListener('click', doLogout);
}
