import api from './axios';

export const getHeatmap = async (params = {}) => {
  const response = await api.get('/analytics/heatmap', { params });
  return response.data;
};

export const getSummary = async (params = {}) => {
  const response = await api.get('/analytics/summary', { params });
  return response.data;
};

export const getTrends = async (params = {}) => {
  const response = await api.get('/analytics/trends', { params });
  return response.data;
};

export const getByType = async (params = {}) => {
  const response = await api.get('/analytics/by-type', { params });
  return response.data;
};

export const getByArea = async (params = {}) => {
  const response = await api.get('/analytics/by-area', { params });
  return response.data;
};

export const getDetailed = async (params = {}) => {
  const response = await api.get('/analytics/detailed', { params });
  return response.data;
};