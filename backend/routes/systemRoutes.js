const express = require('express');
const router = express.Router();
const { cekSemuaKoneksi, daftarCabang } = require('../config/database');

/**
 * GET /api/system/health
 * Mengecek status "hidup/mati" seluruh node database
 * (1 Pusat + N Cabang) — merepresentasikan monitoring
 * jaringan server terdistribusi.
 */
router.get('/health', async (req, res) => {
  const hasilCekKoneksi = await cekSemuaKoneksi();

  const semuaOnline = hasilCekKoneksi.every((node) => node.status === 'ONLINE');

  res.status(200).json({
    sukses: true,
    pesan: 'Status kesehatan node SIMORA',
    waktuServer: new Date().toISOString(),
    ringkasan: {
      totalNode: hasilCekKoneksi.length,
      semuaOnline,
    },
    nodes: hasilCekKoneksi,
    cabangTerdaftar: daftarCabang,
  });
});

module.exports = router;
