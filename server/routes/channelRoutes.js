const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin/super_admin role
router.use(protect);
router.use(authorize('admin', 'super_admin'));

// Channel CRUD
router.post('/', channelController.createChannel);
router.get('/', channelController.getUserChannels);
router.get('/:channelId', channelController.getChannel);
router.put('/:channelId', channelController.updateChannel);
router.delete('/:channelId/archive', channelController.archiveChannel);

// Channel messages
router.get('/:channelId/messages', channelController.getChannelMessages);

// Channel members
router.post('/:channelId/members', channelController.addChannelMembers);
router.delete('/:channelId/members/:memberId', channelController.removeChannelMember);

module.exports = router;
