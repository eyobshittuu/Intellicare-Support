const { User, Ticket } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

/**
 * Intelligent Ticket Assignment Service
 * 
 * Assigns tickets to admins (not super_admins) based on:
 * 1. Current workload (active tickets)
 * 2. Hospital specialization
 * 3. Category expertise
 * 4. Priority handling capability
 * 5. Round-robin for fairness
 * 6. Admin availability (is_active status)
 */

class TicketAssignmentService {
  
  /**
   * Get all active admins (excludes super_admin and inactive users)
   */
  async getActiveAdmins() {
    return await User.findAll({
      where: {
        role: 'admin',
        is_active: true
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'created_at']
    });
  }

  /**
   * Get current workload for each admin
   * Returns map of admin_id -> active ticket count
   */
  async getAdminWorkloads() {
    const workloads = await Ticket.findAll({
      attributes: [
        'assigned_to',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'ticket_count']
      ],
      where: {
        assigned_to: { [Op.ne]: null },
        status: { [Op.in]: ['pending', 'in_progress'] }
      },
      group: ['assigned_to'],
      raw: true
    });

    const workloadMap = new Map();
    workloads.forEach(item => {
      workloadMap.set(item.assigned_to, parseInt(item.ticket_count));
    });

    return workloadMap;
  }

  /**
   * Get hospital expertise for each admin
   * Tracks which hospitals each admin has handled most
   */
  async getHospitalExpertise() {
    const hospitalStats = await Ticket.findAll({
      attributes: [
        'assigned_to',
        'hospital',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'ticket_count']
      ],
      where: {
        assigned_to: { [Op.ne]: null },
        hospital: { [Op.ne]: null }
      },
      group: ['assigned_to', 'hospital'],
      raw: true
    });

    // Map: admin_id -> Map(hospital -> count)
    const expertiseMap = new Map();
    hospitalStats.forEach(item => {
      if (!expertiseMap.has(item.assigned_to)) {
        expertiseMap.set(item.assigned_to, new Map());
      }
      expertiseMap.get(item.assigned_to).set(item.hospital, parseInt(item.ticket_count));
    });

    return expertiseMap;
  }

  /**
   * Get category expertise for each admin
   * Tracks which categories each admin has handled most
   */
  async getCategoryExpertise() {
    const categoryStats = await Ticket.findAll({
      attributes: [
        'assigned_to',
        'category',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'ticket_count']
      ],
      where: {
        assigned_to: { [Op.ne]: null },
        category: { [Op.ne]: null }
      },
      group: ['assigned_to', 'category'],
      raw: true
    });

    // Map: admin_id -> Map(category -> count)
    const expertiseMap = new Map();
    categoryStats.forEach(item => {
      if (!expertiseMap.has(item.assigned_to)) {
        expertiseMap.set(item.assigned_to, new Map());
      }
      expertiseMap.get(item.assigned_to).set(item.category, parseInt(item.ticket_count));
    });

    return expertiseMap;
  }

  /**
   * Get average resolution time for each admin (in hours)
   */
  async getAdminPerformance() {
    const performance = await Ticket.findAll({
      attributes: [
        'assigned_to',
        [Ticket.sequelize.fn('AVG', 
          Ticket.sequelize.literal('TIMESTAMPDIFF(HOUR, created_at, resolved_at)')
        ), 'avg_resolution_hours'],
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'completed_count']
      ],
      where: {
        assigned_to: { [Op.ne]: null },
        status: 'completed',
        resolved_at: { [Op.ne]: null }
      },
      group: ['assigned_to'],
      raw: true
    });

    const performanceMap = new Map();
    performance.forEach(item => {
      performanceMap.set(item.assigned_to, {
        avgHours: parseFloat(item.avg_resolution_hours) || 0,
        completedCount: parseInt(item.completed_count) || 0
      });
    });

    return performanceMap;
  }

  /**
   * Calculate assignment score for each admin
   * Higher score = better candidate for assignment
   */
  calculateScore(admin, ticket, workload, hospitalExpertise, categoryExpertise, performance) {
    let score = 1000; // Base score

    // 1. Workload factor (lower workload = higher score)
    const currentWorkload = workload.get(admin.id) || 0;
    score -= currentWorkload * 50; // Each active ticket reduces score by 50

    // 2. Hospital expertise factor
    const hospitalExp = hospitalExpertise.get(admin.id);
    if (hospitalExp && ticket.hospital) {
      const hospitalCount = hospitalExp.get(ticket.hospital) || 0;
      score += hospitalCount * 30; // Bonus for hospital familiarity
    }

    // 3. Category expertise factor
    const categoryExp = categoryExpertise.get(admin.id);
    if (categoryExp && ticket.category) {
      const categoryCount = categoryExp.get(ticket.category) || 0;
      score += categoryCount * 20; // Bonus for category familiarity
    }

    // 4. Priority handling factor
    if (ticket.priority === 'urgent' || ticket.priority === 'high') {
      // For urgent tickets, prefer admins with lower workload
      score += (10 - currentWorkload) * 25;
    }

    // 5. Performance factor (faster resolution = bonus)
    const perf = performance.get(admin.id);
    if (perf && perf.completedCount > 0) {
      // Bonus for having completed tickets
      score += Math.min(perf.completedCount * 5, 100);
      
      // Slight bonus for faster average resolution (inverse relationship)
      if (perf.avgHours > 0) {
        const speedBonus = Math.max(0, (100 - perf.avgHours) / 2);
        score += speedBonus;
      }
    }

    // 6. New admin boost (to prevent experienced admins from always getting tickets)
    const perf2 = performance.get(admin.id);
    if (!perf2 || perf2.completedCount < 5) {
      score += 50; // Boost for new admins to help them build experience
    }

    // 7. Overload penalty (if admin has too many tickets)
    if (currentWorkload > 10) {
      score -= (currentWorkload - 10) * 100; // Heavy penalty for overload
    }

    return Math.max(0, score); // Ensure non-negative
  }

  /**
   * Assign ticket to best available admin
   * 
   * @param {Object} ticket - Ticket object to assign
   * @returns {Number|null} - Assigned admin ID or null if no admin available
   */
  async assignTicket(ticket) {
    try {
      // Get all active admins
      const admins = await this.getActiveAdmins();
      
      if (admins.length === 0) {
        logger.warn('No active admins available for ticket assignment', {
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          action: 'TICKET_ASSIGNMENT_NO_ADMINS'
        });
        return null;
      }

      // Get assignment data
      const [workload, hospitalExpertise, categoryExpertise, performance] = await Promise.all([
        this.getAdminWorkloads(),
        this.getHospitalExpertise(),
        this.getCategoryExpertise(),
        this.getAdminPerformance()
      ]);

      // Calculate scores for each admin
      const scoredAdmins = admins.map(admin => ({
        admin,
        score: this.calculateScore(admin, ticket, workload, hospitalExpertise, categoryExpertise, performance),
        currentWorkload: workload.get(admin.id) || 0
      }));

      // Sort by score (highest first)
      scoredAdmins.sort((a, b) => b.score - a.score);

      // Select the best admin
      const bestMatch = scoredAdmins[0];

      // Log assignment decision
      logger.info('Ticket auto-assigned', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        assignedTo: bestMatch.admin.id,
        assignedToName: `${bestMatch.admin.first_name} ${bestMatch.admin.last_name}`,
        assignmentScore: bestMatch.score,
        currentWorkload: bestMatch.currentWorkload,
        priority: ticket.priority,
        hospital: ticket.hospital,
        category: ticket.category,
        topCandidates: scoredAdmins.slice(0, 3).map(s => ({
          adminId: s.admin.id,
          name: `${s.admin.first_name} ${s.admin.last_name}`,
          score: s.score,
          workload: s.currentWorkload
        })),
        action: 'TICKET_AUTO_ASSIGN'
      });

      return bestMatch.admin.id;
    } catch (error) {
      logger.error('Error in ticket assignment', {
        ticketId: ticket.id,
        error: error.message,
        action: 'TICKET_ASSIGNMENT_ERROR'
      });
      return null;
    }
  }

  /**
   * Get assignment recommendations for a ticket (for manual review)
   * 
   * @param {Object} ticket - Ticket object
   * @returns {Array} - Array of recommended admins with scores
   */
  async getAssignmentRecommendations(ticket) {
    try {
      const admins = await this.getActiveAdmins();
      
      if (admins.length === 0) {
        return [];
      }

      const [workload, hospitalExpertise, categoryExpertise, performance] = await Promise.all([
        this.getAdminWorkloads(),
        this.getHospitalExpertise(),
        this.getCategoryExpertise(),
        this.getAdminPerformance()
      ]);

      const recommendations = admins.map(admin => {
        const score = this.calculateScore(admin, ticket, workload, hospitalExpertise, categoryExpertise, performance);
        const currentWorkload = workload.get(admin.id) || 0;
        const perf = performance.get(admin.id);

        return {
          adminId: admin.id,
          adminName: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          score,
          currentWorkload,
          completedTickets: perf ? perf.completedCount : 0,
          avgResolutionHours: perf ? perf.avgHours : null,
          hospitalExperience: hospitalExpertise.get(admin.id)?.get(ticket.hospital) || 0,
          categoryExperience: categoryExpertise.get(admin.id)?.get(ticket.category) || 0
        };
      });

      // Sort by score
      recommendations.sort((a, b) => b.score - a.score);

      return recommendations;
    } catch (error) {
      logger.error('Error getting assignment recommendations', {
        ticketId: ticket.id,
        error: error.message,
        action: 'TICKET_RECOMMENDATIONS_ERROR'
      });
      return [];
    }
  }

  /**
   * Rebalance workload - reassign tickets if one admin is overloaded
   * 
   * @returns {Object} - Rebalancing results
   */
  async rebalanceWorkload() {
    try {
      const admins = await this.getActiveAdmins();
      const workload = await this.getAdminWorkloads();

      if (admins.length === 0) {
        return { success: false, message: 'No active admins' };
      }

      // Calculate average workload
      const totalWorkload = Array.from(workload.values()).reduce((sum, count) => sum + count, 0);
      const avgWorkload = totalWorkload / admins.length;
      const threshold = avgWorkload * 1.5; // 50% above average

      // Find overloaded admins
      const overloadedAdmins = admins.filter(admin => {
        const load = workload.get(admin.id) || 0;
        return load > threshold && load > 5; // At least 5 tickets
      });

      if (overloadedAdmins.length === 0) {
        return { success: true, message: 'Workload is balanced', rebalanced: 0 };
      }

      let rebalancedCount = 0;

      // For each overloaded admin, reassign some pending tickets
      for (const admin of overloadedAdmins) {
        const ticketsToReassign = await Ticket.findAll({
          where: {
            assigned_to: admin.id,
            status: 'pending' // Only reassign pending tickets
          },
          order: [['created_at', 'DESC']],
          limit: 2 // Reassign max 2 tickets per admin
        });

        for (const ticket of ticketsToReassign) {
          const newAdminId = await this.assignTicket(ticket);
          if (newAdminId && newAdminId !== admin.id) {
            await ticket.update({ assigned_to: newAdminId });
            rebalancedCount++;

            logger.info('Ticket reassigned for workload balance', {
              ticketId: ticket.id,
              ticketNumber: ticket.ticket_number,
              fromAdmin: admin.id,
              toAdmin: newAdminId,
              action: 'TICKET_REBALANCE'
            });
          }
        }
      }

      return { 
        success: true, 
        message: `Rebalanced ${rebalancedCount} tickets`, 
        rebalanced: rebalancedCount 
      };
    } catch (error) {
      logger.error('Error rebalancing workload', {
        error: error.message,
        action: 'WORKLOAD_REBALANCE_ERROR'
      });
      return { success: false, message: error.message, rebalanced: 0 };
    }
  }
}

module.exports = new TicketAssignmentService();
