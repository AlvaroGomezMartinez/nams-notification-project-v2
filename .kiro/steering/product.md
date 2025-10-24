# Product Overview

## NAMS Notification System (Restroom Management)

A Google Apps Script web application for managing student restroom sign-outs at Northside Alternative Middle School (NAMS). The system tracks student bathroom usage, manages waiting queues, and provides real-time status updates for teachers.

**Important Requirements:**
- **Bound Script**: This Google Apps Script is bound to a specific Google Spreadsheet that contains the student data and logs
- **Authentication**: Users must be logged into the Northside intranet to access the application
- **Access Control**: Only authorized school personnel with proper domain access can use the system

### Core Functionality

- **Interactive Student Search**: Dropdown interface showing all students on click, with real-time filtering as you type
- **Restroom Sign-Out Tracking**: Records when students leave and return from restrooms

- **Teacher Authentication**: Auto-detects teachers based on email and provides teacher-specific interfaces
- **Active Student Management**: Manages only students currently requesting restroom access
- **Real-time Updates**: Provides live status updates for active students

### Key Features

- **Interactive Dropdown Search**: Click to see all students or type to filter - no more scrolling through long lists
- **Keyboard Navigation**: Use arrow keys to navigate and Enter to select students
- **Smart Button States**: Buttons change text based on restroom availability ("OUT", "ADD TO LIST", "WAITING", "RR AVAILABLE")
- **Active Student Focus**: Only shows students currently requesting restroom access
- Gender-specific restroom availability tracking
- **Usage Limits**: Students can only use the restroom once in the morning and once in the afternoon
- Tracks if student used the restroom in the morning and afternoon periods
- Teacher management interface
- Simple and reliable direct data access
- Real-time data updates from Google Sheets
- Mobile-responsive web interface

### Target Users

- Middle school teachers managing classroom restroom requests
- School administrators monitoring restroom usage patterns
- Students (indirectly through teacher interface)
