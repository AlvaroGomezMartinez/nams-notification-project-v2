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
  ["Franco", "george.franco01@nisd.net", "Mr. "],
  ["Garcia", "danny.garcia@nisd.net", "Mr. "],
  ["Goff", "steven.goff@nisd.net", "Mr. "],
  ["Gomez", "alvaro.gomez@nisd.net", "Mr. "],
  ["Gonzales", "zina.gonzales@nisd.net", "Dr. "],
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
  ["Yeager", "sheila.yeager@nisd.net", "Mrs. "],
];

// Utilities
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Shared sheet constants
// Number of header rows before the student data starts (1-based rows).
const HEADER_ROWS = 2; /**

 * Return the most recent daily sheet by finding sheets with MM/DD dates and selecting the chronologically latest one.
 * Falls back to common sheet names if no date sheets found.
 */
function getLatestDailySheet() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();

  console.log("Looking for the most recent daily sheet...");

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
          dateString: `${month}/${day}`,
        });

        console.log(`Found date sheet: "${name}" -> ${month}/${day}`);
      }
    }
  }

  if (dateSheets.length > 0) {
    // Sort by date (most recent first)
    dateSheets.sort((a, b) => b.date.getTime() - a.date.getTime());

    const latestSheet = dateSheets[0];
    console.log(
      `Using most recent date sheet: "${latestSheet.name}" (${latestSheet.dateString})`
    );
    console.log(
      `Found ${dateSheets.length} date sheets total:`,
      dateSheets.map((d) => `"${d.name}" (${d.dateString})`)
    );

    return latestSheet.sheet;
  }

  // If no date sheets found, try common fallback sheet names
  console.log("No date sheets found, trying fallback sheet names...");
  const fallbackNames = ["Database", "Students", "Roster", "AM", "PM"];
  for (const fallbackName of fallbackNames) {
    const sheet = ss.getSheetByName(fallbackName);
    if (sheet) {
      console.log("Using fallback sheet:", fallbackName);
      return sheet;
    }
  }

  // List all available sheets for debugging
  const sheetNames = sheets.map((s) => s.getName());
  console.log("Available sheets:", sheetNames);

  throw new Error(
    `Could not find a suitable sheet for student roster. Looked for sheets ending with MM/DD format, then fallback sheets (${fallbackNames.join(
      ", "
    )}). Available sheets: ${sheetNames.join(", ")}`
  );
}

/**
 * Extract student roster from sheet.
 * Expected structure: A=NAME, E=ID#
 */
function _getStudentRoster(sheet) {
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    throw new Error("Sheet must have at least 2 rows (headers + data)");
  }

  console.log("Reading student roster from sheet:");
  console.log("Total rows:", data.length);
  console.log("Total columns:", data[0] ? data[0].length : 0);
  console.log("Header row 1:", data[0] ? data[0].slice(0, 10) : []);
  console.log("Header row 2:", data[1] ? data[1].slice(0, 10) : []);

  // Look for the actual data start - skip header rows
  const headerRows = HEADER_ROWS;
  console.log("Skipping first", headerRows, "header rows");

  // This sheet is read-only - we only extract names and IDs
  // A=NAME (column 0), E=ID# (column 4)
  const students = [];

  for (let r = headerRows; r < data.length; r++) {
    const row = data[r];
    const name = row[0]; // Column A (NAME)
    const id = row[4]; // Column E (ID #)

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
        id: studentId,
      });

      // Log first few students for verification
      if (students.length <= 3) {
        console.log(`Added student: "${studentName}" (ID: "${studentId}")`);
      }
    }
  }

  console.log(`Found ${students.length} students in roster`);
  if (students.length === 0) {
    console.warn(
      "WARNING: No students found! Check if data starts in the expected row."
    );
    console.log(
      "Sample of rows after headers:",
      data.slice(headerRows, headerRows + 3)
    );
  }

  return students;
}

/**
 * Get current restroom status using direct Log sheet access
 * Returns an object with student names as keys and their current status
 */
function _getCurrentRestroomStatus() {
  try {
    console.log("_getCurrentRestroomStatus: Starting direct Log sheet read...");

    // Use fallback implementation for reliability
    return _getCurrentRestroomStatusFallback();
  } catch (error) {
    console.error("Error in _getCurrentRestroomStatus:", error);
    return {};
  }
}

/**
 * Fallback implementation of restroom status with improved error handling
 * Used when the optimized version fails
 */
