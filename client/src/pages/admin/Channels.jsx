import { useState, useEffect } from 'react';
import { Hash, Plus, Edit2, Trash2, Users as UsersIcon, UserPlus, Settings, X, Loader2, Archive, Lock, Globe } from 'lucide-react';
import { getUserChannels, createChannel, updateChannel, deleteChannel, addChannelMembers, removeChannelMember, getChannelMembers } from '../../services/channelService';
import { userService } from '../../services/userService';
import { toast } from 'sonner';

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelMembers, setChannelMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel_type: 'private',
    member_ids: []
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadChannels();
    loadAdmins();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await getUserChannels();
      if (response.success) {
        setChannels(response.data.map(item => item.channel));
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await userService.getUsers({ limit: 1000 });
      if (response.success && response.users) {
        const adminUsers = response.users.filter(u => 
          u.role === 'admin' || u.role === 'super_admin'
        );
        setAdmins(adminUsers);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const loadChannelMembers = async (channelId) => {
    try {
      const response = await getChannelMembers(channelId);
      if (response.success) {
        setChannelMembers(response.data);
      }
    } catch (error) {
      console.error('Error loading channel members:', error);
      toast.error('Failed to load channel members');
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Channel name is required');
      return;
    }

    setActionLoading(true);
    try {
      const response = await createChannel(formData);
      if (response.success) {
        toast.success('Channel created successfully!');
        setShowCreateModal(false);
        setFormData({ name: '', description: '', channel_type: 'private', member_ids: [] });
        loadChannels();
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error(error.response?.data?.message || 'Failed to create channel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateChannel = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Channel name is required');
      return;
    }

    setActionLoading(true);
    try {
      const response = await updateChannel(selectedChannel.id, {
        name: formData.name,
        description: formData.description,
        channel_type: formData.channel_type
      });
      if (response.success) {
        toast.success('Channel updated successfully!');
        setShowEditModal(false);
        setSelectedChannel(null);
        loadChannels();
      }
    } catch (error) {
      console.error('Error updating channel:', error);
      toast.error(error.response?.data?.message || 'Failed to update channel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChannel = async () => {
    setActionLoading(true);
    try {
      const response = await deleteChannel(selectedChannel.id);
      if (response.success) {
        toast.success('Channel deleted successfully!');
        setShowDeleteModal(false);
        setSelectedChannel(null);
        loadChannels();
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast.error(error.response?.data?.message || 'Failed to delete channel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMembers = async (memberIds) => {
    if (memberIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setActionLoading(true);
    try {
      const response = await addChannelMembers(selectedChannel.id, memberIds);
      if (response.success) {
        toast.success(`Added ${memberIds.length} member(s) successfully!`);
        loadChannelMembers(selectedChannel.id);
      }
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error(error.response?.data?.message || 'Failed to add members');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setActionLoading(true);
    try {
      const response = await removeChannelMember(selectedChannel.id, memberId);
      if (response.success) {
        toast.success('Member removed successfully!');
        loadChannelMembers(selectedChannel.id);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (channel) => {
    setSelectedChannel(channel);
    setFormData({
      name: channel.name,
      description: channel.description || '',
      channel_type: channel.channel_type,
      member_ids: []
    });
    setShowEditModal(true);
  };

  const openMembersModal = (channel) => {
    setSelectedChannel(channel);
    loadChannelMembers(channel.id);
    setShowMembersModal(true);
  };

  const openDeleteModal = (channel) => {
    setSelectedChannel(channel);
    setShowDeleteModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Channel Management</h1>
          <p className="text-gray-600 mt-1">Create and manage chat channels</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', description: '', channel_type: 'private', member_ids: [] });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} />
          Create Channel
        </button>
      </div>

      {/* Channels List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : channels.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Hash className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No channels yet</h3>
          <p className="text-gray-500 mb-6">Create your first channel to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={20} />
            Create Channel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map(channel => (
            <div key={channel.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Channel Header */}
              <div 
                className="h-24 flex items-center justify-center"
                style={{ backgroundColor: channel.avatar_color }}
              >
                <Hash className="w-12 h-12 text-white" />
              </div>

              {/* Channel Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {channel.name}
                    {channel.channel_type === 'private' ? (
                      <Lock size={16} className="text-gray-400" />
                    ) : (
                      <Globe size={16} className="text-gray-400" />
                    )}
                  </h3>
                </div>
                
                {channel.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{channel.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <UsersIcon size={16} />
                  <span>{channel.member_count || 0} members</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{channel.channel_type}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openMembersModal(channel)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Manage Members"
                  >
                    <UserPlus size={16} />
                    Members
                  </button>
                  <button
                    onClick={() => openEditModal(channel)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
                    title="Edit Channel"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(channel)}
                    className="flex items-center justify-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete Channel"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => !actionLoading && setShowCreateModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Channel</h2>
                <button
                  onClick={() => !actionLoading && setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={actionLoading}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
              {/* Channel Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., general, announcements"
                  required
                  disabled={actionLoading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="What's this channel about?"
                  disabled={actionLoading}
                />
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Type
                </label>
                <select
                  name="channel_type"
                  value={formData.channel_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={actionLoading}
                >
                  <option value="private">Private (Invite only)</option>
                  <option value="public">Public (All admins can see)</option>
                </select>
              </div>

              {/* Add Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Members
                </label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {admins.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500 text-center">No admins available</p>
                  ) : (
                    admins.map(admin => (
                      <label key={admin.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.member_ids.includes(admin.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                member_ids: [...prev.member_ids, admin.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                member_ids: prev.member_ids.filter(id => id !== admin.id)
                              }));
                            }
                          }}
                          className="mr-2"
                          disabled={actionLoading}
                        />
                        <span className="text-sm">{admin.first_name} {admin.last_name}</span>
                        {admin.username && (
                          <span className="text-xs text-gray-500 ml-2">@{admin.username}</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !formData.name.trim()}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Channel'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Channel Modal - Similar structure to Create */}
      {showEditModal && selectedChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => !actionLoading && setShowEditModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Channel</h2>
                <button
                  onClick={() => !actionLoading && setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={actionLoading}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateChannel} className="p-6 space-y-4">
              {/* Channel Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                  disabled={actionLoading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={actionLoading}
                />
              </div>

              {/* Channel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Type
                </label>
                <select
                  name="channel_type"
                  value={formData.channel_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={actionLoading}
                >
                  <option value="private">Private (Invite only)</option>
                  <option value="public">Public (All admins can see)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !formData.name.trim()}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Channel'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal - Will implement next */}
      {showMembersModal && selectedChannel && (
        <MembersModal
          channel={selectedChannel}
          members={channelMembers}
          admins={admins}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedChannel(null);
          }}
          onAddMembers={handleAddMembers}
          onRemoveMember={handleRemoveMember}
          loading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => !actionLoading && setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Channel</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-semibold">#{selectedChannel.name}</span>? 
                All messages and data will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteChannel}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Channel'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Members Modal Component
const MembersModal = ({ channel, members, admins, onClose, onAddMembers, onRemoveMember, loading }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const currentMemberIds = members.map(m => m.user_id);
  const availableAdmins = admins.filter(a => !currentMemberIds.includes(a.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Channel Members</h2>
              <p className="text-sm text-gray-600">#{channel.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add Members Section */}
          {!showAddMembers ? (
            <button
              onClick={() => setShowAddMembers(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-teal-500 hover:text-teal-600 transition-colors"
            >
              <UserPlus size={20} />
              Add Members
            </button>
          ) : (
            <div className="mb-6 border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Select Members to Add</h3>
              <div className="max-h-48 overflow-y-auto mb-4">
                {availableAdmins.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">All admins are already members</p>
                ) : (
                  availableAdmins.map(admin => (
                    <label key={admin.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(admin.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers(prev => [...prev, admin.id]);
                          } else {
                            setSelectedMembers(prev => prev.filter(id => id !== admin.id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{admin.first_name} {admin.last_name}</p>
                        {admin.username && <p className="text-xs text-gray-500">@{admin.username}</p>}
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddMembers(false);
                    setSelectedMembers([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onAddMembers(selectedMembers);
                    setShowAddMembers(false);
                    setSelectedMembers([]);
                  }}
                  disabled={selectedMembers.length === 0 || loading}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  Add {selectedMembers.length > 0 && `(${selectedMembers.length})`}
                </button>
              </div>
            </div>
          )}

          {/* Current Members List */}
          <h3 className="font-semibold text-gray-900 mb-3">Current Members ({members.length})</h3>
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
                    {member.user?.first_name?.[0]}{member.user?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user?.first_name} {member.user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.user?.username && `@${member.user.username} • `}
                      <span className="capitalize">{member.role}</span>
                    </p>
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => onRemoveMember(member.user_id)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Channels;
