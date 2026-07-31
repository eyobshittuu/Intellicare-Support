# Notification System - Troubleshooting Guide

## Issue: Notifications Not Appearing

### Quick Diagnostic Steps

1. **Open Browser Console** (F12 → Console tab)
2. **Look for these log messages** when a message is sent:

```
[NotificationContext] Message received: {...}
[NotificationContext] Current user ID: 123
[NotificationContext] Message sender ID: 456
[NotificationContext] Message type: channel
[NotificationContext] Incrementing unread for channel: 789
```

If you don't see these logs, the issue is with socket events not reaching NotificationContext.

---

## Common Issues & Solutions

### 1. No Console Logs at All

**Problem**: Socket events not being received

**Solutions**:
- Check socket connection status (green dot in chat header)
- Open browser console and check for socket connection errors
- Verify server is running
- Check CORS settings on server

**Debug**:
```javascript
// In browser console, check socket status
const socket = window.__SOCKET__;  // If exposed
console.log('Socket connected:', socket?.connected);
```

---

### 2. Messages from Self Increment Counter

**Problem**: Your own messages increment the unread count

**Check Console Logs**:
```
[NotificationContext] Message sender ID: 123
[NotificationContext] Current user ID: 123
[NotificationContext] Ignoring own message  ← Should see this
```

**If Not Seeing "Ignoring own message"**:
- User ID comparison might be failing
- Check if sender_id and user.id have same type (both numbers or both strings)

---

### 3. Unread Count Increments Even When Viewing Conversation

**Problem**: Count increases for active conversation

**Check Console Logs**:
```
[NotificationContext] Active conversation: {type: 'channel', id: 789}
[NotificationContext] Message is for active conversation, not incrementing unread
```

**If Not Seeing This**:
- `setActive()` might not be called when selecting conversation
- Check AdminChatWidget's `handleAdminSelect` and `handleChannelSelect` functions

**Fix**: Ensure these functions call `setActive()`:
```javascript
const handleChannelSelect = async (channel) => {
  // ... other code
  setActive('channel', channel.id);  // ← Must be called
};
```

---

### 4. Browser Notifications Not Showing

**Problem**: No desktop notifications

**Checklist**:
- [ ] Permission granted? Check bell icon (should be solid 🔔)
- [ ] Notifications enabled in browser settings?
- [ ] Page is hidden/background? (notifications only show when page not visible)
- [ ] Check browser console for errors

**Test Permission**:
```javascript
// In browser console
console.log('Permission:', Notification.permission);
// Should be 'granted'
```

**Request Permission**:
```javascript
// In browser console
window.enableNotificationDebug();
// Then try enabling notifications via bell icon
```

---

### 5. Badges Not Updating

**Problem**: Visual badges don't show count

**Check**:
1. Open React DevTools
2. Find NotificationProvider
3. Check `unreadCounts` state:
```javascript
{
  direct: { 456: 2 },
  channels: { 789: 3 },
  total: 5  ← Should match sum
}
```

**If State is Correct But UI Not Updating**:
- Clear browser cache
- Hard reload (Ctrl+Shift+R)
- Check for console errors

---

### 6. Count Never Clears

**Problem**: Viewing conversation doesn't clear badge

**Check Console Logs**:
```
[NotificationContext] Setting active conversation: channel 789
```

**If Not Seeing This**:
- `setActive()` not being called
- Check `handleAdminSelect`/`handleChannelSelect` in AdminChatWidget

**Manual Clear** (browser console):
```javascript
// Assuming you have access to the context
window.clearAllUnread();  // If exposed
```

---

## Debug Mode

### Enable Detailed Logging

Add extensive logging to see exactly what's happening:

**In Browser Console**:
```javascript
// Enable debug mode (already added in NotificationContext)
localStorage.setItem('debug:notifications', 'true');
// Reload page
location.reload();
```

**Disable Debug Mode**:
```javascript
localStorage.removeItem('debug:notifications');
location.reload();
```

