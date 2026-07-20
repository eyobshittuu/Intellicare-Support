import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import { Ticket, AlertCircle, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const data = await ticketService.getStats();
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total Tickets', value: stats.total, color: 'teal', icon: Ticket },
    { label: 'Pending', value: stats.pending, color: 'gray', icon: Clock },
    { label: 'In Progress', value: stats.in_progress, color: 'black', icon: AlertCircle },
    { label: 'Completed', value: stats.completed, color: 'teal', icon: CheckCircle },
    { label: 'Rejected', value: stats.rejected, color: 'gray', icon: XCircle },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.first_name}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? 'Admin Dashboard - Overview of all tickets' : 'Your personal dashboard'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {!isAdmin && (
            <Link
              to="/tickets/new"
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus size={20} />
              Create New Ticket
            </Link>
          )}
          <Link
            to="/tickets"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Ticket size={20} />
            View All Tickets
          </Link>
        </div>
      </div>

      {/* Statistics - Admin Only */}
      {isAdmin && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Statistics</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                const colorClasses = {
                  teal: 'bg-teal-600',
                  gray: 'bg-gray-600',
                  black: 'bg-gray-900',
                };

                return (
                  <div
                    key={stat.label}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`${colorClasses[stat.color]} p-3 rounded-lg`}>
                        <Icon className="text-white" size={24} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium text-gray-900">
              {user?.first_name} {user?.middle_name} {user?.last_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Role:</span>
            <span className="font-medium text-gray-900 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
