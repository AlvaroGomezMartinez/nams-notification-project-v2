const SPREADSHEET_ID = "1iufwNd2HG-g82yANScSCg5RuRc0F7vj_jGaHmzikDcQ";

// Teacher data mapping - maps teacher information [Last Name, Email, Title]
const TEACHER_DATA = [
  ["Aguilar", "russell.aguilar@nisd.net", "Mr. "],
  ["Atoui", "atlanta.atoui@nisd.net", "Mrs."],
  ["Bowery", "melissa.bowery@nisd.net", "Mrs. "],
  ["Cantu", "sandy.cantu@nisd.net", "Mrs. "],
  ["Casanova", "henry.casanova@nisd.net", "Mr. "],
  ["Coyle", "deborah.coyle@nisd.net", "Mrs. "],
  ["De Leon", "ulices.deleon@nisd.net", "Mr. "],
  ["Farias", "michelle.farias@nisd.net", "Mrs. "],
  ["Franco", "george.franco01@nisd.net", "Mr."],
  ["Garcia", "danny.garcia@nisd.net", "Mr. "],
  ["Goff", "steven.goff@nisd.net", "Mr. "],
  ["Gomez", "alvaro.gomez@nisd.net", "Mr."],
  ["Gonzales", "zina.gonzales@nisd.net", "Dr."],
  ["Hernandez", "david.hernandez@nisd.net", "Mr. "],
  ["Hutton", "rebekah.hutton@nisd.net", "Mrs. "],
  ["Idrogo", "valerie.idrogo@nisd.net", "Mrs. "],
  ["Jasso", "nadia.jasso@nisd.net", "Mrs. "],
  ["Marquez", "monica.marquez@nisd.net", "Mrs. "],
  ["Ollendieck", "reggie.ollendieck@nisd.net", "Mr. "],
  ["Paez", "john.paez@nisd.net", "Mr. "],
  ["Ramon", "israel.ramon@nisd.net", "Mr. "],
  ["Tellez", "lisa.tellez@nisd.net", "Mrs. "],
  ["Trevino", "marcos.trevino@nisd.net", "Mr. "],
  ["Wine", "stephanie.wine@nisd.net", "Mrs. "],
  ["Yeager", "sheila.yeager@nisd.net", "Mrs. "]
];

// Utilities
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Shared sheet constants
// Number of header rows before the student data starts (1-based rows).
const HEADER_ROWS = 2;

/**
 * Return the most recent daily sheet by finding sheets with MM/DD dates and selecting the chronologically latest one.
 * Falls back to common sheet names if no date sheets found.
 */
function getLatestDailySheet() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();
  
  console.log('Looking for the most recent daily sheet...');
  
  // Find all sheets that end with MM/DD pattern
  const dateSheets = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const name = sheet.getName();
    
    // Match pattern that ends with "MM/DD" (e.g. "Monday 08/11", "10/15", "Wednesday 12/3")
    const dateMatch = name.match(/(\d{1,2})\/(\d{1,2})$/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      
      // Validate the date components
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        // Create a date object for comparison (assume current year)
        const sheetDate = new Date(currentYear, month - 1, day);
        
        dateSheets.push({
          sheet: sheet,
          name: name,
          date: sheetDate,
          dateString: `${month}/${day}`
        });
        
        console.log(`Found date sheet: "${name}" -> ${month}/${day}`);
      }
    }
  }
  
  if (dateSheets.length > 0) {
    // Sort by date (most recent first)
    dateSheets.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const latestSheet = dateSheets[0];
    console.log(`Using most recent date sheet: "${latestSheet.name}" (${latestSheet.dateString})`);
    console.log(`Found ${dateSheets.length} date sheets total:`, dateSheets.map(d => `"${d.name}" (${d.dateString})`));
    
    return latestSheet.sheet;
  }
  
  // If no date sheets found, try common fallback sheet names
  console.log('No date sheets found, trying fallback sheet names...');
  const fallbackNames = ['Database', 'Students', 'Roster', 'AM', 'PM'];
  for (const fallbackName of fallbackNames) {
    const sheet = ss.getSheetByName(fallbackName);
    if (sheet) {
      console.log('Using fallback sheet:', fallbackName);
      return sheet;
    }
  }
  
  // List all available sheets for debugging
  const sheetNames = sheets.map(s => s.getName());
  console.log('Available sheets:', sheetNames);
  
  throw new Error(`Could not find a suitable sheet for student roster. Looked for sheets ending with MM/DD format, then fallback sheets (${fallbackNames.join(', ')}). Available sheets: ${sheetNames.join(', ')}`);
}

