import api from '../api/axios';

const gameService = {
  // Get all active games
  getAllGames: async () => {
    try {
      const response = await api.get('/games');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all games for admin (including inactive)
  getAllGamesAdmin: async () => {
    try {
      const response = await api.get('/games/admin/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single game by slug
  getGameBySlug: async (slug) => {
    try {
      const response = await api.get(`/games/${slug}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new game (admin only)
  createGame: async (gameData) => {
    try {
      const response = await api.post('/games', gameData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update game (admin only)
  updateGame: async (gameId, gameData) => {
    try {
      const response = await api.put(`/games/${gameId}`, gameData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete game (admin only)
  deleteGame: async (gameId) => {
    try {
      const response = await api.delete(`/games/${gameId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle game active status (admin only)
  toggleGameStatus: async (gameId) => {
    try {
      const response = await api.patch(`/games/${gameId}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default gameService;
