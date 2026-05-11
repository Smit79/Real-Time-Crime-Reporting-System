const EmptyState = ({ title = 'Nothing to show', message = 'Try changing filters or checking back later.' }) => {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm text-text-muted">{message}</p>
    </div>
  );
};

export default EmptyState;
