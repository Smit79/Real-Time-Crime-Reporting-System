import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { getAuditLogs } from '../../api/adminApi';
import AuditLogTable from '../../components/admin/AuditLogTable';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTransition from '../../components/common/PageTransition';
import { downloadCsv } from '../../utils/csvExport';
import { formatDateTime } from '../../utils/formatters';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [exportAllLoading, setExportAllLoading] = useState(false);

  useEffect(() => {
    document.title = 'Audit Logs | CrimeWatch';
  }, []);

  useEffect(() => {
    const loadAuditLogs = async () => {
      setIsLoading(true);
      try {
        const response = await getAuditLogs(filters);
        setLogs(Array.isArray(response?.data?.logs) ? response.data.logs : []);
        setPagination(response?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    loadAuditLogs().catch(() => {});
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleSort = (columnKey) => {
    setFilters((current) => ({
      ...current,
      page: 1,
      sortBy: columnKey,
      order: current.sortBy === columnKey && current.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExportAudit = () => {
    downloadCsv({
      filename: `audit-logs-page-${pagination.page || 1}.csv`,
      columns: [
        { key: 'action', label: 'Action' },
        { key: 'targetType', label: 'Target Type' },
        { key: 'description', label: 'Description' },
        { label: 'Performed By', value: (row) => row?.performedBy?.fullName || row?.performedBy?.email || 'System' },
        { label: 'Created At', value: (row) => formatDateTime(row?.createdAt) },
      ],
      rows: logs,
    });
  };

  const handleExportAllAudit = async () => {
    setExportAllLoading(true);
    try {
      const baseParams = { ...filters, page: 1, limit: 100 };
      const firstResponse = await getAuditLogs(baseParams);
      const allLogs = Array.isArray(firstResponse?.data?.logs) ? [...firstResponse.data.logs] : [];
      const totalPages = Number(firstResponse?.data?.pagination?.totalPages || 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const pageResponse = await getAuditLogs({ ...baseParams, page });
        const pageLogs = Array.isArray(pageResponse?.data?.logs) ? pageResponse.data.logs : [];
        allLogs.push(...pageLogs);
      }

      downloadCsv({
        filename: `audit-logs-all-matching.csv`,
        columns: [
          { key: 'action', label: 'Action' },
          { key: 'targetType', label: 'Target Type' },
          { key: 'description', label: 'Description' },
          { label: 'Performed By', value: (row) => row?.performedBy?.fullName || row?.performedBy?.email || 'System' },
          { label: 'Created At', value: (row) => formatDateTime(row?.createdAt) },
        ],
        rows: allLogs,
      });
    } finally {
      setExportAllLoading(false);
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
        <h1 className="font-heading text-3xl font-bold text-text">Audit Logs</h1>
        <p className="text-sm text-text-muted">Trace governance actions and system events across the platform.</p>
      </motion.div>

      <motion.section
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-5 shadow-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.24 }}
      >
        <select
          className="input-field"
          value={filters.action}
          onChange={(event) => updateFilter('action', event.target.value)}
          aria-label="Filter by action"
        >
          <option value="">All actions</option>
          <option value="report_created">report_created</option>
          <option value="report_updated">report_updated</option>
          <option value="report_deleted">report_deleted</option>
          <option value="report_verified">report_verified</option>
          <option value="report_resolved">report_resolved</option>
          <option value="report_rejected">report_rejected</option>
          <option value="user_updated">user_updated</option>
          <option value="user_deleted">user_deleted</option>
          <option value="admin_action">admin_action</option>
        </select>

        <select
          className="input-field"
          value={filters.targetType}
          onChange={(event) => updateFilter('targetType', event.target.value)}
          aria-label="Filter by target type"
        >
          <option value="">All targets</option>
          <option value="User">User</option>
          <option value="CrimeReport">CrimeReport</option>
          <option value="System">System</option>
        </select>

        <input
          type="date"
          className="input-field"
          value={filters.startDate}
          onChange={(event) => updateFilter('startDate', event.target.value)}
          aria-label="Filter from date"
        />

        <input
          type="date"
          className="input-field"
          value={filters.endDate}
          onChange={(event) => updateFilter('endDate', event.target.value)}
          aria-label="Filter to date"
        />

        <select
          className="input-field"
          value={filters.limit}
          onChange={(event) => updateFilter('limit', Number(event.target.value))}
          aria-label="Rows per page"
        >
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>
      </motion.section>

      <motion.div
        className="flex flex-wrap justify-stretch gap-2 sm:justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.24 }}
      >
        <motion.button
          type="button"
          className="btn-surface w-full sm:w-auto"
          onClick={handleExportAudit}
          aria-label="Export current audit logs page as CSV"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          Export Page CSV
        </motion.button>
        <motion.button
          type="button"
          className="btn-surface w-full sm:w-auto"
          onClick={handleExportAllAudit}
          aria-label="Export all matching audit logs as CSV"
          disabled={exportAllLoading}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {exportAllLoading ? 'Exporting all...' : 'Export All CSV'}
        </motion.button>
      </motion.div>

      {isLoading ? <LoadingSpinner label="Loading audit logs" /> : null}

      {!isLoading && logs.length === 0 ? (
        <EmptyState title="No audit logs found" message="Try broadening your date range or filters." />
      ) : null}

      {!isLoading && logs.length > 0 ? (
        <AuditLogTable
          logs={logs}
          sortBy={filters.sortBy}
          sortOrder={filters.order}
          onSort={handleSort}
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
    </PageTransition>
  );
};

export default AuditLogsPage;
