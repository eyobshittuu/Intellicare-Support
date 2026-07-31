const { User } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');

// @desc    Get all pending registrations
// @route   GET /api/registrations/pending
// @access  Private/SuperAdmin
exports.getPendingRegistrations = async (req, res) => {
  try {
    // Check if account_status column exists before querying
    const pendingUsers = await User.findAll({
      where: { account_status: 'pending' },
      attributes: ['id', 'email', 'username', 'first_name', 'middle_name', 'last_name', 'created_at', 'account_status'],
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    
    // If column doesn't exist, return empty array
    if (error.message && error.message.includes('account_status')) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'Database migration required. Please run the account approval migration.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching pending registrations',
      error: error.message
    });
  }
};

// @desc    Get all registrations (pending, approved, rejected)
// @route   GET /api/registrations
// @access  Private/SuperAdmin
exports.getAllRegistrations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    // Filter by status
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.account_status = status;
    }
    
    // Search by name or email
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 
        'email', 
        'username', 
        'first_name', 
        'middle_name', 
        'last_name', 
        'account_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'created_at'
      ],
      include: [
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      data: rows
    });
  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
};

// @desc    Approve user registration
// @route   PUT /api/registrations/:id/approve
// @access  Private/SuperAdmin
exports.approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.account_status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      });
    }

    user.account_status = 'approved';
    user.approved_by = req.user.id;
    user.approved_at = new Date();
    user.rejection_reason = null; // Clear any previous rejection reason
    await user.save();

    // Log approval
    logger.info('User registration approved', {
      userId: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      approvedBy: req.user.id,
      approverName: `${req.user.first_name} ${req.user.last_name}`,
      action: 'REGISTRATION_APPROVED'
    });

    res.json({
      success: true,
      message: 'User registration approved successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        account_status: user.account_status,
        approved_at: user.approved_at
      }
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving registration',
      error: error.message
    });
  }
};

// @desc    Reject user registration
// @route   PUT /api/registrations/:id/reject
// @access  Private/SuperAdmin
exports.rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.account_status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'User is already rejected'
      });
    }

    user.account_status = 'rejected';
    user.approved_by = req.user.id;
    user.approved_at = new Date();
    user.rejection_reason = reason || 'No reason provided';
    await user.save();

    // Log rejection
    logger.info('User registration rejected', {
      userId: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      rejectedBy: req.user.id,
      rejectorName: `${req.user.first_name} ${req.user.last_name}`,
      reason: user.rejection_reason,
      action: 'REGISTRATION_REJECTED'
    });

    res.json({
      success: true,
      message: 'User registration rejected',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        account_status: user.account_status,
        rejection_reason: user.rejection_reason,
        approved_at: user.approved_at
      }
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting registration',
      error: error.message
    });
  }
};

// @desc    Delete pending/rejected registration
// @route   DELETE /api/registrations/:id
// @access  Private/SuperAdmin
exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting approved users through this endpoint
    if (user.account_status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved users through this endpoint. Use user management instead.'
      });
    }

    const userEmail = user.email;
    const userName = `${user.first_name} ${user.last_name}`;

    await user.destroy();

    // Log deletion
    logger.info('User registration deleted', {
      userId: id,
      email: userEmail,
      name: userName,
      deletedBy: req.user.id,
      deleterName: `${req.user.first_name} ${req.user.last_name}`,
      action: 'REGISTRATION_DELETED'
    });

    res.json({
      success: true,
      message: 'User registration deleted successfully'
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting registration',
      error: error.message
    });
  }
};

// @desc    Get registration statistics
// @route   GET /api/registrations/stats
// @access  Private/SuperAdmin
exports.getRegistrationStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      User.count({ where: { account_status: 'pending' } }),
      User.count({ where: { account_status: 'approved' } }),
      User.count({ where: { account_status: 'rejected' } }),
      User.count()
    ]);

    res.json({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        total
      }
    });
  } catch (error) {
    console.error('Get registration stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
