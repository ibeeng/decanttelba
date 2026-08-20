// localStorage helpers for offline fallback, settings, and history

const KEYS = {
  URL: "qasir_appscript_url",
  HISTORY: "qasir_history",
  SETTINGS: "qasir_settings",
};

export function getAppScriptUrl() {
  // Fallback default ke Sheet lo agar app langsung terhubung tanpa set manual.
  // (Bisa di-override lewat Settings / ?sheet= di localStorage.)
  const saved = localStorage.getItem(KEYS.URL);
  if (saved) return saved;
  return "https://script.google.com/macros/s/AKfycbzneE-sxBGgWN3jVIJ4lkxMt3_exOUUivVYq1VphBfIGnLPxzvfeh3l-sTevCZhOog/exec";
}

export function setAppScriptUrl(url) {
  if (url) localStorage.setItem(KEYS.URL, url.trim());
  else localStorage.removeItem(KEYS.URL);
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.HISTORY) || "[]");
  } catch {
    return [];
  }
}

export function addHistory(items) {
  const hist = getHistory();
  hist.push(...items);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(hist));
  return hist;
}

export function clearHistory() {
  localStorage.removeItem(KEYS.HISTORY);
}

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || "{}");
  } catch {
    return {};
  }
}

export function setSettings(obj) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(obj));
}
