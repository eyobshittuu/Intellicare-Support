const express = require('express');
const router = express.Router();
const {
  getAdminPerformance,
  getAllAdminsPerformance,
  getDetailedReport,
  getDashboardSummary,
  exportPerformanceReport
} = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');

// All routes require super_admin access
router.use(protect);
router.use(authorize('super_admin'));

// Dashboard summary
router.get('/dashboard', getDashboardSummary);

// All admins performance comparison
router.get('/admins', getAllAdminsPerformance);

// Export report
router.get('/export', exportPerformanceReport);

// Specific admin performance
router.get('/admin/:adminId', getAdminPerformance);

// Detailed report for specific admin
router.get('/admin/:adminId/detailed', getDetailedReport);

module.exports = router;
