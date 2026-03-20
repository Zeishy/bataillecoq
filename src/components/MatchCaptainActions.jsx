import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Gamepad2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import PlayerSelectionModal from './PlayerSelectionModal';
import MatchPickAndBan from './MatchPickAndBan';
import { getWinner, isMatchComplete } from '../utils/matchFormat';

const MatchCaptainActions = ({ match, mapPool, userTeamId, tournament, onMatchUpdate }) => {
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [showPickBan, setShowPickBan] = useState(false);
  const [playersSelected, setPlayersSelected] = useState(false);
  const [pickBanCompleted, setPickBanCompleted] = useState(false);

  useEffect(() => {
    // Vérifier si les joueurs sont déjà sélectionnés
    if (match?.selectedPlayers && match.selectedPlayers.length > 0) {
      setPlayersSelected(true);
    }

    // Vérifier si le pick & ban est complété
    if (match?.pickAndBan?.status === 'completed') {
      setPickBanCompleted(true);
    }
  }, [match]);

  const userTeam = match?.team1Id?._id === userTeamId ? match.team1Id : match?.team2Id;
  const isMatchStarted = match?.status === 'in-progress' || match?.status === 'completed';
  const isMatchComplete = isMatchComplete(match?.team1Score || 0, match?.team2Score || 0, match?.matchFormat);

  if (!userTeam) {
    return null;
  }

  return (
    <>
      {/* Actions Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/50"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-purple-400" />
          Préparation du Match
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player Selection Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPlayerSelection(true)}
            disabled={isMatchStarted || isMatchComplete}
            className={`p-4 rounded-lg border-2 transition-all ${
              playersSelected
                ? 'bg-green-500/20 border-green-500'
                : 'bg-dark-700 border-dark-600 hover:border-purple-500'
            } disabled:opacity-50 disabled:cursor-not-allowed text-left`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${playersSelected ? 'bg-green-500/30' : 'bg-purple-500/30'}`}>
                <Users className={`w-5 h-5 ${playersSelected ? 'text-green-400' : 'text-purple-400'}`} />
              </div>
              <div>
                <p className="font-semibold text-white">Sélectionner les Joueurs</p>
                <p className="text-xs text-gray-400 mt-1">
                  {playersSelected ? '✓ Joueurs sélectionnés' : 'Choisir votre lineup'}
                </p>
              </div>
            </div>
          </motion.button>

          {/* Pick & Ban Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPickBan(true)}
            disabled={!mapPool || isMatchComplete}
            className={`p-4 rounded-lg border-2 transition-all ${
              pickBanCompleted
                ? 'bg-green-500/20 border-green-500'
                : mapPool
                ? 'bg-dark-700 border-dark-600 hover:border-purple-500'
                : 'bg-dark-700/50 border-dark-600 opacity-50 cursor-not-allowed'
            } disabled:opacity-50 disabled:cursor-not-allowed text-left`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${pickBanCompleted ? 'bg-green-500/30' : 'bg-purple-500/30'}`}>
                <Gamepad2 className={`w-5 h-5 ${pickBanCompleted ? 'text-green-400' : 'text-purple-400'}`} />
              </div>
              <div>
                <p className="font-semibold text-white">Pick & Ban</p>
                <p className="text-xs text-gray-400 mt-1">
                  {pickBanCompleted
                    ? '✓ Pick & Ban complété'
                    : mapPool
                    ? 'Choisir les maps'
                    : 'Pas de map pool'}
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Status Info */}
        {isMatchStarted && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg flex items-center gap-2 text-yellow-300 text-sm">
            <Clock className="w-4 h-4" />
            Le match a déjà commencé. Les actions ne peuvent plus être modifiées.
          </div>
        )}

        {isMatchComplete && (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-2 text-green-300 text-sm">
            <Users className="w-4 h-4" />
            Le match est terminé.
          </div>
        )}

        {!mapPool && (
          <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-300 text-sm">
            Ce tournoi n'a pas de system Pick & Ban configuré.
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <PlayerSelectionModal
        match={match}
        team={userTeam}
        isOpen={showPlayerSelection}
        onClose={() => setShowPlayerSelection(false)}
        onComplete={() => {
          setPlayersSelected(true);
          onMatchUpdate?.();
        }}
      />

      {mapPool && (
        <div className="mt-6">
          {showPickBan && (
            <MatchPickAndBan
              match={match}
              mapPool={mapPool}
              isTeamCaptain={true}
              teamId={userTeamId}
              onComplete={() => {
                setPickBanCompleted(true);
                onMatchUpdate?.();
              }}
              isModal={true}
              onClose={() => setShowPickBan(false)}
            />
          )}
        </div>
      )}
    </>
  );
};

export default MatchCaptainActions;
