/* ==========================================================================
   SIMORA - mobil.js
   CRUD Data Mobil menggunakan Local Storage (siap diganti ke REST API)
   ========================================================================== */

let mobilData = [];
let currentFotoBase64 = '';

document.addEventListener('DOMContentLoaded', () => {
  initLayout('mobil.html', 'Data Mobil', 'Kelola seluruh unit kendaraan di semua cabang');

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
      mobilData = await apiRequest(API_ENDPOINTS.mobil, 'GET');
    } catch (e) {
      showToast('Gagal memuat data mobil dari server', 'danger');
      mobilData = Storage.get('simora_mobil');
    }
  } else {
    mobilData = Storage.get('simora_mobil');
  }
}

function persistMobilData() {
  Storage.set('simora_mobil', mobilData);
}

function bindEvents() {
  document.getElementById('btnTambahMobil').addEventListener('click', () => openModal());
  document.getElementById('closeModalMobil').addEventListener('click', closeModal);
  document.getElementById('cancelModalMobil').addEventListener('click', closeModal);
  document.getElementById('modalMobil').addEventListener('click', (e) => {
    if (e.target.id === 'modalMobil') closeModal();
  });

  document.getElementById('formMobil').addEventListener('submit', handleSubmitMobil);
  document.getElementById('searchMobil').addEventListener('input', renderMobilTable);
  document.getElementById('filterCabang').addEventListener('change', renderMobilTable);
  document.getElementById('filterStatus').addEventListener('change', renderMobilTable);

  document.getElementById('mobilFoto').addEventListener('change', handleFotoUpload);
}

function handleFotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { currentFotoBase64 = ev.target.result; };
  reader.readAsDataURL(file);
}

function renderMobilTable() {
  const keyword = document.getElementById('searchMobil').value.toLowerCase();
  const cabang = document.getElementById('filterCabang').value;
  const status = document.getElementById('filterStatus').value;

  let filtered = mobilData.filter(m => {
    const matchKeyword = m.nama.toLowerCase().includes(keyword) || m.plat.toLowerCase().includes(keyword);
    const matchCabang = cabang ? m.cabang === cabang : true;
    const matchStatus = status ? m.status === status : true;
    return matchKeyword && matchCabang && matchStatus;
  });

  const body = document.getElementById('mobilTableBody');

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fa-solid fa-car-side"></i><br>Tidak ada data mobil ditemukan</td></tr>`;
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
            <button class="btn btn-icon btn-outline" title="Edit" onclick="editMobil('${m.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-icon btn-danger" title="Hapus" onclick="hapusMobil('${m.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function openModal(mobil = null) {
  currentFotoBase64 = mobil ? mobil.foto : '';
  document.getElementById('modalMobilTitle').textContent = mobil ? 'Edit Mobil' : 'Tambah Mobil';
  document.getElementById('mobilId').value = mobil ? mobil.id : '';
  document.getElementById('mobilNama').value = mobil ? mobil.nama : '';
  document.getElementById('mobilPlat').value = mobil ? mobil.plat : '';
  document.getElementById('mobilMerk').value = mobil ? mobil.merk : '';
  document.getElementById('mobilTahun').value = mobil ? mobil.tahun : '';
  document.getElementById('mobilHarga').value = mobil ? mobil.harga : '';
  document.getElementById('mobilCabang').value = mobil ? mobil.cabang : '';
  document.getElementById('mobilStatus').value = mobil ? mobil.status : 'Tersedia';
  document.getElementById('mobilFoto').value = '';
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
    foto: currentFotoBase64 || '',
  };

  try {
    if (USE_API) {
      if (id) {
        await apiRequest(`${API_ENDPOINTS.mobil}/${id}`, 'PUT', payload);
      } else {
        await apiRequest(API_ENDPOINTS.mobil, 'POST', payload);
      }
      await loadMobilData();
    } else {
      if (id) {
        const idx = mobilData.findIndex(m => m.id === id);
        if (idx > -1) mobilData[idx] = { ...mobilData[idx], ...payload };
      } else {
        payload.id = generateId('MBL');
        mobilData.push(payload);
      }
      persistMobilData();
    }

    showToast(id ? 'Data mobil berhasil diperbarui' : 'Mobil baru berhasil ditambahkan', 'success');
    closeModal();
    renderMobilTable();
  } catch (err) {
    showToast('Gagal menyimpan data mobil', 'danger');
  }
}

function editMobil(id) {
  const mobil = mobilData.find(m => m.id === id);
  if (mobil) openModal(mobil);
}

function hapusMobil(id) {
  const mobil = mobilData.find(m => m.id === id);
  if (!mobil) return;

  showConfirm(`Hapus data mobil "${mobil.nama}"? Tindakan ini tidak dapat dibatalkan.`, async () => {
    try {
      if (USE_API) {
        await apiRequest(`${API_ENDPOINTS.mobil}/${id}`, 'DELETE');
        await loadMobilData();
      } else {
        mobilData = mobilData.filter(m => m.id !== id);
        persistMobilData();
      }
      showToast('Data mobil berhasil dihapus', 'success');
      renderMobilTable();
    } catch (err) {
      showToast('Gagal menghapus data mobil', 'danger');
    }
  });
}
