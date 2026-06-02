import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

import { getSubscriptions } from '../api/alertApi';
import useAlertStore from '../store/alertStore';
import useAuthStore from '../store/authStore';
import useCrimeStore from '../store/crimeStore';
import useNotificationStore from '../store/notificationStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const subscriptions = useAlertStore((state) => state.subscriptions);

  const setSelectedReport = useCrimeStore((state) => state.setSelectedReport);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const joinedZonesRef = useRef(new Set());

  const socket = useMemo(() => {
    if (!isAuthenticated || !accessToken) return null;

    return io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket'],
      auth: { token: accessToken },
    });
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    if (!socket) return undefined;

    const userId = user?._id;
    const joinEvent = userId ? `join_zone_${userId}` : null;
    const leaveEvent = userId ? `leave_zone_${userId}` : null;

    const syncAlertRooms = async () => {
      if (!userId) return;

      socket.emit('join_user_room', userId);
      socket.emit('user_online', userId);

      try {
        const response = await getSubscriptions({ isActive: true, page: 1, limit: 100 });
        const subscriptions = Array.isArray(response?.data?.subscriptions) ? response.data.subscriptions : [];

        subscriptions.forEach((subscription) => {
          if (!subscription?._id) return;
          socket.emit('join_zone', `zone_${subscription._id}`);
        });
      } catch (_error) {
        // Keep socket alive even when room sync request fails.
      }
    };

    socket.on('connect', () => {
      setIsConnected(true);
      syncAlertRooms().catch(() => {});
    });
    socket.on('disconnect', () => setIsConnected(false));

    if (joinEvent) {
      socket.on(joinEvent, ({ zoneId }) => {
        if (zoneId) socket.emit('join_zone', zoneId);
      });
    }

    if (leaveEvent) {
      socket.on(leaveEvent, ({ zoneId }) => {
        if (zoneId) socket.emit('leave_zone', zoneId);
      });
    }

    socket.on('crime_alert', (payload) => {
      addNotification({
        type: 'crime_alert',
        title: `${payload?.crimeType || 'Crime'} alert`,
        message: payload?.location || 'A nearby crime was reported',
        createdAt: new Date().toISOString(),
        isRead: false,
        data: payload,
      });
      toast.error('New crime alert near your location');
    });

    socket.on('notification', (payload) => {
      addNotification({ ...payload, isRead: false, createdAt: payload?.createdAt || new Date().toISOString() });
      toast('You have a new notification');
    });

    socket.on('report_verified', (payload) => {
      setSelectedReport(payload);
      const { fetchReports, filters } = useCrimeStore.getState();
      fetchReports({ ...filters }).catch(() => {});
      toast.success('A report was verified');
    });

    socket.on('report_resolved', (payload) => {
      setSelectedReport(payload);
      const { fetchReports, filters } = useCrimeStore.getState();
      fetchReports({ ...filters }).catch(() => {});
      toast.success('A report was marked as resolved');
    });

    return () => {
      if (joinEvent) socket.off(joinEvent);
      if (leaveEvent) socket.off(leaveEvent);
      joinedZonesRef.current.clear();
      socket.disconnect();
      setIsConnected(false);
    };
  }, [addNotification, setSelectedReport, socket, user?._id]);

  useEffect(() => {
    const userId = user?._id;
    if (!socket || !userId) {
      joinedZonesRef.current.clear();
      return;
    }

    const nextZones = new Set(
      subscriptions
        .filter((subscription) => subscription?.isActive && subscription?._id)
        .map((subscription) => `zone_${subscription._id}`)
    );

    nextZones.forEach((zoneId) => {
      if (!joinedZonesRef.current.has(zoneId)) {
        socket.emit('join_zone', zoneId);
      }
    });

    joinedZonesRef.current.forEach((zoneId) => {
      if (!nextZones.has(zoneId)) {
        socket.emit('leave_zone', zoneId);
      }
    });

    joinedZonesRef.current = nextZones;
  }, [socket, subscriptions, user?._id]);

  return { socket, isConnected };
};

export default useSocket;
