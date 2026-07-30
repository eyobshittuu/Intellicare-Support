const { User, Ticket } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

/**
 * Admin Performance Evaluation Service
 * 
 * Provides comprehensive performance metrics and statistics for admins:
 * - Response time (first response to ticket)
 * - Resolution time (ticket creation to completion)
 * - Ticket volume and completion rates
 * - Quality metrics
 * - Workload trends over time
 * - Comparative analysis
 */

class AdminPerformanceService {

  /**
   * Get comprehensive performance metrics for a specific admin
   */
  async getAdminPerformance(adminId, dateRange = null) {
    try {
      const admin = await User.findOne({
        where: {
          id: adminId,
          role: 'admin'
        }
      });

      if (!admin) {
        throw new Error('Admin not found');
      }

      // Build date filter
      const dateFilter = this.buildDateFilter(dateRange);

      // Get all metrics in parallel
      const [
        ticketStats,
        responseTime,
        resolutionTime,
        qualityMetrics,
        priorityBreakdown,
        categoryBreakdown,
        statusBreakdown,
        trendData,
        recentTickets
      ] = await Promise.all([
        this.getTicketStats(adminId, dateFilter),
        this.getAverageResponseTime(adminId, dateFilter),
        this.getAverageResolutionTime(adminId, dateFilter),
        this.getQualityMetrics(adminId, dateFilter),
        this.getPriorityBreakdown(adminId, dateFilter),
        this.getCategoryBreakdown(adminId, dateFilter),
        this.getStatusBreakdown(adminId, dateFilter),
        this.getTrendData(adminId, dateRange),
        this.getRecentTickets(adminId, 5)
      ]);

      return {
        admin: {
          id: admin.id,
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          joinDate: admin.created_at
        },
        period: dateRange || 'all_time',
        ticketStats,
        responseTime,
        resolutionTime,
        qualityMetrics,
        priorityBreakdown,
        categoryBreakdown,
        statusBreakdown,
        trendData,
        recentTickets
      };
    } catch (error) {
      logger.error('Error getting admin performance', {
        adminId,
        error: error.message,
        action: 'GET_ADMIN_PERFORMANCE_ERROR'
      });
      throw error;
    }
  }

  /**
   * Get performance comparison for all admins
   */
  async getAllAdminsPerformance(dateRange = null) {
    try {
      const admins = await User.findAll({
        where: {
          role: 'admin',
          is_active: true
        },
        attributes: ['id', 'first_name', 'last_name', 'email', 'created_at'],
        order: [['first_name', 'ASC']]
      });

      const dateFilter = this.buildDateFilter(dateRange);

      const performanceData = await Promise.all(admins.map(async (admin) => {
        const [
          ticketStats,
          avgResponseTime,
          avgResolutionTime,
          qualityScore
        ] = await Promise.all([
          this.getTicketStats(admin.id, dateFilter),
          this.getAverageResponseTime(admin.id, dateFilter),
          this.getAverageResolutionTime(admin.id, dateFilter),
          this.calculateQualityScore(admin.id, dateFilter)
        ]);

        return {
          adminId: admin.id,
          adminName: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          joinDate: admin.created_at,
          totalTickets: ticketStats.total,
          activeTickets: ticketStats.active,
          completedTickets: ticketStats.completed,
          completionRate: ticketStats.completionRate,
          avgResponseHours: avgResponseTime.hours,
          avgResolutionHours: avgResolutionTime.hours,
          qualityScore: qualityScore,
          performanceGrade: this.calculateGrade(qualityScore)
        };
      }));

      // Sort by quality score
      performanceData.sort((a, b) => b.qualityScore - a.qualityScore);

      // Calculate team averages
      const teamAverages = this.calculateTeamAverages(performanceData);

      return {
        period: dateRange || 'all_time',
        admins: performanceData,
        teamAverages,
        topPerformer: performanceData[0],
        totalAdmins: admins.length
      };
    } catch (error) {
      logger.error('Error getting all admins performance', {
        error: error.message,
        action: 'GET_ALL_ADMINS_PERFORMANCE_ERROR'
      });
      throw error;
    }
  }

