import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { scoreSubmissionService } from '../services/scoreSubmissionService';

const MatchScoreSubmission = ({ match, team1Name, team2Name, onSuccess, isAdmin }) => {
  const [team1Score, setTeam1Score] = useState(match?.team1?.score || 0);
  const [team2Score, setTeam2Score] = useState(match?.team2?.score || 0);
  const [screenshots, setScreenshots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const isSubmitted = match?.scoreSubmission?.status === 'pending' || 
                      match?.scoreSubmission?.status === 'approved';

  const handleScreenshotChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file size (max 5MB per file)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`);
        return false;
      }
      return true;
    });

    // Convert to base64
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshots(prev => [...prev, {
          name: file.name,
          data: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    setFileInputKey(prev => prev + 1);
  };

  const removeScreenshot = (index) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (team1Score < 0 || team2Score < 0) {
      toast.error('Les scores doivent être positifs');
      return;
    }

    if (screenshots.length === 0) {
      toast.error('Au moins une capture d\'écran est requise');
      return;
    }

    try {
      setIsLoading(true);
      await scoreSubmissionService.submitScore(
        match._id,
        team1Score,
        team2Score,
        screenshots.map(s => s.data)
      );
      toast.success('Score soumis avec succès! En attente de validation admin.');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting score:', error);
      toast.error('Erreur lors de la soumission du score');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveScore = async () => {
    try {
      setIsLoading(true);
      await scoreSubmissionService.approveScore(match._id);
      toast.success('Score approuvé avec succès!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error approving score:', error);
      toast.error('Erreur lors de l\'approbation du score');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectScore = async (reason) => {
    try {
      setIsLoading(true);
      await scoreSubmissionService.rejectScore(match._id, reason);
      toast.success('Score rejeté');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error rejecting score:', error);
      toast.error('Erreur lors du rejet du score');
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);

  if (isSubmitted) {
    const submittedTeam1Score = match.scoreSubmission?.team1Score ?? 0;
    const submittedTeam2Score = match.scoreSubmission?.team2Score ?? 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
      >
        <div className="text-center">
          <div className="text-4xl mb-4">
            {match?.scoreSubmission?.status === 'approved' ? '✅' : '⏳'}
          </div>
          <h3 className={`text-lg font-bold mb-2 ${
            match?.scoreSubmission?.status === 'approved' ? 'text-green-400' : 'text-amber-300'
          }`}>
            {match?.scoreSubmission?.status === 'approved' ? 'Score validé' : 'Score en attente de validation'}
          </h3>
          <p className="text-slate-400 mb-4">
            Un administrateur doit valider ce score pour confirmer le résultat du match.
          </p>
          
          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-sm">{team1Name}</p>
                <p className="text-3xl font-bold text-white">{submittedTeam1Score}</p>
              </div>
              <div className="flex items-center justify-center">
                <p className="text-slate-500">VS</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">{team2Name}</p>
                <p className="text-3xl font-bold text-white">{submittedTeam2Score}</p>
              </div>
            </div>
          </div>

          {match?.scoreSubmission?.screenshots && match.scoreSubmission.screenshots.length > 0 && (
            <div className="mt-6 mb-4">
              <p className="text-sm font-semibold text-slate-300 mb-3 text-left">
                📸 Captures d'écran soumises :
              </p>
              <div className="grid grid-cols-2 gap-3">
                {match.scoreSubmission.screenshots.map((screenshot, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedImage(screenshot.url)}
                    className="cursor-pointer hover:opacity-80 transition"
                  >
                    <img
                      src={screenshot.url}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-slate-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {match?.scoreSubmission?.status === 'approved' && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-400 font-semibold">✓ Score approuvé par l'admin</p>
            </div>
          )}

          {match?.scoreSubmission?.rejectionReason && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 font-semibold">✗ Score rejeté</p>
              <p className="text-red-300 text-sm mt-1">{match.scoreSubmission.rejectionReason}</p>
            </div>
          )}

          {isAdmin && match?.scoreSubmission?.status === 'pending' && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => handleApproveScore()}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                Approuver le score
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Raison du rejet :');
                  if (reason) handleRejectScore(reason);
                }}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                Rejeter le score
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
    >
      <h3 className="text-lg font-bold text-purple-400 mb-6">📊 Soumettre le résultat du match</h3>

      {/* Score Input */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div whileHover={{ scale: 1.02 }} className="bg-slate-700/50 rounded-lg p-4">
          <label className="block text-sm text-slate-400 mb-2">{team1Name}</label>
          <input
            type="number"
            min="0"
            value={team1Score}
            onChange={(e) => setTeam1Score(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full text-3xl font-bold text-center bg-slate-600 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </motion.div>

        <div className="flex items-center justify-center">
          <p className="text-slate-500 text-xl font-bold">VS</p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} className="bg-slate-700/50 rounded-lg p-4">
          <label className="block text-sm text-slate-400 mb-2">{team2Name}</label>
          <input
            type="number"
            min="0"
            value={team2Score}
            onChange={(e) => setTeam2Score(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full text-3xl font-bold text-center bg-slate-600 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </motion.div>
      </div>

      {/* Screenshot Upload */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          📸 Captures d'écran (preuve du score)
        </label>
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-purple-500 transition cursor-pointer">
          <label className="cursor-pointer">
            <input
              key={fileInputKey}
              type="file"
              multiple
              accept="image/*"
              onChange={handleScreenshotChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} className="text-slate-500" />
              <p className="text-slate-400">Cliquez pour ajouter des captures d'écran</p>
              <p className="text-xs text-slate-500">JPG, PNG (max 5MB par fichier)</p>
            </div>
          </label>
        </div>
      </div>

      {/* Screenshots Preview */}
      {screenshots.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-300 mb-3">
            {screenshots.length} capture{screenshots.length > 1 ? 's' : ''} ajoutée{screenshots.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {screenshots.map((screenshot, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <img
                  src={screenshot.data}
                  alt={`Screenshot ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-slate-600"
                />
                <button
                  onClick={() => removeScreenshot(idx)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={16} />
                </button>
                <p className="text-xs text-slate-400 mt-1 truncate">{screenshot.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Envoi...
          </>
        ) : (
          <>
            ✓ Soumettre le résultat
          </>
        )}
      </motion.button>
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-red-400 p-2"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedImage} 
            alt="Screenshot Full" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </motion.div>
  );
};

export default MatchScoreSubmission;
