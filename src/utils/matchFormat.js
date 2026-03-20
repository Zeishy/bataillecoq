// Format utilities for match scoring

export const formatConfig = {
  bo1: { maxWins: 1, totalMaps: 1 },
  bo3: { maxWins: 2, totalMaps: 3 },
  bo5: { maxWins: 3, totalMaps: 5 },
  bo7: { maxWins: 4, totalMaps: 7 },
  bo9: { maxWins: 5, totalMaps: 9 }
};

/**
 * Get max wins for a format
 */
export const getMaxWins = (format) => {
  return formatConfig[format]?.maxWins || 1;
};

/**
 * Get total maps for a format
 */
export const getTotalMaps = (format) => {
  return formatConfig[format]?.totalMaps || 1;
};

/**
 * Check if match is complete
 */
export const isMatchComplete = (team1Score, team2Score, format) => {
  const maxWins = getMaxWins(format);
  return team1Score === maxWins || team2Score === maxWins;
};

/**
 * Get winner based on format
 */
export const getWinner = (team1Score, team2Score, format) => {
  const maxWins = getMaxWins(format);
  if (team1Score === maxWins) return 'team1';
  if (team2Score === maxWins) return 'team2';
  return null;
};

/**
 * Validate score for format
 */
export const isValidScore = (team1Score, team2Score, format) => {
  const maxWins = getMaxWins(format);
  
  // Scores can't exceed maxWins
  if (team1Score > maxWins || team2Score > maxWins) {
    return false;
  }
  
  // At least one team shouldn't exceed maxWins if match is complete
  if (team1Score === maxWins || team2Score === maxWins) {
    // Match is complete, other team must be < maxWins
    if (team1Score === maxWins && team2Score === maxWins) {
      return false;
    }
  }
  
  // Can't have both teams with same score after one reaches maxWins
  if (team1Score > 0 && team2Score > 0) {
    const diff = Math.abs(team1Score - team2Score);
    if (Math.max(team1Score, team2Score) === maxWins && diff !== 1) {
      return false;
    }
  }
  
  return true;
};

/**
 * Format score display
 */
export const formatScoreDisplay = (team1Score, team2Score, format) => {
  return `${team1Score}-${team2Score} (${format.toUpperCase()})`;
};

/**
 * Get score range for format (for validation)
 */
export const getScoreRange = (format) => {
  const maxWins = getMaxWins(format);
  const range = [];
  
  for (let i = 0; i <= maxWins; i++) {
    for (let j = 0; j <= maxWins; j++) {
      // Both can't be maxWins
      if (i === maxWins && j === maxWins) continue;
      
      // If one is maxWins, other must be less and difference must be 1
      if (i === maxWins) {
        if (j === maxWins - 1) range.push({ team1: i, team2: j });
      } else if (j === maxWins) {
        if (i === maxWins - 1) range.push({ team1: i, team2: j });
      } else {
        range.push({ team1: i, team2: j });
      }
    }
  }
  
  return range;
};
