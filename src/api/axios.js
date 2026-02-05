import axios from 'axios';

// Configuration de base de l'API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 secondes
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const { status, data } = error.response;
      
      // Rediriger vers login si non authentifié
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Retourner le message d'erreur du serveur
      return Promise.reject(data.message || 'Une erreur est survenue');
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse
      return Promise.reject('Impossible de contacter le serveur');
    } else {
      // Erreur lors de la configuration de la requête
      return Promise.reject(error.message);
    }
  }
);

export default api;
