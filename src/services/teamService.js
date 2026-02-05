import api from '../api/axios';

// Service de gestion des équipes
export const teamService = {
  // Obtenir toutes les équipes
  getTeams: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/teams${params ? `?${params}` : ''}`);
    return response.data;
  },

  // Obtenir une équipe par ID
  getTeam: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  // Créer une équipe
  createTeam: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  // Mettre à jour une équipe
  updateTeam: async (id, teamData) => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  // Supprimer une équipe
  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  // Rejoindre une équipe (en tant que joueur connecté)
  joinTeam: async (teamId) => {
    const response = await api.post(`/teams/${teamId}/join`);
    return response.data;
  },

  // Ajouter un joueur à une équipe
  addPlayer: async (teamId, playerId, role) => {
    const response = await api.post(`/teams/${teamId}/players`, { playerId, role });
    return response.data;
  },

  // Retirer un joueur d'une équipe
  removePlayer: async (teamId, playerId) => {
    const response = await api.delete(`/teams/${teamId}/players/${playerId}`);
    return response.data;
  }
};

export default teamService;
