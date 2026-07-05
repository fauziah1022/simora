/* ==========================================================================
   SIMORA - rental.js (Petugas)
   Petugas hanya melihat & mengelola rental di cabangnya sendiri.
   Cabang selalu terkunci ke cabang petugas yang login.
   ========================================================================== */

let allRentalData = [];        // seluruh rental (semua cabang) - sumber kebenaran untuk disimpan
let rentalData = [];           // rental terfilter sesuai cabang petugas - untuk ditampilkan

let allMobilListForRental = [];      // seluruh mobil (semua cabang)
let mobilListForRental = [];         // mobil terfilter sesuai cabang petugas - untuk pilihan select

let customerListForRental = [];      // customer terfilter sesuai cabang petugas - untuk pilihan select

document.addEventListener('DOMContentLoaded', () => {
  const cabang = getPetugasCabang();
  initLayout('rental.html', 'Data Rental', `Kelola transaksi penyewaan mobil cabang ${cabang}`);

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-rental');
  pageContent.appendChild(tpl.content.cloneNode(true));

  loadRentalData();
  renderRentalTable();
  bindRentalEvents();
});

async function loadRentalData() {
  const cabang = getPetugasCabang();

  allMobilListForRental = Storage.get('simora_mobil');
  mobilListForRental = allMobilListForRental.filter(m => m.cabang === cabang);
  customerListForRental = Storage.get('simora_customer').filter(c => c.cabang === cabang);

  if (USE_API) {
    try {
      allRentalData = await apiRequest(`${API_ENDPOINTS.rental}?cabang=${encodeURIComponent(cabang)}`, 'GET');
    } catch (e) {
      showToast('Gagal memuat data rental dari server', 'danger');
      allRentalData = Storage.get('simora_rental');
    }
  } else {
    allRentalData = Storage.get('simora_rental');
  }
  rentalData = allRentalData.filter(r => r.cabang === cabang);
}

function persistRentalData() {
  Storage.set('simora_rental', allRentalData);
  rentalData = allRentalData.filter(r => r.cabang === getPetugasCabang());
}

function persistMobilStatus() {
  Storage.set('simora_mobil', allMobilListForRental);
  mobilListForRental = allMobilListForRental.filter(m => m.cabang === getPetugasCabang());
}

function bindRentalEvents() {
  document.getElementById('btnTambahRental').addEventListener('click', () => openRentalModal());
  document.getElementById('closeModalRental').addEventListener('click', closeRentalModal);
  document.getElementById('cancelModalRental').addEventListener('click', closeRentalModal);
  document.getElementById('modalRental').addEventListener('click', (e) => {
    if (e.target.id === 'modalRental') closeRentalModal();
  });
  document.getElementById('formRental').addEventListener('submit', handleSubmitRental);
  document.getElementById('searchRental').addEventListener('input', renderRentalTable);
  document.getElementById('filterStatusRental').addEventListener('change', renderRentalTable);

  ['rentalMobil', 'rentalTglMulai', 'rentalTglKembali'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateRentalSummary);
    document.getElementById(id).addEventListener('input', updateRentalSummary);
  });
}

