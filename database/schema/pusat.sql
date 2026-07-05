-- =====================================================================
-- SIMORA - Skema Database PUSAT (simora_pusat)
-- =====================================================================
-- Database ini adalah "otak" monitoring dari server pusat.
-- Berisi data master (cabang, admin, petugas, mobil) dan
-- REPLIKASI RINGKASAN (summary replication) dari setiap cabang,
-- BUKAN salinan penuh transaksi detail cabang.
-- =====================================================================

-- Hapus tabel lama jika ada (untuk kemudahan development ulang)
DROP TABLE IF EXISTS penarikan_armada CASCADE;
DROP TABLE IF EXISTS laporan_kerusakan_pusat CASCADE;
DROP TABLE IF EXISTS ringkasan_pendapatan CASCADE;
DROP TABLE IF EXISTS ringkasan_transaksi CASCADE;
DROP TABLE IF EXISTS mobil CASCADE;
DROP TABLE IF EXISTS petugas CASCADE;
DROP TABLE IF EXISTS admin_pusat CASCADE;
DROP TABLE IF EXISTS cabang CASCADE;

-- ---------------------------------------------------------------------
-- Tabel: cabang
-- Master data seluruh cabang yang terdaftar dalam sistem terdistribusi
-- ---------------------------------------------------------------------
CREATE TABLE cabang (
    id_cabang       SERIAL PRIMARY KEY,
    kode_cabang     VARCHAR(50) UNIQUE NOT NULL,   -- contoh: 'bandung'
    nama_cabang     VARCHAR(100) NOT NULL,
    alamat          TEXT,
    kota            VARCHAR(100),
    no_telepon      VARCHAR(20),
    status          VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    -- Informasi koneksi "server" cabang (disimulasikan)
    host_server     VARCHAR(100),
    dibuat_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: admin_pusat
-- Akun admin yang login di /admin/login
-- ---------------------------------------------------------------------
CREATE TABLE admin_pusat (
    id_admin        SERIAL PRIMARY KEY,
    nama_lengkap    VARCHAR(100) NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    email           VARCHAR(100),
    foto_profil     VARCHAR(255),
    status          VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    dibuat_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: petugas
-- Master akun petugas cabang (login di /petugas/login).
-- Disimpan terpusat agar admin bisa Kelola Petugas dari satu tempat,
-- namun operasional harian petugas tetap merujuk ke data di DB cabangnya.
-- ---------------------------------------------------------------------
CREATE TABLE petugas (
    id_petugas      SERIAL PRIMARY KEY,
    id_cabang       INTEGER NOT NULL REFERENCES cabang(id_cabang),
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
-- Tabel: mobil
-- Master data armada mobil pusat (data induk), status terkini
-- disinkronkan dari database cabang tempat mobil tsb ditempatkan.
-- ---------------------------------------------------------------------
CREATE TABLE mobil (
    id_mobil            SERIAL PRIMARY KEY,
    id_cabang           INTEGER NOT NULL REFERENCES cabang(id_cabang),
    plat_nomor          VARCHAR(20) UNIQUE NOT NULL,
    merk                VARCHAR(50) NOT NULL,
    model               VARCHAR(50) NOT NULL,
    tahun               INTEGER,
    warna               VARCHAR(30),
    tarif_harian        NUMERIC(12,2) NOT NULL,
    foto_mobil          VARCHAR(255),
    status              VARCHAR(30) DEFAULT 'tersedia'
                         CHECK (status IN ('tersedia','disewa','menunggu_pemeriksaan','nonaktif')),
    dibuat_pada         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diperbarui_pada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: ringkasan_transaksi
-- REPLIKASI RINGKASAN dari database cabang (bukan detail transaksi).
-- Diisi secara berkala oleh proses sinkronisasi dari tiap cabang.
-- ---------------------------------------------------------------------
CREATE TABLE ringkasan_transaksi (
    id_ringkasan        SERIAL PRIMARY KEY,
    id_cabang           INTEGER NOT NULL REFERENCES cabang(id_cabang),
    tanggal              DATE NOT NULL,
    total_transaksi      INTEGER DEFAULT 0,
    total_mobil_disewa    INTEGER DEFAULT 0,
    total_pengembalian    INTEGER DEFAULT 0,
    disinkron_pada        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_cabang, tanggal)
);

-- ---------------------------------------------------------------------
-- Tabel: ringkasan_pendapatan
-- REPLIKASI RINGKASAN pendapatan per cabang per hari.
-- ---------------------------------------------------------------------
CREATE TABLE ringkasan_pendapatan (
    id_ringkasan        SERIAL PRIMARY KEY,
    id_cabang           INTEGER NOT NULL REFERENCES cabang(id_cabang),
    tanggal              DATE NOT NULL,
    pendapatan_rental     NUMERIC(14,2) DEFAULT 0,
    pendapatan_denda      NUMERIC(14,2) DEFAULT 0,
    total_pendapatan      NUMERIC(14,2) DEFAULT 0,
    disinkron_pada        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_cabang, tanggal)
);

-- ---------------------------------------------------------------------
-- Tabel: laporan_kerusakan_pusat
-- Replikasi laporan kerusakan "Rusak Berat" yang dikirim dari cabang
-- untuk ditindaklanjuti Admin Pusat (Tolak/Proses/Setujui & Tarik).
-- ---------------------------------------------------------------------
CREATE TABLE laporan_kerusakan_pusat (
    id_laporan_pusat     SERIAL PRIMARY KEY,
    id_laporan_cabang    INTEGER NOT NULL,     -- FK logis ke tabel laporan_kerusakan di DB cabang
    id_cabang            INTEGER NOT NULL REFERENCES cabang(id_cabang),
    id_mobil             INTEGER NOT NULL REFERENCES mobil(id_mobil),
    plat_nomor           VARCHAR(20) NOT NULL,
    deskripsi_kerusakan   TEXT,
    tingkat_kerusakan     VARCHAR(30) DEFAULT 'rusak_berat',
    foto_kerusakan        TEXT[],               -- array path foto
    status_penanganan     VARCHAR(30) DEFAULT 'menunggu_pemeriksaan'
                          CHECK (status_penanganan IN ('menunggu_pemeriksaan','diproses','ditolak','disetujui_ditarik')),
    catatan_admin         TEXT,
    dilaporkan_pada       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ditangani_pada        TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabel: penarikan_armada
-- Riwayat keputusan penarikan armada oleh Admin Pusat.
-- ---------------------------------------------------------------------
CREATE TABLE penarikan_armada (
    id_penarikan         SERIAL PRIMARY KEY,
    id_laporan_pusat     INTEGER NOT NULL REFERENCES laporan_kerusakan_pusat(id_laporan_pusat),
    id_mobil             INTEGER NOT NULL REFERENCES mobil(id_mobil),
    id_admin             INTEGER NOT NULL REFERENCES admin_pusat(id_admin),
    keterangan            TEXT,
    ditarik_pada          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Data awal: 3 Cabang
-- ---------------------------------------------------------------------
INSERT INTO cabang (kode_cabang, nama_cabang, alamat, kota, no_telepon, host_server) VALUES
('bandung', 'SIMORA Cabang Bandung', 'Jl. Asia Afrika No. 10', 'Bandung', '022-1234567', 'localhost:5432/simora_cabang_bandung'),
('tasikmalaya', 'SIMORA Cabang Tasikmalaya', 'Jl. HZ Mustofa No. 25', 'Tasikmalaya', '0265-123456', 'localhost:5432/simora_cabang_tasikmalaya'),
('garut', 'SIMORA Cabang Garut', 'Jl. Ahmad Yani No. 5', 'Garut', '0262-123456', 'localhost:5432/simora_cabang_garut');
