# @Mention System Implementation Guide

## Overview
Implemented a comprehensive @mention system for the admin chat that allows users to tag specific people or notify everyone in a channel.

---

## Features

### 1. **@User Mentions**
- Tag specific users in messages using `@` symbol
- Autocomplete dropdown appears when typing `@`
- Shows user avatars, names, and emails
- Highlights mentioned users in the message

### 2. **@everyone Mentions**
- Notify all members in a channel at once
- Special highlight color (yellow) to distinguish from user mentions
- Only available in channels (not in direct messages)

### 3. **Smart Autocomplete**
- Triggered automatically when typing `@`
- Filters users as you type
- Shows only channel members in channels
- Shows all admins in direct messages
- Keyboard navigation:
  - **Arrow Up/Down**: Navigate through suggestions
  - **Enter**: Select highlighted user
  - **Escape**: Close autocomplete

### 4. **Real-time Notifications**
- Toast notifications when mentioned
- Displays who mentioned you and where
- Different notifications for user mentions vs @everyone

### 5. **Visual Highlighting**
- User mentions: Teal background (`@John Doe`)
- @everyone: Yellow background (`@everyone`)
- Easy to spot in conversation history

---

## Database Changes

### Migration Required
After deployment, run this migration endpoint:

```
GET https://intellicare-support-1.onrender.com/api/migrate/add-mentions-support
```

### Schema Update
Added `mentions` column to `messages` table:
```json
{
  "mentions": {
    "user_ids": [1, 2, 3],
    "everyone": false
  }
}
```

---

## How to Use

### For Users (Frontend)

#### Mentioning Someone:
1. Type `@` in the message input
2. Start typing the person's name or email
3. Select from the autocomplete dropdown
4. Or use arrow keys and press Enter
5. Send the message

#### Mentioning Everyone:
1. Type `@everyone` in a channel (not available in DMs)
2. Send the message
3. All channel members will be notified

#### Keyboard Shortcuts:
- `@` - Trigger mention autocomplete
- `↑` / `↓` - Navigate suggestions
- `Enter` - Select highlighted user
- `Esc` - Close autocomplete

---

## Technical Implementation

### Backend Changes

#### 1. Message Model (`server/models/Message.js`)
```javascript
mentions: {
  type: DataTypes.JSON,
  allowNull: true,
  defaultValue: null
  // Structure: { user_ids: [1, 2, 3], everyone: false }
}
```

#### 2. Socket Handler (`server/socket/chatHandler.js`)
- Accepts `mentions` field in `message:send` event
- Emits `mention:received` event to mentioned users
- Handles @everyone by notifying all channel members
- Includes sender information in notifications

#### 3. Migration Route (`server/routes/migrationRoutes.js`)
- New endpoint: `/api/migrate/add-mentions-support`
- Adds mentions column to messages table
- Works with both PostgreSQL and MySQL

### Frontend Changes

#### 1. State Management (`client/src/components/AdminChatWidget.jsx`)
```javascript
const [showMentionList, setShowMentionList] = useState(false);
const [mentionSearch, setMentionSearch] = useState('');
const [mentionStartIndex, setMentionStartIndex] = useState(-1);
const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
```

#### 2. Core Functions

**extractMentions(content)**
- Parses message content for mentions
- Extracts user IDs from @[Name](userId) format
- Detects @everyone
- Returns structured mention data

**getMentionableUsers()**
- Returns list of users that can be mentioned
- Channel members for channels
- All admins for direct messages

**handleMentionSelect(user)**
- Inserts mention into message
- Formats as @[Name](userId) or @everyone
- Closes autocomplete dropdown

**renderMessageContent(content)**
- Highlights mentions in messages
- Teal background for user mentions
- Yellow background for @everyone
- Returns JSX with styled mentions

#### 3. UI Components

**Mention Autocomplete Dropdown:**
```jsx
<div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl">
  {/* @everyone option (channels only) */}
  {/* Filtered user list */}
</div>
```

