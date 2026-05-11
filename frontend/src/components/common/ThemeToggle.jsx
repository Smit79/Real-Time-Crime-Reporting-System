import { Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

import useThemeStore from '../../store/themeStore';

const options = [
  { key: 'light', Icon: Sun, label: 'Light theme' },
  { key: 'dark', Icon: Moon, label: 'Dark theme' },
  { key: 'system', Icon: Monitor, label: 'System theme' },
];

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const setSavedTheme = useThemeStore((state) => state.setTheme);

  const handleSetTheme = (nextTheme) => {
    setTheme(nextTheme);
    setSavedTheme(nextTheme);
  };

  const activeTheme = theme || 'system';

  return (
    <motion.div
      className="inline-flex items-center rounded-full border border-border bg-surface p-1"
      role="group"
      aria-label="Theme selector"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
    >
      {options.map(({ key, Icon, label }) => (
        <motion.button
          key={key}
          type="button"
          onClick={() => handleSetTheme(key)}
          className={clsx(
            'inline-flex h-8 w-8 items-center justify-center rounded-full transition duration-300',
            activeTheme === key
              ? 'bg-primary text-white shadow-soft'
              : 'text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
          aria-label={label}
          title={label}
          whileHover={{ y: -1, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          animate={activeTheme === key ? { scale: 1.08 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        >
          <Icon size={16} />
        </motion.button>
      ))}
    </motion.div>
  );
};

export default ThemeToggle;
