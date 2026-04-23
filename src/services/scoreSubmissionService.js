import api from '../api/axios';

export const scoreSubmissionService = {
  // Submit score with screenshots
  submitScore: async (matchId, team1Score, team2Score, screenshots = []) => {
    const response = await api.post(`/matches/${matchId}/submit-score`, {
      team1Score,
      team2Score,
      screenshots
    });
    return response.data.match;
  },

  // Get pending score submissions (admin only)
  getPendingSubmissions: async () => {
    const response = await api.get('/matches/submissions/pending');
    return response.data.matches || [];
  },

  // Approve score submission (admin only)
  approveScore: async (matchId) => {
    const response = await api.patch(`/matches/${matchId}/approve-score`);
    return response.data.match;
  },

  // Reject score submission (admin only)
  rejectScore: async (matchId, reason) => {
    const response = await api.patch(`/matches/${matchId}/reject-score`, { reason });
    return response.data.match;
  }
};
