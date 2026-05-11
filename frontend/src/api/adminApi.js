import api from './axios';

export const getAllUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

export const updateUserRole = async (id, data) => {
  const response = await api.patch(`/admin/users/${id}/role`, data);
  return response.data;
};

export const toggleUserStatus = async (id) => {
  const response = await api.patch(`/admin/users/${id}/status`);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const getAllReports = async (params = {}) => {
  const response = await api.get('/admin/reports', { params });
  return response.data;
};

export const deleteReport = async (id) => {
  const response = await api.delete(`/admin/reports/${id}`);
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data;
};

export const getDashboardStats = async (params = {}) => {
  const response = await api.get('/admin/stats', { params });
  return response.data;
};