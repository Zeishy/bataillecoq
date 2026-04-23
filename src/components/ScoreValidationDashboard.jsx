import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ChevronDown, Image as ImageIcon } from 'lucide-react';
import axios from '../api/axios';

const ScoreValidationDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/matches/submissions/pending');
      setSubmissions(response.data.matches);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (matchId) => {
    setProcessingId(matchId);
    try {
      await axios.patch(`/matches/${matchId}/approve-score`);
      setSubmissions(prev => prev.filter(s => s._id !== matchId));
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (matchId) => {
    const reason = rejectReason[matchId];
    if (!reason || reason.trim() === '') {
      alert('Veuillez indiquer une raison du rejet');
      return;
    }

    setProcessingId(matchId);
    try {
      await axios.patch(`/matches/${matchId}/reject-score`, {
        reason
      });
      setSubmissions(prev => prev.filter(s => s._id !== matchId));
      setRejectReason(prev => ({ ...prev, [matchId]: '' }));
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400">Chargement des soumissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Validation des Scores</h1>
          <p className="text-gray-400">
            {submissions.length} soumission(s) en attente de validation
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-reunion-red/20 border border-reunion-red/50 rounded-lg p-4 mb-6"
          >
            <p className="text-reunion-red">{error}</p>
          </motion.div>
        )}

        {submissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400 text-lg">Aucune soumission en attente</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission, index) => (
              <motion.div
                key={submission._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-dark-800 border border-reunion-blue/20 rounded-lg overflow-hidden"
              >
                {/* Summary Row */}
                <div
                  onClick={() => setExpandedId(expandedId === submission._id ? null : submission._id)}
                  className="p-6 cursor-pointer hover:bg-dark-700/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <h3 className="font-bold text-lg">
                        {submission.team1?.teamId?.name} vs {submission.team2?.teamId?.name}
                      </h3>
                      <span className="px-3 py-1 bg-reunion-yellow/20 text-reunion-yellow rounded-full text-sm">
                        {submission.scoreSubmission?.team1Score} - {submission.scoreSubmission?.team2Score}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Tournoi: {submission.tournamentId?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Soumis par {submission.scoreSubmission?.submittedBy?.name} le {formatDate(submission.scoreSubmission?.submittedAt)}
                    </p>
                  </div>
                  <div className="text-gray-400">
                    <ChevronDown
                      size={20}
                      className={`transition-transform ${expandedId === submission._id ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === submission._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-reunion-blue/20 bg-dark-700/50 p-6 space-y-6"
                  >
                    {/* Screenshots */}
                    <div>
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <ImageIcon size={18} />
                        Captures d'écran ({submission.scoreSubmission?.screenshots?.length || 0})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {submission.scoreSubmission?.screenshots?.map((screenshot, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            className="relative cursor-pointer"
                            onClick={() => setSelectedScreenshot(screenshot.url)}
                          >
                            <img
                              src={screenshot.url}
                              alt={`Screenshot ${idx + 1}`}
                              className="w-full h-32 object-cover rounded border-2 border-reunion-blue/30 hover:border-reunion-blue"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded">
                              <span className="text-white text-sm">Agrandir</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Score Details */}
                    <div className="bg-dark-800 rounded-lg p-4">
                      <h4 className="font-bold mb-3">Détails du Score</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">{submission.team1?.teamId?.name}</p>
                          <p className="text-2xl font-bold text-reunion-gold">
                            {submission.scoreSubmission?.team1Score}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">{submission.team2?.teamId?.name}</p>
                          <p className="text-2xl font-bold text-reunion-gold">
                            {submission.scoreSubmission?.team2Score}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Raison du rejet (si applicable)
                      </label>
                      <textarea
                        value={rejectReason[submission._id] || ''}
                        onChange={(e) => setRejectReason(prev => ({
                          ...prev,
                          [submission._id]: e.target.value
                        }))}
                        className="w-full bg-dark-800 border border-reunion-blue/30 rounded px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-reunion-blue"
                        placeholder="Expliquez pourquoi le score est rejeté..."
                        rows={3}
                        disabled={processingId === submission._id}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-reunion-blue/20">
                      <button
                        onClick={() => handleReject(submission._id)}
                        disabled={processingId === submission._id}
                        className="px-6 py-2 rounded-lg bg-reunion-red/20 border border-reunion-red/50 text-reunion-red hover:bg-reunion-red/30 disabled:opacity-50 flex items-center gap-2"
                      >
                        <X size={18} />
                        Rejeter
                      </button>
                      <button
                        onClick={() => handleApprove(submission._id)}
                        disabled={processingId === submission._id}
                        className="px-6 py-2 rounded-lg bg-reunion-green text-white hover:bg-reunion-green/90 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Check size={18} />
                        Valider
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Screenshot Lightbox */}
      {selectedScreenshot && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedScreenshot(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[80vh] relative"
          >
            <img
              src={selectedScreenshot}
              alt="Screenshot enlarged"
              className="max-w-full max-h-full rounded"
            />
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ScoreValidationDashboard;
