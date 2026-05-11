import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { deleteReport, getAllReports } from '../../api/adminApi';
import ReportTable from '../../components/admin/ReportTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTransition from '../../components/common/PageTransition';
import StatCard from '../../components/analytics/StatCard';
import { downloadCsv } from '../../utils/csvExport';
import { formatCrimeType, formatDateTime } from '../../utils/formatters';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    crimeType: '',
    severity: '',
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportAllLoading, setExportAllLoading] = useState(false);

  useEffect(() => {
    document.title = 'Admin Reports | CrimeWatch';
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const response = await getAllReports(filters);
        setReports(Array.isArray(response?.data?.reports) ? response.data.reports : []);
        setPagination(response?.data?.pagination || { page: 1, totalPages: 1, total: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    loadReports().catch(() => {});
  }, [filters]);

  useEffect(() => {
    setSelectedReportIds((current) => current.filter((id) => reports.some((report) => report._id === id)));
  }, [reports]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    setConfirmLoading(true);
    try {
      await deleteReport(deleteTarget._id);
      setReports((current) => current.filter((report) => report._id !== deleteTarget._id));
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

  const handleExportReports = () => {
    downloadCsv({
      filename: `admin-reports-page-${pagination.page || 1}.csv`,
      columns: [
        { key: 'title', label: 'Title' },
        { label: 'Crime Type', value: (row) => formatCrimeType(row?.crimeType) },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { label: 'Reporter', value: (row) => row?.reportedBy?.fullName || 'Anonymous' },
        { label: 'Created At', value: (row) => formatDateTime(row?.createdAt) },
      ],
      rows: reports,
    });
  };

  const handleExportAllReports = async () => {
    setExportAllLoading(true);
    try {
      const baseParams = { ...filters, page: 1, limit: 100 };
      const firstResponse = await getAllReports(baseParams);
      const allReports = Array.isArray(firstResponse?.data?.reports) ? [...firstResponse.data.reports] : [];
      const totalPages = Number(firstResponse?.data?.pagination?.totalPages || 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const pageResponse = await getAllReports({ ...baseParams, page });
        const pageReports = Array.isArray(pageResponse?.data?.reports) ? pageResponse.data.reports : [];
        allReports.push(...pageReports);
      }

      downloadCsv({
        filename: `admin-reports-all-matching.csv`,
        columns: [
          { key: 'title', label: 'Title' },
          { label: 'Crime Type', value: (row) => formatCrimeType(row?.crimeType) },
          { key: 'severity', label: 'Severity' },
          { key: 'status', label: 'Status' },
          { label: 'Reporter', value: (row) => row?.reportedBy?.fullName || 'Anonymous' },
          { label: 'Created At', value: (row) => formatDateTime(row?.createdAt) },
        ],
        rows: allReports,
      });
    } finally {
      setExportAllLoading(false);
    }
  };

  const handleToggleSelectReport = (id) => {
    setSelectedReportIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleToggleSelectAllReports = () => {
    const visibleIds = reports.map((report) => report._id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedReportIds.includes(id));

    if (allVisibleSelected) {
      setSelectedReportIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedReportIds((current) => Array.from(new Set([...current, ...visibleIds])));
  };

  const handleBulkDeleteReports = async () => {
    if (selectedReportIds.length === 0) return;
    setBulkLoading(true);
    try {
      for (const id of selectedReportIds) {
        await deleteReport(id);
      }
      setReports((current) => current.filter((report) => !selectedReportIds.includes(report._id)));
      setSelectedReportIds([]);
    } finally {
      setBulkLoading(false);
    }
  };

  const stats = useMemo(() => {
    return reports.reduce(
      (accumulator, report) => {
        accumulator.total += 1;
        if (report.status === 'pending') accumulator.pending += 1;
        if (report.status === 'resolved') accumulator.resolved += 1;
        if (Number(report.severity || 0) >= 4) accumulator.highSeverity += 1;
        return accumulator;
      },
      { total: 0, pending: 0, resolved: 0, highSeverity: 0 }
    );
  }, [reports]);

  return (
    <PageTransition className="space-y-6">
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <h1 className="font-heading text-3xl font-bold text-text">Admin Reports</h1>
        <p className="text-sm text-text-muted">Moderate platform reports with governance-grade controls.</p>
      </motion.div>

      <motion.div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.04, duration: 0.24 }}
      >
        <StatCard label="Visible in page" value={stats.total} accent="text-primary" />
        <StatCard label="Pending" value={stats.pending} accent="text-warning" />
        <StatCard label="Resolved" value={stats.resolved} accent="text-success" />
        <StatCard label="High severity" value={stats.highSeverity} accent="text-danger" />
      </motion.div>

      <motion.section
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-5 shadow-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.24 }}
      >
        <input
          className="input-field md:col-span-2"
          placeholder="Search reports"
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          aria-label="Search reports"
        />

        <select className="input-field" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select className="input-field" value={filters.crimeType} onChange={(event) => updateFilter('crimeType', event.target.value)}>
          <option value="">All types</option>
          <option value="theft">Theft</option>
          <option value="robbery">Robbery</option>
          <option value="assault">Assault</option>
          <option value="fraud">Fraud</option>
          <option value="accident">Accident</option>
          <option value="fire">Fire</option>
          <option value="other">Other</option>
        </select>

        <select className="input-field" value={filters.severity} onChange={(event) => updateFilter('severity', event.target.value)}>
          <option value="">All severity</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
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
          onClick={handleExportReports}
          aria-label="Export current reports page as CSV"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          Export Page CSV
        </motion.button>
        <motion.button
          type="button"
          className="btn-surface w-full sm:w-auto"
          onClick={handleExportAllReports}
          aria-label="Export all matching reports as CSV"
          disabled={exportAllLoading}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {exportAllLoading ? 'Exporting all...' : 'Export All CSV'}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {selectedReportIds.length > 0 ? (
          <motion.section
            className="flex flex-col items-stretch gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p className="text-sm font-semibold text-danger">{selectedReportIds.length} selected</p>
            <motion.button
              type="button"
              className="btn-danger w-full sm:w-auto"
              onClick={handleBulkDeleteReports}
              disabled={bulkLoading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              Delete Selected
            </motion.button>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {isLoading ? <LoadingSpinner label="Loading reports" /> : null}

      {!isLoading && reports.length === 0 ? (
        <EmptyState title="No reports found" message="No records match your selected filters." />
      ) : null}

      {!isLoading && reports.length > 0 ? (
        <ReportTable
          reports={reports}
          sortBy={filters.sortBy}
          sortOrder={filters.order}
          selectedIds={selectedReportIds}
          onSort={handleSort}
          onToggleSelect={handleToggleSelectReport}
          onToggleSelectAll={handleToggleSelectAllReports}
          onDelete={(report) => setDeleteTarget(report)}
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

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete report"
        message="This permanently removes the selected report from platform records. Continue?"
        confirmText="Delete report"
        confirmLoading={confirmLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageTransition>
  );
};

export default AdminReportsPage;
