// Currency helpers (Indonesian Rupiah)

export function formatRupiah(num) {
  const n = Number(num) || 0;
  return "Rp " + n.toLocaleString("id-ID");
}

export function parseRupiah(str) {
  const cleaned = String(str ?? "").replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
}

export function formatNumber(num) {
  return (Number(num) || 0).toLocaleString("id-ID");
}
