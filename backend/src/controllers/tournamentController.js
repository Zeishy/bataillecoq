import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Notification from '../models/Notification.model.js';

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
      .populate({
        path: 'registeredTeams.teamId',
        select: 'name logo captainId',
        populate: {
          path: 'captainId',
          select: '_id username'
        }
      })
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
      .populate('standings.teamId', 'name logo')
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

    // Send notification to team members about pending approval
    await Notification.notifyTeamMembers(teamId, {
      type: 'registration_confirmed',
      title: 'Inscription en attente',
      message: `Votre équipe ${team.name} a été inscrite au tournoi ${tournament.name} et est en attente d'approbation par l'administrateur`,
      relatedTournament: tournament._id,
      relatedTeam: teamId,
      actionUrl: `/tournaments/${tournament._id}`
    });

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

// @desc    Approve team registration
// @route   POST /api/tournaments/:id/teams/:teamId/approve
// @access  Private (Admin only)
export const approveTeam = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Find the team in registeredTeams
    const teamRegistration = tournament.registeredTeams.find(
      rt => rt.teamId.toString() === req.params.teamId
    );

    if (!teamRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Team not registered to this tournament'
      });
    }

    // Update status to confirmed
    teamRegistration.status = 'confirmed';
    await tournament.save();

    // Send notification to team
    const team = await Team.findById(req.params.teamId);
    if (team) {
      await Notification.notifyTeamMembers(team._id, {
        type: 'team_approved',
        title: 'Équipe approuvée',
        message: `Votre équipe ${team.name} a été approuvée pour le tournoi ${tournament.name}`,
        relatedTournament: tournament._id,
        relatedTeam: team._id,
        actionUrl: `/tournaments/${tournament._id}`
      });
    }

    const updatedTournament = await Tournament.findById(tournament._id)
      .populate('registeredTeams.teamId', 'name logo players');

    res.status(200).json({
      success: true,
      message: 'Team approved successfully',
      tournament: updatedTournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject team registration
// @route   POST /api/tournaments/:id/teams/:teamId/reject
// @access  Private (Admin only)
export const rejectTeam = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Find and remove the team from registeredTeams
    const teamIndex = tournament.registeredTeams.findIndex(
      rt => rt.teamId.toString() === req.params.teamId
    );

    if (teamIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Team not registered to this tournament'
      });
    }

    // Remove the team
    const teamId = tournament.registeredTeams[teamIndex].teamId;
    tournament.registeredTeams.splice(teamIndex, 1);
    
    // Also remove from standings
    tournament.standings = tournament.standings.filter(
      s => s.teamId.toString() !== teamId.toString()
    );

    await tournament.save();

    // Send notification to team
    const team = await Team.findById(teamId);
    if (team) {
      await Notification.notifyTeamMembers(team._id, {
        type: 'team_rejected',
        title: 'Inscription refusée',
        message: `Votre inscription au tournoi ${tournament.name} a été refusée`,
        relatedTournament: tournament._id,
        relatedTeam: team._id,
        actionUrl: `/tournaments`
      });
    }

    const updatedTournament = await Tournament.findById(tournament._id)
      .populate('registeredTeams.teamId', 'name logo players');

    res.status(200).json({
      success: true,
      message: 'Team rejected and removed',
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
      .populate({
        path: 'team1.teamId',
        select: 'name logo'
      })
      .populate({
        path: 'team2.teamId',
        select: 'name logo'
      })
      .populate({
        path: 'winner',
        select: 'name logo'
      })
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

// @desc    Generate tournament schedule/matches
// @route   POST /api/tournaments/:id/generate-schedule
// @access  Private (Admin only)
export const generateSchedule = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams.teamId', '_id name logo');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if schedule already exists
    const existingMatches = await Match.find({ tournamentId: tournament._id });
    if (existingMatches.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedule already exists for this tournament'
      });
    }

    // Get registered and confirmed teams
    const teams = tournament.registeredTeams
      .filter(rt => rt.status === 'registered' || rt.status === 'confirmed')
      .map(rt => rt.teamId)
      .filter(team => team && team._id); // Filter out null/undefined teams

    console.log('Teams for schedule generation:', teams.map(t => ({ id: t._id, name: t.name })));

    if (teams.length < 2) {
      return res.status(400).json({
        success: false,
        message: `At least 2 teams are required to generate schedule. Currently have ${teams.length} confirmed teams.`
      });
    }

    const matches = [];
    const startDate = new Date(tournament.startDate);
    let matchNumber = 1;
    let scheduledDate = new Date(startDate);
    const MATCH_DURATION_MINUTES = 30;
    const MIN_GAP_BETWEEN_MATCHES_MINUTES = 60;

    if (tournament.format === 'single-elimination') {
      // Single elimination: Create only first round matches
      // Subsequent rounds will be created when previous round matches complete
      const teamsForElim = [...teams];
      const round = 1;

      // Pair teams for first round
      for (let i = 0; i < teamsForElim.length; i += 2) {
        if (i + 1 < teamsForElim.length) {
          const match = new Match({
            tournamentId: tournament._id,
            round,
            matchNumber,
            team1: { teamId: teamsForElim[i]._id, score: 0 },
            team2: { teamId: teamsForElim[i + 1]._id, score: 0 },
            scheduledDate: new Date(scheduledDate),
            status: 'pending'
          });
          
          await match.save();
          matches.push(match);
          matchNumber++;

          // Increment scheduled date
          scheduledDate = new Date(
            scheduledDate.getTime() +
              (MATCH_DURATION_MINUTES + MIN_GAP_BETWEEN_MATCHES_MINUTES) * 60000
          );
        } else {
          // Odd number of teams: this team gets a bye to the next round
          // We'll handle byes when creating the bracket structure
        }
      }
    } else if (tournament.format === 'round-robin') {
      // Round-robin: every team plays every other team once
      let round = 1;
      const usedPairs = new Set();

      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const pairKey = `${teams[i]._id}-${teams[j]._id}`;
          if (!usedPairs.has(pairKey)) {
            const match = new Match({
              tournamentId: tournament._id,
              round,
              matchNumber,
              team1: { teamId: teams[i]._id, score: 0 },
              team2: { teamId: teams[j]._id, score: 0 },
              scheduledDate: new Date(scheduledDate),
              status: 'pending'
            });

            await match.save();
            matches.push(match);
            matchNumber++;
            usedPairs.add(pairKey);

            // Increment scheduled date
            scheduledDate = new Date(
              scheduledDate.getTime() +
                (MATCH_DURATION_MINUTES + MIN_GAP_BETWEEN_MATCHES_MINUTES) * 60000
            );

            round = Math.ceil(matchNumber / Math.floor(teams.length / 2));
          }
        }
      }
    } else {
      // Default: treat as single-elimination (first round only)
      const teamsForElim = [...teams];
      const round = 1;

      // Pair teams for first round
      for (let i = 0; i < teamsForElim.length; i += 2) {
        if (i + 1 < teamsForElim.length) {
          const match = new Match({
            tournamentId: tournament._id,
            round,
            matchNumber,
            team1: { teamId: teamsForElim[i]._id, score: 0 },
            team2: { teamId: teamsForElim[i + 1]._id, score: 0 },
            scheduledDate: new Date(scheduledDate),
            status: 'pending'
          });
          
          await match.save();
          matches.push(match);
          matchNumber++;

          // Increment scheduled date
          scheduledDate = new Date(
            scheduledDate.getTime() +
              (MATCH_DURATION_MINUTES + MIN_GAP_BETWEEN_MATCHES_MINUTES) * 60000
          );
        }
      }
    }

    // Update tournament matches array
    tournament.matches = matches.map(m => m._id);
    await tournament.save();

    // Generate bracket automatically for elimination tournaments
    if (tournament.format === 'single-elimination' || tournament.format === 'double-elimination') {
      try {
        const numTeams = teams.length;
        const numRounds = Math.ceil(Math.log2(numTeams));
        const nextPowerOf2 = Math.pow(2, numRounds);
        const numByes = nextPowerOf2 - numTeams;

        const bracket = {
          format: tournament.format,
          rounds: [],
          totalRounds: numRounds
        };

        // Round 1
        const round1Matches = [];
        const teamsWithByes = teams.slice(0, numByes);
        const teamsInRound1 = teams.slice(numByes);
        let matchIndex = 0;

        for (let i = 0; i < teamsInRound1.length; i += 2) {
          if (i + 1 < teamsInRound1.length) {
            const dbMatch = matches.find(m => 
              m.team1?.teamId?.toString() === teamsInRound1[i]._id.toString() ||
              m.team2?.teamId?.toString() === teamsInRound1[i]._id.toString()
            );

            round1Matches.push({
              matchId: dbMatch?._id || null,
              round: 1,
              position: matchIndex,
              team1: {
                _id: teamsInRound1[i]._id,
                name: teamsInRound1[i].name,
                logo: teamsInRound1[i].logo,
                score: 0
              },
              team2: {
                _id: teamsInRound1[i + 1]._id,
                name: teamsInRound1[i + 1].name,
                logo: teamsInRound1[i + 1].logo,
                score: 0
              },
              winner: null,
              status: 'pending',
              scheduledDate: dbMatch?.scheduledDate || null
            });
            matchIndex++;
          }
        }

        bracket.rounds.push({
          round: 1,
          name: numRounds === 1 ? 'Final' : numRounds === 2 ? 'Semi-Finals' : numRounds === 3 ? 'Quarter-Finals' : `Round of ${nextPowerOf2}`,
          matches: round1Matches,
          byes: teamsWithByes.map(t => ({ _id: t._id, name: t.name, logo: t.logo }))
        });

        // Create placeholder for future rounds
        for (let round = 2; round <= numRounds; round++) {
          const numMatchesInRound = Math.pow(2, numRounds - round);
          const roundMatches = [];

          for (let i = 0; i < numMatchesInRound; i++) {
            roundMatches.push({
              matchId: null,
              round,
              position: i,
              team1: round === 2 && i < teamsWithByes.length ? 
                { _id: teamsWithByes[i]._id, name: teamsWithByes[i].name, logo: teamsWithByes[i].logo } : 
                { name: 'TBD' },
              team2: { name: 'TBD' },
              winner: null,
              status: 'pending',
              scheduledDate: null
            });
          }

          const roundName = round === numRounds ? 'Final' : 
                            round === numRounds - 1 ? 'Semi-Finals' :
                            round === numRounds - 2 ? 'Quarter-Finals' :
                            `Round of ${Math.pow(2, numRounds - round + 1)}`;

          bracket.rounds.push({
            round,
            name: roundName,
            matches: roundMatches,
            byes: []
          });
        }

        tournament.bracket = bracket;
        await tournament.save();
        console.log('Bracket generated automatically with schedule');
      } catch (bracketError) {
        console.error('Error generating bracket:', bracketError);
        // Don't fail the whole request if bracket generation fails
      }
    }

    // Populate matches before sending response
    // CRITICAL: For nested paths, we need to use the full path
    const populatedMatches = await Match.find({ _id: { $in: matches.map(m => m._id) } })
      .populate({
        path: 'team1.teamId',
        select: 'name logo'
      })
      .populate({
        path: 'team2.teamId',
        select: 'name logo'
      })
      .sort('round scheduledDate');

    console.log('Generated matches:', populatedMatches.length);
    if (populatedMatches.length > 0) {
      console.log('First match raw:', JSON.stringify(populatedMatches[0], null, 2));
      console.log('First match team1:', populatedMatches[0]?.team1);
      console.log('First match team2:', populatedMatches[0]?.team2);
    }

    res.status(201).json({
      success: true,
      message: `Generated ${matches.length} matches for tournament`,
      count: matches.length,
      matches: populatedMatches
    });
  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate bracket for single/double elimination tournament
