const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all users
router.get('/users', chatController.getAllUsers);

// Get all conversations
router.get('/conversations', chatController.getConversations);

// Get messages with a specific user
router.get('/messages/:otherUserId', chatController.getMessages);

// Send a message
router.post('/messages', chatController.sendMessage);

// Mark messages as read
router.put('/messages/read/:senderId', chatController.markAsRead);

// Search users
router.get('/users/search', chatController.searchUsers);

// Get unread count
router.get('/unread-count', chatController.getUnreadCount);

// Upload file for chat
router.post('/upload', chatController.upload, chatController.uploadChatFile);

module.exports = router;