function hitungHari(start, end) {
  if (!start || !end) return 0;
  const diff = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function updateRentalSummary() {
  const mobilId = document.getElementById('rentalMobil').value;
  const mulai = document.getElementById('rentalTglMulai').value;
  const kembali = document.getElementById('rentalTglKembali').value;
  const summary = document.getElementById('rentalSummary');

  const mobil = mobilListForRental.find(m => m.id === mobilId);
  const hari = hitungHari(mulai, kembali);

  if (!mobil || hari <= 0) {
    summary.innerHTML = `<span>Pilih mobil dan tanggal untuk melihat estimasi biaya</span>`;
    return;
  }

  const total = mobil.harga * hari;
  summary.innerHTML = `<span>${hari} hari x ${formatRupiah(mobil.harga)}</span><strong>${formatRupiah(total)}</strong>`;
}

function populateSelects(selectedMobilId, selectedCustomerId) {
  const mobilSelect = document.getElementById('rentalMobil');
  const customerSelect = document.getElementById('rentalCustomer');

  if (mobilListForRental.length === 0) {
    mobilSelect.innerHTML = `<option value="">Tidak ada mobil tersedia di cabang ini</option>`;
  } else {
    mobilSelect.innerHTML = mobilListForRental.map(m =>
      `<option value="${m.id}" ${m.id === selectedMobilId ? 'selected' : ''}>${m.nama} - ${m.plat}</option>`
    ).join('');
  }

  if (customerListForRental.length === 0) {
    customerSelect.innerHTML = `<option value="">Belum ada customer di cabang ini</option>`;
  } else {
    customerSelect.innerHTML = customerListForRental.map(c =>
      `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.nama}</option>`
    ).join('');
  }
}

function renderRentalTable() {
  const keyword = document.getElementById('searchRental').value.toLowerCase();
  const status = document.getElementById('filterStatusRental').value;

  const filtered = rentalData.filter(r => {
    const mobil = mobilListForRental.find(m => m.id === r.mobilId);
    const customer = customerListForRental.find(c => c.id === r.customerId);
    const matchKeyword =
      (mobil && mobil.nama.toLowerCase().includes(keyword)) ||
      (customer && customer.nama.toLowerCase().includes(keyword));
    const matchStatus = status ? r.status === status : true;
    return matchKeyword && matchStatus;
  });

  const body = document.getElementById('rentalTableBody');

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fa-solid fa-file-signature"></i><br>Belum ada data rental di cabang ${getPetugasCabang()}</td></tr>`;
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
        <td>${r.cabang}</td>
        <td>${formatTanggal(r.tglRental)}</td>
        <td>${formatTanggal(r.tglKembali)}</td>
        <td><span class="badge ${badgeClass}">${r.status}</span></td>
        <td>
          <div class="action-group">
            <button class="btn btn-icon btn-outline" title="Edit" onclick="editRental('${r.id}')"><i class="fa-solid fa-pen"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function openRentalModal(rental = null) {
  document.getElementById('modalRentalTitle').textContent = rental ? 'Edit Rental' : 'Buat Rental';
  document.getElementById('rentalId').value = rental ? rental.id : '';
  populateSelects(rental ? rental.mobilId : null, rental ? rental.customerId : null);
  document.getElementById('rentalTglMulai').value = rental ? rental.tglRental : '';
  document.getElementById('rentalTglKembali').value = rental ? rental.tglKembali : '';
  document.getElementById('rentalCabang').value = getPetugasCabang(); // selalu terkunci
  document.getElementById('rentalStatus').value = rental ? rental.status : 'Berjalan';
  document.getElementById('modalRental').classList.add('active');
  updateRentalSummary();
}

function closeRentalModal() {
  document.getElementById('modalRental').classList.remove('active');
  document.getElementById('formRental').reset();
}

async function handleSubmitRental(e) {
  e.preventDefault();

  const id = document.getElementById('rentalId').value;
  const tglMulai = document.getElementById('rentalTglMulai').value;
  const tglKembali = document.getElementById('rentalTglKembali').value;
  const mobilId = document.getElementById('rentalMobil').value;
  const customerId = document.getElementById('rentalCustomer').value;

  if (!mobilId || !customerId) {
    showToast('Mobil dan customer di cabang ini belum tersedia', 'warning');
    return;
  }

  if (new Date(tglKembali) <= new Date(tglMulai)) {
    showToast('Tanggal kembali harus setelah tanggal rental', 'warning');
    return;
  }

  const payload = {
    customerId,
    mobilId,
    tglRental: tglMulai,
    tglKembali: tglKembali,
    cabang: getPetugasCabang(), // dikunci, tidak bisa diubah petugas
    status: document.getElementById('rentalStatus').value,
  };

  try {
    if (USE_API) {
      if (id) {
        await apiRequest(`${API_ENDPOINTS.rental}/${id}`, 'PUT', payload);
      } else {
        await apiRequest(API_ENDPOINTS.rental, 'POST', payload);
      }
      await loadRentalData();
    } else {
      if (id) {
        const idx = allRentalData.findIndex(r => r.id === id);
        if (idx > -1) allRentalData[idx] = { ...allRentalData[idx], ...payload };
      } else {
        payload.id = generateId('RNT');
        allRentalData.push(payload);
      }
      persistRentalData();
      updateMobilStatusFromRental(payload.mobilId, payload.status);
    }

    showToast(id ? 'Data rental berhasil diperbarui' : 'Rental baru berhasil dibuat', 'success');
    closeRentalModal();
    renderRentalTable();
  } catch (err) {
    showToast('Gagal menyimpan data rental', 'danger');
  }
}

function updateMobilStatusFromRental(mobilId, status) {
  const idx = allMobilListForRental.findIndex(m => m.id === mobilId);
  if (idx === -1) return;
  allMobilListForRental[idx].status = status === 'Berjalan' ? 'Disewa' : 'Tersedia';
  persistMobilStatus();
}

function editRental(id) {
  const rental = rentalData.find(r => r.id === id);
  if (rental) openRentalModal(rental);
}
