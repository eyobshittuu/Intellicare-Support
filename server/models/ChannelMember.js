const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChannelMember = sequelize.define('ChannelMember', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  channel_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'channels',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    defaultValue: 'member',
    comment: 'owner: creator, admin: can add/remove members, member: regular member'
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time user read messages in this channel'
  }
}, {
  tableName: 'channel_members',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['channel_id', 'user_id']
    }
  ]
});

module.exports = ChannelMember;
