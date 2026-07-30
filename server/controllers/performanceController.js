const adminPerformanceService = require('../services/adminPerformanceService');
const logger = require('../config/logger');

// @desc    Get performance metrics for a specific admin
// @route   GET /api/performance/admin/:adminId
// @access  Private (Super Admin only)
exports.getAdminPerformance = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { period } = req.query; // today, week, month, quarter, year, or null for all time

    const performance = await adminPerformanceService.getAdminPerformance(adminId, period);

    logger.info('Admin performance retrieved', {
      adminId,
      period: period || 'all_time',
      requestedBy: req.user.id,
      action: 'VIEW_ADMIN_PERFORMANCE'
    });

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Get admin performance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching admin performance',
      error: error.message
    });
  }
};

// @desc    Get performance comparison for all admins
// @route   GET /api/performance/admins
// @access  Private (Super Admin only)
exports.getAllAdminsPerformance = async (req, res) => {
  try {
    const { period } = req.query; // today, week, month, quarter, year, or null for all time

    const performance = await adminPerformanceService.getAllAdminsPerformance(period);

    logger.info('All admins performance retrieved', {
      period: period || 'all_time',
      totalAdmins: performance.totalAdmins,
      requestedBy: req.user.id,
      action: 'VIEW_ALL_ADMINS_PERFORMANCE'
    });

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Get all admins performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admins performance',
      error: error.message
    });
  }
};

// @desc    Get detailed performance report for an admin
// @route   GET /api/performance/admin/:adminId/detailed
// @access  Private (Super Admin only)
exports.getDetailedReport = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { period } = req.query;

    const report = await adminPerformanceService.getDetailedReport(adminId, period);

    logger.info('Detailed performance report generated', {
      adminId,
      period: period || 'all_time',
      requestedBy: req.user.id,
      action: 'GENERATE_DETAILED_REPORT'
    });

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Get detailed report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating detailed report',
      error: error.message
    });
  }
};

// @desc    Get performance dashboard summary
// @route   GET /api/performance/dashboard
// @access  Private (Super Admin only)
exports.getDashboardSummary = async (req, res) => {
  try {
    const { period } = req.query;

    const allAdminsPerformance = await adminPerformanceService.getAllAdminsPerformance(period);

    // Calculate additional dashboard metrics
    const topPerformers = allAdminsPerformance.admins.slice(0, 5);
    const needsImprovement = allAdminsPerformance.admins
      .filter(a => a.qualityScore < 60)
      .sort((a, b) => a.qualityScore - b.qualityScore);

    const summary = {
      period: period || 'all_time',
      totalAdmins: allAdminsPerformance.totalAdmins,
      teamAverages: allAdminsPerformance.teamAverages,
      topPerformer: allAdminsPerformance.topPerformer,
      topPerformers,
      needsImprovement,
      gradeDistribution: this.calculateGradeDistribution(allAdminsPerformance.admins),
      insights: this.generateInsights(allAdminsPerformance)
    };

    logger.info('Performance dashboard accessed', {
      period: period || 'all_time',
      requestedBy: req.user.id,
      action: 'VIEW_PERFORMANCE_DASHBOARD'
    });

    res.json({
      success: true,
      dashboard: summary
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};

// @desc    Export performance report
// @route   GET /api/performance/export
// @access  Private (Super Admin only)
exports.exportPerformanceReport = async (req, res) => {
  try {
    const { period, format } = req.query; // format: json or csv

    const performance = await adminPerformanceService.getAllAdminsPerformance(period);

    if (format === 'csv') {
      // Convert to CSV format
      const csv = this.convertToCSV(performance.admins);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=admin-performance-${period || 'all'}.csv`);
      res.send(csv);
    } else {
      // JSON format (default)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=admin-performance-${period || 'all'}.json`);
      res.json({
        success: true,
        exportDate: new Date(),
        period: period || 'all_time',
        data: performance
      });
    }

    logger.info('Performance report exported', {
      period: period || 'all_time',
      format: format || 'json',
      requestedBy: req.user.id,
      action: 'EXPORT_PERFORMANCE_REPORT'
    });
  } catch (error) {
    console.error('Export performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting performance report',
      error: error.message
    });
  }
};

// Helper methods
exports.calculateGradeDistribution = (admins) => {
  const distribution = {
    'A+': 0, 'A': 0, 'A-': 0,
    'B+': 0, 'B': 0, 'B-': 0,
    'C+': 0, 'C': 0, 'C-': 0,
    'D+': 0, 'D': 0, 'F': 0
  };

  admins.forEach(admin => {
    if (distribution[admin.performanceGrade] !== undefined) {
      distribution[admin.performanceGrade]++;
    }
  });

  return distribution;
};

exports.generateInsights = (performance) => {
  const insights = [];
  const admins = performance.admins;
  const teamAvg = performance.teamAverages;

  // Insight 1: Top performer
  if (performance.topPerformer) {
    insights.push({
      type: 'positive',
      title: 'Top Performer',
      message: `${performance.topPerformer.adminName} leads the team with a quality score of ${performance.topPerformer.qualityScore}/100`
    });
  }

  // Insight 2: Response time
  const fastResponders = admins.filter(a => 
    parseFloat(a.avgResponseHours) < parseFloat(teamAvg.avgResponseHours) * 0.8
  );
  if (fastResponders.length > 0) {
    insights.push({
      type: 'positive',
      title: 'Fast Responders',
      message: `${fastResponders.length} admin(s) respond 20% faster than team average`
    });
  }

  // Insight 3: Completion rate
  const highCompleters = admins.filter(a => 
    parseFloat(a.completionRate) > 85
  );
  if (highCompleters.length > 0) {
    insights.push({
      type: 'positive',
      title: 'High Completion Rate',
      message: `${highCompleters.length} admin(s) maintain >85% completion rate`
    });
  }

  // Insight 4: Areas of concern
  const needsAttention = admins.filter(a => a.qualityScore < 60);
  if (needsAttention.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Needs Attention',
      message: `${needsAttention.length} admin(s) scoring below 60/100 may need support`
    });
  }

  // Insight 5: Workload balance
  const overworked = admins.filter(a => a.activeTickets > parseInt(teamAvg.completionRate) * 1.5);
  if (overworked.length > 0) {
    insights.push({
      type: 'info',
      title: 'Workload Imbalance',
      message: `${overworked.length} admin(s) handling significantly more active tickets`
    });
  }

  return insights;
};

exports.convertToCSV = (admins) => {
  const headers = [
    'Admin Name',
    'Email',
    'Total Tickets',
    'Active Tickets',
    'Completed Tickets',
    'Completion Rate (%)',
    'Avg Response Time (hours)',
    'Avg Resolution Time (hours)',
    'Quality Score',
    'Grade'
  ];

  const rows = admins.map(admin => [
    admin.adminName,
    admin.email,
    admin.totalTickets,
    admin.activeTickets,
    admin.completedTickets,
    admin.completionRate,
    admin.avgResponseHours,
    admin.avgResolutionHours,
    admin.qualityScore,
    admin.performanceGrade
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};
