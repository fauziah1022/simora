/**
 * =====================================================================
 * SIMORA - Konfigurasi Multi-Database (Distributed Database Layer)
 * =====================================================================
 * Konsep Sistem Terdistribusi yang diterapkan di sini:
 *
 * 1. FRAGMENTASI HORIZONTAL:
 *    Setiap cabang (Bandung, Tasikmalaya, Garut) memiliki database
 *    sendiri yang terpisah penuh (bukan hanya beda tabel/schema).
 *    Baris data (mobil, customer, transaksi) dari setiap cabang
 *    secara fisik berada pada database yang berbeda.
 *
 * 2. SIMULASI SERVER TERPISAH:
 *    Walaupun saat ini seluruh database berjalan di localhost,
 *    setiap cabang memiliki konfigurasi host/port/credential SENDIRI
 *    (lihat .env). Ini membuat arsitektur siap untuk deployment nyata
 *    di mana tiap cabang benar-benar berada di server berbeda,
 *    tanpa perlu mengubah source code, cukup ubah .env.
 *
 * 3. SERVER PUSAT sebagai node monitoring & agregator, memiliki
 *    database sendiri (simora_pusat) yang menyimpan data master
 *    (cabang, admin, petugas, mobil master) serta REPLIKASI RINGKASAN
 *    data dari tiap cabang (lihat tabel ringkasan_* pada schema pusat).
 * =====================================================================
 */

const { Pool } = require('pg');
require('dotenv').config();

// -------------------------------------------------------------------
// Pool koneksi ke Database Pusat
// -------------------------------------------------------------------
const poolPusat = new Pool({
  host: process.env.DB_PUSAT_HOST,
  port: process.env.DB_PUSAT_PORT,
  database: process.env.DB_PUSAT_NAME,
  user: process.env.DB_PUSAT_USER,
  password: process.env.DB_PUSAT_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

// -------------------------------------------------------------------
// Bangun Pool koneksi untuk setiap cabang secara dinamis
// berdasarkan CABANG_LIST di .env
// -------------------------------------------------------------------
const daftarCabang = (process.env.CABANG_LIST || '')
  .split(',')
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);

/** @type {Record<string, import('pg').Pool>} */
const poolCabang = {};

daftarCabang.forEach((kodeCabang) => {
  const prefix = `DB_CABANG_${kodeCabang.toUpperCase()}`;

  const host = process.env[`${prefix}_HOST`];
  const port = process.env[`${prefix}_PORT`];
  const database = process.env[`${prefix}_NAME`];
  const user = process.env[`${prefix}_USER`];
  const password = process.env[`${prefix}_PASSWORD`];

  if (!host || !database) {
    console.warn(
      `[SIMORA][WARNING] Konfigurasi database untuk cabang "${kodeCabang}" tidak lengkap di .env. Cabang ini dilewati.`
    );
    return;
  }

  poolCabang[kodeCabang] = new Pool({
    host,
    port,
    database,
    user,
    password,
    max: 10,
    idleTimeoutMillis: 30000,
  });
});

/**
 * Ambil pool koneksi database milik cabang tertentu.
 * @param {string} kodeCabang - contoh: 'bandung', 'tasikmalaya', 'garut'
 * @returns {import('pg').Pool}
 */
function getPoolCabang(kodeCabang) {
  const key = String(kodeCabang || '').toLowerCase();
  const pool = poolCabang[key];
  if (!pool) {
    throw new Error(`Database untuk cabang "${kodeCabang}" tidak ditemukan/tidak terkonfigurasi.`);
  }
  return pool;
}

/**
 * Cek koneksi ke seluruh database (pusat + semua cabang).
 * Digunakan saat server startup untuk memastikan semua node "hidup".
 */
async function cekSemuaKoneksi() {
  const hasil = [];

  // Cek Pusat
  try {
    await poolPusat.query('SELECT 1');
    hasil.push({ node: 'PUSAT', status: 'ONLINE' });
  } catch (err) {
    hasil.push({ node: 'PUSAT', status: 'OFFLINE', error: err.message });
  }

  // Cek tiap Cabang
  for (const kodeCabang of Object.keys(poolCabang)) {
    try {
      await poolCabang[kodeCabang].query('SELECT 1');
      hasil.push({ node: `CABANG_${kodeCabang.toUpperCase()}`, status: 'ONLINE' });
    } catch (err) {
      hasil.push({ node: `CABANG_${kodeCabang.toUpperCase()}`, status: 'OFFLINE', error: err.message });
    }
  }

  return hasil;
}

module.exports = {
  poolPusat,
  poolCabang,
  daftarCabang,
  getPoolCabang,
  cekSemuaKoneksi,
};
