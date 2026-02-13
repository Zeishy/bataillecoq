import { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const TournamentBracket = ({ bracket, onMatchClick }) => {
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Aucun bracket disponible
      </div>
    );
  }

  const getRoundColor = (roundIndex, totalRounds) => {
    if (roundIndex === totalRounds - 1) return 'bg-reunion-gold/10 border-reunion-gold/30';
    if (roundIndex === totalRounds - 2) return 'bg-blue-500/10 border-blue-500/30';
    if (roundIndex === totalRounds - 3) return 'bg-reunion-green/10 border-reunion-green/30';
    return 'bg-dark-700 border-dark-600';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-reunion-green';
      case 'ongoing':
        return 'bg-blue-400';
      case 'pending':
        return 'bg-gray-500';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-dark-800 rounded-lg shadow-lg p-6 border border-dark-700">
      <div className="flex gap-8 min-w-max">
        {bracket.rounds.map((round, roundIndex) => (
          <div key={round.round} className="flex flex-col gap-4 min-w-[280px]">
            {/* Round Header */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white">{round.name}</h3>
              <p className="text-sm text-gray-400">Round {round.round}</p>
            </div>

            {/* Byes (if any) */}
            {round.byes && round.byes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2 text-center">Exemptés</p>
                {round.byes.map((team, idx) => (
                  <div
                    key={idx}
                    className="bg-reunion-gold/10 border border-reunion-gold/30 rounded-lg p-2 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      {team.logo && (
                        <img src={team.logo} alt={team.name} className="w-6 h-6 rounded" />
                      )}
                      <span className="text-sm font-medium text-white">{team.name}</span>
                      <span className="ml-auto text-xs text-reunion-gold">BYE</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Matches */}
            <div className="flex flex-col gap-4">
              {round.matches.map((match, matchIndex) => (
                <motion.div
                  key={`${round.round}-${matchIndex}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: roundIndex * 0.1 + matchIndex * 0.05 }}
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md hover:shadow-reunion-green/20 ${getRoundColor(roundIndex, bracket.rounds.length)}`}
                  onClick={() => onMatchClick?.(match)}
                  style={{
                    marginTop: roundIndex > 0 ? `${matchIndex * 2 * (40 / Math.pow(2, roundIndex - 1))}px` : 0
                  }}
                >
                  {/* Match Header */}
                  <div className="bg-dark-600 px-3 py-1 border-b border-dark-500 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300">
                      Match {match.matchId ? `#${match.position + 1}` : 'TBD'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(match.status)}`} />
                  </div>

                  {/* Team 1 */}
                  <div className={`p-3 flex items-center justify-between ${match.winner === match.team1?._id ? 'bg-reunion-green/20' : ''}`}>
                    <div className="flex items-center gap-2 flex-1">
                      {match.team1?.logo && (
                        <img src={match.team1.logo} alt={match.team1.name} className="w-6 h-6 rounded" />
                      )}
                      <span className={`text-sm ${match.team1?.name === 'TBD' ? 'text-gray-500 italic' : 'font-medium text-white'}`}>
                        {match.team1?.name || 'TBD'}
                      </span>
                    </div>
                    {match.team1?.score !== undefined && (
                      <span className="text-lg font-bold text-white ml-2">{match.team1.score}</span>
                    )}
                    {match.winner === match.team1?._id && (
                      <Trophy className="w-4 h-4 text-reunion-gold ml-2" />
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dark-600"></div>

                  {/* Team 2 */}
                  <div className={`p-3 flex items-center justify-between ${match.winner === match.team2?._id ? 'bg-reunion-green/20' : ''}`}>
                    <div className="flex items-center gap-2 flex-1">
                      {match.team2?.logo && (
                        <img src={match.team2.logo} alt={match.team2.name} className="w-6 h-6 rounded" />
                      )}
                      <span className={`text-sm ${match.team2?.name === 'TBD' ? 'text-gray-500 italic' : 'font-medium text-white'}`}>
                        {match.team2?.name || 'TBD'}
                      </span>
                    </div>
                    {match.team2?.score !== undefined && (
                      <span className="text-lg font-bold text-white ml-2">{match.team2.score}</span>
                    )}
                    {match.winner === match.team2?._id && (
                      <Trophy className="w-4 h-4 text-reunion-gold ml-2" />
                    )}
                  </div>

                  {/* Match Footer */}
                  {match.scheduledDate && (
                    <div className="bg-dark-600 px-3 py-1 border-t border-dark-500 flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(match.scheduledDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-4 border-t border-dark-700 flex gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-reunion-green"></div>
          <span>Terminé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span>En cours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span>En attente</span>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;
