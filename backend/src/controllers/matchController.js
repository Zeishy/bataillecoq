import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { getIO } from '../config/socket.js';
import { awardTournamentLadderPoints } from '../services/tournamentLadderService.js';

const hasSelectedPlayers = (team) => Array.isArray(team?.selectedPlayers) && team.selectedPlayers.length > 0;

const matchRequiresPickAndBan = (match) => Boolean(match?.mapPoolId);

const isPickAndBanCompleted = (match) =>
  !matchRequiresPickAndBan(match) || match.pickAndBan?.status === 'completed';

const ensureMatchPickAndBanConfig = async (match) => {
  if (match.mapPoolId && match.matchFormat) return match;

  const tournamentId = match.tournamentId?._id || match.tournamentId;
  if (!tournamentId) return match;

  const tournament = await Tournament.findById(tournamentId).select('mapPoolId matchFormat finalFormat bracket');
  if (!tournament) return match;

  if (!match.mapPoolId && tournament.mapPoolId) {
    match.mapPoolId = tournament.mapPoolId;
  }
  const expectedFormat = getMatchFormatForRound(tournament, match.round, match.matchFormat || 'bo3');
  if (expectedFormat && match.matchFormat !== expectedFormat) {
    match.matchFormat = expectedFormat;
  }

  return match;
};

const validateMatchCanEnterScores = (match) => {
  if (match.status !== 'ongoing') {
    return 'Le match doit être en cours avant de pouvoir entrer un score';
  }

  if (!isPickAndBanCompleted(match)) {
    return 'Le pick and ban doit être terminé avant de pouvoir entrer un score';
  }

  return null;
};

const getMatchFormatForRound = (tournament, round, fallback = 'bo3') => {
  const totalRounds = tournament?.bracket?.totalRounds;
  const isFinal = totalRounds && round === totalRounds;
  return isFinal ? (tournament.finalFormat || tournament.matchFormat || fallback) : (tournament.matchFormat || fallback);
};

const populateMatchResponse = (query) => query
  .populate('tournamentId', 'name game format mapPoolId matchFormat finalFormat')
  .populate('team1.teamId team2.teamId winner', 'name logo captainId')
  .populate('mapPoolId')
  .populate({
    path: 'team1.selectedPlayers team2.selectedPlayers',
    select: 'userId inGameName games',
    populate: {
      path: 'userId',
      select: 'username avatar'
    }
  })
  .populate('playerStats.playerId', 'username avatar');

