import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">Name:</span>
            <p className="font-medium text-gray-900">
              {user?.first_name} {user?.middle_name} {user?.last_name}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Email:</span>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Role:</span>
            <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <p className="text-gray-600">
          Password change form will be available here.
        </p>
      </div>
    </div>
  );
};

export default Profile;
