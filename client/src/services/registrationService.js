import api from './api';

export const registrationService = {
  // Get pending registrations
  async getPendingRegistrations() {
    const response = await api.get('/registrations/pending');
    return response.data;
  },

  // Get all registrations with filters
  async getAllRegistrations(params = {}) {
    const response = await api.get('/registrations', { params });
    return response.data;
  },

  // Get registration statistics
  async getStats() {
    const response = await api.get('/registrations/stats');
    return response.data;
  },

  // Approve a registration
  async approveRegistration(userId) {
    const response = await api.put(`/registrations/${userId}/approve`);
    return response.data;
  },

  // Reject a registration
  async rejectRegistration(userId, reason) {
    const response = await api.put(`/registrations/${userId}/reject`, { reason });
    return response.data;
  },

  // Delete a registration
  async deleteRegistration(userId) {
    const response = await api.delete(`/registrations/${userId}`);
    return response.data;
  },
};