function _getCurrentRestroomStatusFallback() {
  const status = {};

  try {
    console.log("_getCurrentRestroomStatusFallback: Starting...");
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");

    if (!logSheet) {
      console.log("No Log sheet found - all students are available");
      return status;
    }

    const data = logSheet.getDataRange().getValues();

    if (data.length <= 1) {
      console.log("Log sheet is empty - all students are available");
      return status;
    }

    const today = new Date().toLocaleDateString();
    console.log("Looking for today's entries:", today);

    // Process from most recent to oldest with early termination
    let todayEntriesFound = 0;

    for (let r = data.length - 1; r >= 1; r--) {
      try {
        const row = data[r];
        const date = row[0];
        const studentName = row[1];

        if (!studentName) continue;

        // Efficient date filtering with early termination
        const entryDate = date ? new Date(date).toLocaleDateString() : "";
        if (entryDate !== today) {
          // If we've found today's entries and now hit a different date, we're done
          if (todayEntriesFound > 0) {
            console.log(
              `Early termination: processed ${todayEntriesFound} today's entries`
            );
            break;
          }
          continue;
        }

        todayEntriesFound++;

        // Extract row data safely
        const gender = row[3] || "";
        const teacher = row[4] || "";
        const outTime = row[5] || "";
        const backTime = row[6] || "";
        const holdNotice = row[7] || "";

        // Map-based lookup: If we haven't seen this student yet (processing newest first)
        if (!status.hasOwnProperty(studentName)) {
          if (backTime) {
            // Student has returned - they are available (don't add to status object)
            console.log(
              `${studentName} has returned (backTime: ${backTime}), marking as available`
            );
          } else if (outTime) {
            // Student is currently out
            status[studentName] = {
              gender: gender,
              teacher: teacher,
              outTime: outTime,
              backTime: "",
              holdNotice: "",
            };
          } else if (holdNotice) {
            // Student is waiting in line
            status[studentName] = {
              gender: gender,
              teacher: teacher,
              outTime: "",
              backTime: "",
              holdNotice: holdNotice,
            };
          }
        }
      } catch (rowError) {
        console.warn(`Error processing log row ${r}:`, rowError.message);
        // Continue with next row instead of breaking entire function
        continue;
      }
    }

    console.log(
      `Fallback status loaded for ${
        Object.keys(status).length
      } students (processed ${todayEntriesFound} entries)`
    );
    return status;
  } catch (error) {
    console.error("Error in _getCurrentRestroomStatusFallback:", error);
    // Don't throw - return empty status to prevent cascading failures
    return {};
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
    console.log("fetchData: Starting data fetch...");

    // Get student roster from the daily sheet (read-only)
    console.log("fetchData: Getting latest daily sheet...");
    const dailySheet = getLatestDailySheet();
    console.log("fetchData: Daily sheet found:", dailySheet.getName());

    console.log("fetchData: Reading student roster...");
    const roster = _getStudentRoster(dailySheet);
    console.log("fetchData: Roster loaded with", roster.length, "students");

    // Get current restroom status from Log sheet
    console.log("fetchData: Getting current restroom status...");
    const currentStatus = _getCurrentRestroomStatus();
    console.log(
      "fetchData: Status loaded for",
      Object.keys(currentStatus).length,
      "students"
    );

    // Debug: Log current status for troubleshooting
    const studentsWithStatus = Object.keys(currentStatus).filter(
      (name) =>
        currentStatus[name].outTime ||
        currentStatus[name].holdNotice ||
        currentStatus[name].backTime
    );
    console.log(
      `Students with current status (${studentsWithStatus.length}):`,
      studentsWithStatus
    );

    // Combine roster with current status
    const result = [];
    const queue = { girls: [], boys: [] };

    for (const student of roster) {
      const status = currentStatus[student.name] || {
        gender: "",
        teacher: "",
        outTime: "",
        backTime: "",
        holdNotice: "",
      };

      // Check usage limit for students who are currently active
      let usageLimitReached = false;
      if (status.outTime || status.holdNotice) {
        try {
          const usageCheck = api_checkStudentUsageLimit(student.name);
          if (usageCheck.success && !usageCheck.canUseRestroom) {
            usageLimitReached = true;
            console.log(`Student ${student.name} has reached usage limit: ${usageCheck.reason}`);
          }
        } catch (error) {
          console.warn(`Error checking usage limit for ${student.name}:`, error.message);
        }
      }

      result.push({
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: status.gender,
        teacher: status.teacher,
        outTime: status.outTime,
        backTime: status.backTime,
        holdNotice: status.holdNotice,
        usageLimitReached: usageLimitReached,
      });

      // Debug: Log first few students with any status
      if (
        result.length <= 3 &&
        (status.outTime || status.holdNotice || status.backTime)
      ) {
        console.log(`Student ${student.name} status:`, status);
      }

      // Build queue lists (don't add students who have reached usage limit)
      if (status.holdNotice && !status.outTime && !usageLimitReached) {
        // They have been put on hold (waiting in line)
        if (status.gender === "G") queue.girls.push(student.name);
        else if (status.gender === "B") queue.boys.push(student.name);
      }
    }

    console.log(`Loaded ${result.length} students from roster`);
    console.log(
      `Queue - Girls: ${queue.girls.length}, Boys: ${queue.boys.length}`
    );

    const finalResult = { students: result, queue };
    console.log("fetchData: Returning result with", result.length, "students");
    return finalResult;
  } catch (error) {
    console.error("Error in fetchData:", error);
    console.error("Error stack:", error.stack);
    
    // Return error structure instead of throwing
    return {
      students: [
        {
          name: "Error: " + error.message,
          id: "000",
          nameId: "Error",
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: "",
        },
      ],
      queue: { girls: [], boys: [] },
    };
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
  console.log("=== updateStatus START ===");
  console.log(
    `updateStatus called: ${studentName}, ${action}, ${teacherName}, ${gender}`
  );

  // Validate required parameters
  if (!studentName || studentName.trim() === "") {
    throw new Error("Student name is required");
  }

  if (!teacherName || teacherName.trim() === "") {
    throw new Error("Teacher name is required");
  }

  if (action === "out" && (!gender || gender.trim() === "")) {
    throw new Error(
      "Gender (G or B) must be selected before marking student out"
    );
  }

  if (gender && gender !== "G" && gender !== "B") {
    throw new Error("Gender must be either 'G' or 'B'");
  }

  // Get student ID from the roster
  const dailySheet = getLatestDailySheet();
  console.log("Got daily sheet:", dailySheet.getName());

  const roster = _getStudentRoster(dailySheet);
  console.log("Loaded roster:", roster.length, "students");

  const student = roster.find((s) => s.name === studentName);
  console.log("Found student:", student);

  const studentId = student ? student.id : "";
  console.log("Student ID:", studentId);

  const now = new Date();
  console.log("Current time:", now);

  if (action === "out") {
    try {
      console.log("Checking usage limit before allowing out action...");
      // Check if student has already used restroom in current period
      const usageCheck = api_checkStudentUsageLimit(studentName);
      if (usageCheck.success && !usageCheck.canUseRestroom) {
        console.log(`Student ${studentName} has reached usage limit: ${usageCheck.reason}`);
        throw new Error(`Student has already used the restroom once in the ${usageCheck.currentPeriod || 'current period'}.`);
      }

      console.log("Usage limit check passed, proceeding with out action...");
      console.log("Checking current student status...");
      // First check if this student is currently waiting in line
      const currentStatus = _getCurrentRestroomStatus();
      const studentStatus = currentStatus[studentName];

      if (studentStatus && studentStatus.holdNotice && !studentStatus.outTime) {
        console.log(
          "Student is waiting in line, updating existing log entry with out time"
        );
        // Student is waiting in line - update their existing log entry with out time
        _updateWaitingEntryToOut(
          studentName,
          studentId,
          gender,
          teacherName,
          now
        );
        console.log("Waiting entry updated to out successfully");
      } else {
        console.log("Checking if restroom is available for gender:", gender);
        // Normal flow - check if restroom is free for that gender
        const otherOut = _checkOtherOut(gender);
        console.log("Other student out:", otherOut);

        if (otherOut) {
          console.log("Restroom occupied, adding to waiting list");
          // Someone of the same gender is already out. Add to waiting list
          let waitingCount = 0;
          for (const [name, status] of Object.entries(currentStatus)) {
            if (
              status.gender === gender &&
              status.holdNotice &&
              !status.outTime
            ) {
              waitingCount++;
            }
          }
          const position = waitingCount + 1;
          const notice = `Waiting in line. Position ${position}.`;

          console.log("Logging waiting entry:", {
            studentName,
            studentId,
            gender,
            teacherName,
            notice,
          });
          // Log the waiting entry
          _logWaitingEntry(studentName, studentId, gender, teacherName, notice);
          console.log("Waiting entry logged successfully");
        } else {
          console.log("Restroom available, marking student out");
          // Mark student as out - log the out entry
          console.log("Logging out entry:", {
            studentName,
            studentId,
            gender,
            teacherName,
            outTime: now,
          });
          _logOutEntry(studentName, studentId, gender, teacherName, now);
          console.log("Out entry logged successfully");
        }
      }
    } catch (logError) {
      console.error("Error during out action logging:", logError);
      throw new Error(`Failed to log out action: ${logError.message}`);
    }
  } else if (action === "back") {
    // Mark student as back - complete the log entry
    _logBackEntry(studentName, studentId, gender, teacherName, now);
    console.log("✓ Back entry logged successfully");
  }
  
  console.log("=== updateStatus END (SUCCESS) ===");
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

/** Log a waiting entry to the Log sheet */
function _logWaitingEntry(
  studentName,
  studentId,
  gender,
  teacherName,
  holdNotice
) {
  const ss = getSpreadsheet();
  let logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    logSheet = ss.insertSheet("Log");
    logSheet.appendRow([
      "Date",
      "Student Name",
      "Student ID",
      "Gender",
      "Teacher",
      "Out Time",
      "Back Time",
      "Hold Notice",
    ]);
  }

  const date = new Date().toLocaleDateString();
  // A: Date, B: Student Name, C: Student ID, D: Gender, E: Teacher, F: Out Time, G: Back Time, H: Hold Notice
  const row = [
    date,
    studentName,
    studentId,
    gender,
    teacherName,
    "",
    "",
    holdNotice,
  ];
  logSheet.appendRow(row);
}

/**
 * Update an existing waiting entry to mark the student as out
 * Finds the most recent waiting entry for this student and adds the out time
 */
function _updateWaitingEntryToOut(
  studentName,
  studentId,
  gender,
  teacherName,
  outTime
) {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  if (!logSheet) return;

  const date = new Date().toLocaleDateString();
  const outTimeFormatted = _formatTimeToHHMM(outTime);

  // Find the most recent "waiting" entry for this student today and update it
  const data = logSheet.getDataRange().getValues();

  for (let r = data.length - 1; r >= 1; r--) {
    const row = data[r];
    const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : "";
    const entryName = row[1];
    const entryOutTime = row[5];
    const entryBackTime = row[6];
    const entryHoldNotice = row[7];

    if (
      entryDate === date &&
      entryName === studentName &&
      entryHoldNotice &&
      !entryOutTime &&
      !entryBackTime
    ) {
      // Found the waiting entry - update it with out time and clear hold notice
      console.log(
        `Updating waiting entry for ${studentName} at row ${
          r + 1
        } with out time: ${outTimeFormatted}`
      );
      logSheet.getRange(r + 1, 6).setValue(outTimeFormatted); // Out Time (column F)
      logSheet.getRange(r + 1, 8).setValue(""); // Clear Hold Notice (column H)
      
      // Recalculate queue positions for remaining waiting students of the same gender
      _recalculateQueuePositions(gender);
      return;
    }
  }

  // If no waiting entry found, create a new out entry (fallback)
  console.log(
    `No waiting entry found for ${studentName}, creating new out entry`
  );
  _logOutEntry(studentName, studentId, gender, teacherName, outTime);
}

/**
 * Recalculate and update queue positions for remaining waiting students of the same gender
 * This should be called after a student moves from waiting to out
 * @param {string} gender - The gender ("G" or "B") to recalculate positions for
 */
function _recalculateQueuePositions(gender) {
  console.log(`Recalculating queue positions for gender: ${gender}`);
  
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  if (!logSheet) return;

  const date = new Date().toLocaleDateString();
  const data = logSheet.getDataRange().getValues();
  
  // Find all waiting students of the same gender today
  const waitingEntries = [];
  
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : "";
    const entryName = row[1];
    const entryGender = row[3];
    const entryOutTime = row[5];
    const entryBackTime = row[6];
    const entryHoldNotice = row[7];
    
    // Find students who are waiting (have hold notice, no out time, no back time)
    if (
      entryDate === date &&
      entryGender === gender &&
      entryHoldNotice &&
      !entryOutTime &&
      !entryBackTime
    ) {
      // Extract current position from hold notice
      const positionMatch = entryHoldNotice.match(/Position (\d+)/);
      const currentPosition = positionMatch ? parseInt(positionMatch[1]) : 999;
      
      waitingEntries.push({
        rowIndex: r,
        name: entryName,
        currentPosition: currentPosition,
        holdNotice: entryHoldNotice
      });
    }
  }
  
  if (waitingEntries.length === 0) {
    console.log(`No waiting students found for gender ${gender}`);
    return;
  }
  
  // Sort by current position to maintain order
  waitingEntries.sort((a, b) => a.currentPosition - b.currentPosition);
  
  console.log(`Found ${waitingEntries.length} waiting students to reposition:`, 
    waitingEntries.map(e => `${e.name} (pos ${e.currentPosition})`));
  
  // Update positions sequentially (1, 2, 3, etc.)
  for (let i = 0; i < waitingEntries.length; i++) {
    const entry = waitingEntries[i];
    const newPosition = i + 1;
    const newHoldNotice = `Waiting in line. Position ${newPosition}.`;
    
    // Only update if position changed
    if (entry.currentPosition !== newPosition) {
      console.log(`Updating ${entry.name} from position ${entry.currentPosition} to ${newPosition}`);
      logSheet.getRange(entry.rowIndex + 1, 8).setValue(newHoldNotice); // Column H (Hold Notice)
    } else {
      console.log(`${entry.name} position ${newPosition} unchanged`);
    }
  }
  
  console.log(`Queue position recalculation complete for gender ${gender}`);
}

/**
 * Format a Date object to "H:MM AM/PM" format (12-hour time)
 * @param {Date} date - The date object to format
 * @returns {string} Time in "H:MM AM/PM" format (e.g., "2:30 PM", "9:05 AM")
 */
