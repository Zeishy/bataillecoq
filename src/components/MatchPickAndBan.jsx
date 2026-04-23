import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Lock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as pickAndBanService from '../services/pickAndBanService';
import * as mapPoolService from '../services/mapPoolService';
import matchService from '../services/matchService';

const MatchPickAndBan = ({ match, mapPool, isTeamCaptain, teamId, onComplete }) => {
  // 🎯 Guard against undefined match
  if (!match) {
    return (
      <div className="bg-gradient-to-br from-red-600/10 to-red-900/10 border border-red-500/30 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-300 font-semibold">Match non disponible</p>
      </div>
    );
  }

  const [pickAndBan, setPickAndBan] = useState(match.pickAndBan);
  const [mapPoolData, setMapPoolData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPool, setLoadingPool] = useState(true);
  const [poolError, setPoolError] = useState(null);
  const [started, setStarted] = useState(match.pickAndBan.status !== 'not-started');
  const [currentMatch, setCurrentMatch] = useState(match);
  const confirmationAttempted = useRef(false);  // 🎯 Use ref instead of state - persists across re-mounts

  // 🎯 Debug info on mount
  useEffect(() => {
    console.log('🎮 MatchPickAndBan mounted:', {
      matchId: match._id,
      matchStatus: match.status,
      mapPoolId: mapPool,
      pbStatus: match.pickAndBan.status,
      isTeamCaptain,
      teamId
    });
    
    // 🎯 If match is 'ready' and we haven't tried to confirm yet, confirm it
    // Use ref to prevent double-calls even if component re-mounts (React StrictMode, etc)
    if (match.status === 'ongoing' && match.pickAndBan.status === 'not-started' && !confirmationAttempted.current) {
      console.log('⚙️ Match is ongoing, automatically starting P&B...');
      confirmationAttempted.current = true;  // 🎯 Mark as attempted
      handleStartPickAndBan();
    }
  }, []);

  // 🎯 Update pickAndBan when match changes
  useEffect(() => {
    if (match?.pickAndBan) {
      setPickAndBan(match.pickAndBan);
      setStarted(match.pickAndBan.status !== 'not-started');
      setCurrentMatch(match);
    }
  }, [match?.pickAndBan?.status, match?.pickAndBan?.selectedMaps?.length, match?.pickAndBan?.bannedMaps?.length]);

  // 🎯 Load map pool when mapPool or started status changes
  useEffect(() => {
    console.log('📦 useEffect triggered: mapPool or started changed');
    console.log('   mapPool:', mapPool);
    console.log('   started:', started);
    console.log('   mapPoolData:', mapPoolData ? 'loaded' : 'not loaded');
    
    // Load pool if:
    // 1. We have a mapPool to load
    // 2. We haven't loaded it yet (mapPoolData is null)
    // 3. P&B has started
    if ((mapPool || currentMatch?.mapPoolId) && !mapPoolData && started) {
      console.log('✅ Conditions met, loading map pool...');
      loadMapPool();
    } else if ((mapPool || currentMatch?.mapPoolId) && !mapPoolData) {
      console.log('⏳ Waiting for P&B to start (started:', started, ')');
    }
  }, [mapPool, started, currentMatch]);

  const loadMapPool = async () => {
    try {
      setLoadingPool(true);
      setPoolError(null);
      
      console.log('🔍 loadMapPool called with mapPool:', mapPool);
      console.log('🔍 currentMatch.mapPoolId:', currentMatch?.mapPoolId);
      
      const poolIdToFetch = mapPool || currentMatch?.mapPoolId;
      
      // If mapPool is already an object (populated), use it directly
      if (typeof poolIdToFetch === 'object' && poolIdToFetch?.maps) {
        console.log('✅ Map pool is already an object, using directly:', poolIdToFetch);
        setMapPoolData(poolIdToFetch);
      } else if (typeof poolIdToFetch === 'string') {
        // If it's just an ID string, fetch it
        console.log('🔄 Fetching map pool by ID:', poolIdToFetch);
        const pool = await mapPoolService.getMapPool(poolIdToFetch);
        console.log('✅ Map pool fetched:', pool);
        setMapPoolData(pool);
      } else {
        console.error('❌ Invalid pool data:', poolIdToFetch);
        setPoolError('Pool de maps invalide');
      }
    } catch (error) {
      console.error('Error loading map pool:', error);
      setPoolError('Erreur: Impossible de charger le pool de maps');
      toast.error('Erreur: Impossible de charger le pool de maps');
    } finally {
      setLoadingPool(false);
    }
  };

    // Removed confirmAndStartPickBan as it is no longer needed since the match skips the ready state

  const handleStartPickAndBan = async () => {
    try {
      setLoading(true);
      console.log('🎯 Starting Pick & Ban for match:', match._id);
      console.log('Current pickAndBan status:', match.pickAndBan.status);
      
      const result = await pickAndBanService.startPickAndBan(match._id);
      console.log('✅ Pick & Ban started:', result);
      
      if (result.match) {
        setPickAndBan(result.match.pickAndBan);
        setStarted(true);
        setCurrentMatch(result.match);
        
        if (onComplete) {
          onComplete(result.match);
        }
        
        toast.success('Pick and ban démarré!');
      } else {
        throw new Error('No match data in response');
      }
    } catch (error) {
      console.error('❌ Error starting Pick & Ban:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erreur lors du démarrage du pick and ban';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePickMap = async (mapName, mode = null) => {
    if (!isTeamCaptain) {
      toast.error('Seul le capitaine peut picker');
      return;
    }

    try {
      setLoading(true);
      const result = await pickAndBanService.pickMap(match._id, mapName, mode, teamId);
      setPickAndBan(result.match.pickAndBan);
      toast.success('Map pickée!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du pick');
    } finally {
      setLoading(false);
    }
  };

  const handleBanMap = async (mapName) => {
    if (!isTeamCaptain) {
      toast.error('Seul le capitaine peut bannir');
      return;
    }

    try {
      setLoading(true);
      const result = await pickAndBanService.banMap(match._id, mapName, teamId);
      setPickAndBan(result.match.pickAndBan);
      toast.success('Map bannite!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du ban');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Handle error states only
  if (poolError) {
    return (
      <div className="bg-gradient-to-br from-red-600/10 to-red-900/10 border border-red-500/30 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-300 font-semibold mb-2">{poolError}</p>
        <p className="text-xs text-red-200/70">Vérifiez que un pool de maps est associé au match et au tournoi.</p>
      </div>
    );
  }

  // 🎯 Don't block on mapPoolData - show UI even while loading
  // If maps aren't loaded yet, we'll show empty state in the grid
  const hasMultipleModes = mapPoolData?.modes && mapPoolData.modes.length > 0;
  const mapsToDisplay = hasMultipleModes ? mapPoolData.modes : (mapPoolData?.maps ? [{ name: 'Pool', maps: mapPoolData.maps }] : []);

  return (
    <div className="bg-gradient-to-br from-purple-600/10 to-purple-900/10 border border-purple-500/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">⚡ Pick & Ban</h3>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            pickAndBan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            pickAndBan.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {pickAndBan.status === 'not-started' ? 'Non commencé' :
             pickAndBan.status === 'in-progress' ? 'En cours' :
             'Terminé'}
          </span>
        </div>
      </div>

      {/* Start Button */}
      {!started && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleStartPickAndBan}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 transition flex items-center justify-center gap-2 mb-6"
        >
          <Play size={20} />
          Démarrer le Pick & Ban
        </motion.button>
      )}

      {/* Selected Maps */}
      {pickAndBan.selectedMaps.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-purple-400 mb-3">Maps Sélectionnées</h4>
          <div className="space-y-2">
            {pickAndBan.selectedMaps.map((map, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/30 rounded">
                <span className="text-white">
                  {map.mode && `${map.mode}: `}{map.mapName}
                </span>
                <span className="text-xs text-green-400">Pickée</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banned Maps */}
      {pickAndBan.bannedMaps.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-red-400 mb-3">Maps Bannies</h4>
          <div className="space-y-2">
            {pickAndBan.bannedMaps.map((map, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/30 rounded">
                <span className="text-white line-through">{map.mapName}</span>
                <span className="text-xs text-red-400">Bannie</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Maps Grid */}
      {started && pickAndBan.status === 'in-progress' && (
        <div className="space-y-4">
          {loadingPool ? (
            // Show loading state while maps are fetching
            <div className="text-center py-8 text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-3"></div>
              <p className="text-sm">Chargement du pool de maps...</p>
            </div>
          ) : mapsToDisplay.length > 0 ? (
            // Show maps if loaded
            <>
              {hasMultipleModes ? (
                // Multi-mode display
                mapsToDisplay.map((mode, modeIdx) => (
                  <div key={modeIdx}>
                    <h4 className="text-sm font-bold text-purple-400 mb-2">{mode.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {mode.maps && mode.maps.map((map) => {
                        const isSelected = pickAndBan.selectedMaps.some(m => m.mapName === map.name && m.mode === mode.name);
                        const isBanned = pickAndBan.bannedMaps.some(m => m.mapName === map.name);
                        
                        return (
                          <motion.button
                            key={map._id}
                            whileHover={{ scale: isSelected || isBanned ? 1 : 1.05 }}
                            onClick={() => isTeamCaptain && !isSelected && !isBanned && handlePickMap(map.name, mode.name)}
                            disabled={isSelected || isBanned || loading}
                            className={`p-2 rounded-lg font-semibold text-sm transition ${
                              isSelected ? 'bg-green-500/20 border border-green-500 text-green-400' :
                              isBanned ? 'bg-red-500/20 border border-red-500 text-red-400 line-through' :
                              'bg-gray-800 border border-gray-700 text-gray-300 hover:border-purple-500'
                            } ${!isTeamCaptain ? 'cursor-not-allowed' : ''}`}
                          >
                            {map.name}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                // Single mode display
                <div>
                  <h4 className="text-sm font-bold text-purple-400 mb-2">Maps</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mapPoolData?.maps && mapPoolData.maps.map((map) => {
                      const isSelected = pickAndBan.selectedMaps.some(m => m.mapName === map.name);
                      const isBanned = pickAndBan.bannedMaps.some(m => m.mapName === map.name);
                      
                      return (
                        <motion.button
                          key={map._id}
                          whileHover={{ scale: isSelected || isBanned ? 1 : 1.05 }}
                          onClick={() => isTeamCaptain && !isSelected && !isBanned && handlePickMap(map.name)}
                          disabled={isSelected || isBanned || loading}
                          className={`p-2 rounded-lg font-semibold text-sm transition ${
                            isSelected ? 'bg-green-500/20 border border-green-500 text-green-400' :
                            isBanned ? 'bg-red-500/20 border border-red-500 text-red-400 line-through' :
                            'bg-gray-800 border border-gray-700 text-gray-300 hover:border-purple-500'
                          } ${!isTeamCaptain ? 'cursor-not-allowed' : ''}`}
                        >
                          {map.name}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            // No maps loaded yet
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">Aucune map disponible pour le moment</p>
            </div>
          )}
        </div>
      )}

      {/* Status Display */}
      {pickAndBan.status === 'completed' && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 font-semibold">✓ Pick & Ban terminé!</p>
          {pickAndBan.selectedMaps.length > 0 && (
            <p className="text-sm text-green-400 mt-2">
              {pickAndBan.selectedMaps.length} map{pickAndBan.selectedMaps.length > 1 ? 's' : ''} sélectionnée{pickAndBan.selectedMaps.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchPickAndBan;
