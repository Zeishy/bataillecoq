import api from '../api/axios';

// Service d'authentification
export const authService = {
  // Inscription
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response?.data);
      throw error.response?.data?.message || error.message || 'Erreur lors de l\'inscription';
    }
  },

  // Connexion
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Obtenir le profil utilisateur
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Lier un compte de jeu
  linkAccount: async (accountData) => {
    const response = await api.put('/auth/link-account', accountData);
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  }
};

export default authService;
