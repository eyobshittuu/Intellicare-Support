#!/usr/bin/env node
/**
 * Database Sync Script
 * Initializes database tables on Render or any environment
 * Run with: node scripts/sync-database.js
 */

const sequelize = require('../config/database');
const { User, Ticket } = require('../models');

async function syncDatabase() {
  try {
    console.log('🔄 Starting database sync...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (create tables if they don't exist)
    // force: false means don't drop existing tables
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database tables synced successfully');
    
    // Check if any users exist
    const userCount = await User.count();
    console.log(`👥 Total users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('⚠️  No users found. You may want to create a super admin.');
      console.log('   Run: node scripts/create-admin.js');
    }
    
    console.log('🎉 Database sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the sync
syncDatabase();