  /**
   * Get detailed performance report for an admin
   */
  async getDetailedReport(adminId, dateRange = null) {
    try {
      const basicPerformance = await this.getAdminPerformance(adminId, dateRange);
      
      const dateFilter = this.buildDateFilter(dateRange);

      // Additional detailed metrics
      const [
        hourlyDistribution,
        weekdayDistribution,
        performanceComparison,
        workloadHistory
      ] = await Promise.all([
        this.getHourlyDistribution(adminId, dateFilter),
        this.getWeekdayDistribution(adminId, dateFilter),
        this.getPerformanceComparison(adminId, dateFilter),
        this.getWorkloadHistory(adminId, dateRange)
      ]);

      return {
        ...basicPerformance,
        detailedMetrics: {
          hourlyDistribution,
          weekdayDistribution,
          performanceComparison,
          workloadHistory
        }
      };
    } catch (error) {
      logger.error('Error generating detailed report', {
        adminId,
        error: error.message,
        action: 'GET_DETAILED_REPORT_ERROR'
      });
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  buildDateFilter(dateRange) {
    if (!dateRange) return null;

    const now = new Date();
    let startDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return null;
    }

    return {
      created_at: { [Op.gte]: startDate }
    };
  }

  async getTicketStats(adminId, dateFilter) {
    const whereClause = {
      assigned_to: adminId,
      ...(dateFilter || {})
    };

    const total = await Ticket.count({ where: whereClause });
    
    const completed = await Ticket.count({
      where: { ...whereClause, status: 'completed' }
    });

    const active = await Ticket.count({
      where: { ...whereClause, status: { [Op.in]: ['pending', 'in_progress'] } }
    });

    const rejected = await Ticket.count({
      where: { ...whereClause, status: 'rejected' }
    });

    return {
      total,
      completed,
      active,
      rejected,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
    };
  }

  async getAverageResponseTime(adminId, dateFilter) {
    try {
      const dialect = Ticket.sequelize.getDialect();
      
      let timeDiffExpression;
      if (dialect === 'postgres') {
        // PostgreSQL: EXTRACT(EPOCH FROM (started_at - created_at)) / 60
        timeDiffExpression = Ticket.sequelize.literal(
          "EXTRACT(EPOCH FROM (started_at - created_at)) / 60"
        );
      } else {
        // MySQL: TIMESTAMPDIFF(MINUTE, created_at, started_at)
        timeDiffExpression = Ticket.sequelize.literal(
          'TIMESTAMPDIFF(MINUTE, created_at, started_at)'
        );
      }

      const result = await Ticket.findOne({
        attributes: [
          [Ticket.sequelize.fn('AVG', timeDiffExpression), 'avg_minutes'],
          [Ticket.sequelize.fn('MIN', timeDiffExpression), 'min_minutes'],
          [Ticket.sequelize.fn('MAX', timeDiffExpression), 'max_minutes']
        ],
        where: {
          assigned_to: adminId,
          started_at: { [Op.ne]: null },
          ...(dateFilter || {})
        },
        raw: true
      });

      const avgMinutes = parseFloat(result?.avg_minutes) || 0;
      const minMinutes = parseFloat(result?.min_minutes) || 0;
      const maxMinutes = parseFloat(result?.max_minutes) || 0;

      return {
        minutes: avgMinutes,
        hours: (avgMinutes / 60).toFixed(2),
        minMinutes,
        maxMinutes,
        formatted: this.formatTime(avgMinutes)
      };
    } catch (error) {
      logger.error('Error getting average response time', {
        adminId,
        error: error.message
      });
      return {
        minutes: 0,
        hours: '0.00',
        minMinutes: 0,
        maxMinutes: 0,
        formatted: '0 min'
      };
    }
  }

  async getAverageResolutionTime(adminId, dateFilter) {
    try {
      const dialect = Ticket.sequelize.getDialect();
      
      let timeDiffExpression;
      if (dialect === 'postgres') {
        // PostgreSQL: EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
        timeDiffExpression = Ticket.sequelize.literal(
          "EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60"
        );
      } else {
        // MySQL: TIMESTAMPDIFF(MINUTE, created_at, resolved_at)
        timeDiffExpression = Ticket.sequelize.literal(
          'TIMESTAMPDIFF(MINUTE, created_at, resolved_at)'
        );
      }

      const result = await Ticket.findOne({
        attributes: [
          [Ticket.sequelize.fn('AVG', timeDiffExpression), 'avg_minutes'],
          [Ticket.sequelize.fn('MIN', timeDiffExpression), 'min_minutes'],
          [Ticket.sequelize.fn('MAX', timeDiffExpression), 'max_minutes']
        ],
        where: {
          assigned_to: adminId,
          status: 'completed',
          resolved_at: { [Op.ne]: null },
          ...(dateFilter || {})
        },
        raw: true
      });

      const avgMinutes = parseFloat(result?.avg_minutes) || 0;
      const minMinutes = parseFloat(result?.min_minutes) || 0;
      const maxMinutes = parseFloat(result?.max_minutes) || 0;

      return {
        minutes: avgMinutes,
        hours: (avgMinutes / 60).toFixed(2),
        days: (avgMinutes / 1440).toFixed(2),
        minMinutes,
        maxMinutes,
        formatted: this.formatTime(avgMinutes)
      };
    } catch (error) {
      logger.error('Error getting average resolution time', {
        adminId,
        error: error.message
      });
      return {
        minutes: 0,
        hours: '0.00',
        days: '0.00',
        minMinutes: 0,
        maxMinutes: 0,
        formatted: '0 min'
      };
    }
  }

  async getQualityMetrics(adminId, dateFilter) {
    const whereClause = {
      assigned_to: adminId,
      ...(dateFilter || {})
    };

    const totalAssigned = await Ticket.count({ where: whereClause });

    const finalized = await Ticket.count({
      where: { ...whereClause, finalized_at: { [Op.ne]: null } }
    });

    const rejected = await Ticket.count({
      where: { ...whereClause, status: 'rejected' }
    });

    const avgResolution = await this.getAverageResolutionTime(adminId, dateFilter);
    
    // Get difficulty score sum - wrapped in try-catch for backward compatibility
    let totalDifficultyScore = 0;
    let avgDifficulty = 0;
    
    try {
      const difficultyResult = await Ticket.findOne({
        attributes: [
          [Ticket.sequelize.fn('SUM', Ticket.sequelize.col('difficulty')), 'total_difficulty'],
          [Ticket.sequelize.fn('AVG', Ticket.sequelize.col('difficulty')), 'avg_difficulty']
        ],
        where: {
          ...whereClause,
          difficulty: { [Op.ne]: null }
        },
        raw: true
      });
      
      totalDifficultyScore = parseInt(difficultyResult?.total_difficulty) || 0;
      avgDifficulty = parseFloat(difficultyResult?.avg_difficulty) || 0;
    } catch (error) {
      // Difficulty column might not exist yet - gracefully handle
      logger.warn('Could not fetch difficulty metrics (column may not exist yet)', {
        adminId,
        error: error.message
      });
    }

    return {
      totalAssigned,
      finalized,
      rejected,
      finalizationRate: totalAssigned > 0 ? ((finalized / totalAssigned) * 100).toFixed(2) : 0,
      rejectionRate: totalAssigned > 0 ? ((rejected / totalAssigned) * 100).toFixed(2) : 0,
      avgResolutionHours: avgResolution.hours,
      totalDifficultyScore,
      avgDifficulty: avgDifficulty > 0 ? avgDifficulty.toFixed(2) : 0
    };
  }

  async calculateQualityScore(adminId, dateFilter) {
    try {
      const [stats, responseTime, resolutionTime, qualityMetrics] = await Promise.all([
        this.getTicketStats(adminId, dateFilter),
        this.getAverageResponseTime(adminId, dateFilter),
        this.getAverageResolutionTime(adminId, dateFilter),
        this.getQualityMetrics(adminId, dateFilter)
      ]);

      if (stats.total === 0) return 0;

      let score = 0;

      // Completion rate (30 points max) - reduced from 40
      score += parseFloat(stats.completionRate) * 0.3;

      // Response time (20 points max) - reduced from 30
      const responseHours = parseFloat(responseTime.hours) || 0;
      if (responseHours > 0) {
        const responseScore = Math.max(0, 20 - (responseHours * 1.5));
        score += Math.min(20, responseScore);
      }

      // Resolution time (20 points max) - reduced from 30
      const resolutionHours = parseFloat(resolutionTime.hours) || 0;
      if (resolutionHours > 0) {
        const resolutionScore = Math.max(0, 20 - (resolutionHours / 3));
        score += Math.min(20, resolutionScore);
      }

      // Difficulty score (30 points max) - NEW: based on sum of difficulty ratings
      // Higher difficulty = higher score (rewards taking harder tickets)
      const totalDifficulty = qualityMetrics.totalDifficultyScore || 0;
      const avgDifficulty = parseFloat(qualityMetrics.avgDifficulty) || 0;
      
      if (totalDifficulty > 0 && stats.total > 0) {
        // Score based on average difficulty (max 5.0) scaled to 30 points
        const difficultyScore = (avgDifficulty / 5.0) * 30;
        score += Math.min(30, difficultyScore);
      } else if (stats.total > 0) {
        // If no difficulty scores are available, redistribute those 30 points
        // Give bonus points based on completion metrics to avoid penalizing old data
        const bonusScore = (parseFloat(stats.completionRate) / 100) * 15;
        score += bonusScore;
      }

      return Math.round(Math.min(100, score));
    } catch (error) {
      logger.error('Error calculating quality score', {
        adminId,
        error: error.message,
        stack: error.stack
      });
      return 0;
    }
  }

  calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }

