import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { setAuthBridge } from '../api/axios';
import * as authApi from '../api/authApi';

const defaultState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      ...defaultState,
      setLoading: (value) => set({ isLoading: value }),
      setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: Boolean(accessToken) }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : updates,
        })),

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(credentials);
          const user = response?.data?.user;
          const accessToken = response?.data?.accessToken;

          if (!user || !accessToken) {
            throw new Error('Invalid login response from server');
          }

          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            initialized: true,
          });

          toast.success(response.message || 'Login successful');
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(payload);
          const user = response?.data?.user;
          const accessToken = response?.data?.accessToken;

          set({
            user: user || null,
            accessToken: accessToken || null,
            isAuthenticated: Boolean(accessToken),
            isLoading: false,
            initialized: true,
          });

          toast.success(response.message || 'Registration successful');
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (_error) {
          // Keep local sign-out resilient even when API call fails.
        } finally {
          set({ ...defaultState, initialized: true });
          toast.success('Logged out successfully');
        }
      },

      refreshToken: async () => {
        try {
          const response = await authApi.refreshToken();
          const accessToken = response?.data?.accessToken;

          if (!accessToken) {
            set({ ...defaultState, initialized: true });
            return null;
          }

          set({ accessToken, isAuthenticated: true, initialized: true });
          return accessToken;
        } catch (_error) {
          set({ ...defaultState, initialized: true });
          return null;
        }
      },

      hydrateUser: async () => {
        const token = get().accessToken;
        if (!token) {
          set({ initialized: true, isAuthenticated: false });
          return null;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getMe();
          const user = response?.data?.user || response?.data;
          set({ user: user || null, isAuthenticated: true, isLoading: false, initialized: true });
          return user;
        } catch (_error) {
          set({ ...defaultState, initialized: true });
          return null;
        }
      },
    }),
    {
      name: 'crimewatch-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

setAuthBridge({
  getAccessToken: () => useAuthStore.getState().accessToken,
  setAccessToken: (token) =>
    useAuthStore.setState({
      accessToken: token,
      isAuthenticated: Boolean(token),
    }),
  clearAuth: () => useAuthStore.setState({ ...defaultState, initialized: true }),
});

export default useAuthStore;
