import { AnimatePresence, motion } from 'framer-motion';
import { Edit3, Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { deleteReport, updateReport } from '../../api/crimeApi';
import { getMyReports } from '../../api/userApi';
import CrimeForm from '../../components/crime/CrimeForm';
import CrimeDetail from '../../components/crime/CrimeDetail';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTransition from '../../components/common/PageTransition';
import StatusBadge from '../../components/crime/StatusBadge';
import { formatDateTime } from '../../utils/formatters';

const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 6,
    status: '',
    crimeType: '',
    sortBy: 'createdAt',
    order: 'desc',
  });

  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await getMyReports(filters);
      setReports(response?.data?.reports || []);
      setPagination(response?.data?.pagination || { page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'My Reports | CrimeWatch';
  }, []);

  useEffect(() => {
    loadReports().catch(() => {});
  }, [filters.crimeType, filters.limit, filters.order, filters.page, filters.sortBy, filters.status]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setConfirmLoading(true);
    try {
      await deleteReport(deleteTarget._id);
      setDeleteTarget(null);
      await loadReports();
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleUpdate = async (values) => {
    if (!editingReport) return;
    await updateReport(editingReport._id, values);
    setEditingReport(null);
    await loadReports();
  };

  return (
    <PageTransition className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold text-text">My Reports</h1>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <select className="input-field w-full sm:w-auto" value={filters.status} onChange={(event) => handleFilter('status', event.target.value)}>
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select className="input-field w-full sm:w-auto" value={filters.crimeType} onChange={(event) => handleFilter('crimeType', event.target.value)}>
            <option value="">All types</option>
            <option value="theft">Theft</option>
            <option value="robbery">Robbery</option>
            <option value="assault">Assault</option>
            <option value="fraud">Fraud</option>
          </select>

          <select className="input-field w-full sm:w-auto" value={filters.sortBy} onChange={(event) => setFilters((prev) => ({ ...prev, sortBy: event.target.value }))}>
            <option value="createdAt">Sort by date</option>
            <option value="severity">Sort by severity</option>
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading your reports" /> : null}
      {!loading && reports.length === 0 ? <EmptyState title="No reports submitted yet" /> : null}

      {!loading && reports.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {reports.map((report) => (
            <motion.article
              key={report._id}
              className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-text">{report.title}</h3>
                  <p className="text-xs text-text-muted">{formatDateTime(report.createdAt)}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              <p className="mt-2 text-sm text-text-muted">{report.description}</p>

              {report.mediaUrls?.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {report.mediaUrls.slice(0, 4).map((media, index) => (
                    <img
                      key={`${report._id}-${index}`}
                      src={media.url}
                      alt="Report media"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="btn-surface inline-flex items-center gap-1"
                  aria-label="View report details"
                >
                  <Eye size={14} /> View
                </button>

                {report.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => setEditingReport(report)}
                    className="btn-surface inline-flex items-center gap-1"
                    aria-label="Edit pending report"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setDeleteTarget(report)}
                  className="btn-danger inline-flex items-center gap-1"
                  aria-label="Delete report"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          className="btn-surface w-full sm:w-auto"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={(pagination.page || 1) <= 1}
          aria-label="Previous reports page"
        >
          Previous
        </button>
        <p className="w-full text-center text-sm text-text-muted sm:w-auto sm:text-left">Page {pagination.page || 1} of {pagination.totalPages || 1}</p>
        <button
          type="button"
          className="btn-surface w-full sm:w-auto"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.min((pagination.totalPages || 1), prev.page + 1) }))}
          disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
          aria-label="Next reports page"
        >
          Next
        </button>
      </div>

      <AnimatePresence>
        {selectedReport ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              className="w-full max-w-2xl"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
            >
              <CrimeDetail report={selectedReport} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingReport ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingReport(null)}
          >
            <motion.div
              className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-5"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
            >
              <h3 className="mb-3 font-heading text-xl font-bold text-text">Edit Pending Report</h3>
              <CrimeForm
                defaultValues={{
                  crimeType: editingReport.crimeType,
                  title: editingReport.title,
                  description: editingReport.description,
                  severity: editingReport.severity,
                }}
                onSubmit={handleUpdate}
                submitText="Save changes"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete report"
        message="This action cannot be undone. Are you sure you want to delete this report?"
        confirmText="Delete report"
        confirmLoading={confirmLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageTransition>
  );
};

export default MyReportsPage;