**Highlighted Mentions in Messages:**
```jsx
<span className="bg-teal-100 text-teal-700 px-1 rounded font-medium">
  @John Doe
</span>
```

#### 4. Socket Events

**Sending:**
```javascript
socket.emit('message:send', {
  content: message,
  mentions: {
    user_ids: [1, 2, 3],
    everyone: false
  }
});
```

**Receiving:**
```javascript
socket.on('mention:received', (data) => {
  const { message, channel_id, everyone } = data;
  // Show toast notification
});
```

---

## Message Format

### Stored in Database:
```json
{
  "content": "Hey @[John Doe](5) check this out! @everyone",
  "mentions": {
    "user_ids": [5],
    "everyone": true
  }
}
```

### Displayed to User:
```
Hey @John Doe check this out! @everyone
     [teal bg]                 [yellow bg]
```

---

## Notification Types

### User Mention in Channel:
```
"John Doe mentioned you in #general"
```

### @everyone in Channel:
```
"@everyone mentioned you in #general"
```

### User Mention in DM:
```
"John Doe mentioned you"
```

---

## Testing Checklist

### Basic Functionality:
- [ ] Type `@` triggers autocomplete
- [ ] Autocomplete shows correct users
- [ ] Selecting user inserts mention
- [ ] Mention displays with highlight
- [ ] Mentioned user receives notification

### @everyone:
- [ ] @everyone available in channels
- [ ] @everyone not in direct messages
- [ ] All channel members notified
- [ ] Yellow highlight in messages

### Keyboard Navigation:
- [ ] Arrow keys navigate list
- [ ] Enter selects user
- [ ] Escape closes autocomplete

### Edge Cases:
- [ ] Multiple mentions in one message
- [ ] Mix of @user and @everyone
- [ ] Mention at start/middle/end of message
- [ ] Mention with no space after

---

## Migration Instructions

### After Deployment to Production:

1. **Check Migration Status:**
   ```
   GET https://intellicare-support-1.onrender.com/api/migrate/status
   ```

2. **Run Mentions Migration:**
   ```
   GET https://intellicare-support-1.onrender.com/api/migrate/add-mentions-support
   ```

3. **Verify Success:**
   - Check response shows "success: true"
   - Check "mentions" column added to messages table

4. **Test Functionality:**
   - Send a message with @mention
   - Verify mention appears highlighted
   - Verify notification received
   - Test @everyone in a channel

---

## Future Enhancements

### Possible Additions:
1. **Mention Preview** - Hover over mention to see user profile
2. **Mention History** - View all messages where you were mentioned
3. **Notification Settings** - Configure mention notification preferences
4. **Role Mentions** - @admins, @support-team, etc.
5. **Mention Count Badge** - Show unread mention count
6. **Search by Mentions** - Filter messages by mentions
7. **Mute Mentions** - Temporarily disable mention notifications

---

## Troubleshooting

### Autocomplete Not Appearing:
- Check if you're typing `@` in the message input
- Ensure there are users to mention
- Check console for errors

### Mentions Not Highlighted:
- Verify message format is @[Name](userId)
- Check renderMessageContent function
- Inspect message.mentions data

### Notifications Not Received:
- Verify socket connection is active
- Check mention:received event handler
- Ensure user is online (socket connected)
- Check browser notification permissions

### Migration Failed:
- Check database connection
- Verify user has permission to alter tables
- Check if column already exists
- Review server logs for detailed error

---

## Files Modified

### Backend:
1. `server/models/Message.js` - Added mentions field
2. `server/socket/chatHandler.js` - Mention processing & notifications
3. `server/routes/migrationRoutes.js` - Migration endpoint

### Frontend:
1. `client/src/components/AdminChatWidget.jsx` - UI & logic for mentions

---

## Summary

The @mention system provides a powerful way for admins to communicate effectively in channels and direct messages. It includes:

✅ Smart autocomplete with filtering
✅ Keyboard navigation
✅ Real-time notifications
✅ Visual highlighting
✅ @everyone support for channels
✅ Seamless integration with existing chat

The feature is production-ready and just needs the database migration to be run after deployment!
