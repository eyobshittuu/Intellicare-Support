import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Users as UsersIcon,
  BarChart3,
  Timer,
  Target,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [allAdmins, setAllAdmins] = useState([]);
  const [period, setPeriod] = useState('month');
  const [expandedAdmin, setExpandedAdmin] = useState(null);
  const [detailedReport, setDetailedReport] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashboardRes, adminsRes] = await Promise.all([
        api.get(`/performance/dashboard?period=${period}`),
        api.get(`/performance/admins?period=${period}`)
      ]);
      setDashboard(dashboardRes.data.dashboard);
      setAllAdmins(adminsRes.data.data.admins);
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedReport = async (adminId) => {
    if (expandedAdmin === adminId) {
      setExpandedAdmin(null);
      setDetailedReport(null);
      return;
    }

    setLoadingDetail(true);
    setExpandedAdmin(adminId);
    try {
      const response = await api.get(`/performance/admin/${adminId}/detailed?period=${period}`);
      setDetailedReport(response.data.report);
    } catch (error) {
      console.error('Error loading detailed report:', error);
      toast.error('Failed to load detailed report');
      setExpandedAdmin(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const exportReport = async (format = 'json') => {
    try {
      const response = await api.get(`/performance/export?period=${period}&format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `admin-performance-${period}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `admin-performance-${period}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      toast.success(`Report exported successfully`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-700 bg-green-100 border-green-200';
    if (grade.startsWith('B')) return 'text-blue-700 bg-blue-100 border-blue-200';
    if (grade.startsWith('C')) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    if (grade.startsWith('D')) return 'text-orange-700 bg-orange-100 border-orange-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return <CheckCircle className="text-green-600" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-600" size={20} />;
      default: return <BarChart3 className="text-blue-600" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Performance Evaluation</h1>
          <p className="text-gray-600 mt-1">Track and analyze admin performance metrics</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last Year</option>
            <option value="">All Time</option>
          </select>

          {/* Export Buttons */}
          <button
            onClick={() => exportReport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            CSV
          </button>
          <button
            onClick={() => exportReport('json')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            JSON
          </button>

          {/* Refresh */}
          <button
            onClick={loadDashboard}
            className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Admins */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Admins</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard?.totalAdmins || 0}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <UsersIcon className="text-teal-600" size={24} />
            </div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {parseFloat(dashboard?.teamAverages?.avgResponseHours || 0).toFixed(1)}h
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Timer className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {parseFloat(dashboard?.teamAverages?.avgResolutionHours || 0).toFixed(1)}h
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Avg Quality Score */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Team Quality Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {dashboard?.teamAverages?.qualityScore || 0}/100
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Performer & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performer */}
        {dashboard?.topPerformer && (
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Award size={32} />
              <h2 className="text-2xl font-bold">Top Performer</h2>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-lg font-semibold">{dashboard.topPerformer.adminName}</p>
              <p className="text-teal-100 text-sm mb-3">{dashboard.topPerformer.email}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-teal-100">Quality Score</p>
                  <p className="text-3xl font-bold">{dashboard.topPerformer.qualityScore}/100</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-teal-100">Grade</p>
                  <p className="text-3xl font-bold">{dashboard.topPerformer.performanceGrade}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-teal-600" />
            Key Insights
          </h2>
          <div className="space-y-3">
            {dashboard?.insights?.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
                  <p className="text-gray-600 text-sm">{insight.message}</p>
                </div>
              </div>
            ))}
            {(!dashboard?.insights || dashboard.insights.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No insights available</p>
            )}
          </div>
        </div>
      </div>

      {/* Admin Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Admin Performance Rankings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allAdmins.map((admin, index) => (
                <>
                  <tr key={admin.adminId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{admin.adminName}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getGradeColor(admin.performanceGrade)}`}>
                        {admin.performanceGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-gray-900">{admin.qualityScore}/100</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{admin.totalTickets}</div>
                      <div className="text-xs text-gray-500">({admin.activeTickets} active)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">{admin.completionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{parseFloat(admin.avgResponseHours || 0).toFixed(1)}h</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{parseFloat(admin.avgResolutionHours || 0).toFixed(1)}h</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => loadDetailedReport(admin.adminId)}
                        className="text-teal-600 hover:text-teal-900 font-medium text-sm flex items-center gap-1 mx-auto"
                      >
                        <Eye size={16} />
                        {expandedAdmin === admin.adminId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>
                  {expandedAdmin === admin.adminId && (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 bg-gray-50">
                        {loadingDetail ? (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                          </div>
                        ) : detailedReport && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Performance Report</h3>
                            
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Priority Breakdown */}
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-3">Priority Distribution</h4>
                                <div className="space-y-2">
                                  {detailedReport.priorityBreakdown?.map(p => (
                                    <div key={p.priority} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600 capitalize">{p.priority}</span>
                                      <span className="font-medium text-gray-900">{p.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Status Breakdown */}
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-3">Status Distribution</h4>
                                <div className="space-y-2">
                                  {detailedReport.statusBreakdown?.map(s => (
                                    <div key={s.status} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600 capitalize">{s.status.replace('_', ' ')}</span>
                                      <span className="font-medium text-gray-900">{s.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Top Categories */}
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-3">Top Categories</h4>
                                <div className="space-y-2">
                                  {detailedReport.categoryBreakdown?.slice(0, 5).map(c => (
                                    <div key={c.category} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600 truncate">{c.category || 'N/A'}</span>
                                      <span className="font-medium text-gray-900">{c.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Recent Tickets */}
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h4 className="font-semibold text-gray-900 mb-3">Recent Tickets</h4>
                              <div className="space-y-2">
                                {detailedReport.recentTickets?.map(ticket => (
                                  <div key={ticket.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-900">{ticket.ticketNumber}</span>
                                      <span className="text-gray-600 ml-2">{ticket.title}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {ticket.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {allAdmins.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No admin performance data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;
