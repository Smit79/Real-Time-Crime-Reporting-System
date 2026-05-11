import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Bell, FileWarning, Home, Map, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/report-crime', icon: FileWarning, label: 'Report' },
  { to: '/my-reports', icon: FileWarning, label: 'My Reports' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const MobileBottomNav = () => {
  return (
    <motion.nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] backdrop-blur lg:hidden"
      aria-label="Mobile navigation"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <ul className="grid grid-cols-6">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.li
              key={item.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.04 * (index + 1) }}
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium',
                    'min-h-14',
                    isActive ? 'text-primary' : 'text-text-muted'
                  )
                }
                aria-label={`Open ${item.label}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
};

export default MobileBottomNav;
