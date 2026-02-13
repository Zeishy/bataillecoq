import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ErrorState = ({ 
  title = 'Une erreur est survenue',
  message = 'Impossible de charger les données',
  onRetry,
  showHomeButton = false,
  showBackButton = false
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6"
      >
        <AlertCircle className="w-12 h-12 text-red-500" />
      </motion.div>

      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-center max-w-md mb-8">{message}</p>

      <div className="flex flex-wrap gap-3 justify-center">
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium flex items-center gap-2 hover:from-red-600 hover:to-orange-600 transition"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </motion.button>
        )}

        {showBackButton && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-gray-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </motion.button>
        )}

        {showHomeButton && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-gray-600 transition"
          >
            <Home className="w-5 h-5" />
            Accueil
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorState;
