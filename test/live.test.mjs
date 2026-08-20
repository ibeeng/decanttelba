// Integration test: loadCatalog/loadSales fetch flow dengan mock fetch + localStorage
import assert from "node:assert/strict";

// --- stubs ---
const _store = {};
global.localStorage = {
  getItem: (k) => (k in _store ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
};

const FAKE_URL = "https://script.google.com/macros/s/TEST/exec";
global.localStorage.setItem("qasir_appscript_url", FAKE_URL);

const catalogJson = { status: "ok", data: [
  { brand: "MYKONOS", varian: "SANS", harga5ml: "35", harga10ml: "55" },
] };
const salesJson = { status: "ok", data: [
  { id: 1, tanggal: "2026-08-19T10:00", tipeProduk: "Decant", brand: "MYKONOS", varian: "SANS", volume: 5, qty: 1, hargaJual: 35000, ketSumber: "WhatsApp" },
] };

global.fetch = async (url) => {
  if (url.includes("action=catalog")) return { ok: true, json: async () => catalogJson };
  if (url.includes("action=sales")) return { ok: true, json: async () => salesJson };
  return { ok: false, status: 404, json: async () => ({}) };
};

// Import setelah stub siap
const { loadCatalog, loadSales, getState, getBrands, priceFor } = await import("../src/utils/store.js");

let pass = 0, fail = 0;
const ok = async (n, fn) => { try { await fn(); pass++; console.log("  ✓", n); } catch (e) { fail++; console.error("  ✗", n, "\n   ", e.message); } };

console.log("\n[qasirku+] live-sheet integration (mock)\n");

await ok("loadCatalog: fetch & replace state.catalog", async () => {
  const r = await loadCatalog();
  assert.equal(r.ok, true);
  assert.equal(getState().catalog.length, 1);
  assert.equal(getState().catalog[0].brand, "MYKONOS");
});

await ok("getBrands reflects Sheet data", async () => {
  const b = getBrands();
  assert.ok(b.includes("MYKONOS"));
});

await ok("priceFor reads from Sheet-loaded catalog", async () => {
  assert.equal(priceFor("MYKONOS", "SANS", 5), 35000);
  assert.equal(priceFor("MYKONOS", "SANS", 10), 55000);
});

await ok("loadSales: fetch & set salesCache", async () => {
  const r = await loadSales();
  assert.equal(r.ok, true);
  assert.equal(getState().salesCache.length, 1);
  assert.equal(getState().salesCache[0].brand, "MYKONOS");
});

console.log(`\n${fail ? "✗" : "✓"} ${pass}/${pass + fail} passed\n`);
process.exit(fail ? 1 : 0);
