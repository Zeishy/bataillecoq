import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus, Medal } from 'lucide-react';
import { mockTeams, mockPlayers } from '../data/mockData';

const Rankings = () => {
  const [viewMode, setViewMode] = useState('teams'); // 'teams' or 'players'
  const [selectedGame, setSelectedGame] = useState('all');

  const games = ['all', 'Valorant', 'Call of Duty', 'League of Legends', 'Rocket League'];

  const filteredTeams = selectedGame === 'all' 
    ? mockTeams 
    : mockTeams.filter(team => team.game === selectedGame);

  const filteredPlayers = selectedGame === 'all'
    ? mockPlayers
    : mockPlayers.filter(player => player.game === selectedGame);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="text-reunion-green" size={20} />;
    if (trend === 'down') return <TrendingDown className="text-reunion-red" size={20} />;
    return <Minus className="text-gray-400" size={20} />;
  };

  const getPodiumPosition = (rank) => {
    if (rank === 1) return { emoji: '🥇', color: 'text-reunion-gold', bg: 'bg-reunion-gold/10' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-400', bg: 'bg-gray-400/10' };
    if (rank === 3) return { emoji: '🥉', color: 'text-reunion-red', bg: 'bg-reunion-red/10' };
    return null;
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center">
            <BarChart3 className="mr-3 text-reunion-blue" size={40} />
            Classements
          </h1>
          <p className="text-gray-400 text-lg">Découvrez les meilleurs joueurs et équipes de la Réunion</p>
        </motion.div>

        {/* Toggle and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4"
        >
          {/* View Mode Toggle */}
          <div className="flex justify-center">
            <div className="bg-dark-800 p-1 rounded-lg border border-reunion-blue/20 inline-flex">
              <button
                onClick={() => setViewMode('teams')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'teams'
                    ? 'bg-reunion-green text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Équipes
              </button>
              <button
                onClick={() => setViewMode('players')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'players'
                    ? 'bg-reunion-red text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Joueurs
              </button>
            </div>
          </div>

          {/* Game Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            {games.map(game => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedGame === game
                    ? 'bg-reunion-blue text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700 border border-reunion-blue/20'
                }`}
              >
                {game === 'all' ? 'Tous les jeux' : game}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Podium */}
        {viewMode === 'teams' && filteredTeams.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <div className="flex items-end justify-center gap-4 mb-12">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-dark-800 rounded-lg p-6 border-2 border-gray-400/30 text-center w-64"
                style={{ height: '280px' }}
              >
                <div className="text-6xl mb-3">🥈</div>
                <div className="text-4xl mb-2">{filteredTeams[1].logo}</div>
                <h3 className="text-xl font-bold mb-2">{filteredTeams[1].name}</h3>
                <div className="text-sm text-gray-400 mb-3">{filteredTeams[1].game}</div>
                <div className="text-3xl font-bold text-gray-400">{filteredTeams[1].points}</div>
                <div className="text-xs text-gray-500">points</div>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-dark-800 rounded-lg p-6 border-2 border-reunion-gold/50 text-center w-64 relative"
                style={{ height: '320px' }}
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Medal className="text-reunion-gold" size={32} />
                </div>
                <div className="text-6xl mb-3">🥇</div>
                <div className="text-4xl mb-2">{filteredTeams[0].logo}</div>
                <h3 className="text-xl font-bold mb-2">{filteredTeams[0].name}</h3>
                <div className="text-sm text-gray-400 mb-3">{filteredTeams[0].game}</div>
                <div className="text-3xl font-bold text-reunion-gold">{filteredTeams[0].points}</div>
                <div className="text-xs text-gray-500">points</div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-dark-800 rounded-lg p-6 border-2 border-reunion-red/30 text-center w-64"
                style={{ height: '240px' }}
              >
                <div className="text-6xl mb-3">🥉</div>
                <div className="text-4xl mb-2">{filteredTeams[2].logo}</div>
                <h3 className="text-xl font-bold mb-2">{filteredTeams[2].name}</h3>
                <div className="text-sm text-gray-400 mb-3">{filteredTeams[2].game}</div>
                <div className="text-3xl font-bold text-reunion-red">{filteredTeams[2].points}</div>
                <div className="text-xs text-gray-500">points</div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Rankings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 rounded-lg border border-reunion-blue/20 overflow-hidden"
        >
          {viewMode === 'teams' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Rang</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Équipe</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Jeu</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Membres</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Points</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Évolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filteredTeams.map((team, index) => {
                    const podium = getPodiumPosition(team.rank);
                    return (
                      <motion.tr
                        key={team.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-dark-700/50 transition-colors ${podium ? podium.bg : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {podium && <span className="text-2xl mr-2">{podium.emoji}</span>}
                            <span className={`text-lg font-bold ${podium ? podium.color : ''}`}>
                              #{team.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{team.logo}</span>
                            <span className="font-bold">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-reunion-green/20 text-reunion-green rounded-full text-sm">
                            {team.game}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{team.players?.length || 0}</td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-reunion-gold">{team.points}</span>
                        </td>
                        <td className="px-6 py-4">
                          <TrendingUp className="text-reunion-green" size={20} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Rang</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Joueur</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Jeu</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">KDA</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Winrate</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Matchs</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Points</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Évolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filteredPlayers.map((player, index) => {
                    const podium = getPodiumPosition(player.rank);
                    return (
                      <motion.tr
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-dark-700/50 transition-colors ${podium ? podium.bg : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {podium && <span className="text-2xl mr-2">{podium.emoji}</span>}
                            <span className={`text-lg font-bold ${podium ? podium.color : ''}`}>
                              #{player.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold">{player.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-reunion-red/20 text-reunion-red rounded-full text-sm">
                            {player.game}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{player.kda}</td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${
                            player.winrate >= 60 ? 'text-reunion-green' :
                            player.winrate >= 50 ? 'text-reunion-gold' :
                            'text-reunion-red'
                          }`}>
                            {player.winrate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{player.matchesPlayed}</td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-reunion-gold">{player.points}</span>
                        </td>
                        <td className="px-6 py-4">{getTrendIcon(player.trend)}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Rankings;
