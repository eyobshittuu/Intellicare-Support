const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, username, password, first_name, middle_name, last_name } = req.body;

    // Validate username format
    if (username) {
      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 50 characters'
        });
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username can only contain letters, numbers, and underscores'
        });
      }
    }

    // Check if user exists with email
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if username exists
    if (username) {
      const usernameExists = await User.findOne({ where: { username } });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Generate username from email if not provided
    const finalUsername = username || email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');

    // Create user
    const user = await User.create({
      email,
      username: finalUsername,
      password,
      first_name,
      middle_name,
      last_name
    });

    // Log user registration
    logger.info('User registered', {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      action: 'USER_REGISTER'
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ 
      where: { email },
      attributes: { include: ['password'] }
    });

    if (!user) {
      // Log failed login attempt
      logger.warn('Failed login attempt - user not found', {
        email,
        ip: req.ip,
        action: 'LOGIN_FAILED'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      // Log inactive account login attempt
      logger.warn('Login attempt on inactive account', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        action: 'LOGIN_INACTIVE_ACCOUNT'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed password attempt
      logger.warn('Failed login attempt - incorrect password', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        action: 'LOGIN_WRONG_PASSWORD'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Log successful login
    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      action: 'USER_LOGIN'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, middle_name, last_name } = req.body;

    const user = await User.findByPk(req.user.id);

    if (first_name) user.first_name = first_name;
    if (middle_name !== undefined) user.middle_name = middle_name;
    if (last_name) user.last_name = last_name;

    await user.save();

    // Log profile update
    logger.info('User profile updated', {
      userId: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      action: 'PROFILE_UPDATE'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await User.findByPk(req.user.id, {
      attributes: { include: ['password'] }
    });

    // Check current password
    const isMatch = await user.comparePassword(current_password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = new_password;
    await user.save();

    // Log password change
    logger.info('User password changed', {
      userId: user.id,
      email: user.email,
      action: 'PASSWORD_CHANGE'
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};
