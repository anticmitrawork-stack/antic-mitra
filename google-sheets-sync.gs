/**
 * =========================================================================
 * ANTIC MITRA AI - GOOGLE SHEETS MULTI-CLIENT DATABASE WEBHOOK SCRIPT
 * =========================================================================
 * 
 * ఈ స్క్రిప్ట్ మీ Google Sheet ని ఒక లైవ్ డేటాబేస్ (REST API) గా మారుస్తుంది.
 * వెబ్‌సైట్‌లో కొత్త క్లయింట్ ఆన్‌బోర్డ్ అవ్వగానే, ఈ షీట్‌లో ఒక కొత్త Row గా యాడ్ అవుతుంది.
 * 
 * సెటప్ విధానం (10 సెకన్లు మాత్రమే):
 * 1. Google Sheets లో ఒక కొత్త ఖాళీ షీట్ ఓపెన్ చేయండి (పేరు: "Antic Mitra Clients")
 * 2. Extensions > Apps Script కి వెళ్ళండి.
 * 3. ఈ మొత్తం కోడ్ పేస్ట్ చేసి Save చేయండి.
 * 4. పైన Run బటన్ నొక్కి "setupSheetHeaders" రన్ చేయండి (హెడర్స్ ఆటోమేటిక్‌గా సెట్ అవుతాయి).
 * 5. Deploy > New deployment > Select type: "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. "Deploy" క్లిక్ చేసి వచ్చే "Web App URL" కాపీ చేసి మన వెబ్‌సైట్‌లో లేదా server.js లో పెట్టండి!
 */

// 1. షీట్ హెడర్లను ఆటోమేటిక్‌గా అందంగా సెట్ చేసే ఫంక్షన్
function setupSheetHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.setName("Active_Clients");
  
  var headers = [
    "Client ID",
    "Business Name (షాప్ పేరు)",
    "Category (కేటగిరీ)",
    "Post Time (సమయం)",
    "WhatsApp Number",
    "CTA Type",
    "CTA Target (ఫోన్/లింక్)",
    "Photo URL (ఫొటో లింక్)",
    "Status (స్టేటస్)",
    "Onboarded Date",
    "Last Posted At"
  ];
  
  // మొదటి వరుసలో హెడర్లు రాయండి
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground("#4C1D95"); // Royal Purple
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  
  // డెమో డేటా (3 రకాల క్లయింట్లు)
  var sampleRows = [
    [
      "CLI_SWEETS",
      "శ్రీకృష్ణ స్వీట్స్ (Sri Krishna Sweets)",
      "Pure Ghee Sweets & Bakery",
      "10:00 AM",
      "+919390484762",
      "CALL",
      "+919390484762",
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80",
      "ACTIVE",
      new Date().toLocaleDateString(),
      "-"
    ],
    [
      "CLI_DENTAL",
      "రమేష్ డెంటల్ క్లినిక్ (Ramesh Dental Clinic)",
      "Dental Hospital & Healthcare",
      "11:00 AM",
      "+919885012345",
      "BOOK",
      "https://anticmitraai.vercel.app/book",
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80",
      "ACTIVE",
      new Date().toLocaleDateString(),
      "-"
    ],
    [
      "CLI_SALON",
      "రాయల్ సెలూన్ (Royal Salon & Spa)",
      "Men Hair Salon & Luxury Grooming",
      "05:00 PM",
      "+919440011223",
      "CALL",
      "+919440011223",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
      "ACTIVE",
      new Date().toLocaleDateString(),
      "-"
    ]
  ];
  
  sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
  sheet.autoResizeColumns(1, headers.length);
  Logger.log("✅ Sheet Headers & 3 Clients created successfully!");
}

// 2. వెబ్‌సైట్ నుండి కొత్త క్లయింట్ డేటా వచ్చినప్పుడు ఆటోమేటిక్‌గా Row యాడ్ చేసే వెబ్‌హుక్
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    var clientId = data.id || "CLI_" + new Date().getTime().toString(36).toUpperCase();
    var businessName = data.businessName || "New Client";
    var category = data.category || "General Business";
    var postingTime = data.postingTime || "10:00 AM";
    var whatsapp = data.whatsapp || "";
    var ctaType = data.ctaType || "CALL";
    var ctaTarget = data.ctaTarget || whatsapp;
    var photoUrl = (data.photos && data.photos.length > 0) ? data.photos[0] : (data.photoUrl || "");
    var status = data.status || "ACTIVE";
    var onboardDate = new Date().toISOString();
    var lastPostedAt = "-";

    // క్లయింట్ పేరు ముందే ఉందేమో చెక్ చేయండి (ఉంటే అప్‌డేట్ చేయండి, లేకుంటే కొత్త రో)
    var dataRange = sheet.getDataRange().getValues();
    var existingRow = -1;
    
    for (var i = 1; i < dataRange.length; i++) {
      if (dataRange[i][1] && dataRange[i][1].toString().toLowerCase() === businessName.toLowerCase()) {
        existingRow = i + 1;
        break;
      }
    }

    var rowData = [
      clientId,
      businessName,
      category,
      postingTime,
      whatsapp,
      ctaType,
      ctaTarget,
      photoUrl,
      status,
      onboardDate,
      lastPostedAt
    ];

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Client successfully synced to Google Sheet!",
      clientId: clientId,
      businessName: businessName
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. టెస్ట్ కోసం GET రిక్వెస్ట్
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    totalRows: rows.length,
    headers: rows[0]
  })).setMimeType(ContentService.MimeType.JSON);
}