  async getPriorityBreakdown(adminId, dateFilter) {
    const priorities = await Ticket.findAll({
      attributes: [
        'priority',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']
      ],
      where: {
        assigned_to: adminId,
        ...(dateFilter || {})
      },
      group: ['priority'],
      raw: true
    });

    return priorities.map(p => ({
      priority: p.priority,
      count: parseInt(p.count)
    }));
  }

  async getCategoryBreakdown(adminId, dateFilter) {
    const categories = await Ticket.findAll({
      attributes: [
        'category',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']
      ],
      where: {
        assigned_to: adminId,
        category: { [Op.ne]: null },
        ...(dateFilter || {})
      },
      group: ['category'],
      order: [[Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    return categories.map(c => ({
      category: c.category,
      count: parseInt(c.count)
    }));
  }

  async getStatusBreakdown(adminId, dateFilter) {
    const statuses = await Ticket.findAll({
      attributes: [
        'status',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']
      ],
      where: {
        assigned_to: adminId,
        ...(dateFilter || {})
      },
      group: ['status'],
      raw: true
    });

    return statuses.map(s => ({
      status: s.status,
      count: parseInt(s.count)
    }));
  }

  async getTrendData(adminId, dateRange) {
    // Get ticket completion trend over the period
    const period = dateRange || 'month';
    const dialect = Ticket.sequelize.getDialect();
    
    let dateFormatExpression;
    if (dialect === 'postgres') {
      // PostgreSQL: TO_CHAR(created_at, 'YYYY-MM-DD') or 'YYYY-MM'
      const format = period === 'year' ? 'YYYY-MM' : 'YYYY-MM-DD';
      dateFormatExpression = Ticket.sequelize.fn('TO_CHAR', 
        Ticket.sequelize.col('created_at'), 
        format
      );
    } else {
      // MySQL: DATE_FORMAT(created_at, '%Y-%m-%d') or '%Y-%m'
      const format = period === 'year' ? '%Y-%m' : '%Y-%m-%d';
      dateFormatExpression = Ticket.sequelize.fn('DATE_FORMAT', 
        Ticket.sequelize.col('created_at'), 
        format
      );
    }

    const trends = await Ticket.findAll({
      attributes: [
        [dateFormatExpression, 'date'],
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'created'],
        [Ticket.sequelize.fn('SUM', 
          Ticket.sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")
        ), 'completed']
      ],
      where: {
        assigned_to: adminId,
        ...(this.buildDateFilter(dateRange) || {})
      },
      group: [dateFormatExpression],
      order: [[dateFormatExpression, 'ASC']],
      raw: true
    });

    return trends.map(t => ({
      date: t.date,
      created: parseInt(t.created) || 0,
      completed: parseInt(t.completed) || 0
    }));
  }

  async getRecentTickets(adminId, limit = 5) {
    const tickets = await Ticket.findAll({
      where: { assigned_to: adminId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      attributes: ['id', 'ticket_number', 'title', 'status', 'priority', 'created_at', 'resolved_at']
    });

    return tickets.map(t => ({
      id: t.id,
      ticketNumber: t.ticket_number,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.created_at,
      resolvedAt: t.resolved_at,
      userName: t.user ? `${t.user.first_name} ${t.user.last_name}` : 'Unknown'
    }));
  }

  async getHourlyDistribution(adminId, dateFilter) {
    const dialect = Ticket.sequelize.getDialect();
    
    let hourExpression;
    if (dialect === 'postgres') {
      // PostgreSQL: EXTRACT(HOUR FROM created_at)
      hourExpression = Ticket.sequelize.fn('EXTRACT', 
        Ticket.sequelize.literal('HOUR FROM created_at')
      );
    } else {
      // MySQL: HOUR(created_at)
      hourExpression = Ticket.sequelize.fn('HOUR', 
        Ticket.sequelize.col('created_at')
      );
    }

    const distribution = await Ticket.findAll({
      attributes: [
        [hourExpression, 'hour'],
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']
      ],
      where: {
        assigned_to: adminId,
        ...(dateFilter || {})
      },
      group: [hourExpression],
      raw: true
    });

    return distribution.map(d => ({
      hour: parseInt(d.hour),
      count: parseInt(d.count)
    }));
  }

  async getWeekdayDistribution(adminId, dateFilter) {
    const dialect = Ticket.sequelize.getDialect();
    
    let dayExpression;
    if (dialect === 'postgres') {
      // PostgreSQL: EXTRACT(DOW FROM created_at) + 1 (to match MySQL 1-7 where 1=Sunday)
      dayExpression = Ticket.sequelize.literal(
        'EXTRACT(DOW FROM created_at) + 1'
      );
    } else {
      // MySQL: DAYOFWEEK(created_at) (returns 1-7 where 1=Sunday)
      dayExpression = Ticket.sequelize.fn('DAYOFWEEK', 
        Ticket.sequelize.col('created_at')
      );
    }

    const distribution = await Ticket.findAll({
      attributes: [
        [dayExpression, 'dayOfWeek'],
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']
      ],
      where: {
        assigned_to: adminId,
        ...(dateFilter || {})
      },
      group: [dayExpression],
      raw: true
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return distribution.map(d => {
      let dayIndex = parseInt(d.dayOfWeek) - 1;
      // Handle PostgreSQL DOW which goes 0-6 (we added 1, so now 1-7)
      if (dayIndex < 0) dayIndex = 6;
      if (dayIndex > 6) dayIndex = 0;
      
      return {
        day: dayNames[dayIndex],
        count: parseInt(d.count)
      };
    });
  }

  async getPerformanceComparison(adminId, dateFilter) {
    // Compare this admin to team averages
    const allAdmins = await this.getAllAdminsPerformance(dateFilter);
    const currentAdmin = allAdmins.admins.find(a => a.adminId === adminId);

    if (!currentAdmin) return null;

    const teamAvg = allAdmins.teamAverages;

    return {
      responseTime: {
        admin: parseFloat(currentAdmin.avgResponseHours),
        team: parseFloat(teamAvg.avgResponseHours),
        percentile: this.calculatePercentile(
          currentAdmin.avgResponseHours,
          allAdmins.admins.map(a => a.avgResponseHours),
          'lower' // Lower is better for response time
        )
      },
      resolutionTime: {
        admin: parseFloat(currentAdmin.avgResolutionHours),
        team: parseFloat(teamAvg.avgResolutionHours),
        percentile: this.calculatePercentile(
          currentAdmin.avgResolutionHours,
          allAdmins.admins.map(a => a.avgResolutionHours),
          'lower' // Lower is better for resolution time
        )
      },
      completionRate: {
        admin: parseFloat(currentAdmin.completionRate),
        team: parseFloat(teamAvg.completionRate),
        percentile: this.calculatePercentile(
          currentAdmin.completionRate,
          allAdmins.admins.map(a => a.completionRate),
          'higher' // Higher is better for completion rate
        )
      },
      qualityScore: {
        admin: currentAdmin.qualityScore,
        team: teamAvg.qualityScore,
        rank: allAdmins.admins.findIndex(a => a.adminId === adminId) + 1,
        totalAdmins: allAdmins.totalAdmins
      }
    };
  }

  async getWorkloadHistory(adminId, dateRange) {
    // Get workload trends over time
    const period = dateRange || 'month';
    const dateFilter = this.buildDateFilter(period);
    const dialect = Ticket.sequelize.getDialect();
    
    let dateExpression;
    if (dialect === 'postgres') {
      // PostgreSQL: DATE(created_at) or TO_CHAR for date formatting
      dateExpression = Ticket.sequelize.fn('DATE', 
        Ticket.sequelize.col('created_at')
      );
    } else {
      // MySQL: DATE(created_at)
      dateExpression = Ticket.sequelize.fn('DATE', 
        Ticket.sequelize.col('created_at')
      );
    }

    const history = await Ticket.findAll({
      attributes: [
        [dateExpression, 'date'],
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'tickets']
      ],
      where: {
        assigned_to: adminId,
        ...(dateFilter || {})
      },
      group: [dateExpression],
      order: [[dateExpression, 'ASC']],
      raw: true
    });

    return history.map(h => ({
      date: h.date,
      tickets: parseInt(h.tickets)
    }));
  }

  calculatePercentile(value, allValues, direction = 'higher') {
    const sorted = allValues.filter(v => v > 0).sort((a, b) => a - b);
    if (sorted.length === 0) return 50;

    const index = sorted.findIndex(v => 
      direction === 'higher' ? v >= value : v <= value
    );

    if (index === -1) return 100;

    return Math.round((index / sorted.length) * 100);
  }

  calculateTeamAverages(performanceData) {
    if (performanceData.length === 0) {
      return {
        avgResponseHours: 0,
        avgResolutionHours: 0,
        completionRate: 0,
        qualityScore: 0
      };
    }

    const sum = performanceData.reduce((acc, admin) => ({
      responseHours: acc.responseHours + parseFloat(admin.avgResponseHours || 0),
      resolutionHours: acc.resolutionHours + parseFloat(admin.avgResolutionHours || 0),
      completionRate: acc.completionRate + parseFloat(admin.completionRate || 0),
      qualityScore: acc.qualityScore + admin.qualityScore
    }), { responseHours: 0, resolutionHours: 0, completionRate: 0, qualityScore: 0 });

    const count = performanceData.length;

    return {
      avgResponseHours: (sum.responseHours / count).toFixed(2),
      avgResolutionHours: (sum.resolutionHours / count).toFixed(2),
      completionRate: (sum.completionRate / count).toFixed(2),
      qualityScore: Math.round(sum.qualityScore / count)
    };
  }

  formatTime(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  }
}

module.exports = new AdminPerformanceService();
