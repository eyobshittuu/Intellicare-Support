const sequelize = require('../config/database');

async function addHospitalField() {
  try {
    console.log('🔄 Adding hospital field to tickets table...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Add hospital column
    await sequelize.query(`
      ALTER TABLE tickets 
      ADD COLUMN hospital VARCHAR(100) NOT NULL DEFAULT 'Not Specified' 
      AFTER category
    `);

    console.log('✅ Hospital field added successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addHospitalField();
