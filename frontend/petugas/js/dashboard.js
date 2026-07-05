/* ==========================================================================
   SIMORA - dashboard.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const cabang = getPetugasCabang();
  initLayout('dashboard.html', 'Dashboard', `Ringkasan tugas rental harian cabang ${cabang}`);

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-dashboard');
  pageContent.appendChild(tpl.content.cloneNode(true));

  renderStats();
  renderPendingReturnList();
  renderRecentRental();
  renderTransaksiChart();
});

function renderStats() {
  const cabang = getPetugasCabang();
  const mobil = Storage.get('simora_mobil').filter(m => m.cabang === cabang);
  const rental = Storage.get('simora_rental').filter(r => r.cabang === cabang);
  const customer = Storage.get('simora_customer').filter(c => c.cabang === cabang);

  const totalMobil = mobil.length;
  const mobilDisewa = mobil.filter(m => m.status === 'Disewa').length;
  const totalCustomer = customer.length;
  const rentalAktif = rental.filter(r => r.status === 'Berjalan').length;

  document.getElementById('statTotalMobil').textContent = totalMobil;
  document.getElementById('statMobilDisewa').textContent = mobilDisewa;
  document.getElementById('statCustomer').textContent = totalCustomer;
  document.getElementById('statRentalAktif').textContent = rentalAktif;
}

function hitungSelisihHari(start, end) {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

function renderPendingReturnList() {
  const cabang = getPetugasCabang();
  const rental = Storage.get('simora_rental').filter(r => r.cabang === cabang);
  const mobil = Storage.get('simora_mobil').filter(m => m.cabang === cabang);
  const pengembalian = Storage.get('simora_pengembalian');
  const sudahKembaliIds = pengembalian.map(p => p.rentalId);

  const pending = rental
    .filter(r => r.status === 'Berjalan' && !sudahKembaliIds.includes(r.id))
    .slice(0, 5);

  const list = document.getElementById('nodeList');

  if (pending.length === 0) {
    list.innerHTML = `<li class="node-item"><div class="node-name"><i class="fa-solid fa-circle-check"></i> Tidak ada rental menunggu kembali</div></li>`;
    return;
  }

  list.innerHTML = pending.map(r => {
    const car = mobil.find(m => m.id === r.mobilId);
    const terlambat = new Date() > new Date(r.tglKembali);
    return `
      <li class="node-item">
        <div class="node-name"><i class="fa-solid fa-car"></i> ${car ? car.nama : '-'}</div>
        <span class="node-status-dot" style="${terlambat ? 'color: var(--danger);' : ''}">${terlambat ? 'Terlambat' : formatTanggal(r.tglKembali)}</span>
      </li>`;
  }).join('');
}

function renderRecentRental() {
  const cabang = getPetugasCabang();
  const rental = Storage.get('simora_rental').filter(r => r.cabang === cabang).slice(-5).reverse();
  const mobil = Storage.get('simora_mobil');
  const customer = Storage.get('simora_customer');
  const body = document.getElementById('recentRentalBody');

  if (rental.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fa-solid fa-inbox"></i><br>Belum ada data rental di cabang ${cabang}</td></tr>`;
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
        <td>${formatTanggal(r.tglRental)}</td>
        <td><span class="badge ${badgeClass}">${r.status}</span></td>
      </tr>`;
  }).join('');
}

function renderTransaksiChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'];
  const dataTransaksi = [18, 22, 20, 27, 30, 26, 33];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
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