/**
 * Extract student roster from sheet.
 * Expected structure: A=NAME, E=ID#
 */
function _getStudentRoster(sheet) {
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    throw new Error('Sheet must have at least 2 rows (headers + data)');
  }
  
  console.log('Reading student roster from sheet:');
  console.log('Total rows:', data.length);
  console.log('Total columns:', data[0] ? data[0].length : 0);
  console.log('Header row 1:', data[0] ? data[0].slice(0, 10) : []);
  console.log('Header row 2:', data[1] ? data[1].slice(0, 10) : []);
  
  // Look for the actual data start - skip header rows
  const headerRows = HEADER_ROWS;
  console.log('Skipping first', headerRows, 'header rows');
  
  // This sheet is read-only - we only extract names and IDs
  // A=NAME (column 0), E=ID# (column 4)
  const students = [];
  
  for (let r = headerRows; r < data.length; r++) {
    const row = data[r];
    const name = row[0]; // Column A (NAME)
    const id = row[4];   // Column E (ID #)
    
    // Debug first few rows
    if (students.length < 5) {
      console.log(`Row ${r + 1}: NAME="${name}" (col A), ID="${id}" (col E)`);
      console.log(`Row ${r + 1} full data (first 10 cols):`, row.slice(0, 10));
    }
    
    // Only add if name exists and is not empty
    if (name && name.toString().trim()) {
      const studentName = name.toString().trim();
      const studentId = id ? id.toString().trim() : "";
      
      students.push({
        name: studentName,
        id: studentId
      });
      
      // Log first few students for verification
      if (students.length <= 3) {
        console.log(`Added student: "${studentName}" (ID: "${studentId}")`);
      }
    }
  }
  
  console.log(`Found ${students.length} students in roster`);
  if (students.length === 0) {
    console.warn('WARNING: No students found! Check if data starts in the expected row.');
    console.log('Sample of rows after headers:', data.slice(headerRows, headerRows + 3));
  }
  
  return students;
}

/**
 * Get current restroom status by looking at today's Log entries
 * Returns an object with student names as keys and their current status
 */
function _getCurrentRestroomStatus() {
  const status = {};
  
  try {
    console.log('_getCurrentRestroomStatus: Starting...');
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      console.log('No Log sheet found - all students are available');
      return status;
    }
    
    console.log('Log sheet found, reading data...');
    
    const data = logSheet.getDataRange().getValues();
    console.log('Log sheet data loaded, rows:', data.length);
    
    if (data.length <= 1) {
      console.log('Log sheet is empty - all students are available');
      return status;
    }
    
    const today = new Date().toLocaleDateString();
    console.log('Looking for today\'s entries:', today);
    
    // Process log entries from most recent to oldest
    // Log format: A=Date, B=Student Name, C=Student ID, D=Gender, E=Teacher, F=Out Time, G=Back Time, H=Hold Notice, I=Duration
    for (let r = data.length - 1; r >= 1; r--) {
      try {
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
      } catch (rowError) {
        console.warn(`Error processing log row ${r}:`, rowError.message);
        // Continue with next row
      }
    }
    
    console.log('Current status loaded for', Object.keys(status).length, 'students');
    return status;
    
  } catch (error) {
    console.error('Error in _getCurrentRestroomStatus:', error);
    console.log('Returning empty status due to error');
    return status; // Return the empty status object
  }
}

/**
 * Fetch the student roster and current status/queue.
 * Gets roster from daily sheet (read-only) and status from Log sheet.
 * Returns an object containing:
 *   - students: array of { name, id, gender, teacher, outTime, backTime, holdNotice }
 *   - queue: { girls: [names], boys: [names] }
 */