function _formatTimeToHHMM(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Parse a time value (string or Date) back to a Date object
 * @param {string|Date} timeValue - Time string like "2:30 PM" or Date object
 * @param {Date} baseDate - The base date to use (defaults to today)
 * @returns {Date} Date object with the parsed time
 */
function _parseTimeString(timeValue, baseDate = new Date()) {
  console.log(
    `_parseTimeString called with: "${timeValue}" (type: ${typeof timeValue})`
  );

  if (!timeValue) {
    throw new Error(`Time value is empty or null: ${timeValue}`);
  }

  // If it's already a Date object, return it directly
  if (timeValue instanceof Date) {
    console.log(`Already a Date object: ${timeValue}`);
    return timeValue;
  }

  // If it looks like an ISO date string, parse it as a Date
  if (
    typeof timeValue === "string" &&
    timeValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  ) {
    console.log(`Detected ISO date string, parsing as Date`);
    const dateObj = new Date(timeValue);
    console.log(`Parsed ISO date: ${dateObj}`);
    return dateObj;
  }

  // Convert to string if not already
  const timeString = timeValue.toString().trim();
  console.log(`Converted to string: "${timeString}"`);

  // Handle various possible formats
  let timeMatch;

  // Try "H:MM AM/PM" format (our expected format)
  timeMatch = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (timeMatch) {
    console.log(
      `Matched AM/PM format: hours=${timeMatch[1]}, minutes=${timeMatch[2]}, ampm=${timeMatch[3]}`
    );
  } else {
    // Try "HH:MM" format (24-hour)
    timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      console.log(
        `Matched 24-hour format: hours=${timeMatch[1]}, minutes=${timeMatch[2]}`
      );
      // Assume 24-hour format, add AM/PM
      const hour = parseInt(timeMatch[1], 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      timeMatch[3] = ampm;
      if (hour > 12) {
        timeMatch[1] = (hour - 12).toString();
      } else if (hour === 0) {
        timeMatch[1] = "12";
      }
      console.log(
        `Converted to AM/PM: hours=${timeMatch[1]}, ampm=${timeMatch[3]}`
      );
    }
  }

  if (!timeMatch) {
    throw new Error(
      `Time string doesn't match expected formats (H:MM AM/PM or HH:MM): "${timeString}"`
    );
  }

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

  console.log(
    `Parsed values: hours=${hours}, minutes=${minutes}, ampm=${ampm}`
  );

  // Validate parsed values
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 1 ||
    hours > 12 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(
      `Invalid time components: hours=${hours}, minutes=${minutes}`
    );
  }

  // Convert to 24-hour format if AM/PM is specified
  if (ampm) {
    if (ampm === "AM" && hours === 12) {
      hours = 0; // 12:XX AM is 0:XX in 24-hour format
    } else if (ampm === "PM" && hours !== 12) {
      hours += 12; // 1:XX PM is 13:XX, etc.
    }
    // 12:XX PM stays as 12:XX
  }

  console.log(`Final 24-hour format: hours=${hours}, minutes=${minutes}`);

  // Create a new Date object with the same date but the parsed time
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0); // Set hours, minutes, seconds=0, milliseconds=0

  console.log(`Created Date object: ${result}`);
  return result;
}
/** Log an out entry to the Log sheet */
function _logOutEntry(studentName, studentId, gender, teacherName, outTime) {
  const ss = getSpreadsheet();
  let logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    logSheet = ss.insertSheet("Log");
    logSheet.appendRow([
      "Date",
      "Student Name",
      "Student ID",
      "Gender",
      "Teacher",
      "Out Time",
      "Back Time",
      "Hold Notice",
    ]);
  }

  const date = new Date().toLocaleDateString();
  const outTimeFormatted = _formatTimeToHHMM(outTime);

  // A: Date, B: Student Name, C: Student ID, D: Gender, E: Teacher, F: Out Time, G: Back Time, H: Hold Notice
  const row = [
    date,
    studentName,
    studentId,
    gender,
    teacherName,
    outTimeFormatted,
    "",
    "",
  ];
  logSheet.appendRow(row);
}

/** Log a back entry (complete the transaction) to the Log sheet */
function _logBackEntry(studentName, studentId, gender, teacherName, backTime) {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    console.log("No Log sheet found in _logBackEntry");
    return;
  }

  const date = new Date().toLocaleDateString();
  const backTimeFormatted = _formatTimeToHHMM(backTime);

  console.log(
    `_logBackEntry: Looking for out entry for ${studentName} on ${date}`
  );

  // Find the most recent "out" entry for this student today and update it
  const data = logSheet.getDataRange().getValues();
  console.log(
    `_logBackEntry: Checking ${data.length - 1} rows for existing out entry`
  );

  for (let r = data.length - 1; r >= 1; r--) {
    const row = data[r];
    const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : "";
    const entryName = row[1];
    const entryOutTime = row[5];
    const entryBackTime = row[6];

    console.log(
      `_logBackEntry: Row ${
        r + 1
      } - Date: "${entryDate}", Name: "${entryName}", OutTime: "${entryOutTime}", BackTime: "${entryBackTime}"`
    );

    if (
      entryDate === date &&
      entryName === studentName &&
      entryOutTime &&
      !entryBackTime
    ) {
      // Found the out entry - update it with back time
      console.log(
        `_logBackEntry: Found matching out entry at row ${
          r + 1
        }, updating with back time: ${backTimeFormatted}`
      );
      logSheet.getRange(r + 1, 7).setValue(backTimeFormatted); // Back Time (column G)
      console.log(
        `_logBackEntry: Successfully updated existing entry for ${studentName}`
      );
      
      // When a student returns, recalculate queue positions for their gender
      // This ensures the next student in line gets the correct position
      _recalculateQueuePositions(gender);
      return;
    }
  }

  // If no out entry found, create a new complete entry
  console.log(
    `_logBackEntry: No matching out entry found for ${studentName}, creating new entry`
  );
  const row = [
    date,
    studentName,
    studentId,
    gender,
    teacherName,
    "",
    backTimeFormatted,
    "",
  ];
  logSheet.appendRow(row);
  console.log(`_logBackEntry: Created new back-only entry for ${studentName}`);
}

/** Serve the HTML + client */
function doGet(e) {
  // Default to main app
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
    console.log("Current user email:", userEmail);

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
    const teacherList = TEACHER_DATA.map((teacher) => {
      const [lastName, email, title] = teacher;
      return `${title}${lastName}`;
    });

    // Add a fallback option if user is not in the list
    if (!detectedTeacher) {
      teacherList.push("Other Teacher");
      detectedTeacher = "Other Teacher";
    }

    console.log("Detected teacher:", detectedTeacher);

    return {
      userEmail: userEmail,
      detectedTeacher: detectedTeacher,
      teacherList: teacherList,
    };
  } catch (error) {
    console.error("Error getting current user info:", error);

    // Fallback - return the full teacher list without detection
    const teacherList = TEACHER_DATA.map((teacher) => {
      const [lastName, email, title] = teacher;
      return `${title}${lastName}`;
    });
    teacherList.push("Other Teacher");

    return {
      userEmail: null,
      detectedTeacher: "Other Teacher",
      teacherList: teacherList,
    };
  }
}

// Client-facing APIs

function api_getCurrentUserInfo() {
  return getCurrentUserInfo();
}

/**
 * Working api_fetchData with status integration
 */
function api_fetchData() {
  console.log("=== api_fetchData called ===");

  try {
    // Get student roster (we know this works)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log("Got roster with", roster.length, "students");

    // Get restroom status with proper error handling
    let currentStatus = {};
    try {
      currentStatus = _getCurrentRestroomStatus();
      console.log(
        "Got restroom status for",
        Object.keys(currentStatus).length,
        "students"
      );
    } catch (statusError) {
      console.warn(
        "Status loading failed, using empty status:",
        statusError.message
      );
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
        holdNotice: status.holdNotice || "",
      };

      students.push(studentData);

      // Add to queue if waiting
      if (status.holdNotice && !status.outTime) {
        if (status.gender === "G") queue.girls.push(student.name);
        else if (status.gender === "B") queue.boys.push(student.name);
      }
    }

    const result = { students: students, queue: queue };
    console.log("api_fetchData returning:", students.length, "students");
    return result;
  } catch (error) {
    console.error("Error in api_fetchData:", error);
    // Return error result
    return {
      students: [
        {
          name: "Error: " + error.message,
          id: "000",
          nameId: "Error",
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: "",
        },
      ],
      queue: { girls: [], boys: [] },
    };
  }
}

// Removed duplicate api_debugLogSheet function - using the complete version below

