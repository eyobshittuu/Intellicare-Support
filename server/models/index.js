const sequelize = require('../config/database');
const User = require('./User');
const Ticket = require('./Ticket');
const Message = require('./Message');

// Define relationships
User.hasMany(Ticket, {
  foreignKey: 'user_id',
  as: 'tickets'
});

Ticket.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Ticket.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assignee'
});

User.hasMany(Ticket, {
  foreignKey: 'assigned_to',
  as: 'assigned_tickets'
});

Ticket.belongsTo(User, {
  foreignKey: 'finalized_by',
  as: 'finalizer'
});

User.hasMany(Ticket, {
  foreignKey: 'finalized_by',
  as: 'finalized_tickets'
});

// Message relationships
User.hasMany(Message, {
  foreignKey: 'sender_id',
  as: 'sent_messages'
});

User.hasMany(Message, {
  foreignKey: 'recipient_id',
  as: 'received_messages'
});

Message.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender'
});

Message.belongsTo(User, {
  foreignKey: 'recipient_id',
  as: 'recipient'
});

module.exports = {
  sequelize,
  User,
  Ticket,
  Message
};
