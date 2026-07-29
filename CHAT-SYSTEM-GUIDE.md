# Chat System Implementation Guide

## Overview
A complete real-time chat system has been added to the IntelliCare Ticketing System that allows users to message each other by searching for and selecting usernames.

## Features Implemented

### ✅ Backend Features
1. **Real-time messaging** using Socket.IO
2. **Message persistence** with MySQL database
3. **User search** functionality
4. **Online/offline status** tracking
5. **Typing indicators**
6. **Read receipts** (✓✓ checkmarks)
7. **Unread message counter**
8. **RESTful API endpoints** for chat operations

### ✅ Frontend Features
1. **Modern chat UI** with conversations list
2. **Real-time message updates**
3. **User search** to start new conversations
4. **Online status indicators** (green dot)
5. **Typing animations**
6. **Message timestamps**
7. **Unread badge** in navigation
8. **Responsive design** for mobile and desktop

## Technical Architecture

### Database
- **New Table**: `messages`
  - sender_id (foreign key to users)
  - recipient_id (foreign key to users)
  - content (TEXT)
  - is_read (BOOLEAN)
  - read_at (TIMESTAMP)
  - created_at, updated_at

### Backend Structure

#### New Files Created:
```
server/
├── models/
│   └── Message.js                 # Message model
├── controllers/
│   └── chatController.js          # Chat API logic
├── routes/
│   └── chatRoutes.js              # Chat endpoints
└── socket/
    └── chatHandler.js             # Socket.IO real-time logic
```

#### API Endpoints:
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/messages/:otherUserId` - Get messages with a user
- `POST /api/chat/messages` - Send a message
- `PUT /api/chat/messages/read/:senderId` - Mark messages as read
- `GET /api/chat/users/search?query=` - Search users
- `GET /api/chat/unread-count` - Get unread message count

#### Socket Events:
- `authenticate` - Authenticate socket connection
- `message:send` - Send a message in real-time
- `message:received` - Receive a message
- `message:read` - Mark message as read
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline
- `users:online` - Get list of online users

### Frontend Structure

#### New Files Created:
```
client/src/
├── context/
│   └── SocketContext.jsx          # Socket.IO connection management
├── services/
│   └── chatService.js             # Chat API calls
└── pages/
    └── Chat.jsx                   # Main chat page component
```

#### Updates Made:
- `App.jsx` - Added SocketProvider and /chat route
- `MainLayout.jsx` - Added Messages navigation link with unread badge

## How to Use

### For Users:

1. **Access Chat**
   - Click on "Messages" in the sidebar navigation
   - Badge shows number of unread messages

2. **Start a Conversation**
   - Use the search box at the top to find users by name or email
   - Click on a user from search results to open chat

3. **Send Messages**
   - Type your message in the input box at the bottom
   - Press "Send" or hit Enter
   - Messages appear in real-time

4. **View Status**
   - Green dot = user is online
   - Gray/no dot = user is offline
   - ✓✓ = message has been read

5. **Features**
   - See when someone is typing (three animated dots)
   - Messages automatically mark as read when viewing
   - Conversation list shows recent chats
   - Timestamps show when messages were sent

### For Admins:
All users (including admins and super admins) have access to the chat system.

## Testing the Chat System

### Prerequisites:
1. MySQL database must be running
2. Server must be started: `cd server && npm run dev`
3. Client must be started: `cd client && npm run dev`

### Test Steps:

1. **Register/Login with two different users** (use two browsers or incognito mode)
   - User A: Login in normal browser
   - User B: Login in incognito browser

2. **Start a conversation**
   - User A: Go to Messages → Search for User B
   - Click on User B to open chat

3. **Send messages**
   - Type a message and send
   - User B should receive it in real-time

4. **Test features**
   - ✅ Online status (green dot appears)
   - ✅ Typing indicator (type slowly to see dots)
   - ✅ Read receipts (✓✓ appears when read)
   - ✅ Unread badge (shows count in navigation)
   - ✅ Message persistence (refresh page, messages stay)

## Database Migration

To create the messages table in your database, the server will automatically sync the table when it starts (using Sequelize's auto-sync feature).

If you prefer manual migration:

```sql
CREATE TABLE messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender (sender_id),
  INDEX idx_recipient (recipient_id),
  INDEX idx_created (created_at)
);
```

## Configuration

### Environment Variables (already configured)
```
# Server .env
PORT=5000
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173

# Client .env
VITE_API_URL=http://localhost:5000/api
```

### Socket.IO Configuration
- Auto-reconnection enabled
- 5 reconnection attempts
- 1 second delay between attempts
- CORS enabled for local development

## Troubleshooting

### Socket not connecting?
1. Check if server is running
2. Verify VITE_API_URL in client/.env
3. Check browser console for errors
4. Ensure CORS is properly configured

### Messages not sending?
1. Check if user is authenticated (token valid)
2. Verify socket connection status (shown in chat UI)
3. Check server logs for errors
4. Ensure recipient user exists

### Database errors?
1. Check if MySQL is running
2. Verify DB credentials in server/.env
3. Check if messages table exists
4. Review server console for migration errors

## Future Enhancements (Optional)

### Possible additions:
- [ ] Group chat support
- [ ] File/image sharing
- [ ] Voice messages
- [ ] Emoji support
- [ ] Message editing/deletion
- [ ] Push notifications
- [ ] Chat within ticket context
- [ ] Message search/filtering
- [ ] Archived conversations
- [ ] Block/report users

## Code Quality Notes

- ✅ All socket events are properly cleaned up
- ✅ Authentication middleware on all API routes
- ✅ Real-time updates without page refresh
- ✅ Responsive design for mobile/desktop
- ✅ Error handling on API calls
- ✅ Loading states and connection status
- ✅ Database indexes for performance
- ✅ Proper relationship definitions in models

## Dependencies Added

### Server:
```json
"socket.io": "^4.x.x"
```

### Client:
```json
"socket.io-client": "^4.x.x"
```

## Status

✅ **FULLY IMPLEMENTED AND TESTED**
- Backend API: ✅ Working
- Socket.IO: ✅ Working
- Frontend UI: ✅ Working
- Database: ✅ Schema created
- Real-time: ✅ Functional

## Access the Chat

1. Start both server and client
2. Login to the application
3. Click "Messages" in the sidebar
4. Search for users and start chatting!

**Current URLs:**
- Client: http://localhost:5173
- Server: http://localhost:5000
- Chat: http://localhost:5173/chat

---

**Implementation Date**: 2026-07-29
**Developer Notes**: Complete real-time chat system with modern UI, typing indicators, read receipts, and online status tracking.
