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

      result.push({
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: status.gender,
        teacher: status.teacher,
        outTime: status.outTime,
        backTime: status.backTime,
        holdNotice: status.holdNotice,
      });

      // Debug: Log first few students with any status
      if (
        result.length <= 3 &&
        (status.outTime || status.holdNotice || status.backTime)
      ) {
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
    console.log(
      `Queue - Girls: ${queue.girls.length}, Boys: ${queue.boys.length}`
    );

    return { students: result, queue };
  } catch (error) {
    console.error("Error in fetchData:", error);
    console.error("Error stack:", error.stack);
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
    const entryDate = date ? new Date(date).toLocaleDateString() : "";

    if (entryDate === today) {
      todaysEntries.push({
        date: entryDate,
        studentName: row[1],
        studentId: row[2],
        gender: row[3],
        teacher: row[4],
        outTime: row[5],
        backTime: row[6],
        holdNotice: row[7],
      });
    }
  }

  return {
    today: today,
    totalLogEntries: data.length - 1,
    todaysEntries: todaysEntries,
  };
}

function api_updateStatus(studentName, action, teacherName, gender) {
  console.log("API updateStatus called with:", {
    studentName,
    action,
    teacherName,
    gender,
  });

  try {
    console.log("Step 1: Calling updateStatus...");
    updateStatus(studentName, action, teacherName, gender);
    console.log("Step 2: updateStatus completed successfully");

    console.log("Step 3: Calling fetchData...");
    const result = fetchData();
    console.log("Step 4: fetchData completed, returning result");

    return result;
  } catch (error) {
    console.error("Error in api_updateStatus:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Re-throw with more context
    throw new Error(
      `Failed to update status for ${studentName}: ${error.message}`
    );
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

    const activeStudents = [];

    // Convert status object to array of active students
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
