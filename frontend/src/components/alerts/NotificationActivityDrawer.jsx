import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BellRing, CheckCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import useNotificationStore from '../../store/notificationStore';
import { formatRelativeTime } from '../../utils/formatters';

const NotificationActivityDrawer = ({ open, onClose, onViewAll }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markOneAsRead = useNotificationStore((state) => state.markOneAsRead);

  useEffect(() => {
    if (!open) return;
    fetchNotifications({ page: 1, limit: 20 }).catch(() => {});
  }, [fetchNotifications, open]);

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const visibleNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((item) => !item.isRead);
    }

    if (activeFilter === 'crime_alert') {
      return notifications.filter((item) => item.type === 'crime_alert');
    }

    if (activeFilter === 'report_updates') {
      return notifications.filter((item) => ['report_verified', 'report_resolved', 'report_rejected'].includes(item.type));
    }

    if (activeFilter === 'system') {
      return notifications.filter((item) => item.type === 'system');
    }

    return notifications;
  }, [activeFilter, notifications]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[1400] bg-slate-950/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed right-0 top-0 z-[1500] h-screen w-full max-w-md border-l border-border bg-surface shadow-soft"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            role="dialog"
            aria-label="Live activity"
          >
            <div className="flex h-full flex-col">
              <header className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="font-heading text-xl font-bold text-text">Live Activity</h2>
                  <p className="text-xs text-text-muted">{unreadCount} unread updates</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
                  onClick={onClose}
                  aria-label="Close activity drawer"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <button
                  type="button"
                  className="btn-surface inline-flex items-center gap-1"
                  onClick={async () => {
                    await markAsRead({});
                  }}
                  aria-label="Mark all activity as read"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                  onClick={onViewAll}
                  aria-label="Open full alerts page"
                >
                  View full alerts <ArrowRight size={14} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'crime_alert', label: 'Crime Alerts' },
                  { id: 'report_updates', label: 'Report Updates' },
                  { id: 'system', label: 'System' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      activeFilter === filter.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-text-muted hover:text-text'
                    }`}
                    aria-label={`Filter activity: ${filter.label}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto bg-surface p-4">
                {isLoading ? <p className="text-sm text-text-muted">Loading activity...</p> : null}

                {!isLoading && visibleNotifications.length === 0 ? (
                  <div className="rounded-2xl border border-border p-4 text-center text-sm text-text-muted">
                    <BellRing className="mx-auto mb-2 text-text-muted" size={18} />
                    No activity for this filter.
                  </div>
                ) : null}

                {!isLoading ? (
                  <div className="space-y-2">
                    {visibleNotifications.map((item, index) => (
                      <article
                        key={item._id || `${item.title || 'activity'}-${item.createdAt || index}-${index}`}
                        className={`rounded-xl border p-3 ${item.isRead ? 'border-border' : 'border-danger/40 bg-danger/5'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-text">{item.title || 'New activity'}</p>
                          {!item.isRead ? <span className="h-2.5 w-2.5 rounded-full bg-danger" /> : null}
                        </div>
                        <p className="mt-1 text-xs text-text-muted">{item.message || 'You have a new update.'}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] text-text-muted">{formatRelativeTime(item.createdAt)}</p>
                          {!item.isRead ? (
                            <button
                              type="button"
                              className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-text-muted transition hover:text-text"
                              onClick={async () => {
                                await markOneAsRead(item);
                              }}
                              aria-label="Mark this notification as read"
                            >
                              Mark read
                            </button>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default NotificationActivityDrawer;
