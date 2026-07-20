const { sequelize, User, Ticket } = require('../models');
require('dotenv').config();

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized successfully');

    // Create default admin user if none exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists) {
      console.log('👤 Creating default admin user...');
      await User.create({
        email: 'admin@intellicare.com',
        password: 'admin123',
        first_name: 'Admin',
        middle_name: '',
        last_name: 'User',
        role: 'admin'
      });
      console.log('✅ Default admin user created');
      console.log('   Email: admin@intellicare.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change this password after first login!');
    }

    console.log('✅ Migration completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
