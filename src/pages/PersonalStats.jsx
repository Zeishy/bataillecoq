import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  TrendingUp, 
  Target, 
  Award, 
  Trophy,
  Crosshair,
  Zap,
  Shield,
  Swords,
  Flame,
  Crown,
  Star,
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PersonalStats = () => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState('valorant');

  // Configuration des thèmes par jeu
  const gameThemes = {
    valorant: {
      name: 'Valorant',
      icon: '🎯',
      gradient: 'from-red-600 via-pink-600 to-purple-600',
      bgPattern: 'bg-gradient-to-br from-red-950/20 via-pink-950/20 to-purple-950/20',
      accentColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      hoverBorder: 'hover:border-red-500/60',
      stats: [
        { label: 'K/D Ratio', value: '1.35', icon: Crosshair, color: 'text-red-400' },
        { label: 'Win Rate', value: '58%', icon: Trophy, color: 'text-pink-400' },
        { label: 'Headshot %', value: '42%', icon: Target, color: 'text-purple-400' },
        { label: 'Avg Score', value: '245', icon: Star, color: 'text-red-300' }
      ],
      recentMatches: [
        { map: 'Ascent', result: 'Victoire', score: '13-9', kda: '24/15/8', agent: 'Jett' },
        { map: 'Bind', result: 'Défaite', score: '11-13', kda: '18/19/6', agent: 'Phoenix' },
        { map: 'Haven', result: 'Victoire', score: '13-7', kda: '28/12/10', agent: 'Reyna' }
      ]
    },
    cod: {
      name: 'Call of Duty',
      icon: '🎮',
      gradient: 'from-orange-600 via-yellow-600 to-amber-600',
      bgPattern: 'bg-gradient-to-br from-orange-950/20 via-yellow-950/20 to-amber-950/20',
      accentColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      hoverBorder: 'hover:border-orange-500/60',
      stats: [
        { label: 'K/D Ratio', value: '1.52', icon: Crosshair, color: 'text-orange-400' },
        { label: 'Win Rate', value: '62%', icon: Trophy, color: 'text-yellow-400' },
        { label: 'Accuracy', value: '38%', icon: Target, color: 'text-amber-400' },
        { label: 'SPM', value: '312', icon: Zap, color: 'text-orange-300' }
      ],
      recentMatches: [
        { map: 'Shipment', result: 'Victoire', score: '75-58', kda: '42/28/5', mode: 'Team Deathmatch' },
        { map: 'Nuketown', result: 'Victoire', score: '100-85', kda: '38/24/8', mode: 'Domination' },
        { map: 'Hackney Yard', result: 'Défaite', score: '48-75', kda: '25/31/4', mode: 'Search & Destroy' }
      ]
    },
    lol: {
      name: 'League of Legends',
      icon: '⚔️',
      gradient: 'from-blue-600 via-cyan-600 to-teal-600',
      bgPattern: 'bg-gradient-to-br from-blue-950/20 via-cyan-950/20 to-teal-950/20',
      accentColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-500/60',
      stats: [
        { label: 'Win Rate', value: '54%', icon: Trophy, color: 'text-blue-400' },
        { label: 'KDA', value: '3.2', icon: Swords, color: 'text-cyan-400' },
        { label: 'CS/min', value: '7.8', icon: Target, color: 'text-teal-400' },
        { label: 'Vision Score', value: '45', icon: Shield, color: 'text-blue-300' }
      ],
      recentMatches: [
        { map: "Summoner's Rift", result: 'Victoire', score: '35 min', kda: '8/3/12', champion: 'Yasuo' },
        { map: "Summoner's Rift", result: 'Défaite', score: '42 min', kda: '5/8/9', champion: 'Zed' },
        { map: "Summoner's Rift", result: 'Victoire', score: '28 min', kda: '12/2/15', champion: 'Ahri' }
      ]
    }
  };

  const currentTheme = gameThemes[selectedGame];

  return (
    <div className="min-h-screen bg-dark-900 pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center">
            <User className="mr-3 text-reunion-gold" size={40} />
            Mes Statistiques
          </h1>
          <p className="text-gray-400 text-lg">
            Bienvenue <span className="text-white font-semibold">{user?.username}</span>, consultez vos performances
          </p>
        </motion.div>

        {/* Game Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(gameThemes).map(([key, game]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGame(key)}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  selectedGame === key
                    ? `bg-gradient-to-r ${game.gradient} border-transparent shadow-lg`
                    : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{game.icon}</div>
                  <div className="text-left">
                    <h3 className={`text-xl font-bold ${selectedGame === key ? 'text-white' : 'text-gray-300'}`}>
                      {game.name}
                    </h3>
                    <p className={`text-sm ${selectedGame === key ? 'text-white/80' : 'text-gray-500'}`}>
                      Voir les stats
                    </p>
                  </div>
                </div>
                {selectedGame === key && (
                  <motion.div
                    layoutId="activeGame"
                    className="absolute inset-0 border-2 border-white/20 rounded-lg"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedGame}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {currentTheme.stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${currentTheme.bgPattern} bg-dark-800 rounded-lg border ${currentTheme.borderColor} p-6 ${currentTheme.hoverBorder} transition-all`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className={stat.color} size={32} />
                    <div className={`text-3xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Matches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`${currentTheme.bgPattern} bg-dark-800 rounded-lg border ${currentTheme.borderColor} p-6`}
            >
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className={currentTheme.accentColor} size={28} />
                <h2 className="text-2xl font-bold text-white">Matchs Récents</h2>
              </div>

              <div className="space-y-4">
                {currentTheme.recentMatches.map((match, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`bg-dark-700/50 rounded-lg border ${currentTheme.borderColor} p-4 hover:bg-dark-700 transition-all`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Map/Mode */}
                      <div className="flex-1 min-w-[150px]">
                        <div className="text-white font-semibold">{match.map}</div>
                        <div className="text-gray-400 text-sm">
                          {selectedGame === 'lol' ? match.champion : selectedGame === 'cod' ? match.mode : match.agent}
                        </div>
                      </div>

                      {/* Result */}
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          match.result === 'Victoire'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {match.result}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <div className="text-gray-400 text-xs mb-1">Score</div>
                        <div className={`${currentTheme.accentColor} font-bold`}>
                          {match.score}
                        </div>
                      </div>

                      {/* KDA */}
                      <div className="text-center">
                        <div className="text-gray-400 text-xs mb-1">KDA</div>
                        <div className="text-white font-mono font-semibold">
                          {match.kda}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className={`${currentTheme.bgPattern} bg-dark-800 rounded-lg border ${currentTheme.borderColor} p-6 mt-8`}
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className={currentTheme.accentColor} size={28} />
                <h2 className="text-2xl font-bold text-white">Performance</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Progression */}
                <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                  <Crown className={`${currentTheme.accentColor} mx-auto mb-2`} size={32} />
                  <div className="text-2xl font-bold text-white mb-1">
                    {selectedGame === 'valorant' ? 'Platine 2' : selectedGame === 'cod' ? 'Prestige 3' : 'Gold II'}
                  </div>
                  <div className="text-gray-400 text-sm">Rang Actuel</div>
                </div>

                {/* Games Played */}
                <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                  <Calendar className={`${currentTheme.accentColor} mx-auto mb-2`} size={32} />
                  <div className="text-2xl font-bold text-white mb-1">247</div>
                  <div className="text-gray-400 text-sm">Parties Jouées</div>
                </div>

                {/* Playtime */}
                <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                  <Clock className={`${currentTheme.accentColor} mx-auto mb-2`} size={32} />
                  <div className="text-2xl font-bold text-white mb-1">156h</div>
                  <div className="text-gray-400 text-sm">Temps de Jeu</div>
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className={`${currentTheme.bgPattern} bg-dark-800 rounded-lg border ${currentTheme.borderColor} p-6 mt-8`}
            >
              <div className="flex items-center gap-3 mb-6">
                <Award className={currentTheme.accentColor} size={28} />
                <h2 className="text-2xl font-bold text-white">Accomplissements</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🏆', label: 'Champion', desc: '10 victoires consécutives' },
                  { icon: '🎯', label: 'Tireur Elite', desc: '100 headshots' },
                  { icon: '⚡', label: 'Éclair', desc: 'MVP 5 fois' },
                  { icon: '🔥', label: 'En Feu', desc: 'Kill streak x20' }
                ].map((achievement, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="bg-dark-700/50 rounded-lg p-4 text-center hover:bg-dark-700 transition-all cursor-pointer"
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <div className="text-white font-semibold text-sm mb-1">{achievement.label}</div>
                    <div className="text-gray-500 text-xs">{achievement.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PersonalStats;
