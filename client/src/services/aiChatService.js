import api from './api';

export const aiChatService = {
  /**
   * Send a message to AI and get response
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Promise} AI response
   */
  async chat(messages) {
    try {
      const response = await api.post('/ai/chat', { messages });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get AI suggestion for a ticket
   * @param {Object} ticket - Ticket data (title, description, category)
   * @returns {Promise} AI suggestion
   */
  async getTicketSuggestion(ticket) {
    try {
      const response = await api.post('/ai/suggest', ticket);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
