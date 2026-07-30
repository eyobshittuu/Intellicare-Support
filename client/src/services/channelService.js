import api from './api';

// Create a new channel
export const createChannel = async (channelData) => {
  const response = await api.post('/channels', channelData);
  return response.data;
};

// Get all user's channels
export const getUserChannels = async () => {
  const response = await api.get('/channels');
  return response.data;
};

// Get channel by ID
export const getChannel = async (channelId) => {
  const response = await api.get(`/channels/${channelId}`);
  return response.data;
};

// Get channel messages
export const getChannelMessages = async (channelId) => {
  const response = await api.get(`/channels/${channelId}/messages`);
  return response.data;
};

// Update channel
export const updateChannel = async (channelId, updates) => {
  const response = await api.put(`/channels/${channelId}`, updates);
  return response.data;
};

// Add members to channel
export const addChannelMembers = async (channelId, memberIds) => {
  const response = await api.post(`/channels/${channelId}/members`, { member_ids: memberIds });
  return response.data;
};

// Remove member from channel
export const removeChannelMember = async (channelId, memberId) => {
  const response = await api.delete(`/channels/${channelId}/members/${memberId}`);
  return response.data;
};

// Archive channel
export const archiveChannel = async (channelId) => {
  const response = await api.delete(`/channels/${channelId}/archive`);
  return response.data;
};
