# Notification System - Flow Diagrams

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    React Application                       │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │             NotificationContext                    │  │ │
│  │  │  • Manages unread counts                           │  │ │
│  │  │  • Listens to socket events                        │  │ │
│  │  │  • Triggers notifications                          │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                         │                                  │ │
│  │                         ▼                                  │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │          NotificationService                       │  │ │
│  │  │  • Browser Notification API                        │  │ │
│  │  │  • Permission management                           │  │ │
│  │  │  • Display & click handlers                        │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │              UI Components                         │  │ │
│  │  │  • AdminChatWidget (chat interface + badges)       │  │ │
│  │  │  • MainLayout (sidebar badge)                      │  │ │
│  │  │  • Toast notifications                             │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                         ▲                                       │
│                         │ Socket.IO                             │
│                         │ Real-time Events                      │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      Server (Node.js)                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Socket.IO Server                             │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │            Chat Handler                            │  │ │
│  │  │  • Receives messages                               │  │ │
│  │  │  • Saves to database                               │  │ │
│  │  │  • Emits to recipients                             │  │ │
│  │  │  • Triggers notification events                    │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                         │                                       │
│                         ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Database                               │ │
│  │  • Messages table                                         │ │
│  │  • Users table                                            │ │
│  │  • Channels table                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Message Send & Notification Flow

```
┌──────────┐                                              ┌──────────┐
│ User A   │                                              │ User B   │
│ (Sender) │                                              │(Receiver)│
└────┬─────┘                                              └────▲─────┘
     │                                                         │
     │ 1. Types message                                       │
     │    "Hello @UserB"                                      │
     │                                                         │
     ▼                                                         │
┌─────────────┐                                               │
│ AdminChat   │                                               │
│ Widget      │                                               │
└─────┬───────┘                                               │
      │                                                        │
      │ 2. socket.emit('message:send', {...})                │
      │                                                        │
      ▼                                                        │
┌──────────────────────────────────────────────┐             │
│          Server Socket Handler               │             │
│                                               │             │
│  3. Receive message                           │             │
│  4. Validate sender/recipient                 │             │
│  5. Save to database                          │             │
│  6. Fetch complete message with user data     │             │
└──────┬────────────────────────┬────────────────┘            │
       │                        │                             │
       │                        │                             │
       │ 7a. To sender          │ 7b. To recipient            │
       │ message:received       │ message:received            │
       │                        │ notification:new            │
       │                        │                             │
       ▼                        └─────────────────────────────┤
┌─────────────┐                                               │
│ User A      │                                               │
│ (Echo back) │                                               │
└─────────────┘                                               │
                                                              │
                                            ┌─────────────────▼──────┐
                                            │ User B Socket          │
                                            │                        │
                                            │ 8. Receives events     │
                                            └────────┬───────────────┘
                                                     │
                                   ┌─────────────────┴─────────────────┐
                                   │                                   │
                                   ▼                                   ▼
                    ┌──────────────────────────┐    ┌──────────────────────────┐
                    │  NotificationContext     │    │   AdminChatWidget        │
                    │                          │    │                          │
                    │  9a. Increment unread    │    │  9b. Add message to UI   │
                    │  9b. Check page visible  │    │                          │
                    │  9c. Trigger notification│    │                          │
                    └──────────────┬───────────┘    └──────────────────────────┘
                                   │
                    ┌──────────────┴─────────────────┐
                    │                                │
           10a. Page Hidden             10b. Page Visible
                    │                                │
                    ▼                                ▼
    ┌────────────────────────────┐   ┌────────────────────────────┐
    │  Browser Notification      │   │  Toast Notification        │
    │                            │   │                            │
    │  • Desktop alert           │   │  • In-app popup            │
    │  • Sound/vibration         │   │  • Auto-dismiss            │
    │  • Click to navigate       │   │                            │
    └────────────────────────────┘   └────────────────────────────┘
                    │
                    │
    ┌───────────────▼───────────────┐
    │  Visual Indicators            │
    │                               │
    │  • Sidebar badge              │
    │  • Tab badges                 │
    │  • User/channel badges        │
    │  • Page title update          │
    │  • Bell icon badge            │
    └───────────────────────────────┘
```

---

## 3. Unread Count Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification Context                     │
└─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┴─────────────────────────┐
    │                                                     │
    ▼                                                     ▼
┌────────────────────┐                      ┌────────────────────┐
│  Message Received  │                      │  View Conversation │
│                    │                      │                    │
│  • From socket     │                      │  • User clicks     │
│  • Not from self   │                      │    conversation    │
└─────────┬──────────┘                      └─────────┬──────────┘
          │                                           │
          ▼                                           ▼
┌─────────────────────────────────┐     ┌─────────────────────────────┐
│  incrementUnread()              │     │  clearUnread()              │
│                                 │     │                             │
│  if (isChannel) {               │     │  if (type === 'direct') {   │
│    channels[id]++               │     │    delete direct[id]        │
│  } else {                       │     │  } else {                   │
│    direct[id]++                 │     │    delete channels[id]      │
│  }                              │     │  }                          │
│                                 │     │                             │
│  total = sum(all counts)        │     │  total = sum(all counts)    │
└──────────┬──────────────────────┘     └──────────┬──────────────────┘
           │                                       │
           └───────────────┬───────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │    Update All UI Elements    │
            │                              │
            │  • Sidebar badge             │
            │  • Tab badges                │
            │  • Individual badges         │
            │  • Page title                │
            │  • Bell icon badge           │
            └──────────────────────────────┘
