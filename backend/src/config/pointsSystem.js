/**
 * Points System Configuration for Ladder
 * This defines how points are awarded for:
 * 1. Tournament participation and placement
 * 2. Match wins within tournaments
 */

// Points awarded based on final tournament placement
export const PLACEMENT_POINTS = {
  1: 50,    // 1st place (winner)
  2: 30,    // 2nd place
  3: 20,    // 3rd place (semi-finalist)
  4: 15,    // 4th place
  5: 10,    // 5th-8th place
  6: 10,
  7: 10,
  8: 10,
  9: 5,     // 9th-16th place
  10: 5,
  11: 5,
  12: 5,
  13: 5,
  14: 5,
  15: 5,
  16: 5,
  default: 2 // Default for any other placement
};

// Points awarded per match win during tournament
export const MATCH_WIN_POINTS = {
  group_stage: 2,      // Points per match win in group stage / round-robin
  quarter_finals: 3,   // Points for advancing to quarter-finals
  semi_finals: 5,      // Points for advancing to semi-finals
  finals: 10,          // Points for reaching finals
  victory: 15          // Additional points for tournament victory
};

/**
 * Calculate total points for a team based on their tournament placement
 * @param {number} placement - Final placement in tournament (1 = winner, 2 = 2nd, etc.)
 * @param {number} weight - Tournament weight multiplier (default 1.0)
 * @returns {number} Total points to award
 */
export function calculatePlacementPoints(placement, weight = 1.0) {
  const basePoints = PLACEMENT_POINTS[placement] || PLACEMENT_POINTS.default;
  return Math.round(basePoints * weight);
}

/**
 * Calculate points for a match win based on tournament round
 * @param {string} round - Round name ('group_stage', 'quarter_finals', 'semi_finals', 'finals')
 * @param {number} weight - Tournament weight multiplier (default 1.0)
 * @returns {number} Points for this match win
 */
export function calculateMatchWinPoints(round, weight = 1.0) {
  const basePoints = MATCH_WIN_POINTS[round] || MATCH_WIN_POINTS.group_stage;
  return Math.round(basePoints * weight);
}

/**
 * Get point scaling explanation
 * @param {number} weight - Tournament weight multiplier
 * @returns {string} Human-readable explanation
 */
export function getWeightDescription(weight) {
  if (weight === 0.5) return 'Half Points';
  if (weight === 1.0) return 'Normal Points';
  if (weight === 1.5) return '1.5x Points';
  if (weight === 2.0) return 'Double Points';
  if (weight === 3.0) return 'Triple Points';
  if (weight >= 5.0) return 'Maximum Points (5x)';
  return `${weight}x Points`;
}

/**
 * Recommended weight presets for different tournament importance
 */
export const WEIGHT_PRESETS = {
  MINOR: {
    value: 0.5,
    label: 'Minor Tournament',
    description: 'Small community tournaments'
  },
  REGULAR: {
    value: 1.0,
    label: 'Regular Tournament',
    description: 'Standard tournaments'
  },
  IMPORTANT: {
    value: 1.5,
    label: 'Important Tournament',
    description: 'Regional or significant tournaments'
  },
  MAJOR: {
    value: 2.0,
    label: 'Major Tournament',
    description: 'Major regional or international tournaments'
  },
  CHAMPIONSHIP: {
    value: 3.0,
    label: 'Championship',
    description: 'National or world championships'
  }
};

export default {
  PLACEMENT_POINTS,
  MATCH_WIN_POINTS,
  calculatePlacementPoints,
  calculateMatchWinPoints,
  getWeightDescription,
  WEIGHT_PRESETS
};
