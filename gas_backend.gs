// ============================================================
//  GAS BACKEND - TELBA Decant (Updated with Analytics)
// ============================================================

var SHEET_ID = ""; // <- tempel ID sheet lu di sini

function getSS() {
  if (SHEET_ID && SHEET_ID.length > 5) {
    return SpreadsheetApp.openById(SHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  Helpers: jaga struktur sheet tetap rapi
// ============================================================

// Header standar sheet Penjualan (8 kolom, baris 1).
function expectedHeader() {
  return ["Tanggal", "Brand", "Brand and varian", "Volume (ml)",
          "Harga jual", "Ket.", "Sumber", "Keterangan"];
}

// Pastikan baris 1 = header standar. TIDAK PERNAH nyelip ke badan data.
function ensureHeader(sheet) {
  var exp = expectedHeader();
  var first = sheet.getRange(1, 1, 1, exp.length).getValues()[0]
                  .map(function (v) { return String(v).trim(); });
  var same = first.length === exp.length &&
             first.every(function (v, i) { return v === exp[i]; });
  if (!same) {
    sheet.getRange(1, 1, 1, exp.length).setValues([exp]);
  }
}

// Koreksi typo umum di kolom varian (case-insensitive).
var VARIAN_FIX = {
  "enhanted": "ENCHANTED",
  "enchante": "ENCHANTED",
  "enchantd": "ENCHANTED",
  "enhantd":  "ENCHANTED",
  "enchanteed": "ENCHANTED"
};
function normalizeVarian(v) {
  v = String(v || "").trim();
  var key = v.toLowerCase();
  return VARIAN_FIX[key] || v;
}

// Bersihkan sheet Penjualan yang sudah terlanjur korup:
//  - hapus baris header duplikat yg nyelip di badan data
//  - koreksi typo varian
//  - pastikan baris 1 = header standar
function cleanupPenjualanSheet() {
  var ss = getSS();
  if (!ss) return responseJSON({ status: "error", message: "SS not found" });
  var sheet = ss.getSheetByName("Penjualan");
  if (!sheet) return responseJSON({ status: "ok", deleted: 0, fixed: 0, note: "sheet kosong" });

  ensureHeader(sheet);

  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, Math.max(lastRow - 1, 0), sheet.getLastColumn()).getValues();
  var toDelete = [];
  var fixed = 0;

  for (var i = 0; i < data.length; i++) {
    var rowNum = i + 2;
    var firstCell = String(data[i][0]).trim().toLowerCase();
    if (firstCell === "tanggal") {            // baris header duplikat
      toDelete.push(rowNum);
      continue;
    }
    var fixedVarian = normalizeVarian(data[i][2]);
    if (fixedVarian !== String(data[i][2]).trim()) {
      sheet.getRange(rowNum, 3).setValue(fixedVarian);
      fixed++;
    }
  }

  // Hapus dari bawah ke atas biar indeks gak geser.
  for (var j = toDelete.length - 1; j >= 0; j--) {
    sheet.deleteRow(toDelete[j]);
  }

  return responseJSON({ status: "ok", deleted: toDelete.length, fixed: fixed });
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === "getDatabase") {
    return handleGetDatabase();
  } else if (action === "getTransactions") {
    return handleGetTransactions();
  } else if (action === "cleanup") {
    return cleanupPenjualanSheet();
  }
  // Default to database for backward compatibility
  return handleGetDatabase();
}

function handleGetDatabase() {
  var ss;
  try { ss = getSS(); } catch (e) { return responseJSON({status: "error", message: e.toString()}); }
  if (!ss) return responseJSON({status: "error", message: "SS not found"});

  var sheetDb = ss.getSheetByName("Database");
  if (!sheetDb) return responseJSON({});

  var lastRow = sheetDb.getLastRow();
  if (lastRow < 2) return responseJSON({});

  var data = sheetDb.getRange(2, 1, lastRow - 1, 4).getValues();
  var db = {};

  for (var i = 0; i < data.length; i++) {
    var brand = String(data[i][0]).trim();
    var varian = String(data[i][1]).trim();
    var harga5 = Number(String(data[i][2]).replace(/[^0-9]/g, "")) || 0;
    var harga10 = Number(String(data[i][3]).replace(/[^0-9]/g, "")) || 0;
    if (brand && varian) {
      if (!db[brand]) db[brand] = {};
      db[brand][varian] = { 5: harga5, 10: harga10 };
    }
  }
  return responseJSON(db);
}

function handleGetTransactions() {
  var ss;
  try { ss = getSS(); } catch (e) { return responseJSON([]); }
  var sheetTrx = ss.getSheetByName("Penjualan");
  if (!sheetTrx) return responseJSON([]);

  var lastRow = sheetTrx.getLastRow();
  if (lastRow < 2) return responseJSON([]);

  var data = sheetTrx.getRange(2, 1, lastRow - 1, 8).getValues();
  var transactions = data.map(function(row) {
    return {
      tanggal: row[0],
      brand: row[1],
      varian: row[2],
      volume: row[3],
      harga: row[4],
      ket: row[5],
      sumber: row[6],
      keterangan: row[7]
    };
  });
  
  return responseJSON(transactions);
}

function doPost(e) {
  try {
    var payload;
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      throw new Error("Payload kosong");
    }

    var ss = getSS();
    if (!ss) throw new Error("Sheet gak ketemu (isi SHEET_ID di script)");

    var sheetTrx = ss.getSheetByName("Penjualan");
    if (!sheetTrx) {
      sheetTrx = ss.insertSheet("Penjualan");
    }
    ensureHeader(sheetTrx);

    sheetTrx.appendRow([
      payload.tanggal || "",
      (payload.brand || "").toString().trim(),
      normalizeVarian(payload.varian || ""),
      payload.volume || "",
      payload.harga || "",
      payload.ket || "",
      payload.sumber || "",
      payload.keterangan || ""
    ]);

    return responseJSON({ status: "success", message: "Data tersimpan" });
  } catch (err) {
    return responseJSON({ status: "error", message: err.message });
  }
}
