import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-teal-100 text-teal-800 border-teal-200',
      user: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      user: 'User'
    };
    return { color: badges[role] || badges.user, label: labels[role] || 'User' };
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">View and manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with gradient */}
        <div className="h-32 bg-gradient-to-r from-teal-500 to-teal-600"></div>
        
        {/* Profile Content */}
        <div className="px-6 pb-6">
          {/* Avatar and Name */}
          <div className="flex items-end -mt-16 mb-6">
            <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-6 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.first_name} {user?.middle_name} {user?.last_name}
              </h2>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>

          {/* Account Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User size={20} className="text-teal-600" />
                Personal Information
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">First Name</span>
                  <p className="font-medium text-gray-900 mt-1">{user?.first_name}</p>
                </div>
                
                {user?.middle_name && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Middle Name</span>
                    <p className="font-medium text-gray-900 mt-1">{user?.middle_name}</p>
                  </div>
                )}
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Last Name</span>
                  <p className="font-medium text-gray-900 mt-1">{user?.last_name}</p>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-teal-600" />
                Account Details
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Mail size={12} />
                    Email Address
                  </span>
                  <p className="font-medium text-gray-900 mt-1">{user?.email}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">User ID</span>
                  <p className="font-mono text-sm text-gray-900 mt-1">{user?.id}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Calendar size={12} />
                    Member Since
                  </span>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(user?.created_at)}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Account Status</span>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      user?.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.is_active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Future Feature Placeholder */}
      <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
        <p className="text-gray-600 text-sm">
          Password change functionality coming soon. Please contact your administrator if you need to change your password.
        </p>
      </div>
    </div>
  );
};

export default Profile;
