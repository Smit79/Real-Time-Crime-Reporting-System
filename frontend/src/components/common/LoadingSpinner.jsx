import { LoaderCircle } from 'lucide-react';
import clsx from 'clsx';

const LoadingSpinner = ({ size = 20, label = 'Loading...', fullscreen = false, overlay = false }) => {
  const content = (
    <div className="inline-flex items-center gap-2 text-text-muted" role="status" aria-live="polite">
      <LoaderCircle className="animate-spin" size={size} aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (fullscreen) {
    return <div className="grid min-h-screen place-items-center">{content}</div>;
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-900/20 backdrop-blur-sm">
        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-soft">{content}</div>
      </div>
    );
  }

  return <div className={clsx('inline-flex')}>{content}</div>;
};

export default LoadingSpinner;