function fetchData() {
  try {
    console.log('fetchData: Starting data fetch...');
    
    // Get student roster from the daily sheet (read-only)
    console.log('fetchData: Getting latest daily sheet...');
    const dailySheet = getLatestDailySheet();
    console.log('fetchData: Daily sheet found:', dailySheet.getName());
    
    console.log('fetchData: Reading student roster...');
    const roster = _getStudentRoster(dailySheet);
    console.log('fetchData: Roster loaded with', roster.length, 'students');
    
    // Get current restroom status from Log sheet
    console.log('fetchData: Getting current restroom status...');
    const currentStatus = _getCurrentRestroomStatus();
    console.log('fetchData: Status loaded for', Object.keys(currentStatus).length, 'students');
    
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
    
  } catch (error) {
    console.error('Error in fetchData:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
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
  
  // Validate required parameters
  if (!studentName || studentName.trim() === "") {
    throw new Error("Student name is required");
  }
  
  if (!teacherName || teacherName.trim() === "") {
    throw new Error("Teacher name is required");
  }
  
  if (action === "out" && (!gender || gender.trim() === "")) {
    throw new Error("Gender (G or B) must be selected before marking student out");
  }
  
  if (gender && gender !== "G" && gender !== "B") {
    throw new Error("Gender must be either 'G' or 'B'");
  }
  
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
    try {
      console.log('Checking if restroom is available for gender:', gender);
      // Check if restroom is free for that gender (only one boy and one girl allowed out at a time)
      const otherOut = _checkOtherOut(gender);
      console.log('Other student out:', otherOut);
      
      if (otherOut) {
        console.log('Restroom occupied, adding to waiting list');
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
        
        console.log('Logging waiting entry:', { studentName, studentId, gender, teacherName, notice });
        // Log the waiting entry
        _logWaitingEntry(studentName, studentId, gender, teacherName, notice);
        console.log('Waiting entry logged successfully');
      } else {
        console.log('Restroom available, marking student out');
        // Mark student as out - log the out entry
        console.log('Logging out entry:', { studentName, studentId, gender, teacherName, outTime: now });
        _logOutEntry(studentName, studentId, gender, teacherName, now);
        console.log('Out entry logged successfully');
      }
    } catch (logError) {
      console.error('Error during out action logging:', logError);
      throw new Error(`Failed to log out action: ${logError.message}`);
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

/**
 * Get the current user's information including their detected teacher name
 * Returns an object with email, detectedTeacher, and the full teacher list
 */
function getCurrentUserInfo() {
  try {
    // Get the logged-in user's email
    const userEmail = Session.getActiveUser().getEmail();
    console.log('Current user email:', userEmail);
    
    // Look up the teacher in our data
    let detectedTeacher = null;
    for (const teacher of TEACHER_DATA) {
      const [lastName, email, title] = teacher;
      if (email.toLowerCase() === userEmail.toLowerCase()) {
        detectedTeacher = `${title}${lastName}`;
        break;
      }
    }
    
    // Generate the full teacher list for the dropdown
    const teacherList = TEACHER_DATA.map(teacher => {
      const [lastName, email, title] = teacher;
      return `${title}${lastName}`;
    });
    
    // Add a fallback option if user is not in the list
    if (!detectedTeacher) {
      teacherList.push("Other Teacher");
      detectedTeacher = "Other Teacher";
    }
    
    console.log('Detected teacher:', detectedTeacher);
    
    return {
      userEmail: userEmail,
      detectedTeacher: detectedTeacher,
      teacherList: teacherList
    };
    
  } catch (error) {
    console.error('Error getting current user info:', error);
    
    // Fallback - return the full teacher list without detection
    const teacherList = TEACHER_DATA.map(teacher => {
      const [lastName, email, title] = teacher;
      return `${title}${lastName}`;
    });
    teacherList.push("Other Teacher");
    
    return {
      userEmail: null,
      detectedTeacher: "Other Teacher",
      teacherList: teacherList
    };
  }
}

// Client-facing APIs

function api_getCurrentUserInfo() {
  return getCurrentUserInfo();
}

function api_testFetchData() {
  try {
    return testFetchData();
  } catch (error) {
    console.error('Error in api_testFetchData:', error);
    return { 
      success: false,
      error: error.message || 'Unknown error in api_testFetchData',
      stack: error.stack
    };
  }
}

/**
 * Simple test to check basic spreadsheet access
 */
function api_testBasicAccess() {
  try {
    console.log('=== Testing Basic Spreadsheet Access ===');
    
    // Test 1: Can we access the spreadsheet?
    const ss = getSpreadsheet();
    console.log('✓ Spreadsheet access successful');
    
    // Test 2: Can we get sheet list?
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(s => s.getName());
    console.log('✓ Sheet list retrieved:', sheetNames);
    
    // Test 3: Can we find a daily sheet?
    const dailySheet = getLatestDailySheet();
    console.log('✓ Daily sheet found:', dailySheet.getName());
    
    // Test 4: Can we read basic info from the sheet?
    const lastRow = dailySheet.getLastRow();
    const lastCol = dailySheet.getLastColumn();
    console.log('✓ Sheet dimensions:', lastRow, 'rows x', lastCol, 'columns');
    
    return {
      success: true,
      spreadsheetAccess: true,
      sheetCount: sheets.length,
      sheetNames: sheetNames,
      selectedSheet: dailySheet.getName(),
      sheetDimensions: { rows: lastRow, columns: lastCol }
    };
    
  } catch (error) {
    console.error('=== Basic Access Test FAILED ===');
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test just the student roster reading function
 */
function api_testStudentRoster() {
  try {
    console.log('=== Testing Student Roster Reading ===');
    
    const dailySheet = getLatestDailySheet();
    console.log('Using sheet:', dailySheet.getName());
    
    const roster = _getStudentRoster(dailySheet);
    console.log('Roster reading completed');
    
    return {
      success: true,
      sheetName: dailySheet.getName(),
      studentCount: roster.length,
      firstFewStudents: roster.slice(0, 3),
      roster: roster
    };
    
  } catch (error) {
    console.error('=== Student Roster Test FAILED ===');
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test just the restroom status reading function
 */
function api_testRestroomStatus() {
  try {
    console.log('=== Testing Restroom Status Reading ===');
    
    const status = _getCurrentRestroomStatus();
    console.log('Restroom status reading completed');
    
    return {
      success: true,
      statusCount: Object.keys(status).length,
      studentsWithStatus: Object.keys(status),
      sampleStatus: Object.keys(status).slice(0, 3).map(name => ({
        name: name,
        status: status[name]
      }))
    };
    
  } catch (error) {
    console.error('=== Restroom Status Test FAILED ===');
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Super simple test to return hardcoded data - this should ALWAYS work
 */
function api_testSimple() {
  console.log('=== Simple Test - Returning Hardcoded Data ===');
  return {
    students: [
      { name: "Test Student 1", id: "12345", gender: "G", teacher: "Mr. Gomez", outTime: "", backTime: "", holdNotice: "" },
      { name: "Test Student 2", id: "67890", gender: "B", teacher: "Mr. Gomez", outTime: "", backTime: "", holdNotice: "" }
    ],
    queue: { girls: [], boys: [] }
  };
}

/**
 * Working api_fetchData with status integration
 */
function api_fetchData() {
  console.log('=== api_fetchData called ===');
  
  try {
    // Get student roster (we know this works)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('Got roster with', roster.length, 'students');
    
    // Get restroom status with proper error handling
    let currentStatus = {};
    try {
      currentStatus = _getCurrentRestroomStatus();
      console.log('Got restroom status for', Object.keys(currentStatus).length, 'students');
    } catch (statusError) {
      console.warn('Status loading failed, using empty status:', statusError.message);
      currentStatus = {};
    }
    
    // Build result arrays
    const students = [];
    const queue = { girls: [], boys: [] };
    
    for (const student of roster) {
      const status = currentStatus[student.name] || {};
      
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: status.gender || "",
        teacher: status.teacher || "",
        outTime: status.outTime || "",
        backTime: status.backTime || "",
        holdNotice: status.holdNotice || ""
      };
      
      students.push(studentData);
      
      // Add to queue if waiting
      if (status.holdNotice && !status.outTime) {
        if (status.gender === "G") queue.girls.push(student.name);
        else if (status.gender === "B") queue.boys.push(student.name);
      }
    }
    
    const result = { students: students, queue: queue };
    console.log('api_fetchData returning:', students.length, 'students');
    return result;
    
  } catch (error) {
    console.error('Error in api_fetchData:', error);
    // Return error result
    return {
      students: [
        { name: "Error: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
      ],
      queue: { girls: [], boys: [] }
    };
  }
}

/**
 * Ultra simple test function to isolate the issue
 */
function api_ultraSimpleTest() {
  console.log('api_ultraSimpleTest called');
  const result = {
    students: [
      { name: "Test 1", id: "001", nameId: "Test 1", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" },
      { name: "Test 2", id: "002", nameId: "Test 2", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
    ],
    queue: { girls: [], boys: [] }
  };
  console.log('api_ultraSimpleTest returning hardcoded data');
  return result;
}

/**
 * Test just the roster loading without any status
 */
function api_testRosterOnly() {
  console.log('api_testRosterOnly called');
  try {
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('Roster loaded:', roster.length, 'students');
    
    const result = {
      students: roster.map(student => ({
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: "",
        teacher: "",
        outTime: "",
        backTime: "",
        holdNotice: ""
      })),
      queue: { girls: [], boys: [] }
    };
    
    console.log('api_testRosterOnly returning:', result.students.length, 'students');
    return result;
  } catch (error) {
    console.error('Error in api_testRosterOnly:', error);
    return {
      students: [{ name: "Error: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }],
      queue: { girls: [], boys: [] }
    };
  }
}

/**
 * MINIMAL VERSION - BYPASS ALL STATUS PROCESSING
 */
function api_minimalBypass() {
  console.log('=== api_minimalBypass called ===');
  
  try {
    // Get student roster only (we know this works)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('✓ Got roster with', roster.length, 'students');
    
    // Don't call _getCurrentRestroomStatus at all - bypass it completely
    const students = [];
    const queue = { girls: [], boys: [] };
    
    // Process each student with NO status processing
    for (let i = 0; i < roster.length; i++) {
      const student = roster[i];
      
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: "",  // Empty - no status processing
        teacher: "",  // Empty - no status processing
        outTime: "",  // Empty - no status processing
        backTime: "",  // Empty - no status processing
        holdNotice: ""  // Empty - no status processing
      };
      
      students.push(studentData);
    }
    
    // Final result object
    const result = { 
      students: students, 
      queue: queue 
    };
    
    console.log('✓ api_minimalBypass SUCCESS - returning', students.length, 'students');
    console.log('✓ NO STATUS PROCESSING - just basic roster');
    console.log('✓ Result structure:', typeof result, result ? 'valid' : 'invalid');
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR in api_minimalBypass:', error);
    return {
      students: [
        { name: "ERROR: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
      ],
      queue: { girls: [], boys: [] }
    };
  }
}

/**
 * OCTOBER 16 2025 VERSION - brand new function name to force deployment
 */
function api_october16_2025() {
  console.log('=== api_october16_2025 called ===');
  
  try {
    // Get student roster (we know this works from other tests)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('✓ Got roster with', roster.length, 'students');
    
    // Initialize result structure first
    const students = [];
    const queue = { girls: [], boys: [] };
    
    // Try to get restroom status, but don't let it break everything
    let currentStatus = {};
    try {
      console.log('⚠️ Attempting restroom status...');
      currentStatus = _getCurrentRestroomStatus();
      console.log('✓ Got restroom status for', Object.keys(currentStatus).length, 'students');
    } catch (statusError) {
      console.warn('⚠️ Status loading failed, continuing with empty status:', statusError.message);
      // Leave currentStatus as empty object
    }
    
    // Process each student safely
    for (let i = 0; i < roster.length; i++) {
      try {
        const student = roster[i];
        const status = currentStatus[student.name] || {};
        
        const studentData = {
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: status.gender || "",
          teacher: status.teacher || "",
          outTime: status.outTime || "",
          backTime: status.backTime || "",
          holdNotice: status.holdNotice || ""
        };
        
        students.push(studentData);
        
        // Add to queue if waiting (safely)
        if (status.holdNotice && !status.outTime) {
          if (status.gender === "G") {
            queue.girls.push(student.name);
          } else if (status.gender === "B") {
            queue.boys.push(student.name);
          }
        }
      } catch (studentError) {
        console.warn('⚠️ Error processing student', roster[i]?.name, ':', studentError.message);
        // Add a basic student entry so we don't lose the student
        students.push({
          name: roster[i]?.name || "Unknown",
          id: roster[i]?.id || "000",
          nameId: roster[i]?.name || "Unknown",
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        });
      }
    }
    
    // Final result object
    const result = { 
      students: students, 
      queue: queue 
    };
    
    console.log('✓ api_october16_2025 SUCCESS - returning', students.length, 'students');
    console.log('✓ Result structure valid:', !!result.students && Array.isArray(result.students));
    console.log('✓ First student:', students[0]?.name);
    console.log('✓ Final result object:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ MAJOR ERROR in api_october16_2025:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Emergency fallback - return roster-only data
    try {
      console.log('🚨 Attempting emergency fallback...');
      const dailySheet = getLatestDailySheet();
      const roster = _getStudentRoster(dailySheet);
      const fallbackResult = {
        students: roster.map(student => ({
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        })),
        queue: { girls: [], boys: [] }
      };
      console.log('🚨 Emergency fallback successful with', fallbackResult.students.length, 'students');
      return fallbackResult;
    } catch (fallbackError) {
      console.error('💥 Even fallback failed:', fallbackError);
      return {
        students: [
          { name: "SYSTEM ERROR: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
        ],
        queue: { girls: [], boys: [] }
      };
    }
  }
}

/**
 * FINAL WORKING VERSION - completely new function name
 */
function api_finalWorkingVersion() {
  console.log('=== api_finalWorkingVersion called ===');
  
  try {
    // Get student roster (we know this works from other tests)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('✓ Got roster with', roster.length, 'students');
    
    // Initialize result structure first
    const students = [];
    const queue = { girls: [], boys: [] };
    
    // Try to get restroom status, but don't let it break everything
    let currentStatus = {};
    try {
      console.log('⚠️ Attempting restroom status...');
      currentStatus = _getCurrentRestroomStatus();
      console.log('✓ Got restroom status for', Object.keys(currentStatus).length, 'students');
    } catch (statusError) {
      console.warn('⚠️ Status loading failed, continuing with empty status:', statusError.message);
      // Leave currentStatus as empty object
    }
    
    // Process each student safely
    for (let i = 0; i < roster.length; i++) {
      try {
        const student = roster[i];
        const status = currentStatus[student.name] || {};
        
        const studentData = {
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: status.gender || "",
          teacher: status.teacher || "",
          outTime: status.outTime || "",
          backTime: status.backTime || "",
          holdNotice: status.holdNotice || ""
        };
        
        students.push(studentData);
        
        // Add to queue if waiting (safely)
        if (status.holdNotice && !status.outTime) {
          if (status.gender === "G") {
            queue.girls.push(student.name);
          } else if (status.gender === "B") {
            queue.boys.push(student.name);
          }
        }
      } catch (studentError) {
        console.warn('⚠️ Error processing student', roster[i]?.name, ':', studentError.message);
        // Add a basic student entry so we don't lose the student
        students.push({
          name: roster[i]?.name || "Unknown",
          id: roster[i]?.id || "000",
          nameId: roster[i]?.name || "Unknown",
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        });
      }
    }
    
    // Final result object
    const result = { 
      students: students, 
      queue: queue 
    };
    
    console.log('✓ api_finalWorkingVersion SUCCESS - returning', students.length, 'students');
    console.log('✓ Result structure valid:', !!result.students && Array.isArray(result.students));
    
    return result;
    
  } catch (error) {
    console.error('❌ MAJOR ERROR in api_finalWorkingVersion:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Emergency fallback - return roster-only data
    try {
      console.log('🚨 Attempting emergency fallback...');
      const dailySheet = getLatestDailySheet();
      const roster = _getStudentRoster(dailySheet);
      const fallbackResult = {
        students: roster.map(student => ({
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        })),
        queue: { girls: [], boys: [] }
      };
      console.log('🚨 Emergency fallback successful with', fallbackResult.students.length, 'students');
      return fallbackResult;
    } catch (fallbackError) {
      console.error('💥 Even fallback failed:', fallbackError);
      return {
        students: [
          { name: "SYSTEM ERROR: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
        ],
        queue: { girls: [], boys: [] }
      };
    }
  }
}

/**
 * Working version without problematic status processing
 */
function api_loadStudentRoster() {
  console.log('=== api_loadStudentRoster called ===');
  
  try {
    // Get student roster (we know this works)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('Got roster with', roster.length, 'students');
    
    // Try to get restroom status but don't let it break the function
    let currentStatus = {};
    try {
      console.log('Attempting to get restroom status...');
      currentStatus = _getCurrentRestroomStatus();
      console.log('Got restroom status for', Object.keys(currentStatus).length, 'students');
    } catch (statusError) {
      console.warn('Status loading failed, using empty status:', statusError.message);
      currentStatus = {};
    }
    
    // Build result arrays - always ensure we return something valid
    const students = [];
    const queue = { girls: [], boys: [] };
    
    // Process each student
    for (let i = 0; i < roster.length; i++) {
      const student = roster[i];
      const status = currentStatus[student.name] || {};
      
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: status.gender || "",
        teacher: status.teacher || "",
        outTime: status.outTime || "",
        backTime: status.backTime || "",
        holdNotice: status.holdNotice || ""
      };
      
      students.push(studentData);
      
      // Add to queue if waiting (but don't let this break anything)
      try {
        if (status.holdNotice && !status.outTime) {
          if (status.gender === "G") queue.girls.push(student.name);
          else if (status.gender === "B") queue.boys.push(student.name);
        }
      } catch (queueError) {
        console.warn('Queue processing error for', student.name, ':', queueError.message);
      }
    }
    
    // Ensure we always return a valid result
    const result = { 
      students: students, 
      queue: queue 
    };
    
    console.log('api_loadStudentRoster returning:', students.length, 'students');
    console.log('Result structure valid:', !!result.students && Array.isArray(result.students));
    
    return result;
    
  } catch (error) {
    console.error('Error in api_loadStudentRoster:', error);
    console.error('Error stack:', error.stack);
    
    // Fallback: return roster-only data
    try {
      const dailySheet = getLatestDailySheet();
      const roster = _getStudentRoster(dailySheet);
      const fallbackResult = {
        students: roster.map(student => ({
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        })),
        queue: { girls: [], boys: [] }
      };
      console.log('Returning fallback result with', fallbackResult.students.length, 'students');
      return fallbackResult;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return {
        students: [
          { name: "Error: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
        ],
        queue: { girls: [], boys: [] }
      };
    }
  }
}

/**
 * Simple test to verify deployment
 */
function api_deploymentTest() {
  console.log('api_deploymentTest called');
  const result = {
    success: true,
    message: "Deployment working",
    timestamp: new Date().toISOString(),
    students: [
      { name: "Test Student 1", id: "001", nameId: "Test Student 1", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" },
      { name: "Test Student 2", id: "002", nameId: "Test Student 2", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
    ],
    queue: { girls: [], boys: [] }
  };
  console.log('api_deploymentTest returning:', result);
  return result;
}

/**
 * Simple test function to verify server connectivity
 */
function api_testConnection() {
  console.log('api_testConnection called');
  return { 
    success: true, 
    message: "Connection working",
    timestamp: new Date().toISOString()
  };
}

/**
 * Simplified fetchData function to bypass potential issues
 */
function api_fetchDataSimple() {
  console.log('=== Simple fetchData called ===');
  
  try {
    // Get basic roster
    const dailySheet = getLatestDailySheet();
    console.log('Got daily sheet:', dailySheet.getName());
    
    const roster = _getStudentRoster(dailySheet);
    console.log('Got roster:', roster.length, 'students');
    
    // Create simple result without complex status logic
    const result = {
      students: roster.map(student => ({
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: "",
        teacher: "Mr. Gomez", // Default teacher for now
        outTime: "",
        backTime: "",
        holdNotice: ""
      })),
      queue: { girls: [], boys: [] }
    };
    
    console.log('Simple result created:', result.students.length, 'students');
    console.log('About to return simple result');
    return result;
    
  } catch (error) {
    console.error('Error in simple fetchData:', error);
    return {
      students: [
        { name: "Error: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
      ],
      queue: { girls: [], boys: [] }
    };
  }
}

/**
 * List all sheets in the spreadsheet for debugging
 */
function api_listSheets() {
  try {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    const sheetInfo = sheets.map((sheet, index) => ({
      index: index,
      name: sheet.getName(),
      rows: sheet.getLastRow(),
      columns: sheet.getLastColumn()
    }));
    
    const today = new Date();
    const todayString = `${today.getMonth() + 1}/${today.getDate()}`;
    
    return {
      success: true,
      todayString: todayString,
      sheets: sheetInfo
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Inspect the contents of a specific sheet for debugging
 */
function api_inspectSheet(sheetName) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        error: `Sheet "${sheetName}" not found`
      };
    }
    
    const data = sheet.getDataRange().getValues();
    
    return {
      success: true,
      sheetName: sheetName,
      totalRows: data.length,
      totalColumns: data[0] ? data[0].length : 0,
      headerRows: data.slice(0, Math.min(3, data.length)), // First 3 rows
      sampleDataRows: data.slice(2, Math.min(7, data.length)), // Rows 3-7 (student data)
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test function to verify user detection is working
 * Call this from the Apps Script editor to test
 */
function testUserDetection() {
  const userInfo = getCurrentUserInfo();
  console.log('=== User Detection Test ===');
  console.log('User Email:', userInfo.userEmail);
  console.log('Detected Teacher:', userInfo.detectedTeacher);
  console.log('Teacher List Length:', userInfo.teacherList.length);
  console.log('First few teachers:', userInfo.teacherList.slice(0, 5));
  return userInfo;
}

/**
 * Test function to verify fetchData is working
 * Call this from the Apps Script editor to test
 */
function testFetchData() {
  try {
    console.log('=== Fetch Data Test ===');
    
    // Test step by step to isolate the issue
    console.log('Step 1: Testing spreadsheet access...');
    const ss = getSpreadsheet();
    console.log('Spreadsheet accessed successfully');
    
    console.log('Step 2: Getting sheet list...');
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(s => s.getName());
    console.log('Available sheets:', sheetNames);
    
    console.log('Step 3: Testing getLatestDailySheet...');
    const dailySheet = getLatestDailySheet();
    console.log('Daily sheet found:', dailySheet.getName());
    
    console.log('Step 4: Testing _getStudentRoster...');
    const roster = _getStudentRoster(dailySheet);
    console.log('Roster loaded:', roster.length, 'students');
    
    console.log('Step 5: Testing _getCurrentRestroomStatus...');
    const status = _getCurrentRestroomStatus();
    console.log('Status loaded for', Object.keys(status).length, 'students');
    
    console.log('Step 6: Running full fetchData...');
    const result = fetchData();
    console.log('fetchData succeeded');
    console.log('Students count:', result.students ? result.students.length : 'No students property');
    console.log('Queue:', result.queue);
    console.log('First student:', result.students && result.students[0] ? result.students[0] : 'No first student');
    return {
      success: true,
      result: result,
      debug: {
        sheetNames: sheetNames,
        dailySheetName: dailySheet.getName(),
        rosterCount: roster.length,
        statusCount: Object.keys(status).length
      }
    };
  } catch (error) {
    console.error('=== Fetch Data Test FAILED ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return { 
      success: false,
      error: error.message, 
      stack: error.stack,
      debug: {
        message: 'Check which step failed in the console logs'
      }
    };
  }
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
    console.log('Step 1: Calling updateStatus...');
    updateStatus(studentName, action, teacherName, gender);
    console.log('Step 2: updateStatus completed successfully');
    
    console.log('Step 3: Calling fetchData...');
    const result = fetchData();
    console.log('Step 4: fetchData completed, returning result');
    
    return result;
  } catch (error) {
    console.error('Error in api_updateStatus:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Re-throw with more context
    throw new Error(`Failed to update status for ${studentName}: ${error.message}`);
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
