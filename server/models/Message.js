const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  sender_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  recipient_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true, // Null for channel messages
    references: {
      model: 'users',
      key: 'id'
    }
  },
  channel_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true, // Null for direct messages
    references: {
      model: 'channels',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true // Allow null for messages with only attachments
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  reactions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
    // Structure: { "👍": [userId1, userId2], "❤️": [userId3] }
  },
  message_type: {
    type: DataTypes.ENUM('text', 'file', 'image'),
    defaultValue: 'text'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Message;
