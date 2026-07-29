const express = require('express');
const router = express.Router();
const {
  getLogs,
  getLogStats,
  clearLogs,
  downloadLogs
} = require('../controllers/logsController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and super admin only
router.use(protect);
router.use(authorize('super_admin'));

router.get('/', getLogs);
router.get('/stats', getLogStats);
router.delete('/:type', clearLogs);
router.get('/download/:type', downloadLogs);

module.exports = router;
