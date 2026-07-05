/* ==========================================================================
   SIMORA - laporan.js
   Laporan Rental: filter tanggal & cabang, cetak, export PDF/Excel
   ========================================================================== */

let laporanRental = [];
let laporanMobil = [];
let laporanCustomer = [];
let laporanPengembalian = [];
let filteredLaporan = [];

document.addEventListener('DOMContentLoaded', () => {
  initLayout('laporan.html', 'Laporan', 'Rekap transaksi rental berdasarkan periode dan cabang');

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-laporan');
  pageContent.appendChild(tpl.content.cloneNode(true));

  loadLaporanData();
  applyFilter();
  bindLaporanEvents();
});

async function loadLaporanData() {
  laporanMobil = Storage.get('simora_mobil');
  laporanCustomer = Storage.get('simora_customer');
  laporanPengembalian = Storage.get('simora_pengembalian');

  if (USE_API) {
    try {
      laporanRental = await apiRequest(API_ENDPOINTS.laporan, 'GET');
    } catch (e) {
      showToast('Gagal memuat data laporan dari server', 'danger');
      laporanRental = Storage.get('simora_rental');
    }
  } else {
    laporanRental = Storage.get('simora_rental');
  }
}

function bindLaporanEvents() {
  document.getElementById('btnTerapkanFilter').addEventListener('click', applyFilter);
  document.getElementById('btnCetak').addEventListener('click', () => window.print());
  document.getElementById('btnExportPdf').addEventListener('click', exportPdf);
  document.getElementById('btnExportExcel').addEventListener('click', exportExcel);
}

function applyFilter() {
  const tglMulai = document.getElementById('filterTglMulai').value;
  const tglAkhir = document.getElementById('filterTglAkhir').value;
  const cabang = document.getElementById('filterCabangLaporan').value;

  filteredLaporan = laporanRental.filter(r => {
    const matchCabang = cabang ? r.cabang === cabang : true;
    const matchMulai = tglMulai ? new Date(r.tglRental) >= new Date(tglMulai) : true;
    const matchAkhir = tglAkhir ? new Date(r.tglRental) <= new Date(tglAkhir) : true;
    return matchCabang && matchMulai && matchAkhir;
  });

  const label = document.getElementById('lapPeriodeLabel');
  if (tglMulai || tglAkhir || cabang) {
    label.textContent = `Periode: ${tglMulai ? formatTanggal(tglMulai) : 'Awal'} - ${tglAkhir ? formatTanggal(tglAkhir) : 'Sekarang'}${cabang ? ' | Cabang: ' + cabang : ''}`;
  } else {
    label.textContent = 'Seluruh periode';
  }

  renderLaporanTable();
  renderLaporanStats();
}

function hitungBiayaRental(rental) {
  const mobil = laporanMobil.find(m => m.id === rental.mobilId);
  if (!mobil) return 0;
  const hari = Math.round((new Date(rental.tglKembali) - new Date(rental.tglRental)) / (1000 * 60 * 60 * 24));
  return mobil.harga * Math.max(hari, 1);
}

function renderLaporanTable() {
  const body = document.getElementById('laporanTableBody');

  if (filteredLaporan.length === 0) {
    body.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fa-solid fa-chart-column"></i><br>Tidak ada data pada periode ini</td></tr>`;
    return;
  }

  body.innerHTML = filteredLaporan.map((r, idx) => {
    const mobil = laporanMobil.find(m => m.id === r.mobilId);
    const customer = laporanCustomer.find(c => c.id === r.customerId);
    const badgeClass = r.status === 'Berjalan' ? 'badge-warning' : (r.status === 'Selesai' ? 'badge-success' : 'badge-danger');
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${customer ? customer.nama : '-'}</td>
        <td>${mobil ? mobil.nama : '-'}</td>
        <td>${r.cabang}</td>
        <td>${formatTanggal(r.tglRental)}</td>
        <td>${formatTanggal(r.tglKembali)}</td>
        <td><span class="badge ${badgeClass}">${r.status}</span></td>
        <td>${formatRupiah(hitungBiayaRental(r))}</td>
      </tr>`;
  }).join('');
}

function renderLaporanStats() {
  const totalTransaksi = filteredLaporan.length;
  const totalPendapatan = filteredLaporan.reduce((sum, r) => sum + hitungBiayaRental(r), 0);
  const rentalIds = filteredLaporan.map(r => r.id);
  const totalDenda = laporanPengembalian
    .filter(p => rentalIds.includes(p.rentalId))
    .reduce((sum, p) => sum + (p.denda || 0), 0);
  const totalMobil = new Set(filteredLaporan.map(r => r.mobilId)).size;

  document.getElementById('lapTotalTransaksi').textContent = totalTransaksi;
  document.getElementById('lapTotalPendapatan').textContent = formatRupiah(totalPendapatan);
  document.getElementById('lapTotalDenda').textContent = formatRupiah(totalDenda);
  document.getElementById('lapTotalMobil').textContent = totalMobil;
}

function exportPdf() {
  showToast('Menyiapkan file PDF... gunakan dialog Print untuk menyimpan sebagai PDF', 'success');
  setTimeout(() => window.print(), 400);
}

function exportExcel() {
  if (filteredLaporan.length === 0) {
    showToast('Tidak ada data untuk diexport', 'warning');
    return;
  }

  const header = ['No', 'Customer', 'Mobil', 'Cabang', 'Tgl Rental', 'Tgl Kembali', 'Status', 'Total Biaya'];
  const rows = filteredLaporan.map((r, idx) => {
    const mobil = laporanMobil.find(m => m.id === r.mobilId);
    const customer = laporanCustomer.find(c => c.id === r.customerId);
    return [
      idx + 1,
      customer ? customer.nama : '-',
      mobil ? mobil.nama : '-',
      r.cabang,
      r.tglRental,
      r.tglKembali,
      r.status,
      hitungBiayaRental(r)
    ];
  });

  let csvContent = header.join(';') + '\n';
  rows.forEach(row => {
    csvContent += row.map(val => `"${val}"`).join(';') + '\n';
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Rental_SIMORA_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Laporan berhasil diexport ke Excel (CSV)', 'success');
}
