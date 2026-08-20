// Node test harness for qasirku+ core logic (no browser needed)
import assert from "node:assert/strict";
import {
  getState, addToCart, getTotal, getKembalian,
  setMeta, priceFor, findItem, getBrands, getVariants,
} from "../src/utils/store.js";
import { toCsv } from "../src/utils/sync.js";
import { formatRupiah } from "../src/utils/currency.js";

let pass = 0, fail = 0;
function ok(name, fn) {
  try { fn(); pass++; console.log("  ✓", name); }
  catch (e) { fail++; console.error("  ✗", name, "\n   ", e.message); }
}

console.log("\n[qasirku+] core logic tests\n");

ok("catalog loads 14 entries", () => {
  assert.equal(getState().catalog.length, 14);
});

ok("brands sorted + includes MYKONOS", () => {
  const b = getBrands();
  assert.ok(b.includes("MYKONOS"));
  assert.deepEqual(b, [...b].sort());
});

ok("variants filtered by brand", () => {
  const v = getVariants("MYKONOS");
  assert.deepEqual(v, ["SANS", "UTHOPIA"]);
});

ok("priceFor: 5ml -> 35000, 10ml -> 55000 (MYKONOS SANS)", () => {
  assert.equal(priceFor("MYKONOS", "SANS", 5), 35000);
  assert.equal(priceFor("MYKONOS", "SANS", 10), 55000);
});

ok("priceFor returns null for custom volume", () => {
  assert.equal(priceFor("MYKONOS", "SANS", 7), null);
});

ok("findItem unknown -> undefined", () => {
  assert.equal(findItem("XX", "YY"), undefined);
});

ok("addToCart + getTotal realtime", () => {
  getState().cart.length = 0;
  addToCart({ id:"a", tipeProduk:"Decant", brand:"MYKONOS", varian:"SANS", volume:5, qty:2, hargaSatuan:35000, hargaJual:70000 });
  addToCart({ id:"b", tipeProduk:"Segel Baru", brand:"DIOR", varian:"SAUVAGE", volume:100, qty:1, hargaSatuan:500000, hargaJual:500000 });
  assert.equal(getTotal(), 570000);
});

ok("kembalian: cash 600k - 570k = 30k", () => {
  setMeta({ metodeBayar:"Cash", uangDiterima:600000 });
  assert.equal(getKembalian(), 30000);
});

ok("kembalian negatif kalau kurang bayar", () => {
  setMeta({ uangDiterima: 100000 });
  assert.equal(getKembalian(), -470000);
});

ok("formatRupiah", () => {
  assert.equal(formatRupiah(35000), "Rp 35.000");
  assert.equal(formatRupiah(570000), "Rp 570.000");
});

ok("toCsv: header + 2 rows escaped", () => {
  const rows = [
    { id:1, tanggal:"2026-08-19 10:00", tipeProduk:"Decant", brand:"MY,KONOS", varian:'SA"NS', volume:5, qty:2, hargaSatuan:35000, hargaJual:70000, metodeBayar:"Cash", ketSumber:"WhatsApp", keterangan:'bubble "wrap"', whatsapp:"0812" },
  ];
  const csv = toCsv(rows);
  const lines = csv.split("\n");
  assert.equal(lines.length, 2);
  assert.ok(lines[0].startsWith("id,tanggal,"));
  assert.ok(lines[1].includes('"MY,KONOS"'));
  assert.ok(lines[1].includes('"SA""NS"'));
  assert.ok(lines[1].includes('"bubble ""wrap"""'));
});

console.log(`\nResult: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
