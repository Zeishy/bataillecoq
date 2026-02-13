import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Loader, Settings } from 'lucide-react';
import { teamService } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import CreateTeamModal from '../components/CreateTeamModal';
import ManageTeamModal from '../components/ManageTeamModal';
import toast from 'react-hot-toast';

const Teams = () => {
  const { isAuthenticated, user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [teamToManage, setTeamToManage] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningTeamId, setJoiningTeamId] = useState(null);

  const games = ['all', 'valorant', 'lol', 'csgo', 'overwatch', 'rocket-league'];
  const gameLabels = {
    'all': 'Tous les jeux',
    'valorant': 'Valorant',
    'lol': 'League of Legends',
    'csgo': 'CS:GO',
    'overwatch': 'Overwatch',
    'rocket-league': 'Rocket League'
  };

  // Charger les équipes
  useEffect(() => {
    fetchTeams();
  }, [selectedGame]);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const filters = selectedGame !== 'all' ? { game: selectedGame } : {};
      const response = await teamService.getTeams(filters);
      console.log('Teams response:', response);
      setTeams(response.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Impossible de charger les équipes');
      setTeams([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (teamId, e) => {
    e.stopPropagation(); // Prevent opening team details modal
    
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour rejoindre une équipe');
      return;
    }

    setJoiningTeamId(teamId);
    try {
      const response = await teamService.joinTeam(teamId);
      toast.success(response.message || 'Vous avez rejoint l\'équipe !');
      fetchTeams(); // Refresh teams list
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error(error.response?.data?.message || 'Impossible de rejoindre l\'équipe');
    } finally {
      setJoiningTeamId(null);
    }
  };

  const isUserInTeam = (team) => {
    if (!user) return false;
    // Check if user is captain
    if (team.captainId?._id === user._id) return true;
    // Check if user is in players
    return team.players?.some(p => p.playerId?.userId?._id === user._id);
  };

  const isUserCaptain = (team) => {
    if (!user) return false;
    return team.captainId?._id === user._id || team.captainId === user._id;
  };

  const handleManageTeam = (team, e) => {
    e.stopPropagation();
    setTeamToManage(team);
    setShowManageModal(true);
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center">
                <Users className="mr-3 text-reunion-green" size={40} />
                Équipes
              </h1>
              <p className="text-gray-400 text-lg">Explorez les équipes esport de la Réunion</p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 md:mt-0 px-6 py-3 bg-reunion-red hover:bg-reunion-red/80 text-white rounded-lg font-bold transition-colors flex items-center"
              >
                <Plus className="mr-2" size={20} />
                Créer une équipe
              </button>
            )}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une équipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-800 border border-reunion-green/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-reunion-green"
            />
          </div>

          {/* Game Filters */}
          <div className="flex flex-wrap gap-2">
            {games.map(game => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedGame === game
                    ? 'bg-reunion-green text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700 border border-reunion-green/20'
                }`}
              >
                {gameLabels[game]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-reunion-green animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800 rounded-lg border border-reunion-green/20 card-glow p-6 cursor-pointer hover:border-reunion-green/40 transition-all"
                onClick={() => setSelectedTeam(team)}
              >
                <div className="text-center mb-4">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-20 h-20 mx-auto mb-3 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 mx-auto mb-3 bg-dark-700 rounded-lg flex items-center justify-center">
                      <Users size={40} className="text-gray-500" />
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{team.name}</h3>
                  <span className="px-3 py-1 bg-reunion-green/20 text-reunion-green rounded-full text-sm uppercase">
                    {team.game}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Membres</span>
                    <span className="font-bold">{team.players?.length || 0}</span>
                  </div>
                  {team.captainId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Capitaine</span>
                      <span className="font-bold text-reunion-gold">{team.captainId.username}</span>
                    </div>
                  )}
                </div>

                {team.description && (
                  <div className="mt-4 pt-4 border-t border-dark-700">
                    <p className="text-sm text-gray-400 line-clamp-2">{team.description}</p>
                  </div>
                )}

                {/* Join Team Button */}
                <div className="mt-4">
                  {isUserCaptain(team) ? (
                    <button
                      onClick={(e) => handleManageTeam(team, e)}
                      className="w-full px-4 py-2 bg-reunion-yellow text-dark-900 rounded-lg font-semibold transition-all hover:bg-reunion-yellow/80 flex items-center justify-center"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Gérer l'équipe
                    </button>
                  ) : isUserInTeam(team) ? (
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-reunion-green/20 text-reunion-green rounded-lg font-semibold cursor-not-allowed"
                    >
                      Déjà membre
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleJoinTeam(team._id, e)}
                      className="w-full px-4 py-2 bg-reunion-green text-white rounded-lg font-semibold transition-all hover:bg-reunion-green/80 flex items-center justify-center"
                    >
                      {joiningTeamId === team._id ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 text-white animate-spin" />
                          Rejoindre...
                        </>
                      ) : (
                        'Rejoindre l\'équipe'
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredTeams.length === 0 && (
          <div className="text-center py-20">
            <Users size={80} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-2xl font-bold mb-2">Aucune équipe trouvée</h3>
            <p className="text-gray-400">Essayez de modifier vos filtres ou créez une nouvelle équipe</p>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTeams}
      />

      {/* Manage Team Modal */}
      <ManageTeamModal
        isOpen={showManageModal}
        onClose={() => {
          setShowManageModal(false);
          setTeamToManage(null);
        }}
        team={teamToManage}
        onSuccess={fetchTeams}
      />

      {/* Team Detail Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTeam(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-reunion-green/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    {selectedTeam.logo ? (
                      <img
                        src={selectedTeam.logo}
                        alt={selectedTeam.name}
                        className="w-20 h-20 mr-4 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 mr-4 bg-dark-700 rounded-lg flex items-center justify-center">
                        <Users size={40} className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-3xl font-bold mb-1">{selectedTeam.name}</h2>
                      <span className="px-3 py-1 bg-reunion-green/20 text-reunion-green rounded-full text-sm uppercase">
                        {selectedTeam.game}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <motion.span whileHover={{ rotate: 90 }} className="block">
                      ✕
                    </motion.span>
                  </button>
                </div>

                {selectedTeam.description && (
                  <div className="bg-dark-700 p-4 rounded-lg mb-6">
                    <h3 className="font-bold mb-2">Description</h3>
                    <p className="text-gray-400">{selectedTeam.description}</p>
                  </div>
                )}

                <div className="bg-dark-700 p-4 rounded-lg mb-6">
                  <h3 className="font-bold mb-3 flex items-center">
                    <Users className="mr-2" size={18} />
                    Roster ({selectedTeam.players?.length || 0} membres)
                  </h3>
                  <div className="space-y-2">
                    {selectedTeam.players && selectedTeam.players.length > 0 ? (
                      selectedTeam.players.map((player, i) => (
                        <div
                          key={player._id || i}
                          className="flex items-center justify-between py-2 px-3 bg-dark-800 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-reunion-green/20 rounded-full flex items-center justify-center text-sm font-bold">
                              {player.playerId?.userId?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span>{player.playerId?.userId?.username || 'Joueur inconnu'}</span>
                          </div>
                          {player.playerId?.userId?._id === selectedTeam.captainId?._id && (
                            <span className="text-xs px-2 py-1 bg-reunion-gold/20 text-reunion-gold rounded">
                              Capitaine
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-4">
                        Aucun membre dans cette équipe
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teams;
