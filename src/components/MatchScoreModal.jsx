import { useState, useEffect } from 'react';
import { X, Trophy, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MatchScoreModal = ({ match, onClose, onSave, isOpen }) => {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (match) {
      setTeam1Score(match.team1?.score || 0);
      setTeam2Score(match.team2?.score || 0);
    }
  }, [match]);

  if (!match) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (team1Score === team2Score) {
      toast.error('Les scores ne peuvent pas être égaux. Il doit y avoir un gagnant.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        matchId: match.matchId,
        team1Score: parseInt(team1Score),
        team2Score: parseInt(team2Score),
        winnerId: team1Score > team2Score ? match.team1._id : match.team2._id
      });
      onClose();
    } catch (error) {
      console.error('Error saving score:', error);
      toast.error('Erreur lors de la sauvegarde du score');
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementScore = (team) => {
    if (team === 1) {
      setTeam1Score(prev => Math.min(prev + 1, 99));
    } else {
      setTeam2Score(prev => Math.min(prev + 1, 99));
    }
  };

  const decrementScore = (team) => {
    if (team === 1) {
      setTeam1Score(prev => Math.max(prev - 1, 0));
    } else {
      setTeam2Score(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-dark-800 border border-reunion-green/30 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-reunion-green to-reunion-green/80 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Enregistrer le score</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-white/80 mt-2">
                Round {match.round} - Match #{match.position + 1}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Team 1 Score */}
              <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {match.team1?.logo && (
                    <img src={match.team1.logo} alt={match.team1.name} className="w-10 h-10 rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{match.team1?.name || 'TBD'}</h3>
                    <p className="text-sm text-gray-400">Équipe 1</p>
                  </div>
                  {team1Score > team2Score && (
                    <Trophy className="w-6 h-6 text-reunion-gold" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => decrementScore(1)}
                    className="w-10 h-10 rounded-lg bg-dark-600 hover:bg-dark-500 text-white font-bold transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                    className="flex-1 text-center text-3xl font-bold border-2 border-dark-600 bg-dark-800 text-white rounded-lg py-2 focus:outline-none focus:border-reunion-green"
                    min="0"
                    max="99"
                  />
                  <button
                    type="button"
                    onClick={() => incrementScore(1)}
                    className="w-10 h-10 rounded-lg bg-dark-600 hover:bg-dark-500 text-white font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* VS Divider */}
              <div className="text-center">
                <span className="bg-dark-700 border border-dark-600 text-gray-300 px-4 py-2 rounded-full font-bold">VS</span>
              </div>

              {/* Team 2 Score */}
              <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {match.team2?.logo && (
                    <img src={match.team2.logo} alt={match.team2.name} className="w-10 h-10 rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{match.team2?.name || 'TBD'}</h3>
                    <p className="text-sm text-gray-400">Équipe 2</p>
                  </div>
                  {team2Score > team1Score && (
                    <Trophy className="w-6 h-6 text-reunion-gold" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => decrementScore(2)}
                    className="w-10 h-10 rounded-lg bg-dark-600 hover:bg-dark-500 text-white font-bold transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                    className="flex-1 text-center text-3xl font-bold border-2 border-dark-600 bg-dark-800 text-white rounded-lg py-2 focus:outline-none focus:border-reunion-green"
                    min="0"
                    max="99"
                  />
                  <button
                    type="button"
                    onClick={() => incrementScore(2)}
                    className="w-10 h-10 rounded-lg bg-dark-600 hover:bg-dark-500 text-white font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Warning for equal scores */}
              {team1Score === team2Score && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
                  ⚠️ Les scores doivent être différents. Il doit y avoir un gagnant.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-semibold transition-colors border border-dark-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || team1Score === team2Score}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-reunion-green hover:bg-reunion-green/80 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {isSubmitting ? 'Sauvegarde...' : 'Valider le score'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MatchScoreModal;
