import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, Trophy, Users, DollarSign, Save, X, Eye, Gamepad2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import tournamentService from '../services/tournamentService';
import gameService from '../services/gameService';
import { getMapPoolsByGame } from '../services/mapPoolService';
import GamesManagement from '../components/GamesManagement';
import PickAndBanModal from '../components/PickAndBanModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminTournaments = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [mapPools, setMapPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [showPickAndBanModal, setShowPickAndBanModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    game: '',
    description: '',
    startDate: '',
    endDate: '',
    maxTeams: 8,
    prizePool: 0,
    rules: '',
    format: 'single-elimination',
    mapPoolId: '',
    matchFormat: 'bo3',
    finalFormat: 'bo5'
  });

  const formatOptions = [
    { value: 'single-elimination', label: 'Simple élimination' },
    { value: 'double-elimination', label: 'Double élimination' },
    { value: 'round-robin', label: 'Round Robin' },
    { value: 'swiss', label: 'Swiss' }
  ];

  useEffect(() => {
    fetchTournaments();
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const data = await gameService.getAllGames();
      setGames(data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Erreur lors du chargement des jeux');
    }
  };

  const fetchTournaments = async () => {
    try {
      const data = await tournamentService.getTournaments();
      setTournaments(data.tournaments);
    } catch (error) {
      toast.error('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (tournament = null) => {
    if (tournament) {
      setEditingTournament(tournament);
      setFormData({
        name: tournament.name,
        game: tournament.game,
        description: tournament.description,
        startDate: tournament.startDate ? tournament.startDate.split('T')[0] : '',
        endDate: tournament.endDate ? tournament.endDate.split('T')[0] : '',
        maxTeams: tournament.maxTeams,
        prizePool: tournament.prizePool || 0,
        rules: tournament.rules || '',
        format: tournament.format,
        mapPoolId: tournament.mapPoolId || '',
        matchFormat: tournament.matchFormat || 'bo3',
        finalFormat: tournament.finalFormat || 'bo5'
      });
      
      // Charger les map pools pour ce jeu
      if (tournament.game) {
        try {
          const pools = await getMapPoolsByGame(tournament.game);
          setMapPools(pools || []);
        } catch (error) {
          console.error('Error loading map pools:', error);
          setMapPools([]);
        }
      }
    } else {
      setEditingTournament(null);
      setFormData({
        name: '',
        game: '',
        description: '',
        startDate: '',
        endDate: '',
        maxTeams: 8,
        prizePool: 0,
        rules: '',
        format: 'single-elimination',
        mapPoolId: '',
        matchFormat: 'bo3',
        finalFormat: 'bo5'
      });
      setMapPools([]); // Réinitialiser les map pools
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTournament(null);
    setFormData({
      name: '',
      game: '',
      description: '',
      startDate: '',
      endDate: '',
      maxTeams: 8,
      prizePool: 0,
      rules: '',
      format: 'single-elimination'
    });
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxTeams' || name === 'prizePool' ? Number(value) : value
    }));

    // Si on change le jeu, charger les map pools pour ce jeu
    if (name === 'game' && value) {
      try {
        const pools = await getMapPoolsByGame(value);
        setMapPools(pools || []);
        // Réinitialiser le mapPoolId quand on change de jeu
        setFormData(prev => ({
          ...prev,
          mapPoolId: ''
        }));
      } catch (error) {
        console.error('Error loading map pools:', error);
        setMapPools([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.game || !formData.startDate || !formData.endDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    try {
      // Préparer les données pour l'envoi
      const submitData = {
        name: formData.name || '',
        game: formData.game || '',
        description: formData.description || '',
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        maxTeams: formData.maxTeams || 8,
        prizePool: String(formData.prizePool || '0'),
        rules: formData.rules || '',
        format: formData.format || 'single-elimination',
        mapPoolId: formData.mapPoolId || null,
        matchFormat: formData.matchFormat || 'bo3',
        finalFormat: formData.finalFormat || 'bo5'
      };

      console.log('Submitting tournament data:', submitData);

      if (editingTournament) {
        await tournamentService.updateTournament(editingTournament._id, submitData);
        toast.success('Tournoi mis à jour avec succès !');
      } else {
        await tournamentService.createTournament(submitData);
        toast.success('Tournoi créé avec succès !');
      }
      handleCloseModal();
      fetchTournaments();
    } catch (error) {
      console.error('Tournament submission error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du tournoi');
    }
  };

  const handleDelete = async (tournamentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) {
      return;
    }

    try {
      await tournamentService.deleteTournament(tournamentId);
      toast.success('Tournoi supprimé avec succès !');
      fetchTournaments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du tournoi');
    }
  };

  const getStatusBadge = (tournament) => {
    const now = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);

    let status = tournament.status;
    let color = 'bg-gray-500';

    if (tournament.status === 'cancelled') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">Annulé</span>;
    }

    if (now < start) {
      status = 'À venir';
      color = 'bg-blue-500/20 text-blue-400';
    } else if (now >= start && now <= end) {
      status = 'En cours';
      color = 'bg-green-500/20 text-green-400';
    } else {
      status = 'Terminé';
      color = 'bg-gray-500/20 text-gray-400';
    }

    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-3">Gestion des Tournois</h1>
            <p className="text-gray-400 text-lg">Créer et gérer les tournois de la plateforme</p>
          </div>

          {/* Action Buttons - Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* Games Management Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowGamesModal(true)}
              className="group relative flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-purple-600/20 to-purple-900/20 hover:from-purple-600/30 hover:to-purple-900/30 border border-purple-500/30 hover:border-purple-400/60 rounded-xl font-semibold transition-all duration-300"
              title="Gérer les jeux disponibles"
            >
              <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                <Gamepad2 className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-sm">Gestion des Jeux</p>
                <p className="text-gray-400 text-xs mt-1">Ajouter et modifier</p>
              </div>
              <div className="absolute inset-0 bg-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
            </motion.button>

            {/* Pick and Ban Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPickAndBanModal(true)}
              className="group relative flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 hover:from-yellow-600/30 hover:to-yellow-900/30 border border-yellow-500/30 hover:border-yellow-400/60 rounded-xl font-semibold transition-all duration-300"
              title="Gérer les pick and ban"
            >
              <div className="p-3 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-sm">Pick & Ban</p>
                <p className="text-gray-400 text-xs mt-1">Maps et formats</p>
              </div>
              <div className="absolute inset-0 bg-yellow-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
            </motion.button>

            {/* Create Tournament Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenModal()}
              className="group relative flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-reunion-green/20 to-reunion-green/10 hover:from-reunion-green/30 hover:to-reunion-green/20 border border-reunion-green/40 hover:border-reunion-green/70 rounded-xl font-semibold transition-all duration-300"
            >
              <div className="p-3 bg-reunion-green/20 rounded-lg group-hover:bg-reunion-green/30 transition-colors">
                <Plus className="w-6 h-6 text-reunion-green" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-sm">Créer un Tournoi</p>
                <p className="text-gray-400 text-xs mt-1">Nouveau tournoi</p>
              </div>
              <div className="absolute inset-0 bg-reunion-green/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
            </motion.button>
          </div>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <motion.div
              key={tournament._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden hover:border-primary-600 transition-colors"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{tournament.name}</h3>
                    <p className="text-sm text-gray-400 uppercase font-semibold">{tournament.game}</p>
                  </div>
                  {getStatusBadge(tournament)}
                </div>

                {/* Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span className="text-sm">
                      {format(new Date(tournament.startDate), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4 text-primary-500" />
                    <span className="text-sm">
                      {tournament.registeredTeams?.length || 0}/{tournament.maxTeams} équipes
                    </span>
                  </div>
                  {tournament.prizePool > 0 && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <DollarSign className="w-4 h-4 text-primary-500" />
                      <span className="text-sm">{tournament.prizePool.toLocaleString()} €</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-300">
                    <Trophy className="w-4 h-4 text-primary-500" />
                    <span className="text-sm capitalize">{tournament.format.replace('-', ' ')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-dark-700">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/admin/tournaments/${tournament._id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Gérer
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenModal(tournament)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(tournament._id)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {tournaments.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Aucun tournoi pour le moment</p>
            <p className="text-gray-500 text-sm mt-2">Créez votre premier tournoi !</p>
          </div>
        )}
      </div>

      {/* Modal Create/Edit Tournament */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 rounded-lg border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingTournament ? 'Modifier le tournoi' : 'Créer un tournoi'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom du tournoi *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="Ex: Championship Spring 2024"
                  />
                </div>

                {/* Game */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Jeu *
                  </label>
                  <select
                    name="game"
                    value={formData.game}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Sélectionner un jeu</option>
                    {games.map(game => (
                      <option key={game._id} value={game.slug}>
                        {game.icon && `${game.icon} `}{game.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="Description du tournoi..."
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date de fin *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Max Teams & Prize Pool */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre max d'équipes *
                    </label>
                    <input
                      type="number"
                      name="maxTeams"
                      value={formData.maxTeams}
                      onChange={handleChange}
                      min="2"
                      max="64"
                      required
                      className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prize Pool (€)
                    </label>
                    <input
                      type="number"
                      name="prizePool"
                      value={formData.prizePool}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Format *
                  </label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    {formatOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pick and Ban Settings */}
                <div className="border border-dashed border-purple-500/30 rounded-lg p-4 bg-purple-500/10">
                  <h3 className="text-lg font-bold text-purple-400 mb-4">⚡ Paramètres Pick & Ban</h3>
                  
                  {/* Map Pool */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Map Pool
                    </label>
                    <select
                      name="mapPoolId"
                      value={formData.mapPoolId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="">-- Pas de Pick & Ban --</option>
                      {mapPools.map(pool => (
                        <option key={pool._id} value={pool._id}>
                          {pool.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Optionnel - Si non défini, pas de pick & ban</p>
                  </div>

                  {/* Match Format & Final Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Format des matchs
                      </label>
                      <select
                        name="matchFormat"
                        value={formData.matchFormat}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                      >
                        <option value="bo1">BO1</option>
                        <option value="bo3">BO3</option>
                        <option value="bo5">BO5</option>
                        <option value="bo7">BO7</option>
                        <option value="bo9">BO9</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Format de la finale
                      </label>
                      <select
                        name="finalFormat"
                        value={formData.finalFormat}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                      >
                        <option value="bo1">BO1</option>
                        <option value="bo3">BO3</option>
                        <option value="bo5">BO5</option>
                        <option value="bo7">BO7</option>
                        <option value="bo9">BO9</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rules */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Règlement
                  </label>
                  <textarea
                    name="rules"
                    value={formData.rules}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="Règles du tournoi..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {editingTournament ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Games Management Modal */}
      <GamesManagement 
        isOpen={showGamesModal} 
        onClose={() => {
          setShowGamesModal(false);
          fetchGames(); // Refresh games after closing
        }}
      />

      {/* Pick and Ban Modal */}
      <PickAndBanModal
        isOpen={showPickAndBanModal}
        onClose={() => setShowPickAndBanModal(false)}
        games={games}
        onSelectMapPool={(mapPool) => {
          toast.success(`Map pool "${mapPool.name}" sélectionné`);
        }}
      />
    </div>
  );
};

export default AdminTournaments;
