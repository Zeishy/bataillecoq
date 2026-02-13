import { motion } from 'framer-motion';

const TournamentStatusBadge = ({ status, startDate, endDate }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'upcoming':
        return 'À venir';
      case 'ongoing':
        return '🔴 EN COURS';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getCountdown = () => {
    if (status !== 'upcoming') return null;
    
    const start = new Date(startDate);
    const now = new Date();
    const diff = start - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}j ${hours}h`;
    }
    return `${hours}h`;
  };

  const getRemainingTime = () => {
    if (status !== 'ongoing') return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}j ${hours}h restant`;
    }
    return `${hours}h restant`;
  };

  const countdown = getCountdown();
  const remaining = getRemainingTime();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-2"
    >
      <div className={`px-4 py-2 rounded-lg border-2 font-semibold text-center ${getStatusColor()}`}>
        {status === 'ongoing' && (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-block"
          >
            {getStatusLabel()}
          </motion.span>
        )}
        {status !== 'ongoing' && getStatusLabel()}
      </div>
      
      {countdown && (
        <div className="text-sm text-center text-blue-600 font-medium">
          Commence dans {countdown}
        </div>
      )}
      
      {remaining && (
        <div className="text-sm text-center text-green-600 font-medium">
          {remaining}
        </div>
      )}
    </motion.div>
  );
};

export default TournamentStatusBadge;
