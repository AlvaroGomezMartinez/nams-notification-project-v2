const SPREADSHEET_ID = "1iufwNd2HG-g82yANScSCg5RuRc0F7vj_jGaHmzikDcQ";

// Utilities
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Shared sheet constants
// Number of header rows before the student data starts (1-based rows).
const HEADER_ROWS = 2;

/**
 * Return the "latest" sheet by looking for today's date or the leftmost tab whose name ends with MM/DD.
 * Assumes sheet order from left to right; first tab (index 0) is leftmost.
 */
function getLatestDailySheet() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();
  const today = new Date();
  const todayString = `${today.getMonth() + 1}/${today.getDate()}`;
  
  console.log('Looking for sheet with today\'s date:', todayString);
  
  // First, try to find a sheet that ends with today's date
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const name = sheet.getName();
    if (name.endsWith(todayString)) {
      console.log('Found today\'s sheet:', name);
      return sheet;
    }
  }
  
  // If not found, look for any sheet ending with MM/DD pattern
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const name = sheet.getName();
    // Match pattern that ends with "MM/DD" (e.g. "Monday 08/11", "10/15")
    if (/\d{1,2}\/\d{1,2}$/.test(name)) {
      console.log('Found date sheet:', name);
      return sheet;
    }
  }
  
  // List all available sheets for debugging
  const sheetNames = sheets.map(s => s.getName());
  console.log('Available sheets:', sheetNames);
  
  throw new Error(`Could not find a daily sheet with MM/DD suffix. Available sheets: ${sheetNames.join(', ')}`);
}

/**
 * Ensure the sheet has the proper column structure for the app to work.
 * If it only has Name/ID, add the missing columns.
 */
function _getStudentRoster(sheet) {
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    throw new Error('Sheet must have at least 2 rows (your headers)');
  }
  
  console.log('Reading student roster from sheet (read-only):');
  console.log('Total columns:', data[0] ? data[0].length : 0);
  console.log('Header row 1 (first 10 cols):', data[0] ? data[0].slice(0, 10) : []);
  
  // This sheet is read-only - we only extract names and IDs
  // A=NAME, E=ID#
  const students = [];
  const headerRows = HEADER_ROWS;
  
  for (let r = headerRows; r < data.length; r++) {
    const row = data[r];
    const name = row[0]; // Column A
    const id = row[4];   // Column E
    
    if (name) {
      students.push({
        name: name.toString().trim(),
        id: id ? id.toString().trim() : ""
      });
    }
  }
  
  console.log(`Found ${students.length} students in roster`);
  return students;
}

/**
 * Get current restroom status by looking at today's Log entries
 * Returns an object with student names as keys and their current status
 */
function _getCurrentRestroomStatus() {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  const status = {};
  
  if (!logSheet) {
    console.log('No Log sheet found - all students are available');
    return status;
  }
  
  const data = logSheet.getDataRange().getValues();
  if (data.length <= 1) {
    console.log('Log sheet is empty - all students are available');
    return status;
  }
  
  const today = new Date().toLocaleDateString();
  console.log('Looking for today\'s entries:', today);
  
  // Process log entries from most recent to oldest
  // Log format: A=Date, B=Student Name, C=Student ID, D=Gender, E=Teacher, F=Out Time, G=Back Time, H=Hold Notice, I=Duration
  for (let r = data.length - 1; r >= 1; r--) {
    const row = data[r];
    const date = row[0];
    const studentName = row[1];
    const studentId = row[2];
    const gender = row[3];
    const teacher = row[4];
    const outTime = row[5];
    const backTime = row[6];
    const holdNotice = row[7];
    
    if (!studentName) continue;
    
    // Only process today's entries
    const entryDate = date ? new Date(date).toLocaleDateString() : '';
    if (entryDate !== today) continue;
    
    // If we haven't seen this student yet (processing newest first)
    if (!status[studentName]) {
      if (backTime) {
        // Student has returned - they are available (don't add to status object)
        // This means they'll get default empty values when combined with roster
        console.log(`${studentName} has returned (backTime: ${backTime}), marking as available`);
      } else if (outTime) {
        // Student is currently out
        status[studentName] = {
          gender: gender || "",
          teacher: teacher || "",
          outTime: outTime,
          backTime: "",
          holdNotice: ""
        };
        console.log(`${studentName} is currently out (outTime: ${outTime})`);
      } else if (holdNotice) {
        // Student is waiting in line
        status[studentName] = {
          gender: gender || "",
          teacher: teacher || "",
          outTime: "",
          backTime: "",
          holdNotice: holdNotice
        };
        console.log(`${studentName} is waiting in line (holdNotice: ${holdNotice})`);
      }
    }
  }
  
  console.log('Current status loaded for', Object.keys(status).length, 'students');
  return status;
}

