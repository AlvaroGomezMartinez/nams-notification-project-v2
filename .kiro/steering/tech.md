# Technology Stack & Build System

## Core Technologies

### Backend

- **Google Apps Script (GAS)**: Server-side JavaScript runtime
- **Google Sheets API**: Data storage and retrieval
- **Google Drive API**: File access and permissions

### Frontend

- **HTML5**: Web interface structure
- **Alpine.js**: Reactive JavaScript framework for UI state management
- **Custom CSS**: Material Design-compliant styling with custom grid system and components
- **Material Icons**: Google's icon font library

### Data Storage

- **Google Sheets**: Primary data store with multiple sheet structure:
  - Daily roster sheets (named with MM/DD format)
  - Log sheet for tracking restroom usage
  - Database sheet for archived records
- **Bound Spreadsheet**: The Google Apps Script is bound to a specific spreadsheet containing all student and log data

## Architecture Patterns

### Data Access Strategy

- **Direct Sheet Access**: All data loaded fresh from Google Sheets
- **No Caching**: Simplified architecture without caching complexity
- **Real-time Data**: Always current information from Log sheet

### Performance Optimization

- **PerformanceMonitor**: Tracks API calls, timing, and bottlenecks (optional)
- **Simple Polling**: Basic refresh mechanism for UI updates
- **Direct Updates**: Immediate writes to Log sheet

### Error Handling

- Direct fallback to Google Sheets API
- Simple error reporting and logging
- Minimal complexity for easier debugging

## Common Commands

### Development Workflow

```bash
# Deploy to Google Apps Script (using clasp CLI)
clasp push
clasp deploy
```

#### Standard Development Process

1. **Local Development**: Make changes to code files locally
2. **Push to GAS**: Use `clasp push` to sync changes to Google Apps Script IDE
3. **Testing in GAS IDE**: Test functions directly in the Apps Script editor
4. **Execution Monitoring**: Review execution logs in the Apps Script console
5. **Frontend Testing**: Use browser's JavaScript console for frontend debugging

#### Test Deployments (Google Apps Script IDE)

- Use the "Deploy" button in the Apps Script editor
- Select "Test deployments" for development and testing
- Provides immediate deployment without version management
- Ideal for rapid iteration and debugging
- Access via the generated test deployment URL

#### Project Requirements

- **Bound Script**: This project is bound to a specific Google Spreadsheet
- **Authentication**: Requires users to be logged into Northside intranet
- **Domain Access**: Only authorized school domain users can access the application


### Testing

- Use Apps Script editor's built-in execution environment
- Test functions individually using the editor's Run button
- Monitor execution logs in the Apps Script console
- Use the JavaScript console in the Chrome browser for frontend

## Configuration Files

- `.clasp.json`: Contains Google Apps Script project ID and root directory
- `appsscript.json`: Defines OAuth scopes, runtime version, and web app settings
- `.claspignore`: Specifies files to exclude from deployment

## Key Dependencies

- Google Apps Script runtime (V8)
- Google Workspace APIs (Sheets, Drive, Gmail)
- No external npm packages (GAS environment limitation)
