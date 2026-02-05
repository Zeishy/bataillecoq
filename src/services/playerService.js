import api from '../api/axios';

// Service de gestion des joueurs
export const playerService = {
  // Obtenir tous les joueurs
  getPlayers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/players${params ? `?${params}` : ''}`);
    return response.data;
  },

  // Obtenir un joueur par ID
  getPlayer: async (id) => {
    const response = await api.get(`/players/${id}`);
    return response.data;
  },

  // Obtenir les stats d'un joueur pour un jeu
  getPlayerStats: async (id, game) => {
    const response = await api.get(`/players/${id}/stats/${game}`);
    return response.data;
  },

  // Obtenir l'historique de matchs d'un joueur
  getPlayerHistory: async (id, game, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/players/${id}/history/${game}${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },

  // Synchroniser les stats d'un joueur
  syncStats: async (id, game) => {
    const response = await api.put(`/players/${id}/sync/${game}`);
    return response.data;
  },

  // Obtenir le leaderboard d'un jeu
  getLeaderboard: async (game, limit = 100) => {
    const response = await api.get(`/players/leaderboard/${game}?limit=${limit}`);
    return response.data;
  }
};

export default playerService;
