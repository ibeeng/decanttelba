// ============================================================
//  GAS BACKEND - TELBA Decant (copy-paste utuh ke Apps Script)
//
//  PENTING:
//  1. Isi SHEET_ID di bawah dengan ID Google Sheet lu.
//     Cara ambil: buka Sheet -> URL-nya
//     https://docs.google.com/spreadsheets/d/INI_ID_NYA/edit
//     Copy bagian INI_ID_NYA (antara /d/ dan /edit).
//  2. Deploy: Deploy > New deployment (BUKAN edit yg lama!)
//       - Description: bebas
//       - Execute as: Me
//       - Who has access: Anyone   <-- WAJIB supaya fetch dari browser jalan
//     Nanti Google kasih URL BARU (token beda dari sebelumnya).
//     Copy URL BARU itu ke GAS_API_URL di index.astro.
// ============================================================

// ===== ISI ID SHEET LU DI SINI =====
var SHEET_ID = ""; // <- tempel ID sheet antar tanda kutip, misal: "1A2b3C..."

// Helper buka spreadsheet: pakai ID kalau diisi, else active (bound script)
function getSS() {
  if (SHEET_ID && SHEET_ID.length > 5) {
    return SpreadsheetApp.openById(SHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Helper balikin JSON
function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- GET: ambil database produk ----------
function doGet(e) {
  return handleGetDatabase();
}

function handleGetDatabase() {
  var ss;
  try { ss = getSS(); } catch (e) { return responseJSON({}); }
  if (!ss) return responseJSON({});

  var sheetDb = ss.getSheetByName("Database");
  if (!sheetDb) return responseJSON({});

  var lastRow = sheetDb.getLastRow();
  if (lastRow < 2) return responseJSON({});

  // A:Brand  B:Varian  C:Harga 5ml  D:Harga 10ml
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

// ---------- POST: simpan penjualan ----------
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
        "Harga jual", "Ket.", "Sumber"
      ]);
    }

    // Urutan kolom sheet Penjualan:
    // A:Tanggal  B:Brand  C:Brand and varian  D:Volume (ml)
    // E:Harga jual  F:Ket.  G:Sumber
    sheetTrx.appendRow([
      payload.tanggal || "",
      payload.brand || "",
      payload.varian || "",
      payload.volume || "",
      payload.harga || "",
      payload.ket || "",
      payload.sumber || ""
    ]);

    return responseJSON({ status: "success", message: "Data tersimpan" });
  } catch (err) {
    return responseJSON({ status: "error", message: err.message });
  }
}
