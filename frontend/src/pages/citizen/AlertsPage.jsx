import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getNotifications, markNotificationsRead } from '../../api/userApi';
import AlertCard from '../../components/alerts/AlertCard';
import AlertForm from '../../components/alerts/AlertForm';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import PageTransition from '../../components/common/PageTransition';
import useAlertStore from '../../store/alertStore';
import { formatRelativeTime } from '../../utils/formatters';

const AlertsPage = () => {
  const subscriptions = useAlertStore((state) => state.subscriptions);
  const isLoading = useAlertStore((state) => state.isLoading);
  const fetchSubscriptions = useAlertStore((state) => state.fetchSubscriptions);
  const createSubscription = useAlertStore((state) => state.createSubscription);
  const updateSubscription = useAlertStore((state) => state.updateSubscription);
  const deleteSubscription = useAlertStore((state) => state.deleteSubscription);
  const toggleSubscription = useAlertStore((state) => state.toggleSubscription);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyUnread, setHistoryUnread] = useState(0);

  const loadNotifications = async () => {
    const response = await getNotifications({ page: 1, limit: 12, type: 'crime_alert' });
    const notifications = Array.isArray(response?.data?.notifications) ? response.data.notifications : [];
    const unreadCount = Number.isFinite(response?.data?.unreadCount)
      ? response.data.unreadCount
      : notifications.filter((item) => !item.isRead).length;
    setHistory(notifications);
    setHistoryUnread(unreadCount);
  };

  useEffect(() => {
    document.title = 'Alerts | CrimeWatch';
    fetchSubscriptions().catch(() => {});
    loadNotifications().catch(() => {});
  }, [fetchSubscriptions]);

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (subscription) => {
    setEditing(subscription);
    setModalOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    if (editing) {
      await updateSubscription(editing._id, payload);
    } else {
      await createSubscription(payload);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setConfirmLoading(true);
    try {
      await deleteSubscription(deleting._id);
      setDeleting(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleMarkRead = async () => {
    await markNotificationsRead({});
    await loadNotifications();
  };

  const formDefaults = useMemo(() => {
    if (!editing) return undefined;

    const coordinates = Array.isArray(editing.location?.coordinates) ? editing.location.coordinates : [];
    const lng = Number.isFinite(coordinates[0]) ? coordinates[0] : 78.6569;
    const lat = Number.isFinite(coordinates[1]) ? coordinates[1] : 22.9734;
    return {
      label: editing.label,
      radiusKm: editing.radiusKm,
      minSeverity: editing.minSeverity,
      crimeTypes: editing.crimeTypes || [],
      lat,
      lng,
      channelsPush: Boolean(editing.channels?.push),
      channelsEmail: Boolean(editing.channels?.email),
      channelsInApp: Boolean(editing.channels?.in_app),
    };
  }, [editing]);

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold text-text">Alert Subscriptions</h1>
        <button
          type="button"
          onClick={handleCreate}
          className="btn-primary inline-flex items-center gap-1"
          aria-label="Create alert subscription"
        >
          <Plus size={15} /> New Subscription
        </button>
      </div>

      {isLoading ? <p className="text-sm text-text-muted">Loading subscriptions...</p> : null}
      {!isLoading && subscriptions.length === 0 ? <EmptyState title="No subscriptions found" /> : null}

      {!isLoading && subscriptions.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence>
            {subscriptions.map((subscription, index) => (
              <motion.div
                key={subscription._id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.18) }}
              >
                <AlertCard
                  subscription={subscription}
                  onEdit={handleEdit}
                  onToggle={async (item) => {
                    await toggleSubscription(item._id);
                  }}
                  onDelete={(item) => setDeleting(item)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-xl font-bold text-text">Notification History</h2>
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">
              <Bell size={12} /> {historyUnread} unread
            </span>
            <button type="button" className="btn-surface" onClick={handleMarkRead} aria-label="Mark notifications as read">
              Mark as read
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <EmptyState title="No alert notifications" message="Incoming alert notifications will appear here." />
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <article key={item._id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text">{item.title}</p>
                  {!item.isRead ? <span className="h-2.5 w-2.5 rounded-full bg-danger" /> : null}
                </div>
                <p className="mt-1 text-xs text-text-muted">{item.message}</p>
                <p className="mt-2 text-[11px] text-text-muted">{formatRelativeTime(item.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setModalOpen(false);
              setEditing(null);
            }}
          >
            <motion.div
              className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-5"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="mb-3 font-heading text-xl font-bold text-text">
                {editing ? 'Edit Subscription' : 'Create Subscription'}
              </h3>
              <AlertForm onSubmit={handleFormSubmit} defaultValues={formDefaults} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleting)}
        title="Delete subscription"
        message="This will stop future alerts for this zone. Continue?"
        confirmText="Delete"
        confirmLoading={confirmLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </PageTransition>
  );
};

export default AlertsPage;