function api_updateStatus(studentName, action, teacherName, gender) {
  // ULTIMATE FAILSAFE: Wrap entire function to prevent ANY null returns
  try {
    console.log("=== API updateStatus START ===");
    console.log("API updateStatus called with:", {
      studentName,
      action,
      teacherName,
      gender,
    });

    // FAILSAFE: Ensure we NEVER return null
    let finalResponse = {
      success: false,
      error: "Function completed without setting response"
    };

  try {
    console.log("Step 1: Calling updateStatus...");
    updateStatus(studentName, action, teacherName, gender);
    console.log("Step 2: updateStatus completed successfully");

    console.log("Step 3: Calling fetchData...");
    let result;
    try {
      result = fetchData();
      console.log("Step 4: fetchData completed, result type:", typeof result);
      console.log("Step 4: fetchData result:", result);
    } catch (fetchError) {
      console.error("fetchData threw an error:", fetchError);
      finalResponse = {
        success: false,
        error: `Failed to fetch updated data: ${fetchError.message}`
      };
      console.log("=== API updateStatus END (FETCH ERROR) ===");
      console.log("Final response:", finalResponse);
      return finalResponse;
    }

    // Check if result is null or undefined
    if (!result) {
      console.error("fetchData returned null or undefined");
      finalResponse = {
        success: false,
        error: "fetchData returned null or undefined"
      };
    } else if (result.students && result.students.length === 1 && result.students[0].name && result.students[0].name.startsWith("Error:")) {
      // Check if fetchData returned an error structure
      const errorMessage = result.students[0].name.replace("Error: ", "");
      console.error("fetchData returned error structure:", errorMessage);
      finalResponse = {
        success: false,
        error: errorMessage,
        data: result
      };
    } else {
      // Return success structure with minimal data to avoid serialization issues
      finalResponse = {
        success: true,
        message: "Student status updated successfully",
        timestamp: new Date().toISOString(),
        studentCount: result.students ? result.students.length : 0
      };
      console.log("Step 5: Setting success response:", finalResponse);
    }
    
    console.log("=== API updateStatus END (SUCCESS PATH) ===");
    console.log("Final response:", finalResponse);
    return finalResponse;
  } catch (error) {
    console.error("=== API updateStatus ERROR ===");
    console.error("Error in api_updateStatus:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Return structured error response instead of throwing
    finalResponse = {
      success: false,
      error: error.message || "Unknown error occurred"
    };
    console.log("=== API updateStatus END (CATCH ERROR) ===");
    console.log("Final response:", finalResponse);
    return finalResponse;
  }
  
  } catch (ultimateError) {
    // ULTIMATE FAILSAFE: If anything goes wrong, return a structured error
    console.error("=== ULTIMATE FAILSAFE TRIGGERED ===");
    console.error("Ultimate error:", ultimateError);
    const ultimateResponse = {
      success: false,
      error: `Ultimate failsafe: ${ultimateError.message || ultimateError || "Unknown error"}`,
      timestamp: new Date().toISOString()
    };
    console.log("Ultimate failsafe response:", ultimateResponse);
    return ultimateResponse;
  }
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
  const row = [
    ts,
    studentObj.name || "",
    studentObj.id || "",
    studentObj.gender || "",
    studentObj.teacher || "",
  ];
  logSheet.appendRow(row);
  return { success: true };
}

/**
 * Search for students by name (first or last name)
 * Returns matching students from the daily roster sheet
 * @param {string} searchTerm - The search term (partial name)
 * @returns {Array} - Array of matching students with name and id
 */
function api_searchStudents(searchTerm) {
  try {
    console.log(`=== api_searchStudents called with term: "${searchTerm}" ===`);

    if (!searchTerm || searchTerm.trim().length < 1) {
      return {
        success: true,
        students: [],
        message: "Search term too short",
      };
    }

    const searchLower = searchTerm.trim().toLowerCase();

    // Get fresh roster from daily sheet
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);

    console.log(
      `Searching ${roster.length} students for term: "${searchTerm}"`
    );

    // Search by first name, last name, or full name
    const matchingStudents = roster.filter((student) => {
      const fullName = student.name.toLowerCase();
      const nameParts = fullName.split(" ");

      // Check if search term matches:
      // 1. Start of full name
      // 2. Start of first name
      // 3. Start of last name
      // 4. Anywhere in full name (for partial matches)
      return (
        fullName.startsWith(searchLower) ||
        nameParts.some((part) => part.startsWith(searchLower)) ||
        fullName.includes(searchLower)
      );
    });

    // Sort results by relevance (exact matches first, then partial)
    matchingStudents.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact start matches first
      const aStartsWithSearch = aName.startsWith(searchLower);
      const bStartsWithSearch = bName.startsWith(searchLower);

      if (aStartsWithSearch && !bStartsWithSearch) return -1;
      if (!aStartsWithSearch && bStartsWithSearch) return 1;

      // Then alphabetical
      return aName.localeCompare(bName);
    });

    // Limit results to prevent UI overload
    const limitedResults = matchingStudents.slice(0, 10);

    console.log(
      `Found ${matchingStudents.length} matches, returning ${limitedResults.length}`
    );

    return {
      success: true,
      students: limitedResults,
      totalMatches: matchingStudents.length,
      searchTerm: searchTerm,
    };
  } catch (error) {
    console.error("Error in api_searchStudents:", error);
    return {
      success: false,
      error: error.message,
      students: [],
    };
  }
}

/**
 * Get all students from the daily roster for dropdown display
 * @returns {Object} - All students from today's roster
 */
function api_getAllStudents() {
  try {
    console.log("=== api_getAllStudents called ===");

    // Get fresh roster from daily sheet
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);

    // Sort alphabetically by name
    roster.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Retrieved ${roster.length} students from daily roster`);

    return {
      success: true,
      students: roster,
      totalCount: roster.length,
    };
  } catch (error) {
    console.error("Error in api_getAllStudents:", error);
    return {
      success: false,
      error: error.message,
      students: [],
    };
  }
}

/**
 * Get the current active students (those who have been added to the management table)
 * This replaces the full roster view with only students currently being managed
 * @returns {Object} - Active students and their current status
 */
function api_getActiveStudents() {
  try {
    console.log("=== api_getActiveStudents called ===");

    // Get today's log entries to find students who have activity today
    const status = _getCurrentRestroomStatusFallback();
    console.log("Status object:", status);
    console.log("Status keys:", Object.keys(status));

    if (!status || typeof status !== 'object') {
      console.warn("Status object is null or invalid:", status);
      return {
        success: true,
        data: { students: [] },
        metadata: {
          timestamp: new Date().toISOString(),
          activeStudentCount: 0,
        },
        message: "No active students found (status object was null/invalid)"
      };
    }

    const activeStudents = [];

    // Convert status object to array of active students
    for (const [studentName, studentStatus] of Object.entries(status)) {
      console.log(`Processing student: ${studentName}`, studentStatus);

      // Check usage limit for active students (simplified to avoid errors)
      let usageLimitReached = false;
      try {
        const usageCheck = api_checkStudentUsageLimit(studentName);
        if (usageCheck && usageCheck.success && !usageCheck.canUseRestroom) {
          usageLimitReached = true;
          console.log(`Active student ${studentName} has reached usage limit: ${usageCheck.reason}`);
        }
      } catch (error) {
        console.warn(`Error checking usage limit for active student ${studentName}:`, error.message);
        // Continue processing even if usage check fails
        usageLimitReached = false;
      }

      const studentData = {
        name: studentName,
        id: studentStatus.id || "",
        nameId: studentName,
        gender: studentStatus.gender || "",
        teacher: studentStatus.teacher || "",
        outTime: studentStatus.outTime || "",
        backTime: studentStatus.backTime || "",
        holdNotice: studentStatus.holdNotice || "",
        usageLimitReached: usageLimitReached,
      };

      activeStudents.push(studentData);
    }

    console.log(`Found ${activeStudents.length} active students`);

    const result = {
      success: true,
      data: {
        students: activeStudents,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: activeStudents.length,
      },
    };

    console.log("Returning result:", result);
    return result;
  } catch (error) {
    console.error("Error in api_getActiveStudents:", error);
    console.error("Error stack:", error.stack);

    const errorResult = {
      success: false,
      error: error.message || "Unknown error",
      data: {
        students: [],
      },
    };

    console.log("Returning error result:", errorResult);
    return errorResult;
  }
}

/**
 * Simplified version of api_getActiveStudents without usage limit checks
 * @returns {Object} - Active students without usage limit validation
 */
function api_getActiveStudentsSimple() {
  try {
    console.log("=== api_getActiveStudentsSimple called ===");

    // Get today's log entries to find students who have activity today
    const status = _getCurrentRestroomStatusFallback();
    console.log("Status object:", status);
    console.log("Status keys:", Object.keys(status));

    if (!status || typeof status !== 'object') {
      console.warn("Status object is null or invalid:", status);
      return {
        success: true,
        data: { students: [] },
        metadata: {
          timestamp: new Date().toISOString(),
          activeStudentCount: 0,
        },
        message: "No active students found (status object was null/invalid)"
      };
    }

    const activeStudents = [];

    // Convert status object to array of active students (no usage limit check)
    for (const [studentName, studentStatus] of Object.entries(status)) {
      console.log(`Processing student: ${studentName}`, studentStatus);

      const studentData = {
        name: studentName,
        id: studentStatus.id || "",
        nameId: studentName,
        gender: studentStatus.gender || "",
        teacher: studentStatus.teacher || "",
        outTime: studentStatus.outTime || "",
        backTime: studentStatus.backTime || "",
        holdNotice: studentStatus.holdNotice || "",
        usageLimitReached: false, // Skip usage limit check
      };

      activeStudents.push(studentData);
    }

    console.log(`Found ${activeStudents.length} active students (simple version)`);

    const result = {
      success: true,
      data: {
        students: activeStudents,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: activeStudents.length,
      },
    };

    console.log("Returning simple result:", result);
    return result;
  } catch (error) {
    console.error("Error in api_getActiveStudentsSimple:", error);
    console.error("Error stack:", error.stack);

    return {
      success: false,
      error: error.message || "Unknown error",
      data: {
        students: [],
      },
    };
  }
}

/**
 * Direct version of getActiveStudents that reads Log sheet directly (like debug function)
 * @returns {Object} - Active students read directly from Log sheet
 */
function api_getActiveStudentsDirect() {
  try {
    console.log("=== api_getActiveStudentsDirect called ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      console.log("No Log sheet found");
      return {
        success: true,
        data: { students: [] },
        metadata: {
          timestamp: new Date().toISOString(),
          activeStudentCount: 0,
        },
        message: "No Log sheet found"
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Log sheet has ${data.length} total rows`);
    console.log(`Looking for entries from: ${today}`);
    
    const todayStudentActivity = {};
    const activeStudents = [];
    
    // Analyze all entries for today (same logic as debug function)
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      const id = row[2] || "";
      const gender = row[3] || "";
      const teacher = row[4] || "";
      const outTime = row[5] || "";
      const backTime = row[6] || "";
      const holdNotice = row[7] || "";
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        // Track this student's activity
        if (!todayStudentActivity[studentName]) {
          todayStudentActivity[studentName] = [];
        }
        todayStudentActivity[studentName].push({
          id: id,
          gender: gender,
          teacher: teacher,
          outTime: outTime,
          backTime: backTime,
          holdNotice: holdNotice,
          rowIndex: r + 1
        });
      }
    }
    
    // Analyze current status for each student (same logic as debug function)
    for (const [studentName, activities] of Object.entries(todayStudentActivity)) {
      // Get the most recent activity (last in array)
      const latestActivity = activities[activities.length - 1];
      
      if (latestActivity.backTime) {
        // Student has returned - not active
        console.log(`${studentName}: Returned (backTime: ${latestActivity.backTime})`);
      } else if (latestActivity.outTime) {
        // Student is currently out
        console.log(`${studentName}: Currently OUT since ${latestActivity.outTime}`);
        activeStudents.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: latestActivity.outTime,
          backTime: "",
          holdNotice: "",
          usageLimitReached: false,
        });
      } else if (latestActivity.holdNotice) {
        // Student is waiting
        console.log(`${studentName}: WAITING (${latestActivity.holdNotice})`);
        activeStudents.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: "",
          backTime: "",
          holdNotice: latestActivity.holdNotice,
          usageLimitReached: false,
        });
      }
    }
    
    console.log(`Found ${activeStudents.length} active students (direct method)`);
    
    const result = {
      success: true,
      data: {
        students: activeStudents,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: activeStudents.length,
      },
    };
    
    console.log("Returning direct result:", result);
    return result;
    
  } catch (error) {
    console.error("Error in api_getActiveStudentsDirect:", error);
    console.error("Error stack:", error.stack);

    return {
      success: false,
      error: error.message || "Unknown error",
      data: {
        students: [],
      },
    };
  }
}

