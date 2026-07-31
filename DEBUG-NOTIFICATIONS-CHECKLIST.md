# Debug Notifications - Step by Step Checklist

## Step 1: Check Socket Connection

Open browser console (F12) and check for:

### ✅ Should See:
```
Connecting to socket server: https://...
✅ Socket connected: [socket-id]
Transport: websocket (or polling)
✅ Socket authenticated: {userId: 123}
[NotificationContext] Setting up socket listeners
```

### ❌ If You See:
```
❌ Socket connection error: ...
❌ Socket disconnected
```
**Problem**: Socket not connecting. Fix WebSocket connection first.

---

## Step 2: Check User Authentication

In console, type:
```javascript
localStorage.getItem('token')
```

### ✅ Should return: A long JWT token string
### ❌ If null: User not logged in properly

---

## Step 3: Send a Test Message

**Two Browser Setup Required:**
- Browser A: User 1 (will receive notification)
- Browser B: User 2 (will send message)

### Test Direct Message:
1. **Browser A**: Open Chat, stay on user list (DON'T open a conversation)
2. **Browser B**: Open Chat, select User 1, send message: "Test notification"
3. **Browser A**: Check console immediately

### ✅ Should See in Browser A Console:
```
[NotificationContext] Message received: {sender_id: 2, recipient_id: 1, content: "Test notification"}
[NotificationContext] Current user ID: 1
[NotificationContext] Message sender ID: 2
[NotificationContext] Message type: direct
[NotificationContext] Sender ID: 2
[NotificationContext] Page visible: true
[NotificationContext] Active conversation: {type: null, id: null}
[NotificationContext] Incrementing unread for user: 2
[NotificationContext] Showing toast notification
```

### ❌ If You See NOTHING:
**Problem**: Socket event not being received by NotificationContext

**Debug**:
```javascript
// In Browser A console, check if socket exists
window.socket = undefined; // Try to access
// Or check React DevTools -> Components -> SocketProvider
```

---

## Step 4: Check if NotificationContext is Listening

In Browser A console, type:
```javascript
// Check if context is mounted
console.log('NotificationContext mounted');
```

Then send another message from Browser B and watch console.

### ✅ If Logs Appear: Context is working
### ❌ If No Logs: Context not receiving events

---

## Step 5: Check Active Conversation State

Before sending message, in Browser A console:
```javascript
// This should show active conversation state
console.log('Checking active conversation...');
```

Then in Browser A:
1. Click on a user (e.g., User 2)
2. Check console for:
```
[NotificationContext] Setting active conversation: direct 2
```

3. Click "← Back to admins"
4. Check console for:
```
[NotificationContext] Clearing active conversation
```

### ❌ If These Logs Don't Appear:
**Problem**: setActive/clearActive not being called

---

## Step 6: Manually Test Increment

In Browser A console, type:
```javascript
// Manually trigger increment (if you have access)
// This is just to test if the UI updates
console.log('Testing manual increment...');
```

Watch sidebar for badge to appear.

### ✅ Badge Appears: UI is working, issue is with event handling
### ❌ Badge Doesn't Appear: UI rendering issue

---

## Step 7: Check React DevTools

1. Install React DevTools browser extension
2. Open DevTools -> Components tab
3. Find `NotificationProvider`
4. Check state:
   - `unreadCounts`
   - `activeConversation`

### ✅ Should Show:
```
unreadCounts: {
  direct: {},
  channels: {},
  total: 0
}
activeConversation: {
  type: null,
  id: null
}
```

After receiving message, `unreadCounts` should update.

---

## Step 8: Enable Full Debug Mode

In Browser A console:
```javascript
localStorage.setItem('debug:notifications', 'true');
location.reload();
```

Then repeat test. You should see TONS of logs.

---

## Common Issues & Quick Fixes

### Issue 1: "NotificationContext not receiving messages"

**Check App.jsx context order:**
```jsx
<SocketProvider>
  <NotificationProvider>  ← Must be here
    {/* ... */}
  </NotificationProvider>
</SocketProvider>
```

**Fix**: If wrong order, rearrange and rebuild.

---

### Issue 2: "Socket connected but no message events"

**Check if socket handler is set up on server:**

Server should emit:
```javascript
io.to(`user:${recipientId}`).emit('message:received', message);
```

**Test**: Check server logs when message is sent.

---

### Issue 3: "Messages only work in AdminChatWidget, not NotificationContext"

**Problem**: Both are listening to same event, one might be consuming it.

**Check**: Both should receive the event independently.

---

### Issue 4: "Badge appears briefly then disappears"

**Problem**: `clearUnread` being called immediately.

**Check console for**:
```
[NotificationContext] Incrementing unread...
[NotificationContext] Clearing active conversation
```

If both appear at once, there's a race condition.

---

## Quick Test Script

Run this in Browser A console:

```javascript
// Test Script
console.log('=== NOTIFICATION DEBUG TEST ===');

// 1. Check socket
console.log('1. Socket exists?', typeof window.socket !== 'undefined');

// 2. Check user
console.log('2. User token?', !!localStorage.getItem('token'));

// 3. Check if page is visible
console.log('3. Page visible?', document.visibilityState);

// 4. Manual event trigger (if socket available)
if (window.socket) {
  console.log('4. Triggering test message event...');
  // Note: This is just for testing - real events come from server
}

console.log('=== END TEST ===');
```

---

## Expected Flow (Full Working System)

### Browser A (Receiver):
1. Opens Chat
2. Stays on user list
3. Socket connected ✅
4. NotificationContext listening ✅

### Browser B (Sender):
1. Opens Chat  
2. Selects User A
3. Sends message: "Hello"
4. Server receives message
5. Server emits to Browser A

### Browser A Receives:
1. Socket event: `message:received`
2. NotificationContext handler triggered
3. Checks: Not own message ✅
4. Checks: Not active conversation ✅
5. Increments unread count
6. Shows toast
7. Updates badges
8. Badge shows on sidebar (1)

---

## If NOTHING Works

### Nuclear Option - Fresh Start:

1. **Clear everything**:
```javascript
localStorage.clear();
sessionStorage.clear();
```

2. **Hard reload**:
```
Ctrl + Shift + R (or Cmd + Shift + R)
```

3. **Log in again**

4. **Check console from the moment you log in**

5. **Look for ANY errors**

---

## Report Back With:

Please provide:

1. ✅ Socket connected? (yes/no)
2. ✅ Console shows "NotificationContext listening"? (yes/no)
3. ✅ Console shows "Message received" when message sent? (yes/no)
4. ✅ What error messages appear? (copy/paste)
5. ✅ Screenshot of console logs
6. ✅ Screenshot of React DevTools showing NotificationProvider state

---

This will help identify exactly where the issue is!
