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

function doGet(e) {
  var action = e.parameter.action;
  if (action === "getDatabase") {
    return handleGetDatabase();
  } else if (action === "getTransactions") {
    return handleGetTransactions();
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
      sheetTrx.appendRow([
        "Tanggal", "Brand", "Brand and varian", "Volume (ml)",
        "Harga jual", "Ket.", "Sumber", "Keterangan"
      ]);
    }

    var existingHeaders = sheetTrx.getRange(1, 1, 1, sheetTrx.getLastColumn()).getValues()[0];
    var hasKeterangan = existingHeaders.some(function (h) {
      return String(h).trim().toLowerCase() === "keterangan";
    });
    if (!hasKeterangan) {
      sheetTrx.appendRow(existingHeaders.concat(["Keterangan"]));
    }

    sheetTrx.appendRow([
      payload.tanggal || "",
      payload.brand || "",
      payload.varian || "",
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