/**
 * Test spreadsheet access to see if that's the issue
 * @returns {Object} - Spreadsheet access test result
 */
function api_testSpreadsheetAccess() {
  try {
    console.log("=== api_testSpreadsheetAccess called ===");
    
    const ss = getSpreadsheet();
    console.log("Got spreadsheet:", ss ? "SUCCESS" : "FAILED");
    
    if (!ss) {
      return {
        success: false,
        error: "Could not access spreadsheet",
        data: { students: [] }
      };
    }
    
    const logSheet = ss.getSheetByName("Log");
    console.log("Got Log sheet:", logSheet ? "SUCCESS" : "FAILED");
    
    if (!logSheet) {
      return {
        success: false,
        error: "Could not access Log sheet",
        data: { students: [] }
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    console.log("Got data range:", data ? `${data.length} rows` : "FAILED");
    
    return {
      success: true,
      message: "Spreadsheet access test successful",
      data: {
        students: [],
        spreadsheetAccess: true,
        logSheetAccess: true,
        totalRows: data.length
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: 0,
      }
    };
    
  } catch (error) {
    console.error("Error in api_testSpreadsheetAccess:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      data: { students: [] }
    };
  }
}

/**
 * Simple test function to verify deployment is working
 * @returns {Object} - Simple test response
 */
function api_testDeployment() {
  try {
    console.log("=== api_testDeployment called ===");
    
    return {
      success: true,
      message: "Deployment is working!",
      timestamp: new Date().toISOString(),
      data: {
        students: [
          {
            name: "Test Student 1",
            id: "12345",
            nameId: "Test Student 1",
            gender: "B",
            teacher: "Test Teacher",
            outTime: "2:30 PM",
            backTime: "",
            holdNotice: "",
            usageLimitReached: false,
          },
          {
            name: "Test Student 2",
            id: "67890",
            nameId: "Test Student 2",
            gender: "G",
            teacher: "Test Teacher",
            outTime: "",
            backTime: "",
            holdNotice: "Waiting in line. Position 1.",
            usageLimitReached: false,
          }
        ]
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: 2,
      }
    };
  } catch (error) {
    console.error("Error in api_testDeployment:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      data: { students: [] }
    };
  }
}

/**
 * Hybrid function that uses debug logic but returns student data format
 * @returns {Object} - Active students using debug function's working logic
 */
function api_getActiveStudentsHybrid() {
  try {
    console.log("=== api_getActiveStudentsHybrid called ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      console.log("No Log sheet found");
      return {
        success: true,
        data: { students: [] },
        metadata: {
          timestamp: new Date().toISOString(),
          activeStudentCount: 0,
        },
        message: "No Log sheet found"
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Log sheet has ${data.length} total rows`);
    console.log(`Looking for entries from: ${today}`);
    
    let todayEntries = 0;
    let activeStudents = 0;
    let studentsOut = 0;
    let studentsWaiting = 0;
    const activeStudentsList = [];
    const todayStudentActivity = {};
    
    // Analyze all entries for today (EXACT same logic as working debug function)
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      const id = row[2] || "";
      const gender = row[3] || "";
      const teacher = row[4] || "";
      const outTime = row[5] || "";
      const backTime = row[6] || "";
      const holdNotice = row[7] || "";
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        todayEntries++;
        
        // Track this student's activity
        if (!todayStudentActivity[studentName]) {
          todayStudentActivity[studentName] = [];
        }
        todayStudentActivity[studentName].push({
          id: id,
          gender: gender,
          teacher: teacher,
          outTime: outTime,
          backTime: backTime,
          holdNotice: holdNotice,
          rowIndex: r + 1
        });
      }
    }
    
    // Analyze current status for each student (EXACT same logic as working debug function)
    for (const [studentName, activities] of Object.entries(todayStudentActivity)) {
      // Get the most recent activity (last in array)
      const latestActivity = activities[activities.length - 1];
      
      if (latestActivity.backTime) {
        // Student has returned - not active
        console.log(`${studentName}: Returned (backTime: ${latestActivity.backTime})`);
      } else if (latestActivity.outTime) {
        // Student is currently out
        studentsOut++;
        activeStudents++;
        console.log(`${studentName}: Currently OUT since ${latestActivity.outTime}`);
        
        activeStudentsList.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: latestActivity.outTime,
          backTime: "",
          holdNotice: "",
          usageLimitReached: false,
        });
      } else if (latestActivity.holdNotice) {
        // Student is waiting
        studentsWaiting++;
        activeStudents++;
        console.log(`${studentName}: WAITING (${latestActivity.holdNotice})`);
        
        activeStudentsList.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: "",
          backTime: "",
          holdNotice: latestActivity.holdNotice,
          usageLimitReached: false,
        });
      }
    }
    
    console.log(`Found ${activeStudentsList.length} active students (hybrid method)`);
    
    const result = {
      success: true,
      data: {
        students: activeStudentsList,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: activeStudentsList.length,
      },
    };
    
    console.log("Returning hybrid result:", result);
    return result;
    
  } catch (error) {
    console.error("Error in api_getActiveStudentsHybrid:", error);
    console.error("Error stack:", error.stack);

    return {
      success: false,
      error: error.message || "Unknown error",
      data: {
        students: [],
      },
    };
  }
}

/**
 * Minimal test that returns debug-style data but with student format
 * @returns {Object} - Minimal test with student data
 */
function api_testMinimal() {
  try {
    console.log("=== api_testMinimal called ===");
    
    // Just return a simple structure like debug function but with student data
    return {
      success: true,
      message: "Minimal test working",
      data: {
        students: [
          {
            name: "Test Student",
            id: "123",
            nameId: "Test Student",
            gender: "B",
            teacher: "Test Teacher",
            outTime: "2:30 PM",
            backTime: "",
            holdNotice: "",
            usageLimitReached: false,
          }
        ]
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: 1,
      }
    };
    
  } catch (error) {
    console.error("Error in api_testMinimal:", error);
    return {
      success: false,
      error: error.message,
      data: { students: [] }
    };
  }
}

/**
 * Function that uses debug logic to find ONE active student
 * @returns {Object} - Single active student using debug logic
 */
function api_getOneActiveStudent() {
  try {
    console.log("=== api_getOneActiveStudent called ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return {
        success: true,
        data: { students: [] },
        metadata: {
          timestamp: new Date().toISOString(),
          activeStudentCount: 0,
        },
        message: "No Log sheet found"
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Looking for ONE active student from ${data.length} rows on ${today}`);
    
    // Use the EXACT same logic as debug function but stop at first active student
    const todayStudentActivity = {};
    
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      const id = row[2] || "";
      const gender = row[3] || "";
      const teacher = row[4] || "";
      const outTime = row[5] || "";
      const backTime = row[6] || "";
      const holdNotice = row[7] || "";
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        if (!todayStudentActivity[studentName]) {
          todayStudentActivity[studentName] = [];
        }
        todayStudentActivity[studentName].push({
          id: id,
          gender: gender,
          teacher: teacher,
          outTime: outTime,
          backTime: backTime,
          holdNotice: holdNotice,
          rowIndex: r + 1
        });
      }
    }
    
    // Find the first active student
    for (const [studentName, activities] of Object.entries(todayStudentActivity)) {
      const latestActivity = activities[activities.length - 1];
      
      if (!latestActivity.backTime && (latestActivity.outTime || latestActivity.holdNotice)) {
        // Found an active student!
        console.log(`Found active student: ${studentName}`);
        
        const activeStudent = {
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: latestActivity.outTime,
          backTime: "",
          holdNotice: latestActivity.holdNotice,
          usageLimitReached: false,
        };
        
        return {
          success: true,
          data: {
            students: [activeStudent],
          },
          metadata: {
            timestamp: new Date().toISOString(),
            activeStudentCount: 1,
          },
        };
      }
    }
    
    // No active students found
    return {
      success: true,
      data: { students: [] },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: 0,
      },
      message: "No active students found"
    };
    
  } catch (error) {
    console.error("Error in api_getOneActiveStudent:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      data: { students: [] }
    };
  }
}

/**
 * Exact copy of debug function but returns student format
 * @returns {Object} - Student data using exact debug logic
 */
