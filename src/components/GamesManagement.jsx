import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import gameService from '../services/gameService';

export default function GamesManagement({ isOpen, onClose }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    playersPerTeam: 5,
    substitutesPerTeam: 1,
    icon: '',
    logo: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchGames();
    }
  }, [isOpen]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await gameService.getAllGamesAdmin();
      setGames(response.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Erreur lors du chargement des jeux');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'playersPerTeam' ? parseInt(value) : value
    }));
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      toast.error('Le nom et la description sont requis');
      return;
    }

    try {
      setLoading(true);
      await gameService.createGame(formData);
      toast.success('Jeu ajouté avec succès!');
      setShowAddModal(false);
      setFormData({ name: '', description: '', playersPerTeam: 5, substitutesPerTeam: 1, icon: '', logo: '' });
      await fetchGames();
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout du jeu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGame = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      toast.error('Le nom et la description sont requis');
      return;
    }

    try {
      setLoading(true);
      await gameService.updateGame(editingGame._id, formData);
      toast.success('Jeu modifié avec succès!');
      setEditingGame(null);
      setFormData({ name: '', description: '', playersPerTeam: 5, substitutesPerTeam: 1, icon: '', logo: '' });
      await fetchGames();
    } catch (error) {
      console.error('Error updating game:', error);
      toast.error(error.message || 'Erreur lors de la modification du jeu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu?')) return;

    try {
      setLoading(true);
      await gameService.deleteGame(gameId);
      toast.success('Jeu supprimé avec succès!');
      await fetchGames();
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error(error.message || 'Erreur lors de la suppression du jeu');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (gameId) => {
    try {
      setLoading(true);
      await gameService.toggleGameStatus(gameId);
      toast.success('Statut du jeu mis à jour!');
      await fetchGames();
    } catch (error) {
      console.error('Error toggling game status:', error);
      toast.error('Erreur lors de la modification du statut');
    } finally {
      setLoading(false);
    }
  };

  const startEditingGame = (game) => {
    setEditingGame(game);
    setFormData({
      name: game.name,
      description: game.description,
      playersPerTeam: game.playersPerTeam,
      substitutesPerTeam: game.substitutesPerTeam || 1,
      icon: game.icon || '',
      logo: game.logo || ''
    });
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingGame(null);
    setFormData({ name: '', description: '', playersPerTeam: 5, substitutesPerTeam: 1, icon: '', logo: '' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        />

        {/* Main Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-dark-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 border border-reunion-green/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-dark-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Gestion des jeux</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {/* Add Game Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="mb-6 flex items-center gap-2 px-4 py-2 bg-reunion-green hover:bg-reunion-green/80 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter un jeu
              </button>

              {/* Games List */}
              {loading && !games.length ? (
                <div className="text-center py-8 text-gray-400">
                  Chargement...
                </div>
              ) : games.length > 0 ? (
                <div className="grid gap-4">
                  {games.map((game) => (
                    <div
                      key={game._id}
                      className="bg-dark-700 rounded-lg p-4 flex items-center justify-between hover:bg-dark-600 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {game.icon && (
                          <span className="text-3xl">{game.icon}</span>
                        )}
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg">{game.name}</h3>
                          <p className="text-gray-400 text-sm">{game.description}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {game.playersPerTeam} joueurs {game.substitutesPerTeam > 0 && `+ ${game.substitutesPerTeam} remplaçant${game.substitutesPerTeam > 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(game._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            game.isActive
                              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                              : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400'
                          }`}
                          title={game.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {game.isActive ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => startEditingGame(game)}
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-semibold text-sm transition-colors"
                        >
                          Modifier
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteGame(game._id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Aucun jeu ajouté pour le moment
                </div>
              )}
            </div>
          </motion.div>

          {/* Add/Edit Game Modal */}
          <AnimatePresence>
            {(showAddModal || editingGame) && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeModals}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                />

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-dark-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-reunion-green/30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="p-6 border-b border-dark-700 flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">
                        {editingGame ? 'Modifier le jeu' : 'Ajouter un nouveau jeu'}
                      </h3>
                      <button
                        onClick={closeModals}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={editingGame ? handleUpdateGame : handleAddGame} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nom du jeu *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Ex: Valorant"
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-reunion-green"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Décrivez le jeu..."
                          rows="3"
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-reunion-green"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Joueurs par équipe
                          </label>
                          <input
                            type="number"
                            name="playersPerTeam"
                            value={formData.playersPerTeam}
                            onChange={handleInputChange}
                            min="1"
                            max="20"
                            className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-reunion-green"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Remplaçants par équipe
                          </label>
                          <input
                            type="number"
                            name="substitutesPerTeam"
                            value={formData.substitutesPerTeam}
                            onChange={handleInputChange}
                            min="0"
                            max="10"
                            className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-reunion-green"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Icône/Emoji
                          </label>
                          <input
                            type="text"
                            name="icon"
                            value={formData.icon}
                            onChange={handleInputChange}
                            placeholder="Ex: 🎮"
                            className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-reunion-green"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          URL Logo
                        </label>
                        <input
                          type="url"
                          name="logo"
                          value={formData.logo}
                          onChange={handleInputChange}
                          placeholder="https://..."
                          className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-reunion-green"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={closeModals}
                          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-reunion-green hover:bg-reunion-green/80 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                          {loading ? 'En cours...' : editingGame ? 'Mettre à jour' : 'Ajouter'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </>
    </AnimatePresence>
  );
}
