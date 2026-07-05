# 🚗 SIMORA
### Sistem Informasi Rental Mobil Multi Cabang Terdistribusi

Proyek Mata Kuliah Sistem Terdistribusi.

---

## 📌 Status Pengerjaan

- [x] **Tahap 1** — Fondasi Proyek (struktur folder, server Express dasar, konfigurasi multi-database, skema SQL)
- [ ] Tahap 2 — Autentikasi (Login Admin & Petugas, JWT, RBAC)
- [ ] Tahap 3 — Dashboard & Layout (Dark Glassmorphism)
- [ ] Tahap 4 — Modul Kelola Cabang, Kelola Petugas, Kelola Mobil
- [ ] Tahap 5 — Modul Rental & Pengembalian
- [ ] Tahap 6 — Modul Laporan Kerusakan & Penarikan Armada
- [ ] Tahap 7 — Monitoring Pusat, Sinkronisasi Data, Laporan & Grafik
- [ ] Tahap 8 — Finalisasi & Pengaturan

---

## 🗂️ Struktur Folder (Tahap 1)

```
simora/
├── backend/
│   ├── config/
│   │   └── database.js        # Koneksi multi-DB (Pusat + tiap Cabang)
│   ├── controllers/           # (akan diisi bertahap)
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/                # (akan diisi bertahap)
│   ├── routes/
│   │   └── systemRoutes.js    # Endpoint monitoring kesehatan node
│   ├── utils/
│   │   └── logger.js
│   ├── uploads/
│   │   ├── kerusakan/
│   │   └── pengembalian/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js              # Entry point
├── frontend/
│   ├── admin/                 # Halaman-halaman Admin Pusat
│   ├── petugas/                # Halaman-halaman Petugas Cabang
│   └── assets/
│       ├── css/
│       ├── js/
│       └── img/
├── database/
│   ├── schema/
│   │   ├── pusat.sql           # Skema DB Pusat
│   │   └── cabang.sql          # Skema DB Cabang (template, dipakai 3x)
│   └── seed/                   # (akan diisi bertahap)
└── README.md
```

---

## ⚙️ Persiapan (Wajib sebelum menjalankan)

### 1. Install PostgreSQL
Pastikan PostgreSQL sudah terinstall dan service-nya berjalan di komputer Anda.

### 2. Buat 4 Database via CMD / psql
Buka **CMD** atau **psql**, lalu jalankan:

```sql
CREATE DATABASE simora_pusat;
CREATE DATABASE simora_cabang_bandung;
CREATE DATABASE simora_cabang_tasikmalaya;
CREATE DATABASE simora_cabang_garut;
```

### 3. Import Skema SQL
Dari CMD, arahkan ke folder `database/schema`, lalu jalankan (sesuaikan `postgres` dengan user Anda):

```bash
psql -U postgres -d simora_pusat -f pusat.sql
psql -U postgres -d simora_cabang_bandung -f cabang.sql
psql -U postgres -d simora_cabang_tasikmalaya -f cabang.sql
psql -U postgres -d simora_cabang_garut -f cabang.sql
```

> Setiap perintah di atas akan diminta password PostgreSQL Anda.

### 4. Konfigurasi Environment
Masuk ke folder `backend`, lalu **copy** `.env.example` menjadi `.env`:

```bash
cd backend
copy .env.example .env
```

Buka `.env` dan sesuaikan `DB_..._USER` dan `DB_..._PASSWORD` dengan kredensial PostgreSQL Anda (defaultnya `postgres` / `postgres`).

### 5. Install Dependency
Masih di dalam folder `backend`:

```bash
npm install
```

### 6. Jalankan Server

```bash
npm run dev
```

Jika berhasil, akan muncul log seperti ini di CMD:

```
[SUKSES] ... - Server SIMORA berjalan di http://localhost:5000
[INFO] ... - Mengecek koneksi ke seluruh node database (Pusat & Cabang)...
[NODE] ... - ✅ PUSAT -> ONLINE
[NODE] ... - ✅ CABANG_BANDUNG -> ONLINE
[NODE] ... - ✅ CABANG_TASIKMALAYA -> ONLINE
[NODE] ... - ✅ CABANG_GARUT -> ONLINE
```

### 7. Cek di Browser
- Buka `http://localhost:5000` → halaman selamat datang.
- Buka `http://localhost:5000/api/system/health` → JSON status seluruh node database (bukti konsep monitoring terdistribusi).

Contoh respons:
```json
{
  "sukses": true,
  "pesan": "Status kesehatan node SIMORA",
  "ringkasan": { "totalNode": 4, "semuaOnline": true },
  "nodes": [
    { "node": "PUSAT", "status": "ONLINE" },
    { "node": "CABANG_BANDUNG", "status": "ONLINE" },
    { "node": "CABANG_TASIKMALAYA", "status": "ONLINE" },
    { "node": "CABANG_GARUT", "status": "ONLINE" }
  ],
  "cabangTerdaftar": ["bandung", "tasikmalaya", "garut"]
}
```

---

## 🧠 Catatan Konsep Sistem Terdistribusi (Tahap 1)

| Konsep | Implementasi |
|---|---|
| **Fragmentasi Horizontal** | Tabel `customer`, `mobil`, `transaksi_rental`, dll pada tiap cabang disimpan di **database fisik terpisah** (`simora_cabang_bandung`, `simora_cabang_tasikmalaya`, `simora_cabang_garut`), bukan sekadar dipisah dengan kolom `id_cabang`. |
| **Simulasi Server Terpisah** | Setiap cabang punya konfigurasi `HOST`/`PORT`/`USER`/`PASSWORD` sendiri di `.env`. Saat ini semua mengarah ke `localhost`, tapi arsitektur kode (lihat `config/database.js`) sudah siap dialihkan ke server sungguhan tanpa mengubah source code. |
| **Server Pusat (Monitoring Node)** | `simora_pusat` menyimpan data master + tabel `ringkasan_transaksi` & `ringkasan_pendapatan` sebagai representasi **Replikasi Ringkasan Data**, yang nanti diisi lewat proses sinkronisasi (Tahap selanjutnya). |
| **RBAC (Role Based Access Control)** | Dipisah lewat dua tabel akun (`admin_pusat` di DB Pusat, `petugas` di DB Pusat & DB Cabang) dan dua halaman login berbeda (`/admin/login`, `/petugas/login`) — akan diimplementasikan penuh di Tahap 2. |

---

## ❓ Troubleshooting

- **Node database "OFFLINE" di log** → pastikan PostgreSQL service berjalan, database sudah dibuat, dan kredensial di `.env` benar.
- **Port 5000 sudah dipakai** → ubah `PORT` di `.env`.
- **`npm install` error** → pastikan Node.js versi 18+ terinstall (`node -v`).

---

➡️ **Tahap 1 selesai.** Beri instruksi lanjut untuk mengerjakan **Tahap 2: Autentikasi (Login Admin & Petugas + JWT + RBAC)**.
