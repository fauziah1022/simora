/* ==========================================================================
   SIMORA - pengembalian.js (Admin)
   Admin HANYA memantau data pengembalian & denda dari seluruh cabang, dengan
   filter cabang. Proses pengembalian dilakukan langsung oleh petugas di
   cabang masing-masing, sehingga Admin tidak memproses pengembalian di sini.
   ========================================================================== */

let pengembalianData = [];
let rentalListForPengembalian = [];
let mobilListForPengembalian = [];
let customerListForPengembalian = [];

document.addEventListener('DOMContentLoaded', () => {
  initLayout('pengembalian.html', 'Data Pengembalian', 'Pantau proses pengembalian mobil & denda dari seluruh cabang');

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-pengembalian');
  pageContent.appendChild(tpl.content.cloneNode(true));

  loadPengembalianData();
  renderAll();
  bindPengembalianEvents();
});

function loadPengembalianData() {
  rentalListForPengembalian = Storage.get('simora_rental');
  mobilListForPengembalian = Storage.get('simora_mobil');
  customerListForPengembalian = Storage.get('simora_customer');
  pengembalianData = Storage.get('simora_pengembalian');
}

function bindPengembalianEvents() {
  document.getElementById('filterCabangPengembalian').addEventListener('change', renderAll);
}

function getCabangFilter() {
  return document.getElementById('filterCabangPengembalian').value;
}

function isSudahDikembalikan(rentalId) {
  return pengembalianData.some(p => p.rentalId === rentalId);
}

function renderAll() {
  renderStatCards();
  renderPendingTable();
  renderHistoryTable();
}

function renderStatCards() {
  const cabang = getCabangFilter();
  const rentalFiltered = cabang ? rentalListForPengembalian.filter(r => r.cabang === cabang) : rentalListForPengembalian;
  const rentalIdsFiltered = rentalFiltered.map(r => r.id);
  const pengembalianFiltered = pengembalianData.filter(p => rentalIdsFiltered.includes(p.rentalId));

  const pending = rentalFiltered.filter(r => r.status === 'Berjalan' && !isSudahDikembalikan(r.id));
  const totalDenda = pengembalianFiltered.reduce((sum, p) => sum + (p.denda || 0), 0);

  document.getElementById('statMenunggu').textContent = pending.length;
  document.getElementById('statSelesai').textContent = pengembalianFiltered.length;
  document.getElementById('statDenda').textContent = formatRupiah(totalDenda);
}

function renderPendingTable() {
  const cabang = getCabangFilter();
  const rentalFiltered = cabang ? rentalListForPengembalian.filter(r => r.cabang === cabang) : rentalListForPengembalian;
  const pending = rentalFiltered.filter(r => r.status === 'Berjalan' && !isSudahDikembalikan(r.id));
  const body = document.getElementById('pendingTableBody');

  if (pending.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-circle-check"></i><br>Tidak ada rental yang menunggu pengembalian</td></tr>`;
    return;
  }

  body.innerHTML = pending.map((r, idx) => {
    const mobil = mobilListForPengembalian.find(m => m.id === r.mobilId);
    const customer = customerListForPengembalian.find(c => c.id === r.customerId);
    const terlambat = new Date() > new Date(r.tglKembali);
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${customer ? customer.nama : '-'}</td>
        <td>${mobil ? mobil.nama : '-'}</td>
        <td><span class="badge badge-info">${r.cabang}</span></td>
        <td>${formatTanggal(r.tglRental)}</td>
        <td class="${terlambat ? 'text-danger-cell' : ''}">${formatTanggal(r.tglKembali)} ${terlambat ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ''}</td>
      </tr>`;
  }).join('');
}

function renderHistoryTable() {
  const cabang = getCabangFilter();
  const body = document.getElementById('historyTableBody');

  const filtered = pengembalianData.filter(p => {
    const rental = rentalListForPengembalian.find(r => r.id === p.rentalId);
    return cabang ? (rental && rental.cabang === cabang) : true;
  });

  const sorted = [...filtered].reverse();

  if (sorted.length === 0) {
    body.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><br>Belum ada riwayat pengembalian</td></tr>`;
    return;
  }

  body.innerHTML = sorted.map((p, idx) => {
    const rental = rentalListForPengembalian.find(r => r.id === p.rentalId);
    const mobil = rental ? mobilListForPengembalian.find(m => m.id === rental.mobilId) : null;
    const customer = rental ? customerListForPengembalian.find(c => c.id === rental.customerId) : null;
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${customer ? customer.nama : '-'}</td>
        <td>${mobil ? mobil.nama : '-'}</td>
        <td><span class="badge badge-info">${rental ? rental.cabang : '-'}</span></td>
        <td>${formatTanggal(p.tglKembaliAktual)}</td>
        <td class="${p.denda > 0 ? 'text-danger-cell' : 'text-success-cell'}">${formatRupiah(p.denda)}</td>
        <td>${p.keterangan || '-'}</td>
      </tr>`;
  }).join('');
}
