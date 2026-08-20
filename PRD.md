Product Requirement Document (PRD)

Aplikasi Kasir Penjualan Parfum (Astro.js + Google Sheets)

1. Executive Summary

Nama Project: KasirPenjualan+ (Astro POS)

Tujuan: Membangun aplikasi kasir (Point of Sale) web modern, super cepat, dan ringan khusus untuk usaha ritel/decant parfum. Aplikasi ini terintegrasi langsung ke Google Sheets sebagai basis data backend tanpa biaya berlangganan server database.

Tech Stack Utama:

Frontend Framework: Astro.js (Hybrid Rendering / SSR + Islands Architecture)

Styling: Tailwind CSS

Backend / Database: Google Sheets API via Google Apps Script (Webhook Web App Endpoint)

Deployment: Vercel / Cloudflare Pages / Netlify (Free Tier)

2. Kebutuhan Pengguna & Problem Statement

Problem

Pencatatan Manual Lambat: Mengisi varian parfum, volume, dan harga satu per satu di Google Sheets seluler/laptop memakan waktu lama saat ada antrean pembeli.

Kombinasi Produk Beragam: Adanya jenis jualan yang bervariasi (Decant 5ml/10ml, Full Bottle Segel Baru, dan Partial/Preloved) yang membutuhkan alur input berbeda.

Transaksi Multi-Item: Pembeli sering membeli lebih dari satu jenis parfum dalam satu nota checkout.

Kebutuhan Cetak Nota & WA: Kasir butuh mengirimkan nota/struk langsung ke WhatsApp pelanggan atau mencetak struk thermal secara serba otomatis.

Objective

Menyediakan antarmuka kasir ringkas (ultra-fast POS) dengan fitur preset catalog, pencarian otomatis (autocomplete), kalkulator kembalian, keranjang multi-item, serta Sinkronisasi Google Sheets otomatis.

3. Fitur & Spesifikasi Fungsional

3.1. Modul Input Penjualan Dinamis (Sales Input Module)

Kategori / Tipe Produk (Tabs Toggle):

Decant (Botol Mini / Sample):

Preset Volume Quick Toggle: 5 ml dan 10 ml.

Option kustom: Input angka manual untuk volume lain (misal: 7ml, 15ml).

Segel Baru (Full Bottle BNIB / NIB):

Preset Volume Quick Toggle: 100 ml, 50 ml, dan 30 ml.

Option kustom: Input angka manual untuk botol ukuran lain.

Preloved (Partial Bottle / Bekas):

Tanpa tombol preset. Langsung menampilkan input manual estimasi sisa volume (ml).

Smart Autocomplete (Brand & Varian):

Datalist Search untuk Brand & Varian dari Master Catalog.

Memilih Brand akan otomatis menyaring daftar Varian yang relevan.

Memilih Varian akan otomatis mengisi Brand jika belum diisi.

Autofill & Auto-Clear Harga Satuan:

Jika Brand + Varian sesuai dengan Master Catalog dan Volume adalah 5 ml atau 10 ml, harga satuan otomatis terisi dari database.

Jika pengguna memasukkan volume custom (di luar 5ml/10ml), kolom Harga Satuan (Rp) otomatis dikosongkan (clear) untuk mencegah salah input harga preset.

3.2. Keranjang Belanja Multi-Item (Cart System)

Pengguna dapat menambahkan beberapa produk dengan tipe berlainan (Decant, Segel Baru, Preloved) ke dalam keranjang belanja.

Menampilkan daftar item, kuantitas (qty), harga satuan, dan subtotal.

Indikator badge warna untuk membedakan jenis produk (Decant = Biru, Segel Baru = Hijau, Preloved = Amber).

Fitur hapus item dari keranjang.

Perhitungan Total Belanja secara realtime.

3.3. Modul Pembayaran & Tracking Sumber Pesanan

Tanggal & Waktu Transaksi: Input datetime-local (default: waktu lokal saat ini).

Ket. Sumber Pesanan (Dropdown):

WhatsApp 💬, Toko Offline 🛍️, Tokopedia 💚, Shopee 🧡, TikTok Shop 🖤, Instagram DM 📸.

Metode Pembayaran (Toggle Buttons):

Cash 💵 (dengan kalkulator uang diterima & kembalian otomatis).

QRIS 📱

Transfer 🏦

Data Tambahan: No. WhatsApp Pelanggan & Catatan/Keterangan Transaksi.

3.4. Cetak Struk & Integrasi WhatsApp

