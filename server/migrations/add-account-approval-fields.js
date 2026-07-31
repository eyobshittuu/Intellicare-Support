const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    // Add account_status column
    await queryInterface.addColumn('users', 'account_status', {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Account approval status by super admin'
    });

    // Add approved_by column
    await queryInterface.addColumn('users', 'approved_by', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Super admin who approved/rejected the account'
    });

    // Add approved_at column
    await queryInterface.addColumn('users', 'approved_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when account was approved/rejected'
    });

    // Add rejection_reason column
    await queryInterface.addColumn('users', 'rejection_reason', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for account rejection'
    });

    // Update existing users to 'approved' status (grandfather existing accounts)
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET account_status = 'approved', 
          approved_at = created_at 
      WHERE account_status = 'pending'
    `);

    console.log('✅ Account approval fields added successfully');
    console.log('✅ Existing users have been automatically approved');
  },

  down: async (queryInterface) => {
    // Remove columns in reverse order
    await queryInterface.removeColumn('users', 'rejection_reason');
    await queryInterface.removeColumn('users', 'approved_at');
    await queryInterface.removeColumn('users', 'approved_by');
    await queryInterface.removeColumn('users', 'account_status');

    console.log('✅ Account approval fields removed');
  }
};
