# Notification System Documentation

## Overview

The IntelliCare Support System now includes a comprehensive notification system for admin and superadmin users. The system provides real-time notifications for new messages in direct chats and group channels.

## Features

### 1. **Browser Notifications**
- Native browser notifications for new messages
- Separate notifications for direct messages and channel messages
- Special high-priority notifications for @mentions
- Notification click handlers to navigate to the conversation
- Auto-dismiss after 5 seconds (except for mentions)

### 2. **Unread Message Tracking**
- Real-time unread count tracking per conversation
- Separate counters for direct messages and channels
- Total unread count displayed globally
- Automatic clearing when viewing a conversation

### 3. **Visual Indicators**
- **Badge on Chat Menu**: Shows total unread count in the sidebar
- **Tab Badges**: Shows number of conversations with unread messages
- **User List Badges**: Individual unread counts per admin/channel
- **Page Title**: Updates with unread count (e.g., "(3) IntelliCare Support")
- **Bell Icon**: Visual indicator in chat header with toggle capability

### 4. **Notification Controls**
- Toggle notifications on/off with a single click
- Permission request flow for browser notifications
- Settings persist across sessions
- Toast notifications as fallback when browser notifications are disabled

## Implementation Details

### Client-Side Components

#### 1. **NotificationService** (`client/src/services/notificationService.js`)
- Handles browser notification API
- Manages notification permissions
- Creates and displays notifications
- Handles notification click events

#### 2. **NotificationContext** (`client/src/context/NotificationContext.jsx`)
- Global notification state management
- Unread count tracking
- Socket event listeners for new messages
- Integration with toast notifications

#### 3. **Enhanced Components**
- **AdminChatWidget**: Integrated with notification context, shows unread badges
- **MainLayout**: Displays unread count on Chat menu item
- **App.jsx**: Wraps application with NotificationProvider

### Server-Side Updates

#### Socket Events (`server/socket/chatHandler.js`)
- `notification:new` - Emitted when a new message is sent
- Includes metadata: type (direct/channel), sender/channel ID, message object
- Sent to all recipients except the sender

## User Flow

### First-Time Setup
1. User navigates to the Chat page
2. System checks for notification permission
3. If not granted, shows permission request on first interaction
4. User can toggle notifications using the bell icon in the header

### Receiving Notifications

#### When User is Active (Page Visible)
- Toast notification appears (small popup in corner)
- Unread count increments
- Visual badges update on UI elements

#### When User is Idle/Background (Page Hidden)
- Browser notification appears (if enabled)
- Desktop notification with sound/vibration
- Unread count increments
- Page title updates with count

### Clearing Notifications
- Clicking on a conversation automatically clears its unread count
- Clicking a browser notification navigates to that conversation and clears unread
- Visual indicators update in real-time

## Notification Types

### 1. Direct Messages
```javascript
{
  type: 'direct_message',
  senderId: 123,
  message: { /* message object */ }
}
```

### 2. Channel Messages
```javascript
{
  type: 'channel_message',
  channelId: 456,
  message: { /* message object */ }
}
```

### 3. Mentions
```javascript
{
  message: { /* message object */ },
  channel_id: 456, // optional
  mentioned_by: 123,
  everyone: false // true if @everyone
}
```

## Configuration

### Browser Notification Settings
```javascript
// Default notification options
{
  icon: '/logo.png',
  badge: '/logo.png',
  vibrate: [200, 100, 200],
  requireInteraction: false, // true for mentions
}
```

### Permission States
- `granted` - Notifications enabled
- `denied` - User denied permission
- `default` - Permission not requested yet

## Usage Guide

### For Admins/Superadmins

#### Enable Notifications
1. Open the Chat page
2. Click the bell icon in the header
3. Grant browser notification permission when prompted
4. Bell icon will show as solid when enabled

#### Disable Notifications
1. Click the bell icon again
2. Notifications will be disabled (icon shows as bell with slash)
3. You'll still see unread counts and toast notifications

#### View Unread Messages
- Check the Chat menu item in sidebar for total unread count
- Open Chat to see individual unread counts per conversation
- Direct and Channels tabs show number of conversations with unread

#### Clear Unread
- Click on any conversation to view and clear its unread count
- Or click on a browser notification to jump to that conversation

### Best Practices

1. **Grant Permission**: Allow browser notifications for best experience
2. **Sound Settings**: Configure browser notification sounds in OS settings
3. **Do Not Disturb**: Use browser/OS DND mode when you don't want interruptions
4. **Regular Checks**: Keep Chat open in a tab for real-time updates

## Technical Notes

### Browser Compatibility
- Requires modern browser with Notification API support
- Tested on Chrome, Firefox, Edge, Safari
- Mobile browsers may have limitations

### Performance
- Efficient event handling with React context
- Minimal re-renders using selective updates
- Socket.IO for real-time communication

### Security
- Notifications only show to authenticated users
- Socket authentication required
- No sensitive data in notification body

### Persistence
- Unread counts reset on page refresh
- Notification preference saved in localStorage
- Server doesn't track unread state (client-side only)

## Future Enhancements

Possible improvements for future versions:
- [ ] Server-side unread tracking
- [ ] Notification history panel
- [ ] Custom notification sounds
- [ ] Notification grouping for multiple messages
- [ ] Email notifications for offline users
- [ ] Push notifications for mobile apps
- [ ] Notification preferences per conversation
- [ ] Quiet hours scheduling

## Troubleshooting

### Notifications Not Appearing
1. Check browser notification permission
2. Verify notifications are enabled (bell icon is solid)
3. Check browser/OS notification settings
4. Ensure page is not in private/incognito mode (limited support)

### Unread Count Not Clearing
1. Ensure you clicked on the conversation (not just hovered)
2. Check browser console for errors
3. Verify socket connection (green dot in header)

### Permission Denied
1. Reset permission in browser settings
2. Clear site data and try again
3. Use a different browser if needed

## Support

For issues or questions about the notification system:
1. Check browser console for error messages
2. Verify socket connection status
3. Contact system administrator
4. Review this documentation

---

**Last Updated**: 2024
**Version**: 1.0.0
