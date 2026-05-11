import { AnimatePresence, motion } from 'framer-motion';

const UserTable = ({
  users = [],
  sortBy = 'createdAt',
  sortOrder = 'desc',
  selectedIds = [],
  onSort,
  onToggleSelect,
  onToggleSelectAll,
  onRoleChange,
  onToggleStatus,
  onDelete,
}) => {
  const selectedSet = new Set(selectedIds);
  const allSelected = users.length > 0 && users.every((user) => selectedSet.has(user._id));

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
            aria-label="Select all users on page"
          />
          Select all users on page
        </label>
        {users.map((user) => (
          <motion.article
            key={user._id}
            className="rounded-xl border border-border p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -1 }}
          >
            <div className="flex items-start justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={selectedSet.has(user._id)}
                  onChange={() => onToggleSelect?.(user._id)}
                  aria-label={`Select user ${user.fullName}`}
                />
                Select
              </label>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize text-text-muted">
                {user.isActive ? 'active' : 'inactive'}
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-text">{user.fullName}</p>
            <p className="text-xs text-text-muted">{user.email}</p>
            <p className="mt-1 text-xs capitalize text-text-muted">Role: {user.role}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                className="btn-surface w-full"
                onClick={() => onRoleChange?.(user)}
                aria-label="Change user role"
                whileTap={{ scale: 0.97 }}
              >
                Role
              </motion.button>
              <motion.button
                type="button"
                className="btn-surface w-full"
                onClick={() => onToggleStatus?.(user)}
                aria-label="Toggle user status"
                whileTap={{ scale: 0.97 }}
              >
                Toggle
              </motion.button>
            </div>
            <motion.button
              type="button"
              className="btn-danger mt-2 w-full"
              onClick={() => onDelete?.(user)}
              aria-label="Delete user"
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
                aria-label="Select all users on page"
              />
            </th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('fullName', 'Name')}</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('email', 'Email')}</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('role', 'Role')}</th>
            <th className="px-4 py-3 text-left">{renderSortableHeader('isActive', 'Status')}</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <motion.tbody className="divide-y divide-border" layout>
          <AnimatePresence initial={false}>
            {users.map((user) => (
              <motion.tr
                key={user._id}
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
                  checked={selectedSet.has(user._id)}
                  onChange={() => onToggleSelect?.(user._id)}
                  aria-label={`Select user ${user.fullName}`}
                />
              </td>
              <td className="px-4 py-3">{user.fullName}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3 capitalize">{user.role}</td>
              <td className="px-4 py-3">{user.isActive ? 'Active' : 'Inactive'}</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <motion.button
                    type="button"
                    className="btn-surface"
                    onClick={() => onRoleChange?.(user)}
                    aria-label="Change user role"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Role
                  </motion.button>
                  <motion.button
                    type="button"
                    className="btn-surface"
                    onClick={() => onToggleStatus?.(user)}
                    aria-label="Toggle user status"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Toggle
                  </motion.button>
                  <motion.button
                    type="button"
                    className="btn-danger"
                    onClick={() => onDelete?.(user)}
                    aria-label="Delete user"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Delete
                  </motion.button>
                </div>
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

export default UserTable;
