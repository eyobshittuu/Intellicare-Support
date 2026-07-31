# Notification System Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ Both server and client are running
- ✅ At least 2 admin or superadmin accounts exist
- ✅ You have access to 2 different browsers or browser profiles

## Test Environment Setup

### Step 1: Start the Server
```bash
cd server
npm start
```

### Step 2: Start the Client
```bash
cd client
npm run dev
```

### Step 3: Create Test Accounts
You need at least 2 admin accounts for testing. Use existing accounts or create new ones.

## Test Cases

### Test 1: Browser Notification Permission

**Objective**: Verify permission request flow

**Steps**:
1. Open application in a new browser (or incognito mode)
2. Log in as Admin User A
3. Navigate to Chat page
4. Click the bell icon (🔕) in the header
5. Observe permission prompt from browser

**Expected Result**:
- ✅ Browser shows "Allow notifications?" prompt
- ✅ After allowing, bell icon changes to solid (🔔)
- ✅ Toast message: "Notifications enabled"
- ✅ Preference persists after page refresh

**Test Variations**:
- Deny permission → Bell remains as 🔕, toast shows "Notification permission denied"
- Refresh page → Preference is remembered

---

### Test 2: Direct Message Notifications

**Objective**: Verify direct message notifications work

**Setup**:
- Browser 1: Admin User A (notifications enabled)
- Browser 2: Admin User B (notifications enabled)

**Steps**:
1. Browser 1: Open Chat, select User B from Direct tab
2. Browser 2: Navigate away from Chat page (open Dashboard)
3. Browser 1: Send message "Test notification 1" to User B
4. Browser 2: Observe notifications

**Expected Result**:
- ✅ Browser 2 shows desktop notification
- ✅ Notification title: "New message from [User A Name]"
- ✅ Notification body: "Test notification 1"
- ✅ Sidebar Chat menu shows red badge (1)
- ✅ Page title shows "(1) IntelliCare Support"
- ✅ Toast notification appears

**Test Variations**:
- Multiple messages → Count increments
- Click notification → Navigates to chat and clears unread
- Page visible → No browser notification, only toast

---

### Test 3: Channel Message Notifications

**Objective**: Verify channel message notifications

**Setup**:
- Create a test channel with both users as members
- Browser 1: Admin User A
- Browser 2: Admin User B (not viewing the channel)

**Steps**:
1. Browser 1: Open Chat, select test channel
2. Browser 2: View different channel or Direct tab
3. Browser 1: Send message in test channel
4. Browser 2: Observe notifications

**Expected Result**:
- ✅ Browser 2 shows notification
- ✅ Notification: "[User A] in #[channel-name]"
- ✅ Channels tab shows badge with count
- ✅ Channel list shows unread badge next to channel name
- ✅ Total unread count updates

---

### Test 4: @Mention Notifications

**Objective**: Verify mention notifications have higher priority

**Setup**:
- Browser 1: Admin User A
- Browser 2: Admin User B (away from page)

**Steps**:
1. Browser 1: In a channel, type "@[UserB] please review"
2. Browser 2: Observe notifications

