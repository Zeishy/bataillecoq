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
  const [team1Score, setTeam1Score] = useState(match?.team1?.score || match?.team1Score || 0);
  const [team2Score, setTeam2Score] = useState(match?.team2?.score || match?.team2Score || 0);
  const [isComplete, setIsComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const maxWins = getMaxWins(matchFormat);

  useEffect(() => {
    if (match) {
      const nextTeam1Score = match.team1?.score || match.team1Score || 0;
      const nextTeam2Score = match.team2?.score || match.team2Score || 0;
      setTeam1Score(nextTeam1Score);
      setTeam2Score(nextTeam2Score);
      const w = getWinner(nextTeam1Score, nextTeam2Score, matchFormat);
      setWinner(w);
      setIsComplete(isMatchComplete(nextTeam1Score, nextTeam2Score, matchFormat));
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
  };

  const handleForceScore = async () => {
    setError('');

    if (!isAdmin || !onScoreUpdate) return;

    if (team1Score === team2Score) {
      setError('Un score forcé doit désigner un gagnant');
      return;
    }

    if (!isValidScore(team1Score, team2Score, matchFormat)) {
      setError(`Combinaison de score invalide pour le format ${matchFormat.toUpperCase()}`);
      return;
    }

    setLoading(true);
    try {
      await onScoreUpdate({
        team1Score,
        team2Score,
        status: 'completed',
        winner: team1Score > team2Score ? 'team1' : 'team2'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du forçage du score');
      console.error(err);
    } finally {
      setLoading(false);
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

          <input
            type="number"
            min="0"
            max={maxWins}
            value={team1Score}
            onChange={(e) => handleScoreChange('team1', Math.max(0, parseInt(e.target.value, 10) || 0))}
            disabled={isComplete || loading || !isAdmin}
            className="w-full text-4xl font-bold text-center text-white mb-4 bg-slate-800/70 border border-slate-600 rounded-lg py-2 disabled:opacity-80"
          />

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

          <input
            type="number"
            min="0"
            max={maxWins}
            value={team2Score}
            onChange={(e) => handleScoreChange('team2', Math.max(0, parseInt(e.target.value, 10) || 0))}
            disabled={isComplete || loading || !isAdmin}
            className="w-full text-4xl font-bold text-center text-white mb-4 bg-slate-800/70 border border-slate-600 rounded-lg py-2 disabled:opacity-80"
          />

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

      {isAdmin && (
        <button
          onClick={handleForceScore}
          disabled={loading || team1Score === team2Score}
          className="mt-4 w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer le score et clôturer le match'}
        </button>
      )}

      {/* Info Text */}
      {!isAdmin && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-200 text-sm text-center">
          Seuls les administrateurs peuvent modifier les scores
        </div>
      )}
    </div>
  );
};

export default MatchScorePanel;
