import { getHistory, clearHistory } from "../utils/storage.js";
import { toCsv } from "../utils/sync.js";
import { formatRupiah, formatNumber } from "../utils/currency.js";
import { escapeHtml, h } from "../utils/dom.js";
import { getState } from "../utils/store.js";

let searchTerm = "";

export function HistoryTable() {
  const root = h(`<div id="history-root"></div>`);

  // Prefer live Sheet data (state.salesCache); fallback to localStorage.
  function getRows() {
    const cache = getState().salesCache;
    if (cache && cache.length) return cache;
    return getHistory();
  }

  function render() {
    // Cek fokus SEBELUM innerHTML di-rebuild (rebuild menghapus node lama
    // -> activeElement jadi body). Ini yang bikin search cuma bisa ketik 1x.
    const searchWasFocused =
      document.activeElement && document.activeElement.id === "searchInput";
    let rows = getRows();
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((r) =>
        `${r.brand} ${r.varian} ${r.whatsapp} ${r.ketSumber}`.toLowerCase().includes(q)
      );
    }
    const totalRows = getRows().length;
    if (!totalRows) {
      root.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div><h2 class="text-base font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-list-check text-sky-600"></i> Riwayat Input Penjualan</h2><p class="text-xs text-slate-500">Data tersimpan lokal & ter-sync ke Google Sheets</p></div>
        </div>
        <div class="py-12 text-center text-slate-400"><i class="fa-regular fa-folder-open text-4xl mb-2"></i><p class="text-xs font-medium">Belum ada data penjualan tercatat.</p></div>`;
      return;
    }
    const last = rows.slice(-50).reverse();
    const isLive = !!getState().salesCache && getState().salesCache.length;
    root.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-list-check text-sky-600"></i> Riwayat Input Penjualan</h2>
          <p class="text-xs text-slate-500">${isLive ? "Live dari Google Sheets" : "Data tersimpan lokal & ter-sync ke Google Sheets"}</p>
        </div>
        <div class="flex items-center space-x-2">
          <div class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
            <input type="text" id="searchInput" value="${escapeHtml(searchTerm)}" placeholder="Cari brand/varian/WA..." class="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white" />
          </div>
          <button id="exp-csv" class="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-xs" title="Export CSV"><i class="fa-solid fa-file-excel text-emerald-600"></i></button>
        </div>
      </div>
      <div class="mt-4 flex-1 overflow-x-auto min-h-[320px] max-h-[520px]">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 sticky top-0 z-10">
            <tr class="text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200">
              <th class="py-2.5 px-3">Tanggal</th>
              <th class="py-2.5 px-3">Item Produk</th>
              <th class="py-2.5 px-3 text-right">Total Transaksi</th>
              <th class="py-2.5 px-3">Sumber</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-slate-100">
            ${last.map((r) => `
              <tr class="hover:bg-slate-50">
                <td class="py-2.5 px-3 whitespace-nowrap">${(r.tanggal || "").slice(0, 16)}</td>
                <td class="py-2.5 px-3">${escapeHtml(r.brand || "")} ${escapeHtml(r.varian || "")}<br/><span class="text-slate-500">${formatNumber(r.volume || 0)}ml x${r.qty || 1}</span></td>
                <td class="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-sky-700">${formatRupiah(Number(r.hargaJual) || 0)}</td>
                <td class="py-2.5 px-3">${escapeHtml(r.ketSumber || "")}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span id="recordCountText">Menampilkan ${last.length} data</span>
        <span class="text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-600">${isLive ? "Live Sheet" : "Auto-save Ready"}</span>
      </div>`;

    const si = root.querySelector("#searchInput");
    if (si) {
      si.oninput = (e) => {
        searchTerm = e.target.value;
        render();
      };
      // Rebuild lewat innerHTML bikin node input lama kehapus -> focus hilang.
      // Balikin focus + caret ke ujung biar ngetik lancar tanpa klik ulang.
      if (searchWasFocused) {
        si.focus();
        const len = si.value.length;
        try { si.setSelectionRange(len, len); } catch (_) {}
      }
    }
    root.querySelector("#exp-csv").onclick = () => {
      const blob = new Blob([toCsv(getRows())], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "kasir-parfum-history.csv";
      a.click();
    };
  }

  root._render = render;
  return root;
}
