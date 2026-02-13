import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MessageCircle, 
  Shield,
  Plus,
  Search
} from 'lucide-react';

const iconMap = {
  tournament: Trophy,
  team: Users,
  calendar: Calendar,
  message: MessageCircle,
  admin: Shield,
  search: Search,
  default: Trophy
};

const EmptyState = ({ 
  icon = 'default',
  title = 'Aucun résultat',
  message = 'Il n\'y a rien à afficher pour le moment',
  actionLabel,
  onAction,
  illustration
}) => {
  const Icon = iconMap[icon] || iconMap.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {illustration ? (
        <div className="mb-6">
          {illustration}
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mb-6 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full animate-pulse"></div>
          <Icon className="w-12 h-12 text-gray-400 relative z-10" />
        </motion.div>
      )}

      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md mb-8">{message}</p>

      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium flex items-center gap-2 hover:from-red-600 hover:to-orange-600 transition shadow-lg shadow-red-500/30"
        >
          <Plus className="w-5 h-5" />
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
