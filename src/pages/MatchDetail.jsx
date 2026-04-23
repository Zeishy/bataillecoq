import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import MatchScorePanel from '../components/MatchScorePanel';
import MatchPickAndBan from '../components/MatchPickAndBan';
import MatchChat from '../components/MatchChat';
import MatchScoreSubmission from '../components/MatchScoreSubmission';
import matchService from '../services/matchService';
import teamService from '../services/teamService';
import { getWinner, isMatchComplete } from '../utils/matchFormat';

const MatchDetail = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmingReady, setConfirmingReady] = useState(false);

  useEffect(() => {
    loadMatchData();
  }, [matchId]);

  const loadMatchData = async () => {
    try {
      setLoading(true);
      
      // Load match
      const response = await matchService.getMatch(matchId);
      const matchData = response.match || response;
      setMatch(matchData);

      // Load teams
      if (matchData.team1?.teamId) {
        const t1 = await teamService.getTeam(matchData.team1.teamId._id || matchData.team1.teamId);
        setTeam1(t1);
      }
      if (matchData.team2?.teamId) {
        const t2 = await teamService.getTeam(matchData.team2.teamId._id || matchData.team2.teamId);
        setTeam2(t2);
      }

      setError('');
    } catch (err) {
      console.error('Error loading match:', err);
      setError('Erreur lors du chargement du match');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreUpdate = async (scoreData) => {
    try {
      const updated = await matchService.updateScore(
        matchId,
        scoreData.team1Score,
        scoreData.team2Score
      );
      setMatch(updated);
    } catch (err) {
      console.error('Error updating score:', err);
      throw err;
    }
  };

  const handlePickAndBanComplete = () => {
    // Refresh match data to get updated pickAndBan
    loadMatchData();
  };

  // 🎯 Handle confirming match ready to start ongoing
  const handleConfirmMatchReady = async () => {
    if (!match || match.status !== 'ready') {
      toast.error('Le match doit être en status "ready" pour être confirmé');
      return;
    }

    try {
      setConfirmingReady(true);
      await matchService.confirmMatchReady(match._id);
      toast.success('Match confirmé! Le match est maintenant en cours.');
      loadMatchData(); // Rafraîchir les données
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la confirmation du match';
      toast.error(errorMsg);
    } finally {
      setConfirmingReady(false);
    }
  };

  // 🎯 Determine which team the current user is captain of
  const determineUserTeam = () => {
    if (!match || !user) return null;

    const team1Data = match.team1?.teamId;
    const team2Data = match.team2?.teamId;
    
    const team1Id = team1Data?._id || team1Data;
    const team2Id = team2Data?._id || team2Data;
    
    const team1CaptainId = team1Data?.captainId?._id || team1Data?.captainId;
    const team2CaptainId = team2Data?.captainId?._id || team2Data?.captainId;

    if (team1CaptainId?.toString() === user._id?.toString()) {
      return team1Id;
    } else if (team2CaptainId?.toString() === user._id?.toString()) {
      return team2Id;
    }

    return null;
  };

  const userTeamId = determineUserTeam();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-slate-300">Chargement du match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Match introuvable'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const isComplete = match?.status?.toLowerCase().trim() === 'completed' || !!match?.winner;
  
  // Use stored winner instead of calculating from scores (scores may be actual game scores, not Best-of format)
  let matchWinner = null;
  if (isComplete && match?.winner) {
    matchWinner = match.winner.toString() === match.team1?.teamId?._id?.toString() || match.winner.toString() === match.team1?.teamId
      ? 'team1'
      : 'team2';
  }
  
  const isMatchOngoing = match?.status?.toLowerCase().trim() !== 'completed' && 
                         match?.status?.toLowerCase().trim() !== 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="mb-4 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
          >
            ← Retour
          </button>

          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/50">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Détail du Match</h1>
              <div className="text-sm text-slate-300">
                ID: <span className="font-mono text-slate-400">{matchId}</span>
              </div>
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {team1 && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <p className="text-slate-300 text-sm mb-2">{team1.name}</p>
                  <p className="text-4xl font-bold text-white">
                    {match.team1?.score || 0}
                  </p>
                  {isComplete && matchWinner === 'team1' && (
                    <p className="text-green-400 text-sm mt-2 font-bold">✓ VICTOIRE</p>
                  )}
                </motion.div>
              )}

              <div className="flex flex-col items-center justify-center">
                <div className="text-slate-500 text-sm mb-2">
                  Format: <span className="font-bold text-white">{match.matchFormat?.toUpperCase()}</span>
                </div>
                <div className="text-slate-500 text-xs">
                  {match.status?.toLowerCase().trim() === 'completed' || isComplete ? (
                    <span className="text-green-400 font-bold">✓ MATCH TERMINÉ</span>
                  ) : (match.status?.toLowerCase().trim() === 'ongoing' || match.status?.toLowerCase().trim() === 'ready' || match.pickAndBan?.status !== 'not-started') ? (
                    <span className="text-blue-400 font-bold">● EN COURS</span>
                  ) : (
                    <span className="text-yellow-400 font-bold">● EN ATTENTE</span>
                  )}
                </div>
              </div>

              {team2 && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <p className="text-slate-300 text-sm mb-2">{team2.name}</p>
                  <p className="text-4xl font-bold text-white">
                    {match.team2?.score || 0}
                  </p>
                  {isComplete && matchWinner === 'team2' && (
                    <p className="text-green-400 text-sm mt-2 font-bold">✓ VICTOIRE</p>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Ready Confirmation Button */}
        {match?.status === 'ready' && userTeamId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⏳</div>
                <div>
                  <p className="font-semibold text-amber-300">Le match est prêt!</p>
                  <p className="text-sm text-amber-200">Les deux équipes ont sélectionné leurs joueurs.</p>
                </div>
              </div>
              <motion.button
                onClick={handleConfirmMatchReady}
                disabled={confirmingReady}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {confirmingReady ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    ✓ Confirmer et commencer
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
          {['overview', 'score', 'pickban', 'players', 'score-submit', 'chat'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'overview' && '📋 Aperçu'}
              {tab === 'score' && '📊 Score'}
              {tab === 'pickban' && '🎮 Pick & Ban'}
              {tab === 'players' && '👥 Joueurs'}
              {tab === 'score-submit' && '✓ Soumettre score'}
              {tab === 'chat' && '💬 Chat'}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeTab}
          transition={{ duration: 0.3 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
              >
                <h3 className="text-lg font-bold text-purple-400 mb-4">Informations du Match</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-slate-400">Format:</span>
                    <span className="font-bold text-white">{match.matchFormat?.toUpperCase() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-slate-400">Statut:</span>
                    <span className={`font-bold ${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isComplete ? 'Terminé' : 'En cours'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <span className="text-slate-400">Date de création:</span>
                    <span className="font-mono text-slate-300">
                      {match.createdAt ? new Date(match.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                  {match.startedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Date de début:</span>
                      <span className="font-mono text-slate-300">
                        {new Date(match.startedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
              >
                <h3 className="text-lg font-bold text-purple-400 mb-4">Maps Sélectionnées</h3>
                {match.pickAndBan && match.pickAndBan.selectedMaps && match.pickAndBan.selectedMaps.length > 0 ? (
                  <div className="space-y-2">
                    {match.pickAndBan.selectedMaps.map((map, idx) => (
                      <div key={idx} className="p-2 bg-slate-700/50 rounded border border-slate-600 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{map.mapName}</p>
                          {map.mode && <p className="text-xs text-slate-400">{map.mode}</p>}
                        </div>
                        <p className="text-xs text-purple-300">Choisi par l'équipe</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">Pas de maps sélectionnées</p>
                )}
              </motion.div>
            </div>
          )}

          {/* Score Tab */}
          {activeTab === 'score' && (
            <MatchScorePanel
              match={match}
              team1={team1}
              team2={team2}
              matchFormat={match.matchFormat}
              onScoreUpdate={handleScoreUpdate}
              isAdmin={true}
            />
          )}

          {/* Pick & Ban Tab */}
          {activeTab === 'pickban' && (
            <>
              {match?.mapPoolId?._id || match?.mapPoolId ? (
                <MatchPickAndBan
                  match={match}
                  mapPool={match.mapPoolId?._id || match.mapPoolId}
                  isTeamCaptain={true}
                  teamId={userTeamId}
                  onComplete={handlePickAndBanComplete}
                />
              ) : (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center text-slate-400">
                  <p>Aucun pool de maps associé à ce match</p>
                </div>
              )}
            </>
          )}

          {/* Players Tab */}
          {activeTab === 'players' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
              >
                <h3 className="text-lg font-bold text-purple-400 mb-4">{team1?.name || 'Équipe 1'}</h3>
                <div className="space-y-2">
                  {team1?.players && team1.players.length > 0 ? (
                    team1.players.map((player) => (
                      <div key={player._id} className="p-2 bg-slate-700/50 rounded border border-slate-600">
                        <p className="font-semibold text-white">{player.username}</p>
                        <p className="text-xs text-slate-400">{player.role}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">Pas de joueurs</p>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
              >
                <h3 className="text-lg font-bold text-purple-400 mb-4">{team2?.name || 'Équipe 2'}</h3>
                <div className="space-y-2">
                  {team2?.players && team2.players.length > 0 ? (
                    team2.players.map((player) => (
                      <div key={player._id} className="p-2 bg-slate-700/50 rounded border border-slate-600">
                        <p className="font-semibold text-white">{player.username}</p>
                        <p className="text-xs text-slate-400">{player.role}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">Pas de joueurs</p>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Score Submission Tab */}
          {activeTab === 'score-submit' && (isMatchOngoing || isAdmin) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <MatchScoreSubmission
                match={match}
                team1Name={team1?.name}
                team2Name={team2?.name}
                onSuccess={loadMatchData}
                isAdmin={isAdmin}
              />
            </motion.div>
          )}

          {activeTab === 'score-submit' && !isMatchOngoing && !isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center text-slate-400"
            >
              <p>Le match doit être en cours (ongoing) pour soumettre un score</p>
            </motion.div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 h-[600px]"
            >
              <MatchChat 
                matchId={matchId}
                team1Name={team1?.name}
                team2Name={team2?.name}
                currentUserTeamId={userTeamId}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MatchDetail;
