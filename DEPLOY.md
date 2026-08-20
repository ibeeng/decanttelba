# Menyambungkan qasirku+ ke Google Sheets (Data Real)

Aplikasi sudah siap pakai data langsung dari Google Sheet. Ikuti 3 langkah ini.

## 1. Buat Google Sheet
- Buka https://sheets.new → buat spreadsheet baru.
- Copy URL-nya, kita butuh Spreadsheet ID (bagian di URL antara `/d/` dan `/edit`).
- Buat 2 tab (sheet) dengan nama persis:
  - **Penjualan** (baris 1 akan diisi header otomatis)
  - **Katalog** (isi header manual di baris 1: `brand | varian | harga5ml | harga10ml`, lalu baris 2+ isi produk)

Contoh isi tab **Katalog**:
```
brand          | varian          | harga5ml | harga10ml
MYKONOS        | SANS            | 35000    | 55000
MYKONOS        | UTHOPIA         | 40000    | 75000
HMNS           | THE PERFECTION  | 65000    | 110000
VELIXIR        | KING ICARUS     | 130000   | 240000
```

## 2. Deploy Apps Script
- Buka https://script.google.com → **New Project**.
- Hapus isi, lalu paste seluruh isi file `src/backend/Code.gs` (sudah lengkap: doGet + doPost + baca/tulis Sheet).
- Klik **Deploy** → **New deployment** → pilih tipe **Web app**:
  - Execute as: **Me**
  - Who has access: **Anyone**
- Klik Deploy → authorize dengan akun lo.
- Copy **Web app URL** (format: `https://script.google.com/macros/s/XXXX/exec`).

## 3. Inisialisasi & Hubungkan
- Buka URL Web App sekali di browser dengan tambahan `?setup=1` di belakang:
  `https://script.google.com/macros/s/XXXX/exec?setup=1`
  → respon `{"status":"ok","setup":true}` artinya header Penjualan & Katalog kebuat.
- Buka aplikasi qasirku+ → klik ⚙️ **Koneksi Spreadsheet** → paste URL Web App → Save.
- Refresh halaman. Status pill berubah jadi **"Terhubung ke Spreadsheet"** (hijau).
- Katalog otomatis diambil dari tab Katalog; riwayat di panel kanan otomatis dari tab Penjualan (live).

## Endpoint (untuk reference)
- `GET  ?setup=1`            → buat header
- `GET  ?action=catalog`     → `{data:[{brand,varian,harga5ml,harga10ml}]}`
- `GET  ?action=sales&limit=100` → `{data:[...baris penjualan terbaru]}`
- `POST {rows:[...]}`         → tulis penjualan ke sheet

## Catatan CORS / Error
- Apps Script Web app already sends JSON; kalau dapat error CORS, pastikan "Who has access: Anyone".
- Kalau koneksi gagal/offline, app otomatis fallback ke katalog lokal (`src/data/catalog.json`) & simpan riwayat di localStorage.
