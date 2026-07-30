const sequelize = require('../config/database');
const User = require('./User');
const Ticket = require('./Ticket');
const Message = require('./Message');

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

module.exports = {
  sequelize,
  User,
  Ticket,
  Message
};
