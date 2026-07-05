/* ==========================================================================
   SIMORA - monitoring.js
   Monitoring Sistem Terdistribusi (dummy - siap integrasi backend)
   ========================================================================== */

const NODE_SERVERS = [
  { name: 'Server Pusat', lokasi: 'Jakarta Data Center', ip: '10.10.1.1', uptime: '99.98%', latency: '4 ms', online: true },
  { name: 'Server Bandung', lokasi: 'Cabang Bandung', ip: '10.10.2.1', uptime: '99.95%', latency: '11 ms', online: true },
  { name: 'Server Garut', lokasi: 'Cabang Garut', ip: '10.10.3.1', uptime: '99.91%', latency: '15 ms', online: true },
  { name: 'Server Tasikmalaya', lokasi: 'Cabang Tasikmalaya', ip: '10.10.4.1', uptime: '99.89%', latency: '18 ms', online: true },
];

document.addEventListener('DOMContentLoaded', () => {
  initLayout('monitoring.html', 'Monitoring Node', 'Status real-time seluruh node server cabang SIMORA');

  const pageContent = document.getElementById('page-content');
  const tpl = document.getElementById('tpl-monitoring');
  pageContent.appendChild(tpl.content.cloneNode(true));

  renderNodeGrid();
  renderSyncLog();

  document.getElementById('btnRefreshNode').addEventListener('click', () => {
    showToast('Status seluruh node berhasil diperbarui', 'success');
    renderNodeGrid();
    renderSyncLog();
  });
});

function renderNodeGrid() {
  const grid = document.getElementById('nodeGrid');
  grid.innerHTML = NODE_SERVERS.map(node => `
    <div class="card node-card-monitor ${node.online ? '' : 'node-offline'}">
      <div class="node-card-top">
        <div class="node-server-icon"><i class="fa-solid fa-server"></i></div>
        <div class="node-live-badge ${node.online ? '' : 'offline'}">
          <span class="pulse-dot"></span> ${node.online ? 'Online' : 'Offline'}
        </div>
      </div>
      <h3>${node.name}</h3>
      <p class="node-loc">${node.lokasi}</p>
      <div class="node-metric-row"><span>IP Address</span><span>${node.ip}</span></div>
      <div class="node-metric-row"><span>Uptime</span><span>${node.uptime}</span></div>
      <div class="node-metric-row"><span>Latency</span><span>${node.latency}</span></div>
    </div>`).join('');
}

function renderSyncLog() {
  const logs = [
    { waktu: '10:42:15', cabang: 'Bandung', proses: 'Sinkronisasi data rental', status: 'Berhasil' },
    { waktu: '10:40:02', cabang: 'Garut', proses: 'Sinkronisasi data mobil', status: 'Berhasil' },
    { waktu: '10:38:47', cabang: 'Tasikmalaya', proses: 'Sinkronisasi data customer', status: 'Berhasil' },
    { waktu: '10:35:11', cabang: 'Pusat', proses: 'Backup database harian', status: 'Berhasil' },
    { waktu: '10:20:33', cabang: 'Bandung', proses: 'Sinkronisasi data pengembalian', status: 'Berhasil' },
  ];

  const body = document.getElementById('syncLogBody');
  body.innerHTML = logs.map(l => `
    <tr>
      <td>${l.waktu}</td>
      <td>${l.cabang}</td>
      <td>${l.proses}</td>
      <td><span class="badge badge-success">${l.status}</span></td>
    </tr>`).join('');
}