function api_debugAsStudents() {
  try {
    console.log("=== DEBUG AS STUDENTS: Analyzing Log Sheet ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return {
        success: true,
        data: { students: [] },
        metadata: {
          timestamp: new Date().toISOString(),
          activeStudentCount: 0,
        },
        message: "No Log sheet found"
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Log sheet has ${data.length} total rows`);
    console.log(`Looking for entries from: ${today}`);
    
    let todayEntries = 0;
    let activeStudents = 0;
    let studentsOut = 0;
    let studentsWaiting = 0;
    const activeStudentNames = [];
    const todayStudentActivity = {};
    const studentsList = []; // This is the only addition
    
    // EXACT same logic as debug function
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      const outTime = row[5] || "";
      const backTime = row[6] || "";
      const holdNotice = row[7] || "";
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        todayEntries++;
        
        if (!todayStudentActivity[studentName]) {
          todayStudentActivity[studentName] = [];
        }
        todayStudentActivity[studentName].push({
          outTime: outTime,
          backTime: backTime,
          holdNotice: holdNotice,
          rowIndex: r + 1,
          id: row[2] || "",
          gender: row[3] || "",
          teacher: row[4] || ""
        });
      }
    }
    
    // EXACT same analysis as debug function
    for (const [studentName, activities] of Object.entries(todayStudentActivity)) {
      const latestActivity = activities[activities.length - 1];
      
      if (latestActivity.backTime) {
        console.log(`${studentName}: Returned (backTime: ${latestActivity.backTime})`);
      } else if (latestActivity.outTime) {
        studentsOut++;
        activeStudents++;
        activeStudentNames.push(`${studentName} (OUT since ${latestActivity.outTime})`);
        console.log(`${studentName}: Currently OUT since ${latestActivity.outTime}`);
        
        // Add to students list
        studentsList.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: latestActivity.outTime,
          backTime: "",
          holdNotice: "",
          usageLimitReached: false,
        });
      } else if (latestActivity.holdNotice) {
        studentsWaiting++;
        activeStudents++;
        activeStudentNames.push(`${studentName} (WAITING: ${latestActivity.holdNotice})`);
        console.log(`${studentName}: WAITING (${latestActivity.holdNotice})`);
        
        // Add to students list
        studentsList.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: "",
          backTime: "",
          holdNotice: latestActivity.holdNotice,
          usageLimitReached: false,
        });
      }
    }
    
    // Return in student format instead of debug format
    const result = {
      success: true,
      data: {
        students: studentsList,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: studentsList.length,
      },
      debugInfo: {
        todayEntries: todayEntries,
        activeStudents: activeStudents,
        studentsOut: studentsOut,
        studentsWaiting: studentsWaiting,
        activeStudentNames: activeStudentNames
      }
    };
    
    console.log("Debug as students result:", result);
    return result;
    
  } catch (error) {
    console.error("Error in api_debugAsStudents:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      data: { students: [] }
    };
  }
}

/**
 * Test with the absolute simplest student object possible
 * @returns {Object} - Simplest possible student data
 */
function api_testSimplestStudent() {
  try {
    console.log("=== api_testSimplestStudent called ===");
    
    // Return the absolute simplest student object
    const result = {
      success: true,
      data: {
        students: [
          {
            name: "Test Student"
          }
        ]
      }
    };
    
    console.log("Returning simplest result:", result);
    return result;
    
  } catch (error) {
    console.error("Error in api_testSimplestStudent:", error);
    return {
      success: false,
      error: error.message,
      data: { students: [] }
    };
  }
}

/**
 * Test reading real Log data but with minimal processing
 * @returns {Object} - Real Log data with minimal processing
 */
function api_testRealLogMinimal() {
  try {
    console.log("=== api_testRealLogMinimal called ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return {
        success: true,
        data: { students: [] },
        message: "No Log sheet found"
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Processing ${data.length} rows for ${today}`);
    
    // Find just the first student with today's data
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        console.log(`Found today's entry for: ${studentName}`);
        
        // Return just this one student with minimal data
        return {
          success: true,
          data: {
            students: [
              {
                name: studentName
              }
            ]
          }
        };
      }
    }
    
    // No students found for today
    return {
      success: true,
      data: { students: [] },
      message: "No students found for today"
    };
    
  } catch (error) {
    console.error("Error in api_testRealLogMinimal:", error);
    return {
      success: false,
      error: error.message,
      data: { students: [] }
    };
  }
}

/**
 * Test with more complete student object from real Log data
 * @returns {Object} - More complete student data from Log
 */
function api_testRealLogComplete() {
  try {
    console.log("=== api_testRealLogComplete called ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return {
        success: true,
        data: { students: [] },
        message: "No Log sheet found"
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Processing ${data.length} rows for ${today}`);
    
    const students = [];
    
    // Find all students with today's data and check if they're active
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      const id = row[2] || "";
      const gender = row[3] || "";
      const teacher = row[4] || "";
      const outTime = row[5] || "";
      const backTime = row[6] || "";
      const holdNotice = row[7] || "";
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        // Check if student is active (has outTime but no backTime, or has holdNotice)
        if ((outTime && !backTime) || holdNotice) {
          console.log(`Found active student: ${studentName}`);
          
          students.push({
            name: studentName,
            id: id,
            nameId: studentName,
            gender: gender,
            teacher: teacher,
            outTime: outTime,
            backTime: backTime,
            holdNotice: holdNotice,
            usageLimitReached: false
          });
          
          // Stop after finding first active student to keep it simple
          break;
        }
      }
    }
    
    console.log(`Found ${students.length} active students`);
    
    return {
      success: true,
      data: {
        students: students
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: students.length
      }
    };
    
  } catch (error) {
    console.error("Error in api_testRealLogComplete:", error);
    return {
      success: false,
      error: error.message,
      data: { students: [] }
    };
  }
}

/**
 * Test adding fields one by one to find the problematic field
 * @returns {Object} - Student data with fields added incrementally
 */
function api_testFieldByField() {
  try {
    console.log("=== api_testFieldByField called ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return {
        success: true,
        data: { students: [] },
        message: "No Log sheet found"
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    // Find first student with today's data
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        console.log(`Found student: ${studentName}`);
        
        // Start with just name and add fields one by one
        const rawOutTime = row[5];
        const rawBackTime = row[6];
        const rawHoldNotice = row[7];
        
        // Sanitize the time fields to prevent serialization issues
        const sanitizeField = (field) => {
          if (field === null || field === undefined) return "";
          if (typeof field === 'string') return field;
          if (typeof field === 'number') return field.toString();
          if (field instanceof Date) return field.toLocaleTimeString();
          return String(field); // Convert anything else to string
        };
        
        const student = {
          name: studentName,
          id: row[2] || "",
          nameId: studentName,
          gender: row[3] || "",
          teacher: row[4] || "",
          outTime: sanitizeField(rawOutTime),
          backTime: sanitizeField(rawBackTime),
          holdNotice: sanitizeField(rawHoldNotice),
          usageLimitReached: false
        };
        
        console.log("Student object:", student);
        
        return {
          success: true,
          data: {
            students: [student]
          }
        };
      }
    }
    
    return {
      success: true,
      data: { students: [] },
      message: "No students found for today"
    };
    
  } catch (error) {
    console.error("Error in api_testFieldByField:", error);
    return {
      success: false,
      error: error.message,
      data: { students: [] }
    };
  }
}

/**
 * FINAL WORKING VERSION - Get all active students with sanitized fields
 * @returns {Object} - All active students with properly sanitized data
 */
function api_getActiveStudentsFinal() {
  try {
    console.log("=== api_getActiveStudentsFinal called ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return {
        success: true,
        data: { students: [] },
        metadata: {
          timestamp: new Date().toISOString(),
          activeStudentCount: 0,
        },
        message: "No Log sheet found"
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Processing ${data.length} rows for ${today}`);
    
    const todayStudentActivity = {};
    const activeStudents = [];
    
    // Sanitize function to prevent serialization issues
    const sanitizeField = (field) => {
      if (field === null || field === undefined) return "";
      if (typeof field === 'string') return field;
      if (typeof field === 'number') return field.toString();
      if (field instanceof Date) return field.toLocaleTimeString();
      return String(field);
    };
    
    // Collect all today's entries for each student
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        if (!todayStudentActivity[studentName]) {
          todayStudentActivity[studentName] = [];
        }
        todayStudentActivity[studentName].push({
          id: row[2] || "",
          gender: row[3] || "",
          teacher: row[4] || "",
          outTime: sanitizeField(row[5]),
          backTime: sanitizeField(row[6]),
          holdNotice: sanitizeField(row[7]),
          rowIndex: r + 1
        });
      }
    }
    
    // Find all students with activity today (active + completed)
    for (const [studentName, activities] of Object.entries(todayStudentActivity)) {
      const latestActivity = activities[activities.length - 1];
      
      if (latestActivity.backTime) {
        // Student has completed their trip - include them with "ALREADY WENT" status
        console.log(`${studentName}: Completed trip (outTime: ${latestActivity.outTime}, backTime: ${latestActivity.backTime})`);
        activeStudents.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: latestActivity.outTime,
          backTime: latestActivity.backTime,
          holdNotice: "",
          usageLimitReached: false,
        });
      } else if (latestActivity.outTime) {
        // Student is currently out
        console.log(`${studentName}: Currently OUT since ${latestActivity.outTime}`);
        activeStudents.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: latestActivity.outTime,
          backTime: "",
          holdNotice: "",
          usageLimitReached: false,
        });
      } else if (latestActivity.holdNotice) {
        // Student is waiting
        console.log(`${studentName}: WAITING (${latestActivity.holdNotice})`);
        activeStudents.push({
          name: studentName,
          id: latestActivity.id,
          nameId: studentName,
          gender: latestActivity.gender,
          teacher: latestActivity.teacher,
          outTime: "",
          backTime: "",
          holdNotice: latestActivity.holdNotice,
          usageLimitReached: false,
        });
      }
    }
    
    console.log(`Found ${activeStudents.length} students with restroom activity today (active + completed)`);
    
    const result = {
      success: true,
      data: {
        students: activeStudents,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeStudentCount: activeStudents.length,
        totalStudentCount: activeStudents.length,
      },
    };
    
    console.log("Returning final result:", result);
    return result;
    
  } catch (error) {
    console.error("Error in api_getActiveStudentsFinal:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      data: { students: [] }
    };
  }
}

/**
 * Debug function to analyze Log sheet contents and active students
 * @returns {Object} - Debug information about Log sheet and active students
 */
