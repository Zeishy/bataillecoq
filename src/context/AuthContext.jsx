import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const data = await authService.getMe();
          setUser(data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Erreur lors du chargement du profil:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Inscription
  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      const { token: newToken, user: newUser } = data;
      
      // Sauvegarder le token et l'utilisateur
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      toast.success(`Bienvenue ${newUser.username} ! 🎉`);
      return data;
    } catch (error) {
      toast.error(error || 'Erreur lors de l\'inscription');
      throw error;
    }
  };

  // Connexion
  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      const { token: newToken, user: newUser } = data;
      
      // Sauvegarder le token et l'utilisateur
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      toast.success(`Content de vous revoir ${newUser.username} ! 👋`);
      return data;
    } catch (error) {
      toast.error(error || 'Email ou mot de passe incorrect');
      throw error;
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Déconnexion réussie');
  };

  // Rafraîchir le profil
  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  };

  // Lier un compte de jeu
  const linkAccount = async (accountData) => {
    try {
      await authService.linkAccount(accountData);
      await refreshUser();
      toast.success('Compte lié avec succès ! 🎮');
    } catch (error) {
      toast.error(error || 'Erreur lors de la liaison du compte');
      throw error;
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (profileData) => {
    try {
      await authService.updateProfile(profileData);
      await refreshUser();
      toast.success('Profil mis à jour ! ✅');
    } catch (error) {
      toast.error(error || 'Erreur lors de la mise à jour du profil');
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    refreshUser,
    linkAccount,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
