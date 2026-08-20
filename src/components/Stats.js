import { getState, getTotal } from "../utils/store.js";
import { formatRupiah } from "../utils/currency.js";
import { h } from "../utils/dom.js";

export function StatsWidget() {
  const root = h(`<div id="stats-root" class="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4"></div>`);

  function render() {
    const { cart, historyCache } = getState();
    const total = getTotal();
    const items = cart.reduce((s, c) => s + c.qty, 0);
    // top source from local history (if any) else current cart source
    const srcCount = {};
    (historyCache || []).forEach((r) => {
      srcCount[r.ketSumber] = (srcCount[r.ketSumber] || 0) + 1;
    });
    if (!historyCache || !historyCache.length) {
      srcCount[getState().meta.ketSumber] = 1;
    }
    const topSrc = Object.entries(srcCount).sort((a, b) => b[1] - a[1])[0];
    const cards = [
      {
        label: "Total Keranjang",
        value: formatRupiah(total),
        icon: "fa-wallet",
        iconBg: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Jumlah Item Line",
        value: `${cart.length} Item`,
        icon: "fa-receipt",
        iconBg: "bg-sky-50 text-sky-600",
      },
      {
        label: "Sumber Aktif",
        value: topSrc ? topSrc[0] : "-",
        icon: "fa-chart-pie",
        iconBg: "bg-indigo-50 text-indigo-600",
        kind: "status",
      },
      {
        label: "Status Sync",
        value: "Aktif & Ready",
        valueCls: "text-emerald-600",
        icon: "fa-cloud-arrow-up",
        iconBg: "bg-amber-50 text-amber-600",
        kind: "status",
      },
    ];
    const metrics = cards.filter((c) => c.kind !== "status");
    const statusCards = cards.filter((c) => c.kind === "status");

    // Desktop: full 4 cards (2 metric + 2 status).
    // Mobile: 2 metric cards (2-col) + a single slim status bar (status cards merged).
    const metricHtml = metrics
      .map(
        (c) => `
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[11px] font-medium text-slate-500 truncate">${c.label}</p>
            <p class="text-base font-bold text-slate-900 mt-0.5 truncate">${c.value}</p>
          </div>
          <div class="w-8 h-8 shrink-0 rounded-lg ${c.iconBg} flex items-center justify-center">
            <i class="fa-solid ${c.icon} text-sm"></i>
          </div>
        </div>`
      )
      .join("");

    const statusBarHtml = `
      <div class="md:hidden col-span-2 mt-0.5 flex items-center gap-3 rounded-xl bg-slate-900 text-slate-100 px-3 py-2 text-xs">
        ${statusCards
          .map(
            (c) => `
          <div class="flex items-center gap-1.5 min-w-0">
            <i class="fa-solid ${c.icon} ${c.iconBg.split(" ").find((x) => x.startsWith("text-")).replace("600", "300")} text-[13px]"></i>
            <span class="text-slate-300">${c.label}:</span>
            <span class="font-semibold truncate ${c.valueCls || "text-slate-100"}">${c.value}</span>
          </div>`
          )
          .join('<span class="w-px h-3 bg-slate-700"></span>')}
      </div>`;

    const desktopStatusHtml = statusCards
      .map(
        (c) => `
        <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[11px] font-medium text-slate-500 truncate">${c.label}</p>
            <p class="text-base font-bold text-slate-900 mt-0.5 truncate ${c.valueCls || ""}">${c.value}</p>
          </div>
          <div class="w-8 h-8 shrink-0 rounded-lg ${c.iconBg} flex items-center justify-center">
            <i class="fa-solid ${c.icon} text-sm"></i>
          </div>
        </div>`
      )
      .join("");

    root.innerHTML = `
      ${metricHtml}
      ${statusBarHtml}
      <div class="hidden md:contents">${desktopStatusHtml}</div>
    `;
  }

  root._render = render;
  return root;
}
