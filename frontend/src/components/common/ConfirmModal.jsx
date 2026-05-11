import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

const ConfirmModal = ({
  open,
  title = 'Please confirm',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
  closeOnBackdrop = true,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleEsc = (event) => {
      if (event.key === 'Escape') onCancel?.();
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOnBackdrop ? onCancel : undefined}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-soft"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-text">{title}</h3>
            <p className="mt-2 text-sm text-text-muted">{message}</p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Cancel action"
                disabled={confirmLoading}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                aria-label="Confirm action"
                disabled={confirmLoading}
              >
                {confirmLoading ? 'Processing...' : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default ConfirmModal;
