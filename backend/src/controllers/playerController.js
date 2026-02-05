import Player from '../models/Player.js';
import User from '../models/User.js';

// @desc    Get all players
// @route   GET /api/players
// @access  Public
export const getPlayers = async (req, res) => {
  try {
    const { game, search, sort } = req.query;

    const players = await Player.find()
      .populate('userId', 'username avatar email');

    let filteredPlayers = players;

    // Filter by game
    if (game) {
      filteredPlayers = filteredPlayers.filter(player =>
        player.games.some(g => g.gameName === game)
      );
    }

    // Search by username
    if (search) {
      filteredPlayers = filteredPlayers.filter(player =>
        player.userId.username.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    if (sort === 'points' && game) {
      filteredPlayers.sort((a, b) => {
        const aGame = a.games.find(g => g.gameName === game);
        const bGame = b.games.find(g => g.gameName === game);
        return (bGame?.stats?.points || 0) - (aGame?.stats?.points || 0);
      });
    } else if (sort === 'winrate' && game) {
      filteredPlayers.sort((a, b) => {
        const aGame = a.games.find(g => g.gameName === game);
        const bGame = b.games.find(g => g.gameName === game);
        return (bGame?.stats?.winrate || 0) - (aGame?.stats?.winrate || 0);
      });
    }

    res.status(200).json({
      success: true,
      count: filteredPlayers.length,
      players: filteredPlayers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single player
// @route   GET /api/players/:id
// @access  Public
export const getPlayer = async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.params.id })
      .populate('userId', 'username avatar email linkedGames')
      .populate('games.teams.teamId', 'name logo game');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.status(200).json({
      success: true,
      player
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get player stats for a specific game
// @route   GET /api/players/:id/stats/:game
// @access  Public
export const getPlayerStats = async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.params.id });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const gameData = player.games.find(g => g.gameName === req.params.game);

    if (!gameData) {
      return res.status(404).json({
        success: false,
        message: 'Player has no data for this game'
      });
    }

    res.status(200).json({
      success: true,
      stats: gameData.stats,
      gameTag: gameData.gameTag,
      totalPoints: player.calculateTotalPoints()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get player match history for a specific game
// @route   GET /api/players/:id/history/:game
// @access  Public
export const getPlayerHistory = async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.params.id });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const gameData = player.games.find(g => g.gameName === req.params.game);

    if (!gameData) {
      return res.status(404).json({
        success: false,
        message: 'Player has no data for this game'
      });
    }

    const { limit = 10, skip = 0 } = req.query;
    const history = gameData.history
      .sort((a, b) => b.date - a.date)
      .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.status(200).json({
      success: true,
      count: gameData.history.length,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Sync player stats from external API
// @route   PUT /api/players/:id/sync/:game
// @access  Private
export const syncStats = async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.params.id });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Verify user has linked account for this game
    const user = await User.findById(req.params.id);
    const linkedGame = user.linkedGames.find(lg => lg.game === req.params.game);

    if (!linkedGame) {
      return res.status(400).json({
        success: false,
        message: 'No linked account for this game'
      });
    }

    // TODO: Implement actual API sync based on game
    // For now, simulate with mock data
    const mockStats = {
      kda: (Math.random() * 3 + 1).toFixed(2),
      winrate: (Math.random() * 40 + 45).toFixed(1),
      matchesPlayed: Math.floor(Math.random() * 100) + 50,
      rank: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][Math.floor(Math.random() * 5)],
      points: Math.floor(Math.random() * 1000) + 500
    };

    await player.updateGameStats(req.params.game, mockStats);

    res.status(200).json({
      success: true,
      message: 'Stats synced successfully',
      stats: mockStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get leaderboard for a specific game
// @route   GET /api/players/leaderboard/:game
// @access  Public
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const players = await Player.find()
      .populate('userId', 'username avatar');

    // Filter players who have data for this game
    const gamePlayers = players
      .map(player => {
        const gameData = player.games.find(g => g.gameName === req.params.game);
        if (!gameData) return null;

        return {
          userId: player.userId,
          gameTag: gameData.gameTag,
          stats: gameData.stats,
          teams: gameData.teams
        };
      })
      .filter(p => p !== null)
      .sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0))
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      count: gamePlayers.length,
      leaderboard: gamePlayers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  getPlayers,
  getPlayer,
  getPlayerStats,
  getPlayerHistory,
  syncStats,
  getLeaderboard
};