// Helper to complete a match and advance the tournament bracket
const completeMatchAndAdvance = async (match, team1Score, team2Score, winnerId) => {
  try {
    let shouldAwardLadderPoints = false;
    // Populate necessary fields if not present
    if (!match.tournamentId?._id) {
      await match.populate('tournamentId');
    }
    if (!match.team1?.teamId?._id || !match.team2?.teamId?._id) {
      await match.populate('team1.teamId team2.teamId');
    }

    // Update match scores
    match.team1.score = team1Score;
    match.team2.score = team2Score;
    match.winner = winnerId;
    match.status = 'completed';
    await match.save();

    const tournament = await Tournament.findById(match.tournamentId._id)
      .populate('registeredTeams.teamId', '_id name logo');

    if (!tournament) return;

    // Update tournament standings
    const winningTeamIdStr = winnerId.toString();
    const losingTeamId = winningTeamIdStr === match.team1.teamId._id.toString()
      ? match.team2.teamId._id
      : match.team1.teamId._id;

    if (tournament.format === 'single-elimination' || tournament.format === 'double-elimination') {
      // Update bracket
      if (tournament.bracket && tournament.bracket.rounds) {
        let matchInBracket = null;
        let currentRound = null;

        // Find the match in any round by its ID
        for (const round of tournament.bracket.rounds) {
          matchInBracket = round.matches.find(m => m.matchId?.toString() === match._id.toString());
          if (matchInBracket) {
            currentRound = round;
            break;
          }
        }

        // If not found by ID, try by round and position (as backup)
        if (!matchInBracket) {
          currentRound = tournament.bracket.rounds.find(r => r.round === match.round);
          if (currentRound) {
            matchInBracket = currentRound.matches.find(m => m.position === match.matchNumber || m.position === match.matchNumber - 1);
          }
        }

        if (matchInBracket) {
          // Sync matchId if it was missing
          if (!matchInBracket.matchId) matchInBracket.matchId = match._id;
          
          matchInBracket.team1.score = team1Score;
          matchInBracket.team2.score = team2Score;
          matchInBracket.winner = winnerId;
          matchInBracket.status = 'completed';
          matchInBracket.completedAt = new Date();
        }

        // Advance winner to next round
        const nextRoundNumber = match.round + 1;
        const nextRound = tournament.bracket.rounds.find(r => r.round === nextRoundNumber);
        
        if (nextRound && currentRound) {
          const currentRoundMatches = currentRound.matches;
          const currentMatchPositionInRound = currentRoundMatches.findIndex(m => 
            m.matchId && m.matchId.toString() === match._id.toString()
          );
          
          if (currentMatchPositionInRound !== -1) {
            const nextMatchPosition = Math.floor(currentMatchPositionInRound / 2);
            const nextMatch = nextRound.matches[nextMatchPosition];
            
            if (nextMatch) {
              const goesToTeam1 = currentMatchPositionInRound % 2 === 0;
              const winningTeam = winnerId.toString() === match.team1.teamId._id.toString()
                ? match.team1.teamId
                : match.team2.teamId;

              if (goesToTeam1) {
                nextMatch.team1 = {
                  _id: winningTeam._id,
                  name: winningTeam.name,
                  logo: winningTeam.logo,
                  score: 0
                };
              } else {
                nextMatch.team2 = {
                  _id: winningTeam._id,
                  name: winningTeam.name,
                  logo: winningTeam.logo,
                  score: 0
                };
              }

              if (nextMatch.team1?._id && nextMatch.team2?._id && !nextMatch.matchId) {
                const newMatch = new Match({
                  tournamentId: tournament._id,
                  round: nextRoundNumber,
                  matchNumber: nextMatch.position,
                  team1: { teamId: nextMatch.team1._id, score: 0 },
                  team2: { teamId: nextMatch.team2._id, score: 0 },
                  mapPoolId: tournament.mapPoolId || null,
                  matchFormat: getMatchFormatForRound(tournament, nextRoundNumber, match.matchFormat || 'bo3'),
                  scheduledDate: new Date(Date.now() + 86400000),
                  status: 'pending'
                });
                await newMatch.save();
                nextMatch.matchId = newMatch._id;
                tournament.matches.push(newMatch._id);
              }
            }
          }
        }

        tournament.markModified('bracket');
        
        // Check final
        const isFinal = match.round === tournament.bracket.totalRounds;
        if (isFinal) {
          tournament.winner = winnerId;
          tournament.status = 'completed';
          tournament.manualStatusOverride = true;
          shouldAwardLadderPoints = true;
        }
      }
    } else {
      // Logic for Round Robin or other formats
      tournament.updateStandings(winningTeamIdStr, true);
      tournament.updateStandings(losingTeamId.toString(), false);
    }

    // Always update standings regardless of format
    if (!tournament.standings) {
      tournament.standings = [];
    }
    
    // Find or create standings entries for both teams
    let team1Standing = tournament.standings.find(s => s.teamId._id.toString() === match.team1.teamId._id.toString());
    let team2Standing = tournament.standings.find(s => s.teamId._id.toString() === match.team2.teamId._id.toString());

    if (!team1Standing) {
      team1Standing = { teamId: match.team1.teamId._id, wins: 0, losses: 0, points: 0 };
      tournament.standings.push(team1Standing);
    }
    if (!team2Standing) {
      team2Standing = { teamId: match.team2.teamId._id, wins: 0, losses: 0, points: 0 };
      tournament.standings.push(team2Standing);
    }

    // Update standings based on winner
    if (winningTeamIdStr === match.team1.teamId._id.toString()) {
      team1Standing.wins = (team1Standing.wins || 0) + 1;
      team1Standing.points = (team1Standing.points || 0) + 3;
      team2Standing.losses = (team2Standing.losses || 0) + 1;
    } else {
      team2Standing.wins = (team2Standing.wins || 0) + 1;
      team2Standing.points = (team2Standing.points || 0) + 3;
      team1Standing.losses = (team1Standing.losses || 0) + 1;
    }

    // Sort standings by points (descending)
    tournament.standings.sort((a, b) => (b.points || 0) - (a.points || 0));
    tournament.standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    if (tournament.format !== 'single-elimination' && tournament.format !== 'double-elimination') {
      const remainingMatches = await Match.countDocuments({
        tournamentId: tournament._id,
        status: { $ne: 'completed' }
      });

      if (remainingMatches === 0) {
        tournament.winner = tournament.standings[0]?.teamId?._id || tournament.standings[0]?.teamId;
        tournament.status = 'completed';
        tournament.manualStatusOverride = true;
        shouldAwardLadderPoints = true;
      }
    }

    tournament.markModified('standings');

    await tournament.save();

    if (shouldAwardLadderPoints) {
      await awardTournamentLadderPoints(tournament);
    }

    // Emit socket event for real-time updates
    const io = getIO();
    io.to(`tournament:${tournament._id}`).emit('tournament:updated', {
      tournamentId: tournament._id,
      matchId: match._id,
      status: tournament.status
    });
  } catch (err) {
    console.error('Error in completeMatchAndAdvance helper:', err);
  }
};

