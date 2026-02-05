import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
export const getTournaments = async (req, res) => {
  try {
    const { game, status, search } = req.query;

    let query = {};
    if (game) query.game = game;
    if (status) query.status = status;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const tournaments = await Tournament.find(query)
      .populate('registeredTeams.teamId', 'name logo')
      .populate('winner', 'name logo')
      .sort('-startDate');

    res.status(200).json({
      success: true,
      count: tournaments.length,
      tournaments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single tournament
// @route   GET /api/tournaments/:id
// @access  Public
export const getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams.teamId', 'name logo stats')
      .populate('winner', 'name logo')
      .populate({
        path: 'matches',
        populate: {
          path: 'team1.teamId team2.teamId winner',
          select: 'name logo'
        }
      });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create tournament
// @route   POST /api/tournaments
// @access  Private (Admin only)
export const createTournament = async (req, res) => {
  try {
    const {
      name,
      game,
      description,
      startDate,
      endDate,
      maxTeams,
      prizePool,
      rules,
      format
    } = req.body;

    const tournament = await Tournament.create({
      name,
      game,
      description,
      startDate,
      endDate,
      maxTeams,
      prizePool,
      rules,
      format
    });

    res.status(201).json({
      success: true,
      tournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private (Admin only)
export const updateTournament = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      maxTeams,
      prizePool,
      rules,
      format
    } = req.body;

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (name) tournament.name = name;
    if (description !== undefined) tournament.description = description;
    if (startDate) tournament.startDate = startDate;
    if (endDate) tournament.endDate = endDate;
    if (maxTeams) tournament.maxTeams = maxTeams;
    if (prizePool !== undefined) tournament.prizePool = prizePool;
    if (rules) tournament.rules = rules;
    if (format) tournament.format = format;

    await tournament.save();

    res.status(200).json({
      success: true,
      tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update tournament status
// @route   PUT /api/tournaments/:id/status
// @access  Private (Admin only)
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    tournament.status = status;
    await tournament.save();

    res.status(200).json({
      success: true,
      tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register team to tournament
// @route   POST /api/tournaments/:id/register
// @access  Private (Captain only)
export const registerTeam = async (req, res) => {
  try {
    const { teamId } = req.body;

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Verify team game matches tournament
    if (team.game !== tournament.game) {
      return res.status(400).json({
        success: false,
        message: 'Team game does not match tournament game'
      });
    }

    // Use tournament method
    await tournament.registerTeam(teamId);
    await tournament.save(); // Save the changes

    const updatedTournament = await Tournament.findById(tournament._id)
      .populate('registeredTeams.teamId', 'name logo game');

    res.status(200).json({
      success: true,
      tournament: updatedTournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unregister team from tournament
// @route   DELETE /api/tournaments/:id/register/:teamId
// @access  Private (Captain only)
export const unregisterTeam = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Use tournament method
    await tournament.unregisterTeam(req.params.teamId);
    await tournament.save(); // Save the changes

    const updatedTournament = await Tournament.findById(tournament._id)
      .populate('registeredTeams.teamId', 'name logo game');

    res.status(200).json({
      success: true,
      tournament: updatedTournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get tournament standings
// @route   GET /api/tournaments/:id/standings
// @access  Public
export const getStandings = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('standings.teamId', 'name logo');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      standings: tournament.standings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get tournament matches
// @route   GET /api/tournaments/:id/matches
// @access  Public
export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.id })
      .populate('team1.teamId team2.teamId winner', 'name logo')
      .sort('round scheduledAt');

    res.status(200).json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
// @access  Private (Admin only)
export const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Delete all matches
    await Match.deleteMany({ tournamentId: tournament._id });

    await tournament.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update all tournament statuses
// @route   POST /api/tournaments/update-statuses
// @access  Private (Admin only)
export const updateAllStatuses = async (req, res) => {
  try {
    const result = await Tournament.updateAllStatuses();
    res.status(200).json({
      success: true,
      message: `Updated ${result.updated} of ${result.total} tournaments`,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  updateStatus,
  registerTeam,
  unregisterTeam,
  getStandings,
  getMatches,
  deleteTournament,
  updateAllStatuses
};
