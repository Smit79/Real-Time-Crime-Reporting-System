const SkeletonCard = ({ lines = 3, withAvatar = false }) => {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      {withAvatar ? <div className="mb-3 h-10 w-10 animate-shimmer rounded-full bg-slate-200/70 dark:bg-slate-700/70" /> : null}
      <div className="mb-3 h-5 w-2/3 animate-shimmer rounded bg-slate-200/70 dark:bg-slate-700/70" />
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="mb-2 h-4 animate-shimmer rounded bg-slate-200/60 dark:bg-slate-700/60"
          style={{ width: index === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  );
};

export default SkeletonCard;
