/* ==========================================================================
   SIMORA - dashboard.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLayout('dashboard.html', 'Dashboard', 'Ringkasan sistem rental mobil terdistribusi');

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-dashboard');
  pageContent.appendChild(tpl.content.cloneNode(true));

  renderStats();
  renderNodeList();
  renderRecentRental();
  renderRevenueChart();
});

function renderStats() {
  const mobil = Storage.get('simora_mobil');
  const rental = Storage.get('simora_rental');
  const customer = Storage.get('simora_customer');

  const totalMobil = mobil.length;
  const mobilDisewa = mobil.filter(m => m.status === 'Disewa').length;
  const totalCustomer = customer.length;
  const pendapatan = rental.reduce((sum, r) => {
    const car = mobil.find(m => m.id === r.mobilId);
    if (!car) return sum;
    const hari = hitungSelisihHari(r.tglRental, r.tglKembali);
    return sum + (car.harga * Math.max(hari, 1));
  }, 0);

  document.getElementById('statTotalMobil').textContent = totalMobil;
  document.getElementById('statMobilDisewa').textContent = mobilDisewa;
  document.getElementById('statCustomer').textContent = totalCustomer;
  document.getElementById('statPendapatan').textContent = formatRupiah(pendapatan);
}

function hitungSelisihHari(start, end) {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

function renderNodeList() {
  const nodes = [
    { name: 'Server Pusat', icon: 'fa-server' },
    { name: 'Server Bandung', icon: 'fa-server' },
    { name: 'Server Garut', icon: 'fa-server' },
    { name: 'Server Tasikmalaya', icon: 'fa-server' },
  ];
  const list = document.getElementById('nodeList');
  list.innerHTML = nodes.map(n => `
    <li class="node-item">
      <div class="node-name"><i class="fa-solid ${n.icon}"></i> ${n.name}</div>
      <span class="node-status-dot">Online</span>
    </li>`).join('');
}

function renderRecentRental() {
  const rental = Storage.get('simora_rental').slice(-5).reverse();
  const mobil = Storage.get('simora_mobil');
  const customer = Storage.get('simora_customer');
  const body = document.getElementById('recentRentalBody');

  if (rental.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-inbox"></i><br>Belum ada data rental</td></tr>`;
    return;
  }

  body.innerHTML = rental.map((r, idx) => {
    const car = mobil.find(m => m.id === r.mobilId);
    const cust = customer.find(c => c.id === r.customerId);
    const badgeClass = r.status === 'Berjalan' ? 'badge-warning' : (r.status === 'Selesai' ? 'badge-success' : 'badge-danger');
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${cust ? cust.nama : '-'}</td>
        <td>${car ? car.nama : '-'}</td>
        <td>${r.cabang}</td>
        <td>${formatTanggal(r.tglRental)}</td>
        <td><span class="badge ${badgeClass}">${r.status}</span></td>
      </tr>`;
  }).join('');
}

function renderRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'];
  const dataPendapatan = [42, 55, 48, 63, 70, 66, 78];
  const dataTransaksi = [18, 22, 20, 27, 30, 26, 33];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pendapatan (Juta)',
          data: dataPendapatan,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.15)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#2563EB',
        },
        {
          label: 'Jumlah Transaksi',
          data: dataTransaksi,
          borderColor: '#22C55E',
          backgroundColor: 'rgba(34,197,94,0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#22C55E',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94A3B8', font: { family: 'Poppins', size: 11 } }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748B', font: { family: 'Poppins', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748B', font: { family: 'Poppins', size: 11 } }
        }
      }
    }
  });
}