function api_debugLogSheet() {
  try {
    console.log("=== DEBUG: Analyzing Log Sheet ===");
    
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return {
        success: true,
        message: "No Log sheet found",
        todayEntries: 0,
        activeStudents: 0,
        studentsOut: 0,
        studentsWaiting: 0,
        logSheetExists: false
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Log sheet has ${data.length} total rows`);
    console.log(`Looking for entries from: ${today}`);
    
    let todayEntries = 0;
    let activeStudents = 0;
    let studentsOut = 0;
    let studentsWaiting = 0;
    const activeStudentNames = [];
    const todayStudentActivity = {};
    
    // Analyze all entries for today
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const date = row[0];
      const studentName = row[1];
      const outTime = row[5] || "";
      const backTime = row[6] || "";
      const holdNotice = row[7] || "";
      
      if (!studentName) continue;
      
      const entryDate = date ? new Date(date).toLocaleDateString() : "";
      if (entryDate === today) {
        todayEntries++;
        
        // Track this student's activity
        if (!todayStudentActivity[studentName]) {
          todayStudentActivity[studentName] = [];
        }
        todayStudentActivity[studentName].push({
          outTime: outTime,
          backTime: backTime,
          holdNotice: holdNotice,
          rowIndex: r + 1
        });
      }
    }
    
    // Analyze current status for each student
    for (const [studentName, activities] of Object.entries(todayStudentActivity)) {
      // Get the most recent activity (last in array)
      const latestActivity = activities[activities.length - 1];
      
      if (latestActivity.backTime) {
        // Student has returned - not active
        console.log(`${studentName}: Returned (backTime: ${latestActivity.backTime})`);
      } else if (latestActivity.outTime) {
        // Student is currently out
        studentsOut++;
        activeStudents++;
        activeStudentNames.push(`${studentName} (OUT since ${latestActivity.outTime})`);
        console.log(`${studentName}: Currently OUT since ${latestActivity.outTime}`);
      } else if (latestActivity.holdNotice) {
        // Student is waiting
        studentsWaiting++;
        activeStudents++;
        activeStudentNames.push(`${studentName} (WAITING: ${latestActivity.holdNotice})`);
        console.log(`${studentName}: WAITING (${latestActivity.holdNotice})`);
      }
    }
    
    const debugResult = {
      success: true,
      message: "Log sheet analysis complete",
      todayEntries: todayEntries,
      activeStudents: activeStudents,
      studentsOut: studentsOut,
      studentsWaiting: studentsWaiting,
      logSheetExists: true,
      totalLogRows: data.length,
      activeStudentNames: activeStudentNames,
      uniqueStudentsToday: Object.keys(todayStudentActivity).length,
      todayDate: today
    };
    
    console.log("Debug result:", debugResult);
    return debugResult;
    
  } catch (error) {
    console.error("Error in api_debugLogSheet:", error);
    return {
      success: false,
      error: error.message,
      todayEntries: 0,
      activeStudents: 0,
      studentsOut: 0,
      studentsWaiting: 0
    };
  }
}

/**
 * Check if a student has already used the restroom in the current period (morning/afternoon)
 * @param {string} studentName - Name of the student to check
 * @returns {Object} - Result with usage information
 */
function api_checkStudentUsageLimit(studentName) {
  const result = {
    success: true,
    canUseRestroom: true,
    reason: "",
    usageCount: { morning: 0, afternoon: 0 },
    currentPeriod: "afternoon",
    currentlyOut: false,
  };

  try {
    if (!studentName) {
      result.success = false;
      result.error = "Student name is required";
      result.canUseRestroom = false;
      return result;
    }

    // Get current period
    const now = new Date();
    const currentHour = now.getHours();
    const currentPeriod = currentHour < 12 ? "morning" : "afternoon";
    result.currentPeriod = currentPeriod;

    // Get spreadsheet and log sheet
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return result; // No log sheet means student can use restroom
    }

    const data = logSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return result; // Empty log sheet means student can use restroom
    }

    // Get today's date for comparison
    const today = new Date();
    
    let morningUsage = 0;
    let afternoonUsage = 0;
    let currentlyOut = false;
    
    // Check each row in the log for this student's entries today
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      
      // Skip empty rows or entries for other students
      if (!row[0] || !row[1] || row[1] !== studentName) continue;
      
      const logDate = row[0];
      const outTime = row[5];
      const backTime = row[6];
      const holdNotice = row[7];
      
      // Check if this entry is from today
      let isToday = false;
      if (logDate) {
        try {
          const entryDate = new Date(logDate);
          if (!isNaN(entryDate.getTime())) {
            isToday = entryDate.getFullYear() === today.getFullYear() &&
                     entryDate.getMonth() === today.getMonth() &&
                     entryDate.getDate() === today.getDate();
          }
        } catch (e) {
          // Skip entries with invalid dates
          continue;
        }
      }
      
      if (isToday) {
        // Check if student is currently out (has outTime but no backTime)
        // Don't count waiting students (holdNotice only) as "currently out"
        if (outTime && !backTime) {
          currentlyOut = true;
        }
        
        // Count completed trips (must have both out and back times)
        if (outTime && backTime) {
          let isAfternoonTrip = false;
          
          if (outTime instanceof Date) {
            // Time is a Date object - use hour to determine period
            const hour = outTime.getHours();
            isAfternoonTrip = hour >= 12;
          } else {
            // Time is a string - check for AM/PM
            const outTimeStr = outTime.toString().toLowerCase();
            isAfternoonTrip = outTimeStr.includes('pm');
          }
          
          if (isAfternoonTrip) {
            afternoonUsage++;
          } else {
            morningUsage++;
          }
        }
      }
    }
    
    result.usageCount = { morning: morningUsage, afternoon: afternoonUsage };
    result.currentlyOut = currentlyOut;
    
    // Determine if student can use restroom
    if (currentlyOut) {
      result.canUseRestroom = false;
      result.reason = "Student is currently out at the restroom";
    } else if (currentPeriod === "afternoon" && afternoonUsage >= 1) {
      result.canUseRestroom = false;
      result.reason = "Already used restroom once in the afternoon";
    } else if (currentPeriod === "morning" && morningUsage >= 1) {
      result.canUseRestroom = false;
      result.reason = "Already used restroom once in the morning";
    }
    
    return result;
    
  } catch (error) {
    console.error(`Error checking usage limit for ${studentName}:`, error);
    result.success = false;
    result.error = error.message;
    return result;
  }
}

/**
 * Helper function to determine current period (morning/afternoon)
 * @returns {string} - "morning" or "afternoon"
 */
function _getCurrentPeriod() {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Before 12:00 PM is morning, 12:00 PM and after is afternoon
  return currentHour < 12 ? "morning" : "afternoon";
}

/**
 * Helper function to parse time string and extract hour
 * @param {string} timeString - Time string like "9:30 AM" or "2:15 PM"
 * @returns {number} - Hour in 24-hour format
 */
function _parseTimeToHour(timeString) {
  try {
    if (!timeString) return 0;
    
    const timeStr = timeString.toString().trim();
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const ampm = timeMatch[3].toUpperCase();
      
      if (ampm === "AM" && hours === 12) {
        hours = 0;
      } else if (ampm === "PM" && hours !== 12) {
        hours += 12;
      }
      
      return hours;
    }
    
    // Try 24-hour format
    const hour24Match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (hour24Match) {
      return parseInt(hour24Match[1], 10);
    }
    
    return 0;
  } catch (error) {
    console.error("Error parsing time string:", timeString, error);
    return 0;
  }
}

/**
 * Add a student to the active management table
 * This creates an initial entry for the student so they appear in the management interface
 * @param {string} studentName - Name of the student to add
 * @param {string} studentId - ID of the student
 * @param {string} teacherName - Name of the teacher adding the student
 * @returns {Object} - Result of adding the student
 */
function api_addStudentToActive(studentName, studentId, teacherName) {
  try {
    console.log(`=== api_addStudentToActive called: ${studentName} ===`);

    if (!studentName || !teacherName) {
      throw new Error("Student name and teacher name are required");
    }

    // Check if student is already active today
    const currentStatus = _getCurrentRestroomStatusFallback();
    if (currentStatus[studentName]) {
      console.log(`Student ${studentName} is already active today`);
      return {
        success: true,
        message: "Student is already in the active list",
        alreadyActive: true,
      };
    }

    // Check if student has already used restroom in current period
    const usageCheck = api_checkStudentUsageLimit(studentName);
    if (usageCheck.success && !usageCheck.canUseRestroom) {
      console.log(`Student ${studentName} has already used restroom: ${usageCheck.reason}`);
      return {
        success: false,
        error: "ALREADY_WENT",
        message: usageCheck.reason,
        usageCount: usageCheck.usageCount,
        currentPeriod: usageCheck.currentPeriod,
      };
    }

    // For now, just return success - the actual "add to active" will happen
    // when they first request the restroom. This endpoint confirms the student
    // exists and can be added.
    console.log(
      `Student ${studentName} ready to be added to active management`
    );

    return {
      success: true,
      message: "Student ready for restroom management",
      student: {
        name: studentName,
        id: studentId,
        teacher: teacherName,
      },
    };
  } catch (error) {
    console.error("Error in api_addStudentToActive:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Midnight Reset Function - Automatically clears daily roster cache
 * This function should be triggered daily at midnight on weekdays
 * to ensure fresh roster data is loaded from the current day's sheet
 */
function midnightRosterReset() {
  try {
    console.log("=== MIDNIGHT ROSTER RESET STARTED ===");
    console.log("Time:", new Date().toISOString());

    // Check if it's a weekday (Monday = 1, Friday = 5)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log("Weekend detected - skipping roster reset");
      return {
        success: true,
        message: "Skipped - Weekend",
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`Weekday detected (${dayOfWeek}) - proceeding with reset`);

    // No cache clearing needed - system reads directly from sheets
    console.log("✓ Using direct sheet access - no cache to clear");

    // Test that we can access today's roster (uses fallback logic if today's sheet doesn't exist)
    let rosterInfo = { studentsLoaded: 0, sheetUsed: "unknown" };
    try {
      // This will automatically use getLatestDailySheet() which has built-in fallback logic
      const dailySheet = getLatestDailySheet();
      const todaysRoster = _getStudentRoster(dailySheet);
      rosterInfo.studentsLoaded = todaysRoster.length;
      rosterInfo.sheetUsed = dailySheet.getName();

      console.log(
        `✓ Roster pre-loaded: ${rosterInfo.studentsLoaded} students from sheet "${rosterInfo.sheetUsed}"`
      );

      // Check if we're using a fallback sheet (not today's date)
      const today = new Date();
      const todayString = `${today.getMonth() + 1}/${today.getDate()}`;

      if (!rosterInfo.sheetUsed.includes(todayString)) {
        console.log(
          `ℹ️  Note: Today's sheet (${todayString}) not found, using most recent available: "${rosterInfo.sheetUsed}"`
        );
      }
    } catch (preloadError) {
      console.warn("Could not pre-load roster:", preloadError.message);
      rosterInfo.error = preloadError.message;
    }

    console.log("=== MIDNIGHT ROSTER RESET COMPLETED ===");

    return {
      success: true,
      message: "Roster reset completed successfully",
      timestamp: new Date().toISOString(),
      studentsLoaded: rosterInfo.studentsLoaded,
      sheetUsed: rosterInfo.sheetUsed,
      fallbackUsed:
        rosterInfo.sheetUsed !== "unknown" &&
        !rosterInfo.sheetUsed.includes(
          `${new Date().getMonth() + 1}/${new Date().getDate()}`
        ),
      error: rosterInfo.error,
    };
  } catch (error) {
    console.error("Error in midnightRosterReset:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Manual trigger for testing the midnight reset function
 * Can be called from the Apps Script editor for testing
 */
function testMidnightReset() {
  console.log("=== TESTING MIDNIGHT RESET ===");
  const result = midnightRosterReset();
  console.log("Test result:", result);
  return result;
}

/**
 * Simple test function to debug the api_updateStatus issue
 */
function api_testUpdateStatus() {
  console.log("=== TESTING API UPDATE STATUS ===");
  
  try {
    // Test with minimal parameters
    const result = api_updateStatus("Test Student", "out", "Mr. Test", "B");
    console.log("Test result:", result);
    console.log("Test result type:", typeof result);
    return result;
  } catch (error) {
    console.error("Test error:", error);
    return {
      success: false,
      error: error.message,
      testError: true
    };
  }
}

/**
 * Ultra-simple test function that just returns a basic object
 */
function api_simpleTest() {
  console.log("=== SIMPLE TEST ===");
  const response = {
    success: true,
    message: "Simple test works",
    timestamp: new Date().toISOString()
  };
  console.log("Returning:", response);
  return response;
}

/**
 * Test function for usage limit checking
 */
function api_testUsageLimit() {
  console.log("=== TESTING USAGE LIMIT ===");
  
  try {
    // Test with a sample student name
    const testStudentName = "Allen, Ibrahim";
    const result = api_checkStudentUsageLimit(testStudentName);
    
    console.log("Test result:", result);
    
    return {
      success: true,
      message: "Usage limit test completed",
      testResult: result,
      currentPeriod: _getCurrentPeriod(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Test error:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Debug function to check what's happening when a student is selected
 */
function api_debugStudentSelection(studentName) {
  console.log(`=== DEBUG STUDENT SELECTION: ${studentName} ===`);
  
  try {
    // First check if the function exists and works
    const usageCheck = api_checkStudentUsageLimit(studentName);
    console.log("Usage check result:", usageCheck);
    
    // Also check current restroom status
    const currentStatus = _getCurrentRestroomStatusFallback();
    const studentStatus = currentStatus[studentName];
    console.log("Current status for student:", studentStatus);
    
    // Check log entries for today
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    const today = new Date().toLocaleDateString();
    
    let todayEntries = [];
    if (logSheet) {
      const data = logSheet.getDataRange().getValues();
      
      for (let r = 1; r < data.length; r++) {
        const row = data[r];
        const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : "";
        const entryName = row[1];
        
        if (entryDate === today && entryName === studentName) {
          todayEntries.push({
            rowNumber: r + 1,
            date: entryDate,
            name: entryName,
            id: row[2],
            gender: row[3],
            teacher: row[4],
            outTime: row[5],
            backTime: row[6],
            holdNotice: row[7]
          });
        }
      }
      
      console.log(`Found ${todayEntries.length} log entries for ${studentName} today:`, todayEntries);
    }
    
    return {
      success: true,
      studentName: studentName,
      usageCheck: usageCheck,
      currentStatus: studentStatus,
      todayEntries: todayEntries,
      currentPeriod: _getCurrentPeriod(),
      currentTime: new Date().toLocaleString(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Debug error:", error);
    return {
      success: false,
      error: error.message,
      studentName: studentName,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Simple function to check today's log entries for any student
 */
function api_getTodaysLogEntries(studentName = null) {
  console.log(`=== GET TODAY'S LOG ENTRIES ${studentName ? 'for ' + studentName : ''} ===`);
  
  try {
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    const today = new Date().toLocaleDateString();
    
    if (!logSheet) {
      return {
        success: true,
        message: "No Log sheet found",
        entries: [],
        today: today
      };
    }
    
    const data = logSheet.getDataRange().getValues();
    const todayEntries = [];
    
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : "";
      const entryName = row[1];
      
      if (entryDate === today) {
        if (!studentName || entryName === studentName) {
          todayEntries.push({
            rowNumber: r + 1,
            date: entryDate,
            name: entryName,
            id: row[2],
            gender: row[3],
            teacher: row[4],
            outTime: row[5],
            backTime: row[6],
            holdNotice: row[7]
          });
        }
      }
    }
    
    console.log(`Found ${todayEntries.length} entries for today${studentName ? ' for ' + studentName : ''}`);
    
    return {
      success: true,
      entries: todayEntries,
      totalEntries: todayEntries.length,
      today: today,
      studentName: studentName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting today's log entries:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Simplified version of api_updateStatus that doesn't call fetchData
 * This helps isolate whether the issue is in updateStatus or fetchData
 */
function api_updateStatusSimple(studentName, action, teacherName, gender) {
  console.log("=== API updateStatusSimple START ===");
  console.log("Called with:", { studentName, action, teacherName, gender });

  try {
    console.log("Calling updateStatus...");
    updateStatus(studentName, action, teacherName, gender);
    console.log("updateStatus completed successfully");

    const response = {
      success: true,
      message: "Update completed successfully",
      timestamp: new Date().toISOString()
    };
    
    console.log("Returning response:", response);
    console.log("=== API updateStatusSimple END (SUCCESS) ===");
    return response;
  } catch (error) {
    console.error("=== API updateStatusSimple ERROR ===");
    console.error("Error:", error);
    
    const errorResponse = {
      success: false,
      error: error.message || "Unknown error occurred",
      timestamp: new Date().toISOString()
    };
    
    console.log("Returning error response:", errorResponse);
    console.log("=== API updateStatusSimple END (ERROR) ===");
    return errorResponse;
  }
}

/**
 * Remove a student's log entries from the Log sheet for today
 * @param {string} studentName - Name of the student to remove
 * @returns {Object} - Result with number of entries removed
 */
function api_removeStudentFromLog(studentName) {
  console.log(`=== API removeStudentFromLog START: ${studentName} ===`);
  
  try {
    if (!studentName) {
      throw new Error("Student name is required");
    }

    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      console.log("No Log sheet found");
      return {
        success: true,
        entriesRemoved: 0,
        message: "No Log sheet exists"
      };
    }

    const data = logSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log("Log sheet is empty or only has headers");
      return {
        success: true,
        entriesRemoved: 0,
        message: "Log sheet is empty"
      };
    }

    // Get today's date for comparison
    const today = new Date();
    const rowsToDelete = [];
    let entriesRemoved = 0;

    // Find all rows for this student from today (iterate backwards to collect row numbers)
    for (let r = data.length - 1; r >= 1; r--) {
      const row = data[r];
      
      // Skip empty rows or entries for other students
      if (!row[0] || !row[1] || row[1] !== studentName) continue;
      
      const logDate = row[0];
      
      // Check if this entry is from today
      let isToday = false;
      if (logDate) {
        try {
          const entryDate = new Date(logDate);
          if (!isNaN(entryDate.getTime())) {
            isToday = entryDate.getFullYear() === today.getFullYear() &&
                     entryDate.getMonth() === today.getMonth() &&
                     entryDate.getDate() === today.getDate();
          }
        } catch (e) {
          // Skip entries with invalid dates
          continue;
        }
      }
      
      if (isToday) {
        rowsToDelete.push(r + 1); // +1 because sheet rows are 1-indexed
        entriesRemoved++;
        console.log(`Found entry to delete at row ${r + 1}: ${JSON.stringify(row)}`);
      }
    }

    // Delete rows (from highest row number to lowest to maintain correct indices)
    rowsToDelete.forEach(rowNumber => {
      console.log(`Deleting row ${rowNumber}`);
      logSheet.deleteRow(rowNumber);
    });

    console.log(`Successfully removed ${entriesRemoved} log entries for ${studentName}`);
    
    const response = {
      success: true,
      entriesRemoved: entriesRemoved,
      message: `Removed ${entriesRemoved} log entries for ${studentName}`
    };
    
    console.log("=== API removeStudentFromLog END (SUCCESS) ===");
    return response;
    
  } catch (error) {
    console.error(`Error in api_removeStudentFromLog for ${studentName}:`, error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      entriesRemoved: 0
    };
    
    console.log("=== API removeStudentFromLog END (ERROR) ===");
    return errorResponse;
  }
}
