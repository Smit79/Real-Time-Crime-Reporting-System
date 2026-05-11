import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { deleteUser, getAllUsers, toggleUserStatus, updateUserRole } from '../../api/adminApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTransition from '../../components/common/PageTransition';
import UserTable from '../../components/admin/UserTable';
import { downloadCsv } from '../../utils/csvExport';
import { formatDateTime } from '../../utils/formatters';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    isActive: '',
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [isLoading, setIsLoading] = useState(false);

  const [roleTarget, setRoleTarget] = useState(null);
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const [toggleTarget, setToggleTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkRole, setBulkRole] = useState('officer');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportAllLoading, setExportAllLoading] = useState(false);

  useEffect(() => {
    document.title = 'Manage Users | CrimeWatch';
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await getAllUsers(filters);
        setUsers(Array.isArray(response?.data?.users) ? response.data.users : []);
        setPagination(response?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers().catch(() => {});
  }, [filters]);

  useEffect(() => {
    setSelectedUserIds((current) => current.filter((id) => users.some((user) => user._id === id)));
  }, [users]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleOpenRoleModal = (user) => {
    setRoleTarget(user);
    setSelectedRole(user?.role || 'citizen');
  };

  const handleRoleUpdate = async () => {
    if (!roleTarget?._id) return;
    setRoleSubmitting(true);
    try {
      const response = await updateUserRole(roleTarget._id, { role: selectedRole });
      const updatedUser = response?.data?.user;
      if (updatedUser?._id) {
        setUsers((current) => current.map((user) => (user._id === updatedUser._id ? { ...user, ...updatedUser } : user)));
      }
      setRoleTarget(null);
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleTarget?._id) return;
    setConfirmLoading(true);
    try {
      const response = await toggleUserStatus(toggleTarget._id);
      const nextActive = response?.data?.isActive;
      if (typeof nextActive === 'boolean') {
        setUsers((current) =>
          current.map((user) => (user._id === toggleTarget._id ? { ...user, isActive: nextActive } : user))
        );
      }
      setToggleTarget(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget?._id) return;
    setConfirmLoading(true);
    try {
      await deleteUser(deleteTarget._id);
      setUsers((current) => current.filter((user) => user._id !== deleteTarget._id));
      setDeleteTarget(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSort = (columnKey) => {
    setFilters((current) => ({
      ...current,
      page: 1,
      sortBy: columnKey,
      order: current.sortBy === columnKey && current.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExportUsers = () => {
    downloadCsv({
      filename: `users-page-${pagination.page || 1}.csv`,
      columns: [
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { label: 'Status', value: (row) => (row?.isActive ? 'Active' : 'Inactive') },
        { label: 'Verified', value: (row) => (row?.isVerified ? 'Yes' : 'No') },
        { label: 'Created At', value: (row) => formatDateTime(row?.createdAt) },
      ],
      rows: users,
    });
  };

  const handleExportAllUsers = async () => {
    setExportAllLoading(true);
    try {
      const baseParams = { ...filters, page: 1, limit: 100 };
      const firstResponse = await getAllUsers(baseParams);
      const allUsers = Array.isArray(firstResponse?.data?.users) ? [...firstResponse.data.users] : [];
      const totalPages = Number(firstResponse?.data?.pagination?.totalPages || 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const pageResponse = await getAllUsers({ ...baseParams, page });
        const pageUsers = Array.isArray(pageResponse?.data?.users) ? pageResponse.data.users : [];
        allUsers.push(...pageUsers);
      }

      downloadCsv({
        filename: `users-all-matching.csv`,
        columns: [
          { key: 'fullName', label: 'Full Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { label: 'Status', value: (row) => (row?.isActive ? 'Active' : 'Inactive') },
          { label: 'Verified', value: (row) => (row?.isVerified ? 'Yes' : 'No') },
          { label: 'Created At', value: (row) => formatDateTime(row?.createdAt) },
        ],
        rows: allUsers,
      });
    } finally {
      setExportAllLoading(false);
    }
  };

  const handleToggleSelectUser = (id) => {
    setSelectedUserIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleToggleSelectAllUsers = () => {
    const visibleIds = users.map((user) => user._id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedUserIds.includes(id));

    if (allVisibleSelected) {
      setSelectedUserIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedUserIds((current) => Array.from(new Set([...current, ...visibleIds])));
  };

  const handleBulkRoleUpdate = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkLoading(true);
    try {
      for (const id of selectedUserIds) {
        const targetUser = users.find((user) => user._id === id);
        if (!targetUser || targetUser.role === bulkRole) continue;
        await updateUserRole(id, { role: bulkRole });
      }

      setUsers((current) =>
        current.map((user) =>
          selectedUserIds.includes(user._id) ? { ...user, role: bulkRole } : user
        )
      );
      setSelectedUserIds([]);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatus = async (shouldActivate) => {
    if (selectedUserIds.length === 0) return;
    setBulkLoading(true);
    try {
      for (const id of selectedUserIds) {
        const targetUser = users.find((user) => user._id === id);
        if (!targetUser) continue;
        if (targetUser.isActive === shouldActivate) continue;
        await toggleUserStatus(id);
      }

      setUsers((current) =>
        current.map((user) =>
          selectedUserIds.includes(user._id) ? { ...user, isActive: shouldActivate } : user
        )
      );
      setSelectedUserIds([]);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkLoading(true);
    try {
      for (const id of selectedUserIds) {
        await deleteUser(id);
      }
      setUsers((current) => current.filter((user) => !selectedUserIds.includes(user._id)));
      setSelectedUserIds([]);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <h1 className="font-heading text-3xl font-bold text-text">Manage Users</h1>
        <p className="text-sm text-text-muted">Administer roles, access status, and platform trust controls.</p>
      </motion.div>

      <motion.section
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-4 shadow-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.24 }}
      >
        <input
          className="input-field md:col-span-2"
          placeholder="Search users by name, email, phone"
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          aria-label="Search users"
        />

        <select
          className="input-field"
          value={filters.role}
          onChange={(event) => updateFilter('role', event.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="citizen">Citizen</option>
          <option value="officer">Officer</option>
          <option value="admin">Admin</option>
        </select>

        <select
          className="input-field"
          value={filters.isActive}
          onChange={(event) => updateFilter('isActive', event.target.value)}
          aria-label="Filter by account status"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </motion.section>

      <motion.div
        className="flex flex-wrap justify-stretch gap-2 sm:justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.06, duration: 0.24 }}
      >
        <motion.button
          type="button"
          className="btn-surface w-full sm:w-auto"
          onClick={handleExportUsers}
          aria-label="Export current users page as CSV"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          Export Page CSV
        </motion.button>
        <motion.button
          type="button"
          className="btn-surface w-full sm:w-auto"
          onClick={handleExportAllUsers}
          aria-label="Export all matching users as CSV"
          disabled={exportAllLoading}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {exportAllLoading ? 'Exporting all...' : 'Export All CSV'}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {selectedUserIds.length > 0 ? (
          <motion.section
            className="flex flex-col items-stretch gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p className="text-sm font-semibold text-primary">{selectedUserIds.length} selected</p>
            <div className="flex flex-wrap items-center gap-2">
              <select className="input-field w-full sm:w-auto" value={bulkRole} onChange={(event) => setBulkRole(event.target.value)}>
                <option value="citizen">Citizen</option>
                <option value="officer">Officer</option>
                <option value="admin">Admin</option>
              </select>
              <motion.button type="button" className="btn-surface w-full sm:w-auto" onClick={handleBulkRoleUpdate} disabled={bulkLoading} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                Set Role
              </motion.button>
              <motion.button type="button" className="btn-surface w-full sm:w-auto" onClick={() => handleBulkStatus(true)} disabled={bulkLoading} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                Activate
              </motion.button>
              <motion.button type="button" className="btn-surface w-full sm:w-auto" onClick={() => handleBulkStatus(false)} disabled={bulkLoading} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                Deactivate
              </motion.button>
              <motion.button type="button" className="btn-danger w-full sm:w-auto" onClick={handleBulkDelete} disabled={bulkLoading} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                Delete Selected
              </motion.button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {isLoading ? <LoadingSpinner label="Loading users" /> : null}

      {!isLoading && users.length === 0 ? (
        <EmptyState title="No users found" message="Try adjusting filters to widen search results." />
      ) : null}

      {!isLoading && users.length > 0 ? (
        <UserTable
          users={users}
          sortBy={filters.sortBy}
          sortOrder={filters.order}
          selectedIds={selectedUserIds}
          onSort={handleSort}
          onToggleSelect={handleToggleSelectUser}
          onToggleSelectAll={handleToggleSelectAllUsers}
          onRoleChange={handleOpenRoleModal}
          onToggleStatus={(user) => setToggleTarget(user)}
          onDelete={(user) => setDeleteTarget(user)}
        />
      ) : null}

      <motion.div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
        <motion.button
          type="button"
          className="btn-surface w-full sm:w-auto"
          disabled={(pagination.page || 1) <= 1}
          onClick={() => updateFilter('page', Math.max(1, (pagination.page || 1) - 1))}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          Previous
        </motion.button>
        <p className="w-full text-center text-sm text-text-muted sm:w-auto sm:text-left">Page {pagination.page || 1} of {pagination.totalPages || 1}</p>
        <motion.button
          type="button"
          className="btn-surface w-full sm:w-auto"
          disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
          onClick={() => updateFilter('page', Math.min((pagination.totalPages || 1), (pagination.page || 1) + 1))}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          Next
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {roleTarget ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRoleTarget(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-5"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="font-heading text-xl font-bold text-text">Change User Role</h3>
              <p className="mt-1 text-sm text-text-muted">{roleTarget.fullName} • {roleTarget.email}</p>

              <select
                className="input-field mt-4"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                aria-label="Select new user role"
              >
                <option value="citizen">Citizen</option>
                <option value="officer">Officer</option>
                <option value="admin">Admin</option>
              </select>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="btn-surface" onClick={() => setRoleTarget(null)} disabled={roleSubmitting}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={handleRoleUpdate} disabled={roleSubmitting}>
                  {roleSubmitting ? 'Saving...' : 'Save role'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(toggleTarget)}
        title="Toggle account status"
        message={`This will ${toggleTarget?.isActive ? 'deactivate' : 'activate'} this user account. Continue?`}
        confirmText="Confirm"
        confirmLoading={confirmLoading}
        onConfirm={handleToggleStatus}
        onCancel={() => setToggleTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete user"
        message="This permanently removes the user account and associated reports. Continue?"
        confirmText="Delete"
        confirmLoading={confirmLoading}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageTransition>
  );
};

export default ManageUsersPage;
