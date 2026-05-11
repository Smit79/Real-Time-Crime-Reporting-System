import api from './axios';

export const getAllReports = async (params = {}) => {
  const response = await api.get('/crimes', { params });
  return response.data;
};

export const getNearbyReports = async (params = {}) => {
  const response = await api.get('/crimes/nearby', { params });
  return response.data;
};

export const getHeatmap = async (params = {}) => {
  const response = await api.get('/crimes/heatmap', { params });
  return response.data;
};

export const getReportById = async (id) => {
  const response = await api.get(`/crimes/${id}`);
  return response.data;
};

export const createReport = async (formData, onUploadProgress) => {
  const response = await api.post('/crimes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

export const updateReport = async (id, data) => {
  const response = await api.patch(`/crimes/${id}`, data);
  return response.data;
};

export const deleteReport = async (id) => {
  const response = await api.delete(`/crimes/${id}`);
  return response.data;
};

export const upvoteReport = async (id) => {
  const response = await api.post(`/crimes/${id}/upvote`);
  return response.data;
};

export const updateStatus = async (id, data) => {
  const response = await api.patch(`/crimes/${id}/status`, data);
  return response.data;
};