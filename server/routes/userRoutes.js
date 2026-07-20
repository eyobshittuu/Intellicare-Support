const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  createAdmin
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Super admin only route - create admin
router.post('/create-admin', authorize('super_admin'), createAdmin);

// Admin routes
router.use(authorize('admin', 'super_admin'));

// Stats route
router.get('/stats', getUserStats);

// CRUD routes
router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
