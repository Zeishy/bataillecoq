import Match from '../models/Match.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import { addPlacementPointsToLadder } from '../controllers/ladderController.js';

const resolveUserIdFromTeamPlayer = async (player) => {
  if (player.userId?._id) return player.userId._id;
  if (player.userId) return player.userId;
  if (player.playerId?.userId?._id) return player.playerId.userId._id;
  if (player.playerId?.userId) return player.playerId.userId;

  if (player.playerId) {
    const playerDoc = await Player.findById(player.playerId).populate('userId', '_id');
    return playerDoc?.userId?._id || playerDoc?.userId || null;
  }

  return null;
};

export const awardTournamentLadderPoints = async (tournament) => {
  if (!tournament || tournament.ladderPointsAwarded) {
    return { awarded: false, reason: 'already-awarded-or-missing-tournament', playersUpdated: 0 };
  }

  const weight = tournament.weight || 1.0;
  const standings = tournament.standings || [];
  let playersUpdated = 0;
  let totalPointsAdded = 0;

  for (const standing of standings) {
    const standingTeamId = standing.teamId?._id || standing.teamId;
    if (!standingTeamId) continue;

    const placement = standing.rank || standings.indexOf(standing) + 1;
    const team = await Team.findById(standingTeamId)
      .populate('players.userId', '_id username')
      .populate({
        path: 'players.playerId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: '_id username'
        }
      });

    if (!team?.players?.length) continue;

    const matchesWon = await Match.countDocuments({
      tournamentId: tournament._id,
      $or: [
        { 'team1.teamId': standingTeamId, winner: standingTeamId },
        { 'team2.teamId': standingTeamId, winner: standingTeamId }
      ],
      status: 'completed'
    });

    for (const player of team.players) {
      const userId = await resolveUserIdFromTeamPlayer(player);
      if (!userId) continue;

      const result = await addPlacementPointsToLadder(
        userId,
        placement,
        weight,
        tournament.name,
        tournament._id,
        matchesWon
      );

      if (!result.skipped) {
        playersUpdated += 1;
        totalPointsAdded += result.pointsAwarded || 0;
      }
    }
  }

  tournament.ladderPointsAwarded = true;
  tournament.ladderPointsAwardedAt = new Date();
  await tournament.save();

  return { awarded: true, playersUpdated, totalPointsAdded };
};

export default awardTournamentLadderPoints;
