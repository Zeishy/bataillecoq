import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Users, AlertCircle, CheckCircle2, Loader, UserCheck, UserPlus } from 'lucide-react';
import { tournamentService } from '../services/tournamentService';
import { teamService } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Configuration du nombre de joueurs par jeu
const GAME_PLAYER_REQUIREMENTS = {
  'valorant': { required: 5, name: 'Valorant' },
  'callofduty': { required: 5, name: 'Call of Duty' },
  'leagueoflegends': { required: 5, name: 'League of Legends' },
  'rocketleague': { required: 3, name: 'Rocket League' }
};

export default function RegisterTournamentModal({ isOpen, onClose, tournament, onSuccess }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [step, setStep] = useState(1); // 1: sélection équipe, 2: sélection joueurs
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  // Charger les équipes de l'utilisateur pour le jeu du tournoi
  useEffect(() => {
    if (isOpen && tournament) {
      fetchUserTeams();
      setStep(1);
      setSelectedTeamId('');
      setSelectedPlayers([]);
      setSubstitutes([]);
    }
  }, [isOpen, tournament]);

  const fetchUserTeams = async () => {
    setIsFetching(true);
    setError('');
    try {
      const response = await teamService.getTeams({ game: tournament.game });
      console.log('=== TOURNAMENT REGISTRATION DEBUG ===');
      console.log('Teams response for tournament:', response);
      console.log('Current user:', user);
      console.log('Current user ID:', user?._id);
      console.log('Tournament game:', tournament.game);
      
      // Filtrer les équipes où l'utilisateur est capitaine
      const userTeams = (response.teams || []).filter(team => {
        // Comparer l'ID du capitaine avec l'ID de l'utilisateur connecté
        const captainIdString = team.captainId?._id?.toString() || team.captainId?.toString();
        const userIdString = user?._id?.toString();
        const isCaptain = captainIdString === userIdString;
        
        console.log(`Team "${team.name}":`, {
          captainId: captainIdString,
          userId: userIdString,
          isCaptain,
          rawCaptainId: team.captainId
        });
        
        return isCaptain;
      });
      
      console.log('Filtered user teams (captain):', userTeams);
      
      // Log player structure for debugging
      if (userTeams.length > 0 && userTeams[0].players) {
        console.log('First team players structure:', userTeams[0].players);
        console.log('First player detail:', userTeams[0].players[0]);
      }
      console.log('=== END DEBUG ===');
      
      setTeams(userTeams);
      
      if (userTeams.length === 0) {
        setError(`Vous devez être capitaine d'une équipe ${tournament.game.toUpperCase()} pour vous inscrire`);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Impossible de charger vos équipes');
      setTeams([]); // Set empty array on error
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeamId) {
      setError('Veuillez sélectionner une équipe');
      return;
    }

    const gameConfig = GAME_PLAYER_REQUIREMENTS[tournament.game];
    if (!gameConfig) {
      setError('Configuration du jeu non trouvée');
      return;
    }

    if (selectedPlayers.length !== gameConfig.required) {
      setError(`Vous devez sélectionner exactement ${gameConfig.required} joueurs titulaires`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Envoyer l'inscription avec les joueurs sélectionnés
      await tournamentService.registerTeam(tournament._id, selectedTeamId, {
        players: selectedPlayers,
        substitutes: substitutes
      });
      toast.success('Inscription réussie !');
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Error registering team:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTeam = (teamId) => {
    setSelectedTeamId(teamId);
    const team = teams.find(t => t._id === teamId);
    if (team) {
      setStep(2);
      setSelectedPlayers([]);
      setSubstitutes([]);
      setError('');
    }
  };

  const togglePlayerSelection = (playerId) => {
    const gameConfig = GAME_PLAYER_REQUIREMENTS[tournament.game];
    
    // Si le joueur est déjà titulaire, le retirer
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    }
    // Si le joueur est remplaçant, le retirer
    else if (substitutes.includes(playerId)) {
      setSubstitutes(substitutes.filter(id => id !== playerId));
    }
    // Sinon, l'ajouter comme titulaire ou remplaçant
    else {
      if (selectedPlayers.length < gameConfig.required) {
        setSelectedPlayers([...selectedPlayers, playerId]);
      } else if (substitutes.length < 2) {
        setSubstitutes([...substitutes, playerId]);
      } else {
        toast.error(`Maximum ${gameConfig.required} titulaires et 2 remplaçants`);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setStep(1);
      setSelectedTeamId('');
      setSelectedPlayers([]);
      setSubstitutes([]);
      setError('');
      onClose();
    }
  };

  if (!tournament) return null;

  const selectedTeam = teams.find(t => t._id === selectedTeamId);
  const gameConfig = GAME_PLAYER_REQUIREMENTS[tournament.game];

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
              className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Inscription au tournoi</h2>
                    <p className="text-sm text-gray-400">{tournament.name}</p>
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
                {/* Tournament info */}
                <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Jeu</span>
                    <span className="text-white font-medium uppercase">{tournament.game}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Date de début</span>
                    <span className="text-white">{new Date(tournament.startDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Équipes inscrites</span>
                    <span className="text-white">
                      {tournament.registeredTeams?.length || 0} / {tournament.maxTeams}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Prize pool</span>
                    <span className="text-yellow-500 font-bold">{tournament.prizePool}€</span>
                  </div>
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

                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-reunion-gold' : 'bg-gray-700'}`} />
                    <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-reunion-gold' : 'bg-gray-700'}`} />
                  </div>

                  {/* Step 1: Team selection */}
                  {step === 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Étape 1: Sélectionnez votre équipe
                      </label>
                      
                      {isFetching ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                      ) : teams.length === 0 ? (
                        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                          <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">
                            Aucune équipe disponible pour ce jeu
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Créez une équipe {tournament.game.toUpperCase()} pour participer
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {teams.map((team) => {
                            const isSelected = selectedTeamId === team._id;
                            const isAlreadyRegistered = tournament.registeredTeams?.some(
                              (rt) => rt._id === team._id || rt.team === team._id || rt.teamId?._id === team._id
                            );
                            
                            return (
                              <motion.button
                                key={team._id}
                                type="button"
                                onClick={() => !isAlreadyRegistered && handleSelectTeam(team._id)}
                                disabled={isAlreadyRegistered}
                                whileHover={!isAlreadyRegistered ? { scale: 1.02 } : {}}
                                whileTap={!isAlreadyRegistered ? { scale: 0.98 } : {}}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                  isAlreadyRegistered
                                    ? 'border-green-500/50 bg-green-500/10 cursor-not-allowed'
                                    : isSelected
                                    ? 'border-reunion-gold bg-reunion-gold/10'
                                    : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {team.logo ? (
                                      <img
                                        src={team.logo}
                                        alt={team.name}
                                        className="w-10 h-10 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                                        <Users className="w-5 h-5 text-gray-400" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-white font-medium">{team.name}</p>
                                      <p className="text-sm text-gray-400">
                                        {team.players?.length || 0} membre(s)
                                      </p>
                                    </div>
                                  </div>
                                  {isAlreadyRegistered ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : isSelected ? (
                                    <div className="w-5 h-5 bg-reunion-gold rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                                  )}
                                </div>
                                {isAlreadyRegistered && (
                                  <p className="text-xs text-green-400 mt-2">
                                    ✓ Déjà inscrite à ce tournoi
                                  </p>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Player selection */}
                  {step === 2 && selectedTeam && gameConfig && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Étape 2: Sélectionnez les joueurs
                          </label>
                          <p className="text-xs text-gray-400">
                            {gameConfig.required} titulaires requis • Maximum 2 remplaçants
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-reunion-gold text-sm hover:underline"
                        >
                          Changer d'équipe
                        </button>
                      </div>

                      {/* Selected team info */}
                      <div className="bg-gray-700/50 rounded-lg p-3 mb-4 flex items-center gap-3">
                        {selectedTeam.logo && (
                          <img src={selectedTeam.logo} alt={selectedTeam.name} className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="text-white font-bold">{selectedTeam.name}</p>
                          <p className="text-xs text-gray-400">{selectedTeam.players?.length || 0} joueurs disponibles</p>
                        </div>
                      </div>

                      {/* Selection summary */}
                      <div className="bg-gray-700/30 rounded-lg p-3 mb-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 mb-1">Titulaires</p>
                          <p className={`font-bold ${selectedPlayers.length === gameConfig.required ? 'text-reunion-green' : 'text-reunion-gold'}`}>
                            {selectedPlayers.length} / {gameConfig.required}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Remplaçants</p>
                          <p className="font-bold text-gray-300">
                            {substitutes.length} / 2
                          </p>
                        </div>
                      </div>

                      {/* Player list */}
                      {selectedTeam.players && selectedTeam.players.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedTeam.players.map((player, index) => {
                            // Extraction robuste de l'ID du joueur
                            const playerId = player.playerId?._id 
                              || player.playerId?.userId?._id 
                              || player.userId?._id 
                              || player._id;
                            
                            // Extraction robuste du nom du joueur
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
                            
                            // Extraction du nom en jeu
                            const inGameName = player.playerId?.inGameName || player.inGameName;
                            
                            const isTitular = selectedPlayers.includes(playerId);
                            const isSubstitute = substitutes.includes(playerId);
                            const isSelected = isTitular || isSubstitute;
                            
                            // Debug log pour le premier joueur
                            if (index === 0) {
                              console.log('Player structure:', {
                                player,
                                playerId,
                                playerName,
                                inGameName
                              });
                            }
                            
                            return (
                              <motion.button
                                key={playerId || index}
                                type="button"
                                onClick={() => togglePlayerSelection(playerId)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                  isTitular
                                    ? 'border-reunion-green bg-reunion-green/10'
                                    : isSubstitute
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      isTitular ? 'bg-reunion-green/20' : isSubstitute ? 'bg-blue-500/20' : 'bg-gray-600'
                                    }`}>
                                      {isTitular ? (
                                        <UserCheck className="w-4 h-4 text-reunion-green" />
                                      ) : isSubstitute ? (
                                        <UserPlus className="w-4 h-4 text-blue-400" />
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
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      isTitular ? 'bg-reunion-green/20 text-reunion-green' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                      {isTitular ? 'Titulaire' : 'Remplaçant'}
                                    </span>
                                  )}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Aucun joueur dans cette équipe</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    {step === 2 && (
                      <motion.button
                        type="submit"
                        disabled={isLoading || selectedPlayers.length !== gameConfig?.required}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trophy className="w-5 h-5" />
                            Confirmer l'inscription
                          </>
                        )}
                      </motion.button>
                    )}
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
