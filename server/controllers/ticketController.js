const { Ticket, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all tickets (admin sees all, user sees own)
// @route   GET /api/tickets
// @access  Private
exports.getTickets = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    // Non-admin users can only see their own tickets
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      where.user_id = req.user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { ticket_number: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'finalizer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      tickets
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message
    });
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'finalizer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user can access this ticket
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message
    });
  }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res) => {
  try {
    console.log('=== CREATE TICKET DEBUG ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('User:', req.user?.id);
    
    const { title, description, category, hospital, priority } = req.body;

    // Validate required fields
    if (!title || !description || !hospital) {
      console.error('Missing required fields:', { title: !!title, description: !!description, hospital: !!hospital });
      return res.status(400).json({
        success: false,
        message: 'Title, description, and hospital are required'
      });
    }

    // Handle uploaded files from Cloudinary
    let attachments = null;
    if (req.files && req.files.length > 0) {
      console.log('Processing files:', req.files.length);
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: file.path, // Cloudinary URL
        publicId: file.filename, // Cloudinary public ID
        size: file.size,
        mimetype: file.mimetype,
        width: file.width,
        height: file.height,
        format: file.format,
        uploadedAt: new Date()
      }));
      console.log('Attachments prepared:', JSON.stringify(attachments, null, 2));
    }

    // Generate ticket number
    const count = await Ticket.count();
    const ticket_number = `TKT-${String(count + 1).padStart(5, '0')}`;
    console.log('Generated ticket number:', ticket_number);

    const ticketData = {
      ticket_number,
      title,
      description,
      category,
      hospital,
      priority: priority || 'medium',
      user_id: req.user.id,
      attachments
    };
    console.log('Creating ticket with data:', JSON.stringify(ticketData, null, 2));

    const ticket = await Ticket.create(ticketData);
    console.log('Ticket created with ID:', ticket.id);

    // Fetch with associations
    const createdTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    console.log('Ticket fetched with associations');
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: createdTicket
    });
  } catch (error) {
    console.error('=== CREATE TICKET ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    if (error.original) {
      console.error('Original error:', error.original);
    }
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message
    });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if ticket is finalized - prevent editing
    if (ticket.finalized_at) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update a finalized ticket. Work log is locked.'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ticket'
      });
    }

    const { 
      title, 
      description, 
      category, 
      priority, 
      status, 
      assigned_to,
      admin_notes,
      actions_taken,
      diagnosis,
      resolution_steps
    } = req.body;

    // Users can only update certain fields
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      if (title) ticket.title = title;
      if (description) ticket.description = description;
      if (category) ticket.category = category;
    } else {
      // Admin can update all fields
      if (title) ticket.title = title;
      if (description) ticket.description = description;
      if (category) ticket.category = category;
      if (priority) ticket.priority = priority;
      if (status) {
        // If status is changing to in_progress and no started_at, set it
        if (status === 'in_progress' && !ticket.started_at) {
          ticket.started_at = new Date();
        }
        ticket.status = status;
        if (status === 'completed') {
          ticket.resolved_at = new Date();
        }
      }
      if (assigned_to !== undefined) ticket.assigned_to = assigned_to;
      
      // Admin work log fields
      if (admin_notes !== undefined) ticket.admin_notes = admin_notes;
      if (actions_taken !== undefined) ticket.actions_taken = actions_taken;
      if (diagnosis !== undefined) ticket.diagnosis = diagnosis;
      if (resolution_steps !== undefined) ticket.resolution_steps = resolution_steps;
    }

    await ticket.save();

    // Fetch updated ticket with associations
    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'finalizer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ticket',
      error: error.message
    });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin only)
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.destroy();

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting ticket',
      error: error.message
    });
  }
};

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Private (Admin only)
exports.getStats = async (req, res) => {
  try {
    const totalTickets = await Ticket.count();
    const pendingTickets = await Ticket.count({ where: { status: 'pending' } });
    const inProgressTickets = await Ticket.count({ where: { status: 'in_progress' } });
    const completedTickets = await Ticket.count({ where: { status: 'completed' } });
    const rejectedTickets = await Ticket.count({ where: { status: 'rejected' } });

    const priorityStats = await Ticket.findAll({
      attributes: [
        'priority',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']
      ],
      group: ['priority']
    });

    const categoryStats = await Ticket.findAll({
      attributes: [
        'category',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']
      ],
      where: {
        category: { [Op.ne]: null }
      },
      group: ['category'],
      limit: 10
    });

    res.json({
      success: true,
      stats: {
        total: totalTickets,
        pending: pendingTickets,
        in_progress: inProgressTickets,
        completed: completedTickets,
        rejected: rejectedTickets,
        byPriority: priorityStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// @desc    Finalize ticket with summary
// @route   PUT /api/tickets/:id/finalize
// @access  Private (Admin only)
exports.finalizeTicket = async (req, res) => {
  try {
    const { summary } = req.body;

    if (!summary || summary.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Summary is required to finalize ticket'
      });
    }

    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Update ticket
    ticket.summary = summary;
    ticket.finalized_by = req.user.id;
    ticket.finalized_at = new Date();
    ticket.status = 'completed';
    ticket.resolved_at = new Date();

    await ticket.save();

    // Fetch updated ticket with associations
    const finalizedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'finalizer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Ticket finalized successfully',
      ticket: finalizedTicket
    });
  } catch (error) {
    console.error('Finalize ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finalizing ticket',
      error: error.message
    });
  }
};
