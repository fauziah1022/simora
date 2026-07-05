-- =====================================================================
-- SIMORA - Skema Database CABANG (template)
-- =====================================================================
-- File ini dijalankan TERPISAH untuk masing-masing database cabang:
--   - simora_cabang_bandung
--   - simora_cabang_tasikmalaya
--   - simora_cabang_garut
--
-- Ini adalah wujud FRAGMENTASI HORIZONTAL: setiap cabang punya baris
-- data customer, mobil, transaksi miliknya sendiri, terpisah penuh
-- secara fisik dari cabang lain.
-- =====================================================================

DROP TABLE IF EXISTS laporan_kerusakan CASCADE;
DROP TABLE IF EXISTS pengembalian CASCADE;
DROP TABLE IF EXISTS transaksi_rental CASCADE;
DROP TABLE IF EXISTS mobil CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS petugas CASCADE;

-- ---------------------------------------------------------------------
-- Tabel: petugas
-- Salinan lokal akun petugas cabang ini (untuk autentikasi cepat
-- tanpa selalu bergantung pada server pusat).
-- ---------------------------------------------------------------------
CREATE TABLE petugas (
    id_petugas      SERIAL PRIMARY KEY,
    id_petugas_pusat INTEGER,                 -- referensi logis ke id_petugas di DB Pusat
    nama_lengkap    VARCHAR(100) NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    email           VARCHAR(100),
    no_telepon      VARCHAR(20),
    foto_profil     VARCHAR(255),
    status          VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    dibuat_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: customer
-- Data penyewa mobil di cabang ini.
-- ---------------------------------------------------------------------
CREATE TABLE customer (
    id_customer     SERIAL PRIMARY KEY,
    nama_lengkap    VARCHAR(100) NOT NULL,
    no_ktp          VARCHAR(30) UNIQUE NOT NULL,
    no_telepon      VARCHAR(20) NOT NULL,
    email           VARCHAR(100),
    alamat          TEXT,
    foto_ktp        VARCHAR(255),
    dibuat_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: mobil
-- Armada mobil fisik yang berada di cabang ini.
-- id_mobil_pusat menghubungkan ke tabel mobil master di DB Pusat.
-- ---------------------------------------------------------------------
CREATE TABLE mobil (
    id_mobil            SERIAL PRIMARY KEY,
    id_mobil_pusat       INTEGER,               -- referensi logis ke id_mobil di DB Pusat
    plat_nomor           VARCHAR(20) UNIQUE NOT NULL,
    merk                 VARCHAR(50) NOT NULL,
    model                VARCHAR(50) NOT NULL,
    tahun                INTEGER,
    warna                VARCHAR(30),
    tarif_harian          NUMERIC(12,2) NOT NULL,
    foto_mobil            VARCHAR(255),
    status                VARCHAR(30) DEFAULT 'tersedia'
                          CHECK (status IN ('tersedia','disewa','menunggu_pemeriksaan','nonaktif')),
    dibuat_pada           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diperbarui_pada       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: transaksi_rental
-- ---------------------------------------------------------------------
CREATE TABLE transaksi_rental (
    id_transaksi         SERIAL PRIMARY KEY,
    id_customer           INTEGER NOT NULL REFERENCES customer(id_customer),
    id_mobil              INTEGER NOT NULL REFERENCES mobil(id_mobil),
    id_petugas            INTEGER NOT NULL REFERENCES petugas(id_petugas),
    tanggal_mulai          DATE NOT NULL,
    tanggal_selesai_rencana DATE NOT NULL,
    tarif_harian_saat_sewa  NUMERIC(12,2) NOT NULL,
    status_transaksi        VARCHAR(30) DEFAULT 'berjalan'
                            CHECK (status_transaksi IN ('berjalan','selesai','dibatalkan')),
    dibuat_pada             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: pengembalian
-- ---------------------------------------------------------------------
CREATE TABLE pengembalian (
    id_pengembalian        SERIAL PRIMARY KEY,
    id_transaksi            INTEGER NOT NULL UNIQUE REFERENCES transaksi_rental(id_transaksi),
    id_petugas               INTEGER NOT NULL REFERENCES petugas(id_petugas),
    tanggal_kembali_aktual    DATE NOT NULL,
    kondisi_mobil             VARCHAR(30) NOT NULL
                              CHECK (kondisi_mobil IN ('baik','lecet_ringan','rusak_ringan','rusak_berat')),
    foto_kondisi              TEXT[],            -- array path foto
    biaya_rental              NUMERIC(12,2) DEFAULT 0,
    denda_terlambat            NUMERIC(12,2) DEFAULT 0,
    denda_kerusakan             NUMERIC(12,2) DEFAULT 0,
    total_biaya                 NUMERIC(12,2) DEFAULT 0,
    catatan                      TEXT,
    dibuat_pada                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: laporan_kerusakan
-- Dibuat otomatis ketika kondisi pengembalian = 'rusak_berat'.
-- ---------------------------------------------------------------------
CREATE TABLE laporan_kerusakan (
    id_laporan             SERIAL PRIMARY KEY,
    id_pengembalian          INTEGER NOT NULL REFERENCES pengembalian(id_pengembalian),
    id_mobil                 INTEGER NOT NULL REFERENCES mobil(id_mobil),
    id_petugas                INTEGER NOT NULL REFERENCES petugas(id_petugas),
    deskripsi_kerusakan        TEXT NOT NULL,
    foto_kerusakan              TEXT[],
    status_penanganan           VARCHAR(30) DEFAULT 'menunggu_pemeriksaan'
                                CHECK (status_penanganan IN ('menunggu_pemeriksaan','diproses','ditolak','disetujui_ditarik')),
    catatan_admin                TEXT,
    dilaporkan_pada               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ditangani_pada                TIMESTAMP
);
