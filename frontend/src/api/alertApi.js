import api from './axios';

export const getSubscriptions = async (params = {}) => {
  const response = await api.get('/alerts', { params });
  return response.data;
};

export const createSubscription = async (data) => {
  const response = await api.post('/alerts', data);
  return response.data;
};

export const getSubscriptionById = async (id) => {
  const response = await api.get(`/alerts/${id}`);
  return response.data;
};

export const updateSubscription = async (id, data) => {
  const response = await api.patch(`/alerts/${id}`, data);
  return response.data;
};

export const deleteSubscription = async (id) => {
  const response = await api.delete(`/alerts/${id}`);
  return response.data;
};

export const toggleSubscription = async (id) => {
  const response = await api.patch(`/alerts/${id}/toggle`);
  return response.data;
};