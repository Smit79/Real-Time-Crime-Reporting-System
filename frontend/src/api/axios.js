import axios from 'axios';
import toast from 'react-hot-toast';

import { API_TIMEOUT_MS } from '../utils/constants';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
});

const authBridge = {
  getAccessToken: () => null,
  setAccessToken: () => {},
  clearAuth: () => {},
};

export const setAuthBridge = (bridge = {}) => {
  if (typeof bridge.getAccessToken === 'function') authBridge.getAccessToken = bridge.getAccessToken;
  if (typeof bridge.setAccessToken === 'function') authBridge.setAccessToken = bridge.setAccessToken;
  if (typeof bridge.clearAuth === 'function') authBridge.clearAuth = bridge.clearAuth;
};

const extractErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return apiMessage;
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  return error.message || 'Something went wrong';
};

let isRefreshing = false;
let queuedRequests = [];

const flushQueue = (error, token = null) => {
  queuedRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  queuedRequests = [];
};

api.interceptors.request.use(
  (config) => {
    const token = authBridge.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error?.response?.status;

    const isAuthRoute = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/forgot-password') ||
      originalRequest.url?.includes('/auth/reset-password') ||
      originalRequest.url?.includes('/auth/verify-email') ||
      originalRequest.url?.includes('/auth/refresh-token');

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queuedRequests.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true, timeout: API_TIMEOUT_MS }
        );

        const newToken = refreshResponse?.data?.data?.accessToken;
        if (!newToken) {
          throw new Error('Unable to refresh session. Please login again.');
        }

        authBridge.setAccessToken(newToken);
        flushQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        authBridge.clearAuth();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!originalRequest.skipGlobalErrorToast) {
      toast.error(extractErrorMessage(error));
    }

    return Promise.reject(error);
  }
);

export default api;