---

## Testing Checklist

### Test Setup:
- [ ] Two browser windows (or incognito + normal)
- [ ] Both logged in as different admin users
- [ ] Socket connected in both (green dot)

### Test 1: Direct Message
1. Browser A: Open chat, stay on user list
2. Browser B: Send direct message to User A
3. Browser A: Check for:
   - [ ] Console logs show message received
   - [ ] Badge appears on sidebar Chat menu
   - [ ] Badge appears on Direct tab
   - [ ] Badge appears next to User B in list
   - [ ] Page title shows count
   - [ ] Toast notification appears

### Test 2: Channel Message
1. Browser A: Open chat, stay on channel list (or different channel)
2. Browser B: Send message in a shared channel
3. Browser A: Check for:
   - [ ] Console logs show message received
   - [ ] Badge appears on sidebar
   - [ ] Badge appears on Channels tab
   - [ ] Badge appears next to channel in list
   - [ ] Page title shows count
   - [ ] Toast notification appears

### Test 3: Clear Unread
1. Browser A: Has unread messages
2. Browser A: Click on the conversation with unread
3. Check for:
   - [ ] Badge clears from sidebar
   - [ ] Badge clears from tab
   - [ ] Badge clears from user/channel list
   - [ ] Page title updates
   - [ ] Console shows "Setting active conversation"

---

## Server-Side Issues

### Check Server Logs

Look for these in server console:

```
Channel message sent in channel 789 by user 456
Socket authenticated: { userId: 123 }
```

### Verify Socket Events are Emitted

In `server/socket/chatHandler.js`, check:
```javascript
io.to(`channel:${channel_id}`).emit('message:received', completeMessage);
```

---

## Network Issues

### Check Network Tab

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for socket.io connection
4. Should show "101 Switching Protocols"
5. Click on connection → Messages tab
6. Should see `message:received` events

---

## Common Mistakes

### 1. Not Authenticated
```javascript
// Socket must be authenticated first
socket.emit('authenticate', token);
// Wait for 'authenticated' event
socket.on('authenticated', (data) => {
  console.log('Ready to receive messages');
});
```

### 2. Not in Channel Room
For channel messages, must join room:
```javascript
socket.emit('channel:join', { channelId: 789 });
```

### 3. Multiple Event Listeners
Ensure cleanup in useEffect:
```javascript
useEffect(() => {
  socket.on('message:received', handler);
  
  return () => {
    socket.off('message:received', handler);  // ← Important!
  };
}, [dependencies]);
```

---

## Still Not Working?

### Collect Debug Info

Run this in browser console and share output:

```javascript
const debugInfo = {
  socketConnected: window.socket?.connected,
  userId: localStorage.getItem('user'),  // Adjust based on your auth
  notificationPermission: Notification.permission,
  unreadCounts: window.__unreadCounts__,  // If exposed
  activeConversation: window.__activeConversation__,  // If exposed
};
console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

### Check Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Notifications API | ✅ | ✅ | ✅ | ✅ |
| Socket.IO | ✅ | ✅ | ✅ | ✅ |
| React Context | ✅ | ✅ | ✅ | ✅ |

---

## Quick Fixes

### Reset Everything
```javascript
// In browser console
localStorage.clear();
location.reload();
// Then log in again and test
```

### Force Re-authentication
```javascript
// In browser console
const token = localStorage.getItem('token');
if (window.socket) {
  window.socket.emit('authenticate', token);
}
```

### Check Context Provider Order
In App.jsx, ensure correct order:
```jsx
<SocketProvider>
  <NotificationProvider>  ← Must be inside SocketProvider
    {/* App content */}
  </NotificationProvider>
</SocketProvider>
```

---

## Contact Support

If still having issues, provide:
1. Browser console logs
2. Network tab screenshots
3. Server logs
4. Steps to reproduce
5. Debug info from above section

---

**Last Updated**: 2024  
**Version**: 1.1.0
