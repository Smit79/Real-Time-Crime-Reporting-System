import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CrimeAlertPopup = ({ alert, onClose, onViewMap }) => {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!alert) return undefined;

    const start = Date.now();
    const timeout = 10000;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.max(0, 100 - (elapsed / timeout) * 100);
      setProgress(next);
      if (next <= 0) {
        clearInterval(timer);
        onClose?.();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [alert, onClose]);

  return (
    <AnimatePresence>
      {alert ? (
        <motion.aside
          className="fixed right-4 top-4 z-[60] w-full max-w-sm rounded-2xl border border-danger/60 bg-surface p-4 shadow-soft"
          initial={reduceMotion ? false : { opacity: 0, x: 80 }}
          animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
          exit={reduceMotion ? {} : { opacity: 0, x: 80 }}
        >
          <h3 className="text-lg font-bold text-danger">Nearby Crime Alert</h3>
          <p className="mt-1 text-sm text-text-muted">{alert.message || 'A new report was detected near your location.'}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-danger" onClick={onViewMap} aria-label="View alert on map">
              View on map
            </button>
            <button type="button" className="btn-surface" onClick={onClose} aria-label="Dismiss alert">
              Dismiss
            </button>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-danger/20">
            <div className="h-full bg-danger transition-all" style={{ width: `${progress}%` }} />
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
};

export default CrimeAlertPopup;
