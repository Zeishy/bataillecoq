import Team from '../models/Team.js';
import User from '../models/User.js';
import Player from '../models/Player.js';

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
export const getTeams = async (req, res) => {
  try {
    const { game, search, sort } = req.query;

    let query = {};
    if (game) query.game = game;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let teams = Team.find(query)
      .populate('captainId', 'username avatar')
      .populate({
        path: 'players.playerId',
        select: 'userId games',
        populate: {
          path: 'userId',
          select: 'username avatar'
        }
      });

    // Sort
    if (sort === 'wins') teams = teams.sort('-stats.wins');
    else if (sort === 'points') teams = teams.sort('-stats.points');
    else teams = teams.sort('-createdAt');

    const result = await teams;

    res.status(200).json({
      success: true,
      count: result.length,
      teams: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
export const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('captainId', 'username avatar email')
      .populate({
        path: 'players.playerId',
        select: 'userId games',
        populate: {
          path: 'userId',
          select: 'username avatar'
        }
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create team
// @route   POST /api/teams
// @access  Private
export const createTeam = async (req, res) => {
  try {
    const { name, game, logo, description } = req.body;

    // Check if user is already captain of a team for this game
    const existingTeam = await Team.findOne({
      captainId: req.user.id,
      game
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already captain of a team for this game'
      });
    }

    // Ensure user has a Player document
    let player = await Player.findOne({ userId: req.user.id });
    if (!player) {
      // Create a Player document for this user
      const user = await User.findById(req.user.id);
      player = await Player.create({
        userId: req.user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        games: [{
          gameName: game,
          gameTag: '',
          teams: []
        }]
      });
    }

    // Create team with the player ID
    const team = await Team.create({
      name,
      game,
      logo,
      description,
      captainId: req.user.id,
      players: [{
        playerId: player._id,
        role: 'Captain',
        joinedAt: Date.now()
      }]
    });

    // Update user role to captain if player
    const user = await User.findById(req.user.id);
    if (user.role === 'player') {
      user.role = 'captain';
    }
    if (!user.teams.includes(team._id)) {
      user.teams.push(team._id);
    }
    await user.save();

    // Update player data
    const teamEntry = {
      teamId: team._id,
      role: 'Captain',
      joinedAt: Date.now()
    };
    
    const gameData = player.games.find(g => g.gameName === game);
    if (gameData) {
      if (!gameData.teams.some(t => t.teamId.equals(team._id))) {
        gameData.teams.push(teamEntry);
      }
    } else {
      player.games.push({
        gameName: game,
        gameTag: '',
        teams: [teamEntry]
      });
    }
    await player.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('captainId', 'username avatar')
      .populate({
        path: 'players.playerId',
        select: 'userId games',
        populate: {
          path: 'userId',
          select: 'username avatar'
        }
      });

    res.status(201).json({
      success: true,
      team: populatedTeam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Captain only)
export const updateTeam = async (req, res) => {
  try {
    const { name, logo, description } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (name) team.name = name;
    if (logo) team.logo = logo;
    if (description !== undefined) team.description = description;

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('captainId', 'username avatar')
      .populate('players.playerId', 'username avatar');

    res.status(200).json({
      success: true,
      team: populatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Captain only)
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Remove team from all players
    for (const playerEntry of team.players) {
      const player = await Player.findOne({ userId: playerEntry.playerId });
      if (player) {
        player.games.forEach(game => {
          game.teams = game.teams.filter(t => !t.teamId.equals(team._id));
        });
        await player.save();
      }

      const user = await User.findById(playerEntry.playerId);
      if (user) {
        user.teams = user.teams.filter(t => !t.equals(team._id));
        await user.save();
      }
    }

    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add player to team
// @route   POST /api/teams/:id/players
// @access  Private (Captain only)
export const addPlayer = async (req, res) => {
  try {
    const { playerId, role } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if player is already in this team
    const alreadyInTeam = team.players.some(p => p.playerId.toString() === playerId);
    if (alreadyInTeam) {
      return res.status(400).json({
        success: false,
        message: 'Player is already in this team'
      });
    }

    // Check if player is already in another team for this game (as member or captain)
    const existingTeam = await Team.findOne({
      game: team.game,
      $or: [
        { captainId: playerId },
        { 'players.playerId': playerId }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: `Player is already in team "${existingTeam.name}" for ${team.game}. Please leave that team first.`
      });
    }

    // Use team method
    await team.addPlayer(playerId, role);

    // Update user
    const user = await User.findById(playerId);
    if (user && !user.teams.includes(team._id)) {
      user.teams.push(team._id);
      await user.save();
    }

    // Update player data
    const player = await Player.findOne({ userId: playerId });
    if (player) {
      const gameData = player.games.find(g => g.gameName === team.game);
      if (gameData) {
        if (!gameData.teams.some(t => t.teamId.equals(team._id))) {
          gameData.teams.push({
            teamId: team._id,
            role: role || 'Player',
            joinedAt: Date.now()
          });
        }
      } else {
        player.games.push({
          gameName: team.game,
          gameTag: '',
          teams: [{
            teamId: team._id,
            role: role || 'Player',
            joinedAt: Date.now()
          }]
        });
      }
      await player.save();
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('captainId', 'username avatar')
      .populate('players.playerId', 'username avatar');

    res.status(200).json({
      success: true,
      team: populatedTeam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Join team (as current user)
// @route   POST /api/teams/:id/join
// @access  Private
export const joinTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const userId = req.user.id;

    // Check if user is the captain (captain is already in the team)
    if (team.captainId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You are already the captain of this team'
      });
    }

    // Ensure user has a Player document
    let player = await Player.findOne({ userId });
    if (!player) {
      const user = await User.findById(userId);
      player = await Player.create({
        userId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        games: [{
          gameName: team.game,
          gameTag: '',
          teams: []
        }]
      });
    }

    // Check if player is already in this team
    const alreadyInTeam = team.players.some(p => p.playerId.toString() === player._id.toString());
    if (alreadyInTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this team'
      });
    }

    // Check if player is already in another team for this game
    const existingTeam = await Team.findOne({
      game: team.game,
      $or: [
        { captainId: userId },
        { 'players.playerId': player._id }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: `You are already in team "${existingTeam.name}" for ${team.game}. Please leave that team first.`
      });
    }

    // Add player to team
    team.players.push({
      playerId: player._id,
      role: 'Player',
      joinedAt: Date.now()
    });
    await team.save();

    // Update user
    const user = await User.findById(userId);
    if (!user.teams.includes(team._id)) {
      user.teams.push(team._id);
      await user.save();
    }

    // Update player data
    const gameData = player.games.find(g => g.gameName === team.game);
    if (gameData) {
      if (!gameData.teams.some(t => t.teamId.equals(team._id))) {
        gameData.teams.push({
          teamId: team._id,
          role: 'Player',
          joinedAt: Date.now()
        });
      }
    } else {
      player.games.push({
        gameName: team.game,
        gameTag: '',
        teams: [{
          teamId: team._id,
          role: 'Player',
          joinedAt: Date.now()
        }]
      });
    }
    await player.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('captainId', 'username avatar')
      .populate({
        path: 'players.playerId',
        select: 'userId games',
        populate: {
          path: 'userId',
          select: 'username avatar'
        }
      });

    res.status(200).json({
      success: true,
      message: `Successfully joined team "${team.name}"`,
      team: populatedTeam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove player from team
// @route   DELETE /api/teams/:id/players/:playerId
// @access  Private (Captain only)
export const removePlayer = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Use team method
    await team.removePlayer(req.params.playerId);

    // Update user
    const user = await User.findById(req.params.playerId);
    if (user) {
      user.teams = user.teams.filter(t => !t.equals(team._id));
      await user.save();
    }

    // Update player data
    const player = await Player.findOne({ userId: req.params.playerId });
    if (player) {
      player.games.forEach(game => {
        game.teams = game.teams.filter(t => !t.teamId.equals(team._id));
      });
      await player.save();
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('captainId', 'username avatar')
      .populate('players.playerId', 'username avatar');

    res.status(200).json({
      success: true,
      team: populatedTeam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayer,
  joinTeam,
  removePlayer,
  joinTeam
};
