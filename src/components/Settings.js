import { getState, setSettingsOpen, setToast } from "../utils/store.js";
import { getAppScriptUrl, setAppScriptUrl } from "../utils/storage.js";
import { h } from "../utils/dom.js";

export function SettingsModal() {
  const root = h(`<div id="settings-overlay" class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"></div>`);

  function render() {
    if (!getState().settingsOpen) { root.classList.add("hidden"); return; }
    root.classList.remove("hidden");
    root.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2"><i class="fa-solid fa-gears text-sky-600"></i> Pengaturan Koneksi Google Sheets</h3>
          <button id="set-close" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">Tempelkan <strong>Web App Webhook URL</strong> dari Google Apps Script yang sudah Anda deploy dari spreadsheet Anda.</p>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Google Apps Script Web App URL:</label>
          <input type="url" id="set-url" placeholder="https://script.google.com/macros/s/AKfycbx.../exec" class="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 font-mono bg-white" value="${getAppScriptUrl()}" />
        </div>
        <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
          <p class="font-bold flex items-center gap-1"><i class="fa-solid fa-circle-info"></i> Petunjuk Singkat Apps Script:</p>
          <ol class="list-decimal pl-4 space-y-0.5">
            <li>Buka Google Sheets Anda → Ekstensi → Apps Script.</li>
            <li>Paste kode <code>doPost(e)</code> backend Anda.</li>
            <li>Klik <strong>Deploy / Terapkan</strong> → <strong>Web App</strong>.</li>
            <li>Atur <i>Who has access</i> ke <strong>Anyone</strong>.</li>
          </ol>
        </div>
        <div class="flex justify-end space-x-2 pt-2">
          <button id="set-cancel" class="px-4 py-2 border rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
          <button id="set-save" class="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm">Simpan URL</button>
        </div>
      </div>`;

    root.querySelector("#set-close").onclick = () => setSettingsOpen(false);
    root.querySelector("#set-cancel").onclick = () => setSettingsOpen(false);
    root.querySelector("#set-save").onclick = () => {
      const url = root.querySelector("#set-url").value.trim();
      setAppScriptUrl(url);
      setToast(url ? "URL Apps Script tersimpan" : "Mode offline aktif");
      setSettingsOpen(false);
    };
    root.onclick = (e) => { if (e.target === root) setSettingsOpen(false); };
  }

  root._render = render;
  return root;
}
