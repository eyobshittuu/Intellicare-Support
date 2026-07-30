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

      const [messageResults] = await db.query(`
        SELECT 
          column_name, 
          is_nullable, 
          data_type,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name IN ('attachments', 'reactions', 'message_type')
        ORDER BY column_name;
      `);

      const userIdNullable = results.find(col => col.column_name === 'user_id')?.is_nullable === 'YES';
      const hasDifficultyFields = results.some(col => col.column_name === 'difficulty');
      const hasChatFeatures = messageResults.some(col => col.column_name === 'attachments');

      return res.json({
        success: true,
        database: 'PostgreSQL',
        columns: results,
        messageColumns: messageResults,
        migrations: {
          userIdNullable: {
            complete: userIdNullable,
            status: userIdNullable ? '✅ Complete' : '⚠️ Needed'
          },
          difficultySystem: {
            complete: hasDifficultyFields,
            status: hasDifficultyFields ? '✅ Complete' : '⚠️ Needed'
          },
          chatFeatures: {
            complete: hasChatFeatures,
            status: hasChatFeatures ? '✅ Complete' : '⚠️ Needed'
          }
        },
        message: userIdNullable && hasDifficultyFields && hasChatFeatures
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

/**
 * CHAT FEATURES MIGRATION
 * 
 * Add attachments, reactions, and message_type columns to messages table
 * GET https://intellicare-support-1.onrender.com/api/migrate/add-chat-features
 */
router.get('/add-chat-features', async (req, res) => {
  try {
    logger.info('🔄 Starting migration: Add chat features to messages table');

    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      // PostgreSQL - Add columns if they don't exist
      await db.query(`
        DO $$ 
        BEGIN
          -- Make content nullable (allow messages with only attachments)
          BEGIN
            ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
            RAISE NOTICE 'Content column is now nullable';
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'Content column already nullable or error: %', SQLERRM;
          END;

          -- Add attachments column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'attachments'
          ) THEN
            ALTER TABLE messages ADD COLUMN attachments JSONB DEFAULT NULL;
            RAISE NOTICE 'Added attachments column';
          END IF;

          -- Add reactions column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'reactions'
          ) THEN
            ALTER TABLE messages ADD COLUMN reactions JSONB DEFAULT NULL;
            RAISE NOTICE 'Added reactions column';
          END IF;

          -- Add message_type column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'message_type'
          ) THEN
            ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
            ALTER TABLE messages ADD CONSTRAINT messages_message_type_check 
              CHECK (message_type IN ('text', 'file', 'image'));
            RAISE NOTICE 'Added message_type column';
          END IF;
        END $$;
      `);
      
      logger.info('✅ PostgreSQL: Chat features added successfully');
      
      // Verify the changes
      const [results] = await db.query(`
        SELECT column_name, is_nullable, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name IN ('content', 'attachments', 'reactions', 'message_type')
        ORDER BY column_name;
      `);

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'PostgreSQL',
        changes: 'Added attachments, reactions, and message_type columns to messages table',
        columns: results,
        note: 'File attachments, emoji reactions, and rich messaging features are now available.'
      });

    } else if (dialect === 'mysql') {
      // MySQL - Add columns if they don't exist
      const queries = [
        `ALTER TABLE messages MODIFY content TEXT NULL`,
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSON DEFAULT NULL`,
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSON DEFAULT NULL`,
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text'`
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

      logger.info('✅ MySQL: Chat features added successfully');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'MySQL',
        changes: 'Added attachments, reactions, and message_type columns to messages table',
        note: 'File attachments, emoji reactions, and rich messaging features are now available.'
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
 * CHANNELS/GROUP CHAT MIGRATION
 * 
 * Add channels, channel_members tables and update messages table
 * GET https://intellicare-support-1.onrender.com/api/migrate/add-channels-support
 */
router.get('/add-channels-support', async (req, res) => {
  try {
    logger.info('🔄 Starting migration: Add channels/group chat support');

    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      await db.query(`
        DO $$ 
        BEGIN
          -- Create channels table
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels') THEN
            CREATE TABLE channels (
              id BIGSERIAL PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              description TEXT,
              channel_type VARCHAR(20) DEFAULT 'private' CHECK (channel_type IN ('public', 'private')),
              created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              avatar_color VARCHAR(7) DEFAULT '#14b8a6',
              is_archived BOOLEAN DEFAULT FALSE,
              archived_at TIMESTAMP,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            );
            RAISE NOTICE 'Created channels table';
          END IF;

          -- Create channel_members table
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_members') THEN
            CREATE TABLE channel_members (
              id BIGSERIAL PRIMARY KEY,
              channel_id BIGINT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
              user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
              joined_at TIMESTAMP DEFAULT NOW(),
              last_read_at TIMESTAMP,
              UNIQUE(channel_id, user_id)
            );
            CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
            CREATE INDEX idx_channel_members_user ON channel_members(user_id);
            RAISE NOTICE 'Created channel_members table';
          END IF;

          -- Add channel_id to messages table
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'channel_id'
          ) THEN
            ALTER TABLE messages ADD COLUMN channel_id BIGINT REFERENCES channels(id) ON DELETE CASCADE;
            CREATE INDEX idx_messages_channel ON messages(channel_id);
            RAISE NOTICE 'Added channel_id to messages table';
          END IF;

          -- Make recipient_id nullable (for channel messages)
          BEGIN
            ALTER TABLE messages ALTER COLUMN recipient_id DROP NOT NULL;
            RAISE NOTICE 'Made recipient_id nullable';
          EXCEPTION
            WHEN others THEN
              RAISE NOTICE 'recipient_id already nullable or error: %', SQLERRM;
          END;
        END $$;
      `);
      
      logger.info('✅ PostgreSQL: Channels support added successfully');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'PostgreSQL',
        changes: 'Created channels and channel_members tables, updated messages table',
        note: 'Channels/group chat feature is now available. Update frontend to use it.'
      });

    } else if (dialect === 'mysql') {
      const queries = [
        // Create channels table
        `CREATE TABLE IF NOT EXISTS channels (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          channel_type VARCHAR(20) DEFAULT 'private',
          created_by BIGINT UNSIGNED NOT NULL,
          avatar_color VARCHAR(7) DEFAULT '#14b8a6',
          is_archived BOOLEAN DEFAULT FALSE,
          archived_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          CHECK (channel_type IN ('public', 'private'))
        )`,
        
        // Create channel_members table
        `CREATE TABLE IF NOT EXISTS channel_members (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          channel_id BIGINT UNSIGNED NOT NULL,
          user_id BIGINT UNSIGNED NOT NULL,
          role VARCHAR(20) DEFAULT 'member',
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_read_at DATETIME,
          FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_channel_member (channel_id, user_id),
          CHECK (role IN ('owner', 'admin', 'member'))
        )`,
        
        // Add channel_id to messages
        `ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_id BIGINT UNSIGNED`,
        
        // Add foreign key for channel_id
        `ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS fk_messages_channel 
         FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE`,
        
        // Make recipient_id nullable
        `ALTER TABLE messages MODIFY recipient_id BIGINT UNSIGNED NULL`
      ];

      for (const query of queries) {
        try {
          await db.query(query);
        } catch (err) {
          // Table/column might already exist
          if (!err.message.includes('Duplicate') && !err.message.includes('exists')) {
            logger.warn('Query warning:', err.message);
          }
        }
      }

      logger.info('✅ MySQL: Channels support added successfully');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'MySQL',
        changes: 'Created channels and channel_members tables, updated messages table',
        note: 'Channels/group chat feature is now available. Update frontend to use it.'
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
      hint: 'Check server logs for more details. Tables might already exist.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * FIX RECIPIENT_ID NULLABLE
 * 
 * Make recipient_id nullable in messages table for channel messages
 * GET https://intellicare-support-1.onrender.com/api/migrate/fix-recipient-id-nullable
 */
router.get('/fix-recipient-id-nullable', async (req, res) => {
  try {
    logger.info('🔄 Starting migration: Make recipient_id nullable');

    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      await db.query(`
        ALTER TABLE messages ALTER COLUMN recipient_id DROP NOT NULL;
      `);
      
      logger.info('✅ PostgreSQL: recipient_id is now nullable');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'PostgreSQL',
        changes: 'Made recipient_id nullable in messages table',
        note: 'Channel messages can now be sent without recipient_id'
      });

    } else if (dialect === 'mysql') {
      await db.query(`ALTER TABLE messages MODIFY recipient_id BIGINT UNSIGNED NULL`);

      logger.info('✅ MySQL: recipient_id is now nullable');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'MySQL',
        changes: 'Made recipient_id nullable in messages table',
        note: 'Channel messages can now be sent without recipient_id'
      });

    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported database dialect: ${dialect}`
      });
    }

  } catch (error) {
    logger.error('❌ Migration failed:', error);

    // Check if already nullable
    if (error.message && error.message.includes('does not exist')) {
      return res.json({
        success: true,
        message: 'Column is already nullable',
        note: 'No changes needed'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      hint: 'Check server logs for more details',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * ADD MENTIONS SUPPORT
 * 
 * Add mentions column to messages table for @mentions functionality
 * GET https://intellicare-support-1.onrender.com/api/migrate/add-mentions-support
 */
router.get('/add-mentions-support', async (req, res) => {
  try {
    logger.info('🔄 Starting migration: Add mentions support to messages table');

    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      await db.query(`
        DO $$ 
        BEGIN
          -- Add mentions column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'mentions'
          ) THEN
            ALTER TABLE messages ADD COLUMN mentions JSONB DEFAULT NULL;
            RAISE NOTICE 'Added mentions column';
          END IF;
        END $$;
      `);
      
      logger.info('✅ PostgreSQL: Mentions support added successfully');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'PostgreSQL',
        changes: 'Added mentions column to messages table',
        note: '@mentions and @everyone functionality is now available'
      });

    } else if (dialect === 'mysql') {
      await db.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS mentions JSON DEFAULT NULL`);

      logger.info('✅ MySQL: Mentions support added successfully');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'MySQL',
        changes: 'Added mentions column to messages table',
        note: '@mentions and @everyone functionality is now available'
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
      hint: 'Check server logs for more details. Column might already exist.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * ADD USERNAME FIELD
 * 
 * Add username column to users table
 * GET https://intellicare-support-1.onrender.com/api/migrate/add-username-field
 */
router.get('/add-username-field', async (req, res) => {
  try {
    logger.info('🔄 Starting migration: Add username field to users table');

    const dialect = db.getDialect();
    
    if (dialect === 'postgres') {
      await db.query(`
        DO $$ 
        BEGIN
          -- Add username column (nullable first)
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'username'
          ) THEN
            ALTER TABLE users ADD COLUMN username VARCHAR(50);
            RAISE NOTICE 'Added username column';
            
            -- Generate unique usernames for existing users from their email
            -- Add user ID to make them unique
            UPDATE users 
            SET username = LOWER(
              REGEXP_REPLACE(
                SPLIT_PART(email, '@', 1) || '_' || id,
                '[^a-zA-Z0-9_]',
                '_',
                'g'
              )
            )
            WHERE username IS NULL;
            RAISE NOTICE 'Generated usernames for existing users';
            
            -- Now add the unique constraint
            ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
            RAISE NOTICE 'Added unique constraint';
            
            -- Make username NOT NULL after populating
            ALTER TABLE users ALTER COLUMN username SET NOT NULL;
            RAISE NOTICE 'Set username as NOT NULL';
          ELSE
            RAISE NOTICE 'Username column already exists';
          END IF;
        END $$;
      `);
      
      logger.info('✅ PostgreSQL: Username field added successfully');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'PostgreSQL',
        changes: 'Added username column to users table',
        note: 'Usernames were auto-generated from emails for existing users. Format: email_prefix_userid (e.g., john_1)'
      });

    } else if (dialect === 'mysql') {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50)`);
      
      // Generate usernames for existing users with ID suffix
      await db.query(`
        UPDATE users 
        SET username = LOWER(
          CONCAT(
            REGEXP_REPLACE(SUBSTRING_INDEX(email, '@', 1), '[^a-zA-Z0-9_]', '_'),
            '_',
            id
          )
        )
        WHERE username IS NULL
      `);
      
      // Add unique constraint
      await db.query(`ALTER TABLE users ADD UNIQUE INDEX users_username_unique (username)`);
      
      // Make NOT NULL
      await db.query(`ALTER TABLE users MODIFY username VARCHAR(50) NOT NULL`);

      logger.info('✅ MySQL: Username field added successfully');

      return res.json({
        success: true,
        message: 'Migration completed successfully!',
        database: 'MySQL',
        changes: 'Added username column to users table',
        note: 'Usernames were auto-generated from emails for existing users. Format: email_prefix_userid'
      });

    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported database dialect: ${dialect}`
      });
    }

  } catch (error) {
    logger.error('❌ Migration failed:', error);

    // Check if column already exists
    if (error.message && error.message.includes('already exists')) {
      return res.json({
        success: true,
        message: 'Username column already exists',
        note: 'No migration needed'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      hint: 'Check server logs for more details. Column might already exist.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
