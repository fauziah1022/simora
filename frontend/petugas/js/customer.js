/* ==========================================================================
   SIMORA - customer.js (Petugas)
   CRUD Data Customer menggunakan Local Storage (siap diganti ke REST API)
   Petugas hanya melihat & mengelola customer di cabangnya sendiri.
   ========================================================================== */

let allCustomerData = [];  // seluruh data (semua cabang) - sumber kebenaran untuk disimpan
let customerData = [];     // data yang sudah difilter sesuai cabang petugas - untuk ditampilkan

document.addEventListener('DOMContentLoaded', () => {
  const cabang = getPetugasCabang();
  initLayout('customer.html', 'Data Customer', `Kelola data pelanggan cabang ${cabang}`);

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-customer');
  pageContent.appendChild(tpl.content.cloneNode(true));

  loadCustomerData();
  renderCustomerTable();
  bindCustomerEvents();
});

async function loadCustomerData() {
  if (USE_API) {
    try {
      // Idealnya backend sudah memfilter by cabang berdasarkan token petugas,
      // tapi kita filter juga di sisi frontend untuk jaga-jaga.
      allCustomerData = await apiRequest(`${API_ENDPOINTS.customer}?cabang=${encodeURIComponent(getPetugasCabang())}`, 'GET');
    } catch (e) {
      showToast('Gagal memuat data customer dari server', 'danger');
      allCustomerData = Storage.get('simora_customer');
    }
  } else {
    allCustomerData = Storage.get('simora_customer');
  }
  customerData = allCustomerData.filter(c => c.cabang === getPetugasCabang());
}

function persistCustomerData() {
  Storage.set('simora_customer', allCustomerData);
  customerData = allCustomerData.filter(c => c.cabang === getPetugasCabang());
}

function bindCustomerEvents() {
  document.getElementById('btnTambahCustomer').addEventListener('click', () => openCustomerModal());
  document.getElementById('closeModalCustomer').addEventListener('click', closeCustomerModal);
  document.getElementById('cancelModalCustomer').addEventListener('click', closeCustomerModal);
  document.getElementById('modalCustomer').addEventListener('click', (e) => {
    if (e.target.id === 'modalCustomer') closeCustomerModal();
  });
  document.getElementById('formCustomer').addEventListener('submit', handleSubmitCustomer);
  document.getElementById('searchCustomer').addEventListener('input', renderCustomerTable);
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function renderCustomerTable() {
  const keyword = document.getElementById('searchCustomer').value.toLowerCase();
  const filtered = customerData.filter(c =>
    c.nama.toLowerCase().includes(keyword) ||
    c.nik.includes(keyword) ||
    c.hp.includes(keyword)
  );

  const body = document.getElementById('customerTableBody');

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fa-solid fa-user-slash"></i><br>Tidak ada data customer di cabang ${getPetugasCabang()}</td></tr>`;
    return;
  }

  body.innerHTML = filtered.map((c, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <div class="customer-name-cell">
          <div class="customer-avatar">${getInitials(c.nama)}</div>
          <span>${c.nama}</span>
        </div>
      </td>
      <td>${c.nik}</td>
      <td>${c.hp}</td>
      <td class="address-cell" title="${c.alamat}">${c.alamat}</td>
      <td>${c.email}</td>
      <td>${c.cabang}</td>
      <td>
        <div class="action-group">
          <button class="btn btn-icon btn-outline" title="Edit" onclick="editCustomer('${c.id}')"><i class="fa-solid fa-pen"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

function openCustomerModal(customer = null) {
  document.getElementById('modalCustomerTitle').textContent = customer ? 'Edit Customer' : 'Tambah Customer';
  document.getElementById('customerId').value = customer ? customer.id : '';
  document.getElementById('customerNama').value = customer ? customer.nama : '';
  document.getElementById('customerNik').value = customer ? customer.nik : '';
  document.getElementById('customerHp').value = customer ? customer.hp : '';
  document.getElementById('customerAlamat').value = customer ? customer.alamat : '';
  document.getElementById('customerEmail').value = customer ? customer.email : '';
  // Cabang selalu terkunci ke cabang petugas yang sedang login
  document.getElementById('customerCabang').value = getPetugasCabang();
  document.getElementById('modalCustomer').classList.add('active');
}

function closeCustomerModal() {
  document.getElementById('modalCustomer').classList.remove('active');
  document.getElementById('formCustomer').reset();
}

async function handleSubmitCustomer(e) {
  e.preventDefault();

  const id = document.getElementById('customerId').value;
  const payload = {
    nama: document.getElementById('customerNama').value.trim(),
    nik: document.getElementById('customerNik').value.trim(),
    hp: document.getElementById('customerHp').value.trim(),
    alamat: document.getElementById('customerAlamat').value.trim(),
    email: document.getElementById('customerEmail').value.trim(),
    cabang: getPetugasCabang(), // dikunci, tidak bisa diubah petugas
  };

  try {
    if (USE_API) {
      if (id) {
        await apiRequest(`${API_ENDPOINTS.customer}/${id}`, 'PUT', payload);
      } else {
        await apiRequest(API_ENDPOINTS.customer, 'POST', payload);
      }
      await loadCustomerData();
    } else {
      if (id) {
        const idx = allCustomerData.findIndex(c => c.id === id);
        if (idx > -1) allCustomerData[idx] = { ...allCustomerData[idx], ...payload };
      } else {
        payload.id = generateId('CUST');
        allCustomerData.push(payload);
      }
      persistCustomerData();
    }

    showToast(id ? 'Data customer berhasil diperbarui' : 'Customer baru berhasil ditambahkan', 'success');
    closeCustomerModal();
    renderCustomerTable();
  } catch (err) {
    showToast('Gagal menyimpan data customer', 'danger');
  }
}

function editCustomer(id) {
  const customer = customerData.find(c => c.id === id);
  if (customer) openCustomerModal(customer);
}
