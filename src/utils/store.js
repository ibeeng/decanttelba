// Single source of truth for the POS app (vanilla reactive store)
import catalogData from "../data/catalog.json" with { type: "json" };
import { getAppScriptUrl } from "./storage.js";

const listeners = new Set();

function toLocalDatetime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const state = {
  catalog: catalogData,
  cart: [],
  meta: {
    tanggal: toLocalDatetime(new Date()),
    ketSumber: "Offline Store",
    metodeBayar: "Cash",
    uangDiterima: 0,
    whatsapp: "",
    keterangan: "",
  },
  receipt: null,
  settingsOpen: false,
  toast: null,
};

export function getState() {
  return state;
}
// expose for debugging/testing in browser console
if (typeof window !== "undefined") window.__s = state;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

export function setState(patch) {
  Object.assign(state, patch);
  emit();
}

// ---- Cart ops ----
export function addToCart(item) {
  state.cart.push(item);
  emit();
}
export function removeFromCart(id) {
  state.cart = state.cart.filter((c) => c.id !== id);
  emit();
}
export function updateQty(id, qty) {
  const it = state.cart.find((c) => c.id === id);
  if (!it) return;
  it.qty = Math.max(1, qty || 1);
  it.hargaJual = it.hargaSatuan * it.qty;
  emit();
}
export function clearCart() {
  state.cart = [];
  emit();
}
export function setMeta(patch) {
  Object.assign(state.meta, patch);
  emit();
}
export function setReceipt(r) {
  state.receipt = r;
  emit();
}
export function setSettingsOpen(v) {
  state.settingsOpen = v;
  emit();
}
export function setToast(msg) {
  state.toast = msg;
  emit();
  if (msg) {
    setTimeout(() => {
      if (state.toast === msg) setToast(null);
    }, 3200);
  }
}

// ---- Derived ----
export function getTotal() {
  return state.cart.reduce((s, c) => s + (c.hargaJual || 0), 0);
}
export function getKembalian() {
  const total = getTotal();
  const diterima = Number(state.meta.uangDiterima) || 0;
  return diterima - total;
}

// ---- Catalog helpers ----
export function getBrands() {
  return [...new Set(state.catalog.map((c) => c.brand))].sort();
}
export function getVariants(brand) {
  return state.catalog
    .filter((c) => c.brand === brand)
    .map((c) => c.varian)
    .sort();
}
export function findItem(brand, varian) {
  const b = (brand || "").toString().trim().toLowerCase();
  const v = (varian || "").toString().trim().toLowerCase();
  return state.catalog.find(
    (c) => c.brand.toLowerCase() === b && c.varian.toLowerCase() === v
  );
}
export function priceFor(brand, varian, volume) {
  const it = findItem(brand, varian);
  if (!it) return null;
  if (volume === 5) return it.harga5ml;
  if (volume === 10) return it.harga10ml;
  return null;
}

// ---- Live data from Sheet (PRD: data real dari sheet) ----
// Returns the Apps Script Web App URL (default sheet dipakai kalau belum diset).
function getScriptUrl() {
  try {
    return getAppScriptUrl() || null;
  } catch {
    return null;
  }
}

// Fetch katalog dari Sheet (tab "Katalog": brand, varian, harga5ml, harga10ml).
// Fallback ke catalog.json bawaan kalau offline / belum diset URL.
export async function loadCatalog() {
  const url = getScriptUrl();
  if (!url) return { ok: false, offline: true };
  try {
    const res = await fetch(`${url}?action=catalog`, { mode: "cors" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (json.status === "ok" && Array.isArray(json.data) && json.data.length) {
      const mapped = json.data.map((r) => ({
        brand: r.brand,
        varian: r.varian,
        // Sheet menyimpan harga dalam ribuan (35 = Rp 35.000)
        harga5ml: Number(r.harga5ml) * 1000 || 0,
        harga10ml: Number(r.harga10ml) * 1000 || 0,
      }));
      state.catalog = mapped;
      emit();
      return { ok: true, count: mapped.length };
    }
    return { ok: false, empty: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Fetch riwayat penjualan dari Sheet (tab "Penjualan") untuk panel kanan.
export async function loadSales(limit = 100) {
  const url = getScriptUrl();
  if (!url) return { ok: false, offline: true };
  try {
    const res = await fetch(`${url}?action=sales&limit=${limit}`, { mode: "cors" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (json.status === "ok" && Array.isArray(json.data)) {
      state.salesCache = json.data.reverse(); // terbaru di atas
      emit();
      return { ok: true, count: json.data.length };
    }
    return { ok: false, empty: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export const TIPE_COLORS = {
  Decant: "bg-blue-600",
  "Segel Baru": "bg-green-600",
  Preloved: "bg-amber-500",
};