/**
 * Fetch the student roster and current status/queue.
 * Gets roster from daily sheet (read-only) and status from Log sheet.
 * Returns an object containing:
 *   - students: array of { name, id, gender, teacher, outTime, backTime, holdNotice }
 *   - queue: { girls: [names], boys: [names] }
 */
function fetchData() {
  // Get student roster from the daily sheet (read-only)
  const dailySheet = getLatestDailySheet();
  const roster = _getStudentRoster(dailySheet);
  
  // Get current restroom status from Log sheet
  const currentStatus = _getCurrentRestroomStatus();
  
  // Debug: Log current status for troubleshooting
  const studentsWithStatus = Object.keys(currentStatus).filter(name => 
    currentStatus[name].outTime || currentStatus[name].holdNotice || currentStatus[name].backTime
  );
  console.log(`Students with current status (${studentsWithStatus.length}):`, studentsWithStatus);
  
  // Combine roster with current status
  const result = [];
  const queue = { girls: [], boys: [] };
  
  for (const student of roster) {
    const status = currentStatus[student.name] || {
      gender: "",
      teacher: "",
      outTime: "",
      backTime: "",
      holdNotice: ""
    };
    
    result.push({
      name: student.name,
      id: student.id,
      nameId: student.name,
      gender: status.gender,
      teacher: status.teacher,
      outTime: status.outTime,
      backTime: status.backTime,
      holdNotice: status.holdNotice
    });
    
    // Debug: Log first few students with any status
    if (result.length <= 3 && (status.outTime || status.holdNotice || status.backTime)) {
      console.log(`Student ${student.name} status:`, status);
    }
    
    // Build queue lists
    if (status.holdNotice && !status.outTime) {
      // They have been put on hold (waiting in line)
      if (status.gender === "G") queue.girls.push(student.name);
      else if (status.gender === "B") queue.boys.push(student.name);
    }
  }

  console.log(`Loaded ${result.length} students from roster`);
  console.log(`Queue - Girls: ${queue.girls.length}, Boys: ${queue.boys.length}`);

  return { students: result, queue };
}

/**
 * Write updates to the Log sheet only (daily sheet remains read-only).
 * @param {string} studentName
 * @param {string} action — either "out" or "back"
 * @param {string} teacherName
 * @param {string} gender
 */
function updateStatus(studentName, action, teacherName, gender) {
  console.log(`updateStatus called: ${studentName}, ${action}, ${teacherName}, ${gender}`);
  
  // Get student ID from the roster
  const dailySheet = getLatestDailySheet();
  console.log('Got daily sheet:', dailySheet.getName());
  
  const roster = _getStudentRoster(dailySheet);
  console.log('Loaded roster:', roster.length, 'students');
  
  const student = roster.find(s => s.name === studentName);
  console.log('Found student:', student);
  
  const studentId = student ? student.id : "";
  console.log('Student ID:', studentId);
  
  const now = new Date();
  console.log('Current time:', now);
  
  if (action === "out") {
    // Check if restroom is free for that gender (only one boy and one girl allowed out at a time)
    const otherOut = _checkOtherOut(gender);
    if (otherOut) {
      // Someone of the same gender is already out. Add to waiting list
      const currentStatus = _getCurrentRestroomStatus();
      let waitingCount = 0;
      for (const [name, status] of Object.entries(currentStatus)) {
        if (status.gender === gender && status.holdNotice && !status.outTime) {
          waitingCount++;
        }
      }
      const position = waitingCount + 1;
      const notice = `Waiting in line. Position ${position}.`;
      
      // Log the waiting entry
      _logWaitingEntry(studentName, studentId, gender, teacherName, notice);
    } else {
      // Mark student as out - log the out entry
      _logOutEntry(studentName, studentId, gender, teacherName, now);
    }
  } else if (action === "back") {
    // Mark student as back - complete the log entry
    _logBackEntry(studentName, studentId, gender, teacherName, now);
    
    // After marking back, promote the next person in queue if any
    _promoteNextFromQueue(gender);
  }
}

