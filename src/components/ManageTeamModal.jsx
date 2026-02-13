import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Trash2, UserMinus, Save, AlertTriangle } from 'lucide-react';
import { teamService } from '../services/teamService';
import toast from 'react-hot-toast';

const ManageTeamModal = ({ isOpen, onClose, team, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState(null);

  useEffect(() => {
    if (team) {
      console.log('Team loaded in ManageTeamModal:', team);
      console.log('Team players:', team.players);
      if (team.players && team.players.length > 0) {
        console.log('First player structure:', team.players[0]);
      }
      setTeamName(team.name || '');
      setTeamLogo(team.logo || '');
      setTeamDescription(team.description || '');
    }
  }, [team]);

  const handleUpdateTeam = async () => {
    if (!teamName.trim()) {
      toast.error('Le nom de l\'équipe est requis');
      return;
    }

    setIsLoading(true);
    try {
      await teamService.updateTeam(team._id, {
        name: teamName,
        logo: teamLogo,
        description: teamDescription
      });
      toast.success('Équipe mise à jour avec succès !');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlayer = async (player) => {
    setIsLoading(true);
    try {
      // DEBUG: Log the complete nested structure
      console.log('=== COMPLETE PLAYER STRUCTURE ===');
      console.log('player:', JSON.stringify(player, null, 2));
      console.log('player.playerId:', player.playerId);
      console.log('player.playerId.userId:', player.playerId?.userId);
      
      // Extract userId from the player object structure
      let userId;
      
      // The userId should be a simple string/ObjectId, not a nested object
      if (typeof player.playerId?.userId === 'string') {
        userId = player.playerId.userId; // userId is directly a string
        console.log('✅ Found userId (string):', userId);
      } else if (player.playerId?.userId?._id) {
        userId = player.playerId.userId._id; // userId is an object with _id
        console.log('✅ Found userId (object._id):', userId);
      } else if (player.userId?._id) {
        userId = player.userId._id;
        console.log('✅ Found userId via userId._id:', userId);
      } else if (player.userId) {
        userId = player.userId;
        console.log('✅ Found userId via userId:', userId);
      } else {
        console.error('❌ Could not extract userId. Full player:', player);
        toast.error('Impossible d\'identifier le joueur. Structure de données invalide.');
        setIsLoading(false);
        return;
      }

      console.log('→ Final userId to send:', userId);
      await teamService.removePlayer(team._id, userId);
      toast.success('Joueur retiré de l\'équipe');
      setPlayerToRemove(null);
      onSuccess?.();
    } catch (error) {
      console.error('❌ Error removing player:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Erreur lors du retrait du joueur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    setIsLoading(true);
    try {
      await teamService.deleteTeam(team._id);
      toast.success('Équipe supprimée avec succès');
      setShowDeleteConfirm(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-dark-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-reunion-green to-reunion-yellow p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Users className="mr-3" size={28} />
              Gérer l'équipe
            </h2>
            <p className="text-white/80 mt-1">{team.name}</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-dark-700">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'general'
                  ? 'text-reunion-green border-b-2 border-reunion-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Informations générales
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'members'
                  ? 'text-reunion-green border-b-2 border-reunion-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Membres ({team.players?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'danger'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Zone dangereuse
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom de l'équipe *
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-reunion-green"
                    placeholder="Nom de l'équipe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Logo (URL)
                  </label>
                  <input
                    type="text"
                    value={teamLogo}
                    onChange={(e) => setTeamLogo(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-reunion-green"
                    placeholder="https://example.com/logo.png"
                  />
                  {teamLogo && (
                    <div className="mt-2">
                      <img
                        src={teamLogo}
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover border-2 border-dark-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-reunion-green resize-none"
                    rows="4"
                    placeholder="Description de l'équipe..."
                  />
                </div>

                <button
                  onClick={handleUpdateTeam}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-reunion-green text-white rounded-lg font-semibold hover:bg-reunion-green/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Save className="mr-2" size={20} />
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                </button>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {team.players && team.players.length > 0 ? (
                  team.players.map((player) => (
                    <div
                      key={player._id || player.playerId}
                      className="bg-dark-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-reunion-green/20 rounded-full flex items-center justify-center">
                          <Users className="text-reunion-green" size={24} />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {player.playerId?.userId?.username || player.userId?.username || 'Joueur'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {player.role || 'Joueur'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPlayerToRemove(player)}
                        className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                      >
                        <UserMinus size={18} />
                        Retirer
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Users size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Aucun joueur dans l'équipe</p>
                  </div>
                )}
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                    <div>
                      <h3 className="text-red-500 font-bold mb-2">Supprimer l'équipe</h3>
                      <p className="text-gray-300 mb-4">
                        Cette action est irréversible. Tous les membres seront retirés et l'équipe sera supprimée définitivement.
                      </p>
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={18} />
                          Supprimer l'équipe
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-red-400 font-semibold">
                            Êtes-vous absolument sûr(e) ? Cette action ne peut pas être annulée.
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={handleDeleteTeam}
                              disabled={isLoading}
                              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {isLoading ? 'Suppression...' : 'Oui, supprimer définitivement'}
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-6 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Remove Player Confirmation Modal */}
        <AnimatePresence>
          {playerToRemove && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-dark-800 rounded-lg p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-white mb-4">Retirer ce joueur ?</h3>
                <p className="text-gray-300 mb-6">
                  Voulez-vous vraiment retirer{' '}
                  <span className="text-reunion-green font-semibold">
                    {playerToRemove.playerId?.userId?.username || playerToRemove.userId?.username || 'ce joueur'}
                  </span>{' '}
                  de l'équipe ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRemovePlayer(playerToRemove)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Retrait...' : 'Retirer'}
                  </button>
                  <button
                    onClick={() => setPlayerToRemove(null)}
                    className="flex-1 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

export default ManageTeamModal;
