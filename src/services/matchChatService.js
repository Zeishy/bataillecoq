import api from '../api/axios';

export const matchChatService = {
  // Get all messages for a match
  getMatchMessages: async (matchId) => {
    const response = await api.get(`/messages/matches/${matchId}/messages`);
    return response.data.messages || [];
  },

  // Send a message
  sendMessage: async (matchId, content) => {
    const response = await api.post(`/messages/matches/${matchId}/messages`, { 
      content 
    });
    return response.data.message;
  },

  // Edit a message
  editMessage: async (messageId, content) => {
    const response = await api.put(`/messages/${messageId}`, { content });
    return response.data.message;
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  }
};
