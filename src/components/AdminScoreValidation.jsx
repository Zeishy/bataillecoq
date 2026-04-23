import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ChevronDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { scoreSubmissionService } from '../services/scoreSubmissionService';

const AdminScoreValidation = ({ onScoreApproved = null }) => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await scoreSubmissionService.getPendingSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Erreur lors du chargement des soumissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (matchId, match) => {
    try {
      setApprovingId(matchId);
      const loadingToast = toast.loading('Approbation du score...');
      
      await scoreSubmissionService.approveScore(matchId);
      
      toast.success('✓ Score approuvé! Bracket mis à jour!', {
        id: loadingToast,
        duration: 4000,
        icon: '🎉'
      });
      
      // Call parent callback if provided to refresh bracket
      if (onScoreApproved) {
        onScoreApproved(match);
      }
      
      // Reload submissions
      setTimeout(() => loadSubmissions(), 500);
    } catch (error) {
      console.error('Error approving score:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (matchId) => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez fournir une raison de rejet');
      return;
    }

    try {
      setRejectingId(null);
      const loadingToast = toast.loading('Rejet du score...');
      
      await scoreSubmissionService.rejectScore(matchId, rejectReason);
      
      toast.success('Score rejeté. L\'équipe peut resoumettre.', {
        id: loadingToast,
        duration: 4000,
        icon: '↩️'
      });
      
      setRejectReason('');
      setTimeout(() => loadSubmissions(), 500);
    } catch (error) {
      console.error('Error rejecting score:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Chargement des soumissions...</div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">✓ Aucune soumission en attente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-white mb-6">
        📋 Validations de scores ({submissions.length})
      </h3>

      {submissions.map((match, idx) => (
        <motion.div
          key={match._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <button
            onClick={() => setExpandedId(expandedId === match._id ? null : match._id)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition"
          >
            <div className="flex-1 text-left">
              <p className="text-lg font-bold text-white mb-1">
                {match.team1?.name} vs {match.team2?.name}
              </p>
              <p className="text-sm text-slate-400">
                Tournoi: {match.tournamentId?.name}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {match.scoreSubmission?.team1Score} - {match.scoreSubmission?.team2Score}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(match.scoreSubmission?.submittedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <ChevronDown
                size={24}
                className={`text-slate-400 transition-transform ${
                  expandedId === match._id ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Expanded Content */}
          {expandedId === match._id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-700 p-4 bg-slate-900/50"
            >
              {/* Score Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-300 mb-2">Équipe 1</p>
                  <p className="text-slate-400">{match.team1?.name}</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">
                    {match.scoreSubmission?.team1Score}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-300 mb-2">Équipe 2</p>
                  <p className="text-slate-400">{match.team2?.name}</p>
                  <p className="text-3xl font-bold text-pink-400 mt-2">
                    {match.scoreSubmission?.team2Score}
                  </p>
                </div>
              </div>

              {/* Screenshots */}
              {match.scoreSubmission?.screenshots && match.scoreSubmission.screenshots.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-slate-300 mb-3">
                    📸 Captures d'écran ({match.scoreSubmission.screenshots.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {match.scoreSubmission.screenshots.map((screenshot, idx) => (
                      <img
                        key={idx}
                        src={screenshot.url}
                        alt={`Proof ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-slate-700 cursor-pointer hover:border-purple-500 transition"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {rejectingId !== match._id ? (
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => handleApprove(match._id, match)}
                    disabled={approvingId === match._id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-700/50 disabled:cursor-wait text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {approvingId === match._id ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Approbation...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Approuver
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => setRejectingId(match._id)}
                    disabled={approvingId === match._id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <X size={18} />
                    Rejeter
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Raison du rejet..."
                    className="w-full bg-slate-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleReject(match._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                    >
                      Confirmer le rejet
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
                    >
                      Annuler
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default AdminScoreValidation;
