import api from './api';

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getUser(id) {
    const response = await api.get(`/users/${id}`);
    return response.data.user;
  },

  async updateUser(id, data) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async getUserStats() {
    const response = await api.get('/users/stats');
    return response.data.stats;
  },

  async createAdmin(data) {
    const response = await api.post('/users/create-admin', data);
    return response.data;
  },
};
