import api from './axios';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (formData) => {
  const response = await api.patch('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete('/users/profile');
  return response.data;
};

export const getMyReports = async (params = {}) => {
  const response = await api.get('/users/my-reports', { params });
  return response.data;
};

export const getNotifications = async (params = {}) => {
  const response = await api.get('/users/my-notifications', { params });
  return response.data;
};

export const markNotificationsRead = async (data = {}) => {
  const response = await api.patch('/users/notifications/read', data);
  return response.data;
};

export const updateLocation = async (data) => {
  const response = await api.patch('/users/location', data);
  return response.data;
};

export const updateFcmToken = async (data) => {
  const response = await api.patch('/users/fcm-token', data);
  return response.data;
};