/** Return true if a student of that gender is currently out (i.e. has an outTime but no backTime) */
function _checkOtherOut(gender) {
  const currentStatus = _getCurrentRestroomStatus();
  
  for (const [name, status] of Object.entries(currentStatus)) {
    if (status.gender === gender && status.outTime && !status.backTime) {
      console.log(`${gender} restroom occupied by ${name}`);
      return true;
    }
  }
  return false;
}

/** Returns queue lists based on current status */
function _getQueueList() {
  const currentStatus = _getCurrentRestroomStatus();
  const queue = { girls: [], boys: [] };
  
  for (const [name, status] of Object.entries(currentStatus)) {
    if (status.holdNotice && !status.outTime) {
      // They are waiting in line
      if (status.gender === "G") queue.girls.push(name);
      else if (status.gender === "B") queue.boys.push(name);
    }
  }
  
  return queue;
}

/** After a student comes back, promote the next waiting student (if any) */
function _promoteNextFromQueue(gender) {
  const queue = _getQueueList();
  const list = (gender === "G") ? queue.girls : queue.boys;
  if (list.length === 0) return;
  
  console.log(`Promoting next ${gender} from queue:`, list);
  
  // Get the roster to find student IDs
  const dailySheet = getLatestDailySheet();
  const roster = _getStudentRoster(dailySheet);
  const currentStatus = _getCurrentRestroomStatus();
  
  // Promote the first person in line (log them as going out)
  const nextName = list[0];
  const student = roster.find(s => s.name === nextName);
  const status = currentStatus[nextName];
  
  if (student && status) {
    const now = new Date();
    // Log them as out (remove from waiting list)
    _logOutEntry(nextName, student.id, status.gender, status.teacher, now);
    console.log(`Promoted ${nextName} from waiting to out`);
  }
  
  // Note: Positions will be automatically updated when fetchData runs next time
  // since we're reading current status from the log
}

/** Log a waiting entry to the Log sheet */
function _logWaitingEntry(studentName, studentId, gender, teacherName, holdNotice) {
  const ss = getSpreadsheet();
  let logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    logSheet = ss.insertSheet("Log");
    logSheet.appendRow(["Date", "Student Name", "Student ID", "Gender", "Teacher", "Out Time", "Back Time", "Hold Notice", "Duration (minutes)"]);
  }
  
  const date = new Date().toLocaleDateString();
  // A: Date, B: Student Name, C: Student ID, D: Gender, E: Teacher, F: Out Time, G: Back Time, H: Hold Notice, I: Duration
  const row = [date, studentName, studentId, gender, teacherName, "", "", holdNotice, ""];
  logSheet.appendRow(row);
}

/** Log an out entry to the Log sheet */
function _logOutEntry(studentName, studentId, gender, teacherName, outTime) {
  const ss = getSpreadsheet();
  let logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    logSheet = ss.insertSheet("Log");
    logSheet.appendRow(["Date", "Student Name", "Student ID", "Gender", "Teacher", "Out Time", "Back Time", "Hold Notice", "Duration (minutes)"]);
  }
  
  const date = new Date().toLocaleDateString();
  const outTimeFormatted = outTime.toLocaleTimeString();
  
  // A: Date, B: Student Name, C: Student ID, D: Gender, E: Teacher, F: Out Time, G: Back Time, H: Hold Notice, I: Duration
  const row = [date, studentName, studentId, gender, teacherName, outTimeFormatted, "", "", ""];
  logSheet.appendRow(row);
}

