import {
  getState, addToCart, getBrands, getVariants, findItem, priceFor, setToast,
} from "../utils/store.js";
import { formatRupiah, formatNumber } from "../utils/currency.js";
import { escapeHtml, h } from "../utils/dom.js";

const TIPE = [
  { key: "Decant", sub: "Botol Mini / Sample", icon: "🧪" },
  { key: "Segel Baru", sub: "Full Bottle BNIB/NIB", icon: "✨" },
  { key: "Preloved", sub: "Partial / Bekas / Sisa", icon: "🔄" },
];
const PRESETS = {
  Decant: [5, 10],
  "Segel Baru": [100, 50, 30],
  Preloved: [],
};

export function SalesForm() {
  const root = h(`<div id="sales-root"></div>`);
  let tipe = "Decant";
  let volume = 5;
  let brand = "";
  let varian = "";
  let harga = "";

  function presetsHtml() {
    const ps = PRESETS[tipe];
    if (tipe === "Preloved") {
      return `<div class="text-xs text-slate-500">Estimasi sisa volume (ml) — input manual di bawah.</div>`;
    }
    return ps
      .map(
        (v) => `<button type="button" data-vol="${v}" class="vol-btn rounded-lg py-1.5 px-2 text-xs font-semibold border ${volume === v ? "bg-sky-600 border-sky-600 text-white" : "bg-white border-slate-300 text-slate-700 hover:border-sky-500"}">${v} ml</button>`
      )
      .join("");
  }

  // Preset cepat diambil dari katalog Sheet (bukan hardcode) —
  // ambil 3 item pertama yang harganya sudah ada, biar selalu sinkron.
  function presetCatalogHtml() {
    const items = getState().catalog.filter((c) => c.harga5ml > 0).slice(0, 3);
    if (!items.length) {
      return `<div class="col-span-3 text-[11px] text-slate-400">Katalog belum termuat…</div>`;
    }
    return items
      .map(
        (p, i) => `
      <button type="button" data-preset="${i}" class="preset-btn p-2 text-left bg-slate-50 hover:bg-sky-50 hover:border-sky-300 border border-slate-200 rounded-lg transition text-xs">
        <span class="font-semibold block truncate">${escapeHtml(p.brand)} ${escapeHtml(p.varian)}</span>
        <span class="text-sky-700 font-bold text-[11px]">${formatRupiah(p.harga5ml)}</span>
      </button>`
      )
      .join("");
  }

  function render() {
    const brands = getBrands();
    root.innerHTML = `
      <section class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-cart-plus text-sky-600"></i> Form Tambah Item & Keranjang</h2>
          <button type="button" id="reset-form" class="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"><i class="fa-solid fa-rotate-left"></i> Reset Form</button>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Preset Katalog Cepat:</label>
          <div class="grid grid-cols-3 gap-2" id="preset-catalog">${presetCatalogHtml()}</div>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5"><i class="fa-solid fa-boxes-packing text-sky-600"></i> 1. Detail Produk & Tipe Jualan</span>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Jenis / Tipe Jualan <span class="text-rose-500">*</span></label>
            <div class="grid grid-cols-3 gap-1.5" id="tipeProdukGroup">
              ${TIPE.map((t) => `
                <button type="button" data-tipe="${t.key}" class="tipe-btn py-1.5 px-2 text-xs font-semibold rounded-lg border ${tipe === t.key ? "active-tipe" : "border-slate-300 bg-white text-slate-700 hover:border-sky-500"} flex flex-col items-center justify-center gap-0.5">
                  <span>${t.icon} ${t.key}</span>
                  <span class="text-[9px] font-normal ${tipe === t.key ? "opacity-90" : "text-slate-400"}">${t.sub}</span>
                </button>`).join("")}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Brand <span class="text-rose-500">*</span></label>
              <input type="text" id="f-brand" list="brand-list" value="${escapeHtml(brand)}" placeholder="Cari / Pilih Brand..." class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white" autocomplete="off" />
              <datalist id="brand-list">${brands.map((b) => `<option value="${escapeHtml(b)}">`).join("")}</datalist>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Varian <span class="text-rose-500">*</span></label>
              <input type="text" id="f-varian" list="varian-list" value="${escapeHtml(varian)}" placeholder="Cari / Pilih Varian..." class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white" autocomplete="off" />
              <datalist id="varian-list">${getVariants(brand).map((v) => `<option value="${escapeHtml(v)}">`).join("")}</datalist>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-[11px] font-semibold text-slate-600">Ukuran Volume ${tipe === "Preloved" ? "(Sisa)" : "(ml)"}</label>
              <span class="text-[10px] text-slate-500 font-mono">Input: <span class="font-bold text-sky-600" id="volValText">${volume} ml</span></span>
            </div>
            <div class="grid grid-cols-6 gap-1 mb-1.5" id="volumeToggleGroup">${presetsHtml()}</div>
            <div class="relative">
              <input type="number" id="f-volume" value="${volume}" placeholder="Atau ketik volume kustom (ml)..." class="w-full text-xs px-2.5 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white" />
              <span class="absolute right-2.5 top-1.5 text-[10px] text-slate-400">ml</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-1">
              <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Qty</label>
              <input type="number" id="f-qty" value="1" min="1" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 text-center font-semibold" />
            </div>
            <div class="col-span-2">
              <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Harga Satuan (Rp) <span class="text-rose-500">*</span></label>
              <input type="number" id="f-harga" value="${harga}" placeholder="0" min="0" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-900" />
            </div>
          </div>

          <button type="button" id="f-add" class="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-plus text-sky-400"></i> Masukkan ke Keranjang Belanja
          </button>
        </div>
      </section>`;

    // wiring
    root.querySelector("#reset-form").onclick = () => { brand = ""; varian = ""; harga = ""; volume = 5; tipe = "Decant"; setMeta({ tanggalManual: false }); render(); };
    root.querySelector("#f-brand").addEventListener("input", (e) => { brand = e.target.value; refreshVariants(); });
    root.querySelector("#f-varian").addEventListener("input", (e) => {
      varian = e.target.value;
      const it = findItem(brand, varian);
      if (!it) {
        const match = getState().catalog.find((c) => c.varian === varian);
        if (match && !brand) { brand = match.brand; root.querySelector("#f-brand").value = brand; refreshVariants(); }
      }
      autoPrice();
    });
    root.querySelector("#f-volume").addEventListener("input", (e) => {
      volume = parseInt(e.target.value, 10) || 0;
      const vt = root.querySelector("#volValText"); if (vt) vt.textContent = `${volume} ml`;
      autoPrice();
    });
    root.querySelector("#f-harga").addEventListener("input", (e) => { harga = e.target.value; updateSub(); });
    root.querySelector("#f-qty").addEventListener("input", updateSub);

    root.querySelectorAll(".tipe-btn").forEach((b) =>
      b.addEventListener("click", () => {
        tipe = b.getAttribute("data-tipe");
        volume = tipe === "Preloved" ? 5 : (PRESETS[tipe][0] || 5);
        harga = "";
        render();
      })
    );
    root.querySelectorAll(".vol-btn").forEach((b) =>
      b.addEventListener("click", () => {
        volume = parseInt(b.getAttribute("data-vol"), 10);
        const vi = root.querySelector("#f-volume"); if (vi) vi.value = volume;
        const vt = root.querySelector("#volValText"); if (vt) vt.textContent = `${volume} ml`;
        autoPrice(); render();
      })
    );
    root.querySelectorAll(".preset-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const items = getState().catalog.filter((c) => c.harga5ml > 0).slice(0, 3);
        const p = items[parseInt(b.getAttribute("data-preset"), 10)];
        if (!p) return;
        tipe = "Decant"; volume = 5; brand = p.brand; varian = p.varian; harga = String(p.harga5ml);
        render();
      })
    );

    root.querySelector("#f-add").addEventListener("click", addItem);
  }

  function refreshVariants() {
    const dl = root.querySelector("#varian-list");
    if (dl) dl.innerHTML = getVariants(brand).map((v) => `<option value="${escapeHtml(v)}">`).join("");
  }
  function updateSub() {
    const qty = parseInt(root.querySelector("#f-qty").value, 10) || 1;
    const sub = (Number(harga) || 0) * qty;
    // show in volValText area as subtotal hint (keep simple)
  }
  function autoPrice() {
    const known = findItem(brand, varian);
    if (known && (volume === 5 || volume === 10)) {
      const p = priceFor(brand, varian, volume);
      if (p != null) { harga = String(p); const hi = root.querySelector("#f-harga"); if (hi) hi.value = p; }
    } else if (volume && ![5, 10].includes(volume)) {
      harga = ""; const hi = root.querySelector("#f-harga"); if (hi) hi.value = "";
    }
  }
  function addItem() {
    const qty = parseInt(root.querySelector("#f-qty").value, 10) || 1;
    const hargaNum = Number(harga) || 0;
    if (!brand || !varian) { setToast("Brand & Varian wajib diisi"); return; }
    if (!volume || volume <= 0) { setToast("Volume harus > 0"); return; }
    if (hargaNum <= 0) { setToast("Harga satuan harus > 0"); return; }
    addToCart({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipeProduk: tipe, brand, varian, volume, qty,
      hargaSatuan: hargaNum, hargaJual: hargaNum * qty,
    });
    setToast(`✓ ${brand} ${varian} ditambah`);
    root.querySelector("#f-qty").value = 1;
    if (![5, 10].includes(volume)) { harga = ""; root.querySelector("#f-harga").value = ""; }
  }

  root._render = render;
  return root;
}
