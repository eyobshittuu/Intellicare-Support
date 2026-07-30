# Channels/Group Chat Feature - Complete Implementation Guide

## 🎯 Overview
Added **Microsoft Teams-style channels and group chats** to allow admins to create multi-user conversations,similar to Teams channels.

## ✅ What's Been Implemented

### Backend (Complete)

#### 1. Database Models Created
- **Channel** (`server/models/Channel.js`)
  - Stores channel information (name, description, type, creator)
  - Supports public/private channels
  - Archive functionality
  - Color avatar for visual distinction

- **ChannelMember** (`server/models/ChannelMember.js`)
  - Maps users to channels
  - Roles: owner, admin, member
  - Tracks last_read_at for unread counts
  - Unique constraint on channel_id + user_id

#### 2. Message Model Updated
- Added `channel_id` field (nullable)
- Made `recipient_id` nullable
- Messages can be either direct (has recipient_id) or channel (has channel_id)

#### 3. Controller Created (`server/controllers/channelController.js`)
**Functions**:
- `createChannel` - Create new channel with initial members
- `getUserChannels` - Get all channels user is member of (with unread counts)
- `getChannel` - Get channel details with members
- `getChannelMessages` - Get channel message history
- `addChannelMembers` - Add members to channel (owner/admin only)
- `removeChannelMember` - Remove member from channel
- `updateChannel` - Update channel name/description/type
- `archiveChannel` - Archive channel (owner only)

#### 4. Routes Created (`server/routes/channelRoutes.js`)
```
POST   /api/channels                        - Create channel
GET    /api/channels                        - Get user's channels
GET    /api/channels/:channelId             - Get channel details
PUT    /api/channels/:channelId             - Update channel
DELETE /api/channels/:channelId/archive     - Archive channel
GET    /api/channels/:channelId/messages    - Get channel messages
POST   /api/channels/:channelId/members     - Add members
DELETE /api/channels/:channelId/members/:memberId - Remove member
```

#### 5. Socket.IO Events Added (`server/socket/chatHandler.js`)
**New Events**:
- `message:send` - Updated to support channel messages (with channel_id)
- `channel:join` - Join channel room for real-time updates
- `channel:leave` - Leave channel room
- `channel:typing:start` - Typing indicator in channel
- `channel:typing:stop` - Stop typing in channel

**Authentication Updated**:
- Automatically joins all user's channel rooms on connect
- Broadcasts to channel rooms for group messages

#### 6. Server Configuration
- Added channel routes to `server.js`
- Updated model associations in `models/index.js`

### Frontend Service Created

#### channelService.js (`client/src/services/channelService.js`)
Complete API wrapper for all channel operations

---

## 🔄 Database Migration Required

### Migration Endpoint Created
Path: `/api/migrate/add-channels-support`

Creates:
1. `channels` table
2. `channel_members` table
3. Adds `channel_id` to `messages` table
4. Makes `recipient_id` nullable in messages

**Run This**:
```
GET https://intellicare-support-1.onrender.com/api/migrate/add-channels-support
```

---

## 📋 Frontend Implementation Needed

The backend is **100% complete**, but the frontend AdminChatWidget needs to be updated to support channels. Here's what needs to be added:

### 1. Update AdminChatWidget.jsx

**Add States**:
```javascript
const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'channels'
const [channels, setChannels] = useState([]);
const [selectedChannel, setSelectedChannel] = useState(null);
const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
const [channelForm, setChannelForm] = useState({ 
  name: '', 
  description: '', 
  channel_type: 'private', 
  member_ids: [] 
});
```