**Expected Result**:
- ✅ Browser notification appears
- ✅ Notification title: "[User A] mentioned you"
- ✅ Notification is **persistent** (doesn't auto-dismiss)
- ✅ Toast notification with warning styling
- ✅ Message shows highlighted mention in chat

**Test @everyone**:
1. Browser 1: Type "@everyone team meeting"
2. All channel members receive persistent notification
3. Notification: "[User A] mentioned @everyone"

---

### Test 5: Unread Count Tracking

**Objective**: Verify unread counts are accurate

**Steps**:
1. Browser 2 (User B): Close or navigate away from Chat
2. Browser 1 (User A): Send 3 messages to User B
3. Browser 1 (User A): Send 2 messages in #general channel
4. Browser 2 (User B): Return to application

**Expected Result**:
- ✅ Sidebar Chat badge shows: (5)
- ✅ Direct tab badge shows: (1) [one conversation]
- ✅ Channels tab badge shows: (1) [one conversation]
- ✅ User A in Direct list shows: (3)
- ✅ #general in Channels list shows: (2)
- ✅ Page title: "(5) IntelliCare Support"

---

### Test 6: Clearing Unread Counts

**Objective**: Verify unread counts clear properly

**Setup**:
- User B has unread messages from User A and #general

**Steps**:
1. Browser 2: Click on User A in Direct list
2. View the conversation
3. Observe unread counts

**Expected Result**:
- ✅ User A unread badge disappears
- ✅ Direct tab badge decrements
- ✅ Total count updates
- ✅ Page title updates

**Continue**:
4. Click on #general channel
5. View the conversation

**Expected Result**:
- ✅ Channel unread badge disappears
- ✅ Channels tab badge decrements
- ✅ Total count reaches 0
- ✅ All visual indicators clear

---

### Test 7: Notification Toggle

**Objective**: Verify notification toggle works

**Steps**:
1. Browser 2: Ensure notifications enabled (🔔)
2. Click bell icon to disable
3. Browser 1: Send message to User B
4. Browser 2: Observe behavior

**Expected Result**:
- ✅ Bell icon changes to 🔕
- ✅ Toast: "Notifications disabled"
- ✅ No browser notification appears
- ✅ Toast notification still appears
- ✅ Unread counts still update
- ✅ Visual badges still work

**Re-enable**:
5. Click bell icon again

**Expected Result**:
- ✅ Bell changes to 🔔
- ✅ Toast: "Notifications enabled"
- ✅ Browser notifications work again

---

### Test 8: Multiple Conversations

**Objective**: Test with multiple simultaneous conversations

**Setup**:
- 3 admin users (A, B, C)
- 2 channels (#general, #support)

**Steps**:
1. User B & C: Navigate away from Chat
2. User A: Send messages to:
   - User B direct message
   - User C direct message
   - #general channel
   - #support channel
3. User B: Return to app

**Expected Result**:
- ✅ Correct unread counts per conversation
- ✅ Correct total count
- ✅ Tab badges show correct conversation counts
- ✅ Clearing one conversation doesn't affect others

---

### Test 9: Socket Reconnection

**Objective**: Verify notifications work after reconnection

**Steps**:
1. Browser 2: Open Developer Console (F12)
2. Go to Network tab
3. Disable network / Go offline
4. Observe connection indicator (red dot)
5. Re-enable network / Go online
6. Browser 1: Send message
7. Browser 2: Observe notifications

**Expected Result**:
- ✅ Connection indicator turns red when offline
- ✅ Connection indicator turns green when reconnected
- ✅ Notifications work after reconnection
- ✅ No duplicate notifications

---

### Test 10: Edge Cases

**Test 10a: Send Message to Self**
- Send message from User A to User A
- **Expected**: No notification to self

**Test 10b: Rapid Messages**
- Send 10 messages quickly in succession
- **Expected**: Count increments correctly, no duplicates

**Test 10c: Long Messages**
- Send very long message (500+ characters)
- **Expected**: Notification truncates body properly

**Test 10d: Special Characters**
- Send message with emojis, special chars
- **Expected**: Displays correctly in notification

**Test 10e: File Attachments**
- Send only a file without text
- **Expected**: Notification shows "Sent an attachment"

---

## Performance Testing

### Test 11: Load Testing

**Steps**:
1. Create 50+ messages in a conversation
2. Load the conversation
3. Send new message
4. Observe performance

**Expected Result**:
- ✅ No lag when loading messages
- ✅ Notifications appear promptly
- ✅ UI remains responsive

---

## Browser Compatibility

Test on multiple browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS)
- ✅ Mobile browsers (if applicable)

---

## Checklist Summary

Use this checklist for comprehensive testing:

- [ ] Permission request works
- [ ] Direct message notifications appear
- [ ] Channel message notifications appear
- [ ] @Mention notifications are persistent
- [ ] @everyone mentions work
- [ ] Unread counts are accurate
- [ ] Counts clear when viewing conversation
- [ ] Toggle on/off works
- [ ] Badges appear in all locations
- [ ] Page title updates
- [ ] Toast notifications work
- [ ] Browser notifications work (when page hidden)
- [ ] No browser notifications (when page visible)
- [ ] Notification click navigates correctly
- [ ] Socket reconnection works
- [ ] Multiple conversations tracked correctly
- [ ] No duplicate notifications
- [ ] Special characters display correctly
- [ ] File attachments show correct message
- [ ] Performance is acceptable
- [ ] Works across browsers

---

## Troubleshooting During Testing

### Issue: Notifications Not Appearing

**Check**:
1. Browser console for errors
2. Network tab for socket connection
3. Permission granted in browser
4. Bell icon is solid (enabled)
5. User is not sender

### Issue: Counts Not Clearing

**Check**:
1. Console for errors
2. Socket connection status
3. Conversation was actually selected (not just hovered)

### Issue: Duplicate Notifications

**Check**:
1. Multiple tabs open?
2. Socket connection stable?
3. Console for duplicate event listeners

---

## Reporting Issues

When reporting bugs, include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors (if any)
5. Screenshots
6. Network logs (if relevant)

---

## Success Criteria

Testing is successful when:
- ✅ All test cases pass
- ✅ No console errors
- ✅ Notifications appear consistently
- ✅ Counts are always accurate
- ✅ Performance is acceptable
- ✅ Works across target browsers
- ✅ User experience is smooth

---

**Good luck with testing! 🚀**
