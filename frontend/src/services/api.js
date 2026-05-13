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

export const fetchOptimalRoute = async (mode = 'static') => {
  try {
    const response = await apiClient.get(`/api/routes/optimal?mode=${mode}`);
    return response.data;
  } catch (error) {
    console.error("Error calculating optimal route:", error);
    throw error;
  }
};

export const fetchPredictedBins = async (hoursAhead = 12) => {
  try {
    const response = await apiClient.get(`/api/bins/predict_all/batch?hours_ahead=${hoursAhead}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching predicted bins:", error);
    throw error;
  }
};

export const fetchPredictedRoute = async (hoursAhead = 12, mode = 'static') => {
  try {
    const response = await apiClient.get(`/api/routes/predict?hours_ahead=${hoursAhead}&mode=${mode}`);
    return response.data;
  } catch (error) {
    console.error("Error calculating predicted route:", error);
    throw error;
  }
};

export const setOperatorLive = async (operatorId, lat, lon) => {
  const res = await apiClient.put(`/api/operators/${operatorId}/live`, { latitude: lat, longitude: lon });
  return res.data;
};

export const setOperatorOffline = async (operatorId) => {
  const res = await apiClient.put(`/api/operators/${operatorId}/offline`);
  return res.data;
};

export const updateOperatorLocation = async (operatorId, lat, lon) => {
  const res = await apiClient.put(`/api/operators/${operatorId}/location`, { latitude: lat, longitude: lon });
  return res.data;
};

export const fetchAllOperators = async () => {
  const res = await apiClient.get('/api/operators');
  return res.data;
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

export const randomizeBins = async () => {
  try {
    const response = await apiClient.post('/api/bins/randomize');
    return response.data;
  } catch (error) {
    console.error("Error randomizing bins:", error);
    throw error;
  }
};

export const fetchConfig = async () => {
  try {
    const response = await apiClient.get('/api/config');
    return response.data;
  } catch (error) {
    console.error("Error fetching fleet configuration:", error);
    throw error;
  }
};

export const updateConfig = async (configData) => {
  try {
    const response = await apiClient.put('/api/config', configData);
    return response.data;
  } catch (error) {
    console.error("Error updating fleet configuration:", error);
    throw error;
  }
};

// Query the free public Open Source Routing Machine (OSRM) API for real street geometry
export const fetchOsrmRoute = async (coordString) => {
  try {
    const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`);
    return response.data;
  } catch (error) {
    console.error("Error fetching OSRM road geometry:", error);
    throw error;
  }
};

