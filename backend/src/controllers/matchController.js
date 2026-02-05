import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';

// @desc    Get match details
// @route   GET /api/matches/:id
// @access  Public
export const getMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournamentId', 'name game format')
      .populate('team1.teamId team2.teamId winner', 'name logo')
      .populate('playerStats.playerId', 'username avatar');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create match
// @route   POST /api/matches
// @access  Private (Admin only)
export const createMatch = async (req, res) => {
  try {
    const {
      tournamentId,
      team1Id,
      team2Id,
      round,
      scheduledAt
    } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const team1 = await Team.findById(team1Id);
    const team2 = await Team.findById(team2Id);

    if (!team1 || !team2) {
      return res.status(404).json({
        success: false,
        message: 'One or both teams not found'
      });
    }

    const match = await Match.create({
      tournamentId,
      team1: { teamId: team1Id },
      team2: { teamId: team2Id },
      round,
      scheduledAt
    });

    // Add match to tournament
    tournament.matches.push(match._id);
    await tournament.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('tournamentId', 'name game format')
      .populate('team1.teamId team2.teamId', 'name logo');

    res.status(201).json({
      success: true,
      match: populatedMatch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update match score
// @route   PUT /api/matches/:id/score
// @access  Private (Admin only)
export const updateScore = async (req, res) => {
  try {
    const { team1Score, team2Score } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Use match method
    await match.updateScore(team1Score, team2Score);

    const populatedMatch = await Match.findById(match._id)
      .populate('tournamentId', 'name game format')
      .populate('team1.teamId team2.teamId winner', 'name logo');

    res.status(200).json({
      success: true,
      match: populatedMatch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete match and update standings
// @route   PUT /api/matches/:id/complete
// @access  Private (Admin only)
export const completeMatch = async (req, res) => {
  try {
    const { playerStats } = req.body;

    const match = await Match.findById(req.params.id)
      .populate('tournamentId');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Add player stats if provided
    if (playerStats && Array.isArray(playerStats)) {
      match.playerStats = playerStats;
    }

    // Use match method
    await match.completeMatch();

    // Update tournament standings
    if (match.winner) {
      const tournament = match.tournamentId;
      
      // Update team stats
      const winningTeam = await Team.findById(match.winner);
      const losingTeamId = match.winner.equals(match.team1.teamId) 
        ? match.team2.teamId 
        : match.team1.teamId;
      const losingTeam = await Team.findById(losingTeamId);

      if (winningTeam) {
        await winningTeam.updateStats({ wins: 1, points: 3 });
      }
      if (losingTeam) {
        await losingTeam.updateStats({ losses: 1 });
      }

      // Update tournament standings
      await tournament.updateStandings();
    }

    const populatedMatch = await Match.findById(match._id)
      .populate('tournamentId', 'name game format')
      .populate('team1.teamId team2.teamId winner', 'name logo')
      .populate('playerStats.playerId', 'username avatar');

    res.status(200).json({
      success: true,
      match: populatedMatch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete match
// @route   DELETE /api/matches/:id
// @access  Private (Admin only)
export const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Remove from tournament
    const tournament = await Tournament.findById(match.tournamentId);
    if (tournament) {
      tournament.matches = tournament.matches.filter(
        m => !m.equals(match._id)
      );
      await tournament.save();
    }

    await match.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  getMatch,
  createMatch,
  updateScore,
  completeMatch,
  deleteMatch
};
