# System Logs Feature - Professional Log Viewer

## Overview
Added a professional system logs viewer for super admins to monitor and analyze system activity in real-time.

## Features

### Backend
- **Winston Logger Integration**
  - Structured JSON logging to files
  - Multiple log levels: error, warn, info, http, debug
  - Separate log files: `combined.log`, `error.log`, `access.log`
  - Automatic log rotation (5MB max per file, keeps 5 files)
  - HTTP request logging via Morgan

- **Logs API Endpoints** (Super Admin Only)
  - `GET /api/logs` - Fetch logs with pagination, filtering, and search
  - `GET /api/logs/stats` - Get log statistics and file sizes
  - `DELETE /api/logs/:type` - Clear specific log type
  - `GET /api/logs/download/:type` - Download log files

- **Features:**
  - Filter by log type (combined, error, access)
  - Filter by level (error, warn, info, http)
  - Search across all log fields
  - Pagination (50 logs per page)
  - Real-time statistics

### Frontend
- **Professional Log Viewer UI**
  - Statistics cards showing total logs, errors, warnings, and file sizes
  - Advanced filters (type, level, search)
  - Color-coded log levels with icons
  - Responsive table with pagination
  - Real-time refresh
  - Download logs as files
  - Clear logs functionality
  - Clean, professional design with teal theme

## Files Created

### Backend
- `server/config/logger.js` - Winston logger configuration
- `server/controllers/logsController.js` - Logs API controller
- `server/routes/logsRoutes.js` - Logs API routes

### Frontend
- `client/src/pages/admin/SystemLogs.jsx` - Log viewer component

## Files Modified

### Backend
- `server/server.js` - Added logger import and logs routes
- `server/package.json` - Added winston dependency

### Frontend
- `client/src/App.jsx` - Added System Logs route
- `client/src/layouts/MainLayout.jsx` - Added System Logs navigation link (super admin only)

## Usage

### Access
Only **Super Admins** can access the system logs:
1. Login as super admin
2. Click "System Logs" in the sidebar
3. View, filter, search, download, or clear logs

### Log Levels
- **Error** (Red): Application errors, exceptions
- **Warn** (Yellow): Warning messages
- **Info** (Blue): General information
- **HTTP** (Purple): HTTP request logs

### Features Available
1. **Filter by Type:**
   - Combined: All logs
   - Errors Only: Error logs only
   - Access Logs: HTTP request logs

2. **Filter by Level:**
   - All Levels
   - Error
   - Warning
   - Info
   - HTTP

3. **Search:**
   - Search across all log fields
   - Real-time filtering

4. **Actions:**
   - Refresh: Reload logs
   - Download: Download current log file
   - Clear: Clear all logs of selected type (with confirmation)

5. **Pagination:**
   - 50 logs per page
   - Navigate between pages
   - Shows total count

## Log File Locations
- `server/logs/combined.log` - All logs
- `server/logs/error.log` - Error logs only
- `server/logs/access.log` - HTTP request logs

## Statistics Dashboard
- **Total Logs**: Count of all log entries
- **Errors**: Count of error logs
- **Warnings**: Count of warning logs
- **Combined Log Size**: File size of combined log

## Security
- ✅ Super admin only access
- ✅ Protected API endpoints
- ✅ Confirmation before clearing logs
- ✅ Read-only log viewing (cannot modify logs)

## Benefits
1. **System Monitoring**: Track application health and performance
2. **Error Tracking**: Quickly identify and diagnose errors
3. **Audit Trail**: Complete history of system activity
4. **Troubleshooting**: Debug issues using detailed logs
5. **Security**: Monitor access and suspicious activity

## Next Steps (Optional Enhancements)
- Real-time log streaming with WebSockets
- Log export to CSV/JSON
- Advanced analytics and charts
- Log archiving to external storage
- Email alerts for critical errors
- Custom log filters and saved searches
