const sequelize = require('../config/database');
const User = require('./User');
const Ticket = require('./Ticket');
const Message = require('./Message');
const Channel = require('./Channel');
const ChannelMember = require('./ChannelMember');

// Define relationships
User.hasMany(Ticket, {
  foreignKey: 'user_id',
  as: 'tickets',
  onDelete: 'SET NULL'  // Keep tickets when user is deleted
});

Ticket.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'SET NULL'
});

Ticket.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assignee',
  onDelete: 'SET NULL'  // Keep tickets when admin is deleted
});

User.hasMany(Ticket, {
  foreignKey: 'assigned_to',
  as: 'assigned_tickets',
  onDelete: 'SET NULL'
});

Ticket.belongsTo(User, {
  foreignKey: 'finalized_by',
  as: 'finalizer',
  onDelete: 'SET NULL'  // Keep finalization record when admin is deleted
});

User.hasMany(Ticket, {
  foreignKey: 'finalized_by',
  as: 'finalized_tickets',
  onDelete: 'SET NULL'
});

Ticket.belongsTo(User, {
  foreignKey: 'assigned_by',
  as: 'assigner',
  onDelete: 'SET NULL'  // Keep assignment record when super admin is deleted
});

User.hasMany(Ticket, {
  foreignKey: 'assigned_by',
  as: 'tickets_assigned',
  onDelete: 'SET NULL'
});

// Message relationships
User.hasMany(Message, {
  foreignKey: 'sender_id',
  as: 'sent_messages',
  onDelete: 'CASCADE'  // Delete messages when user is deleted
});

User.hasMany(Message, {
  foreignKey: 'recipient_id',
  as: 'received_messages',
  onDelete: 'CASCADE'  // Delete messages when user is deleted
});

Message.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender',
  onDelete: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'recipient_id',
  as: 'recipient',
  onDelete: 'CASCADE'
});

// Channel relationships
User.hasMany(Channel, {
  foreignKey: 'created_by',
  as: 'created_channels',
  onDelete: 'CASCADE'
});

Channel.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
  onDelete: 'CASCADE'
});

// Channel members relationships
Channel.hasMany(ChannelMember, {
  foreignKey: 'channel_id',
  as: 'members',
  onDelete: 'CASCADE'
});

ChannelMember.belongsTo(Channel, {
  foreignKey: 'channel_id',
  as: 'channel',
  onDelete: 'CASCADE'
});

User.hasMany(ChannelMember, {
  foreignKey: 'user_id',
  as: 'channel_memberships',
  onDelete: 'CASCADE'
});

ChannelMember.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

// Channel messages
Channel.hasMany(Message, {
  foreignKey: 'channel_id',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(Channel, {
  foreignKey: 'channel_id',
  as: 'channel',
  onDelete: 'CASCADE'
});

module.exports = {
  sequelize,
  User,
  Ticket,
  Message,
  Channel,
  ChannelMember
};
