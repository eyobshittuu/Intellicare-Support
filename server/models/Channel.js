const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Channel = sequelize.define('Channel', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  channel_type: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'private',
    comment: 'public: all admins can see, private: only members can see'
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  avatar_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#14b8a6', // Teal default
    comment: 'Hex color for channel avatar'
  },
  is_archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'channels',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Channel;
