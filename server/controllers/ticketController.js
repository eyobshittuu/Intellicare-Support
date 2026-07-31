const { Ticket, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const { getPublicUrl } = require('../utils/cloudinaryHelper');
const ticketAssignmentService = require('../services/ticketAssignmentService');

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
  const MAX_RETRIES = 3;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      console.log(`=== CREATE TICKET ATTEMPT ${attempt + 1} ===`);
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
        console.log('File details:', req.files.map(f => ({
          filename: f.filename,
          path: f.path,
          mimetype: f.mimetype
        })));
        
        attachments = req.files.map(file => {
          // Generate appropriate URL based on file type
          const publicUrl = getPublicUrl(file);
          console.log('Generated URL for', file.originalname, ':', publicUrl);
          
          return {
            filename: file.filename,
            originalName: file.originalname,
            url: publicUrl, // Use signed URL for raw files, direct URL for images
            publicId: file.filename, // Cloudinary public ID
            size: file.size,
            mimetype: file.mimetype,
            width: file.width,
            height: file.height,
            format: file.format,
            uploadedAt: new Date()
          };
        });
        console.log('Attachments prepared:', JSON.stringify(attachments, null, 2));
      }

      // Generate ticket number - find max existing number to avoid duplicates
      const lastTicket = await Ticket.findOne({
        attributes: ['ticket_number'],
        order: [['id', 'DESC']],
        limit: 1
      });
      
      let nextNumber = 1;
      if (lastTicket && lastTicket.ticket_number) {
        // Extract number from TKT-XXXXX format
        const match = lastTicket.ticket_number.match(/TKT-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // Add attempt offset to avoid collisions on retry
      if (attempt > 0) {
        nextNumber += attempt;
      }
      
      const ticket_number = `TKT-${String(nextNumber).padStart(5, '0')}`;
      console.log('Generated ticket number:', ticket_number, '(last:', lastTicket?.ticket_number, ', attempt:', attempt + 1, ')');

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

      // Log ticket creation
      logger.info('Ticket created', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        userId: req.user.id,
        userName: `${req.user.first_name} ${req.user.last_name}`,
        hospital: ticket.hospital,
        hasAttachments: attachments ? attachments.length : 0,
        action: 'TICKET_CREATE'
      });

      console.log('Ticket fetched with associations');
      return res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        ticket: createdTicket
      });
      
    } catch (error) {
      console.error(`=== CREATE TICKET ERROR (Attempt ${attempt + 1}) ===`);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      if (error.original) {
        console.error('Original error:', error.original);
      }
      
      // Check if it's a duplicate key error
      const isDuplicateError = error.name === 'SequelizeUniqueConstraintError' || 
                               (error.original && error.original.code === '23505');
      
      if (isDuplicateError && attempt < MAX_RETRIES - 1) {
        // Retry with next number
        console.log('Duplicate ticket number detected, retrying...');
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Small delay
        continue;
      }
      
      // If not duplicate error or max retries reached, return error
      return res.status(500).json({
        success: false,
        message: 'Error creating ticket',
        error: error.message
      });
    }
  }
  
  // Should never reach here, but just in case
  return res.status(500).json({
    success: false,
    message: 'Failed to create ticket after multiple attempts'
  });
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
      
      // Log user ticket update
      logger.info('Ticket updated by user', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        userId: req.user.id,
        userName: `${req.user.first_name} ${req.user.last_name}`,
        changes: { title: !!title, description: !!description, category: !!category },
        action: 'TICKET_UPDATE_USER'
      });
    } else {
      // Admin can update all fields
      const oldStatus = ticket.status;
      const oldPriority = ticket.priority;
      const oldAssignee = ticket.assigned_to;
      
      if (title) ticket.title = title;
      if (description) ticket.description = description;
      if (category) ticket.category = category;
      if (priority) ticket.priority = priority;
      if (status) {
        // If status is changing to in_progress and no started_at, set it
        if (status === 'in_progress' && !ticket.started_at) {
          ticket.started_at = new Date();
          
          // Log admin started working on ticket
          logger.info('Admin started working on ticket', {
            ticketId: ticket.id,
            ticketNumber: ticket.ticket_number,
            adminId: req.user.id,
            adminName: `${req.user.first_name} ${req.user.last_name}`,
            previousStatus: oldStatus,
            newStatus: status,
            action: 'TICKET_START_WORK'
          });
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
      
      // Log admin ticket update
      logger.info('Ticket updated by admin', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        adminId: req.user.id,
        adminName: `${req.user.first_name} ${req.user.last_name}`,
        changes: {
          status: oldStatus !== status ? { from: oldStatus, to: status } : undefined,
          priority: oldPriority !== priority ? { from: oldPriority, to: priority } : undefined,
          assigned: oldAssignee !== assigned_to ? { from: oldAssignee, to: assigned_to } : undefined,
          workLog: !!(admin_notes || actions_taken || diagnosis || resolution_steps)
        },
        action: 'TICKET_UPDATE_ADMIN'
      });
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

    // Log ticket deletion
    logger.warn('Ticket deleted', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      title: ticket.title,
      deletedBy: req.user.id,
      deletedByName: `${req.user.first_name} ${req.user.last_name}`,
      action: 'TICKET_DELETE'
    });

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

    // Log ticket finalization
    logger.info('Ticket finalized', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      finalizedBy: req.user.id,
      finalizedByName: `${req.user.first_name} ${req.user.last_name}`,
      summary: summary.substring(0, 100) + '...',
      action: 'TICKET_FINALIZE'
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

// @desc    Get assignment recommendations for a ticket
// @route   GET /api/tickets/:id/recommendations
// @access  Private (Admin only)
exports.getAssignmentRecommendations = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const recommendations = await ticketAssignmentService.getAssignmentRecommendations(ticket);

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting assignment recommendations',
      error: error.message
    });
  }
};

