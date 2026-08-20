import { getState, getTotal, getKembalian, setMeta, formatRupiah } from "../utils/index.js";
import { h } from "../utils/dom.js";

const SUMBER = [
  ["WhatsApp", "💬"],
  ["Offline Store", "🛍️"],
  ["Tokopedia", "💚"],
  ["Shopee", "🧡"],
  ["TikTok Shop", "🖤"],
  ["Instagram", "📸"],
];
const BAYAR = [
  { k: "Cash", icon: "fa-money-bill-wave" },
  { k: "QRIS", icon: "fa-qrcode" },
  { k: "Transfer", icon: "fa-building-columns" },
];

export function PaymentPanel() {
  const root = h(`<div id="payment-root"></div>`);

  // Build the static structure ONCE. Subsequent state changes only patch
  // values (guarding the focused field) instead of rebuilding the form,
  // so typing in WA / uang diterima / catatan keeps focus & caret.
  function build() {
    const m = getState().meta;
    root.innerHTML = `
      <form id="salesForm" class="space-y-3 pt-2 border-t border-slate-100" onsubmit="return false;">
        <span class="text-xs font-bold text-slate-700 block">2. Data Pembayaran & Sumber Pesanan</span>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Tanggal <span class="text-rose-500">*</span></label>
            <input type="datetime-local" id="m-tanggal" value="${m.tanggal}" class="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Ket. Sumber Pesanan <span class="text-rose-500">*</span></label>
            <select id="m-sumber" class="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white font-medium">
              ${SUMBER.map(([n, e]) => `<option value="${n}" ${m.ketSumber === n ? "selected" : ""}>${e} ${n}</option>`).join("")}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Metode Pembayaran <span class="text-rose-500">*</span></label>
          <div class="grid grid-cols-3 gap-1.5" id="paymentMethodGroup">
            ${BAYAR.map((b) => `
              <button type="button" data-bayar="${b.k}" class="pay-btn py-1.5 px-2 text-xs font-semibold rounded-lg border ${m.metodeBayar === b.k ? "active-pay" : "border-slate-300 bg-white text-slate-700 hover:border-sky-500"} flex items-center justify-center gap-1">
                <i class="fa-solid ${b.icon}"></i> ${b.k}
              </button>`).join("")}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">No. WA Pelanggan</label>
            <input type="tel" id="m-wa" value="${m.whatsapp || ""}" placeholder="081234567890" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Uang Diterima (Rp)</label>
            <input type="number" id="m-diterima" value="${m.uangDiterima || ""}" placeholder="0" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold bg-white" />
          </div>
        </div>

        <div class="flex justify-between items-center px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-bold">
          <span class="text-emerald-800">Kembalian / Status:</span>
          <span id="kembalianText" class="text-emerald-700 text-sm">${formatRupiah(getKembalian())}</span>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">Catatan / Keterangan</label>
          <textarea id="m-ket" rows="1" placeholder="Catatan transaksi..." class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white">${m.keterangan || ""}</textarea>
        </div>
      </form>`;

    root.querySelector("#m-tanggal").onchange = (e) => setMeta({ tanggal: e.target.value, tanggalManual: true });
    root.querySelector("#m-sumber").onchange = (e) => setMeta({ ketSumber: e.target.value });
    root.querySelector("#m-diterima").oninput = (e) => { setMeta({ uangDiterima: e.target.value }); updateKembalian(); };
    root.querySelector("#m-wa").oninput = (e) => setMeta({ whatsapp: e.target.value });
    root.querySelector("#m-ket").oninput = (e) => setMeta({ keterangan: e.target.value });
    root.querySelectorAll(".pay-btn").forEach((b) =>
      (b.onclick = () => { setMeta({ metodeBayar: b.getAttribute("data-bayar") }); updatePayButtons(); })
    );
  }

  function updateKembalian() {
    const el = root.querySelector("#kembalianText");
    if (el) el.textContent = formatRupiah(getKembalian());
  }
  function updatePayButtons() {
    const m = getState().meta;
    root.querySelectorAll(".pay-btn").forEach((b) => {
      b.className = `pay-btn py-1.5 px-2 text-xs font-semibold rounded-lg border ${m.metodeBayar === b.getAttribute("data-bayar") ? "active-pay" : "border-slate-300 bg-white text-slate-700 hover:border-sky-500"} flex items-center justify-center gap-1`;
    });
  }

  // Patch only what changed; never rebuild while a field is focused.
  function render() {
    const m = getState().meta;
    const active = document.activeElement;
    const patch = (sel, val) => {
      const el = root.querySelector(sel);
      if (el && el !== active) el.value = val ?? "";
    };
    patch("#m-tanggal", m.tanggal);
    patch("#m-sumber", m.ketSumber);
    patch("#m-wa", m.whatsapp);
    patch("#m-diterima", m.uangDiterima);
    patch("#m-ket", m.keterangan);
    updateKembalian();
    updatePayButtons();
  }

  build();

  // Live clock: keep the date field real-time (per lo's request) so the
  // value sent to the spreadsheet reflects the actual current time.
  // Stops updating once the user manually edits the field.
  function fmtLocal(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }
  let clockTimer = null;
  function startClock() {
    if (clockTimer) return;
    clockTimer = setInterval(() => {
      const m = getState().meta;
      if (m.tanggalManual) return; // user overrode it — leave alone
      const el = root.querySelector("#m-tanggal");
      if (el && el !== document.activeElement) el.value = fmtLocal(new Date());
    }, 1000);
  }
  startClock();

  root._render = render;
  return root;
}
