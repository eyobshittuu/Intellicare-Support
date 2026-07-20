const sequelize = require('../config/database');

async function addWorkLogFields() {
  try {
    console.log('🔄 Adding admin work log fields...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // 1. Add admin_notes field to tickets
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN admin_notes TEXT NULL AFTER description
    `);
    console.log('✅ Added admin_notes field');

    // 2. Add actions_taken field
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN actions_taken TEXT NULL AFTER admin_notes
    `);
    console.log('✅ Added actions_taken field');

    // 3. Add diagnosis field
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN diagnosis TEXT NULL AFTER actions_taken
    `);
    console.log('✅ Added diagnosis field');

    // 4. Add resolution_steps field
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN resolution_steps TEXT NULL AFTER diagnosis
    `);
    console.log('✅ Added resolution_steps field');

    // 5. Add started_at field
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN started_at DATETIME NULL AFTER assigned_to
    `);
    console.log('✅ Added started_at field');

    console.log('\n✅ Work log schema update completed successfully!');
    console.log('\n📝 New Fields Added:');
    console.log('   - admin_notes: Internal notes visible only to admins');
    console.log('   - actions_taken: What the admin did to resolve');
    console.log('   - diagnosis: Problem diagnosis/root cause');
    console.log('   - resolution_steps: Step-by-step resolution process');
    console.log('   - started_at: When admin started working on ticket');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addWorkLogFields();
