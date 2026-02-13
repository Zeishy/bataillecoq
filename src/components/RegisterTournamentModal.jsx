import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Users, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { tournamentService } from '../services/tournamentService';
import { teamService } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterTournamentModal({ isOpen, onClose, tournament, onSuccess }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  // Charger les équipes de l'utilisateur pour le jeu du tournoi
  useEffect(() => {
    if (isOpen && tournament) {
      fetchUserTeams();
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

    setIsLoading(true);
    setError('');

    try {
      await tournamentService.registerTeam(tournament._id, selectedTeamId);
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

  const handleClose = () => {
    if (!isLoading) {
      setSelectedTeamId('');
      setError('');
      onClose();
    }
  };

  if (!tournament) return null;

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

                  {/* Team selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sélectionnez votre équipe
                    </label>
                    
                    {/* Debug info */}
                    {user && (
                      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 mb-3 text-xs">
                        <p className="text-blue-400">
                          <strong>Utilisateur connecté:</strong> {user.username} (ID: {user._id})
                        </p>
                        <p className="text-blue-400 mt-1">
                          <strong>Équipes trouvées:</strong> {teams.length} équipe(s) dont vous êtes capitaine
                        </p>
                      </div>
                    )}
                    
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
                            (rt) => rt._id === team._id || rt.team === team._id
                          );
                          
                          return (
                            <motion.button
                              key={team._id}
                              type="button"
                              onClick={() => !isAlreadyRegistered && setSelectedTeamId(team._id)}
                              disabled={isAlreadyRegistered}
                              whileHover={!isAlreadyRegistered ? { scale: 1.02 } : {}}
                              whileTap={!isAlreadyRegistered ? { scale: 0.98 } : {}}
                              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                isAlreadyRegistered
                                  ? 'border-green-500/50 bg-green-500/10 cursor-not-allowed'
                                  : isSelected
                                  ? 'border-red-500 bg-red-500/10'
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
                                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
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
                    <motion.button
                      type="submit"
                      disabled={isLoading || !selectedTeamId || teams.length === 0}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trophy className="w-5 h-5" />
                          S'inscrire
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