// @route   POST /api/tournaments/:id/generate-bracket
// @access  Private (Admin only)
export const generateBracket = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams.teamId', '_id name logo')
      .populate('matches');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Get confirmed teams
    const teams = tournament.registeredTeams
      .filter(rt => rt.status === 'registered' || rt.status === 'confirmed')
      .map(rt => rt.teamId)
      .filter(team => team && team._id);

    if (teams.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 teams required to generate bracket'
      });
    }

    // Calculate number of rounds needed
    const numTeams = teams.length;
    const numRounds = Math.ceil(Math.log2(numTeams));
    const nextPowerOf2 = Math.pow(2, numRounds);
    const numByes = nextPowerOf2 - numTeams;

    // Build bracket structure
    const bracket = {
      format: tournament.format,
      rounds: [],
      totalRounds: numRounds
    };

    // Round 1: pair teams and handle byes
    const round1Matches = [];
    let matchIndex = 0;
    let teamIndex = 0;

    // Teams with byes go directly to round 2
    const teamsWithByes = teams.slice(0, numByes);
    const teamsInRound1 = teams.slice(numByes);

    // Create Round 1 matches
    for (let i = 0; i < teamsInRound1.length; i += 2) {
      if (i + 1 < teamsInRound1.length) {
        // Find the match from the database if it exists
        const dbMatch = tournament.matches.find(m => 
          m.round === 1 && 
          (m.team1?.teamId?.toString() === teamsInRound1[i]._id.toString() ||
           m.team2?.teamId?.toString() === teamsInRound1[i]._id.toString())
        );

        round1Matches.push({
          matchId: dbMatch?._id || null,
          round: 1,
          position: matchIndex,
          team1: {
            _id: teamsInRound1[i]._id,
            name: teamsInRound1[i].name,
            logo: teamsInRound1[i].logo,
            score: dbMatch?.team1?.score || 0
          },
          team2: {
            _id: teamsInRound1[i + 1]._id,
            name: teamsInRound1[i + 1].name,
            logo: teamsInRound1[i + 1].logo,
            score: dbMatch?.team2?.score || 0
          },
          winner: dbMatch?.winner || null,
          status: dbMatch?.status || 'pending',
          scheduledDate: dbMatch?.scheduledDate || null
        });
        matchIndex++;
      }
    }

    bracket.rounds.push({
      round: 1,
      name: numRounds === 1 ? 'Final' : numRounds === 2 ? 'Semi-Finals' : numRounds === 3 ? 'Quarter-Finals' : `Round of ${nextPowerOf2}`,
      matches: round1Matches,
      byes: teamsWithByes.map(t => ({ _id: t._id, name: t.name, logo: t.logo }))
    });

    // Create placeholder matches for future rounds
    for (let round = 2; round <= numRounds; round++) {
      const numMatchesInRound = Math.pow(2, numRounds - round);
      const roundMatches = [];

      for (let i = 0; i < numMatchesInRound; i++) {
        roundMatches.push({
          matchId: null,
          round,
          position: i,
          team1: round === 2 && i < teamsWithByes.length ? 
            { _id: teamsWithByes[i]._id, name: teamsWithByes[i].name, logo: teamsWithByes[i].logo } : 
            { name: 'TBD' },
          team2: { name: 'TBD' },
          winner: null,
          status: 'pending',
          scheduledDate: null
        });
      }

      const roundName = round === numRounds ? 'Final' : 
                        round === numRounds - 1 ? 'Semi-Finals' :
                        round === numRounds - 2 ? 'Quarter-Finals' :
                        `Round of ${Math.pow(2, numRounds - round + 1)}`;

      bracket.rounds.push({
        round,
        name: roundName,
        matches: roundMatches,
        byes: []
      });
    }

    // Save bracket to tournament
    tournament.bracket = bracket;
    await tournament.save();

    res.status(200).json({
      success: true,
      bracket
    });
  } catch (error) {
    console.error('Bracket generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get bracket for tournament
// @route   GET /api/tournaments/:id/bracket
// @access  Public
export const getBracket = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (!tournament.bracket) {
      return res.status(404).json({
        success: false,
        message: 'Bracket not generated yet'
      });
    }

    res.status(200).json({
      success: true,
      bracket: tournament.bracket
    });
  } catch (error) {
    console.error('Get bracket error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start tournament (change status to ongoing and generate schedule if needed)
// @route   PATCH /api/tournaments/:id/start
// @access  Private (Admin/Creator only)
export const startTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Tournament can only be started if it is upcoming'
      });
    }

    // Check if at least 2 teams registered
    const registeredTeams = tournament.registeredTeams.filter(
      rt => rt.status === 'registered' || rt.status === 'confirmed'
    );

    if (registeredTeams.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 teams must be registered to start tournament'
      });
    }

    // Generate schedule if not already done
    if (!tournament.matches || tournament.matches.length === 0) {
      // Call generateSchedule logic
      const Match = require('../models/Match.js').default;
      const matches = [];
      const startDate = new Date(tournament.startDate);
      let matchNumber = 1;
      let scheduledDate = new Date(startDate);
      const MATCH_DURATION_MINUTES = 30;
      const MIN_GAP_BETWEEN_MATCHES_MINUTES = 60;

      // Simple round-robin for demo
      for (let i = 0; i < registeredTeams.length; i++) {
        for (let j = i + 1; j < registeredTeams.length; j++) {
          const match = new Match({
            tournamentId: tournament._id,
            round: 1,
            matchNumber,
            team1: { teamId: registeredTeams[i].teamId, score: 0 },
            team2: { teamId: registeredTeams[j].teamId, score: 0 },
            scheduledDate: new Date(scheduledDate),
            status: 'pending'
          });

          await match.save();
          matches.push(match._id);
          matchNumber++;

          scheduledDate = new Date(
            scheduledDate.getTime() +
              (MATCH_DURATION_MINUTES + MIN_GAP_BETWEEN_MATCHES_MINUTES) * 60000
          );
        }
      }

      tournament.matches = matches;
    }

    // Update status to ongoing and enable manual override
    tournament.status = 'ongoing';
    tournament.manualStatusOverride = true; // Prevent auto-update from dates
    await tournament.save();

    // Notify all participants about bracket generation and tournament start
    await Notification.notifyTournamentParticipants(tournament._id, {
      type: 'bracket_generated',
      title: 'Bracket généré !',
      message: `Le bracket du tournoi ${tournament.name} a été généré. Consultez votre calendrier de matchs.`,
      relatedTournament: tournament._id,
      actionUrl: `/tournaments/${tournament._id}/schedule`
    });

    // Also notify tournament started
    await Notification.notifyTournamentParticipants(tournament._id, {
      type: 'tournament_started',
      title: 'Tournoi démarré !',
      message: `Le tournoi ${tournament.name} a démarré. Bonne chance !`,
      relatedTournament: tournament._id,
      actionUrl: `/tournaments/${tournament._id}/schedule`
    });

    res.status(200).json({
      success: true,
      message: 'Tournament started successfully',
      tournament
    });
  } catch (error) {
    console.error('Start tournament error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    End tournament (change status to completed)
// @route   PATCH /api/tournaments/:id/end
// @access  Private (Admin/Creator only)
export const endTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Only ongoing tournaments can be ended'
      });
    }

    // Update status to completed
    tournament.status = 'completed';
    tournament.manualStatusOverride = true; // Prevent auto-update from dates
    
    // Update tournament standings rankings
    if (tournament.standings && tournament.standings.length > 0) {
      tournament.updateStandings = function() {
        this.standings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.wins !== a.wins) return b.wins - a.wins;
          return 0;
        });

        this.standings.forEach((standing, index) => {
          standing.rank = index + 1;
        });
      };
      
      tournament.updateStandings();
    }

    await tournament.save();

    // Notify all participants of tournament completion
    await Notification.notifyTournamentParticipants(tournament._id, {
      type: 'tournament_completed',
      title: 'Tournoi terminé',
      message: `Le tournoi ${tournament.name} est terminé. Consultez le classement final.`,
      relatedTournament: tournament._id,
      actionUrl: `/tournaments/${tournament._id}/standings`
    });

    res.status(200).json({
      success: true,
      message: 'Tournament ended successfully',
      tournament
    });
  } catch (error) {
    console.error('End tournament error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel tournament
// @route   PATCH /api/tournaments/:id/cancel
// @access  Private (Admin/Creator only)
export const cancelTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed tournament'
      });
    }

    // Update status to cancelled
    tournament.status = 'cancelled';
    tournament.manualStatusOverride = true; // Prevent any auto-update
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Tournament cancelled successfully',
      tournament
    });
  } catch (error) {
    console.error('Cancel tournament error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset manual status override to allow auto-updates
// @route   PATCH /api/tournaments/:id/reset-manual-override
// @access  Private (Admin only)
export const resetManualOverride = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Reset manual override
    tournament.manualStatusOverride = false;
    
    // Recalculate status based on dates
    const calculatedStatus = tournament.calculateStatus();
    tournament.status = calculatedStatus;
    
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Manual override reset. Tournament status will now auto-update based on dates.',
      tournament
    });
  } catch (error) {
    console.error('Reset manual override error:', error);
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
  approveTeam,
  rejectTeam,
  getStandings,
  getMatches,
  deleteTournament,
  updateAllStatuses,
  generateSchedule,
  startTournament,
  endTournament,
  cancelTournament,
  generateBracket,
  getBracket,
  resetManualOverride
};
