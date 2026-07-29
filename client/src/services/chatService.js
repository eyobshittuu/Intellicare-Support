import api from './api';

// Get all users (for initial list)
export const getAllUsers = async () => {
  const response = await api.get('/chat/users');
  return response.data;
};

// Get all conversations
export const getConversations = async () => {
  const response = await api.get('/chat/conversations');
  return response.data;
};

// Get messages with a specific user
export const getMessages = async (otherUserId) => {
  const response = await api.get(`/chat/messages/${otherUserId}`);
  return response.data;
};

// Send a message (REST API)
export const sendMessage = async (recipientId, content) => {
  const response = await api.post('/chat/messages', {
    recipient_id: recipientId,
    content
  });
  return response.data;
};

// Mark messages as read
export const markAsRead = async (senderId) => {
  const response = await api.put(`/chat/messages/read/${senderId}`);
  return response.data;
};

// Search users
export const searchUsers = async (query) => {
  const response = await api.get('/chat/users/search', {
    params: { query }
  });
  return response.data;
};

// Get unread message count
export const getUnreadCount = async () => {
  const response = await api.get('/chat/unread-count');
  return response.data;
};
