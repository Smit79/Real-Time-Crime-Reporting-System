import { AnimatePresence, motion } from 'framer-motion';

import StatusBadge from '../crime/StatusBadge';
import { formatCrimeType, formatDateTime } from '../../utils/formatters';

const ReportTable = ({
  reports = [],
  sortBy = 'createdAt',
  sortOrder = 'desc',
  selectedIds = [],
  onSort,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
}) => {
  const selectedSet = new Set(selectedIds);
  const allSelected = reports.length > 0 && reports.every((report) => selectedSet.has(report._id));

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
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleSelectAll?.()}
            aria-label="Select all reports on page"
          />
          Select all reports on page
        </label>
        {reports.map((report) => (
          <motion.article
            key={report._id}
            className="rounded-xl border border-border p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -1 }}
          >
            <div className="flex items-start justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={selectedSet.has(report._id)}
                  onChange={() => onToggleSelect?.(report._id)}
                  aria-label={`Select report ${report.title}`}
                />
                Select
              </label>
              <StatusBadge status={report.status} />
            </div>

            <p className="mt-2 text-sm font-semibold text-text">{report.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span>{formatCrimeType(report.crimeType)}</span>
              <span>Severity {report.severity}</span>
              <span>{formatDateTime(report.createdAt)}</span>
            </div>

            <motion.button
              type="button"
              className="btn-danger mt-3 w-full"
              onClick={() => onDelete?.(report)}
              aria-label="Delete report"
              whileTap={{ scale: 0.97 }}
            >
              Delete
            </motion.button>
          </motion.article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-slate-100/60 dark:bg-slate-800/40">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onToggleSelectAll?.()}
                aria-label="Select all reports on page"
              />
            </th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('title', 'Title')}</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('crimeType', 'Type')}</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('severity', 'Severity')}</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('status', 'Status')}</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('createdAt', 'Created')}</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <motion.tbody className="divide-y divide-border" layout>
          <AnimatePresence initial={false}>
            {reports.map((report) => (
              <motion.tr
                key={report._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                whileHover={{ backgroundColor: 'rgba(148, 163, 184, 0.08)' }}
              >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedSet.has(report._id)}
                  onChange={() => onToggleSelect?.(report._id)}
                  aria-label={`Select report ${report.title}`}
                />
              </td>
              <td className="px-4 py-3">{report.title}</td>
              <td className="px-4 py-3">{formatCrimeType(report.crimeType)}</td>
              <td className="px-4 py-3">{report.severity}</td>
              <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
              <td className="px-4 py-3">{formatDateTime(report.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <motion.button
                  type="button"
                  className="btn-danger"
                  onClick={() => onDelete?.(report)}
                  aria-label="Delete report"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Delete
                </motion.button>
              </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </motion.tbody>
      </table>
      </div>
    </motion.div>
  );
};

export default ReportTable;
