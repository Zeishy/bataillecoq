import api from '../api/axios.js';

const API_URL = '/map-pools';

// Get all map pools for a game
export const getMapPoolsByGame = async (gameId) => {
  try {
    const response = await api.get(`${API_URL}/game/${gameId}`);
    return response.data.mapPools || [];
  } catch (error) {
    console.error('Error fetching map pools:', error);
    throw error;
  }
};

// Get single map pool
export const getMapPool = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data.mapPool;
  } catch (error) {
    console.error('Error fetching map pool:', error);
    throw error;
  }
};

// Create new map pool
export const createMapPool = async (data) => {
  try {
    const response = await api.post(API_URL, data);
    return response.data.mapPool;
  } catch (error) {
    console.error('Error creating map pool:', error);
    throw error;
  }
};

// Update map pool
export const updateMapPool = async (id, data) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data.mapPool;
  } catch (error) {
    console.error('Error updating map pool:', error);
    throw error;
  }
};

// Add map to pool
export const addMapToPool = async (poolId, mapData) => {
  try {
    const response = await api.post(`${API_URL}/${poolId}/maps`, mapData);
    return response.data.mapPool;
  } catch (error) {
    console.error('Error adding map to pool:', error);
    throw error;
  }
};

// Remove map from pool
export const removeMapFromPool = async (poolId, mapId) => {
  try {
    const response = await api.delete(`${API_URL}/${poolId}/maps/${mapId}`);
    return response.data.mapPool;
  } catch (error) {
    console.error('Error removing map from pool:', error);
    throw error;
  }
};

// Update map pool formats
export const updateMapPoolFormats = async (poolId, formats) => {
  try {
    const response = await api.put(`${API_URL}/${poolId}/formats`, { formats });
    return response.data.mapPool;
  } catch (error) {
    console.error('Error updating formats:', error);
    throw error;
  }
};

// Delete map pool
export const deleteMapPool = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting map pool:', error);
    throw error;
  }
};

// Set modes for map pool
export const setModes = async (poolId, modes) => {
  try {
    const response = await api.post(`${API_URL}/${poolId}/modes`, { modes });
    return response.data.mapPool;
  } catch (error) {
    console.error('Error setting modes:', error);
    throw error;
  }
};

// Add map to mode
export const addMapToMode = async (poolId, modeId, mapData) => {
  try {
    const response = await api.post(`${API_URL}/${poolId}/modes/${modeId}/maps`, mapData);
    return response.data.mapPool;
  } catch (error) {
    console.error('Error adding map to mode:', error);
    throw error;
  }
};

// Remove map from mode
export const removeMapFromMode = async (poolId, modeId, mapId) => {
  try {
    const response = await api.delete(`${API_URL}/${poolId}/modes/${modeId}/maps/${mapId}`);
    return response.data.mapPool;
  } catch (error) {
    console.error('Error removing map from mode:', error);
    throw error;
  }
};
