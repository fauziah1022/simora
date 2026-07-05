/* ==========================================================================
   SIMORA - mobil.js (Petugas)
   Petugas hanya melihat & mengubah status mobil di cabangnya sendiri.
   ========================================================================== */

let allMobilData = [];  // seluruh data (semua cabang) - sumber kebenaran untuk disimpan
let mobilData = [];     // data terfilter sesuai cabang petugas - untuk ditampilkan

document.addEventListener('DOMContentLoaded', () => {
  const cabang = getPetugasCabang();
  initLayout('mobil.html', 'Data Mobil', `Cek ketersediaan dan perbarui status unit kendaraan cabang ${cabang}`);

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-mobil');
  pageContent.appendChild(tpl.content.cloneNode(true));

  loadMobilData();
  renderMobilTable();
  bindEvents();
});

async function loadMobilData() {
  if (USE_API) {
    try {
      allMobilData = await apiRequest(`${API_ENDPOINTS.mobil}?cabang=${encodeURIComponent(getPetugasCabang())}`, 'GET');
    } catch (e) {
      showToast('Gagal memuat data mobil dari server', 'danger');
      allMobilData = Storage.get('simora_mobil');
    }
  } else {
    allMobilData = Storage.get('simora_mobil');
  }
  mobilData = allMobilData.filter(m => m.cabang === getPetugasCabang());
}

function persistMobilData() {
  Storage.set('simora_mobil', allMobilData);
  mobilData = allMobilData.filter(m => m.cabang === getPetugasCabang());
}

function bindEvents() {
  document.getElementById('closeModalMobil').addEventListener('click', closeModal);
  document.getElementById('cancelModalMobil').addEventListener('click', closeModal);
  document.getElementById('modalMobil').addEventListener('click', (e) => {
    if (e.target.id === 'modalMobil') closeModal();
  });

  document.getElementById('formMobil').addEventListener('submit', handleSubmitMobil);
  document.getElementById('searchMobil').addEventListener('input', renderMobilTable);
  document.getElementById('filterStatus').addEventListener('change', renderMobilTable);
}

function renderMobilTable() {
  const keyword = document.getElementById('searchMobil').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;

  let filtered = mobilData.filter(m => {
    const matchKeyword = m.nama.toLowerCase().includes(keyword) || m.plat.toLowerCase().includes(keyword);
    const matchStatus = status ? m.status === status : true;
    return matchKeyword && matchStatus;
  });

  const body = document.getElementById('mobilTableBody');

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fa-solid fa-car-side"></i><br>Tidak ada data mobil di cabang ${getPetugasCabang()}</td></tr>`;
    return;
  }

  body.innerHTML = filtered.map((m, idx) => {
    const badgeClass = m.status === 'Tersedia' ? 'badge-success' : 'badge-danger';
    const fotoSrc = m.foto && m.foto.length > 0 ? m.foto : '';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${fotoSrc
          ? `<img src="${fotoSrc}" class="table-thumb" alt="${m.nama}" onerror="this.style.opacity=0.2;">`
          : `<div class="table-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-car" style="color:#475569;"></i></div>`}
        </td>
        <td>
          <div class="car-name-cell">
            <strong>${m.nama}</strong>
            <span>Tahun ${m.tahun}</span>
          </div>
        </td>
        <td>${m.plat}</td>
        <td>${m.merk}</td>
        <td class="price-cell">${formatRupiah(m.harga)}/hari</td>
        <td>${m.cabang}</td>
        <td><span class="badge ${badgeClass}">${m.status}</span></td>
        <td>
          <div class="action-group">
            <button class="btn btn-icon btn-outline" title="Update Status" onclick="editMobil('${m.id}')"><i class="fa-solid fa-pen"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function openModal(mobil) {
  document.getElementById('modalMobilTitle').textContent = 'Update Status Mobil';
  document.getElementById('mobilId').value = mobil.id;
  document.getElementById('mobilNama').value = mobil.nama;
  document.getElementById('mobilPlat').value = mobil.plat;
  document.getElementById('mobilMerk').value = mobil.merk;
  document.getElementById('mobilTahun').value = mobil.tahun;
  document.getElementById('mobilHarga').value = mobil.harga;
  document.getElementById('mobilCabang').value = mobil.cabang;
  document.getElementById('mobilStatus').value = mobil.status;

  // Petugas hanya diizinkan mengubah status ketersediaan, field lain read-only
  ['mobilNama', 'mobilPlat', 'mobilMerk', 'mobilTahun', 'mobilHarga', 'mobilCabang'].forEach(id => {
    document.getElementById(id).setAttribute('disabled', 'disabled');
  });

  document.getElementById('modalMobil').classList.add('active');
}

function closeModal() {
  document.getElementById('modalMobil').classList.remove('active');
  document.getElementById('formMobil').reset();
}

async function handleSubmitMobil(e) {
  e.preventDefault();

  const id = document.getElementById('mobilId').value;
  const payload = {
    nama: document.getElementById('mobilNama').value.trim(),
    plat: document.getElementById('mobilPlat').value.trim().toUpperCase(),
    merk: document.getElementById('mobilMerk').value.trim(),
    tahun: parseInt(document.getElementById('mobilTahun').value, 10),
    harga: parseInt(document.getElementById('mobilHarga').value, 10),
    cabang: document.getElementById('mobilCabang').value,
    status: document.getElementById('mobilStatus').value,
  };

  try {
    if (USE_API) {
      await apiRequest(`${API_ENDPOINTS.mobil}/${id}`, 'PUT', payload);
      await loadMobilData();
    } else {
      const idx = allMobilData.findIndex(m => m.id === id);
      if (idx > -1) allMobilData[idx] = { ...allMobilData[idx], ...payload };
      persistMobilData();
    }

    showToast('Status mobil berhasil diperbarui', 'success');
    closeModal();
    renderMobilTable();
  } catch (err) {
    showToast('Gagal memperbarui status mobil', 'danger');
  }
}

function editMobil(id) {
  const mobil = mobilData.find(m => m.id === id);
  if (mobil) openModal(mobil);
}
