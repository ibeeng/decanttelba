# KasirParfum+ (qasirku+)

Aplikasi kasir penjualan parfum (Decant / Segel Baru / Preloved) berbasis **Astro.js + Tailwind CSS**, dengan backend **Google Sheets** via Google Apps Script. Tanpa biaya server database.

Sesuai PRD: input dinamis, keranjang multi-item, pembayaran + kembalian, struk thermal + WhatsApp, sinkronisasi Sheets, dan fallback offline (localStorage).

## Jalankan di lokal

```bash
npm install
npm run dev      # buka http://localhost:4321
# (jika port 4321 sudah dipakai, Astro otomatis pindah ke 4322, dst)
```

Build statis:

```bash
npm run build    # output di dist/
npm run preview
```

## Struktur

```
src/
  components/   SalesForm, Cart, Payment, Receipt, History, Stats, Settings
  data/         catalog.json  (master catalog brand/varian/harga)
  layouts/      Layout.astro
  pages/        index.astro   (orchestrator UI)
  backend/      Code.gs       (Google Apps Script — deploy ke Web App)
  styles/       global.css    (tema cokelat/emas)
  utils/        store, currency, storage, sync, dom
test/           logic.test.mjs, sync.test.mjs  (jalankan: node test/*.mjs)
```

## Setup Google Sheets + Apps Script (PRD 5.2)

1. Buat Google Sheet baru.
2. Buka [script.google.com](https://script.google.com) → New Project → salin isi `src/backend/Code.gs`.
3. Deploy → **New deployment** → tipe **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy URL Web App (format `https://script.google.com/macros/s/.../exec`).
5. Di aplikasi kasir → klik **⚙️** → tempel URL → Simpan.
   (URL hanya disimpan di localStorage browser ini — mode offline aktif jika kosong.)

Header kolom (baris 1) dibuat otomatis saat transaksi pertama, atau jalankan `setupHeaders()` sekali.

## Skema Google Sheets (PRD 4.2)

`id | tanggal | tipeProduk | brand | varian | volume | qty | hargaSatuan | hargaJual | metodeBayar | ketSumber | keterangan | whatsapp`

## Fitur (status PRD)

- [x] Fase 2 — Astro + Tailwind + UI islands (vanilla JS store)
- [x] Fase 3 — Google Apps Script backend + webhook + autofill catalog
- [x] Fase 4 — checkout end-to-end, struk thermal (print), deep link WhatsApp, fallback offline
- [ ] Fase 5 — deployment ke Vercel/Netlify (lihat catatan di bawah)

### Catatan deploy
`npm run build` menghasilkan situs statis → upload ke Vercel/Netlify/Cloudflare Pages.
Tidak perlu adapter karena sinkronisasi dilakukan langsung dari browser ke Apps Script
(kecuali Anda mau menyembunyikan URL via proxy server — tambahkan `src/pages/api/sync.js` + adapter).

## Testing

```bash
node test/logic.test.mjs    # 11 test: catalog, autofill harga, total, kembalian, CSV
node test/sync.test.mjs     # 3 test: offline fallback, webhook POST, failure backup
```
