const express = require('express');
const router = express.Router();
const { chatWithAI, getTicketSuggestion } = require('../controllers/aiChatController');
const { protect, adminOnly } = require('../middleware/auth');

// All AI routes require admin authentication
router.use(protect);
router.use(adminOnly);

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
// @access  Private (Admin only)
router.post('/chat', chatWithAI);

// @route   POST /api/ai/suggest
// @desc    Get AI suggestion for ticket
// @access  Private (Admin only)
router.post('/suggest', getTicketSuggestion);

module.exports = router;
