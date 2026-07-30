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
 * DIFFICULTY SYSTEM MIGRATION
 * 
 * Add difficulty, assigned_by, and assigned_at columns to tickets table
 * GET https://intellicare-support-1.onrender.com/api/migrate/add-difficulty-fields
 */
router.get('/add-difficulty-fields', async (req, res) => {
  try {
    logger.info('🔄 Starting migration: Add difficulty fields to tickets table');

    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      // PostgreSQL - Add columns if they don't exist
      await db.query(`
        DO $$ 
        BEGIN
          -- Add difficulty column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tickets' AND column_name = 'difficulty'
          ) THEN
            ALTER TABLE tickets ADD COLUMN difficulty INTEGER DEFAULT NULL;
            ALTER TABLE tickets ADD CONSTRAINT tickets_difficulty_check 
              CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5));
            RAISE NOTICE 'Added difficulty column';
          END IF;

          -- Add assigned_by column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tickets' AND column_name = 'assigned_by'
          ) THEN
            ALTER TABLE tickets ADD COLUMN assigned_by BIGINT DEFAULT NULL;
            ALTER TABLE tickets ADD CONSTRAINT fk_tickets_assigned_by 
              FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added assigned_by column';
          END IF;

          -- Add assigned_at column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tickets' AND column_name = 'assigned_at'
          ) THEN
            ALTER TABLE tickets ADD COLUMN assigned_at TIMESTAMP DEFAULT NULL;
            RAISE NOTICE 'Added assigned_at column';
          END IF;
        END $$;
      `);
      
      logger.info('✅ PostgreSQL: Difficulty fields added successfully');
      
      // Verify the changes
      const [results] = await db.query(`
        SELECT column_name, is_nullable, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name IN ('difficulty', 'assigned_by', 'assigned_at')
        ORDER BY column_name;
      `);

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'PostgreSQL',
        changes: 'Added difficulty, assigned_by, and assigned_at columns',
        columns: results,
        note: 'Manual ticket assignment with difficulty rating is now available.'
      });

    } else if (dialect === 'mysql') {
      // MySQL - Add columns if they don't exist
      const queries = [
        `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS difficulty INT DEFAULT NULL`,
        `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_by BIGINT UNSIGNED DEFAULT NULL`,
        `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_at DATETIME DEFAULT NULL`
      ];

      for (const query of queries) {
        try {
          await db.query(query);
        } catch (err) {
          // Column might already exist, continue
          if (!err.message.includes('Duplicate column')) {
            throw err;
          }
        }
      }

      // Add constraints
      try {
        await db.query(`
          ALTER TABLE tickets 
          ADD CONSTRAINT tickets_difficulty_check 
          CHECK (difficulty IS NULL OR (difficulty BETWEEN 1 AND 5))
        `);
      } catch (err) {
        // Constraint might already exist
        if (!err.message.includes('Duplicate')) {
          logger.warn('Could not add difficulty check constraint:', err.message);
        }
      }

      try {
        await db.query(`
          ALTER TABLE tickets 
          ADD CONSTRAINT fk_tickets_assigned_by 
          FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
        `);
      } catch (err) {
        // Constraint might already exist
        if (!err.message.includes('Duplicate')) {
          logger.warn('Could not add assigned_by foreign key:', err.message);
        }
      }

      logger.info('✅ MySQL: Difficulty fields added successfully');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'MySQL',
        changes: 'Added difficulty, assigned_by, and assigned_at columns',
        note: 'Manual ticket assignment with difficulty rating is now available.'
      });

    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported database dialect: ${dialect}`
      });
    }

  } catch (error) {
    logger.error('❌ Migration failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      hint: 'Check server logs for more details. Columns might already exist.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        AND column_name IN ('user_id', 'assigned_to', 'finalized_by', 'difficulty', 'assigned_by', 'assigned_at')
        ORDER BY column_name;
      `);

      const userIdNullable = results.find(col => col.column_name === 'user_id')?.is_nullable === 'YES';
      const hasDifficultyFields = results.some(col => col.column_name === 'difficulty');

      return res.json({
        success: true,
        database: 'PostgreSQL',
        columns: results,
        migrations: {
          userIdNullable: {
            complete: userIdNullable,
            status: userIdNullable ? '✅ Complete' : '⚠️ Needed'
          },
          difficultySystem: {
            complete: hasDifficultyFields,
            status: hasDifficultyFields ? '✅ Complete' : '⚠️ Needed'
          }
        },
        message: userIdNullable && hasDifficultyFields
          ? '✅ All migrations complete!' 
          : '⚠️ Some migrations are pending.'
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
