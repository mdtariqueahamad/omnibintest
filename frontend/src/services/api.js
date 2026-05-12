import axios from 'axios';

// Connect directly to the local FastAPI server
const API_BASE_URL = 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchBins = async () => {
  try {
    const response = await apiClient.get('/api/bins');
    return response.data;
  } catch (error) {
    console.error("Error fetching bins:", error);
    throw error;
  }
};

export const fetchOptimalRoute = async () => {
  try {
    const response = await apiClient.get('/api/routes/optimal');
    return response.data;
  } catch (error) {
    console.error("Error calculating optimal route:", error);
    throw error;
  }
};

export const fetchBinHistory = async (binId) => {
  try {
    const response = await apiClient.get(`/api/bins/${binId}/history`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching history for ${binId}:`, error);
    throw error;
  }
};

export const seedBins = async () => {
  try {
    const response = await apiClient.post('/api/bins/seed');
    return response.data;
  } catch (error) {
    console.error("Error seeding initial bin data:", error);
    throw error;
  }
};
