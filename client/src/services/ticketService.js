import api from './api';

export const ticketService = {
  async getTickets(params = {}) {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  async getTicket(id) {
    const response = await api.get(`/tickets/${id}`);
    return response.data.ticket;
  },

  async createTicket(data) {
    const response = await api.post('/tickets', data);
    return response.data;
  },

  async updateTicket(id, data) {
    const response = await api.put(`/tickets/${id}`, data);
    return response.data;
  },

  async deleteTicket(id) {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/tickets/stats');
    return response.data.stats;
  },

  async finalizeTicket(id, summary) {
    const response = await api.put(`/tickets/${id}/finalize`, { summary });
    return response.data;
  },
};
