import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Edit2 } from 'lucide-react';
import * as mapPoolService from '../services/mapPoolService';
import toast from 'react-hot-toast';

const PickAndBanModal = ({ isOpen, onClose, games, onSelectMapPool }) => {
  const [step, setStep] = useState(1);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedMapPool, setSelectedMapPool] = useState(null);
  const [mapPools, setMapPools] = useState([]);
  const [newMapName, setNewMapName] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modeManagementOpen, setModeManagementOpen] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [newModes, setNewModes] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null);

  const formats = ['bo1', 'bo3', 'bo5', 'bo7', 'bo9'];

  useEffect(() => {
    if (selectedGame) {
      fetchMapPools(selectedGame._id);
    }
  }, [selectedGame]);

  const fetchMapPools = async (gameId) => {
    try {
      setLoading(true);
      const pools = await mapPoolService.getMapPoolsByGame(gameId);
      setMapPools(pools);
    } catch (error) {
      toast.error('Erreur lors du chargement des map pools');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setSelectedMapPool(null);
    setStep(2);
  };

  const handleSelectMapPool = (pool) => {
    setSelectedMapPool(pool);
    setSelectedFormats(pool.formats || []);
    setNewModes(pool.modes || []);
    setStep(3);
  };

  const hasMultipleModes = selectedMapPool?.modes && selectedMapPool.modes.length > 0;

  // ========== SINGLE MODE FUNCTIONS ==========
  const handleAddMapSingleMode = async () => {
    if (!newMapName.trim()) {
      toast.error('Veuillez entrer un nom de map');
      return;
    }

    try {
      setLoading(true);
      const updatedPool = await mapPoolService.addMapToPool(selectedMapPool._id, {
        name: newMapName,
        icon: null,
        imageUrl: null
      });
      setSelectedMapPool(updatedPool);
      setNewMapName('');
      toast.success('Map ajoutée avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la map');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMapSingleMode = async (mapId) => {
    try {
      setLoading(true);
      const updatedPool = await mapPoolService.removeMapFromPool(selectedMapPool._id, mapId);
      setSelectedMapPool(updatedPool);
      toast.success('Map supprimée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression de la map');
    } finally {
      setLoading(false);
    }
  };

  // ========== MULTIPLE MODES FUNCTIONS ==========
  const handleAddMode = () => {
    if (!newModeName.trim()) {
      toast.error('Veuillez entrer un nom de mode');
      return;
    }

    const newMode = {
      name: newModeName,
      order: newModes.length,
      icon: null,
      maps: []
    };

    setNewModes([...newModes, newMode]);
    setNewModeName('');
    toast.success('Mode ajouté');
  };

  const handleRemoveMode = (index) => {
    setNewModes(newModes.filter((_, i) => i !== index));
    if (selectedMode === index) {
      setSelectedMode(null);
    }
    toast.success('Mode supprimé');
  };

  const handleSaveModes = async () => {
    if (newModes.length === 0) {
      toast.error('Ajoutez au moins un mode');
      return;
    }

    try {
      setLoading(true);
      const updatedPool = await mapPoolService.setModes(selectedMapPool._id, newModes);
      setSelectedMapPool(updatedPool);
      setModeManagementOpen(false);
      toast.success('Modes enregistrés');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement des modes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapToMode = async () => {
    if (!newMapName.trim() || selectedMode === null) {
      toast.error('Veuillez sélectionner un mode et entrer un nom');
      return;
    }

    // Add map to local newModes array
    const updatedModes = [...newModes];
    updatedModes[selectedMode].maps.push({
      name: newMapName,
      icon: null,
      imageUrl: null
    });
    
    setNewModes(updatedModes);
    setNewMapName('');
    toast.success('Map ajoutée au mode (cliquez Enregistrer les modes pour sauvegarder)');
  };

  const handleRemoveMapFromMode = (modeIndex, mapIndex) => {
    const updatedModes = [...newModes];
    updatedModes[modeIndex].maps.splice(mapIndex, 1);
    setNewModes(updatedModes);
    toast.success('Map supprimée');
  };

  const handleToggleFormat = (format) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleSaveFormats = async () => {
    if (selectedFormats.length === 0) {
      toast.error('Sélectionnez au moins un format');
      return;
    }

    try {
      setLoading(true);
      const updatedPool = await mapPoolService.updateMapPoolFormats(selectedMapPool._id, selectedFormats);
      setSelectedMapPool(updatedPool);
      toast.success('Formats mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des formats');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async () => {
    if (!selectedGame) {
      toast.error('Veuillez sélectionner un jeu');
      return;
    }

    try {
      setLoading(true);
      const newPool = await mapPoolService.createMapPool({
        gameId: selectedGame._id,
        name: `${selectedGame.name} - Pool 1`,
        maps: [],
        formats: ['bo1', 'bo3']
      });
      setMapPools([...mapPools, newPool]);
      setSelectedMapPool(newPool);
      setSelectedFormats(newPool.formats);
      toast.success('Map pool créée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la création du map pool');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedMapPool) {
      onSelectMapPool(selectedMapPool);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedGame(null);
    setSelectedMapPool(null);
    setNewMapName('');
    setSelectedFormats([]);
    setNewModes([]);
    setSelectedMode(null);
    setModeManagementOpen(false);
    onClose();
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setSelectedMapPool(null);
      setSelectedFormats([]);
      setModeManagementOpen(false);
    } else if (step === 2) {
      setStep(1);
      setSelectedGame(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Pick & Ban
            </h2>
            <p className="text-gray-400 mt-1">
              {step === 1 && 'Sélectionnez un jeu'}
              {step === 2 && `${selectedGame?.name} - Sélectionnez ou créez un map pool`}
              {step === 3 && `${selectedMapPool?.name} - Configurez les maps et formats`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                  s <= step
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s}
              </div>
              {i < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 transition ${
                    s < step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Game Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  {games.map(game => (
                    <motion.button
                      key={game._id}
                      onClick={() => handleSelectGame(game)}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="p-4 bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-lg hover:border-purple-400/60 transition text-left group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/40 transition">
                          {game.icon && <span className="text-2xl">{game.icon}</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white">{game.name}</p>
                          <p className="text-sm text-gray-400">{game.playersPerTeam} vs {game.playersPerTeam}</p>
                        </div>
                      </div>
                      {game.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">{game.description}</p>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Map Pool Selection */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Chargement...</p>
                  </div>
                ) : mapPools.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
                    <p className="text-gray-400 mb-4">Aucun map pool pour ce jeu</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={handleCreatePool}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition"
                    >
                      <Plus size={18} className="inline mr-2" />
                      Créer un pool
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {mapPools.map(pool => (
                        <motion.button
                          key={pool._id}
                          onClick={() => handleSelectMapPool(pool)}
                          whileHover={{ scale: 1.02, y: -4 }}
                          className="p-4 bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-lg hover:border-purple-400/60 transition text-left"
                        >
                          <p className="font-bold text-white mb-2">{pool.name}</p>
                          {pool.modes && pool.modes.length > 0 ? (
                            <>
                              <p className="text-sm text-gray-400">
                                {pool.modes.length} mode{pool.modes.length !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {pool.modes.map(m => m.name).join(', ')}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400">
                              {pool.maps?.length || 0} map{pool.maps?.length !== 1 ? 's' : ''}
                            </p>
                          )}
                          <p className="text-sm text-gray-400 mt-1">
                            {pool.formats?.join(', ') || 'Pas de format'}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={handleCreatePool}
                      className="w-full py-2 border border-dashed border-purple-500/50 rounded-lg text-purple-400 hover:border-purple-400 hover:text-purple-300 transition"
                    >
                      <Plus size={18} className="inline mr-2" />
                      Ajouter un nouveau pool
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Configuration */}
            {step === 3 && selectedMapPool && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {modeManagementOpen ? (
                  // Mode Management View
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Gérer les modes</h3>

                    {/* Add Mode Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newModeName}
                        onChange={(e) => setNewModeName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddMode()}
                        placeholder="Nouveau mode (ex: HP, SND, Surcharge)..."
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                        disabled={loading}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={handleAddMode}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50"
                      >
                        <Plus size={18} />
                      </motion.button>
                    </div>

                    {/* Modes List */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {newModes.map((mode, idx) => (
                        <div
                          key={idx}
                          className={`p-3 border rounded-lg transition cursor-pointer ${
                            selectedMode === idx
                              ? 'bg-purple-600/20 border-purple-500'
                              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                          }`}
                          onClick={() => setSelectedMode(idx)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-white">{mode.name}</p>
                              <p className="text-sm text-gray-400">
                                {mode.maps?.length || 0} map{mode.maps?.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMode(idx);
                              }}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>

                          {/* Maps in Mode */}
                          {selectedMode === idx && mode.maps && mode.maps.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                              {mode.maps.map((map, mapIdx) => (
                                <div key={mapIdx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-300">{map.name}</span>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMapFromMode(idx, mapIdx);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-300 rounded transition"
                                  >
                                    <Trash2 size={14} />
                                  </motion.button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Map to Selected Mode */}
                    {selectedMode !== null && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Ajouter map à "{newModes[selectedMode].name}"</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMapName}
                            onChange={(e) => setNewMapName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddMapToMode()}
                            placeholder="Nom de la map..."
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                            disabled={loading}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={handleAddMapToMode}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg hover:border-green-400 transition disabled:opacity-50"
                          >
                            <Plus size={18} />
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {/* Save Modes Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={handleSaveModes}
                      disabled={loading}
                      className="w-full py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg hover:border-blue-400 transition disabled:opacity-50"
                    >
                      Enregistrer les modes
                    </motion.button>

                    {/* Back Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setModeManagementOpen(false)}
                      className="w-full py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg hover:border-gray-600 transition"
                    >
                      Retour
                    </motion.button>
                  </div>
                ) : (
                  // Main Configuration View
                  <>
                    {/* Modes Button (if applicable) */}
                    {selectedMapPool.modes && selectedMapPool.modes.length > 0 ? (
                      <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-blue-400 mb-3">
                          Ce pool utilise des modes ({selectedMapPool.modes.length})
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setModeManagementOpen(true)}
                          className="w-full py-2 bg-blue-600/40 border border-blue-500 text-blue-300 rounded-lg hover:bg-blue-600/60 transition flex items-center justify-center gap-2"
                        >
                          <Edit2 size={18} />
                          Gérer les modes et maps
                        </motion.button>
                      </div>
                    ) : (
                      <>
                        {/* Single Mode: Maps Section */}
                        <div>
                          <h3 className="text-lg font-bold text-white mb-4">Maps ({selectedMapPool.maps?.length || 0})</h3>
                          <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto">
                            {selectedMapPool.maps && selectedMapPool.maps.length > 0 ? (
                              selectedMapPool.maps.map(map => (
                                <div
                                  key={map._id}
                                  className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition"
                                >
                                  <span className="text-white">{map.name}</span>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => handleRemoveMapSingleMode(map._id)}
                                    disabled={loading}
                                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition disabled:opacity-50"
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-400 text-sm">Aucune map</p>
                            )}
                          </div>

                          {/* Add Map Form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMapName}
                              onChange={(e) => setNewMapName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddMapSingleMode()}
                              placeholder="Nouvelle map..."
                              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                              disabled={loading}
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={handleAddMapSingleMode}
                              disabled={loading}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50"
                            >
                              <Plus size={18} />
                            </motion.button>
                          </div>
                        </div>

                        {/* Option to Add Modes */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            setNewModes([]);
                            setModeManagementOpen(true);
                          }}
                          className="w-full py-2 border border-dashed border-purple-500/50 rounded-lg text-purple-400 hover:border-purple-400 hover:text-purple-300 transition"
                        >
                          <Edit2 size={18} className="inline mr-2" />
                          Convertir en multi-modes (HP, SND, Surcharge...)
                        </motion.button>
                      </>
                    )}

                    {/* Formats Section */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Formats disponibles</h3>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {formats.map(format => (
                          <motion.button
                            key={format}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleToggleFormat(format)}
                            className={`p-3 rounded-lg font-bold transition ${
                              selectedFormats.includes(format)
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600'
                            }`}
                          >
                            {format.toUpperCase()}
                          </motion.button>
                        ))}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={handleSaveFormats}
                        disabled={loading}
                        className="w-full py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg hover:border-green-400 transition disabled:opacity-50"
                      >
                        Enregistrer les formats
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!modeManagementOpen && (
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-700">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 transition"
            >
              <ChevronLeft size={18} />
              Retour
            </motion.button>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleClose}
                className="px-6 py-2 text-gray-400 hover:text-white transition"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleConfirm}
                disabled={step !== 3 || !selectedMapPool || loading}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 transition"
              >
                Confirmer
                <ChevronRight size={18} />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PickAndBanModal;
