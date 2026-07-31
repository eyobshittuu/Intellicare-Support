const express = require('express');
const router = express.Router();
const {
  getPendingRegistrations,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
  getRegistrationStats
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');

// All routes require super admin access
router.use(protect);
router.use(authorize('super_admin'));

// Get statistics
router.get('/stats', getRegistrationStats);

// Get pending registrations
router.get('/pending', getPendingRegistrations);

// Get all registrations with filters
router.get('/', getAllRegistrations);

// Approve registration
router.put('/:id/approve', approveRegistration);

// Reject registration
router.put('/:id/reject', rejectRegistration);

// Delete registration
router.delete('/:id', deleteRegistration);

module.exports = router;
