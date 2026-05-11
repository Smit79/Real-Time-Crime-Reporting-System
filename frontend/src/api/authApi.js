import api from './axios';

export const register = async (data) => {
  const response = await api.post('/auth/register', data, { skipGlobalErrorToast: true });
  return response.data;
};

export const login = async (data) => {
  const response = await api.post('/auth/login', data, { skipGlobalErrorToast: true });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post('/auth/refresh-token', {}, { skipGlobalErrorToast: true });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updatePassword = async (data) => {
  const response = await api.patch('/auth/update-password', data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await api.post('/auth/forgot-password', data, { skipGlobalErrorToast: true });
  return response.data;
};

export const resetPassword = async (token, data) => {
  const response = await api.post(`/auth/reset-password/${token}`, data, { skipGlobalErrorToast: true });
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.post(`/auth/verify-email/${token}`, {}, { skipGlobalErrorToast: true });
  return response.data;
};