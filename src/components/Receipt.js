import { getState, formatRupiah, formatNumber } from "../utils/index.js";
import { h } from "../utils/dom.js";

export function ReceiptModal() {
  const root = h(`<div id="receipt-overlay" class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"></div>`);

  function totalOf(items) { return items.reduce((s, c) => s + (c.hargaJual || 0), 0); }
  function kembalianOf(items, meta) { return (Number(meta.uangDiterima) || 0) - totalOf(items); }

  function buildText(items, meta) {
    const total = totalOf(items);
    const kembali = kembalianOf(items, meta);
    const lines = [];
    lines.push("KASIR PENJUALAN PARFUM");
    lines.push("Nota Belanja Resmi");
    lines.push("Waktu: " + meta.tanggal);
    lines.push("Sumber: " + meta.ketSumber + " | Metode: " + meta.metodeBayar);
    if (meta.whatsapp) lines.push("WA: " + meta.whatsapp);
    lines.push("------------------------------");
    items.forEach((c) => {
      lines.push(`${c.brand} ${c.varian}`);
      lines.push(`${c.tipeProduk} ${formatNumber(c.volume)}ml x${c.qty} @${formatRupiah(c.hargaSatuan)}`);
      lines.push(`  = ${formatRupiah(c.hargaJual)}`);
    });
    lines.push("------------------------------");
    lines.push("TOTAL JUAL: " + formatRupiah(total));
    if (meta.metodeBayar === "Cash") {
      lines.push("Diterima: " + formatRupiah(meta.uangDiterima || 0));
      lines.push("Kembalian: " + formatRupiah(kembali));
    }
    if (meta.keterangan) lines.push("Note: " + meta.keterangan);
    lines.push("------------------------------");
    lines.push("Terima Kasih Telah Berbelanja!");
    return lines.join("\n");
  }

  function render() {
    const r = getState().receipt;
    if (!r || !r.items || !r.items.length) { root.classList.add("hidden"); return; }
    const { items, meta } = r;
    const total = totalOf(items);
    const kembali = kembalianOf(items, meta);
    const text = buildText(items, meta);

    const waNumber = (meta.whatsapp || "").replace(/[^0-9]/g, "");
    const waLink = waNumber
      ? `https://wa.me/62${waNumber.startsWith("0") ? waNumber.slice(1) : waNumber}?text=${encodeURIComponent(text)}`
      : null;

    root.classList.remove("hidden");
    root.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <span class="text-xs font-bold text-slate-500 uppercase">Struk Transaksi Penjualan</span>
          <button id="btn-close-receipt" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div id="printable-receipt" class="font-mono text-xs text-slate-800 space-y-2 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          <div class="text-center pb-2 border-b border-slate-300">
            <p class="font-bold text-sm">KASIR PENJUALAN PARFUM</p>
            <p class="text-[10px] text-slate-500">Nota Belanja Resmi</p>
          </div>
          <div class="text-[10px] space-y-0.5">
            <p>Waktu: <span class="font-bold">${meta.tanggal}</span></p>
            <p>Sumber: ${meta.ketSumber} | Metode: <span class="font-bold text-slate-800">${meta.metodeBayar}</span></p>
            ${meta.whatsapp ? `<p>WA: ${meta.whatsapp}</p>` : ""}
          </div>
          <div class="border-t border-b border-slate-300 py-2 space-y-1 my-2">
            <span class="font-bold text-[10px] block text-slate-600">RINCIAN PEMBELIAN:</span>
            ${items.map((c) => `
              <div class="text-[11px]">
                <div>${c.brand} ${c.varian}</div>
                <div class="flex justify-between"><span>${c.tipeProduk} ${formatNumber(c.volume)}ml x${c.qty}</span><span>${formatRupiah(c.hargaJual)}</span></div>
              </div>`).join("")}
          </div>
          <div class="pt-1 flex justify-between font-bold text-sm border-t border-slate-300">
            <span>TOTAL JUAL:</span><span>${formatRupiah(total)}</span>
          </div>
          ${meta.metodeBayar === "Cash" ? `<div class="text-[10px] space-y-0.5 text-slate-600 pt-1"><div class="flex justify-between"><span>Diterima:</span><span>${formatRupiah(meta.uangDiterima || 0)}</span></div><div class="flex justify-between font-semibold"><span>Kembalian:</span><span>${formatRupiah(kembali)}</span></div></div>` : ""}
          ${meta.keterangan ? `<div class="text-[10px] text-slate-600 pt-1">Note: ${meta.keterangan}</div>` : ""}
          <div class="text-[10px] text-center text-slate-500 pt-2 border-t border-slate-200"><p>Terima Kasih Telah Berbelanja!</p></div>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-2">
          <button id="btn-print" class="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1"><i class="fa-solid fa-print"></i> Cetak Struk</button>
          ${waLink ? `<a href="${waLink}" target="_blank" rel="noopener" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 text-center"><i class="fa-solid fa-paper-plane"></i> Kirim WA</a>` : `<span class="w-full py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold flex items-center justify-center">Isi no. WA</span>`}
        </div>
      </div>`;

    root.querySelector("#btn-print").onclick = () => window.print();
    root.querySelector("#btn-close-receipt").onclick = close;
    root.onclick = (e) => { if (e.target === root) close(); };
  }

  function close() { getState().receipt = null; root.classList.add("hidden"); }
  root._render = render;
  root._close = close;
  return root;
}
