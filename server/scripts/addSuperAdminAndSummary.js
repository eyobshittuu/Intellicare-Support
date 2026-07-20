const sequelize = require('../config/database');

async function updateSchema() {
  try {
    console.log('🔄 Updating database schema...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 1. Update users table role enum to include super_admin
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user'
    `);
    console.log('✅ Updated users role enum');

    // 2. Update existing admin to super_admin
    await sequelize.query(`
      UPDATE users 
      SET role = 'super_admin' 
      WHERE email = 'admin@intellicare.com'
    `);
    console.log('✅ Updated existing admin to super_admin');

    // 3. Add summary field to tickets table
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN summary TEXT NULL AFTER resolved_at
    `);
    console.log('✅ Added summary field to tickets');

    // 4. Add finalized_by field to tickets table
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN finalized_by BIGINT UNSIGNED NULL AFTER summary,
      ADD CONSTRAINT fk_tickets_finalized_by 
      FOREIGN KEY (finalized_by) REFERENCES users(id) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ Added finalized_by field to tickets');

    // 5. Add finalized_at field to tickets table
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN finalized_at DATETIME NULL AFTER finalized_by
    `);
    console.log('✅ Added finalized_at field to tickets');

    console.log('\n✅ Schema update completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Users can now be: user, admin, or super_admin');
    console.log('   - Existing admin@intellicare.com is now super_admin');
    console.log('   - Tickets can now have a summary when finalized');
    console.log('   - Tickets track who finalized them and when');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateSchema();
