# VentureScope Chrome Extension

## Overview
The VentureScope Chrome Extension enables students to automatically sync their academic data from university eStudent portals to the VentureScope platform for AI-powered career guidance.

## Features
- **User Authentication**: Secure login with VentureScope credentials
- **Academic Data Scraping**: Automatically extracts courses, grades, and academic progress
- **Real-time Sync**: One-click synchronization with VentureScope backend
- **Data Visualization**: View synced academic data within the extension
- **Settings Management**: Configure auto-sync, notifications, and API endpoints

## Installation

### Development Mode
1. Clone or download this extension folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `chrome-extension` folder

### Production (Chrome Web Store)
Coming soon...

## Usage

### First Time Setup
1. Click the VentureScope extension icon in your Chrome toolbar
2. Sign in with your VentureScope account credentials (email & password)
3. Navigate to your university's eStudent portal
4. Click "Sync Academic Data" to extract your information

### Syncing Data
1. Log into your university's student portal in Chrome
2. Open the VentureScope extension
3. Click "Sync Academic Data"
4. The extension will extract and display your academic information
5. Data is automatically sent to VentureScope for analysis

### Viewing Synced Data
- Click "View Synced Data" to see all extracted information
- Includes personal info, courses, grades, and academic progress

### Settings
- **Auto-sync**: Automatically sync when a student portal is detected
- **Notifications**: Get notified when sync completes
- **API Endpoint**: Configure the VentureScope backend URL
- **Clear Cache**: Remove all locally stored academic data

## Data Extracted

The extension attempts to extract the following information:
- Student ID
- Department/Program
- Academic Year
- Enrollment Status
- Course List (code, name, grade, credits)
- GPA (Grade Point Average)
- Credits Earned
- Total Credits Required
- Completion Percentage

## Supported Portals

Currently, the extension uses intelligent pattern matching to work with most university portals. Custom extractors can be added for specific portals.

### Customization for Specific Portals
To add support for a specific portal, modify the extraction functions in `content.js`:
- `extractStudentId()`
- `extractDepartment()`
- `extractCourses()`
- etc.

## Privacy & Security

- All authentication is done through VentureScope's secure API
- Academic data is encrypted during transmission
- Local storage is used only for caching
- No data is shared with third parties
- Users can clear all cached data at any time

## Development

### File Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Popup styling
├── popup.js              # Popup logic and state management
├── content.js            # Page scraping logic
├── background.js         # Background service worker
├── icons/                # Extension icons
└── README.md            # This file
```

### Adding Icons
Place icon files in the `icons/` folder:
- `icon16.png` - 16x16px
- `icon48.png` - 48x48px
- `icon128.png` - 128x128px

### API Integration
Update the `sendDataToBackend()` function in `background.js` to integrate with your VentureScope API:

```javascript
const response = await fetch(`${endpoint}/api/academic-data`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify(academicData)
});
```

## Troubleshooting

### Extension doesn't detect data
- Ensure you're on the correct student portal page
- Check browser console for errors
- The portal structure may be different - customization may be needed

### Login fails
- Verify your VentureScope credentials
- Check API endpoint in settings
- Ensure internet connection is active

### Data not syncing
- Check notification permissions
- Verify API endpoint configuration
- Check browser console for network errors

## Future Enhancements
- [ ] OAuth integration with university portals
- [ ] Support for more university systems
- [ ] Offline mode with queue sync
- [ ] Automatic portal detection
- [ ] Data validation before sync
- [ ] Multi-language support

## Support
For issues or questions, contact: support@venturescope.com

## License
© 2025 VentureScope. All rights reserved.
