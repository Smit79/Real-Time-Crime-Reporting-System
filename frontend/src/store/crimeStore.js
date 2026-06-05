import { create } from 'zustand';

import * as crimeApi from '../api/crimeApi';
import useAuthStore from './authStore';

const defaultPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const useCrimeStore = create((set, get) => ({
  reports: [],
  nearbyReports: [],
  selectedReport: null,
  filters: {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    crimeType: '',
    severity: '',
  },
  pagination: defaultPagination,
  isLoading: false,

  setFilters: (updates) => set((state) => ({ filters: { ...state.filters, ...updates } })),
  setSelectedReport: (selectedReport) => set({ selectedReport }),

  fetchReports: async (params = {}) => {
    set({ isLoading: true });
    try {
      const merged = { ...get().filters, ...params };
      const response = await crimeApi.getAllReports(merged);
      set({
        reports: response?.data?.reports || [],
        pagination: response?.data?.pagination || defaultPagination,
        filters: merged,
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchNearby: async ({ lat, lng, radius, crimeType, status, severity, startDate, endDate, page, limit }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await crimeApi.getNearbyReports({
        lat,
        lng,
        radius,
        crimeType,
        status,
        severity,
        startDate,
        endDate,
        page,
        limit,
      });
      set({
        nearbyReports: response.data.reports,
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createReport: async (formData, onUploadProgress) => {
    const response = await crimeApi.createReport(formData, onUploadProgress);
    await get().fetchReports({ page: 1 });
    return response;
  },

  updateReport: async (id, data) => {
    const response = await crimeApi.updateReport(id, data);
    set((state) => ({
      reports: state.reports.map((report) =>
        report._id === id ? { ...report, ...(response?.data?.report || response?.data) } : report
      ),
    }));
    return response;
  },

  deleteReport: async (id) => {
    const response = await crimeApi.deleteReport(id);
    set((state) => ({ reports: state.reports.filter((report) => report._id !== id) }));
    return response;
  },

  upvoteReport: async (id) => {
    const previousReports = get().reports;
    const currentUserId = useAuthStore.getState().user?._id;

    const findHasUpvoted = (report) => {
      if (!currentUserId || !Array.isArray(report?.upvotes)) return false;
      return report.upvotes.some((entry) => {
        const value = typeof entry === 'string' ? entry : entry?._id;
        return String(value) === String(currentUserId);
      });
    };

    // Optimistic update for immediate UI feedback.
    set((state) => ({
      reports: state.reports.map((report) => {
        if (report._id !== id) return report;

        const hasUpvoted = findHasUpvoted(report);
        const currentCount = Number(
          report.upvoteCount ?? (Array.isArray(report.upvotes) ? report.upvotes.length : 0)
        );
        const nextCount = Math.max(0, currentCount + (hasUpvoted ? -1 : 1));

        let nextUpvotes = report.upvotes;
        if (currentUserId && Array.isArray(report.upvotes)) {
          nextUpvotes = hasUpvoted
            ? report.upvotes.filter((entry) => {
                const value = typeof entry === 'string' ? entry : entry?._id;
                return String(value) !== String(currentUserId);
              })
            : [...report.upvotes, currentUserId];
        }

        return {
          ...report,
          upvoteCount: nextCount,
          upvotes: nextUpvotes,
        };
      }),
    }));

    try {
      const response = await crimeApi.upvoteReport(id);
      const payload = response?.data || {};

      set((state) => ({
        reports: state.reports.map((report) => {
          if (report._id !== id) return report;

          let nextUpvotes = report.upvotes;
          if (currentUserId && Array.isArray(report.upvotes)) {
            nextUpvotes = payload.hasUpvoted
              ? Array.from(new Set([...report.upvotes.map((entry) => (typeof entry === 'string' ? entry : entry?._id)), String(currentUserId)]))
              : report.upvotes.filter((entry) => {
                  const value = typeof entry === 'string' ? entry : entry?._id;
                  return String(value) !== String(currentUserId);
                });
          }

          return {
            ...report,
            upvoteCount: Number(payload.upvoteCount ?? report.upvoteCount ?? 0),
            upvotes: nextUpvotes,
          };
        }),
      }));

      return response;
    } catch (error) {
      // Roll back optimistic update on failure.
      set({ reports: previousReports });
      throw error;
    }
  },
}));

export default useCrimeStore;
