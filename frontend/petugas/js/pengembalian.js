/* ==========================================================================
   SIMORA - pengembalian.js (Petugas)
   Data Pengembalian + Perhitungan Denda Otomatis
   Petugas hanya melihat & memproses pengembalian rental di cabangnya sendiri.
   ========================================================================== */

const DENDA_PER_HARI = 100000; // Rp 100.000 per hari keterlambatan

let allPengembalianData = [];        // seluruh riwayat pengembalian (semua cabang) - sumber kebenaran
let pengembalianData = [];           // riwayat terfilter sesuai cabang petugas - untuk ditampilkan

let allRentalListForPengembalian = [];   // seluruh rental (semua cabang) - sumber kebenaran untuk disimpan
let rentalListForPengembalian = [];      // rental terfilter sesuai cabang petugas - untuk ditampilkan

let allMobilListForPengembalian = [];    // seluruh mobil (semua cabang) - sumber kebenaran untuk disimpan
let mobilListForPengembalian = [];       // mobil terfilter sesuai cabang petugas - untuk ditampilkan

let customerListForPengembalian = [];    // customer terfilter sesuai cabang petugas - untuk ditampilkan

document.addEventListener('DOMContentLoaded', () => {
  const cabang = getPetugasCabang();
  initLayout('pengembalian.html', 'Data Pengembalian', `Proses pengembalian mobil cabang ${cabang}`);

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-pengembalian');
  pageContent.appendChild(tpl.content.cloneNode(true));

  loadPengembalianData();
  renderAll();
  bindPengembalianEvents();
});

function loadPengembalianData() {
  const cabang = getPetugasCabang();

  allRentalListForPengembalian = Storage.get('simora_rental');
  rentalListForPengembalian = allRentalListForPengembalian.filter(r => r.cabang === cabang);

  allMobilListForPengembalian = Storage.get('simora_mobil');
  mobilListForPengembalian = allMobilListForPengembalian.filter(m => m.cabang === cabang);

  customerListForPengembalian = Storage.get('simora_customer').filter(c => c.cabang === cabang);

  allPengembalianData = Storage.get('simora_pengembalian');
  const rentalIdsCabangIni = rentalListForPengembalian.map(r => r.id);
  pengembalianData = allPengembalianData.filter(p => rentalIdsCabangIni.includes(p.rentalId));
}

function persistPengembalianData() {
  Storage.set('simora_pengembalian', allPengembalianData);
  const rentalIdsCabangIni = rentalListForPengembalian.map(r => r.id);
  pengembalianData = allPengembalianData.filter(p => rentalIdsCabangIni.includes(p.rentalId));
}

function bindPengembalianEvents() {
  document.getElementById('closeModalPengembalian').addEventListener('click', closeReturnModal);
  document.getElementById('cancelModalPengembalian').addEventListener('click', closeReturnModal);
  document.getElementById('modalPengembalian').addEventListener('click', (e) => {
    if (e.target.id === 'modalPengembalian') closeReturnModal();
  });
  document.getElementById('formPengembalian').addEventListener('submit', handleSubmitPengembalian);
  document.getElementById('tglKembaliAktual').addEventListener('change', updateDendaPreview);
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
  const pending = rentalListForPengembalian.filter(r => r.status === 'Berjalan' && !isSudahDikembalikan(r.id));
  const totalDenda = pengembalianData.reduce((sum, p) => sum + (p.denda || 0), 0);

  document.getElementById('statMenunggu').textContent = pending.length;
  document.getElementById('statSelesai').textContent = pengembalianData.length;
  document.getElementById('statDenda').textContent = formatRupiah(totalDenda);
}

