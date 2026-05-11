import { AnimatePresence, motion } from 'framer-motion';

import { formatDateTime } from '../../utils/formatters';

const AuditLogTable = ({ logs = [], sortBy = 'createdAt', sortOrder = 'desc', onSort }) => {
  const renderDiff = (metadata) => {
    const before = metadata?.before;
    const after = metadata?.after;

    if (!before || !after || typeof before !== 'object' || typeof after !== 'object') {
      return <span className="text-text-muted">-</span>;
    }

    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
    const changed = keys.filter((key) => String(before[key]) !== String(after[key]));

    if (changed.length === 0) {
      return <span className="text-text-muted">-</span>;
    }

    return (
      <div className="space-y-1">
        {changed.slice(0, 3).map((key) => (
          <p key={key} className="text-xs text-text-muted">
            <span className="font-semibold text-text">{key}</span>: {String(before[key] ?? '-')} to {String(after[key] ?? '-')}
          </p>
        ))}
      </div>
    );
  };

  const getSortGlyph = (columnKey) => {
    if (sortBy !== columnKey) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const renderSortableHeader = (columnKey, label) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-semibold text-text-muted transition hover:text-text"
      onClick={() => onSort?.(columnKey)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span className="text-[11px]">{getSortGlyph(columnKey)}</span>
    </button>
  );

  return (
    <motion.div
      className="rounded-2xl border border-border bg-surface shadow-soft"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="space-y-3 p-3 md:hidden">
        {logs.map((log) => (
          <motion.article
            key={log._id}
            className="rounded-xl border border-border p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -1 }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{log.action}</p>
              <p className="text-xs text-text-muted">{formatDateTime(log.createdAt)}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-text">{log.targetType}</p>
            <p className="mt-1 text-xs text-text-muted">{log.description}</p>
            <div className="mt-2 rounded-lg border border-border p-2">
              {renderDiff(log.metadata)}
            </div>
          </motion.article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-slate-100/60 dark:bg-slate-800/40">
          <tr>
            <th className="px-4 py-3 text-left">{renderSortableHeader('action', 'Action')}</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('targetType', 'Target')}</th>
            <th className="px-4 py-3 text-left">Description</th>
            <th className="px-4 py-3 text-left">Diff</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('createdAt', 'Time')}</th>
          </tr>
        </thead>
        <motion.tbody className="divide-y divide-border" layout>
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.tr
                key={log._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                whileHover={{ backgroundColor: 'rgba(148, 163, 184, 0.08)' }}
              >
              <td className="px-4 py-3">{log.action}</td>
              <td className="px-4 py-3">{log.targetType}</td>
              <td className="px-4 py-3">{log.description}</td>
              <td className="px-4 py-3">{renderDiff(log.metadata)}</td>
              <td className="px-4 py-3">{formatDateTime(log.createdAt)}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </motion.tbody>
      </table>
      </div>
    </motion.div>
  );
};

export default AuditLogTable;
