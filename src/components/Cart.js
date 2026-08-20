import {
  getState, getTotal, TIPE_COLORS, removeFromCart, updateQty,
  formatRupiah, formatNumber, escapeHtml,
} from "../utils/index.js";
import { h } from "../utils/dom.js";

const BADGE = {
  Decant: "bg-sky-100 text-sky-700",
  "Segel Baru": "bg-emerald-100 text-emerald-700",
  Preloved: "bg-amber-100 text-amber-700",
};

export function CartList() {
  const root = h(`<div id="cart-root"></div>`);

  function render() {
    const { cart } = getState();
    const total = getTotal();
    if (!cart.length) {
      root.innerHTML = `
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <div class="flex items-center gap-2"><i class="fa-solid fa-basket-shopping text-sky-600 text-xs"></i><span class="text-xs font-bold text-slate-700">Keranjang Belanja</span><span class="bg-sky-100 text-sky-700 font-bold text-[10px] px-2 py-0.5 rounded-full">0</span></div>
            <span class="text-xs font-bold text-sky-600">Rp 0</span>
          </div>
          <div class="text-center py-3 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs mt-2">
            <i class="fa-solid fa-cart-arrow-down text-lg mb-1 block text-slate-300"></i><span>Keranjang masih kosong</span>
          </div>
        </div>`;
      return;
    }
    root.innerHTML = `
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
          <div class="flex items-center gap-2"><i class="fa-solid fa-basket-shopping text-sky-600 text-xs"></i><span class="text-xs font-bold text-slate-700">Keranjang Belanja</span><span class="bg-sky-100 text-sky-700 font-bold text-[10px] px-2 py-0.5 rounded-full">${cart.length}</span></div>
          <span class="text-xs font-bold text-sky-600" id="cartTotalHeader">${formatRupiah(total)}</span>
        </div>
        <div id="cartItemsList" class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          ${cart.map((c) => `
            <div class="rounded-lg border border-slate-200 bg-white p-2.5" data-id="${c.id}">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <span class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${BADGE[c.tipeProduk] || "bg-slate-100 text-slate-700"}">${escapeHtml(c.tipeProduk)}</span>
                  <div class="font-semibold text-slate-900 truncate text-sm">${escapeHtml(c.brand)}</div>
                  <div class="text-xs text-slate-500 truncate">${escapeHtml(c.varian)} · ${formatNumber(c.volume)} ml</div>
                </div>
                <button class="cart-del text-slate-400 hover:text-rose-500 text-lg leading-none px-1" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
              </div>
              <div class="mt-2 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1">
                  <button class="qty-dec w-6 h-6 rounded bg-slate-100 text-slate-700 text-base leading-none">−</button>
                  <input type="number" min="1" value="${c.qty}" class="qty-input w-10 text-center rounded bg-white border border-slate-300 text-slate-900 py-0.5 text-xs" />
                  <button class="qty-inc w-6 h-6 rounded bg-slate-100 text-slate-700 text-base leading-none">+</button>
                </div>
                <div class="text-right">
                  <div class="text-[10px] text-slate-500">${formatRupiah(c.hargaSatuan)}/pcs</div>
                  <div class="font-bold text-sky-700">${formatRupiah(c.hargaJual)}</div>
                </div>
              </div>
            </div>`).join("")}
        </div>
      </div>`;

    root.querySelectorAll("[data-id]").forEach((el) => {
      const id = el.getAttribute("data-id");
      el.querySelector(".cart-del").onclick = () => removeFromCart(id);
      el.querySelector(".qty-dec").onclick = () => { const it = getState().cart.find((c) => c.id === id); if (it) updateQty(id, it.qty - 1); };
      el.querySelector(".qty-inc").onclick = () => { const it = getState().cart.find((c) => c.id === id); if (it) updateQty(id, it.qty + 1); };
      el.querySelector(".qty-input").oninput = (e) => { const v = parseInt(e.target.value, 10); updateQty(id, v); };
    });
  }

  root._render = render;
  return root;
}
