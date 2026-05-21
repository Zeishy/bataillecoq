import Ladder from '../models/Ladder.js';
import User from '../models/User.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import { calculateTeamTournamentPoints, createLadderUpdateLog } from '../services/ladderPointsService.js';
import { calculatePlacementPoints } from '../config/pointsSystem.js';

// @desc    Get all ladder rankings
// @route   GET /api/ladder
// @access  Public
export const getLadder = async (req, res) => {
  try {
    const ladder = await Ladder.find()
      .sort({ points: -1 })
      .limit(100);

    if (!ladder) {
      return res.status(200).json({
        success: true,
        count: 0,
        ladder: []
      });
    }

    // Add rank to each entry
    const ladderWithRank = ladder.map((entry, index) => ({
      ...entry.toObject(),
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      count: ladderWithRank.length,
      ladder: ladderWithRank
    });
  } catch (error) {
    console.error('Get ladder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get player ladder entry
// @route   GET /api/ladder/:userId
// @access  Public
export const getPlayerLadder = async (req, res) => {
  try {
    const { userId } = req.params;

    const ladderEntry = await Ladder.findOne({ userId });

    if (!ladderEntry) {
      return res.status(404).json({
        success: false,
        message: 'Player not found in ladder'
      });
    }

    res.status(200).json({
      success: true,
      ladder: ladderEntry
    });
  } catch (error) {
    console.error('Get player ladder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add or update player in ladder with points
// @route   POST /api/ladder/add-points
// @access  Private (used internally)
export const addPointsToLadder = async (userId, points, reason = 'Tournament win') => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    let ladderEntry = await Ladder.findOne({ userId });

    if (!ladderEntry) {
      // Create new ladder entry
      ladderEntry = new Ladder({
        userId,
        username: user.username,
        points,
        gamesPlayed: 0,
        tournamentsWon: 1
      });
    } else {
      // Update existing entry
      ladderEntry.points += points;
      ladderEntry.tournamentsWon += 1;
    }

    ladderEntry.lastUpdated = new Date();
    await ladderEntry.save();

    return ladderEntry;
  } catch (error) {
    console.error('Add points to ladder error:', error);
    throw error;
  }
};

// @desc    Get ladder with pagination and filters
// @route   GET /api/ladder/search?page=1&limit=20
// @access  Public
export const searchLadder = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'points' } = req.query;

    let query = {};
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const total = await Ladder.countDocuments(query);
    const ladder = await Ladder.find(query)
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add rank to each entry
    const allLadder = await Ladder.find(query).sort({ [sortBy]: -1 });
    const ladderWithRank = ladder.map((entry) => {
      const rank = allLadder.findIndex(l => l._id.toString() === entry._id.toString()) + 1;
      return {
        ...entry.toObject(),
        rank
      };
    });

    res.status(200).json({
      success: true,
      count: ladder.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      ladder: ladderWithRank
    });
  } catch (error) {
    console.error('Search ladder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset ladder (admin only)
// @route   DELETE /api/ladder/reset
// @access  Private (Admin only)
export const resetLadder = async (req, res) => {
  try {
    await Ladder.deleteMany({});

    res.status(200).json({
      success: true,
      message: 'Ladder reset successfully'
    });
  } catch (error) {
    console.error('Reset ladder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Synchronize ladder with existing tournament winners
// @route   POST /api/ladder/sync
// @access  Private (Admin only)
export const syncLadderWithTournaments = async (req, res) => {
  try {
    console.log('Starting ladder synchronization...');

    // Find all completed tournaments with a winner
    const completedTournaments = await Tournament.find({
      status: 'completed',
      winner: { $exists: true, $ne: null }
    }).populate('winner').populate('standings.teamId');

    console.log(`Found ${completedTournaments.length} completed tournaments`);

    let playersUpdated = 0;
    let totalPointsAdded = 0;
    const updateDetails = [];

    // For each completed tournament
    for (const tournament of completedTournaments) {
      if (!tournament.winner) {
        continue;
      }

      try {
        const weight = tournament.weight || 1.0;
        
        // Get all teams in tournament with standings
        const standings = tournament.standings || [];
        
        // For each standing (ranked team)
        for (const standing of standings) {
          const placement = standing.rank || standings.indexOf(standing) + 1;
          
          try {
            // Count matches won by this team in this tournament
            const Match = (await import('../models/Match.js')).default;
            const matchesWon = await Match.countDocuments({
              tournamentId: tournament._id,
              $or: [
                { 'team1.teamId': standing.teamId, winner: standing.teamId },
                { 'team2.teamId': standing.teamId, winner: standing.teamId }
              ],
              status: 'completed'
            });

            // Get the team with properly populated players
            const team = await Team.findById(standing.teamId)
              .populate('players.userId', '_id username')
              .populate({
                path: 'players.playerId',
                select: 'userId',
                populate: {
                  path: 'userId',
                  select: '_id username'
                }
              });

            if (!team || !team.players || team.players.length === 0) {
              continue;
            }

            // Calculate points based on placement, matches won, and weight
            const pointsData = calculateTeamTournamentPoints({
              placement,
              matchesWon,
              weight,
              tournamentName: tournament.name
            });

            console.log(`Team ${team.name}: Placement #${placement}, Matches Won: ${matchesWon}, Weight: ${weight}, Total Points: ${pointsData.totalPoints}`);

            // Award points to each player
            for (const player of team.players) {
              let userId = null;

              // Multi-level userId resolution
              if (player.userId && player.userId._id) {
                userId = player.userId._id;
              } else if (player.playerId && player.playerId.userId) {
                userId = player.playerId.userId;
              } else if (player.playerId) {
                const playerDoc = await Player.findById(player.playerId)
                  .populate('userId', '_id username');
                if (playerDoc && playerDoc.userId) {
                  userId = playerDoc.userId._id;
                }
              }

              if (!userId) continue;

              // Use the addPlacementPointsToLadder function with match count
              try {
                const result = await addPlacementPointsToLadder(
                  userId,
                  placement,
                  weight,
                  tournament.name,
                  tournament._id,
                  matchesWon
                );

                updateDetails.push({
                  username: result.ladderEntry.username,
                  action: ladderEntry ? 'updated' : 'created',
                  placement,
                  matchesWon,
                  weight,
                  pointsBreakdown: result.pointsBreakdown,
                  totalPoints: result.pointsBreakdown.totalPoints,
                  tournament: tournament.name
                });

                playersUpdated++;
                totalPointsAdded += result.pointsBreakdown.totalPoints;
              } catch (error) {
                console.error(`Error adding points for user ${userId}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error processing team in tournament:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing tournament ${tournament.name}:`, error.message);
      }
    }

    // Get top players
    const topPlayers = await Ladder.find()
      .sort({ points: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: 'Ladder synchronized successfully',
      stats: {
        tournamentsProcessed: completedTournaments.length,
        playersUpdated,
        totalPointsAdded
      },
      updates: updateDetails,
      topPlayers
    });
  } catch (error) {
    console.error('Sync ladder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Synchronize ladder with existing tournament winners (NO AUTH - for debugging)
// @route   POST /api/ladder/sync-debug
// @access  Public (FOR TESTING ONLY - REMOVE IN PRODUCTION)
export const syncLadderDebug = async (req, res) => {
  try {
    console.log('🔄 [DEBUG] Starting ladder synchronization with weight consideration...');

    // Find all completed tournaments with a winner
    const completedTournaments = await Tournament.find({
      status: 'completed',
      winner: { $exists: true, $ne: null }
    }).populate('winner').populate('standings.teamId');

    console.log(`📊 [DEBUG] Found ${completedTournaments.length} completed tournaments`);

    let playersUpdated = 0;
    let totalPointsAdded = 0;
    const updateDetails = [];

    // For each completed tournament
    for (const tournament of completedTournaments) {
      console.log(`\n📋 [DEBUG] Processing tournament: "${tournament.name}"`);

      if (!tournament.winner) {
        console.log('⚠️  [DEBUG] No winner found, skipping');
        continue;
      }

      try {
        const weight = tournament.weight || 1.0;
        console.log(`⚖️  [DEBUG] Tournament weight: ${weight}x`);

        const standings = tournament.standings || [];

        // For each standing (ranked team)
        for (const standing of standings) {
          const placement = standing.rank || standings.indexOf(standing) + 1;
          
          try {
            // Get the team with properly populated players
            const team = await Team.findById(standing.teamId)
              .populate('players.userId', '_id username')
              .populate({
                path: 'players.playerId',
                select: 'userId',
                populate: {
                  path: 'userId',
                  select: '_id username'
                }
              });

            if (!team || !team.players || team.players.length === 0) {
              console.log(`⚠️  [DEBUG] No players in team ${standing.teamId}`);
              continue;
            }

            // Count matches won
            const matchesWon = await Match.countDocuments({
              tournamentId: tournament._id,
              $or: [
                { 'team1.teamId': standing.teamId, winner: standing.teamId },
                { 'team2.teamId': standing.teamId, winner: standing.teamId }
              ],
              status: 'completed'
            });

            // Calculate points based on placement, matches won, and weight
            const pointsCalculation = calculateTeamTournamentPoints({
              placement,
              matchesWon,
              weight,
              tournamentName: tournament.name
            });

            console.log(`👥 [DEBUG] Team: ${team.name}, Placement #${placement}, Matches Won: ${matchesWon}, Points: ${pointsCalculation.totalPoints} (placement: ${pointsCalculation.placementPoints} + matches: ${pointsCalculation.matchPoints})`);

            // Award points to each player
            for (const player of team.players) {
              let userId = null;

              // Multi-level userId resolution
              if (player.userId && player.userId._id) {
                userId = player.userId._id;
              } else if (player.playerId && player.playerId.userId) {
                userId = player.playerId.userId;
              } else if (player.playerId) {
                const playerDoc = await Player.findById(player.playerId)
                  .populate('userId', '_id username');
                if (playerDoc && playerDoc.userId) {
                  userId = playerDoc.userId._id;
                }
              }

              if (!userId) {
                console.log(`⚠️  [DEBUG] Could not resolve userId for player`);
                continue;
              }

              const user = await User.findById(userId);
              if (!user) {
                console.log(`⚠️  [DEBUG] User not found: ${userId}`);
                continue;
              }

              let ladderEntry = await Ladder.findOne({ userId });

              if (!ladderEntry) {
                // Create new ladder entry
                ladderEntry = new Ladder({
                  userId,
                  username: user.username,
                  points: pointsCalculation.totalPoints,
                  gamesPlayed: matchesWon,
                  tournamentsWon: placement === 1 ? 1 : 0,
                  pointsHistory: [{
                    tournamentId: tournament._id,
                    placement,
                    weight,
                    matchesWon,
                    pointsEarned: pointsCalculation.totalPoints,
                    placementPoints: pointsCalculation.placementPoints,
                    matchPoints: pointsCalculation.matchPoints,
                    earnedAt: new Date()
                  }]
                });
                console.log(`✅ [DEBUG] Created ladder entry for ${user.username} with ${pointsCalculation.totalPoints} points`);
                updateDetails.push({
                  username: user.username,
                  action: 'created',
                  points: pointsCalculation.totalPoints,
                  placement,
                  weight,
                  matchesWon,
                  tournament: tournament.name
                });
              } else {
                // Update existing entry
                const oldPoints = ladderEntry.points;
                ladderEntry.points += pointsCalculation.totalPoints;
                ladderEntry.gamesPlayed += matchesWon;
                if (placement === 1) {
                  ladderEntry.tournamentsWon += 1;
                }
                ladderEntry.pointsHistory.push({
                  tournamentId: tournament._id,
                  placement,
                  weight,
                  matchesWon,
                  pointsEarned: pointsCalculation.totalPoints,
                  placementPoints: pointsCalculation.placementPoints,
                  matchPoints: pointsCalculation.matchPoints,
                  earnedAt: new Date()
                });
                console.log(`✅ [DEBUG] Updated ${user.username}: ${oldPoints} → ${ladderEntry.points} points (${placement === 1 ? 'WINNER' : `#${placement}`}, ${matchesWon} wins)`);
                updateDetails.push({
                  username: user.username,
                  action: 'updated',
                  oldPoints,
                  newPoints: ladderEntry.points,
                  points: pointsCalculation.totalPoints,
                  placement,
                  weight,
                  matchesWon,
                  tournament: tournament.name,
                  totalPoints: ladderEntry.points
                });
              }

              ladderEntry.lastUpdated = new Date();
              await ladderEntry.save();

              playersUpdated++;
              totalPointsAdded += placementPoints;
            }
          } catch (error) {
            console.error(`❌ [DEBUG] Error processing team in tournament:`, error.message);
          }
        }
      } catch (error) {
        console.error(`❌ [DEBUG] Error processing tournament ${tournament.name}:`, error.message);
      }
    }

    // Get top players
    const topPlayers = await Ladder.find()
      .sort({ points: -1 })
      .limit(10);

    console.log('\n════════════════════════════════════════');
    console.log('✅ [DEBUG] Ladder synchronization complete!');
    console.log(`📊 [DEBUG] Tournaments: ${completedTournaments.length}`);
    console.log(`👥 [DEBUG] Players updated: ${playersUpdated}`);
    console.log(`⭐ [DEBUG] Total points added: ${totalPointsAdded}`);
    console.log('════════════════════════════════════════\n');

    res.status(200).json({
      success: true,
      message: 'Ladder synchronized successfully (DEBUG MODE - with weight)',
      stats: {
        tournamentsProcessed: completedTournaments.length,
        playersUpdated,
        totalPointsAdded
      },
      updates: updateDetails,
      topPlayers: topPlayers.map((p, idx) => ({
        rank: idx + 1,
        username: p.username,
        points: p.points,
        tournamentsWon: p.tournamentsWon
      }))
    });
  } catch (error) {
    console.error('❌ [DEBUG] Sync ladder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add points to ladder based on tournament placement with weight and match wins
// @route   POST /api/ladder/add-placement-points (internal)
// @access  Private (used internally)
export const addPlacementPointsToLadder = async (userId, placement, weight = 1.0, tournamentName = 'Tournament', tournamentId = null, matchesWon = 0) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate points: placement + match wins with weight
    const pointsData = calculateTeamTournamentPoints({
      placement,
      matchesWon,
      weight,
      tournamentName
    });

    const totalPoints = pointsData.totalPoints;

    let ladderEntry = await Ladder.findOne({ userId });

    if (!ladderEntry) {
      // Create new ladder entry
      ladderEntry = new Ladder({
        userId,
        username: user.username,
        points: totalPoints,
        gamesPlayed: matchesWon,
        tournamentsParticipated: 1,
        tournamentsWon: placement === 1 ? 1 : 0,
        pointsHistory: [{
          tournamentId,
          tournamentName,
          placement,
          weight,
          matchesWon,
          pointsEarned: totalPoints,
          placementPoints: pointsData.placementPoints,
          matchPoints: pointsData.matchPoints,
          earnedAt: new Date()
        }]
      });
    } else {
      // Update existing entry
      ladderEntry.points += totalPoints;
      ladderEntry.gamesPlayed = (ladderEntry.gamesPlayed || 0) + matchesWon;
      ladderEntry.tournamentsParticipated = (ladderEntry.tournamentsParticipated || 0) + 1;
      if (placement === 1) {
        ladderEntry.tournamentsWon += 1;
      }
      
      // Add to history with detailed breakdown
      if (!ladderEntry.pointsHistory) {
        ladderEntry.pointsHistory = [];
      }
      ladderEntry.pointsHistory.push({
        tournamentId,
        tournamentName,
        placement,
        weight,
        matchesWon,
        pointsEarned: totalPoints,
        placementPoints: pointsData.placementPoints,
        matchPoints: pointsData.matchPoints,
        earnedAt: new Date()
      });
    }

    ladderEntry.lastUpdated = new Date();
    await ladderEntry.save();

    return {
      ladderEntry,
      pointsAwarded: totalPoints,
      pointsBreakdown: {
        placement,
        matchesWon,
        weight,
        placementPoints: pointsData.placementPoints,
        matchPoints: pointsData.matchPoints,
        totalPoints
      },
      placement,
      weight,
      tournament: tournamentName
    };
  } catch (error) {
    console.error('Add placement points to ladder error:', error);
    throw error;
  }
};

