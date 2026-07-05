/**
 * =====================================================================
 * SIMORA - Sistem Informasi Rental Mobil Multi Cabang Terdistribusi
 * Entry Point Server (Backend)
 * =====================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const logger = require('./utils/logger');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const systemRoutes = require('./routes/systemRoutes');
const { cekSemuaKoneksi } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------
// Middleware Global
// ---------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Folder upload foto (kondisi mobil, laporan kerusakan, dsb) diakses publik
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Frontend statis (HTML/CSS/JS vanilla, tanpa framework)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// ---------------------------------------------------------------------
// Routes API
// ---------------------------------------------------------------------
app.use('/api/system', systemRoutes);

// Halaman root sementara -> nanti tahap login akan menggantikan ini
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: Poppins, Arial, sans-serif; background:#0b1120; color:#e2e8f0; height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column;">
      <h1 style="color:#22c55e;">🚗 SIMORA</h1>
      <p>Sistem Informasi Rental Mobil Multi Cabang Terdistribusi</p>
      <p style="color:#94a3b8;">Backend berjalan dengan baik. Tahap 1: Fondasi Proyek ✅</p>
      <p><a href="/api/system/health" style="color:#3b82f6;">Cek Status Kesehatan Node &raquo;</a></p>
    </div>
  `);
});

// ---------------------------------------------------------------------
// Error Handling (harus di paling bawah)
// ---------------------------------------------------------------------
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ---------------------------------------------------------------------
// Jalankan Server
// ---------------------------------------------------------------------
app.listen(PORT, async () => {
  logger.success(`Server SIMORA berjalan di http://localhost:${PORT}`);
  logger.info('Mengecek koneksi ke seluruh node database (Pusat & Cabang)...');

  try {
    const hasil = await cekSemuaKoneksi();
    hasil.forEach((node) => {
      if (node.status === 'ONLINE') {
        logger.node(`✅ ${node.node} -> ONLINE`);
      } else {
        logger.warn(`❌ ${node.node} -> OFFLINE (${node.error})`);
      }
    });
  } catch (err) {
    logger.error(`Gagal mengecek koneksi database: ${err.message}`);
  }

  logger.info('Jika ada node OFFLINE, pastikan PostgreSQL sudah berjalan dan database sudah dibuat (lihat README.md).');
});

module.exports = app;
