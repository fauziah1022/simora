/* ==========================================================================
   SIMORA - rental.js (Admin)
   Admin HANYA memantau & memfilter data rental dari seluruh cabang.
   Transaksi rental dibuat & dikelola oleh Petugas di masing-masing cabang,
   sehingga Admin tidak memiliki akses Tambah/Edit/Hapus di sini.
   ========================================================================== */

let rentalData = [];
let mobilListForRental = [];
let customerListForRental = [];

document.addEventListener('DOMContentLoaded', () => {
  initLayout('rental.html', 'Data Rental', 'Pantau transaksi penyewaan mobil dari seluruh cabang');

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-rental');
  pageContent.appendChild(tpl.content.cloneNode(true));

  loadRentalData();
  renderRentalTable();
  bindRentalEvents();
});

async function loadRentalData() {
  mobilListForRental = Storage.get('simora_mobil');
  customerListForRental = Storage.get('simora_customer');

  if (USE_API) {
    try {
      rentalData = await apiRequest(API_ENDPOINTS.rental, 'GET');
    } catch (e) {
      showToast('Gagal memuat data rental dari server', 'danger');
      rentalData = Storage.get('simora_rental');
    }
  } else {
    rentalData = Storage.get('simora_rental');
  }
}

function bindRentalEvents() {
  document.getElementById('searchRental').addEventListener('input', renderRentalTable);
  document.getElementById('filterCabangRental').addEventListener('change', renderRentalTable);
  document.getElementById('filterStatusRental').addEventListener('change', renderRentalTable);
}

function renderRentalTable() {
  const keyword = document.getElementById('searchRental').value.toLowerCase();
  const cabang = document.getElementById('filterCabangRental').value;
  const status = document.getElementById('filterStatusRental').value;

  const filtered = rentalData.filter(r => {
    const mobil = mobilListForRental.find(m => m.id === r.mobilId);
    const customer = customerListForRental.find(c => c.id === r.customerId);
    const matchKeyword =
      (mobil && mobil.nama.toLowerCase().includes(keyword)) ||
      (customer && customer.nama.toLowerCase().includes(keyword));
    const matchCabang = cabang ? r.cabang === cabang : true;
    const matchStatus = status ? r.status === status : true;
    return matchKeyword && matchCabang && matchStatus;
  });

  const body = document.getElementById('rentalTableBody');

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-file-signature"></i><br>Tidak ada data rental ditemukan</td></tr>`;
    return;
  }

  body.innerHTML = filtered.map((r, idx) => {
    const mobil = mobilListForRental.find(m => m.id === r.mobilId);
    const customer = customerListForRental.find(c => c.id === r.customerId);
    const badgeClass = r.status === 'Berjalan' ? 'badge-warning' : (r.status === 'Selesai' ? 'badge-success' : 'badge-danger');
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${customer ? customer.nama : '-'}</td>
        <td>${mobil ? mobil.nama : '-'}</td>
        <td><span class="badge badge-info">${r.cabang}</span></td>
        <td>${formatTanggal(r.tglRental)}</td>
        <td>${formatTanggal(r.tglKembali)}</td>
        <td><span class="badge ${badgeClass}">${r.status}</span></td>
      </tr>`;
  }).join('');
}
