# SIMORA - Sistem Informasi Rental Mobil Terdistribusi

Frontend aplikasi rental mobil multi-cabang, dibuat dengan HTML5, CSS3, dan
Vanilla JavaScript (tanpa framework). Terdiri dari dua portal terpisah:

- **`admin/`** — Portal Admin Pusat (kelola armada mobil, pantau semua cabang)
- **`petugas/`** — Portal Petugas Cabang (kelola customer, rental, & pengembalian di cabang masing-masing)

## Demo Login

**Admin** (`admin/index.html`)
```
Username: admin
Password: admin123
```

**Petugas** (`petugas/index.html`) — akun berbeda per cabang, password di-hash SHA-256:

| Cabang | Username | Password |
|---|---|---|
| Pusat | `budi.pusat` | `Pusat#2026!` |
| Bandung | `sari.bandung` | `Bandung#2026!` |
| Garut | `asep.garut` | `Garut#2026!` |
| Tasikmalaya | `wati.tasik` | `Tasik#2026!` |

## Menjalankan secara lokal

Buka langsung file `admin/index.html` atau `petugas/index.html` di browser
(double-click, atau lewat live server apapun). Data disimpan di `localStorage`
browser, otomatis ter-seed saat pertama kali dibuka.

## Deploy ke GitHub Pages (HTTPS gratis)

1. Buat repo baru di GitHub, lalu push project ini (lihat perintah di bawah).
2. Di repo → **Settings → Pages**.
3. Pada **Source**, pilih branch `main` dan folder `/ (root)` (atau `/docs` kalau kamu pindahkan ke situ).
4. Simpan — GitHub akan otomatis kasih URL `https://<username>.github.io/<nama-repo>/`.
5. Karena ada dua portal, aksesnya jadi:
   - `https://<username>.github.io/<nama-repo>/admin/`
   - `https://<username>.github.io/<nama-repo>/petugas/`

GitHub Pages otomatis pakai HTTPS, jadi tidak perlu setup sertifikat apapun.

## Integrasi Backend

Frontend ini sudah disiapkan untuk backend Express.js + PostgreSQL. Di
`admin/js/common.js` dan `petugas/js/common.js`, ubah:

```js
const API_BASE_URL = 'https://nama-backend-kamu.com/api';
const USE_API = true;
```

Endpoint yang sudah disiapkan: `/login`, `/mobil`, `/customer`, `/rental`,
`/pengembalian`, `/laporan` (lihat `API_ENDPOINTS` di `common.js`).
