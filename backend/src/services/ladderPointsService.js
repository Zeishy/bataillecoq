/**
 * Ladder Points Tracking Service
 * Handles all calculations and tracking of ladder points with match wins and placement
 */

import { calculatePlacementPoints, calculateMatchWinPoints } from '../config/pointsSystem.js';

/**
 * Calculate ladder points for a team based on their tournament placement AND match wins
 * @param {Object} params
 * @param {number} params.placement - Final placement (1 = winner, 2 = 2nd, etc.)
 * @param {number} params.matchesWon - Number of matches won in tournament
 * @param {number} params.weight - Tournament weight multiplier
 * @param {string} params.tournamentName - Tournament name for logging
 * @returns {Object} { placementPoints, matchPoints, totalPoints, breakdown }
 */
export function calculateTeamTournamentPoints({
  placement,
  matchesWon = 0,
  weight = 1.0,
  tournamentName = 'Tournament'
}) {
  // Placement points (based on final position)
  const placementPoints = calculatePlacementPoints(placement, weight);

  // Match win points (2 base points per win × weight)
  const matchWinBasePoints = 2;
  const matchPoints = matchesWon * Math.round(matchWinBasePoints * weight);

  const totalPoints = placementPoints + matchPoints;

  return {
    placementPoints,
    matchPoints,
    totalPoints,
    matchesWon,
    breakdown: {
      placement,
      matchesWon,
      weight,
      tournamentName,
      formula: `Placement #${placement}: ${placementPoints}pts + Matches (${matchesWon}×${Math.round(matchWinBasePoints * weight)}pts): ${matchPoints}pts = Total: ${totalPoints}pts`
    }
  };
}

/**
 * Create ladder update log entry
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.username - Username
 * @param {number} params.points - Points awarded
 * @param {string} params.source - Source (tournament name)
 * @param {number} params.placement - Tournament placement
 * @param {number} params.weight - Tournament weight
 * @returns {Object} Log entry
 */
export function createLadderUpdateLog({
  userId,
  username,
  points,
  source,
  placement,
  weight = 1.0
}) {
  return {
    userId,
    username,
    points,
    source,
    placement,
    weight,
    timestamp: new Date(),
    description: `${username} earned ${points}pts from ${source} (${placement > 1 ? `#${placement}` : '🏆 Winner'})`
  };
}

export default {
  calculateTeamTournamentPoints,
  createLadderUpdateLog
};
