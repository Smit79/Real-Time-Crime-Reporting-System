import api from './axios';

export const uploadFiles = async (formData, onUploadProgress) => {
  const response = await api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

export const getMyMedia = async (params = {}) => {
  const response = await api.get('/media', { params });
  return response.data;
};

export const getMediaById = async (id) => {
  const response = await api.get(`/media/${id}`);
  return response.data;
};

export const deleteMedia = async (id) => {
  const response = await api.delete(`/media/${id}`);
  return response.data;
};