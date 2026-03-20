import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Lock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as pickAndBanService from '../services/pickAndBanService';
import * as mapPoolService from '../services/mapPoolService';

const MatchPickAndBan = ({ match, mapPool, isTeamCaptain, teamId, onComplete }) => {
  const [pickAndBan, setPickAndBan] = useState(match.pickAndBan);
  const [mapPoolData, setMapPoolData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(pickAndBan.status !== 'not-started');

  useEffect(() => {
    if (mapPool) {
      loadMapPool();
    }
  }, [mapPool]);

  const loadMapPool = async () => {
    try {
      const pool = await mapPoolService.getMapPool(mapPool);
      setMapPoolData(pool);
    } catch (error) {
      console.error('Error loading map pool:', error);
    }
  };

  const handleStartPickAndBan = async () => {
    try {
      setLoading(true);
      const result = await pickAndBanService.startPickAndBan(match._id);
      setPickAndBan(result.match.pickAndBan);
      setStarted(true);
      toast.success('Pick and ban démarré!');
    } catch (error) {
      toast.error('Erreur lors du démarrage du pick and ban');
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

  if (!mapPoolData) {
    return null;
  }

  // Déterminer si c'est un mode multiple ou single mode
  const hasMultipleModes = mapPoolData.modes && mapPoolData.modes.length > 0;
  const mapsToDisplay = hasMultipleModes ? mapPoolData.modes : [{ name: 'Pool', maps: mapPoolData.maps }];

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
          {hasMultipleModes ? (
            // Multi-mode display
            mapsToDisplay.map((mode, modeIdx) => (
              <div key={modeIdx}>
                <h4 className="text-sm font-bold text-purple-400 mb-2">{mode.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mode.maps.map((map) => {
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {mapPoolData.maps.map((map) => {
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
