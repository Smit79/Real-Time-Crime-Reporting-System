import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { getAllReports, getReportById, updateStatus } from '../../api/crimeApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import CrimeDetail from '../../components/crime/CrimeDetail';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTransition from '../../components/common/PageTransition';
import StatusBadge from '../../components/crime/StatusBadge';
import { downloadCsv } from '../../utils/csvExport';
import { formatCrimeType, formatDateTime } from '../../utils/formatters';

const ManageReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    crimeType: '',
    severity: '',
    search: '',
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState('verified');
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('verified');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportAllLoading, setExportAllLoading] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    document.title = 'Manage Reports | CrimeWatch';
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

  useEffect(() => {
    if (!viewingReport) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setViewingReport(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewingReport]);

  const openStatusModal = (report, status) => {
    setStatusTarget(report);
    setNextStatus(status);
  };

  const handleStatusUpdate = async () => {
    if (!statusTarget?._id) return;
    setUpdating(true);
    try {
      await updateStatus(statusTarget._id, { status: nextStatus });
      setReports((current) =>
        current.map((report) =>
          report._id === statusTarget._id
            ? { ...report, status: nextStatus }
            : report
        )
      );
      setStatusTarget(null);
    } finally {
      setUpdating(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleExportReports = () => {
    downloadCsv({
      filename: `officer-reports-page-${pagination.page || 1}.csv`,
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
        filename: `officer-reports-all-matching.csv`,
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

  const handleToggleSelect = (id) => {
    setSelectedReportIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = reports.map((report) => report._id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedReportIds.includes(id));

    if (allVisibleSelected) {
      setSelectedReportIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedReportIds((current) => Array.from(new Set([...current, ...visibleIds])));
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedReportIds.length === 0) return;
    setBulkLoading(true);
    try {
      for (const id of selectedReportIds) {
        await updateStatus(id, { status: bulkStatus });
      }

      setReports((current) =>
        current.map((report) =>
          selectedReportIds.includes(report._id) ? { ...report, status: bulkStatus } : report
        )
      );
      setSelectedReportIds([]);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleOpenReportView = async (report) => {
    setViewLoading(true);
    try {
      const response = await getReportById(report._id);
      setViewingReport(response?.data?.report || report);
    } finally {
      setViewLoading(false);
    }
  };

  const viewModal = viewingReport && typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[1300] grid place-items-center bg-slate-900/55 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setViewingReport(null)}
        >
          <motion.div
            className="relative w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full border border-border bg-surface/95 p-1.5 text-text transition hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setViewingReport(null)}
              aria-label="Close report details"
            >
              <X size={16} />
            </button>

            <div className="max-h-[88vh] overflow-y-auto rounded-2xl">
              <CrimeDetail report={viewingReport} />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    )
    : null;

  return (
    <PageTransition className="space-y-6">
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <h1 className="font-heading text-3xl font-bold text-text">Manage Reports</h1>
        <p className="text-sm text-text-muted">Verify, investigate, resolve, or reject reports from one queue.</p>
      </motion.div>

      <motion.section
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-5 shadow-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.24 }}
      >
        <input
          className="input-field md:col-span-2"
          placeholder="Search by title or description"
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          aria-label="Search reports"
        />

        <select
          className="input-field"
          value={filters.status}
          onChange={(event) => updateFilter('status', event.target.value)}
          aria-label="Filter reports by status"
        >
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          className="input-field"
          value={filters.crimeType}
          onChange={(event) => updateFilter('crimeType', event.target.value)}
          aria-label="Filter reports by crime type"
        >
          <option value="">All crime types</option>
          <option value="theft">Theft</option>
          <option value="robbery">Robbery</option>
          <option value="assault">Assault</option>
          <option value="fraud">Fraud</option>
          <option value="accident">Accident</option>
          <option value="fire">Fire</option>
          <option value="other">Other</option>
        </select>

        <select
          className="input-field"
          value={filters.severity}
          onChange={(event) => updateFilter('severity', event.target.value)}
          aria-label="Filter reports by severity"
        >
          <option value="">All severity</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>

        <select
          className="input-field"
          value={filters.sortBy}
          onChange={(event) => updateFilter('sortBy', event.target.value)}
          aria-label="Sort field"
        >
          <option value="createdAt">Sort by created time</option>
          <option value="severity">Sort by severity</option>
          <option value="status">Sort by status</option>
          <option value="crimeType">Sort by crime type</option>
        </select>

        <select
          className="input-field"
          value={filters.order}
          onChange={(event) => updateFilter('order', event.target.value)}
          aria-label="Sort direction"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
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
            className="flex flex-col items-stretch gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p className="text-sm font-semibold text-primary">{selectedReportIds.length} selected</p>
            <div className="flex flex-wrap items-center gap-2">
              <select className="input-field w-full sm:w-auto" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
                <option value="verified">verified</option>
                <option value="investigating">investigating</option>
                <option value="resolved">resolved</option>
                <option value="rejected">rejected</option>
              </select>
              <motion.button
                type="button"
                className="btn-primary w-full sm:w-auto"
                onClick={handleBulkStatusUpdate}
                disabled={bulkLoading}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                Apply to selected
              </motion.button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {isLoading ? <LoadingSpinner label="Loading reports" /> : null}

      {!isLoading && reports.length === 0 ? (
        <EmptyState title="No reports found" message="Try adjusting filters or search keywords." />
      ) : null}

      {!isLoading && reports.length > 0 ? (
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
          <label className="inline-flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={reports.length > 0 && reports.every((report) => selectedReportIds.includes(report._id))}
              onChange={handleSelectAllVisible}
              aria-label="Select all visible reports"
            />
            Select all visible
          </label>

          {reports.map((report, index) => (
            <motion.article
              key={report._id}
              className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
              whileHover={{ y: -2 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <label className="mb-1 inline-flex items-center gap-2 text-xs text-text-muted">
                    <input
                      type="checkbox"
                      checked={selectedReportIds.includes(report._id)}
                      onChange={() => handleToggleSelect(report._id)}
                      aria-label={`Select report ${report.title}`}
                    />
                    Select
                  </label>
                  <h3 className="text-lg font-semibold text-text">{report.title}</h3>
                  <p className="text-xs text-text-muted">{formatDateTime(report.createdAt)}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              <p className="mt-2 text-sm text-text-muted">{report.description}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{formatCrimeType(report.crimeType)}</span>
                <span className="rounded-full bg-danger/10 px-2 py-1 text-danger">Severity {report.severity}</span>
                <span className="rounded-full bg-secondary/10 px-2 py-1 text-secondary">
                  Reporter: {report.reportedBy?.fullName || 'Anonymous'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <motion.button type="button" className="btn-surface w-full sm:w-auto inline-flex items-center gap-1" onClick={() => handleOpenReportView(report)} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Eye size={14} /> View
                </motion.button>
                <motion.button type="button" className="btn-surface w-full sm:w-auto" onClick={() => openStatusModal(report, 'verified')} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  Mark verified
                </motion.button>
                <motion.button type="button" className="btn-surface w-full sm:w-auto" onClick={() => openStatusModal(report, 'investigating')} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  Start investigation
                </motion.button>
                <motion.button type="button" className="btn-surface w-full sm:w-auto" onClick={() => openStatusModal(report, 'resolved')} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  Resolve
                </motion.button>
                <motion.button type="button" className="btn-danger w-full sm:w-auto" onClick={() => openStatusModal(report, 'rejected')} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                  Reject
                </motion.button>
              </div>
            </motion.article>
          ))}
        </motion.div>
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

      {viewModal}

      {viewLoading ? <LoadingSpinner label="Loading report details" /> : null}

      <ConfirmModal
        open={Boolean(statusTarget)}
        title="Update report status"
        message={`Change report status to "${nextStatus}"? This action will be visible to users.`}
        confirmText="Update status"
        confirmLoading={updating}
        onConfirm={handleStatusUpdate}
        onCancel={() => setStatusTarget(null)}
      />
    </PageTransition>
  );
};

export default ManageReportsPage;
