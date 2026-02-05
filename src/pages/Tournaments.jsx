import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Filter, Users, Calendar, DollarSign, Loader, X } from 'lucide-react';
import { tournamentService } from '../services/tournamentService';
import { useAuth } from '../context/AuthContext';
import RegisterTournamentModal from '../components/RegisterTournamentModal';
import TournamentDetailModal from '../components/TournamentDetailModal';
import toast from 'react-hot-toast';

const Tournaments = () => {
  const { isAuthenticated } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [tournamentToRegister, setTournamentToRegister] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const games = ['all', 'valorant', 'lol', 'csgo', 'overwatch', 'rocket-league'];
  const gameLabels = {
    'all': 'Tous les jeux',
    'valorant': 'Valorant',
    'lol': 'League of Legends',
    'csgo': 'CS:GO',
    'overwatch': 'Overwatch',
    'rocket-league': 'Rocket League'
  };
  
  const statuses = [
    { value: 'all', label: 'Tous' },
    { value: 'upcoming', label: 'À venir' },
    { value: 'ongoing', label: 'En cours' },
    { value: 'completed', label: 'Terminés' }
  ];

  // Charger les tournois
  useEffect(() => {
    fetchTournaments();
  }, [selectedGame, selectedStatus]);

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (selectedGame !== 'all') filters.game = selectedGame;
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      
      const response = await tournamentService.getTournaments(filters);
      console.log('Tournaments response:', response);
      setTournaments(response.tournaments || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Impossible de charger les tournois');
      setTournaments([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = (tournament) => {
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour vous inscrire');
      return;
    }
    setTournamentToRegister(tournament);
    setShowRegisterModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      ongoing: 'bg-reunion-green/20 text-reunion-green border-reunion-green/30',
      upcoming: 'bg-reunion-blue/20 text-reunion-blue border-reunion-blue/30',
      completed: 'bg-gray-600/20 text-gray-400 border-gray-600/30'
    };
    const labels = {
      ongoing: 'En cours',
      upcoming: 'À venir',
      completed: 'Terminé'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
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
            <Trophy className="mr-3 text-reunion-gold" size={40} />
            Tournois
          </h1>
          <p className="text-gray-400 text-lg">Découvrez et participez aux tournois esport de la Réunion</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-dark-800 p-6 rounded-lg border border-reunion-red/20"
        >
          <div className="flex items-center mb-4">
            <Filter className="mr-2 text-reunion-gold" size={20} />
            <h2 className="text-xl font-bold">Filtres</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Game Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Jeu</label>
              <div className="flex flex-wrap gap-2">
                {games.map(game => (
                  <button
                    key={game}
                    onClick={() => setSelectedGame(game)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedGame === game
                        ? 'bg-reunion-red text-white'
                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                    }`}
                  >
                    {gameLabels[game]}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Statut</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(status => (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedStatus === status.value
                        ? 'bg-reunion-gold text-dark-900'
                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tournaments Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-reunion-gold animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <Trophy size={80} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-2xl font-bold mb-2">Aucun tournoi trouvé</h3>
            <p className="text-gray-400">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800 rounded-lg overflow-hidden border border-reunion-blue/20 card-glow cursor-pointer hover:border-reunion-blue/40 transition-all"
                onClick={() => setSelectedTournament(tournament)}
              >
                <div className="h-48 bg-gradient-to-br from-reunion-red/30 to-reunion-blue/30 flex items-center justify-center relative">
                  <Trophy size={80} className="text-reunion-gold opacity-50" />
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(tournament.status)}
                  </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-reunion-blue/20 text-reunion-blue rounded-full text-sm font-medium uppercase">
                    {tournament.game}
                  </span>
                  <span className="text-reunion-gold font-bold text-lg">{tournament.prizePool}€</span>
                </div>
                
                <h3 className="text-xl font-bold mb-4">{tournament.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-400">
                    <Calendar size={16} className="mr-2" />
                    <span className="text-sm">
                      {new Date(tournament.startDate).toLocaleDateString('fr-FR')}
                      {' - '}
                      {new Date(tournament.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Users size={16} className="mr-2" />
                    <span className="text-sm">
                      {tournament.registeredTeams?.length || 0}/{tournament.maxTeams} équipes
                    </span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <DollarSign size={16} className="mr-2" />
                    <span className="text-sm">Prize Pool: {tournament.prizePool}€</span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tournament.status === 'upcoming') {
                      handleRegister(tournament);
                    }
                  }}
                  className={`w-full py-2 rounded-lg font-bold transition-colors ${
                    tournament.status === 'upcoming'
                      ? 'bg-reunion-red hover:bg-reunion-red/80 text-white'
                      : tournament.status === 'ongoing'
                      ? 'bg-reunion-green hover:bg-reunion-green/80 text-white'
                      : 'bg-dark-700 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={tournament.status === 'completed'}
                >
                  {tournament.status === 'upcoming' ? "S'inscrire" : 
                   tournament.status === 'ongoing' ? 'Voir détails' : 
                   'Terminé'}
                </button>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <RegisterTournamentModal
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          setTournamentToRegister(null);
        }}
        tournament={tournamentToRegister}
        onSuccess={fetchTournaments}
      />

      {/* Tournament Detail Modal */}
      <TournamentDetailModal
        isOpen={!!selectedTournament}
        onClose={() => setSelectedTournament(null)}
        tournament={selectedTournament}
        onRegister={() => {
          if (isAuthenticated) {
            setTournamentToRegister(selectedTournament);
            setShowRegisterModal(true);
            setSelectedTournament(null);
          } else {
            toast.error('Vous devez être connecté pour vous inscrire');
          }
        }}
      />
    </div>
  );
};

export default Tournaments;