// @desc    Get match details
// @route   GET /api/matches/:id
// @access  Public
export const getMatch = async (req, res) => {
  try {
    const match = await populateMatchResponse(Match.findById(req.params.id));

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    await ensureMatchPickAndBanConfig(match);
    if (match.isModified('mapPoolId') || match.isModified('matchFormat')) {
      await match.save();
      await match.populate('mapPoolId');
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
      mapPoolId: tournament.mapPoolId || null,
      matchFormat: tournament.matchFormat || 'bo3',
      round,
      scheduledAt
    });

    // Add match to tournament
    tournament.matches.push(match._id);
    await tournament.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('tournamentId', 'name game format')
      .populate('team1.teamId team2.teamId', 'name logo captainId');

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

    await ensureMatchPickAndBanConfig(match);

    // Update scores for both teams
    match.team1.score = team1Score;
    match.team2.score = team2Score;
    
    // Determine winner
    if (team1Score > team2Score) {
      match.winner = match.team1.teamId;
    } else if (team2Score > team1Score) {
      match.winner = match.team2.teamId;
    }
    
    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('tournamentId', 'name game format')
      .populate('team1.teamId team2.teamId winner', 'name logo captainId');

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

// @desc    Confirm match is ready and start ongoing state after pick and ban
// @route   PUT /api/matches/:id/confirm-ready
// @access  Private (Admin or Captain)
export const confirmMatchReady = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    await ensureMatchPickAndBanConfig(match);

    // Vérifier que les joueurs sont bien sélectionnés par les 2 équipes
    const team1HasPlayers = hasSelectedPlayers(match.team1);
    const team2HasPlayers = hasSelectedPlayers(match.team2);

    if (!team1HasPlayers || !team2HasPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Both teams must have selected players before confirming'
      });
    }

    if (match.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Match must be in ready status to confirm',
        currentStatus: match.status
      });
    }

    if (!isPickAndBanCompleted(match)) {
      return res.status(400).json({
        success: false,
        message: 'Le pick and ban doit être terminé avant de démarrer le match',
        pickAndBanStatus: match.pickAndBan?.status
      });
    }

    // Mettre à jour le statut à "ongoing"
    match.status = 'ongoing';
    
    await match.save();

    const populatedMatch = await populateMatchResponse(Match.findById(match._id));

    res.status(200).json({
      success: true,
      message: 'Match confirmed after pick and ban and is now ongoing',
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
      .populate('team1.teamId team2.teamId winner', 'name logo captainId')
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
      .populate('team1.teamId team2.teamId', 'name logo captainId');

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

    await ensureMatchPickAndBanConfig(match);

    // Update match and advance bracket
    await completeMatchAndAdvance(match, team1Score, team2Score, winnerId);

    res.status(200).json({
      success: true,
      message: 'Match score updated and bracket advanced'
    });
  } catch (error) {
    console.error('Error updating score and advancing bracket:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Select players for a match
// @route   PUT /api/matches/:id/select-players
// @access  Private (Team Captain only)
export const selectPlayersForMatch = async (req, res) => {
  try {
    const { teamId, selectedPlayers } = req.body;

    if (!teamId || !selectedPlayers || !Array.isArray(selectedPlayers)) {
      return res.status(400).json({
        success: false,
        message: 'teamId et selectedPlayers sont requis'
      });
    }

    const match = await Match.findById(req.params.id)
      .populate('tournamentId');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match non trouvé'
      });
    }

    // Vérifier que l'équipe participe au match
    const isTeam1 = match.team1.teamId.toString() === teamId.toString();
    const isTeam2 = match.team2.teamId.toString() === teamId.toString();

    if (!isTeam1 && !isTeam2) {
      return res.status(403).json({
        success: false,
        message: 'Cette équipe ne participe pas à ce match'
      });
    }

    // Récupérer le tournoi et l'inscription de l'équipe
    const tournament = await Tournament.findById(match.tournamentId._id)
      .populate('registeredTeams.teamId');
    
    const teamRegistration = tournament.registeredTeams.find(
      rt => rt.teamId._id.toString() === teamId.toString()
    );

    if (!teamRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non inscrite au tournoi'
      });
    }

    // ✅ VÉRIFICATION CRUCIALE: L'utilisateur authentifié doit être le capitaine de l'équipe
    const teamCaptainId = teamRegistration.teamId.captainId.toString();
    const userIdStr = req.user._id.toString();

    if (teamCaptainId !== userIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Seul le capitaine de l\'équipe peut sélectionner les joueurs',
        debug: {
          userRole: 'captain check failed',
          expectedCaptainId: teamCaptainId,
          authenticatedUserId: userIdStr
        }
      });
    }

    // Récupérer la config du jeu
    const GAME_PLAYER_REQUIREMENTS = {
      'valorant': 5,
      'callofduty': 5,
      'leagueoflegends': 5,
      'rocketleague': 3
    };

    const requiredPlayers = GAME_PLAYER_REQUIREMENTS[tournament.game];
    if (!requiredPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Configuration du jeu non trouvée'
      });
    }

    // Valider le nombre de joueurs
    if (selectedPlayers.length !== requiredPlayers) {
      return res.status(400).json({
        success: false,
        message: `Vous devez sélectionner exactement ${requiredPlayers} joueurs pour ce match`
      });
    }

    // Vérifier que tous les joueurs sélectionnés sont dans la liste des joueurs inscrits (titulaires + remplaçants)
    const allowedPlayers = [
      ...teamRegistration.players.map(p => p.toString()),
      ...teamRegistration.substitutes.map(s => s.toString())
    ];

    const invalidPlayers = selectedPlayers.filter(
      pid => !allowedPlayers.includes(pid.toString())
    );

    if (invalidPlayers.length > 0) {
      console.error('DEBUG selectPlayersForMatch:');
      console.error('Selected IDs from frontend:', selectedPlayers);
      console.error('Allowed IDs from tournament:', allowedPlayers);
      console.error('Invalid IDs:', invalidPlayers);
      console.error('Sample allowed player:', teamRegistration.players[0]);
      
      return res.status(400).json({
        success: false,
        message: 'Certains joueurs sélectionnés ne font pas partie de l\'inscription au tournoi',
        debug: {
          selectedCount: selectedPlayers.length,
          allowedCount: allowedPlayers.length,
          invalidCount: invalidPlayers.length
        }
      });
    }

    // Vérifier que le match n'est pas déjà terminé
    if (match.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier les joueurs d\'un match terminé'
      });
    }

    await ensureMatchPickAndBanConfig(match);

    // Mettre à jour les joueurs sélectionnés
    if (isTeam1) {
      match.team1.selectedPlayers = selectedPlayers;
    } else {
      match.team2.selectedPlayers = selectedPlayers;
    }

    // Vérifier si les 2 équipes ont maintenant sélectionné leurs joueurs
    const team1HasSelected = isTeam1 
      ? selectedPlayers.length > 0 
      : (match.team1.selectedPlayers && match.team1.selectedPlayers.length > 0);
    
    const team2HasSelected = isTeam2 
      ? selectedPlayers.length > 0 
      : (match.team2.selectedPlayers && match.team2.selectedPlayers.length > 0);

    if (team1HasSelected && team2HasSelected && match.status === 'pending') {
      match.status = 'ready';
    }

    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('tournamentId', 'name game')
      .populate('team1.teamId team2.teamId', 'name logo captainId')
      .populate('team1.selectedPlayers team2.selectedPlayers', 'username avatar');

    res.status(200).json({
      success: true,
      message: team1HasSelected && team2HasSelected 
        ? 'Joueurs sélectionnés avec succès! Le match est prêt pour le pick and ban.'
        : 'Joueurs sélectionnés avec succès. En attente de l\'autre équipe...',
      match: populatedMatch
    });
  } catch (error) {
    console.error('Error selecting players:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all matches for a tournament
// @route   GET /api/tournaments/:tournamentId/matches
// @access  Public
export const getTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const matches = await Match.find({ tournamentId })
      .populate('tournamentId', 'name game format mapPoolId matchFormat finalFormat')
      .populate('mapPoolId')
      .populate('team1.teamId team2.teamId winner', 'name logo captainId players')
      .populate({
        path: 'team1.selectedPlayers team2.selectedPlayers',
        select: 'userId inGameName games',
        populate: {
          path: 'userId',
          select: '_id username avatar'
        }
      })
      .sort({ round: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      matches
    });
  } catch (error) {
    console.error('Error getting tournament matches:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit match score with screenshots
// @route   POST /api/matches/:id/submit-score
// @access  Private (Team captain only)
export const submitScore = async (req, res) => {
  try {
    const { team1Score, team2Score, screenshots } = req.body;
    const userId = req.user.id;

    const match = await Match.findById(req.params.id)
      .populate('team1.teamId')
      .populate('team2.teamId');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Verify user is a captain of one of the teams
    const team1 = await Team.findById(match.team1.teamId._id)
      .populate('captainId', '_id');
    const team2 = await Team.findById(match.team2.teamId._id)
      .populate('captainId', '_id');

    const isCaptain = 
      (team1 && team1.captainId._id.toString() === userId) ||
      (team2 && team2.captainId._id.toString() === userId);

    if (!isCaptain) {
      return res.status(403).json({
        success: false,
        message: 'Only team captains can submit scores'
      });
    }

    await ensureMatchPickAndBanConfig(match);

    const scoreBlockReason = validateMatchCanEnterScores(match);
    if (scoreBlockReason) {
      return res.status(400).json({
        success: false,
        message: scoreBlockReason,
        currentStatus: match.status,
        pickAndBanStatus: match.pickAndBan?.status
      });
    }

    // Submit the score
    const submittingTeamId = 
      team1.captainId._id.toString() === userId 
        ? match.team1.teamId._id 
        : match.team2.teamId._id;

    match.submitScore(submittingTeamId, team1Score, team2Score, screenshots || []);
    await match.save();

    res.status(200).json({
      success: true,
      message: 'Score submitted successfully. Waiting for admin approval.',
      match: {
        _id: match._id,
        scoreSubmission: match.scoreSubmission
      }
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending score submissions
// @route   GET /api/matches/submissions/pending
// @access  Private (Admin only)
export const getPendingSubmissions = async (req, res) => {
  try {
    const matches = await Match.find({ 'scoreSubmission.status': 'pending' })
      .populate('tournamentId', 'name')
      .populate('team1.teamId', 'name')
      .populate('team2.teamId', 'name')
      .populate('scoreSubmission.submittedBy', 'name')
      .sort({ 'scoreSubmission.submittedAt': -1 });

    res.status(200).json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (error) {
    console.error('Error getting pending submissions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve score submission
// @route   PATCH /api/matches/:id/approve-score
// @access  Private (Admin only)
export const approveScore = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    if (match.scoreSubmission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Score is not pending approval'
      });
    }

    // Determine winner from submission
    const winnerId = match.scoreSubmission.team1Score > match.scoreSubmission.team2Score
      ? match.team1.teamId
      : match.team2.teamId;

    // Approve the score submission
    match.scoreSubmission.status = 'approved';
    match.scoreSubmission.approvedBy = req.user.id;
    match.scoreSubmission.approvedAt = new Date();

    // Use the helper to update the match and bracket
    await completeMatchAndAdvance(
      match, 
      match.scoreSubmission.team1Score, 
      match.scoreSubmission.team2Score, 
      winnerId
    );

    // Refetch the match to get the updated data
    const updatedMatch = await Match.findById(req.params.id)
      .populate('team1.teamId', 'name logo captainId')
      .populate('team2.teamId', 'name logo captainId')
      .populate('winner', 'name logo');

    res.status(200).json({
      success: true,
      message: 'Score approved successfully and bracket updated',
      match: updatedMatch
    });
  } catch (error) {
    console.error('Error approving score:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject score submission
// @route   PATCH /api/matches/:id/reject-score
// @access  Private (Admin only)
export const rejectScore = async (req, res) => {
  try {
    const { reason } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    if (match.scoreSubmission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Score is not pending approval'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Reject the score
    match.rejectScore(req.user.id, reason);
    match.scoreSubmission.status = 'not-submitted'; // Reset for resubmission
    await match.save();

    res.status(200).json({
      success: true,
      message: 'Score rejected. Team can resubmit.',
      match: {
        _id: match._id,
        scoreSubmission: match.scoreSubmission
      }
    });
  } catch (error) {
    console.error('Error rejecting score:', error);
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
  updateScoreAndAdvance,
  selectPlayersForMatch,
  getTournamentMatches,
  submitScore,
  getPendingSubmissions,
  approveScore,
  rejectScore
};
