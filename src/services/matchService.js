import api from '../api/axios';

export const matchService = {
  // Get match by ID
  getMatch: async (matchId) => {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  },

  // Get all matches for a tournament
  getTournamentMatches: async (tournamentId) => {
    const response = await api.get(`/tournaments/${tournamentId}/matches`);
    return response.data;
  },

  // Update match score only
  updateScore: async (matchId, team1Score, team2Score) => {
    const response = await api.put(`/matches/${matchId}/score`, {
      team1Score,
      team2Score
    });
    return response.data;
  },

  // Update score and advance bracket
  updateScoreAndAdvance: async (matchId, scoreData) => {
    const response = await api.put(`/matches/${matchId}/score-and-advance`, scoreData);
    return response.data;
  },

  // Complete match
  completeMatch: async (matchId, playerStats) => {
    const response = await api.put(`/matches/${matchId}/complete`, {
      playerStats
    });
    return response.data;
  },

  // Delete match
  deleteMatch: async (matchId) => {
    const response = await api.delete(`/matches/${matchId}`);
    return response.data;
  },

  // Select players for a match
  selectPlayers: async (matchId, teamId, selectedPlayers) => {
    const response = await api.put(`/matches/${matchId}/select-players`, {
      teamId,
      selectedPlayers
    });
    return response.data;
  },

  // Confirm match ready and transition to ongoing
  confirmMatchReady: async (matchId) => {
    const response = await api.put(`/matches/${matchId}/confirm-ready`);
    return response.data;
  }
};

export default matchService;
