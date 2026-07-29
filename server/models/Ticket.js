const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  ticket_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actions_taken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolution_steps: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  hospital: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigned_to: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  finalized_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  finalized_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Array of image URLs uploaded with the ticket'
  }
}, {
  tableName: 'tickets',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (ticket) => {
      if (!ticket.ticket_number) {
        const count = await Ticket.count();
        ticket.ticket_number = `TKT-${String(count + 1).padStart(5, '0')}`;
      }
    }
  }
});

module.exports = Ticket;
