import { create } from 'zustand';

import * as alertApi from '../api/alertApi';

const useAlertStore = create((set, get) => ({
  subscriptions: [],
  isLoading: false,

  fetchSubscriptions: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await alertApi.getSubscriptions(params);
      const subscriptions = Array.isArray(response?.data?.subscriptions)
        ? response.data.subscriptions
        : Array.isArray(response?.data)
          ? response.data
          : [];
      set({ subscriptions, isLoading: false });
      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createSubscription: async (data) => {
    const response = await alertApi.createSubscription(data);
    const created = response?.data?.subscription;
    if (created?._id) {
      set((state) => ({
        subscriptions: [created, ...state.subscriptions],
      }));
    }
    return response;
  },

  updateSubscription: async (id, data) => {
    const response = await alertApi.updateSubscription(id, data);
    const updated = response?.data?.subscription;
    if (updated?._id) {
      set((state) => ({
        subscriptions: state.subscriptions.map((subscription) =>
          subscription._id === id ? { ...subscription, ...updated } : subscription
        ),
      }));
    }
    return response;
  },

  deleteSubscription: async (id) => {
    const response = await alertApi.deleteSubscription(id);
    set((state) => ({
      subscriptions: state.subscriptions.filter((subscription) => subscription._id !== id),
    }));
    return response;
  },

  toggleSubscription: async (id) => {
    const previous = get().subscriptions;

    set((state) => ({
      subscriptions: state.subscriptions.map((subscription) =>
        subscription._id === id
          ? { ...subscription, isActive: !subscription.isActive }
          : subscription
      ),
    }));

    try {
      const response = await alertApi.toggleSubscription(id);
      const serverIsActive = response?.data?.isActive;

      if (typeof serverIsActive === 'boolean') {
        set((state) => ({
          subscriptions: state.subscriptions.map((subscription) =>
            subscription._id === id ? { ...subscription, isActive: serverIsActive } : subscription
          ),
        }));
      }

      return response;
    } catch (error) {
      set({ subscriptions: previous });
      throw error;
    }
  },
}));

export default useAlertStore;
