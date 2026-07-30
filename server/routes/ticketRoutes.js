const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getStats,
  finalizeTicket,
  getAssignmentRecommendations,
  assignTicketManually,
  rebalanceWorkload,
  getAdminWorkload
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const { ticketValidation, handleValidationErrors } = require('../middleware/validator');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Stats route (admin only)
router.get('/stats', authorize('admin', 'super_admin'), getStats);

// Admin workload statistics (admin only)
router.get('/admin-workload', authorize('admin', 'super_admin'), getAdminWorkload);

// Rebalance workload (super admin only)
router.post('/rebalance', authorize('super_admin'), rebalanceWorkload);

// CRUD routes
router.route('/')
  .get(getTickets)
  .post(upload, ticketValidation, handleValidationErrors, createTicket);

router.route('/:id')
  .get(getTicket)
  .put(updateTicket)
  .delete(authorize('admin', 'super_admin'), deleteTicket);

// Finalize ticket route (admin only)
router.put('/:id/finalize', authorize('admin', 'super_admin'), finalizeTicket);

// Assignment routes (super admin only)
router.get('/:id/recommendations', authorize('super_admin'), getAssignmentRecommendations);
router.put('/:id/assign', authorize('super_admin'), assignTicketManually);

module.exports = router;
