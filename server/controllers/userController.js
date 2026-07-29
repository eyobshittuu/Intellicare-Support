const { User, Ticket } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Ticket,
          as: 'tickets',
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { first_name, middle_name, last_name, role, is_active } = req.body;

    if (first_name) user.first_name = first_name;
    if (middle_name !== undefined) user.middle_name = middle_name;
    if (last_name) user.last_name = last_name;
    if (role) user.role = role;
    if (is_active !== undefined) user.is_active = is_active;

    await user.save();

    // Log user update
    logger.info('User updated by admin', {
      targetUserId: user.id,
      targetUserEmail: user.email,
      targetUserName: `${user.first_name} ${user.last_name}`,
      updatedBy: req.user.id,
      updatedByName: `${req.user.first_name} ${req.user.last_name}`,
      changes: { role: !!role, is_active: is_active !== undefined },
      action: 'USER_UPDATE'
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    // Log user deletion
    logger.warn('User deleted by admin', {
      deletedUserId: user.id,
      deletedUserEmail: user.email,
      deletedUserName: `${user.first_name} ${user.last_name}`,
      deletedUserRole: user.role,
      deletedBy: req.user.id,
      deletedByName: `${req.user.first_name} ${req.user.last_name}`,
      action: 'USER_DELETE'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const regularUsers = await User.count({ where: { role: 'user' } });
    const activeUsers = await User.count({ where: { is_active: true } });

    res.json({
      success: true,
      stats: {
        total: totalUsers,
        admins: adminUsers,
        users: regularUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

// @desc    Create admin user
// @route   POST /api/users/create-admin
// @access  Private (Super Admin only)
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, first_name, middle_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create admin user
    const admin = await User.create({
      email,
      password,
      first_name,
      middle_name,
      last_name,
      role: 'admin',
      is_active: true
    });

    // Log admin creation
    logger.info('Admin user created', {
      newAdminId: admin.id,
      newAdminEmail: admin.email,
      newAdminName: `${admin.first_name} ${admin.last_name}`,
      createdBy: req.user.id,
      createdByName: `${req.user.first_name} ${req.user.last_name}`,
      action: 'ADMIN_CREATE'
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: admin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin user',
      error: error.message
    });
  }
};
