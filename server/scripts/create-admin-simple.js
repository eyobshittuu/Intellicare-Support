#!/usr/bin/env node
/**
 * Simple Super Admin Creation Script
 * Creates admin with predefined credentials
 * Run with: node scripts/create-admin-simple.js
 */

const { User } = require('../models');

async function createAdmin() {
  try {
    console.log('🔐 Creating Super Admin...\n');
    
    // Default admin credentials
    const adminData = {
      email: 'admin@intellicare.com',
      password: 'Admin@123',  // Change this!
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
      is_active: true
    };
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: adminData.email } 
    });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.first_name} ${existingAdmin.last_name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log('\n✅ You can login with existing credentials');
      process.exit(0);
    }
    
    // Create new admin
    const admin = await User.create(adminData);
    
    console.log('✅ Super Admin created successfully!\n');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Name:', `${admin.first_name} ${admin.last_name}`);
    console.log('🎭 Role:', admin.role);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
createAdmin();
