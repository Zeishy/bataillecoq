import api from '../api/axios';

// Service de gestion des tournois
export const tournamentService = {
  // Obtenir tous les tournois
  getTournaments: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/tournaments${params ? `?${params}` : ''}`);
    return response.data;
  },

  // Obtenir un tournoi par ID
  getTournament: async (id) => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  // Créer un tournoi (admin)
  createTournament: async (tournamentData) => {
    const response = await api.post('/tournaments', tournamentData);
    return response.data;
  },

  // Mettre à jour un tournoi (admin)
  updateTournament: async (id, tournamentData) => {
    const response = await api.put(`/tournaments/${id}`, tournamentData);
    return response.data;
  },

  // Changer le statut d'un tournoi (admin)
  updateStatus: async (id, status) => {
    const response = await api.put(`/tournaments/${id}/status`, { status });
    return response.data;
  },

  // Inscrire une équipe au tournoi
  registerTeam: async (tournamentId, teamId) => {
    const response = await api.post(`/tournaments/${tournamentId}/register`, { teamId });
    return response.data;
  },

  // Désinscrire une équipe du tournoi
  unregisterTeam: async (tournamentId, teamId) => {
    const response = await api.delete(`/tournaments/${tournamentId}/register/${teamId}`);
    return response.data;
  },

  // Obtenir le classement d'un tournoi
  getStandings: async (tournamentId) => {
    const response = await api.get(`/tournaments/${tournamentId}/standings`);
    return response.data;
  },

  // Obtenir les matchs d'un tournoi
  getMatches: async (tournamentId) => {
    const response = await api.get(`/tournaments/${tournamentId}/matches`);
    return response.data;
  },

  // Supprimer un tournoi (admin)
  deleteTournament: async (id) => {
    const response = await api.delete(`/tournaments/${id}`);
    return response.data;
  }
};

export default tournamentService;
