const express = require('express');
const router = express.Router();
const { chatWithAI, getTicketSuggestion } = require('../controllers/aiChatController');
const { protect } = require('../middleware/auth');

// All AI routes require authentication (any logged-in user)
router.use(protect);

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
// @access  Private (All authenticated users)
router.post('/chat', chatWithAI);

// @route   POST /api/ai/suggest
// @desc    Get AI suggestion for ticket
// @access  Private (All authenticated users)
router.post('/suggest', getTicketSuggestion);

module.exports = router;
