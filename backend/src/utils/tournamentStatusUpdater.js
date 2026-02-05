import Tournament from '../models/Tournament.js';

/**
 * Update tournament statuses based on current date
 * This should be run periodically (e.g., every hour or on server start)
 */
export const updateTournamentStatuses = async () => {
  try {
    console.log('🔄 Updating tournament statuses...');
    const result = await Tournament.updateAllStatuses();
    console.log(`✅ Updated ${result.updated} of ${result.total} tournaments`);
    return result;
  } catch (error) {
    console.error('❌ Error updating tournament statuses:', error);
    throw error;
  }
};

/**
 * Setup periodic tournament status updates
 * @param {number} intervalMinutes - How often to check (default: 60 minutes)
 */
export const setupTournamentStatusCron = (intervalMinutes = 60) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`⏰ Setting up tournament status updates every ${intervalMinutes} minutes`);
  
  // Run immediately on startup
  updateTournamentStatuses();
  
  // Then run periodically
  setInterval(async () => {
    await updateTournamentStatuses();
  }, intervalMs);
};

export default {
  updateTournamentStatuses,
  setupTournamentStatusCron
};
