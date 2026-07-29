import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import { 
  Ticket, AlertCircle, CheckCircle, Clock, XCircle, Plus, 
  Eye, User, Building2, ArrowRight, Loader2
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [inProgressTickets, setInProgressTickets] = useState([]);
  const [completedTickets, setCompletedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const statsData = await ticketService.getStats();
      setStats(statsData);

      // Fetch tickets by status
      const [pending, inProgress, completed] = await Promise.all([
        ticketService.getTickets({ status: 'pending', limit: 5 }),
        ticketService.getTickets({ status: 'in_progress', limit: 5 }),
        ticketService.getTickets({ status: 'completed', limit: 5 })
      ]);

      setPendingTickets(pending.tickets || []);
      setInProgressTickets(inProgress.tickets || []);
      setCompletedTickets(completed.tickets || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const TicketCard = ({ ticket }) => (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all cursor-pointer bg-white"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-teal-600 font-semibold">
              {ticket.ticket_number}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
          <h3 className="font-medium text-gray-900 line-clamp-1">
            {ticket.title}
          </h3>
        </div>
        <ArrowRight size={18} className="text-gray-400 flex-shrink-0 ml-2" />
      </div>
      
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <User size={12} />
          <span className="line-clamp-1">{ticket.user?.first_name} {ticket.user?.last_name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Building2 size={12} />
          <span className="line-clamp-1">{ticket.hospital}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{formatDate(ticket.created_at)}</span>
        </div>
      </div>
    </div>
  );

  const statCards = stats ? [
    { label: 'Total Tickets', value: stats.total, color: 'teal', icon: Ticket },
    { label: 'Pending', value: stats.pending, color: 'yellow', icon: Clock },
    { label: 'In Progress', value: stats.in_progress, color: 'blue', icon: AlertCircle },
    { label: 'Completed', value: stats.completed, color: 'green', icon: CheckCircle },
    { label: 'Rejected', value: stats.rejected, color: 'red', icon: XCircle },
  ] : [];

  if (loading && isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

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
      {isAdmin && stats && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Statistics</h2>
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                const colorClasses = {
                  teal: 'bg-teal-600',
                  yellow: 'bg-yellow-500',
                  blue: 'bg-blue-600',
                  green: 'bg-green-600',
                  red: 'bg-red-600',
                };

                return (
                  <div
                    key={stat.label}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
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

      {/* Ticket Lists - Admin Only */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Tickets */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-yellow-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Pending Tickets</h3>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  {stats?.pending || 0}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {pendingTickets.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">No pending tickets</p>
              ) : (
                pendingTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
              {pendingTickets.length > 0 && (
                <Link
                  to="/tickets?status=pending"
                  className="block text-center text-teal-600 hover:text-teal-700 text-sm font-medium py-2"
                >
                  View all pending →
                </Link>
              )}
            </div>
          </div>

          {/* In Progress Tickets */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-blue-600" size={20} />
                  <h3 className="font-semibold text-gray-900">In Progress</h3>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {stats?.in_progress || 0}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {inProgressTickets.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">No tickets in progress</p>
              ) : (
                inProgressTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
              {inProgressTickets.length > 0 && (
                <Link
                  to="/tickets?status=in_progress"
                  className="block text-center text-teal-600 hover:text-teal-700 text-sm font-medium py-2"
                >
                  View all in progress →
                </Link>
              )}
            </div>
          </div>

          {/* Completed Tickets */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Completed</h3>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  {stats?.completed || 0}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {completedTickets.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">No completed tickets</p>
              ) : (
                completedTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
              {completedTickets.length > 0 && (
                <Link
                  to="/tickets?status=completed"
                  className="block text-center text-teal-600 hover:text-teal-700 text-sm font-medium py-2"
                >
                  View all completed →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
