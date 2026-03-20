import Game from '../models/Game.js';

// @desc    Get all games
// @route   GET /api/games
// @access  Public
export const getAllGames = async (req, res) => {
  try {
    const games = await Game.find({ isActive: true }).sort('name');
    
    res.status(200).json({
      success: true,
      count: games.length,
      games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all games (including inactive) - Admin only
// @route   GET /api/games/admin/all
// @access  Private (Admin)
export const getAllGamesAdmin = async (req, res) => {
  try {
    const games = await Game.find().sort('name');
    
    res.status(200).json({
      success: true,
      count: games.length,
      games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single game by slug
// @route   GET /api/games/:slug
// @access  Public
export const getGameBySlug = async (req, res) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    res.status(200).json({
      success: true,
      game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new game
// @route   POST /api/games
// @access  Private (Admin)
export const createGame = async (req, res) => {
  try {
    const { name, description, playersPerTeam, icon, logo } = req.body;
    
    // Validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }
    
    // Check if game already exists
    const existingGame = await Game.findOne({ 
      $or: [
        { name: new RegExp(`^${name}$`, 'i') },
        { slug: name.toLowerCase().replace(/\s+/g, '-') }
      ]
    });
    
    if (existingGame) {
      return res.status(400).json({
        success: false,
        message: 'Game already exists'
      });
    }
    
    const game = await Game.create({
      name,
      description,
      playersPerTeam: playersPerTeam || 5,
      icon,
      logo,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update game
// @route   PUT /api/games/:id
// @access  Private (Admin)
export const updateGame = async (req, res) => {
  try {
    const { name, description, playersPerTeam, icon, logo, isActive } = req.body;
    
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Update fields
    if (name) game.name = name;
    if (description) game.description = description;
    if (playersPerTeam) game.playersPerTeam = playersPerTeam;
    if (icon) game.icon = icon;
    if (logo) game.logo = logo;
    if (isActive !== undefined) game.isActive = isActive;
    
    await game.save();
    
    res.status(200).json({
      success: true,
      message: 'Game updated successfully',
      game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete game
// @route   DELETE /api/games/:id
// @access  Private (Admin)
export const deleteGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Soft delete: mark as inactive instead of removing
    game.isActive = false;
    await game.save();
    
    res.status(200).json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle game active status
// @route   PATCH /api/games/:id/toggle
// @access  Private (Admin)
export const toggleGameStatus = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    game.isActive = !game.isActive;
    await game.save();
    
    res.status(200).json({
      success: true,
      message: `Game ${game.isActive ? 'activated' : 'deactivated'} successfully`,
      game
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
