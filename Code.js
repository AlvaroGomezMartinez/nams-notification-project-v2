const SPREADSHEET_ID = "1iufwNd2HG-g82yANScSCg5RuRc0F7vj_jGaHmzikDcQ";

// Utilities
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Return the “latest” sheet by looking at the leftmost tab whose name ends with MM/DD.
 * Assumes sheet order from left to right; first tab (index 0) is leftmost.
 */
function getLatestDailySheet() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const name = sheet.getName();
    // Match pattern that ends with “MM/DD” (e.g. “Monday 08/11”, “10/15”)
    if (/\d{1,2}\/\d{1,2}$/.test(name)) {
      return sheet;
    }
  }
  throw new Error("Could not find a daily sheet with MM/DD suffix");
}

/**
 * Fetch the student roster and current status/queue.
 * Returns an object containing:
 *   - students: array of { name, gender, teacher, outTime, backTime, queueHoldNotice }
 *   - queue: { girls: [names], boys: [names] }
 */
function fetchData() {
  const sheet = getLatestDailySheet();
  const data = sheet.getDataRange().getValues();
  // Assume header rows 1–? and data from a fixed start row, e.g. row 4 onward.
  // Suppose row 1 = date, row 2 = period, row 3 = blank, row 4 onward = students.
  const headerRows = 3;
  const result = [];
  // Parse each student row:
  for (let r = headerRows; r < data.length; r++) {
    const row = data[r];
    const name = row[0];
    if (!name) continue;
    // Let's assume columns:
    // col A: name, B: gender (“G” or “B”), C: teacher, D: out timestamp, E: back timestamp, F: hold notice
    result.push({
      name: row[0],
      gender: row[1],
      teacher: row[2],
      outTime: row[3],
      backTime: row[4],
      holdNotice: row[5]
    });
  }

  // Build queue lists:
  const queue = { girls: [], boys: [] };
  for (const student of result) {
    if (student.holdNotice && student.outTime === "") {
      // They have been put on hold (not yet marked out)
      if (student.gender === "G") queue.girls.push(student.name);
      else if (student.gender === "B") queue.boys.push(student.name);
    }
  }

  return { students: result, queue };
}

/**
 * Write updates back to the sheet after someone clicks Out or Back.
 * @param {string} studentName
 * @param {string} action — either "out" or "back"
 * @param {string} teacherName
 * @param {string} gender
 */
function updateStatus(studentName, action, teacherName, gender) {
  const sheet = getLatestDailySheet();
  const data = sheet.getDataRange().getValues();
  const headerRows = 3;
  // scan to find the row for studentName
  for (let r = headerRows; r < data.length; r++) {
    const row = data[r];
    if (row[0] === studentName) {
      const rowIndex = r + 1; // 1-based
      // Columns: A=1 name, B=2 gender, C=3 teacher, D=4 out, E=5 back, F=6 holdNotice
      if (action === "out") {
        // Check if restroom is free for that gender
        const otherOut = _checkOtherOut(gender);
        if (otherOut) {
          // Someone is already out. Add to hold notice and leave outTime blank
          const queue = _getQueueList();
          const waiting = queue[(gender === "G" ? "girls" : "boys")].length;
          const notice = `Hold. ${waiting} student(s) waiting in line.`;
          sheet.getRange(rowIndex, 6).setValue(notice);
        } else {
          // Mark out timestamp, set teacher if not set, clear hold notice
          const now = new Date();
          sheet.getRange(rowIndex, 4).setValue(now);
          sheet.getRange(rowIndex, 3).setValue(teacherName);
          sheet.getRange(rowIndex, 6).clear();  // clear hold notice
        }
      } else if (action === "back") {
        // Mark back timestamp, clear hold notice (in case)
        const now = new Date();
        sheet.getRange(rowIndex, 5).setValue(now);
        sheet.getRange(rowIndex, 6).clear();
        // After marking back, check if someone is in queue next; if so, clear their hold notice
        _promoteNextFromQueue(gender);
      }
      break;
    }
  }
}

/** Return true if a student of that gender is currently out (i.e. has an outTime but no backTime) */
function _checkOtherOut(gender) {
  const sheet = getLatestDailySheet();
  const data = sheet.getDataRange().getValues();
  const headerRows = 3;
  for (let r = headerRows; r < data.length; r++) {
    const row = data[r];
    const g = row[1];
    const outT = row[3];
    const backT = row[4];
    if (g === gender && outT && !backT) {
      return true;
    }
  }
  return false;
}

/** Returns queue lists as in fetchData */
function _getQueueList() {
  const fd = fetchData();
  return fd.queue;
}

/** After a student comes back, promote the next waiting student (if any) by clearing their hold notice so they can now go out */
function _promoteNextFromQueue(gender) {
  const sheet = getLatestDailySheet();
  const data = sheet.getDataRange().getValues();
  const headerRows = 3;
  // Build queue list
  const queue = _getQueueList();
  const list = (gender === "G") ? queue.girls : queue.boys;
  if (list.length === 0) return;
  const nextName = list[0];
  // find the row of nextName, and clear hold notice
  for (let r = headerRows; r < data.length; r++) {
    const row = data[r];
    if (row[0] === nextName) {
      const rowIndex = r + 1;
      sheet.getRange(rowIndex, 6).clear();  // clear holdNotice
      break;
    }
  }
}

/** Serve the HTML + client */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Restroom Sign-Out System")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Client-facing APIs
function api_fetchData() {
  return fetchData();
}
function api_updateStatus(studentName, action, teacherName, gender) {
  updateStatus(studentName, action, teacherName, gender);
  return fetchData();
}
