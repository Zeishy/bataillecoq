import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import matchService from '../services/matchService';

const PlayerSelectionModal = ({ match, onClose, onSuccess }) => {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(false);

  const gamePlayerRequirements = {
    valorant: 5,
    lol: 5,
    csgo: 5,
    overwatch: 6,
    'rocket-league': 3,
    cod: 4,
    'call-of-duty': 4
  };

  // Déterminer l'équipe du capitaine
  useEffect(() => {
    if (!match) return;
    
    // À déterminer via currentUser - pour maintenant, on prend team1
    const teamId = match.team1?.teamId?._id || match.team1?.teamId;
    setSelectedTeamId(teamId);
    
    // Charger les joueurs déjà sélectionnés pour ce match
    if (match.team1?.selectedPlayers && Array.isArray(match.team1.selectedPlayers)) {
      setSelectedPlayers(match.team1.selectedPlayers.map(p => p._id || p));
    } else {
      setSelectedPlayers([]);
    }
  }, [match]);

  const getTeamData = () => {
    if (selectedTeamId === match.team1?.teamId?._id) {
      return match.team1?.teamId;
    } else if (selectedTeamId === match.team2?.teamId?._id) {
      return match.team2?.teamId;
    }
    return match.team1?.teamId;
  };

  const team = getTeamData();
  const requiredPlayers = gamePlayerRequirements[match?.tournamentId?.game] || 5;

  const handlePlayerToggle = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        if (prev.length < requiredPlayers) {
          return [...prev, playerId];
        } else {
          toast.error(`Vous ne pouvez sélectionner que ${requiredPlayers} joueurs`);
          return prev;
        }
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedPlayers.length !== requiredPlayers) {
      toast.error(`Vous devez sélectionner exactement ${requiredPlayers} joueurs`);
      return;
    }

    try {
      setLoading(true);
      await matchService.selectPlayers(match._id, selectedTeamId, selectedPlayers);
      toast.success('Joueurs sélectionnés avec succès!');
      onSuccess(selectedPlayers);
    } catch (error) {
      console.error('Error selecting players:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sélection des joueurs');
    } finally {
      setLoading(false);
    }
  };

  if (!match || !team) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{team?.name || 'Équipe'}</h2>
            <p className="text-sm text-slate-400 mt-1">
              Sélectionnez {requiredPlayers} joueurs pour le match
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Selection Counter */}
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300">
                  Joueurs sélectionnés: <span className="font-bold">{selectedPlayers.length}/{requiredPlayers}</span>
                </span>
              </div>
              <div className="text-sm text-blue-300">
                {selectedPlayers.length === requiredPlayers && (
                  <span className="text-green-400">✓ Sélection complète</span>
                )}
              </div>
            </div>
          </div>

          {/* Players Grid */}
          <div className="space-y-2">
            {team?.players && team.players.length > 0 ? (
              team.players.map(player => {
                // Les IDs stockés dans le tournoi peuvent être playerId._id ou userId._id
                // On essaie les deux possibilités
                const playerId = player.playerId?._id;
                const userId = player.playerId?.userId?._id;
                // Utiliser playerId d'abord, puis userId comme fallback
                const idToUse = playerId || userId || player._id;
                
                const playerName = player.playerId?.userId?.username || player.username || 'Joueur inconnu';
                const playerRole = player.role || 'Joueur';
                const isSelected = selectedPlayers.includes(idToUse);
                
                return (
                  <motion.button
                    key={idToUse}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlayerToggle(idToUse)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-green-500/20 border-green-500'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
                        {playerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-semibold ${isSelected ? 'text-green-400' : 'text-white'}`}>
                          {playerName}
                        </p>
                        <p className="text-xs text-slate-400">{playerRole}</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{
                        scale: isSelected ? 1 : 0.8,
                        opacity: isSelected ? 1 : 0.5
                      }}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-green-500 border-green-500' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </motion.div>
                  </motion.button>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>Aucun joueur dans l'équipe</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedPlayers.length !== requiredPlayers}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                Validation...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Valider la sélection
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerSelectionModal;
