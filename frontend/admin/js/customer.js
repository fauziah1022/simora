/* ==========================================================================
   SIMORA - customer.js (Admin)
   Admin HANYA melihat & memfilter data customer per cabang.
   Data customer diinput & dikelola oleh Petugas di masing-masing cabang,
   sehingga Admin tidak memiliki akses Tambah/Edit/Hapus di sini.
   ========================================================================== */

let customerData = [];

document.addEventListener('DOMContentLoaded', () => {
  initLayout('customer.html', 'Data Customer', 'Lihat data pelanggan dari seluruh cabang (data diinput oleh petugas cabang)');

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
      customerData = await apiRequest(API_ENDPOINTS.customer, 'GET');
    } catch (e) {
      showToast('Gagal memuat data customer dari server', 'danger');
      customerData = Storage.get('simora_customer');
    }
  } else {
    customerData = Storage.get('simora_customer');
  }
}

function bindCustomerEvents() {
  document.getElementById('searchCustomer').addEventListener('input', renderCustomerTable);
  document.getElementById('filterCabangCustomer').addEventListener('change', renderCustomerTable);
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function renderCustomerTable() {
  const keyword = document.getElementById('searchCustomer').value.toLowerCase();
  const cabang = document.getElementById('filterCabangCustomer').value;
  const filtered = customerData.filter(c =>
    (c.nama.toLowerCase().includes(keyword) ||
    c.nik.includes(keyword) ||
    c.hp.includes(keyword)) &&
    (cabang ? c.cabang === cabang : true)
  );

  const body = document.getElementById('customerTableBody');

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-user-slash"></i><br>Tidak ada data customer ditemukan</td></tr>`;
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
      <td><span class="badge badge-info">${c.cabang || '-'}</span></td>
    </tr>`).join('');
}