```

---

## 4. State Management Structure

```
NotificationContext State:
├── unreadCounts
│   ├── direct: {}
│   │   ├── userId1: count
│   │   ├── userId2: count
│   │   └── userId3: count
│   ├── channels: {}
│   │   ├── channelId1: count
│   │   ├── channelId2: count
│   │   └── channelId3: count
│   └── total: number (sum of all)
│
├── notificationsEnabled: boolean
└── notificationPermission: 'granted' | 'denied' | 'default'

Methods:
├── incrementUnread(type, id)
├── clearUnread(type, id)
├── getUnreadCount(type, id)
├── clearAllUnread()
├── toggleNotifications()
└── requestNotificationPermission()
```

---

## 5. Socket Event Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Socket Events                            │
└──────────────────────────────────────────────────────────────┘

CLIENT SENDS:
┌────────────────────────┐
│ message:send           │ → Server processes and broadcasts
├────────────────────────┤
│ • recipient_id OR      │
│ • channel_id           │
│ • content              │
│ • attachments          │
│ • message_type         │
│ • mentions             │
└────────────────────────┘

SERVER EMITS (to recipients):
┌────────────────────────┐
│ message:received       │ → Add message to UI
├────────────────────────┤
│ Complete message with  │
│ sender/recipient data  │
└────────────────────────┘

┌────────────────────────┐
│ notification:new       │ → Trigger notification
├────────────────────────┤
│ • type                 │
│ • senderId/channelId   │
│ • message              │
└────────────────────────┘

┌────────────────────────┐
│ mention:received       │ → High-priority notification
├────────────────────────┤
│ • message              │
│ • channel_id           │
│ • mentioned_by         │
│ • everyone (boolean)   │
└────────────────────────┘

OTHER EVENTS:
┌────────────────────────┐
│ typing:start/stop      │ → Show typing indicator
│ channel:typing:start/  │
│   stop                 │
│ message:read           │ → Mark as read
│ message:reaction       │ → Add emoji reaction
│ user:status            │ → Update status
│ user:online/offline    │ → Update presence
└────────────────────────┘
```

---

## 6. Notification Decision Tree

```
                    New Message Received
                            │
                            ▼
                    ┌───────────────┐
                    │ Is sender me? │
                    └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    │               │
                   YES              NO
                    │               │
                    ▼               ▼
            [Ignore - No       [Continue]
             notification]          │
                                    ▼
                        ┌──────────────────────┐
                        │ Page Visible/Active? │
                        └──────────┬───────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                       YES                   NO
                        │                     │
                        ▼                     ▼
            ┌──────────────────┐   ┌────────────────────┐
            │ Toast Only       │   │ Check notifications│
            │ • In-app popup   │   │ enabled?           │
            │ • Sound (toast)  │   └─────────┬──────────┘
            └──────────────────┘             │
                                  ┌──────────┴──────────┐
                                  │                     │
                                 YES                   NO
                                  │                     │
                                  ▼                     ▼
                    ┌──────────────────────┐  ┌─────────────────┐
                    │ Browser Notification │  │ Toast Only      │
                    │ • Desktop alert      │  └─────────────────┘
                    │ • Sound/vibration    │
                    │ • Persistent if      │
                    │   mention            │
                    └──────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌──────────────────┐      ┌──────────────────────┐
        │ Increment Unread │      │ Update Visual        │
        │ Count            │      │ Indicators           │
        └──────────────────┘      └──────────────────────┘
```

---

## 7. Component Hierarchy

```
App
 └── NotificationProvider ← Provides notification context
      │
      ├── Router
      │    │
      │    └── Routes
      │         │
      │         ├── MainLayout ← Shows unread badge on Chat menu
      │         │    │
      │         │    └── Outlet
      │         │         │
      │         │         └── Chat Page
      │         │              │
      │         │              └── AdminChatWidget ← Main chat UI
      │         │                   │
      │         │                   ├── Header (bell icon, badges)
      │         │                   ├── Tabs (Direct/Channels with badges)
      │         │                   ├── User List (individual badges)
      │         │                   ├── Channel List (individual badges)
      │         │                   └── Messages View
      │         │
      │         └── Other Pages
      │
      └── NotificationService (singleton) ← Browser API wrapper
           │
           └── Browser Notification API
```

---

## 8. Data Flow Summary

```
1. User A sends message
        │
        ▼
2. Socket emits to server
        │
        ▼
3. Server validates & saves to DB
        │
        ▼
4. Server emits to User B
        │
        ├──────────────────┬──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   message:received   notification:new   mention:received
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
5. NotificationContext receives & processes
        │
        ├──────────────┬──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
  Increment      Show Browser    Show Toast    Update UI
  Unread Count   Notification    Notification  Indicators
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                           │
                           ▼
6. User B sees notification & unread count
        │
        ▼
7. User B clicks conversation
        │
        ▼
8. clearUnread() called
        │
        ▼
9. All indicators update & clear
```

---

## 9. Permission Flow

```
User Opens Chat Page
         │
         ▼
  Check Notification
  Permission Status
         │
    ┌────┴────┐
    │         │
'granted' 'default'/'denied'
    │         │
    ▼         ▼
[Enabled] [Disabled]
    │         │
    │         └──→ User clicks bell icon
    │                      │
    │                      ▼
    │              Request Permission
    │                      │
    │          ┌───────────┴───────────┐
    │          │                       │
    │       Granted                 Denied
    │          │                       │
    │          ▼                       ▼
    └───→ [Enabled]              [Disabled]
            │                          │
            ▼                          ▼
    Save to localStorage      Save to localStorage
    Show browser notifications  Show toast only
```

---

These diagrams provide a comprehensive visual understanding of how the notification system works from architecture to implementation details.