Thermal Receipt Modal:

Menampilkan pratinjau nota belanja bergaya struk thermal monospaced.

Rincian itemized, total, uang diterima, dan kembalian.

Tombol Cetak Struk (window.print()).

Tombol Kirim WA: Membuka tautan API WhatsApp (wa.me/62...) dengan template teks nota rapi terformat otomatis.

3.5. Integrasi Google Sheets & Backup Lokal

Sinkronisasi Webhook: Mengirim data payload JSON via HTTP POST (fetch) ke Apps Script Web App Endpoint.

Offline Fallback / Emergency Mode: Jika URL Apps Script belum dikonfigurasi atau perangkat luring, data tersimpan aman di localStorage browser.

Export Data: Fitur unduh riwayat transaksi ke berkas .csv / Excel.

4. Struktur Data (Data Schema)

4.1. Master Catalog Dataset (JSON / Astro Collections)

[
  { "brand": "MYKONOS", "varian": "SANS", "harga5ml": 35000, "harga10ml": 55000 },
  { "brand": "MYKONOS", "varian": "UTHOPIA", "harga5ml": 40000, "harga10ml": 75000 },
  { "brand": "HMNS", "varian": "THE PERFECTION", "harga5ml": 35000, "harga10ml": 65000 },
  { "brand": "VELIXIR", "varian": "KING ICARUS", "harga5ml": 65000, "harga10ml": 130000 }
]


4.2. Skema Kolom Google Sheets (Header Baris 1)

Kolom

Nama Field

Tipe Data

Contoh Isi

A

id

String / Number

1700000000000

B

tanggal

Datetime String

2026-08-19 14:30

C

tipeProduk

String

Decant / Segel Baru / Preloved

D

brand

String

MYKONOS

E

varian

String

SANS

F

volume

Number (ml)

5

G

qty

Number

2

H

hargaSatuan

Number (Rp)

35000

I

hargaJual

Number (Subtotal)

70000

J

metodeBayar

String

Cash / QRIS / Transfer

K

ketSumber

String

WhatsApp / Toko Offline

L

keterangan

String

Packing Buble Wrap

M

whatsapp

String

081234567890

5. Arsitektur Proyek Astro.js

5.1. Struktur Folder Rekomendasi

kasir-parfum-astro/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── StatsWidget.astro
│   │   ├── SalesForm.jsx (atau React/Vanilla Island untuk interaktivitas)
│   │   ├── CartList.jsx
│   │   ├── HistoryTable.jsx
│   │   ├── ReceiptModal.jsx
│   │   └── SettingsModal.jsx
│   ├── data/
│   │   └── catalog.json
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── api/
│   │   │   └── sync.js (Astro API Route Proxy jika perlu panggil Apps Script)
│   │   └── index.astro
│   └── utils/
│       ├── currency.js
│       └── storage.js
├── astro.config.mjs
├── tailwind.config.cjs
└── package.json


5.2. Alur Backend Google Apps Script (Code.gs)

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    data.id,
    data.tanggal,
    data.tipeProduk,
    data.brand,
    data.varian,
    data.volume,
    data.qty,
    data.hargaSatuan,
    data.hargaJual,
    data.metodeBayar,
    data.ketSumber,
    data.keterangan,
    data.whatsapp
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}


6. Non-Functional Requirements (NFR)

Kecepatan & Performa: Time-to-Interactive (TTI) di bawah 1.5 detik pada jaringan 4G.

Kemudahan Penggunaan (Usability): Alur checkout dapat diselesaikan dalam kurang dari 3-5 klik per produk.

Responsivitas UI: Kompatibel untuk layar HP Android/iOS (kasir mobile) dan monitor PC/Desktop toko.

Keamanan Data: URL Google Apps Script disimpan pada localStorage atau .env variabel proyek Astro.

7. Roadmap Pengembangan

[x] Fase 1: Desain UI/UX Mockup & Sistem Keranjang Multi-Item (Selesai pada HTML Prototype).

[x] Fase 2: Setup Proyek Astro.js + Tailwind CSS & Integrasi UI Islands (React/Svelte/Vanilla JS) — selesai (vanilla store).

[x] Fase 3: Konfigurasi Google Apps Script Backend & Endpoint Webhook API — selesai (src/backend/Code.gs).

[x] Fase 4: Pengujian Transaksi End-to-End, Cetak Thermal Struk, & WhatsApp Deep Link — selesai (terverifikasi via browser + unit test).

[ ] Fase 5: Deployment ke Vercel / Netlify.
