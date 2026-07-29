# Chat System - Testing Guide

## ✅ System is Ready!

**Client**: http://localhost:5173
**Server**: http://localhost:5000  
**Database**: Connected ✅

## How to Test the Chat System

### Step 1: Access the Chat
1. Login to your application
2. Click on **"Messages"** in the sidebar navigation
3. You should see the chat interface

### Step 2: Browse All Users
The chat system now has two ways to find users:

#### Option A: Browse All Users (NEW!)
1. Click the **"Browse All Users"** button
2. You'll see a list of ALL active users in the system
3. Scroll through the list
4. Click on any user to start chatting

#### Option B: Search for Specific Users
1. Type at least 2 characters in the search box
2. The system will search for matching:
   - First names
   - Last names  
   - Email addresses
3. Results appear as you type
4. Click on a user from search results

### Step 3: Start a Conversation
1. Select a user (from browse or search)
2. The chat window opens on the right
3. Type your message in the input box
4. Press "Send" or hit Enter
5. Message appears instantly!

### Step 4: Test Real-time Features

#### Test with Two Users:
**Setup**: Open two different browsers (or one incognito):
- Browser 1: Login as User A
- Browser 2: Login as User B

#### Features to Test:

1. **Online Status**
   - ✅ Green dot appears next to online users
   - ✅ Status shows "Online" or "Offline"

2. **Real-time Messages**
   - User A sends message to User B
   - User B receives it INSTANTLY without refresh
   - ✅ Works both ways

3. **Typing Indicator**
   - User A starts typing
   - User B sees three animated dots
   - ✅ Shows who is typing

4. **Read Receipts**
   - User A sends message
   - User B opens the chat
   - User A sees ✓✓ (double checkmark)
   - ✅ Confirms message was read

5. **Unread Badge**
   - User B has unread messages
   - Navigation shows red badge with count
   - ✅ Updates in real-time

6. **Message History**
   - All messages saved to database
   - Refresh the page
   - Messages still there
   - ✅ Persistent storage

## Troubleshooting

### "Browse All Users" button shows (0)

**Problem**: No users are being loaded from database

**Solutions**:

1. **Check if database has users**:
   ```sql
   mysql -u root -p
   USE intellicare_support;
   SELECT id, first_name, last_name, email, is_active FROM users;
   ```

2. **Check server console** for errors:
   - Look for "Returning X total active users" message
   - Should show number of users found

3. **Check browser console** (F12):
   - Look for "Loaded X users" message
   - Check for any API errors

4. **Verify API endpoint**:
   - Open: http://localhost:5000/api/chat/users
   - Should return JSON with user list
   - If error 401: Token expired, re-login

### Search doesn't return results

**Problem**: Typing in search box shows no users

**Check**:

1. **Type at least 2 characters**
   - Search requires minimum 2 chars
   - Try typing "admin" or "user"

2. **Check server logs**:
   - Should see: "Search query: [your query] User ID: [your id]"
   - Should see: "Found X users matching..."

3. **Try exact match**:
   - Type exact first name
   - Type exact email

### Messages not sending

**Check**:
1. **Connection status** - Must show "Connected" (green dot)
2. **Browser console** - Any socket errors?
3. **Server running** - Check terminal for errors
4. **Database connected** - Should see ✅ in server logs

### Socket not connecting

**Check**:
1. **Client .env** has correct API URL:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

2. **Restart client**:
   - Stop client (Ctrl+C)
   - Start: `npm run dev`

3. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R
   - Or clear cache in DevTools

## Expected Console Output

### Server Console (should show):
```
🚀 Server running on http://localhost:5000
📝 Environment: development
💬 Socket.IO enabled
✅ Database connected successfully
New socket connection: [socket-id]
User [user-id] authenticated
```

### Browser Console (should show):
```
Socket connected: [socket-id]
Socket authenticated: {userId: X}
Loaded X users
```

### When searching:
**Server:**
```
Search query: john User ID: 1
Found 3 users matching "john"
```

**Browser:**
```
Search response: {success: true, data: Array(3)}
Found 3 users
```

## Database Check

### Verify Users Table:
```sql
-- Check total users
SELECT COUNT(*) FROM users;

-- Check active users  
SELECT COUNT(*) FROM users WHERE is_active = 1;

-- List all users
SELECT id, first_name, last_name, email, role, is_active 
FROM users;
```

### Verify Messages Table:
```sql
-- Check if messages table exists
SHOW TABLES LIKE 'messages';

-- Check messages
SELECT * FROM messages;
```

## API Endpoints to Test Manually

### Get All Users:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/chat/users
```

### Search Users:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/chat/users/search?query=john"
```

### Get Conversations:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/chat/conversations
```

## Quick Fixes

### Restart Everything:
```bash
# Stop both terminals (Ctrl+C)

# Terminal 1 - Server:
cd server
npm run dev

# Terminal 2 - Client:
cd client  
npm run dev
```

### Clear and Fresh Start:
1. Close all browser tabs
2. Restart server
3. Restart client
4. Login again
5. Go to Messages
6. Click "Browse All Users"

## Success Indicators

✅ **Setup Complete When You See**:
1. "Browse All Users (X)" button shows number > 0
2. Clicking button shows list of users
3. Can select a user and open chat
4. Can send and receive messages
5. Connection status shows "Connected" (green)
6. Server logs show "User authenticated"
7. Browser console shows "Loaded X users"

## Common Issues Fixed

✅ **Added "Browse All Users" button** - Now easy to see all users
✅ **Added debug logging** - Server and client show what's happening
✅ **Added "is_active" filter** - Only shows active users
✅ **Improved search** - Better error handling
✅ **Better UI** - Close button, counters, clearer labels

## Still Having Issues?

1. **Check this file**: `FIX-MYSQL-CONNECTION.md`
2. **Check server logs** in terminal
3. **Check browser console** (F12)
4. **Verify database** has users
5. **Try restarting** both server and client

## Contact for Help

Check these files for more info:
- `CHAT-SYSTEM-GUIDE.md` - Complete feature documentation
- `FIX-MYSQL-CONNECTION.md` - Database setup help
- Server logs in terminal
- Browser DevTools console (F12)

---

**Last Updated**: 2026-07-29  
**Status**: ✅ Fully functional with browse and search features
