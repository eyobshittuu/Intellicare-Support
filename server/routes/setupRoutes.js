const express = require('express');
const router = express.Router();
const { User } = require('../models');

// @desc    Create initial super admin (one-time setup)
// @route   POST /api/setup/create-admin
// @access  Public (but checks if admin already exists)
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, first_name, last_name, secret_key } = req.body;
    
    // Security: Require a secret key from environment
    const setupSecret = process.env.SETUP_SECRET || 'intellicare-setup-2024';
    
    if (secret_key !== setupSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid setup secret key'
      });
    }
    
    // Check if any super admin already exists
    const existingAdmin = await User.findOne({
      where: { role: 'super_admin' }
    });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super admin already exists',
        admin_email: existingAdmin.email
      });
    }
    
    // Validation
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, first_name, and last_name'
      });
    }
    
    // Create super admin
    const admin = await User.create({
      email,
      password,
      first_name,
      last_name,
      role: 'super_admin',
      is_active: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating super admin',
      error: error.message
    });
  }
});

// @desc    Check setup status
// @route   GET /api/setup/status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const adminExists = await User.findOne({
      where: { role: 'super_admin' }
    });
    
    const totalUsers = await User.count();
    
    res.json({
      success: true,
      setup_complete: !!adminExists,
      admin_exists: !!adminExists,
      admin_email: adminExists ? adminExists.email : null,
      total_users: totalUsers,
      message: adminExists 
        ? 'Setup complete - super admin exists' 
        : 'Setup required - no super admin found'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking setup status',
      error: error.message
    });
  }
});

// @desc    Reset admin password (emergency use only)
// @route   POST /api/setup/reset-admin-password
// @access  Public (with secret key)
router.post('/reset-admin-password', async (req, res) => {
  try {
    const { email, new_password, secret_key } = req.body;
    
    // Security: Require a secret key from environment
    const setupSecret = process.env.SETUP_SECRET || 'intellicare-setup-2024';
    
    if (secret_key !== setupSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid setup secret key'
      });
    }
    
    // Validation
    if (!email || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and new_password'
      });
    }
    
    // Find admin user
    const admin = await User.findOne({
      where: { 
        email,
        role: 'super_admin'
      }
    });
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Super admin not found with this email'
      });
    }
    
    // Update password
    admin.password = new_password;
    await admin.save();
    
    res.json({
      success: true,
      message: 'Admin password reset successfully',
      admin: {
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

module.exports = router;
