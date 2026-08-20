// Test sync path (PRD 3.5): offline fallback + webhook POST
import assert from "node:assert/strict";

// --- minimal stubs for browser globals ---
const _ls = {};
global.localStorage = {
  getItem: (k) => (k in _ls ? _ls[k] : null),
  setItem: (k, v) => { _ls[k] = String(v); },
  removeItem: (k) => { delete _ls[k]; },
};

let fetchCalls = [];
global.fetch = async (url, opts) => {
  fetchCalls.push({ url, opts });
  return { ok: true, status: 200, text: async () => JSON.stringify({ status: "success" }) };
};

const { syncTransaction } = await import("../src/utils/sync.js");
const { setAppScriptUrl, getHistory } = await import("../src/utils/storage.js");
const { getState } = await import("../src/utils/store.js");

let pass = 0, fail = 0;
async function ok(n, fn) { try { await fn(); pass++; console.log("  ✓", n); } catch (e) { fail++; console.error("  ✗", n, "\n   ", e.message); } }

console.log("\n[qasirku+] sync/integration tests\n");

const items = [
  { tipeProduk:"Decant", brand:"MYKONOS", varian:"SANS", volume:5, qty:2, hargaSatuan:35000, hargaJual:70000 },
  { tipeProduk:"Segel Baru", brand:"DIOR", varian:"SAUVAGE", volume:100, qty:1, hargaSatuan:500000, hargaJual:500000 },
];

await ok("OFFLINE: no URL -> stores to localStorage, returns offline flag", async () => {
  setAppScriptUrl("");
  _ls["qasir_history"] = JSON.stringify([]);
  fetchCalls.length = 0;
  const r = await syncTransaction(items);
  assert.equal(r.ok, true);
  assert.equal(r.offline, true);
  assert.equal(fetchCalls.length, 0, "should NOT call fetch when offline");
  const hist = JSON.parse(_ls["qasir_history"]);
  assert.equal(hist.length, 2);
  assert.equal(hist[0].brand, "MYKONOS");
  assert.equal(hist[0].metodeBayar, getState().meta.metodeBayar); // meta propagated to row
});

await ok("ONLINE: URL set -> POST to Apps Script with rows", async () => {
  setAppScriptUrl("https://script.google.com/macros/s/ABC/exec");
  _ls["qasir_history"] = JSON.stringify([]);
  fetchCalls.length = 0;
  const r = await syncTransaction(items);
  assert.equal(r.ok, true);
  assert.equal(r.offline, false);
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "https://script.google.com/macros/s/ABC/exec");
  const body = JSON.parse(fetchCalls[0].opts.body);
  assert.equal(body.rows.length, 2);
  assert.equal(body.rows[1].brand, "DIOR");
});

await ok("ONLINE failure -> returns ok:false but still saved locally", async () => {
  setAppScriptUrl("https://script.google.com/macros/s/ERR/exec");
  _ls["qasir_history"] = JSON.stringify([]);
  fetchCalls.length = 0;
  global.fetch = async () => { throw new Error("network down"); };
  const r = await syncTransaction(items);
  assert.equal(r.ok, false);
  assert.match(r.error, /network down/);
  const hist = JSON.parse(_ls["qasir_history"]);
  assert.equal(hist.length, 2, "local backup must persist even on failure");
  // restore fetch
  global.fetch = async (url, opts) => ({ ok:true, status:200, text: async()=>"ok" });
});

console.log(`\nResult: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
