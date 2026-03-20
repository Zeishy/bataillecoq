import MapPool from '../models/MapPool.js';
import Game from '../models/Game.js';

// @desc    Get all map pools for a game
// @route   GET /api/maps/game/:gameId
// @access  Public
export const getMapPoolsByGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Try to find by ObjectId first, then by slug
    let game;
    
    // Check if gameId is a valid MongoDB ObjectId
    if (gameId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId, search by _id
      game = await Game.findById(gameId);
    } else {
      // It might be a slug, search by slug
      game = await Game.findOne({ slug: gameId });
    }
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    const mapPools = await MapPool.find({ 
      game: game._id,
      isActive: true 
    }).populate('game', 'name slug icon');
    
    res.status(200).json({
      success: true,
      count: mapPools.length,
      mapPools
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single map pool
// @route   GET /api/maps/:id
// @access  Public
export const getMapPool = async (req, res) => {
  try {
    const mapPool = await MapPool.findById(req.params.id)
      .populate('game', 'name slug icon');
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    res.status(200).json({
      success: true,
      mapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new map pool
// @route   POST /api/maps
// @access  Private (Admin)
export const createMapPool = async (req, res) => {
  try {
    const { gameId, name, maps, formats } = req.body;
    
    // Validation
    if (!gameId || !name || !maps || !formats) {
      return res.status(400).json({
        success: false,
        message: 'Game ID, name, maps and formats are required'
      });
    }
    
    // Verify game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    const mapPool = await MapPool.create({
      game: gameId,
      name,
      maps,
      formats,
      isActive: true
    });
    
    const populatedMapPool = await mapPool.populate('game', 'name slug icon');
    
    res.status(201).json({
      success: true,
      message: 'Map pool created successfully',
      mapPool: populatedMapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update map pool
// @route   PUT /api/maps/:id
// @access  Private (Admin)
export const updateMapPool = async (req, res) => {
  try {
    const { name, maps, formats } = req.body;
    
    let mapPool = await MapPool.findById(req.params.id);
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    // Update fields
    if (name) mapPool.name = name;
    if (maps) mapPool.maps = maps;
    if (formats) mapPool.formats = formats;
    
    mapPool = await mapPool.save();
    const populatedMapPool = await mapPool.populate('game', 'name slug icon');
    
    res.status(200).json({
      success: true,
      message: 'Map pool updated successfully',
      mapPool: populatedMapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add map to pool (legacy - single mode)
// @route   POST /api/maps/:id/maps
// @access  Private (Admin)
export const addMapToPool = async (req, res) => {
  try {
    const { name, icon, imageUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Map name is required'
      });
    }
    
    let mapPool = await MapPool.findById(req.params.id);
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    // Check if map already exists
    if (mapPool.maps.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Map already exists in this pool'
      });
    }
    
    mapPool.maps.push({ name, icon: icon || null, imageUrl: imageUrl || null });
    mapPool = await mapPool.save();
    const populatedMapPool = await mapPool.populate('game', 'name slug icon');
    
    res.status(200).json({
      success: true,
      message: 'Map added successfully',
      mapPool: populatedMapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove map from pool
// @route   DELETE /api/maps/:id/maps/:mapId
// @access  Private (Admin)
export const removeMapFromPool = async (req, res) => {
  try {
    let mapPool = await MapPool.findById(req.params.id);
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    // Remove map by ID
    mapPool.maps = mapPool.maps.filter(m => m._id.toString() !== req.params.mapId);
    mapPool = await mapPool.save();
    const populatedMapPool = await mapPool.populate('game', 'name slug icon');
    
    res.status(200).json({
      success: true,
      message: 'Map removed successfully',
      mapPool: populatedMapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update map pool formats
// @route   PUT /api/maps/:id/formats
// @access  Private (Admin)
export const updateMapPoolFormats = async (req, res) => {
  try {
    const { formats } = req.body;
    
    if (!formats || !Array.isArray(formats)) {
      return res.status(400).json({
        success: false,
        message: 'Formats array is required'
      });
    }
    
    // Validate formats
    const validFormats = ['bo1', 'bo3', 'bo5', 'bo7', 'bo9'];
    const invalidFormats = formats.filter(f => !validFormats.includes(f));
    
    if (invalidFormats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid formats: ${invalidFormats.join(', ')}`
      });
    }
    
    let mapPool = await MapPool.findById(req.params.id);
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    mapPool.formats = formats;
    mapPool = await mapPool.save();
    const populatedMapPool = await mapPool.populate('game', 'name slug icon');
    
    res.status(200).json({
      success: true,
      message: 'Formats updated successfully',
      mapPool: populatedMapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete map pool
// @route   DELETE /api/maps/:id
// @access  Private (Admin)
export const deleteMapPool = async (req, res) => {
  try {
    const mapPool = await MapPool.findById(req.params.id);
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    // Soft delete
    mapPool.isActive = false;
    await mapPool.save();
    
    res.status(200).json({
      success: true,
      message: 'Map pool deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create or update modes in map pool
// @route   POST /api/maps/:id/modes
// @access  Private (Admin)
export const setModes = async (req, res) => {
  try {
    const { modes } = req.body;
    
    if (!modes || !Array.isArray(modes)) {
      return res.status(400).json({
        success: false,
        message: 'Modes array is required'
      });
    }
    
    let mapPool = await MapPool.findById(req.params.id);
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    // Set modes with default maps if not provided
    mapPool.modes = modes.map((mode, index) => ({
      name: mode.name,
      order: mode.order !== undefined ? mode.order : index,
      icon: mode.icon || null,
      maps: mode.maps || []
    }));
    
    mapPool = await mapPool.save();
    const populatedMapPool = await mapPool.populate('game', 'name slug icon');
    
    res.status(200).json({
      success: true,
      message: 'Modes set successfully',
      mapPool: populatedMapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add map to specific mode
// @route   POST /api/maps/:id/modes/:modeId/maps
// @access  Private (Admin)
export const addMapToMode = async (req, res) => {
  try {
    const { name, icon, imageUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Map name is required'
      });
    }
    
    let mapPool = await MapPool.findById(req.params.id);
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    const mode = mapPool.modes.id(req.params.modeId);
    if (!mode) {
      return res.status(404).json({
        success: false,
        message: 'Mode not found'
      });
    }
    
    // Check if map already exists in this mode
    if (mode.maps.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Map already exists in this mode'
      });
    }
    
    mode.maps.push({ name, icon: icon || null, imageUrl: imageUrl || null });
    mapPool = await mapPool.save();
    const populatedMapPool = await mapPool.populate('game', 'name slug icon');
    
    res.status(200).json({
      success: true,
      message: 'Map added to mode successfully',
      mapPool: populatedMapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove map from specific mode
// @route   DELETE /api/maps/:id/modes/:modeId/maps/:mapId
// @access  Private (Admin)
export const removeMapFromMode = async (req, res) => {
  try {
    let mapPool = await MapPool.findById(req.params.id);
    
    if (!mapPool) {
      return res.status(404).json({
        success: false,
        message: 'Map pool not found'
      });
    }
    
    const mode = mapPool.modes.id(req.params.modeId);
    if (!mode) {
      return res.status(404).json({
        success: false,
        message: 'Mode not found'
      });
    }
    
    mode.maps = mode.maps.filter(m => m._id.toString() !== req.params.mapId);
    mapPool = await mapPool.save();
    const populatedMapPool = await mapPool.populate('game', 'name slug icon');
    
    res.status(200).json({
      success: true,
      message: 'Map removed from mode successfully',
      mapPool: populatedMapPool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