**Add Tab Navigation** (in widget header area):
```jsx
{!isMinimized && showUserList && (
  <div className="border-b border-gray-200">
    <div className="flex">
      <button
        className={`flex-1 px-4 py-2 text-sm font-medium ${
          activeTab === 'direct' 
            ? 'text-teal-600 border-b-2 border-teal-600' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('direct')}
      >
        <Users className="inline mr-1" size={16} />
        Direct Messages
      </button>
      <button
        className={`flex-1 px-4 py-2 text-sm font-medium ${
          activeTab === 'channels' 
            ? 'text-teal-600 border-b-2 border-teal-600' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('channels')}
      >
        <Hash className="inline mr-1" size={16} />
        Channels
      </button>
    </div>
  </div>
)}
```

**Add Channel List View**:
```jsx
{activeTab === 'channels' && (
  <>
    {/* Create Channel Button */}
    <div className="p-2 border-b">
      <button
        onClick={() => setShowCreateChannelModal(true)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
      >
        <Plus size={16} />
        Create Channel
      </button>
    </div>

    {/* Channel List */}
    <div className="flex-1 overflow-y-auto">
      {channels.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <Hash className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p className="text-sm">No channels yet</p>
        </div>
      ) : (
        channels.map((membership) => (
          <div
            key={membership.channel.id}
            className="p-3 hover:bg-gray-50 cursor-pointer border-b"
            onClick={() => handleChannelSelect(membership.channel)}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: membership.channel.avatar_color }}
              >
                #
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {membership.channel.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {membership.channel.members.length} members
                </p>
              </div>
              {membership.unreadCount > 0 && (
                <span className="bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {membership.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </>
)}
```

**Add Create Channel Modal**:
```jsx
{showCreateChannelModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
    <div className="bg-white rounded-lg p-6 w-96 max-h-[600px] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Create New Channel</h3>
      
      <div className="space-y-4">
        {/* Channel Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Channel Name *</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g., General Discussion"
            value={channelForm.name}
            onChange={(e) => setChannelForm({...channelForm, name: e.target.value})}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg"
            rows="3"
            placeholder="What's this channel about?"
            value={channelForm.description}
            onChange={(e) => setChannelForm({...channelForm, description: e.target.value})}
          />
        </div>

        {/* Channel Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Channel Type</label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={channelForm.channel_type}
            onChange={(e) => setChannelForm({...channelForm, channel_type: e.target.value})}
          >
            <option value="private">Private (Invite only)</option>
            <option value="public">Public (All admins can see)</option>
          </select>
        </div>

        {/* Add Members */}
        <div>
          <label className="block text-sm font-medium mb-2">Add Members</label>
          <div className="border rounded-lg max-h-40 overflow-y-auto">
            {admins.map(admin => (
              <label key={admin.id} className="flex items-center p-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={channelForm.member_ids.includes(admin.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setChannelForm({
                        ...channelForm,
                        member_ids: [...channelForm.member_ids, admin.id]
                      });
                    } else {
                      setChannelForm({
                        ...channelForm,
                        member_ids: channelForm.member_ids.filter(id => id !== admin.id)
                      });
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{admin.first_name} {admin.last_name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={() => {
            setShowCreateChannelModal(false);
            setChannelForm({ name: '', description: '', channel_type: 'private', member_ids: [] });
          }}
          className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateChannel}
          disabled={!channelForm.name.trim()}
          className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  </div>
)}
```

**Add Handler Functions**:
```javascript
// Load channels
const loadChannels = async () => {
  try {
    const response = await getUserChannels();
    if (response.success) {
      setChannels(response.data);
    }
  } catch (error) {
    console.error('Error loading channels:', error);
    toast.error('Failed to load channels');
  }
};

// Create channel
const handleCreateChannel = async () => {
  try {
    const response = await createChannel(channelForm);
    if (response.success) {
      toast.success('Channel created successfully!');
      setShowCreateChannelModal(false);
      setChannelForm({ name: '', description: '', channel_type: 'private', member_ids: [] });
      await loadChannels();
      
      // Join the new channel room via socket
      if (socket) {
        socket.emit('channel:join', { channelId: response.data.id });
      }
    }
  } catch (error) {
    console.error('Error creating channel:', error);
    toast.error('Failed to create channel');
  }
};

// Select channel
const handleChannelSelect = async (channel) => {
  setSelectedChannel(channel);
  setShowUserList(false);
  await loadChannelMessages(channel.id);
  
  // Join channel room for real-time messages
  if (socket) {
    socket.emit('channel:join', { channelId: channel.id });
  }
};

// Load channel messages
const loadChannelMessages = async (channelId) => {
  try {
    const response = await getChannelMessages(channelId);
    setMessages(response.data);
  } catch (error) {
    console.error('Error loading channel messages:', error);
    toast.error('Failed to load messages');
  }
};

// Send message (update to support channels)
const handleSendMessage = async (e) => {
  e.preventDefault();
  
  if ((!newMessage.trim() && !selectedFile) || !socket) return;
  if (!selectedAdmin && !selectedChannel) return;

  let attachmentData = null;
  let messageType = 'text';

  // Upload file if attached
  if (selectedFile) {
    try {
      setUploading(true);
      const uploadResult = await uploadChatFile(selectedFile);
      attachmentData = uploadResult.data;
      
      if (selectedFile.type.startsWith('image/')) {
        messageType = 'image';
      } else {
        messageType = 'file';
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
      setUploading(false);
      return;
    } finally {
      setUploading(false);
    }
  }

  const messageData = {
    content: newMessage.trim() || null,
    attachments: attachmentData ? [attachmentData] : null,
    message_type: messageType
  };

  // Add recipient or channel ID
  if (selectedChannel) {
    messageData.channel_id = selectedChannel.id;
    // Stop typing in channel
    socket.emit('channel:typing:stop', { channelId: selectedChannel.id });
  } else if (selectedAdmin) {
    messageData.recipient_id = selectedAdmin.id;
    socket.emit('typing:stop', { recipient_id: selectedAdmin.id });
  }

  socket.emit('message:send', messageData);

  setNewMessage('');
  setSelectedFile(null);
};
```

**Update Socket Listeners**:
```javascript
useEffect(() => {
  if (!socket || !isOpen) return;

  // Existing message received handler
  socket.on('message:received', (message) => {
    // For direct messages
    if (selectedAdmin && message.recipient_id && 
        (message.sender_id === selectedAdmin.id || message.recipient_id === selectedAdmin.id)) {
      setMessages(prev => [...prev, message]);
      if (message.recipient_id === user.id) {
        socket.emit('message:read', { messageId: message.id });
      }
    }
    
    // For channel messages
    if (selectedChannel && message.channel_id === selectedChannel.id) {
      setMessages(prev => [...prev, message]);
    }
  });

  // Channel typing indicators
  socket.on('channel:typing:start', (data) => {
    if (selectedChannel && data.channelId === selectedChannel.id) {
      setTypingUsers(prev => [...new Set([...prev, data.userId])]);
    }
  });

  socket.on('channel:typing:stop', (data) => {
    if (selectedChannel && data.channelId === selectedChannel.id) {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
    }
  });

  // ...rest of existing listeners

  return () => {
    socket.off('message:received');
    socket.off('channel:typing:start');
    socket.off('channel:typing:stop');
    // ...rest
  };
}, [socket, isOpen, selectedAdmin, selectedChannel, user]);
```

**Update Header to Show Channel Info**:
```jsx
<h3 className="font-semibold">
  {selectedChannel ? (
    <>
      <Hash className="inline mr-1" size={16} />
      {selectedChannel.name}
    </>
  ) : selectedAdmin ? (
    `${selectedAdmin.first_name} ${selectedAdmin.last_name}`
  ) : (
    'Admin Chat'
  )}
</h3>
```

---

## 🎨 UI/UX Design

### Layout Structure
```
┌─────────────────────────────────┐
│  Header (Status, Minimize, X)  │
├─────────────────────────────────┤
│  Tabs: [Direct | Channels]     │
├─────────────────────────────────┤
│  Search Bar                     │
├─────────────────────────────────┤
│  [+ Create Channel] (if channels)│
├─────────────────────────────────┤
│  List (Admins or Channels)     │
│    - Avatar/Icon                │
│    - Name                       │
│    - Unread Count (if any)      │
└─────────────────────────────────┘
```

### Channel View
```
┌─────────────────────────────────┐
│  # Channel Name   [← Back]      │
│  X members                      │
├─────────────────────────────────┤
│  Messages (with sender names)   │
│  - John: Hey everyone!          │
│  - Mary: Hi John!               │
│  - You: Hello team!             │
├─────────────────────────────────┤
│  [📎] [😊] [Type message...] [➤]│
└─────────────────────────────────┘
```

---

## 🔐 Permissions

### Channel Roles
- **Owner**: Created the channel
  - Can delete/archive channel
  - Can add/remove any member
  - Can change channel settings
  - Can promote members to admin

- **Admin**: Promoted by owner
  - Can add/remove members
  - Can change channel settings
  - Cannot delete channel

- **Member**: Regular member
  - Can send messages
  - Can leave channel
  - Cannot manage channel

### Channel Types
- **Private**: Only visible to members, invite-only
- **Public**: All admins can see and join

---

## 📝 Testing Checklist

### Backend (All Complete ✅)
- [x] Create channel with members
- [x] Get user's channels with unread counts
- [x] Get channel details and members
- [x] Send message to channel
- [x] Get channel messages
- [x] Add members to channel
- [x] Remove member from channel
- [x] Update channel info
- [x] Archive channel
- [x] Socket.IO channel rooms
- [x] Real-time channel messages
- [x] Channel typing indicators

### Frontend (Needs Implementation ⏳)
- [ ] Tab navigation (Direct / Channels)
- [ ] Load and display channel list
- [ ] Create channel modal with member selection
- [ ] Click channel to open chat
- [ ] Send messages in channel
- [ ] Receive real-time channel messages
- [ ] Typing indicators in channels
- [ ] File attachments in channels
- [ ] Emoji reactions in channels
- [ ] Add members to existing channel
- [ ] Leave channel
- [ ] Show member list
- [ ] Unread message counts

---

## 🚀 Deployment Steps

### 1. Run Database Migration
```
GET https://intellicare-support-1.onrender.com/api/migrate/add-channels-support
```

### 2. Deploy Backend Code
```bash
git add server/
git commit -m "Add channels/group chat backend"
git push origin main
```

### 3. Update Frontend (AdminChatWidget.jsx)
- Add the UI components from section above
- Update socket listeners
- Add channel service imports
- Test locally first

### 4. Deploy Frontend
```bash
git add client/
git commit -m "Add channels/group chat UI"
git push origin main
```

---

## 📚 API Reference

### Create Channel
```http
POST /api/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "General Discussion",
  "description": "Team-wide announcements and discussions",
  "channel_type": "private",
  "member_ids": [2, 3, 5, 8]
}
```

### Get User's Channels
```http
GET /api/channels
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "channel": {
        "id": 1,
        "name": "General Discussion",
        "description": "...",
        "channel_type": "private",
        "created_by": 1,
        "avatar_color": "#14b8a6",
        "members": [...]
      },
      "role": "owner",
      "unreadCount": 5
    }
  ]
}
```

### Send Channel Message
```javascript
socket.emit('message:send', {
  channel_id: 1,
  content: "Hello everyone!",
  attachments: null,
  message_type: "text"
});
```

---

## 🎯 Summary

### ✅ Complete (Backend)
- Database models and migrations
- Controllers with all CRUD operations
- API routes with authentication
- Socket.IO real-time messaging
- Channel permissions and roles
- Unread message tracking

### ⏳ Remaining (Frontend)
- Update AdminChatWidget.jsx with tabs and channel UI
- Add create channel modal
- Handle channel selection and messaging
- Update socket listeners for channels
- Add channel member management UI

**Estimated Time to Complete Frontend**: 4-6 hours

---

**Last Updated**: July 30, 2026
**Status**: Backend 100% Complete | Frontend Needs Implementation
