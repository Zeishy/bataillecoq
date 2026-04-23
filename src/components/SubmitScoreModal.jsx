import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from '../api/axios';

const SubmitScoreModal = ({ match, isOpen, onClose, onSuccess }) => {
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !match) return null;

  const handleScreenshotUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    
    // In real app, upload to service like Imgur/S3 and get URLs
    // For now, we'll use base64 or placeholder
    const urls = files.map(file => URL.createObjectURL(file));
    setScreenshots(prev => [...prev, ...urls]);
  };

  const removeScreenshot = (index) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!team1Score || !team2Score) {
      setError('Les deux scores sont requis');
      return;
    }

    if (parseInt(team1Score) < 0 || parseInt(team2Score) < 0) {
      setError('Les scores ne peuvent pas être négatifs');
      return;
    }

    if (screenshots.length === 0) {
      setError('Au moins une capture d\'écran est requise');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/matches/${match._id}/submit-score`, {
        team1Score: parseInt(team1Score),
        team2Score: parseInt(team2Score),
        screenshots
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess && onSuccess(response.data.match);
        onClose();
        setTeam1Score('');
        setTeam2Score('');
        setScreenshots([]);
        setPreviewUrls([]);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-reunion-blue/20"
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-700 p-6 border-b border-reunion-blue/20">
          <h2 className="text-2xl font-bold">Soumettre le Score du Match</h2>
          <p className="text-gray-400 mt-1">
            {match.team1?.teamId?.name} vs {match.team2?.teamId?.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-reunion-green/20 border border-reunion-green/50 rounded-lg p-4 flex items-center gap-3"
            >
              <CheckCircle className="text-reunion-green" size={24} />
              <div>
                <p className="font-bold text-reunion-green">Score soumis avec succès!</p>
                <p className="text-sm text-gray-300">En attente de validation par un administrateur</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-reunion-red/20 border border-reunion-red/50 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertCircle className="text-reunion-red" size={24} />
              <p className="text-reunion-red">{error}</p>
            </motion.div>
          )}

          {/* Scores Section */}
          <div className="bg-dark-700/50 rounded-lg p-4 border border-reunion-blue/10">
            <h3 className="font-bold mb-4">Scores</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {match.team1?.teamId?.name}
                </label>
                <input
                  type="number"
                  min="0"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  className="w-full bg-dark-800 border border-reunion-blue/30 rounded px-3 py-2 text-white"
                  placeholder="Score"
                  disabled={loading || success}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {match.team2?.teamId?.name}
                </label>
                <input
                  type="number"
                  min="0"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  className="w-full bg-dark-800 border border-reunion-blue/30 rounded px-3 py-2 text-white"
                  placeholder="Score"
                  disabled={loading || success}
                />
              </div>
            </div>
          </div>

          {/* Screenshots Section */}
          <div className="bg-dark-700/50 rounded-lg p-4 border border-reunion-blue/10">
            <h3 className="font-bold mb-4">Captures d'écran du Résultat</h3>
            
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-32 object-cover rounded border border-reunion-blue/20"
                    />
                    <button
                      onClick={() => removeScreenshot(index)}
                      className="absolute top-1 right-1 bg-reunion-red/80 hover:bg-reunion-red p-1 rounded"
                      disabled={loading || success}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="block">
              <div className="border-2 border-dashed border-reunion-blue/30 hover:border-reunion-blue/60 rounded-lg p-8 text-center cursor-pointer transition-colors">
                <Upload size={32} className="mx-auto text-reunion-blue mb-2" />
                <p className="font-medium text-reunion-blue">Cliquez pour télécharger</p>
                <p className="text-sm text-gray-400">ou glissez-déposez vos images</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  disabled={loading || success}
                />
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              {previewUrls.length} screenshot(s) téléchargé(s)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-700 p-6 border-t border-reunion-blue/20 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading || success}
            className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-dark-600 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className="px-6 py-2 rounded-lg bg-reunion-green text-white hover:bg-reunion-green/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Envoi...
              </>
            ) : (
              'Soumettre le Score'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubmitScoreModal;
