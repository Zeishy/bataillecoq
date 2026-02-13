import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';

const StandingsTable = ({ standings, tournamentId }) => {
  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Aucun classement disponible</p>
      </div>
    );
  }

  const getPodiumColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-300';
      case 2:
        return 'bg-gray-50 border-gray-300';
      case 3:
        return 'bg-orange-50 border-orange-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  // Sorted standings
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Desktop Table view */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full bg-white">
          <thead className="bg-gray-50">
            <tr className="border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Rang</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Équipe</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">J</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">G</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">N</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">P</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((standing, index) => (
              <motion.tr
                key={standing.teamId?._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-b border-gray-200 hover:bg-gray-50 transition ${getPodiumColor(
                  index + 1
                )}`}
              >
                <td className="px-4 py-3 text-center font-bold text-lg">
                  {getRankIcon(index + 1)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {standing.teamId?.logo && (
                      <img
                        src={standing.teamId.logo}
                        alt={standing.teamId.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-semibold text-gray-900">
                      {standing.teamId?.name || 'Équipe'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {(standing.wins || 0) + (standing.losses || 0) + (standing.draws || 0)}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-green-600">
                  {standing.wins || 0}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-blue-600">
                  {standing.draws || 0}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-red-600">
                  {standing.losses || 0}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg">
                    {standing.points || 0}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {sortedStandings.map((standing, index) => (
          <motion.div
            key={standing.teamId?._id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border-2 ${getPodiumColor(index + 1)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-gray-700">
                  {getRankIcon(index + 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {standing.teamId?.logo && (
                      <img
                        src={standing.teamId.logo}
                        alt={standing.teamId.name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <p className="font-bold text-gray-900">
                      {standing.teamId?.name || 'Équipe'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    {(standing.wins || 0) + (standing.losses || 0) + (standing.draws || 0)} matchs
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {standing.points || 0}
                </p>
                <p className="text-xs text-gray-600">pts</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-green-100 text-green-800 p-2 rounded">
                <p className="font-bold">{standing.wins || 0}</p>
                <p>Gagnés</p>
              </div>
              <div className="bg-blue-100 text-blue-800 p-2 rounded">
                <p className="font-bold">{standing.draws || 0}</p>
                <p>Nuls</p>
              </div>
              <div className="bg-red-100 text-red-800 p-2 rounded">
                <p className="font-bold">{standing.losses || 0}</p>
                <p>Perdus</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default StandingsTable;
