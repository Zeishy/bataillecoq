import Match from '../models/Match.js';
import MapPool from '../models/MapPool.js';
import Tournament from '../models/Tournament.js';

// @desc    Start pick and ban process
// @route   POST /api/pick-and-ban/:matchId/start
// @access  Private (Admin or Captain)
export const startPickAndBan = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('tournamentId')
      .populate('mapPoolId');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    if (match.pickAndBan.status !== 'not-started') {
      return res.status(400).json({
        success: false,
        message: 'Pick and ban already started or completed'
      });
    }
    
    match.pickAndBan.status = 'in-progress';
    await match.save();
    
    res.status(200).json({
      success: true,
      message: 'Pick and ban started',
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Select a map during pick and ban
// @route   POST /api/pick-and-ban/:matchId/pick
// @access  Private (Captain)
export const pickMap = async (req, res) => {
  try {
    const { mapName, mode, teamId } = req.body;
    
    if (!mapName || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'Map name and team ID are required'
      });
    }
    
    const match = await Match.findById(req.params.matchId)
      .populate('mapPoolId');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    if (match.pickAndBan.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Pick and ban not in progress'
      });
    }
    
    // Verify team belongs to this match
    const isTeamInMatch = 
      match.team1.teamId.toString() === teamId || 
      match.team2.teamId.toString() === teamId;
    
    if (!isTeamInMatch) {
      return res.status(403).json({
        success: false,
        message: 'Team is not part of this match'
      });
    }
    
    // Check if map already selected
    const alreadyPicked = match.pickAndBan.selectedMaps.some(
      m => m.mapName === mapName && (!mode || m.mode === mode)
    );
    
    if (alreadyPicked) {
      return res.status(400).json({
        success: false,
        message: 'This map is already selected'
      });
    }
    
    // Add picked map
    match.pickAndBan.selectedMaps.push({
      mode: mode || null,
      mapName,
      pickedBy: teamId
    });
    
    await match.save();
    
    res.status(200).json({
      success: true,
      message: 'Map picked successfully',
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Ban a map during pick and ban
// @route   POST /api/pick-and-ban/:matchId/ban
// @access  Private (Captain)
export const banMap = async (req, res) => {
  try {
    const { mapName, teamId } = req.body;
    
    if (!mapName || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'Map name and team ID are required'
      });
    }
    
    const match = await Match.findById(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    if (match.pickAndBan.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Pick and ban not in progress'
      });
    }
    
    // Verify team belongs to this match
    const isTeamInMatch = 
      match.team1.teamId.toString() === teamId || 
      match.team2.teamId.toString() === teamId;
    
    if (!isTeamInMatch) {
      return res.status(403).json({
        success: false,
        message: 'Team is not part of this match'
      });
    }
    
    // Check if map already banned
    const alreadyBanned = match.pickAndBan.bannedMaps.some(
      m => m.mapName === mapName
    );
    
    if (alreadyBanned) {
      return res.status(400).json({
        success: false,
        message: 'This map is already banned'
      });
    }
    
    // Add banned map
    match.pickAndBan.bannedMaps.push({
      mapName,
      bannedBy: teamId
    });
    
    await match.save();
    
    res.status(200).json({
      success: true,
      message: 'Map banned successfully',
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete pick and ban process
// @route   PUT /api/pick-and-ban/:matchId/complete
// @access  Private (Admin)
export const completePickAndBan = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    if (match.pickAndBan.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Pick and ban not in progress'
      });
    }
    
    match.pickAndBan.status = 'completed';
    match.pickAndBan.completedAt = new Date();
    
    await match.save();
    
    res.status(200).json({
      success: true,
      message: 'Pick and ban completed',
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get match pick and ban status
// @route   GET /api/pick-and-ban/:matchId
// @access  Public
export const getPickAndBanStatus = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('mapPoolId')
      .select('team1 team2 pickAndBan matchFormat mapPoolId');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.status(200).json({
      success: true,
      pickAndBan: match.pickAndBan,
      matchFormat: match.matchFormat,
      mapPool: match.mapPoolId,
      teams: {
        team1: match.team1.teamId,
        team2: match.team2.teamId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
