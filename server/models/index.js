const sequelize = require('../config/database');
const User = require('./User');
const Ticket = require('./Ticket');

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

module.exports = {
  sequelize,
  User,
  Ticket
};
