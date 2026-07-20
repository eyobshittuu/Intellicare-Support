import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { ticketService } from '../../services/ticketService';
import { UserPlus, Search, Loader2, Shield, User as UserIcon, Crown, Trash2, Ticket, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const Users = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchTicketStats();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers(filters);
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketStats = async () => {
    try {
      setStatsLoading(true);
      const data = await ticketService.getStats();
      setTicketStats(data);
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(userId);
      await userService.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(null);
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
      role: '',
      search: ''
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="text-yellow-500" size={18} />;
      case 'admin':
        return <Shield className="text-teal-600" size={18} />;
      default:
        return <UserIcon className="text-gray-500" size={18} />;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      admin: 'bg-teal-100 text-teal-800 border-teal-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      user: 'User'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${badges[role]}`}>
        {getRoleIcon(role)}
        {labels[role]}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statCards = ticketStats ? [
    { label: 'Total Tickets', value: ticketStats.total, color: 'teal', icon: Ticket },
    { label: 'Pending', value: ticketStats.pending, color: 'gray', icon: Clock },
    { label: 'In Progress', value: ticketStats.in_progress, color: 'black', icon: AlertCircle },
    { label: 'Completed', value: ticketStats.completed, color: 'teal', icon: CheckCircle },
    { label: 'Rejected', value: ticketStats.rejected, color: 'gray', icon: XCircle },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        {isSuperAdmin && (
          <Link
            to="/users/create-admin"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlus size={20} />
            Create Admin
          </Link>
        )}
      </div>

      {/* Ticket Statistics */}
      {isSuperAdmin && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Statistics</h2>
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.role || filters.search) && (
          <button
            onClick={clearFilters}
            className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No users found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filters.role || filters.search
                ? 'Try adjusting your filters'
                : 'No users in the system'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-teal-600 font-semibold">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.middle_name} {user.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                          disabled={deleteLoading === user.id}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete user"
                        >
                          {deleteLoading === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Count */}
      {!loading && users.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Info Box for Super Admin */}
      {isSuperAdmin && !loading && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <p className="text-sm text-teal-900">
            <strong>Super Admin Access:</strong> You can create new admin users using the "Create Admin" button above.
            Admins can manage all tickets and finalize them with summaries.
          </p>
        </div>
      )}
    </div>
  );
};

export default Users;
