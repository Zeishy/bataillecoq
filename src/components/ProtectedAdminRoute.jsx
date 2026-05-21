import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      // Afficher un message d'erreur explicite
      toast.error('❌ Accès refusé: Cette page est réservée aux administrateurs');
      // Rediriger après un court délai pour que le message soit visible
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    // Afficher un écran d'accès refusé temporairement
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-2">Accès Refusé</h1>
          <p className="text-gray-400 mb-6">
            Vous n'avez pas les permissions pour accéder à cette page.
          </p>
          <p className="text-gray-500 text-sm">
            Redirection vers l'accueil...
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedAdminRoute;
