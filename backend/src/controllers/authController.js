import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Player from '../models/Player.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    // Create player profile
    await Player.create({
      userId: user._id,
      games: []
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        linkedGames: user.linkedGames
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('teams', 'name logo game')
      .select('-password');

    const player = await Player.findOne({ userId: req.user.id });

    res.status(200).json({
      success: true,
      user,
      playerData: player
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Link external game account
// @route   PUT /api/auth/link-account
// @access  Private
export const linkAccount = async (req, res) => {
  try {
    const { game, gameTag, accountId } = req.body;

    const user = await User.findById(req.user.id);

    // Check if game already linked
    const existingLink = user.linkedGames.find(lg => lg.game === game);
    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: 'This game account is already linked'
      });
    }

    // Add linked game
    user.linkedGames.push({
      game,
      gameTag,
      accountId,
      verified: true // In production, this would be verified via API
    });

    await user.save();

    // Update player data
    const player = await Player.findOne({ userId: user._id });
    if (player) {
      const gameExists = player.games.find(g => g.gameName === game);
      if (!gameExists) {
        player.games.push({
          gameName: game,
          gameTag,
          stats: {
            kda: 0,
            winrate: 0,
            matchesPlayed: 0,
            rank: 'Unranked',
            points: 0
          }
        });
        await player.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Account linked successfully',
      linkedGames: user.linkedGames
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (username) user.username = username;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  register,
  login,
  getMe,
  linkAccount,
  updateProfile
};
