const AlertCard = ({ subscription, onToggle, onDelete, onEdit }) => {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <h3 className="text-lg font-semibold text-text">{subscription.label || 'Alert Zone'}</h3>
      <p className="mt-1 text-sm text-text-muted">Radius: {subscription.radiusKm} km</p>
      <p className="mt-1 text-sm text-text-muted">Status: {subscription.isActive ? 'Active' : 'Paused'}</p>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={() => onEdit?.(subscription)} className="btn-surface" aria-label="Edit alert subscription">
          Edit
        </button>
        <button type="button" onClick={() => onToggle?.(subscription)} className="btn-surface" aria-label="Toggle alert">
          {subscription.isActive ? 'Pause' : 'Activate'}
        </button>
        <button type="button" onClick={() => onDelete?.(subscription)} className="btn-danger" aria-label="Delete alert subscription">
          Delete
        </button>
      </div>
    </article>
  );
};

export default AlertCard;