function renderPendingTable() {
  const pending = rentalListForPengembalian.filter(r => r.status === 'Berjalan' && !isSudahDikembalikan(r.id));
  const body = document.getElementById('pendingTableBody');

  if (pending.length === 0) {
    body.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-circle-check"></i><br>Tidak ada rental yang menunggu pengembalian di cabang ${getPetugasCabang()}</td></tr>`;
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
        <td>${r.cabang}</td>
        <td>${formatTanggal(r.tglRental)}</td>
        <td class="${terlambat ? 'text-danger-cell' : ''}">${formatTanggal(r.tglKembali)} ${terlambat ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ''}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="openReturnModal('${r.id}')"><i class="fa-solid fa-rotate-left"></i> Proses Kembali</button>
        </td>
      </tr>`;
  }).join('');
}

function renderHistoryTable() {
  const body = document.getElementById('historyTableBody');
  const sorted = [...pengembalianData].reverse();

  if (sorted.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><br>Belum ada riwayat pengembalian di cabang ${getPetugasCabang()}</td></tr>`;
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
        <td>${formatTanggal(p.tglKembaliAktual)}</td>
        <td class="${p.denda > 0 ? 'text-danger-cell' : 'text-success-cell'}">${formatRupiah(p.denda)}</td>
        <td>${p.keterangan || '-'}</td>
      </tr>`;
  }).join('');
}

function openReturnModal(rentalId) {
  const rental = rentalListForPengembalian.find(r => r.id === rentalId);
  if (!rental) return;
  const mobil = mobilListForPengembalian.find(m => m.id === rental.mobilId);
  const customer = customerListForPengembalian.find(c => c.id === rental.customerId);

  document.getElementById('pengembalianRentalId').value = rentalId;
  document.getElementById('returnInfo').innerHTML = `
    <div class="ri-row"><span>Customer</span><strong>${customer ? customer.nama : '-'}</strong></div>
    <div class="ri-row"><span>Mobil</span><strong>${mobil ? mobil.nama : '-'}</strong></div>
    <div class="ri-row"><span>Batas Waktu Kembali</span><strong>${formatTanggal(rental.tglKembali)}</strong></div>
  `;
  document.getElementById('tglKembaliAktual').value = new Date().toISOString().slice(0, 10);
  document.getElementById('keteranganKembali').value = '';
  document.getElementById('modalPengembalian').classList.add('active');
  updateDendaPreview();
}

function closeReturnModal() {
  document.getElementById('modalPengembalian').classList.remove('active');
  document.getElementById('formPengembalian').reset();
}

function hitungDenda(rentalId, tglKembaliAktual) {
  const rental = rentalListForPengembalian.find(r => r.id === rentalId);
  if (!rental) return 0;
  const batas = new Date(rental.tglKembali);
  const aktual = new Date(tglKembaliAktual);
  const selisih = Math.round((aktual - batas) / (1000 * 60 * 60 * 24));
  return selisih > 0 ? selisih * DENDA_PER_HARI : 0;
}

function updateDendaPreview() {
  const rentalId = document.getElementById('pengembalianRentalId').value;
  const tgl = document.getElementById('tglKembaliAktual').value;
  const denda = hitungDenda(rentalId, tgl);
  document.getElementById('dendaAmount').textContent = formatRupiah(denda);
}

function handleSubmitPengembalian(e) {
  e.preventDefault();

  const rentalId = document.getElementById('pengembalianRentalId').value;
  const tglKembaliAktual = document.getElementById('tglKembaliAktual').value;
  const keterangan = document.getElementById('keteranganKembali').value.trim();
  const denda = hitungDenda(rentalId, tglKembaliAktual);

  const payload = {
    id: generateId('PGB'),
    rentalId,
    tglKembaliAktual,
    denda,
    keterangan: keterangan || (denda > 0 ? `Terlambat, denda ${formatRupiah(denda)}` : 'Tepat waktu'),
  };

  allPengembalianData.push(payload);
  persistPengembalianData();

  // Update status rental menjadi Selesai & mobil menjadi Tersedia (pada data global)
  const rentalIdx = allRentalListForPengembalian.findIndex(r => r.id === rentalId);
  if (rentalIdx > -1) {
    allRentalListForPengembalian[rentalIdx].status = 'Selesai';
    Storage.set('simora_rental', allRentalListForPengembalian);
    rentalListForPengembalian = allRentalListForPengembalian.filter(r => r.cabang === getPetugasCabang());

    const mobilIdx = allMobilListForPengembalian.findIndex(m => m.id === allRentalListForPengembalian[rentalIdx].mobilId);
    if (mobilIdx > -1) {
      allMobilListForPengembalian[mobilIdx].status = 'Tersedia';
      Storage.set('simora_mobil', allMobilListForPengembalian);
      mobilListForPengembalian = allMobilListForPengembalian.filter(m => m.cabang === getPetugasCabang());
    }
  }

  showToast('Pengembalian berhasil diproses' + (denda > 0 ? ` - Denda ${formatRupiah(denda)}` : ''), denda > 0 ? 'warning' : 'success');
  closeReturnModal();
  renderAll();
}
