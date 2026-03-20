import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Trophy, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import matchService from '../services/matchService';
import { getWinner, isMatchComplete, formatScoreDisplay } from '../utils/matchFormat';
import PlayerSelectionModal from './PlayerSelectionModal';
import MatchPickAndBan from './MatchPickAndBan';

const TournamentMatches = ({ tournamentId, currentUser = null, canEdit = false }) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [playerSelectionModal, setPlayerSelectionModal] = useState({ isOpen: false, match: null });
  const [pickBanModal, setPickBanModal] = useState({ isOpen: false, match: null });

  useEffect(() => {
    loadMatches();
  }, [tournamentId]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await matchService.getTournamentMatches(tournamentId);
      // Response format: { success: true, count, matches }
      const matchesData = response.matches || [];
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setError('');
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Erreur lors du chargement des matchs');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getMatchStatus = (match) => {
    if (match.status === 'completed') return 'completed';
    if (match.pickAndBan?.status === 'in-progress' || match.pickAndBan?.status === 'completed') {
      return 'in-progress';
    }
    return 'upcoming';
  };

  const isCaptainOfTeam = (match, teamId) => {
    if (!currentUser || !match) return false;
    
    // Vérifier team1
    if (match.team1?.teamId?._id?.toString() === teamId?.toString()) {
      const captainId = match.team1?.teamId?.captainId?._id || match.team1?.teamId?.captainId;
      return captainId?.toString() === currentUser._id?.toString();
    }
    
    // Vérifier team2
    if (match.team2?.teamId?._id?.toString() === teamId?.toString()) {
      const captainId = match.team2?.teamId?.captainId?._id || match.team2?.teamId?.captainId;
      return captainId?.toString() === currentUser._id?.toString();
    }
    
    return false;
  };

  const handleMatchClick = (matchId, e) => {
    // Si on clique sur un bouton, ne pas naviguer
    if (e.target.closest('button')) {
      return;
    }
    navigate(`/matches/${matchId}`);
  };

  const openPlayerSelection = (match, e) => {
    e.stopPropagation();
    setPlayerSelectionModal({ isOpen: true, match });
  };

  const openPickBan = (match, e) => {
    e.stopPropagation();
    setPickBanModal({ isOpen: true, match });
  };

  const handlePlayerSelectionClose = () => {
    setPlayerSelectionModal({ isOpen: false, match: null });
  };

  const handlePlayerSelectionSuccess = (selectedPlayers) => {
    toast.success('Joueurs sélectionnés avec succès');
    handlePlayerSelectionClose();
    loadMatches(); // Rafraîchir les données
  };

  const handlePickBanClose = () => {
    setPickBanModal({ isOpen: false, match: null });
  };

  const handlePickBanSuccess = () => {
    toast.success('Pick & Ban complété avec succès');
    handlePickBanClose();
    loadMatches(); // Rafraîchir les données
  };

  const filteredMatches = filterStatus === 'all'
    ? matches
    : matches.filter(match => getMatchStatus(match) === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-3"></div>
          <p className="text-slate-300">Chargement des matchs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/20 border border-red-500 rounded-xl text-red-200 text-center">
        {error}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-slate-400">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Aucun match pour ce tournoi</p>
      </div>
    );
  }

  const statusCounts = {
    upcoming: matches.filter(m => getMatchStatus(m) === 'upcoming').length,
    'in-progress': matches.filter(m => getMatchStatus(m) === 'in-progress').length,
    completed: matches.filter(m => getMatchStatus(m) === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {[
          { value: 'all', label: `Tous (${matches.length})` },
          { value: 'upcoming', label: `À venir (${statusCounts.upcoming})` },
          { value: 'in-progress', label: `En cours (${statusCounts['in-progress']})` },
          { value: 'completed', label: `Terminés (${statusCounts.completed})` }
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-3 font-semibold transition-colors ${
              filterStatus === filter.value
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, index) => {
              const status = getMatchStatus(match);
              const isComplete = isMatchComplete(
                match.team1?.score || 0,
                match.team2?.score || 0,
                match.matchFormat
              );
              const winner = getWinner(
                match.team1?.score || 0,
                match.team2?.score || 0,
                match.matchFormat
              );

              return (
                <motion.div
                  key={match._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-lg border border-slate-700 hover:border-purple-500/50 p-4 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {/* Match Card */}
                  <motion.div
                    onClick={(e) => handleMatchClick(match._id, e)}
                    className="group cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4">
                        {/* Team 1 */}
                        <div className="flex-1 text-right">
                          <p className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                            {match.team1?.teamId?.name || 'Équipe 1'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {match.team1?.teamId?.players?.length || 0} joueurs
                          </p>
                        </div>

                        {/* Score */}
                        <div className="flex items-center gap-2">
                          <motion.div
                            className={`text-center px-4 py-2 rounded-lg font-bold text-lg transition-colors ${
                              isComplete && winner === 'team1'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-slate-700/50 text-white'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {match.team1?.score || 0}
                          </motion.div>

                          <span className="text-slate-500 font-bold">-</span>

                          <motion.div
                            className={`text-center px-4 py-2 rounded-lg font-bold text-lg transition-colors ${
                              isComplete && winner === 'team2'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-slate-700/50 text-white'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {match.team2?.score || 0}
                          </motion.div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                            {match.team2?.teamId?.name || 'Équipe 2'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {match.team2?.teamId?.players?.length || 0} joueurs
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Format */}
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          {status === 'completed' ? (
                            <>
                              <Trophy className="w-4 h-4 text-green-400" />
                              <span className="text-xs font-bold text-green-400">TERMINÉ</span>
                            </>
                          ) : status === 'in-progress' ? (
                            <>
                              <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                              <span className="text-xs font-bold text-yellow-400">EN COURS</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 text-blue-400" />
                              <span className="text-xs font-bold text-blue-400">À VENIR</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {match.matchFormat?.toUpperCase() || 'BO3'}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </motion.div>

                  {/* Pick & Ban Status */}
                  {match.pickAndBan && (
                    <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2">
                      <div className="text-xs text-slate-400">
                        Pick & Ban: 
                        <span className={`ml-2 font-semibold ${
                          match.pickAndBan.status === 'completed'
                            ? 'text-green-400'
                            : match.pickAndBan.status === 'in-progress'
                            ? 'text-yellow-400'
                            : 'text-slate-400'
                        }`}>
                          {match.pickAndBan.status === 'completed' && '✓ Fait'}
                          {match.pickAndBan.status === 'in-progress' && '⏳ En cours'}
                          {match.pickAndBan.status === 'not-started' && '○ Non commencé'}
                        </span>
                      </div>
                      {match.pickAndBan.selectedMaps && match.pickAndBan.selectedMaps.length > 0 && (
                        <div className="text-xs text-slate-500">
                          • {match.pickAndBan.selectedMaps.length} map(s) sélectionnée(s)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Captain Actions */}
                  {currentUser && (isCaptainOfTeam(match, match.team1?.teamId?._id) || isCaptainOfTeam(match, match.team2?.teamId?._id)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: expandedMatchId === match._id ? 1 : 0,
                        height: expandedMatchId === match._id ? 'auto' : 0
                      }}
                      className="mt-4 pt-4 border-t border-slate-700 space-y-2"
                    >
                      <button
                        onClick={(e) => openPlayerSelection(match, e)}
                        className="w-full px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-sm transition-colors"
                      >
                        👥 Sélectionner les joueurs
                      </button>
                      <button
                        onClick={(e) => openPickBan(match, e)}
                        className="w-full px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg text-sm transition-colors"
                      >
                        🎮 Pick & Ban
                      </button>
                    </motion.div>
                  )}

                  {/* Expand/Collapse for Captain */}
                  {currentUser && (isCaptainOfTeam(match, match.team1?.teamId?._id) || isCaptainOfTeam(match, match.team2?.teamId?._id)) && (
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={() => setExpandedMatchId(expandedMatchId === match._id ? null : match._id)}
                        className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {expandedMatchId === match._id ? '▲ Masquer les actions' : '▼ Afficher les actions'}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 bg-slate-800/30 border border-slate-700 rounded-lg text-center text-slate-400"
            >
              <p>Aucun match {filterStatus !== 'all' ? `${filterStatus}` : ''}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player Selection Modal */}
      {playerSelectionModal.isOpen && playerSelectionModal.match && (
        <PlayerSelectionModal
          match={playerSelectionModal.match}
          onClose={handlePlayerSelectionClose}
          onSuccess={handlePlayerSelectionSuccess}
        />
      )}

      {/* Pick & Ban Modal */}
      {pickBanModal.isOpen && pickBanModal.match && (
        <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Pick & Ban</h2>
              <button
                onClick={handlePickBanClose}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <MatchPickAndBan
              match={pickBanModal.match}
              mapPool={pickBanModal.match.tournament?.mapPoolId}
              isTeamCaptain={isCaptainOfTeam(pickBanModal.match, pickBanModal.match.team1Id?._id)}
              teamId={pickBanModal.match.team1Id?._id}
              onComplete={handlePickBanSuccess}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TournamentMatches;
