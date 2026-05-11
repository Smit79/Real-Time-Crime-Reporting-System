import { create } from 'zustand';

import { getNotifications, markNotificationsRead } from '../api/userApi';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await getNotifications(params);
      const notifications = Array.isArray(response?.data?.notifications)
        ? response.data.notifications
        : Array.isArray(response?.data)
          ? response.data
          : [];
      const unreadCount = Number.isFinite(response?.data?.unreadCount)
        ? response.data.unreadCount
        : notifications.filter((item) => !item.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  markAsRead: async (data = {}) => {
    const response = await markNotificationsRead(data);
    await get().fetchNotifications();
    return response;
  },

  markOneAsRead: async (notification) => {
    const notificationId = typeof notification === 'string' ? notification : notification?._id;
    const previousNotifications = get().notifications;
    const previousUnread = get().unreadCount;

    const isSameNotification = (item) => {
      if (notificationId && item?._id) return item._id === notificationId;
      if (typeof notification === 'object' && notification) {
        return (
          item?.title === notification.title &&
          item?.message === notification.message &&
          item?.createdAt === notification.createdAt
        );
      }
      return false;
    };

    set((state) => {
      let unreadDelta = 0;
      const nextNotifications = state.notifications.map((item) => {
        if (!isSameNotification(item) || item.isRead) return item;
        unreadDelta += 1;
        return { ...item, isRead: true, readAt: new Date().toISOString() };
      });

      return {
        notifications: nextNotifications,
        unreadCount: Math.max(0, state.unreadCount - unreadDelta),
      };
    });

    if (!notificationId) {
      return null;
    }

    try {
      return await markNotificationsRead({ notificationIds: [notificationId] });
    } catch (error) {
      set({ notifications: previousNotifications, unreadCount: previousUnread });
      throw error;
    }
  },

  addNotification: (notification) =>
    set((state) => {
      const isDuplicate = state.notifications.some((item) => {
        if (notification?._id && item?._id) return item._id === notification._id;
        return (
          item?.title === notification?.title &&
          item?.message === notification?.message &&
          item?.createdAt === notification?.createdAt
        );
      });

      if (isDuplicate) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification?.isRead ? 0 : 1),
      };
    }),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  resetUnread: () => set({ unreadCount: 0 }),
}));

export default useNotificationStore;
