/**
 * KasirParfum+ — Google Apps Script backend (PRD 5.2 + Katalog & Riwayat live)
 *
 * Struktur Sheet (3 tab):
 *   1. "Penjualan"  -> kolom: id | tanggal | tipeProduk | brand | varian |
 *                     volume | qty | hargaSatuan | hargaJual | metodeBayar |
 *                     ketSumber | keterangan | whatsapp
 *   2. "Katalog"    -> kolom: brand | varian | harga5ml | harga10ml
 *   3. "Settings"   -> (opsional) pasangan key | value
 *
 * Deploy:
 *   1. Buka script.google.com -> New Project -> paste file ini.
 *   2. Deploy -> New deployment -> tipe "Web app" ->
 *        Execute as: Me, Who has access: Anyone.
 *   3. Copy URL Web App -> tempel di Pengaturan (⚙️) aplikasi kasir.
 *   4. Setelah deploy pertama, buka URL dengan ?setup=1 agar header kebuat.
 *
 * Endpoint:
 *   GET  ?setup=1                         -> buat header Penjualan + Katalog
 *   GET  ?action=catalog                 -> {data:[{brand,varian,harga5ml,harga10ml}]}
 *   GET  ?action=sales&limit=100         -> {data:[ baris penjualan terbaru ]}
 *   POST {rows:[...]}  /  POST {...}     -> tulis penjualan ke sheet
 */

var PENJUALAN_COLS = [
  "id", "tanggal", "tipeProduk", "brand", "varian", "volume", "qty",
  "hargaSatuan", "hargaJual", "metodeBayar", "ketSumber", "keterangan", "whatsapp"
];
var KATALOG_COLS = ["brand", "varian", "harga5ml", "harga10ml"];

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureHeaders_(sheet, cols) {
  var first = sheet.getRange(1, 1, 1, cols.length).getValues()[0];
  var need = first.some(function (c) { return c === "" || c === null; });
  if (need) sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
}

function doGet(e) {
  e = e || {};
  var p = e.parameter || {};
  try {
    if (p.setup === "1") {
      ensureHeaders_(sheet_("Penjualan"), PENJUALAN_COLS);
      ensureHeaders_(sheet_("Katalog"), KATALOG_COLS);
      return jsonOut({ status: "ok", setup: true });
    }
    if (p.action === "catalog") {
      return jsonOut({ status: "ok", data: readAll_(sheet_("Katalog"), KATALOG_COLS) });
    }
    if (p.action === "sales") {
      var limit = parseInt(p.limit, 10) || 100;
      return jsonOut({ status: "ok", data: readAll_(sheet_("Penjualan"), PENJUALAN_COLS, limit) });
    }
    return jsonOut({ status: "ok", service: "KasirParfum+", columns: PENJUALAN_COLS.length });
  } catch (err) {
    return jsonOut({ status: "error", message: String(err) }, 400);
  }
}

function doPost(e) {
  try {
    var raw = e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    var rows = Array.isArray(data.rows) ? data.rows : [data];

    var sheet = sheet_("Penjualan");
    ensureHeaders_(sheet, PENJUALAN_COLS);

    var appended = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i] || {};
      var line = PENJUALAN_COLS.map(function (k) {
        var v = r[k];
        if (["volume", "qty", "hargaSatuan", "hargaJual"].indexOf(k) >= 0) {
          return v === undefined || v === null || v === "" ? "" : Number(v);
        }
        return v === undefined || v === null ? "" : String(v);
      });
      sheet.appendRow(line);
      appended++;
    }
    return jsonOut({ status: "success", appended: appended });
  } catch (err) {
    return jsonOut({ status: "error", message: String(err) }, 400);
  }
}

function readAll_(sheet, cols, limit) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var numRows = limit ? Math.min(limit, last - 1) : last - 1;
  var start = last - numRows + 1;
  var vals = sheet.getRange(start, 1, numRows, cols.length).getValues();
  return vals.map(function (row) {
    var obj = {};
    cols.forEach(function (c, i) { obj[c] = row[i]; });
    return obj;
  });
}

function jsonOut(obj, code) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
