import { LogOut, Menu, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import NotificationActivityDrawer from '../alerts/NotificationActivityDrawer';
import NotificationBell from '../alerts/NotificationBell';
import useAuthStore from '../../store/authStore';
import { APP_NAME } from '../../utils/constants';
import ConnectionStatus from './ConnectionStatus';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onToggleSidebar, isRealtimeConnected = false }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [activityOpen, setActivityOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <motion.header
      className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <motion.div
          className="inline-flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04, duration: 0.24 }}
        >
          <motion.button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text lg:hidden"
            aria-label="Open navigation menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={18} />
          </motion.button>

          <motion.div whileHover={{ x: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
            <Link to="/home" className="inline-flex items-center gap-2 text-text" aria-label="Go to home page">
              <ShieldAlert className="text-primary" size={22} />
              <span className="font-heading text-lg font-semibold tracking-tight">{APP_NAME}</span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.24 }}
        >
          <ConnectionStatus connected={isRealtimeConnected} />
          <NotificationBell onClick={() => setActivityOpen(true)} />

          <ThemeToggle />

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-text">{user?.fullName || 'Guest User'}</p>
            <p className="text-xs capitalize text-text-muted">{user?.role || 'visitor'}</p>
          </div>

          {user ? (
            <motion.button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Logout"
              whileHover={{ scale: 1.05, rotate: -6 }}
              whileTap={{ scale: 0.95, rotate: 0 }}
            >
              <LogOut size={17} />
            </motion.button>
          ) : null}
        </motion.div>
      </div>

      <NotificationActivityDrawer
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        onViewAll={() => {
          setActivityOpen(false);
          navigate('/alerts');
        }}
      />
    </motion.header>
  );
};

export default Navbar;
