import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Map, Shield, User, FileWarning, Bell, ChartColumn, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import useAuthStore from '../../store/authStore';

const navByRole = {
  citizen: [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/map', icon: Map, label: 'Map' },
    { to: '/report-crime', icon: FileWarning, label: 'Report Crime' },
    { to: '/my-reports', icon: FileWarning, label: 'My Reports' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  officer: [
    { to: '/officer/dashboard', icon: Shield, label: 'Dashboard' },
    { to: '/officer/reports', icon: FileWarning, label: 'Manage Reports' },
    { to: '/map', icon: Map, label: 'Map' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: ChartColumn, label: 'Overview' },
    { to: '/admin/users', icon: User, label: 'Users' },
    { to: '/admin/reports', icon: FileWarning, label: 'Reports' },
    { to: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
  ],
};

const Sidebar = ({ open = true, mobileOpen = false, onClose }) => {
  const role = useAuthStore((state) => state.user?.role || 'citizen');
  const links = navByRole[role] || navByRole.citizen;

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.04 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  };

  const renderLinks = ({ forceLabels = false } = {}) => (
    <motion.nav className="space-y-1 p-3" variants={listVariants} initial="hidden" animate="visible">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <motion.div
            key={link.to}
            variants={itemVariants}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
          >
            <NavLink
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-text hover:bg-slate-100 dark:hover:bg-slate-800'
                )
              }
              aria-label={`Open ${link.label}`}
            >
              <Icon size={18} />
              <span className={clsx(forceLabels ? 'inline' : open ? 'hidden xl:inline' : 'hidden')}>
                {link.label}
              </span>
            </NavLink>
          </motion.div>
        );
      })}
    </motion.nav>
  );

  return (
    <>
      <motion.aside
        className={clsx(
          'hidden border-r border-border bg-surface md:block',
          open ? 'w-20 xl:w-64' : 'w-20'
        )}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.26, ease: 'easeOut' }}
      >
        {renderLinks()}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur"
              onClick={onClose}
              aria-label="Close navigation menu"
            />

            <motion.aside
              className="relative h-full w-72 border-r border-border bg-surface"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between px-4 py-4">
                <p className="font-heading text-lg font-semibold text-text">Navigation</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
                  aria-label="Close navigation"
                >
                  <X size={16} />
                </button>
              </div>
              {renderLinks({ forceLabels: true })}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
