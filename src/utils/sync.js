// Sync helper: POST rows to Apps Script endpoint, always keep local backup
import { getAppScriptUrl, addHistory } from "./storage.js";
import { getState, getTotal } from "./store.js";

function buildRows(items) {
  const meta = getState().meta;
  const baseId = Date.now();
  // Real-time stamp at save time (per user request), in LOCAL time (WIB) so the
  // spreadsheet shows a human-readable timestamp instead of UTC "Z" notation.
  // If the user manually edited the date field, respect that value instead.
  const tanggal = !meta.tanggalManual ? localStamp(new Date()) : meta.tanggal;
  return items.map((it, i) => ({
    id: `${baseId}${i}`,
    tanggal,
    tipeProduk: it.tipeProduk,
    brand: it.brand,
    varian: it.varian,
    volume: it.volume,
    qty: it.qty,
    hargaSatuan: it.hargaSatuan,
    hargaJual: it.hargaJual,
    metodeBayar: meta.metodeBayar,
    ketSumber: meta.ketSumber,
    keterangan: meta.keterangan,
    whatsapp: meta.whatsapp,
  }));
}

// Local-time stamp formatted as "YYYY-MM-DD HH:MM:SS" (WIB for the user's TZ).
function localStamp(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export async function syncTransaction(items) {
  const rows = buildRows(items);
  // Always persist locally (offline fallback / emergency mode)
  addHistory(rows);

  const url = getAppScriptUrl();
  if (!url) {
    return { ok: true, offline: true, rows };
  }
  try {
    // Apps Script Web App mengembalikan 302 redirect ke googleusercontent
    // yang TIDAK punya CORS header -> fetch mode:"cors" selalu ditolak.
    // Pakai mode:"no-cors": request tetap terkirim & data tersimpan di Sheet
    // (terbukti via curl), browser cuma tidak bisa membaca response-nya.
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ rows }),
      mode: "no-cors",
    });
    // no-cors -> opaque response, tidak bisa dibaca; anggap sukses kalau tidak throw
    return { ok: true, offline: false, rows };
  } catch (e) {
    return { ok: false, offline: false, error: e.message, rows };
  }
}

export function toCsv(rows) {
  const headers = [
    "id",
    "tanggal",
    "tipeProduk",
    "brand",
    "varian",
    "volume",
    "qty",
    "hargaSatuan",
    "hargaJual",
    "metodeBayar",
    "ketSumber",
    "keterangan",
    "whatsapp",
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((k) => esc(r[k])).join(","));
  return lines.join("\n");
}