/** Log a back entry (complete the transaction) to the Log sheet */
function _logBackEntry(studentName, studentId, gender, teacherName, backTime) {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  if (!logSheet) return;
  
  const date = new Date().toLocaleDateString();
  const backTimeFormatted = backTime.toLocaleTimeString();
  
  // Find the most recent "out" entry for this student today and update it
  const data = logSheet.getDataRange().getValues();
  
  for (let r = data.length - 1; r >= 1; r--) {
    const row = data[r];
    const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : '';
    const entryName = row[1];
    const entryOutTime = row[5];
    const entryBackTime = row[6];
    
    if (entryDate === date && entryName === studentName && entryOutTime && !entryBackTime) {
      // Found the out entry - update it with back time and duration
      const outTime = new Date(`${date} ${entryOutTime}`);
      const duration = Math.round((backTime.getTime() - outTime.getTime()) / (1000 * 60));
      
      logSheet.getRange(r + 1, 7).setValue(backTimeFormatted); // Back Time (column G)
      logSheet.getRange(r + 1, 9).setValue(duration); // Duration (column I)
      return;
    }
  }
  
  // If no out entry found, create a new complete entry
  const row = [date, studentName, studentId, gender, teacherName, "", backTimeFormatted, "", ""];
  logSheet.appendRow(row);
}

/** Serve the HTML + client */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("NAMS Notification (Restroom)")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Client-facing APIs
function api_fetchData() {
  return fetchData();
}

/**
 * Debug function to check what's in the Log sheet
 */
function api_debugLogSheet() {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  
  if (!logSheet) {
    return { error: "No Log sheet found" };
  }
  
  const data = logSheet.getDataRange().getValues();
  const today = new Date().toLocaleDateString();
  
  const todaysEntries = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const date = row[0];
    const entryDate = date ? new Date(date).toLocaleDateString() : '';
    
    if (entryDate === today) {
      todaysEntries.push({
        date: entryDate,
        studentName: row[1],
        studentId: row[2], 
        gender: row[3],
        teacher: row[4],
        outTime: row[5],
        backTime: row[6],
        holdNotice: row[7]
      });
    }
  }
  
  return {
    today: today,
    totalLogEntries: data.length - 1,
    todaysEntries: todaysEntries
  };
}
function api_updateStatus(studentName, action, teacherName, gender) {
  console.log('API updateStatus called with:', { studentName, action, teacherName, gender });
  try {
    updateStatus(studentName, action, teacherName, gender);
    console.log('updateStatus completed successfully');
    const result = fetchData();
    console.log('fetchData completed, returning result');
    return result;
  } catch (error) {
    console.error('Error in api_updateStatus:', error);
    throw error;
  }
}

// Debug function to check spreadsheet structure
function api_debugSheet() {
  const sheet = getLatestDailySheet();
  const data = sheet.getDataRange().getValues();
  return {
    sheetName: sheet.getName(),
    totalRows: data.length,
    headerRows: HEADER_ROWS,
    firstFewRows: data.slice(0, Math.min(5, data.length)),
    sampleData: data.slice(HEADER_ROWS, Math.min(HEADER_ROWS + 3, data.length))
  };
}

/**
 * Append a completed student record into the 'Log' sheet.
 * Expects studentObj to contain at least: { name, id, gender, teacher }
 * Adds a timestamp and returns the new row number.
 */
function api_appendToLog(studentObj) {
  const ss = getSpreadsheet();
  let logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    // create a Log sheet with header row if it doesn't exist
    logSheet = ss.insertSheet("Log");
    logSheet.appendRow(["Timestamp", "Name", "ID", "Gender", "Teacher"]);
  }
  const ts = new Date();
  const row = [ts, studentObj.name || "", studentObj.id || "", studentObj.gender || "", studentObj.teacher || ""];
  logSheet.appendRow(row);
  return { success: true };
}
