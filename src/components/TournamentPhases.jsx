import { motion } from 'framer-motion';
import { Calendar, Play, Flag } from 'lucide-react';

const TournamentPhases = ({ status, startDate, endDate }) => {
  const phases = [
    {
      name: 'Inscription',
      icon: Calendar,
      status: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      description: 'Enregistrement des équipes'
    },
    {
      name: 'En cours',
      icon: Play,
      status: ['ongoing', 'completed'],
      description: 'Matchs en cours de jeu'
    },
    {
      name: 'Terminée',
      icon: Flag,
      status: ['completed'],
      description: 'Tournoi achevé'
    }
  ];

  const getPhaseProgress = () => {
    const phaseIndex = phases.findIndex(p => p.status.includes(status));
    return (phaseIndex + 1) * 33.33;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Timeline */}
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${getPhaseProgress()}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Phases */}
        <div className="grid grid-cols-3 gap-4">
          {phases.map((phase, index) => {
            const isActive = phase.status.includes(status);
            const isPassed = phases.slice(0, index).some(p => p.status.includes(status));

            return (
              <motion.div
                key={phase.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`text-center p-3 rounded-lg border-2 transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50'
                    : isPassed
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <div className="flex justify-center mb-2">
                  <phase.icon
                    className={`w-6 h-6 ${
                      isActive
                        ? 'text-blue-600'
                        : isPassed
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-sm">{phase.name}</h3>
                <p className="text-xs text-gray-600">{phase.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
          <p className="text-gray-600 text-xs">Début</p>
          <p className="font-semibold text-blue-900">{formatDate(startDate)}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">
          <p className="text-gray-600 text-xs">Fin</p>
          <p className="font-semibold text-orange-900">{formatDate(endDate)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentPhases;
