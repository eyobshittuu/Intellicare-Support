/**
 * Migration Script: Make user_id nullable in tickets table
 * 
 * This script updates the production PostgreSQL database to allow NULL values
 * in the user_id column, enabling ticket history preservation when users are deleted.
 * 
 * Run this script ONCE on production:
 * node server/scripts/migrate-user-id-nullable.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function migrate() {
  console.log('🔄 Starting migration: Make user_id nullable in tickets table\n');

  // Use DATABASE_URL for production (Render PostgreSQL)
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL not found in environment variables');
    console.error('Make sure you are running this on the production server or set DATABASE_URL locally');
    process.exit(1);
  }

  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Run the migration
    console.log('📝 Altering tickets table...');
    
    await sequelize.query(`
      ALTER TABLE tickets 
      ALTER COLUMN user_id DROP NOT NULL;
    `);

    console.log('✅ Column user_id is now nullable\n');

    // Verify the change
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tickets' 
      AND column_name IN ('user_id', 'assigned_to', 'finalized_by');
    `);

    console.log('📊 Current column configuration:');
    console.table(results);

    console.log('\n✅ Migration completed successfully!');
    console.log('Users can now be deleted and their ticket history will be preserved.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrate();
