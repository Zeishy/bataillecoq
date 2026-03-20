import api from '../api/axios.js';

const API_URL = '/ladder';

// Get all ladder rankings
export const getLadder = async () => {
  try {
    console.log('🔄 Fetching ladder from:', `${API_URL}`);
    const response = await api.get(API_URL);
    console.log('✅ Ladder response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching ladder:', error);
    throw error;
  }
};

// Get player ladder entry
export const getPlayerLadder = async (userId) => {
  try {
    const response = await api.get(`${API_URL}/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player ladder:', error);
    throw error;
  }
};

// Search ladder with filters and pagination
export const searchLadder = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/search`, { params });
    return response.data;
  } catch (error) {
    console.error('Error searching ladder:', error);
    throw error;
  }
};
