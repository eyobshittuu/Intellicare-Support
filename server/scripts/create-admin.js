#!/usr/bin/env node
/**
 * Create Super Admin Script
 * Creates the initial super admin user
 * Run with: node scripts/create-admin.js
 */

const { User } = require('../models');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('🔐 Super Admin Creation\n');
    
    // Get admin details
    const email = await question('Email address: ');
    const password = await question('Password: ');
    const firstName = await question('First name: ');
    const lastName = await question('Last name: ');
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('❌ User with this email already exists');
      process.exit(1);
    }
    
    // Create super admin
    const admin = await User.create({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role: 'super_admin',
      is_active: true
    });
    
    console.log('\n✅ Super admin created successfully!');
    console.log(`👤 Name: ${admin.first_name} ${admin.last_name}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Role: ${admin.role}`);
    console.log('\n🎉 You can now login with these credentials!');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run the script
createAdmin();
