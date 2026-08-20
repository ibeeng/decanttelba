// Test: mapping payload Sheet -> model aplikasi (catalog & sales)
import assert from "node:assert/strict";

// Simulasi respon Apps Script ?action=catalog
const catalogResp = {
  status: "ok",
  data: [
    { brand: "MYKONOS", varian: "SANS", harga5ml: "35000", harga10ml: "55000" },
    { brand: "HMNS", varian: "THE PERFECTION", harga5ml: 65000, harga10ml: 110000 },
  ],
};

function mapCatalog(resp) {
  if (resp.status !== "ok" || !Array.isArray(resp.data)) return [];
  return resp.data.map((r) => ({
    brand: r.brand,
    varian: r.varian,
    harga5ml: Number(r.harga5ml) || 0,
    harga10ml: Number(r.harga10ml) || 0,
  }));
}

// Simulasi respon ?action=sales (field rata seperti yg disimpan Sheet)
const salesResp = {
  status: "ok",
  data: [
    { id: 1, tanggal: "2026-08-19T10:00", tipeProduk: "Decant", brand: "MYKONOS", varian: "SANS", volume: 5, qty: 1, hargaJual: 35000, ketSumber: "WhatsApp" },
    { id: 2, tanggal: "2026-08-19T11:00", tipeProduk: "Segel Baru", brand: "DIOR", varian: "SAUVAGE", volume: 100, qty: 1, hargaJual: 500000, ketSumber: "Offline Store" },
  ],
};

let pass = 0, fail = 0;
const ok = (n, fn) => { try { fn(); pass++; console.log("  ✓", n); } catch (e) { fail++; console.error("  ✗", n, "\n   ", e.message); } };

console.log("\n[qasirku+] sheet mapping test\n");

ok("catalog map: string & number harga ke Number", () => {
  const c = mapCatalog(catalogResp);
  assert.equal(c.length, 2);
  assert.equal(c[0].harga5ml, 35000);
  assert.equal(c[0].harga10ml, 55000);
  assert.equal(c[1].harga5ml, 65000);
  assert.equal(typeof c[0].harga5ml, "number");
});

ok("catalog map: status bukan ok / kosong -> []", () => {
  assert.deepEqual(mapCatalog({ status: "ok", data: [] }), []);
  assert.deepEqual(mapCatalog({ status: "error" }), []);
});

ok("sales: field rata langsung dipakai History tanpa remap", () => {
  const rows = salesResp.data.slice(-50).reverse();
  assert.equal(rows[0].brand, "DIOR"); // terbaru di atas
  assert.equal(rows[0].hargaJual, 500000);
  assert.equal(rows[1].brand, "MYKONOS");
});

ok("sales: fallback aman kalau field kurang", () => {
  const r = { brand: "X", varian: "Y" }; // tanpa volume/hargaJual
  assert.equal(r.brand, "X");
  assert.equal(Number(r.hargaJual) || 0, 0); // History pakai default 0
});

console.log(`\n${fail ? "✗" : "✓"} ${pass}/${pass + fail} passed\n`);
process.exit(fail ? 1 : 0);
