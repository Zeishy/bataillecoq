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
  
  // Both can't be maxWins
  if (team1Score === maxWins && team2Score === maxWins) {
    return false;
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
      
      range.push({ team1: i, team2: j });
    }
  }
  
  return range;
};
