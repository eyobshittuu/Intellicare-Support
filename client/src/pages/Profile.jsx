import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { toast } from 'sonner';

const Profile = () => {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);

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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber,
      errors: {
        length: password.length < minLength,
        uppercase: !hasUpperCase,
        lowercase: !hasLowerCase,
        number: !hasNumber
      }
    };
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!passwordData.newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    const validation = validatePassword(passwordData.newPassword);
    if (!validation.isValid) {
      toast.error('Please meet all password requirements');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      toast.success('Password changed successfully!');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);
    } catch (error) {
      console.error('Password change error:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(passwordData.newPassword);

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

      {/* Change Password Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
          onClick={() => setShowChangePassword(!showChangePassword)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <Lock size={20} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
          </div>
          <div className={`transform transition-transform ${showChangePassword ? 'rotate-180' : ''}`}>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {showChangePassword && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <form onSubmit={handleSubmitPasswordChange} className="space-y-6 mt-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-12"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-12"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Requirements */}
                {passwordData.newPassword && (
                  <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 text-xs ${
                        !passwordValidation.errors.length ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <CheckCircle size={14} className={!passwordValidation.errors.length ? 'text-green-600' : 'text-gray-400'} />
                        At least 8 characters
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        !passwordValidation.errors.uppercase ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <CheckCircle size={14} className={!passwordValidation.errors.uppercase ? 'text-green-600' : 'text-gray-400'} />
                        At least one uppercase letter
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        !passwordValidation.errors.lowercase ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <CheckCircle size={14} className={!passwordValidation.errors.lowercase ? 'text-green-600' : 'text-gray-400'} />
                        At least one lowercase letter
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${
                        !passwordValidation.errors.number ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <CheckCircle size={14} className={!passwordValidation.errors.number ? 'text-green-600' : 'text-gray-400'} />
                        At least one number
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-12"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
                {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Passwords match
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || !passwordValidation.isValid || passwordData.newPassword !== passwordData.confirmPassword}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
