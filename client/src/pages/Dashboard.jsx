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
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && stats) {
      fetchTicketsByStatus(activeTab);
    }
  }, [activeTab, isAdmin]);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const statsData = await ticketService.getStats();
      setStats(statsData);

      // Fetch initial tickets (pending)
      const ticketsData = await ticketService.getTickets({ status: 'pending', limit: 10 });
      setTickets(ticketsData.tickets || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketsByStatus = async (status) => {
    try {
      setLoading(true);
      const ticketsData = await ticketService.getTickets({ status, limit: 10 });
      setTickets(ticketsData.tickets || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
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
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'pending'
                      ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Clock size={18} />
                  Pending Tickets
                  {stats?.pending > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === 'pending' 
                        ? 'bg-yellow-200 text-yellow-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stats.pending}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('in_progress')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'in_progress'
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <AlertCircle size={18} />
                  In Progress
                  {stats?.in_progress > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === 'in_progress' 
                        ? 'bg-blue-200 text-blue-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stats.in_progress}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'completed'
                      ? 'border-green-500 text-green-700 bg-green-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle size={18} />
                  Completed
                  {stats?.completed > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === 'completed' 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stats.completed}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'rejected'
                      ? 'border-red-500 text-red-700 bg-red-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <XCircle size={18} />
                  Rejected
                  {stats?.rejected > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === 'rejected' 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stats.rejected}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Ticket List */}
          <div className="bg-white rounded-lg shadow p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {error}
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Ticket className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500">No {activeTab.replace('_', ' ')} tickets</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
                
                {tickets.length >= 10 && (
                  <div className="mt-6 text-center">
                    <Link
                      to={`/tickets?status=${activeTab}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                      View All {activeTab.replace('_', ' ').charAt(0).toUpperCase() + activeTab.replace('_', ' ').slice(1)} Tickets
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
