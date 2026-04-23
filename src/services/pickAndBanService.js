import api from '../api/axios';

const API_URL = '/pick-and-ban';

// Start pick and ban process
export const startPickAndBan = async (matchId) => {
  try {
    const response = await api.post(`${API_URL}/${matchId}/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting pick and ban:', error);
    throw error;
  }
};

// Select side
export const selectSide = async (matchId, teamId, side) => {
  try {
    const response = await api.post(`${API_URL}/${matchId}/select-side`, { teamId, side });
    return response.data;
  } catch (error) {
    console.error('Error selecting side:', error);
    throw error;
  }
};

// Pick a map
export const pickMap = async (matchId, mapName, mode, teamId) => {
  try {
    const response = await api.post(`${API_URL}/${matchId}/pick`, {
      mapName,
      mode,
      teamId
    });
    return response.data;
  } catch (error) {
    console.error('Error picking map:', error);
    throw error;
  }
};

// Ban a map
export const banMap = async (matchId, mapName, teamId) => {
  try {
    const response = await api.post(`${API_URL}/${matchId}/ban`, {
      mapName,
      teamId
    });
    return response.data;
  } catch (error) {
    console.error('Error banning map:', error);
    throw error;
  }
};

// Complete pick and ban
export const completePickAndBan = async (matchId) => {
  try {
    const response = await api.put(`${API_URL}/${matchId}/complete`);
    return response.data;
  } catch (error) {
    console.error('Error completing pick and ban:', error);
    throw error;
  }
};

// Get pick and ban status
export const getPickAndBanStatus = async (matchId) => {
  try {
    const response = await api.get(`${API_URL}/${matchId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pick and ban status:', error);
    throw error;
  }
};
