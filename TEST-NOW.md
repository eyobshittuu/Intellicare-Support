# Test Notifications NOW - Simple Steps

## Wait for Deployment (5 minutes)

Your code is deployed. Wait ~5 minutes for Vercel to rebuild.

---

## Step 1: Open Your App

Open: `https://intellicare-support.vercel.app`

---

## Step 2: Open Console IMMEDIATELY

Press `F12` (or Right-click → Inspect → Console tab)

**Keep console open for ALL steps below**

---

## Step 3: Log In

Log in as an admin user.

### Check Console - Should See:
```
Connecting to socket server: https://intellicare-support-1.onrender.com
✅ Socket connected: [some-id]
Transport: websocket
✅ Socket authenticated: {userId: 123}
[NotificationContext] Setting up socket listeners
```

### ❌ If You See Errors:
Stop here and share the error messages.

---

## Step 4: Run Debug Command

In the console, type:
```javascript
window.__NOTIFICATION_DEBUG__.getState()
```

Press Enter.

### Should Show:
```
=== NOTIFICATION SYSTEM STATE ===
Unread Counts: {direct: {}, channels: {}, total: 0}
Active Conversation: {type: null, id: null}
Notifications Enabled: false
Permission: default
Socket Connected: true
User: 123
================================
```

**Copy this output and share it with me**

---

## Step 5: Open Second Browser

Open a **different browser** (or incognito window) with the same URL.

Log in as a **different admin user**.

---

## Step 6: Send Test Message

**Browser 2 (sender)**:
1. Go to Chat
2. Select the first user (Browser 1's user)
3. Type: "Test notification 123"
4. Press Send

---

## Step 7: Check Browser 1

**Browser 1 (receiver)**:

Look at the console immediately.

### ✅ Should See:
```
[NotificationContext] Message received: {sender_id: 2, recipient_id: 1, ...}
[NotificationContext] Current user ID: 1
[NotificationContext] Message sender ID: 2
[NotificationContext] Incrementing unread for user: 2
[NotificationContext] Showing toast notification
```

### Also Check:
- Sidebar: Badge with (1) appears next to "Chat"
- Toast popup appears with message
- Page title: "(1) IntelliCare Support"

---

## If Step 7 Fails:

### A. No Console Logs at All?

Run this in Browser 1 console:
```javascript
// Check if socket is receiving events
window.socket = null; // reset
// Then have Browser 2 send another message
```

### B. Console Logs Appear But No Badge?

Run this in Browser 1 console:
```javascript
// Manually test increment
window.__NOTIFICATION_DEBUG__.manualIncrement('direct', 2)
```

Does badge appear now?
- **Yes**: Event handling issue
- **No**: UI rendering issue

### C. Badge Appears Then Disappears?

Check console for:
```
[NotificationContext] Clearing active conversation
```

If you see this, there's a clearing issue.

---

## Report Back With:

Please share:

1. **Console output from Step 3** (connection logs)
2. **Output from Step 4** (debug state)
3. **Console output from Step 7** (message logs)
4. **Screenshot of Browser 1 showing**:
   - Console logs
   - Chat page
   - Sidebar (to see if badge appears)

This will help me identify the exact issue!

---

## Quick Manual Test

If above doesn't work, try this in Browser 1 console:

```javascript
// Force a notification manually
window.__NOTIFICATION_DEBUG__.manualIncrement('direct', 999);
```

Then run:
```javascript
window.__NOTIFICATION_DEBUG__.getState()
```

Check if `total` is now 1.

Then look at sidebar - does badge appear?

- **Yes**: System works, issue is with receiving messages
- **No**: UI binding issue

---

## Alternative: Test Locally

If deployed version is problematic, test locally:

### Terminal 1:
```bash
cd server
npm start
```

### Terminal 2:
```bash
cd client  
npm run dev
```

Open `http://localhost:5173` in two browsers and test.

---

**Ready to debug! Share the console outputs and I'll help fix it immediately.** 🔍
