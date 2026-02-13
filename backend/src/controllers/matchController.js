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

// @desc    Update match score and advance bracket
// @route   PUT /api/matches/:id/score-and-advance
// @access  Private (Admin only)
export const updateScoreAndAdvance = async (req, res) => {
  try {
    const { team1Score, team2Score, winnerId } = req.body;

    const match = await Match.findById(req.params.id)
      .populate('tournamentId')
      .populate('team1.teamId team2.teamId', 'name logo');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    if (team1Score === team2Score) {
      return res.status(400).json({
        success: false,
        message: 'Scores cannot be equal. There must be a winner.'
      });
    }

    // Update match scores
    match.team1.score = team1Score;
    match.team2.score = team2Score;
    match.winner = winnerId;
    match.status = 'completed';
    await match.save();

    const tournament = await Tournament.findById(match.tournamentId._id)
      .populate('registeredTeams.teamId', '_id name logo');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Update tournament standings
    const winningTeamReg = tournament.registeredTeams.find(
      rt => rt.teamId._id.toString() === winnerId.toString()
    );
    const losingTeamId = winnerId.toString() === match.team1.teamId._id.toString()
      ? match.team2.teamId._id
      : match.team1.teamId._id;

    if (tournament.format === 'single-elimination' || tournament.format === 'double-elimination') {
      // Update bracket
      if (tournament.bracket && tournament.bracket.rounds) {
        console.log('=== UPDATING BRACKET ===');
        console.log('Match round:', match.round);
        console.log('Match matchNumber:', match.matchNumber);
        console.log('Winner ID:', winnerId);
        
        const currentRound = tournament.bracket.rounds.find(r => r.round === match.round);
        if (currentRound) {
          console.log('Found current round:', currentRound.round);
          const matchInBracket = currentRound.matches.find(m => 
            m.matchId && m.matchId.toString() === match._id.toString()
          );
          if (matchInBracket) {
            console.log('Updating match in bracket at position:', matchInBracket.position);
            matchInBracket.team1.score = team1Score;
            matchInBracket.team2.score = team2Score;
            matchInBracket.winner = winnerId;
            matchInBracket.status = 'completed';
          }
        }

        // Advance winner to next round
        const nextRoundNumber = match.round + 1;
        const nextRound = tournament.bracket.rounds.find(r => r.round === nextRoundNumber);
        
        console.log('Next round number:', nextRoundNumber);
        console.log('Next round found:', !!nextRound);
        
        if (nextRound) {
          // Find the position of current match in its round
          const currentRoundMatches = currentRound.matches;
          const currentMatchPositionInRound = currentRoundMatches.findIndex(m => 
            m.matchId && m.matchId.toString() === match._id.toString()
          );
          
          console.log('Current match position in round:', currentMatchPositionInRound);
          
          // In elimination, every 2 matches feed into 1 match in next round
          const nextMatchPosition = Math.floor(currentMatchPositionInRound / 2);
          const nextMatch = nextRound.matches[nextMatchPosition];
          
          console.log('Next match position:', nextMatchPosition);
          console.log('Next match exists:', !!nextMatch);
          
          if (nextMatch) {
            // Determine if winner goes to team1 or team2 slot
            // If current position is even (0, 2, 4...), winner goes to team1
            // If current position is odd (1, 3, 5...), winner goes to team2
            const goesToTeam1 = currentMatchPositionInRound % 2 === 0;
            const winningTeam = winnerId.toString() === match.team1.teamId._id.toString()
              ? match.team1.teamId
              : match.team2.teamId;

            console.log('Winner goes to team1?', goesToTeam1);
            console.log('Winning team:', winningTeam.name);

            if (goesToTeam1) {
              nextMatch.team1 = {
                _id: winningTeam._id,
                name: winningTeam.name,
                logo: winningTeam.logo,
                score: 0
              };
              console.log('Set team1 in next match');
            } else {
              nextMatch.team2 = {
                _id: winningTeam._id,
                name: winningTeam.name,
                logo: winningTeam.logo,
                score: 0
              };
              console.log('Set team2 in next match');
            }

            console.log('Next match team1:', nextMatch.team1);
            console.log('Next match team2:', nextMatch.team2);
            console.log('Next match already has matchId?', !!nextMatch.matchId);

            // Create actual match in DB if both teams are known
            const team1HasId = nextMatch.team1 && nextMatch.team1._id;
            const team2HasId = nextMatch.team2 && nextMatch.team2._id;
            console.log('Team1 has ID:', team1HasId);
            console.log('Team2 has ID:', team2HasId);
            
            if (team1HasId && team2HasId && !nextMatch.matchId) {
              console.log('Creating new match in database for next round');
              const newMatch = new Match({
                tournamentId: tournament._id,
                round: nextRoundNumber,
                matchNumber: nextMatch.position,
                team1: { teamId: nextMatch.team1._id, score: 0 },
                team2: { teamId: nextMatch.team2._id, score: 0 },
                scheduledDate: new Date(Date.now() + 86400000), // Next day
                status: 'pending'
              });
              await newMatch.save();
              console.log('New match created with ID:', newMatch._id);
              nextMatch.matchId = newMatch._id;
              tournament.matches.push(newMatch._id);
            } else {
              console.log('Cannot create match yet. team1._id:', nextMatch.team1._id, 'team2._id:', nextMatch.team2._id, 'matchId:', nextMatch.matchId);
            }
          }
        }

        // Mark bracket as modified and save tournament to persist bracket changes
        tournament.markModified('bracket');
        await tournament.save();
        console.log('Tournament bracket saved');

        // Check if this was the final
        const isFinal = match.round === tournament.bracket.totalRounds;
        if (isFinal) {
          tournament.winner = winnerId;
          tournament.status = 'completed';
          tournament.manualStatusOverride = true; // Tournament is finished, prevent auto-update
          
          // Calculate actual wins and losses for all teams
          const teamStats = new Map();
          
          // Initialize all registered teams
          tournament.registeredTeams.forEach(reg => {
            const teamId = reg.teamId._id || reg.teamId;
            teamStats.set(teamId.toString(), {
              teamId: teamId,
              wins: 0,
              losses: 0,
              points: 0
            });
          });
          
          // Count wins and losses from bracket
          tournament.bracket.rounds.forEach(round => {
            round.matches.forEach(match => {
              if (match.winner && match.team1?._id && match.team2?._id) {
                const winnerId = match.winner.toString();
                const team1Id = match.team1._id.toString();
                const team2Id = match.team2._id.toString();
                
                // Increment wins for winner
                if (teamStats.has(winnerId)) {
                  teamStats.get(winnerId).wins++;
                }
                
                // Increment losses for loser
                const loserId = winnerId === team1Id ? team2Id : team1Id;
                if (teamStats.has(loserId)) {
                  teamStats.get(loserId).losses++;
                }
              }
            });
          });
          
          // Calculate points (3 points per win)
          teamStats.forEach(stats => {
            stats.points = stats.wins * 3;
          });
          
          // Convert to array and sort by wins, then by losses (ascending)
          const sortedTeams = Array.from(teamStats.values()).sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return a.losses - b.losses;
          });
          
          // Assign ranks
          tournament.standings = sortedTeams.map((stats, index) => ({
            teamId: stats.teamId,
            rank: index + 1,
            wins: stats.wins,
            losses: stats.losses,
            points: stats.points
          }));
        }

        await tournament.save();
      }
    } else {
      // Round-robin: just update standings
      await tournament.updateStandings(winnerId, true);
      await tournament.updateStandings(losingTeamId, false);
      await tournament.save();
    }

    // Populate the updated match
    const populatedMatch = await Match.findById(match._id)
      .populate('tournamentId', 'name game format')
      .populate('team1.teamId team2.teamId winner', 'name logo');

    res.status(200).json({
      success: true,
      match: populatedMatch,
      bracket: tournament.bracket,
      tournamentStatus: tournament.status,
      winner: tournament.winner
    });
  } catch (error) {
    console.error('Error updating score and advancing:', error);
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
  deleteMatch,
  updateScoreAndAdvance
};
