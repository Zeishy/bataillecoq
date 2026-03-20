import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserCheck, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { matchService } from '../services/matchService';
import { tournamentService } from '../services/tournamentService';
import toast from 'react-hot-toast';

// Configuration du nombre de joueurs par jeu
const GAME_PLAYER_REQUIREMENTS = {
  'valorant': { required: 5, name: 'Valorant' },
  'callofduty': { required: 5, name: 'Call of Duty' },
  'leagueoflegends': { required: 5, name: 'League of Legends' },
  'rocketleague': { required: 3, name: 'Rocket League' }
};

export default function SelectMatchPlayersModal({ isOpen, onClose, match, teamId, onSuccess }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && match && teamId) {
      fetchTeamRegistration();
      loadCurrentSelection();
    }
  }, [isOpen, match, teamId]);

  const loadCurrentSelection = () => {
    if (!match || !teamId) return;

    // Charger les joueurs déjà sélectionnés pour ce match
    const isTeam1 = match.team1?.teamId?._id === teamId || match.team1?.teamId === teamId;
    const currentSelection = isTeam1 
      ? match.team1?.selectedPlayers || []
      : match.team2?.selectedPlayers || [];
    
    setSelectedPlayers(currentSelection.map(p => p._id || p));
  };

  const fetchTeamRegistration = async () => {
    setIsFetching(true);
    setError('');
    try {
      // Récupérer le tournoi avec les inscriptions
      const tournamentId = match.tournamentId?._id || match.tournamentId;
      const response = await tournamentService.getTournamentById(tournamentId);
      
      // Trouver l'inscription de l'équipe
      const registration = response.tournament.registeredTeams.find(
        rt => (rt.teamId?._id || rt.teamId) === teamId
      );

      if (!registration) {
        setError('Inscription de l\'équipe non trouvée');
        setAvailablePlayers([]);
        return;
      }

      // Récupérer tous les joueurs disponibles (titulaires + remplaçants)
      const teamData = registration.teamId;
      const playerIds = [
        ...(registration.players || []),
        ...(registration.substitutes || [])
      ];

      // Filtrer les joueurs de l'équipe qui sont dans la liste d'inscription
      const players = (teamData.players || []).filter(p => {
        const playerId = p.playerId?._id || p.playerId?.userId?._id || p.userId?._id || p._id;
        return playerIds.some(pid => pid.toString() === playerId.toString());
      });

      console.log('Available players for match:', players);
      setAvailablePlayers(players);
    } catch (err) {
      console.error('Error fetching team registration:', err);
      setError('Impossible de charger les joueurs disponibles');
      setAvailablePlayers([]);
    } finally {
      setIsFetching(false);
    }
  };

  const togglePlayerSelection = (playerId) => {
    const gameConfig = GAME_PLAYER_REQUIREMENTS[match.tournamentId?.game || match.game];
    
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      if (selectedPlayers.length < gameConfig.required) {
        setSelectedPlayers([...selectedPlayers, playerId]);
      } else {
        toast.error(`Maximum ${gameConfig.required} joueurs pour ce match`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const gameConfig = GAME_PLAYER_REQUIREMENTS[match.tournamentId?.game || match.game];
    
    if (selectedPlayers.length !== gameConfig.required) {
      setError(`Vous devez sélectionner exactement ${gameConfig.required} joueurs`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await matchService.selectPlayers(match._id, teamId, selectedPlayers);
      toast.success('Joueurs sélectionnés avec succès !');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error selecting players:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la sélection des joueurs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedPlayers([]);
      setError('');
      onClose();
    }
  };

  if (!match) return null;

  const gameConfig = GAME_PLAYER_REQUIREMENTS[match.tournamentId?.game || match.game];
  const isTeam1 = match.team1?.teamId?._id === teamId || match.team1?.teamId === teamId;
  const teamName = isTeam1 ? match.team1?.teamId?.name : match.team2?.teamId?.name;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-reunion-green/30"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-reunion-green to-reunion-blue rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Sélection des joueurs</h2>
                    <p className="text-sm text-gray-400">{teamName}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Match info */}
                <div className="bg-dark-700/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Match</span>
                    <span className="text-white font-medium">
                      {match.team1?.teamId?.name} vs {match.team2?.teamId?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Round</span>
                    <span className="text-white">{match.round}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400">Joueurs requis</span>
                    <span className="text-reunion-gold font-bold">{gameConfig?.required || '?'}</span>
                  </div>
                  
                  {/* Status de l'autre équipe */}
                  {(() => {
                    const isTeam1 = match.team1?.teamId?._id === teamId || match.team1?.teamId === teamId;
                    const otherTeamName = isTeam1 ? match.team2?.teamId?.name : match.team1?.teamId?.name;
                    const otherTeamSelected = isTeam1 
                      ? (match.team2?.selectedPlayers && match.team2.selectedPlayers.length > 0)
                      : (match.team1?.selectedPlayers && match.team1.selectedPlayers.length > 0);
                    
                    return (
                      <div className="border-t border-dark-600 pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">{otherTeamName}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            otherTeamSelected 
                              ? 'bg-reunion-green/20 text-reunion-green'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {otherTeamSelected ? '✓ Sélectionnée' : '⏳ En attente'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </motion.div>
                  )}

                  {/* Selection summary */}
                  <div className="bg-dark-700/30 rounded-lg p-3">
                    <p className="text-gray-400 text-sm mb-1">Joueurs sélectionnés</p>
                    <p className={`text-2xl font-bold ${selectedPlayers.length === gameConfig?.required ? 'text-reunion-green' : 'text-reunion-gold'}`}>
                      {selectedPlayers.length} / {gameConfig?.required || '?'}
                    </p>
                  </div>

                  {/* Player selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Sélectionnez les joueurs pour ce match
                    </label>
                    
                    {isFetching ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                      </div>
                    ) : availablePlayers.length === 0 ? (
                      <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                        <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">
                          Aucun joueur disponible
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {availablePlayers.map((player, index) => {
                          const playerId = player.playerId?._id || player.playerId?.userId?._id || player.userId?._id || player._id;
                          
                          let playerName = 'Joueur inconnu';
                          if (player.playerId?.userId?.username) {
                            playerName = player.playerId.userId.username;
                          } else if (player.playerId?.username) {
                            playerName = player.playerId.username;
                          } else if (player.userId?.username) {
                            playerName = player.userId.username;
                          } else if (player.username) {
                            playerName = player.username;
                          }
                          
                          const inGameName = player.playerId?.inGameName || player.inGameName;
                          const isSelected = selectedPlayers.includes(playerId.toString());
                          
                          return (
                            <motion.button
                              key={playerId || index}
                              type="button"
                              onClick={() => togglePlayerSelection(playerId.toString())}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-reunion-green bg-reunion-green/10'
                                  : 'border-dark-600 bg-dark-700/50 hover:border-dark-500'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isSelected ? 'bg-reunion-green/20' : 'bg-dark-600'
                                  }`}>
                                    {isSelected ? (
                                      <UserCheck className="w-4 h-4 text-reunion-green" />
                                    ) : (
                                      <Users className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">{playerName}</p>
                                    {inGameName && (
                                      <p className="text-xs text-gray-400">{inGameName}</p>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-5 h-5 text-reunion-green" />
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors font-medium disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isLoading || selectedPlayers.length !== gameConfig?.required}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-reunion-green to-reunion-blue text-white rounded-lg hover:from-reunion-green/80 hover:to-reunion-blue/80 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="w-5 h-5" />
                          Confirmer
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
