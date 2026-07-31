import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import { Plus, Search, Filter, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Tickets = () => {
  const { isAdmin, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    ...(user?.role === 'admin' && { assigned_to: user?.id }) // Auto-filter for regular admins
  });

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTickets(filters);
      setTickets(data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      search: '',
      ...(user?.role === 'admin' && { assigned_to: user?.id }) // Keep assigned_to filter for regular admins
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-teal-100 text-teal-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Manage all support tickets' : 'View and manage your tickets'}
          </p>
        </div>
        {!isAdmin && (
          <Link
            to="/tickets/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={20} />
            New Ticket
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.status || filters.priority || filters.search) && (
          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Tickets List - Card View */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No tickets found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filters.status || filters.priority || filters.search
                ? 'Try adjusting your filters'
                : 'Create your first ticket to get started'}
            </p>
          </div>
        ) : (
          <>
            {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  {/* Left Section - Main Info */}
                  <div className="flex-1">
                    {/* Ticket Number & Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-teal-600">
                        {ticket.ticket_number}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {ticket.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{ticket.hospital}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                      {isAdmin && ticket.user && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>
                            {ticket.user 
                              ? `${ticket.user.first_name} ${ticket.user.last_name}` 
                              : 'Deleted User'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section - Action Button */}
                  <div className="ml-4">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Tickets Count */}
      {!loading && tickets.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default Tickets;
