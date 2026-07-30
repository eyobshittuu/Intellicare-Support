const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');

/**
 * ONE-TIME MIGRATION ENDPOINT
 * 
 * This endpoint runs the database migration to make user_id nullable in tickets table.
 * 
 * Access it from browser or curl:
 * GET https://intellicare-support-1.onrender.com/api/migrate/fix-user-id
 * 
 * This endpoint should be removed after successful migration.
 */
router.get('/fix-user-id', async (req, res) => {
  try {
    logger.info('🔄 Starting migration: Make user_id nullable in tickets table');

    // Check if we're in production (PostgreSQL)
    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      // PostgreSQL - Alter column to allow NULL
      await db.query(`
        ALTER TABLE tickets 
        ALTER COLUMN user_id DROP NOT NULL;
      `);
      
      logger.info('✅ PostgreSQL: user_id column is now nullable');
      
      // Verify the change
      const [results] = await db.query(`
        SELECT column_name, is_nullable, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name IN ('user_id', 'assigned_to', 'finalized_by');
      `);

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'PostgreSQL',
        changes: 'user_id column is now nullable in tickets table',
        verification: results,
        note: 'Users can now be deleted and their ticket history will be preserved.'
      });

    } else if (dialect === 'mysql') {
      // MySQL - Already handled by Sequelize sync
      logger.info('✅ MySQL: Migration not needed (handled by Sequelize sync)');
      
      return res.json({
        success: true,
        message: 'No migration needed for MySQL',
        database: 'MySQL',
        note: 'MySQL schema is automatically updated by Sequelize sync'
      });

    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported database dialect: ${dialect}`
      });
    }

  } catch (error) {
    logger.error('❌ Migration failed:', error);

    // Check if already nullable (constraint doesn't exist error)
    if (error.message && (
      error.message.includes('does not exist') ||
      error.message.includes('cannot drop not-null constraint') ||
      error.original?.code === '42804'
    )) {
      // Column might already be nullable, let's verify
      try {
        const [results] = await db.query(`
          SELECT is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'tickets' 
          AND column_name = 'user_id';
        `);
        
        if (results[0]?.is_nullable === 'YES') {
          return res.json({
            success: true,
            message: 'Migration already completed (user_id is already nullable)',
            note: 'No changes were needed'
          });
        }
      } catch (verifyError) {
        // Ignore verification error
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      errorCode: error.original?.code,
      hint: 'Check Render logs for more details',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * DIAGNOSE DATABASE ISSUE
 * 
 * Get detailed information about the current database state
 * GET https://intellicare-support-1.onrender.com/api/migrate/diagnose
 */
router.get('/diagnose', async (req, res) => {
  try {
    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      // Get table structure
      const [constraints] = await db.query(`
        SELECT 
          conname as constraint_name,
          contype as constraint_type,
          a.attname as column_name
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
        WHERE c.conrelid = 'tickets'::regclass
        AND a.attrelid = 'tickets'::regclass
        ORDER BY conname;
      `);

      const [columns] = await db.query(`
        SELECT 
          column_name, 
          is_nullable, 
          data_type,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name IN ('id', 'user_id', 'assigned_to', 'finalized_by')
        ORDER BY column_name;
      `);

      return res.json({
        success: true,
        database: 'PostgreSQL',
        columns: columns,
        constraints: constraints,
        diagnosis: {
          user_id_nullable: columns.find(c => c.column_name === 'user_id')?.is_nullable === 'YES',
          migration_needed: columns.find(c => c.column_name === 'user_id')?.is_nullable !== 'YES'
        }
      });
    } else {
      return res.json({
        success: true,
        database: dialect,
        message: 'Diagnosis only available for PostgreSQL'
      });
    }

  } catch (error) {
    logger.error('Diagnosis failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Diagnosis failed',
      error: error.message
    });
  }
});

/**
 * CHECK MIGRATION STATUS
 * 
 * Check if the migration has been applied
 * GET https://intellicare-support-1.onrender.com/api/migrate/status
 */
router.get('/status', async (req, res) => {
  try {
    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      const [results] = await db.query(`
        SELECT 
          column_name, 
          is_nullable, 
          data_type,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name IN ('user_id', 'assigned_to', 'finalized_by')
        ORDER BY column_name;
      `);

      const allNullable = results.every(col => col.is_nullable === 'YES');

      return res.json({
        success: true,
        database: 'PostgreSQL',
        columns: results,
        migrationComplete: allNullable,
        message: allNullable 
          ? '✅ All user reference columns are nullable. Migration complete!' 
          : '⚠️ Some columns are NOT NULL. Migration needed.'
      });

    } else {
      return res.json({
        success: true,
        database: dialect,
        message: 'Migration status check only available for PostgreSQL'
      });
    }

  } catch (error) {
    logger.error('Status check failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

module.exports = router;
