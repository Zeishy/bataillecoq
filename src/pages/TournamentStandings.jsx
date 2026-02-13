import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { tournamentService } from '../services/tournamentService';
import StandingsTable from '../components/StandingsTable';

const TournamentStandings = () => {
  const { id } = useParams();
  const [standings, setStandings] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    setRefreshInterval(interval);

    return () => clearInterval(interval);
  }, [id]);

  const fetchData = async () => {
    try {
      const [tournamentRes, standingsRes] = await Promise.all([
        tournamentService.getTournament(id),
        tournamentService.getStandings(id)
      ]);
      
      setTournament(tournamentRes.tournament);
      setStandings(standingsRes.standings || []);
    } catch (error) {
      toast.error('Erreur lors du chargement du classement');
    } finally {
      setIsLoading(false);
    }
  };

  const getPodiumTeams = () => {
    const sorted = [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return 0;
    });
    return sorted.slice(0, 3);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
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

  const podium = getPodiumTeams();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto p-6 space-y-8"
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{tournament.name}</h1>
        <p className="text-gray-600">Classement - {standings.length} équipes</p>
      </div>

      {/* Podium */}
      {podium.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* 2nd place */}
          {podium[1] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-lg p-6 border-2 border-gray-300 text-center"
            >
              <div className="text-5xl mb-3">🥈</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {podium[1].teamId?.name || 'Équipe'}
              </h3>
              <div className="space-y-1 mb-4">
                <p className="text-2xl font-bold text-gray-600">
                  {podium[1].points || 0}
                </p>
                <p className="text-sm text-gray-600">points</p>
              </div>
              <div className="text-xs text-gray-600">
                <p>{podium[1].wins || 0}G - {podium[1].draws || 0}N - {podium[1].losses || 0}P</p>
              </div>
            </motion.div>
          )}

          {/* 1st place */}
          {podium[0] && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-b from-yellow-100 to-yellow-50 rounded-lg p-6 border-4 border-yellow-400 text-center md:order-first"
            >
              <div className="text-6xl mb-3 animate-bounce">🥇</div>
              <h3 className="text-2xl font-bold text-yellow-900 mb-2">
                {podium[0].teamId?.name || 'Équipe'}
              </h3>
              <div className="space-y-1 mb-4">
                <p className="text-3xl font-bold text-yellow-600">
                  {podium[0].points || 0}
                </p>
                <p className="text-sm text-yellow-700">points</p>
              </div>
              <div className="text-xs text-yellow-700">
                <p>{podium[0].wins || 0}G - {podium[0].draws || 0}N - {podium[0].losses || 0}P</p>
              </div>
            </motion.div>
          )}

          {/* 3rd place */}
          {podium[2] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-b from-orange-100 to-orange-50 rounded-lg p-6 border-2 border-orange-300 text-center"
            >
              <div className="text-5xl mb-3">🥉</div>
              <h3 className="text-xl font-bold text-orange-900 mb-2">
                {podium[2].teamId?.name || 'Équipe'}
              </h3>
              <div className="space-y-1 mb-4">
                <p className="text-2xl font-bold text-orange-600">
                  {podium[2].points || 0}
                </p>
                <p className="text-sm text-orange-600">points</p>
              </div>
              <div className="text-xs text-orange-700">
                <p>{podium[2].wins || 0}G - {podium[2].draws || 0}N - {podium[2].losses || 0}P</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Full standings table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg p-6 shadow-md"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-blue-600" />
          Classement Complet
        </h2>
        <StandingsTable standings={standings} tournamentId={id} />
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 space-y-2"
      >
        <p className="font-semibold">Explication du classement:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>P:</strong> Nombre de matchs joués</li>
          <li><strong>G:</strong> Matchs gagnés (+3 points)</li>
          <li><strong>N:</strong> Matchs nuls (+1 point)</li>
          <li><strong>P:</strong> Matchs perdus (0 point)</li>
          <li><strong>Pts:</strong> Points totaux</li>
        </ul>
      </motion.div>

      {/* Auto-refresh indicator */}
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-center text-xs text-gray-500"
      >
        ↻ Auto-refresh chaque 10 secondes
      </motion.div>
    </motion.div>
  );
};

export default TournamentStandings;
