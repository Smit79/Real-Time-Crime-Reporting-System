import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

import useNotificationStore from '../../store/notificationStore';

const NotificationBell = ({ onClick }) => {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text"
      aria-label="Open notifications"
      animate={unreadCount > 0 ? { rotate: [0, 14, -12, 10, -8, 0] } : { rotate: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <Bell size={18} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-xs font-semibold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </motion.button>
  );
};

export default NotificationBell;