// @desc    Manually assign ticket to an admin
// @route   PUT /api/tickets/:id/assign
// @access  Private (Super Admin only)
exports.assignTicketManually = async (req, res) => {
  try {
    const { adminId, difficulty, priority } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    if (difficulty && (difficulty < 1 || difficulty > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Difficulty must be between 1 and 5'
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be: low, medium, high, or urgent'
      });
    }

    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Verify the admin exists and is active
    const admin = await User.findOne({
      where: {
        id: adminId,
        role: 'admin',
        is_active: true
      }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin or admin is not active'
      });
    }

    // Update ticket with assignment details
    ticket.assigned_to = adminId;
    ticket.assigned_by = req.user.id;
    ticket.assigned_at = new Date();
    ticket.difficulty = difficulty || null;
    if (priority) {
      ticket.priority = priority;
    }
    await ticket.save();

    // Log manual assignment
    logger.info('Ticket manually assigned', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      assignedTo: adminId,
      assignedToName: `${admin.first_name} ${admin.last_name}`,
      assignedBy: req.user.id,
      assignedByName: `${req.user.first_name} ${req.user.last_name}`,
      difficulty: difficulty || null,
      action: 'TICKET_MANUAL_ASSIGN'
    });

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
        }
      ]
    });

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Manual assign error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning ticket',
      error: error.message
    });
  }
};

// @desc    Rebalance workload across admins
// @route   POST /api/tickets/rebalance
// @access  Private (Super Admin only)
exports.rebalanceWorkload = async (req, res) => {
  try {
    const result = await ticketAssignmentService.rebalanceWorkload();

    res.json({
      success: result.success,
      message: result.message,
      rebalanced: result.rebalanced
    });
  } catch (error) {
    console.error('Rebalance workload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rebalancing workload',
      error: error.message
    });
  }
};

// @desc    Get admin workload statistics
// @route   GET /api/tickets/admin-workload
// @access  Private (Admin only)
exports.getAdminWorkload = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: {
        role: 'admin',
        is_active: true
      },
      attributes: ['id', 'first_name', 'last_name', 'email']
    });

    const dialect = Ticket.sequelize.getDialect();
    
    let timeDiffExpression;
    if (dialect === 'postgres') {
      // PostgreSQL: EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
      timeDiffExpression = Ticket.sequelize.literal(
        "EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600"
      );
    } else {
      // MySQL: TIMESTAMPDIFF(HOUR, created_at, resolved_at)
      timeDiffExpression = Ticket.sequelize.literal(
        'TIMESTAMPDIFF(HOUR, created_at, resolved_at)'
      );
    }

    const workloadStats = await Promise.all(admins.map(async (admin) => {
      const activeTickets = await Ticket.count({
        where: {
          assigned_to: admin.id,
          status: { [Op.in]: ['pending', 'in_progress'] }
        }
      });

      const completedTickets = await Ticket.count({
        where: {
          assigned_to: admin.id,
          status: 'completed'
        }
      });

      const avgResolutionTime = await Ticket.findOne({
        attributes: [
          [Ticket.sequelize.fn('AVG', timeDiffExpression), 'avg_hours']
        ],
        where: {
          assigned_to: admin.id,
          status: 'completed',
          resolved_at: { [Op.ne]: null }
        },
        raw: true
      });

      return {
        adminId: admin.id,
        adminName: `${admin.first_name} ${admin.last_name}`,
        email: admin.email,
        activeTickets,
        completedTickets,
        totalTickets: activeTickets + completedTickets,
        avgResolutionHours: avgResolutionTime?.avg_hours ? parseFloat(avgResolutionTime.avg_hours).toFixed(2) : null
      };
    }));

    // Sort by active tickets (descending)
    workloadStats.sort((a, b) => b.activeTickets - a.activeTickets);

    res.json({
      success: true,
      workload: workloadStats
    });
  } catch (error) {
    console.error('Get admin workload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin workload',
      error: error.message
    });
  }
};
