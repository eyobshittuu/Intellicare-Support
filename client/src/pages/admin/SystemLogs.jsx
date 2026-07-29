import { useState, useEffect } from 'react';
import { 
  RefreshCw, Download, Trash2, Search, Filter, 
  AlertCircle, Info, AlertTriangle, Activity, Database, User, Ticket, Building2, ChevronDown, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    type: 'combined',
    level: '',
    search: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });
  const [expandedRows, setExpandedRows] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/logs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDownload = async (type) => {
    try {
      const response = await api.get(`/logs/download/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.log`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Log file downloaded');
    } catch (error) {
      console.error('Error downloading logs:', error);
      toast.error('Failed to download logs');
    }
  };

  const handleClearLogs = async (type) => {
    if (!window.confirm(`Are you sure you want to clear all ${type} logs? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/logs/${type}`);
      toast.success(`${type} logs cleared`);
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear logs');
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      error: 'bg-red-100 text-red-800 border-red-200',
      warn: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      http: 'bg-purple-100 text-purple-800 border-purple-200',
      debug: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getLevelIcon = (level) => {
    const icons = {
      error: <AlertCircle size={16} className="text-red-600" />,
      warn: <AlertTriangle size={16} className="text-yellow-600" />,
      info: <Info size={16} className="text-blue-600" />,
      http: <Activity size={16} className="text-purple-600" />,
      debug: <Database size={16} className="text-gray-600" />
    };
    return icons[level] || <Info size={16} />;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const toggleRowExpand = (index) => {
    setExpandedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const isRowExpanded = (index) => expandedRows.includes(index);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
        <p className="text-gray-600 mt-1">Monitor and analyze system activity</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.total}</p>
              </div>
              <Activity className="text-teal-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.stats.error}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.stats.warn}</p>
              </div>
              <AlertTriangle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Combined Log Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatBytes(stats.fileSizes['combined.log'])}
                </p>
              </div>
              <Database className="text-gray-600" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Log Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="combined">Combined</option>
              <option value="error">Errors Only</option>
              <option value="access">Access Logs</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value, page: 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="http">HTTP</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actions
            </label>
            <div className="flex gap-2">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => handleDownload(filters.type)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => handleClearLogs(filters.type)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Service
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <>
                    <tr 
                      key={index} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRowExpand(index)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {isRowExpanded(index) ? (
                            <ChevronDown size={16} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400" />
                          )}
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(log.level)}`}>
                          {getLevelIcon(log.level)}
                          {log.level?.toUpperCase() || 'INFO'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            {/* Main Message */}
                            <div className="text-sm font-medium text-gray-900">
                              {log.message}
                            </div>
                            
                            {/* Action Badge */}
                            {log.action && (
                              <div>
                                <span className="inline-block px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                                  {log.action}
                                </span>
                              </div>
                            )}
                            
                            {/* Quick Info Preview */}
                            {!isRowExpanded(index) && (
                              <div className="text-xs text-gray-500 flex items-center gap-3">
                                {log.email && (
                                  <span className="flex items-center gap-1">
                                    <User size={12} />
                                    {log.email}
                                  </span>
                                )}
                                {log.ticketNumber && (
                                  <span className="flex items-center gap-1">
                                    <Ticket size={12} />
                                    {log.ticketNumber}
                                  </span>
                                )}
                                {log.ip && (
                                  <span>IP: {log.ip}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <ChevronRight 
                            size={20} 
                            className={`text-gray-400 transition-transform ${isRowExpanded(index) ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.service || 'N/A'}
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isRowExpanded(index) && (
                      <tr key={`${index}-details`} className="bg-gray-50">
                        <td colSpan="4" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* User Info */}
                            {log.userId && (
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <User size={20} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 mb-1">User Information</div>
                                  <div className="space-y-1 text-xs">
                                    <div className="text-gray-600">ID: <span className="font-mono">{log.userId}</span></div>
                                    {log.email && (
                                      <div className="text-gray-900 font-medium">{log.email}</div>
                                    )}
                                    {log.name && (
                                      <div className="text-gray-700">{log.name}</div>
                                    )}
                                    {log.role && (
                                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                        {log.role.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Admin Info */}
                            {log.adminId && (
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-teal-200">
                                <div className="p-2 bg-teal-100 rounded-lg">
                                  <User size={20} className="text-teal-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 mb-1">Admin</div>
                                  <div className="space-y-1 text-xs">
                                    <div className="text-gray-600">ID: <span className="font-mono">{log.adminId}</span></div>
                                    {log.adminName && (
                                      <div className="text-teal-700 font-medium">{log.adminName}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Ticket Info */}
                            {log.ticketId && (
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Ticket size={20} className="text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 mb-1">Ticket Details</div>
                                  <div className="space-y-1 text-xs">
                                    {log.ticketNumber && (
                                      <div className="text-purple-700 font-bold">{log.ticketNumber}</div>
                                    )}
                                    {log.title && (
                                      <div className="text-gray-700">{log.title}</div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      {log.category && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                          {log.category}
                                        </span>
                                      )}
                                      {log.priority && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          log.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                          log.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                          log.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {log.priority.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Hospital */}
                            {log.hospital && (
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <Building2 size={20} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 mb-1">Hospital</div>
                                  <div className="text-gray-900 text-xs">{log.hospital}</div>
                                </div>
                              </div>
                            )}
                            
                            {/* IP Address */}
                            {log.ip && (
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                  <Activity size={20} className="text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 mb-1">IP Address</div>
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{log.ip}</code>
                                </div>
                              </div>
                            )}
                            
                            {/* Target User */}
                            {log.targetUserId && (
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-indigo-200">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                  <User size={20} className="text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 mb-1">Target User</div>
                                  <div className="space-y-1 text-xs">
                                    <div className="text-gray-600">ID: <span className="font-mono">{log.targetUserId}</span></div>
                                    {log.targetUserEmail && (
                                      <div className="text-gray-900">{log.targetUserEmail}</div>
                                    )}
                                    {log.targetUserName && (
                                      <div className="text-gray-700 font-medium">{log.targetUserName}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Created/Updated By */}
                            {(log.createdBy || log.updatedBy) && (
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <User size={20} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 mb-1">
                                    {log.createdBy ? 'Created By' : 'Updated By'}
                                  </div>
                                  <div className="text-xs">
                                    {log.createdByName || log.updatedByName}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Additional Info */}
                            {(log.hasAttachments || log.previousStatus || log.newStatus) && (
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <Info size={20} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 mb-1">Additional Details</div>
                                  <div className="space-y-1 text-xs text-gray-600">
                                    {log.hasAttachments !== undefined && log.hasAttachments > 0 && (
                                      <div>📎 {log.hasAttachments} attachment(s)</div>
                                    )}
                                    {log.previousStatus && log.newStatus && (
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-gray-100 rounded">{log.previousStatus}</span>
                                        <span>→</span>
                                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded">{log.newStatus}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Changes Object */}
                            {log.changes && Object.keys(log.changes).length > 0 && (
                              <div className="col-span-2 p-3 bg-white rounded-lg border border-gray-200">
                                <div className="font-medium text-gray-700 mb-2">Changes Made</div>
                                <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
