import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getMaxWins,
  isMatchComplete,
  getWinner,
  isValidScore,
  formatScoreDisplay
} from '../utils/matchFormat';

const MatchScorePanel = ({ match, team1, team2, matchFormat, onScoreUpdate, isAdmin = false }) => {
  const [team1Score, setTeam1Score] = useState(match?.team1Score || 0);
  const [team2Score, setTeam2Score] = useState(match?.team2Score || 0);
  const [isComplete, setIsComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const maxWins = getMaxWins(matchFormat);

  useEffect(() => {
    if (match) {
      setTeam1Score(match.team1Score || 0);
      setTeam2Score(match.team2Score || 0);
      const w = getWinner(match.team1Score || 0, match.team2Score || 0, matchFormat);
      setWinner(w);
      setIsComplete(isMatchComplete(match.team1Score || 0, match.team2Score || 0, matchFormat));
    }
  }, [match, matchFormat]);

  const handleScoreChange = async (team, newScore) => {
    setError('');
    
    // Prevent negative scores
    if (newScore < 0) return;
    
    // Prevent exceeding maxWins
    if (newScore > maxWins) {
      setError(`La score ne peut pas dépasser ${maxWins} (format: ${matchFormat})`);
      return;
    }

    let newTeam1 = team === 'team1' ? newScore : team1Score;
    let newTeam2 = team === 'team2' ? newScore : team2Score;

    // Validate the score combination
    if (!isValidScore(newTeam1, newTeam2, matchFormat)) {
      setError(`Combinaison de score invalide pour le format ${matchFormat.toUpperCase()}`);
      return;
    }

    // Update state
    if (team === 'team1') {
      setTeam1Score(newScore);
    } else {
      setTeam2Score(newScore);
    }

    // Check if match is now complete
    const newIsComplete = isMatchComplete(newTeam1, newTeam2, matchFormat);
    const newWinner = getWinner(newTeam1, newTeam2, matchFormat);
    
    setIsComplete(newIsComplete);
    setWinner(newWinner);

    // Call parent callback if provided
    if (onScoreUpdate) {
      setLoading(true);
      try {
        await onScoreUpdate({
          team1Score: newTeam1,
          team2Score: newTeam2,
          status: newIsComplete ? 'completed' : 'in-progress',
          winner: newWinner
        });
      } catch (err) {
        setError('Erreur lors de la mise à jour du score');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const inputVariants = {
    focus: { scale: 1.05 },
    hover: { scale: 1.02 }
  };

  const scoreButtonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  // Color coding based on winning status
  const getTeamScoreColor = (teamScore, isWinner) => {
    if (isComplete && isWinner) return 'bg-green-500/20 border-green-500';
    if (isComplete && !isWinner && (team1Score === maxWins || team2Score === maxWins)) return 'bg-red-500/20 border-red-500';
    return 'bg-slate-500/10 border-slate-400';
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Score du Match</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-slate-400">Format: {matchFormat.toUpperCase()}</span>
          <span className="text-sm font-mono text-slate-500">Max: {maxWins}</span>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Team 1 */}
        <motion.div
          className={`border-2 rounded-lg p-4 transition-colors ${getTeamScoreColor(team1Score, winner === 'team1')}`}
          whileHover="hover"
          variants={inputVariants}
        >
          <div className="text-center mb-3">
            <p className="text-slate-300 text-sm font-semibold">{team1?.name || 'Équipe 1'}</p>
            {isComplete && winner === 'team1' && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block mt-1 px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded font-bold"
              >
                ✓ VICTOIRE
              </motion.span>
            )}
            {isComplete && winner !== 'team1' && (
              <span className="inline-block mt-1 px-2 py-1 bg-red-500/30 text-red-300 text-xs rounded font-bold">
                ✗ DÉFAITE
              </span>
            )}
          </div>

          <motion.div
            className="text-4xl font-bold text-center text-white mb-4"
            whileTap="tap"
          >
            {team1Score}
          </motion.div>

          {/* Score Controls */}
          <div className="flex gap-2 justify-center">
            <motion.button
              variants={scoreButtonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleScoreChange('team1', Math.max(0, team1Score - 1))}
              disabled={isComplete || loading || !isAdmin}
              className="px-3 py-2 bg-red-500/30 hover:bg-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-red-300 rounded font-bold transition-colors"
            >
              −
            </motion.button>
            <motion.button
              variants={scoreButtonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleScoreChange('team1', team1Score + 1)}
              disabled={isComplete || loading || !isAdmin || team1Score >= maxWins}
              className="px-3 py-2 bg-green-500/30 hover:bg-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-green-300 rounded font-bold transition-colors"
            >
              +
            </motion.button>
          </div>
        </motion.div>

        {/* Team 2 */}
        <motion.div
          className={`border-2 rounded-lg p-4 transition-colors ${getTeamScoreColor(team2Score, winner === 'team2')}`}
          whileHover="hover"
          variants={inputVariants}
        >
          <div className="text-center mb-3">
            <p className="text-slate-300 text-sm font-semibold">{team2?.name || 'Équipe 2'}</p>
            {isComplete && winner === 'team2' && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block mt-1 px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded font-bold"
              >
                ✓ VICTOIRE
              </motion.span>
            )}
            {isComplete && winner !== 'team2' && (
              <span className="inline-block mt-1 px-2 py-1 bg-red-500/30 text-red-300 text-xs rounded font-bold">
                ✗ DÉFAITE
              </span>
            )}
          </div>

          <motion.div
            className="text-4xl font-bold text-center text-white mb-4"
            whileTap="tap"
          >
            {team2Score}
          </motion.div>

          {/* Score Controls */}
          <div className="flex gap-2 justify-center">
            <motion.button
              variants={scoreButtonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleScoreChange('team2', Math.max(0, team2Score - 1))}
              disabled={isComplete || loading || !isAdmin}
              className="px-3 py-2 bg-red-500/30 hover:bg-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-red-300 rounded font-bold transition-colors"
            >
              −
            </motion.button>
            <motion.button
              variants={scoreButtonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleScoreChange('team2', team2Score + 1)}
              disabled={isComplete || loading || !isAdmin || team2Score >= maxWins}
              className="px-3 py-2 bg-green-500/30 hover:bg-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-green-300 rounded font-bold transition-colors"
            >
              +
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Match Status */}
      <motion.div
        className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-slate-300">
            Score: <span className="font-bold text-white">{formatScoreDisplay(team1Score, team2Score, matchFormat)}</span>
          </span>
          {isComplete ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-green-500/30 text-green-300 text-sm font-bold rounded"
            >
              ✓ MATCH TERMINÉ
            </motion.span>
          ) : (
            <span className="px-3 py-1 bg-yellow-500/30 text-yellow-300 text-sm font-bold rounded">
              EN COURS
            </span>
          )}
        </div>
      </motion.div>

      {/* Info Text */}
      {!isAdmin && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-200 text-sm text-center">
          Seuls les administrateurs peuvent modifier les scores
        </div>
      )}

      {isAdmin && isComplete && (
        <div className="mt-4 p-3 bg-purple-500/20 border border-purple-500 rounded-lg text-purple-200 text-sm text-center">
          🎉 Match terminé! Résultats enregistrés.
        </div>
      )}
    </div>
  );
};

export default MatchScorePanel;
