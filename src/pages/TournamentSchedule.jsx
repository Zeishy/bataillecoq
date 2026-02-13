import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { tournamentService } from '../services/tournamentService';

const TournamentSchedule = () => {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tournamentRes, matchesRes] = await Promise.all([
        tournamentService.getTournament(id),
        tournamentService.getMatches(id)
      ]);
      setTournament(tournamentRes.tournament);
      setMatches(matchesRes.matches || []);
    } catch (error) {
      toast.error('Erreur lors du chargement du schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'ongoing':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMatches = filterStatus === 'all' 
    ? matches 
    : matches.filter(m => m.status === filterStatus);

  const groupedByRound = filteredMatches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <Trophy className="w-8 h-8 text-blue-600" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Tournoi non trouvé</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{tournament.name}</h1>
        <p className="text-gray-600">Schedule - {filteredMatches.length} matchs</p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'ongoing', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'all' ? 'Tous' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Matches by round */}
      <div className="space-y-8">
        {Object.entries(groupedByRound)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([round, roundMatches]) => (
            <motion.div
              key={round}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-bold text-blue-600 mb-4">
                Round {round}
              </h2>

              {roundMatches.map((match, index) => (
                <motion.div
                  key={match._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition"
                >
                  {/* Match Info - Desktop */}
                  <div className="hidden md:grid grid-cols-4 gap-4 items-center">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {formatDate(match.scheduledDate)}
                      </span>
                    </div>

                    {/* Teams & Scores */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-right">
                          {match.team1.teamId?.name || 'Équipe 1'}
                        </p>
                        <p className="text-xs text-gray-500 text-right">
                          {match.team1.teamId?.logo && (
                            <img
                              src={match.team1.teamId.logo}
                              alt="team1"
                              className="w-6 h-6 inline-block"
                            />
                          )}
                        </p>
                      </div>

                      <div className="text-center font-bold text-lg px-3 py-2 bg-gray-100 rounded">
                        {match.team1.score} - {match.team2.score}
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold text-left">
                          {match.team2.teamId?.name || 'Équipe 2'}
                        </p>
                        <p className="text-xs text-gray-500 text-left">
                          {match.team2.teamId?.logo && (
                            <img
                              src={match.team2.teamId.logo}
                              alt="team2"
                              className="w-6 h-6 inline-block"
                            />
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Winner (if completed) */}
                    {match.status === 'completed' && match.winner && (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-semibold">
                          <Trophy className="w-4 h-4" />
                          Winner
                        </div>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(
                          match.status
                        )}`}
                      >
                        {getStatusLabel(match.status)}
                      </span>
                    </div>
                  </div>

                  {/* Match Info - Mobile */}
                  <div className="md:hidden space-y-3">
                    {/* Status & Date */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(
                          match.status
                        )}`}
                      >
                        {getStatusLabel(match.status)}
                      </span>
                      <div className="flex items-center gap-1 text-gray-600 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatDate(match.scheduledDate)}
                      </div>
                    </div>

                    {/* Teams & Score */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-semibold">{match.team1.teamId?.name || 'Équipe 1'}</span>
                        <span className="text-xl font-bold">{match.team1.score}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-semibold">{match.team2.teamId?.name || 'Équipe 2'}</span>
                        <span className="text-xl font-bold">{match.team2.score}</span>
                      </div>
                    </div>

                    {/* Winner */}
                    {match.status === 'completed' && match.winner && (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-semibold">
                          <Trophy className="w-4 h-4" />
                          {match.winner.name || 'Winner'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player stats if completed */}
                  {match.status === 'completed' && match.playerStats && match.playerStats.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Stats Joueurs
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {match.playerStats.slice(0, 4).map((stat, idx) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded">
                            <p className="font-semibold truncate">
                              {stat.playerId?.username || 'Player'}
                            </p>
                            <p className="text-gray-600">
                              K: {stat.kills} D: {stat.deaths} A: {stat.assists}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ))}
      </div>

      {/* Empty state */}
      {filteredMatches.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Aucun match pour ce filtre</p>
        </div>
      )}
    </motion.div>
  );
};

export default TournamentSchedule;
