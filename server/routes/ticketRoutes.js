const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getStats,
  finalizeTicket
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const { ticketValidation, handleValidationErrors } = require('../middleware/validator');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Stats route (admin only)
router.get('/stats', authorize('admin', 'super_admin'), getStats);

// CRUD routes
router.route('/')
  .get(getTickets)
  .post(upload.array('images', 5), ticketValidation, handleValidationErrors, createTicket);

router.route('/:id')
  .get(getTicket)
  .put(updateTicket)
  .delete(authorize('admin', 'super_admin'), deleteTicket);

// Finalize ticket route (admin only)
router.put('/:id/finalize', authorize('admin', 'super_admin'), finalizeTicket);

module.exports = router;
