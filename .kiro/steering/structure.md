# Project Structure & Organization

## File Organization

### Root Level Files

- `Code.js` - Main server-side logic (4,897 lines)
- `Index.html` - Primary web interface with Alpine.js
- `TeacherManagement.html` - Teacher administration interface
- `Help.html` - User documentation and help content
- `appsscript.json` - Google Apps Script configuration
- `.clasp.json` - Clasp CLI configuration for deployment

### Configuration Files

- `.claspignore` - Files excluded from GAS deployment
- `.gitignore` - Git version control exclusions

## Code Architecture

### Core Classes (Code.js)

```
PerformanceMonitor - API call timing and bottleneck detection (optional)
Direct Sheet Functions - Simple Google Sheets read/write operations
```

### Key Functions

```
fetchData() - Main data retrieval function
updateStatus() - Student restroom status updates
getLatestDailySheet() - Dynamic sheet detection by MM/DD naming
getCurrentUserInfo() - Teacher authentication and detection
```

### API Endpoints (Client-facing)

```
api_searchStudents() - Search for students by name from daily roster
api_getActiveStudents() - Get only students currently being managed
api_updateStatus() - Status update endpoint (direct to Log sheet)
api_getCurrentUserInfo() - User information retrieval
```

## Data Flow Patterns

### Sheet Structure

- **Daily Sheets**: Named with MM/DD format (e.g., "Monday 08/11", "10/15")
- **Log Sheet**: Tracks all restroom transactions with timestamps
- **Database Sheet**: Archived historical data

### Data Processing Flow

1. **Search Phase**: Teacher searches for student by name from daily sheet
2. **Selection Phase**: Student is added to active management table
3. **Management Phase**: Process today's log entries for active students only
4. **Status Updates**: Direct writes to Log sheet for restroom activities

### Data Access Strategy

- **Direct Sheet Access**: All data read fresh from Google Sheets every time
- **No Caching**: Simplified architecture for maximum reliability and data consistency
- **Real-time Data**: Always current information directly from Log sheet
- **Performance**: Google Sheets API is fast enough for school-scale usage

## Data Flow & Logging

### Daily Sheet Population

- **Manual Creation**: Daily roster sheets are created manually with MM/DD naming format
- **Student Data Structure**: Each daily sheet contains extensive student tracking data, but the restroom system only uses:
  - **Column A**: Student Name (primary identifier for searches and display)
  - **Column E**: Student ID # (used for log correlation and tracking)
- **Read-Only Access**: System never modifies daily sheets, only reads student roster data
- **Sheet Detection**: System automatically finds the most recent daily sheet using `getLatestDailySheet()`
- **Fallback Strategy**: If no MM/DD sheets found, falls back to ["Database", "Students", "Roster", "AM", "PM"]

### Log Sheet Structure & Updates

- **Auto-Creation**: Log sheet is created automatically if it doesn't exist
- **Column Headers**: "Date | Student Name | ID | Gender | Teacher | Out Time | Back Time | Hold Notice"
- **Column Mapping**:
  - A: Date (MM/DD/YYYY format)
  - B: Student Name (matches Column A from daily sheet)
  - C: ID (matches Column E from daily sheet)
  - D: Gender (for restroom assignment logic)
  - E: Teacher (requesting teacher's name)
  - F: Out Time (HH:MM format when student leaves for restroom)
  - G: Back Time (HH:MM format when student returns)
  - H: Hold Notice (queue position messages like "Waiting in line. Position 2.")

### Logging Workflow & Queue Management

1. **Queue Entry Creation**: When restroom is occupied, `_logWaitingEntry()` creates a new row with:

   - Current date, student info, teacher name, gender
   - Empty Out Time and Back Time columns
   - Hold Notice showing queue position (e.g., "Waiting in line. Position 2.")

2. **Queue Processing**: System determines "next student" by:

   - Reading all Log entries for current date
   - Creating two lists, one for Bs (Boys) and another for Gs (Girls)
   - Finding entries with Hold Notice but no Out Time (waiting students)
   - Ordering by hold notice to determine queue sequence
   - First waiting entry = next student to use restroom

3. **Status Transition**: When restroom becomes available, `_updateWaitingEntryToOut()`:

   - Finds the next waiting student (earliest Hold Notice entry without Out Time)
   - Updates their Out Time column with current timestamp
   - Clears their Hold Notice
   - Recalculates queue positions for remaining waiting students

4. **Return Processing**: When student returns from restroom:
   - Updates Back Time column for their current "out" entry
   - Restroom becomes available for next queued student

### Data Synchronization

- **Read-Only Daily Sheets**: Daily roster sheets are never modified by the system
- **Write-Only Log Operations**: All status changes write directly to Log sheet
- **Real-Time Processing**: Log entries are processed immediately without caching
- **Direct Updates**: All status changes write immediately to Log sheet
- **Immediate Consistency**: No cache synchronization issues - data is always current
- **Batch Operations**: Multiple log entries can be written in single batch operations for performance

### Data Consistency Rules

- **Single Source of Truth**: Daily sheets for roster data, Log sheet for all status tracking
- **Date Validation**: All log entries include date validation for same-day operations
- **Student Matching**: Student lookups match by name between daily sheet and log entries
- **Time Formatting**: All times stored in consistent HH:MM format for processing
- **Queue Management**: Hold notices track waiting positions and update dynamically

## Naming Conventions

### Variables

- `camelCase` for JavaScript variables and functions
- `UPPER_SNAKE_CASE` for constants (e.g., `SPREADSHEET_ID`, `TEACHER_DATA`)

### Functions

- `api_` prefix for client-callable endpoints
- `_` prefix for private/internal functions
- Descriptive names indicating purpose (e.g., `getLatestDailySheet`, `_getCurrentRestroomStatus`)

### CSS Classes

- `kebab-case` for CSS classes
- Material Design inspired naming (e.g., `card-panel`, `btn`, `teal lighten-4`)

## Error Handling Patterns

### Simple Error Handling

- Direct Google Sheets API access with basic error handling
- Failed API calls return structured error objects
- Simple fallback to alternative sheet reading methods

### Logging Strategy

- Console logging with structured prefixes
- Performance timing for optimization
- Error context preservation for debugging
