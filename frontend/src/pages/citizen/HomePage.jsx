import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Eye, MapPin, ThumbsUp, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

import { getReportById } from '../../api/crimeApi';
import CrimeFilters from '../../components/crime/CrimeFilters';
import CrimeDetail from '../../components/crime/CrimeDetail';
import EmptyState from '../../components/common/EmptyState';
import PageTransition from '../../components/common/PageTransition';
import SkeletonCard from '../../components/common/SkeletonCard';
import CrimeMap from '../../components/map/CrimeMap';
import useCountUp from '../../hooks/useCountUp';
import useDebounce from '../../hooks/useDebounce';
import useGeolocation from '../../hooks/useGeolocation';
import useCrimeStore from '../../store/crimeStore';
import useNotificationStore from '../../store/notificationStore';
import { getDistanceKm } from '../../utils/geoHelper';
import { clampText, formatRelativeTime } from '../../utils/formatters';

const HomePage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [upvotePendingIds, setUpvotePendingIds] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 450);

  const { latitude, longitude, getCurrentPosition } = useGeolocation();

  const reports = useCrimeStore((state) => state.reports);
  const nearbyReports = useCrimeStore((state) => state.nearbyReports);
  const filters = useCrimeStore((state) => state.filters);
  const pagination = useCrimeStore((state) => state.pagination);
  const isLoading = useCrimeStore((state) => state.isLoading);
  const fetchReports = useCrimeStore((state) => state.fetchReports);
  const fetchNearby = useCrimeStore((state) => state.fetchNearby);
  const setFilters = useCrimeStore((state) => state.setFilters);
  const upvoteReport = useCrimeStore((state) => state.upvoteReport);

  const notifications = useNotificationStore((state) => state.notifications);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  useEffect(() => {
    document.title = 'Home | CrimeWatch';
    getCurrentPosition();
  }, [getCurrentPosition]);

  useEffect(() => {
    fetchReports({
      ...filters,
      search: debouncedSearch,
      page: filters.page || 1,
      limit: filters.limit || 8,
    }).catch(() => {});
  }, [
    debouncedSearch,
    fetchReports,
    filters.crimeType,
    filters.limit,
    filters.page,
    filters.search,
    filters.severity,
    filters.status,
  ]);

  useEffect(() => {
    fetchNotifications({ page: 1, limit: 5, type: 'crime_alert' }).catch(() => {});
  }, [fetchNotifications]);

  useEffect(() => {
    if (!hasCoordinates) return;
    fetchNearby({ lat: latitude, lng: longitude, radius: 5, limit: 20, page: 1 }).catch(() => {});
  }, [fetchNearby, hasCoordinates, latitude, longitude]);

  useEffect(() => {
    if (!selectedReport) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedReport(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedReport]);

  const totalToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reports.filter((report) => new Date(report.createdAt) >= today).length;
  }, [reports]);

  const resolvedCount = useMemo(() => reports.filter((report) => report.status === 'resolved').length, [reports]);

  const reportsTodayCount = useCountUp({ end: totalToday, duration: 800 });
  const nearbyCount = useCountUp({ end: nearbyReports.length, duration: 900 });
  const resolvedCasesCount = useCountUp({ end: resolvedCount, duration: 1000 });
  const activeAlertsCount = useCountUp({ end: unreadCount, duration: 1100 });

  const handleFilterChange = (updates) => {
    setFilters(updates);
    if (typeof updates.search === 'string') {
      setSearchInput(updates.search);
    }
  };

  const handleUpvote = async (reportId) => {
    if (upvotePendingIds.includes(reportId)) return;

    setUpvotePendingIds((current) => [...current, reportId]);
    try {
      await upvoteReport(reportId);
    } finally {
      setUpvotePendingIds((current) => current.filter((id) => id !== reportId));
    }
  };

  const handleOpenReportView = async (report) => {
    setViewLoading(true);
    setSelectedReport(report);
    try {
      const response = await getReportById(report._id);
      setSelectedReport(response?.data?.report || report);
    } finally {
      setViewLoading(false);
    }
  };

  const mapCenter = hasCoordinates ? [latitude, longitude] : undefined;

  const viewModal = selectedReport && typeof document !== 'undefined'
    ? createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[1300] grid place-items-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedReport(null)}
        >
          <motion.div
            className="relative w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full border border-border bg-surface/95 p-1.5 text-text transition hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setSelectedReport(null)}
              aria-label="Close report details"
            >
              <X size={16} />
            </button>

            <div className="max-h-[88vh] overflow-y-auto rounded-2xl">
              {viewLoading ? (
                <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted shadow-soft">
                  Loading full report details...
                </div>
              ) : (
                <CrimeDetail report={selectedReport} />
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    )
    : null;

  return (
    <PageTransition className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(220,38,38,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(30,64,175,0.18),transparent_36%)]" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-danger">Community safety network</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-text sm:text-4xl">
            Stay Safe. Report Crime. Save Lives.
          </h1>
          <p className="mt-3 max-w-2xl text-text-muted">
            Real-time crime intelligence, neighborhood awareness, and faster response together.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link to="/report-crime" className="btn-danger inline-flex" aria-label="Report a crime now">
              Quick Report <ArrowUpRight size={16} className="ml-1" />
            </Link>
            <div className="rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-semibold text-text-muted">
              Live ticker: {reports.length} incidents in your current feed
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Reports today', value: reportsTodayCount, accent: 'text-primary' },
          { label: 'Reports near you (5 km)', value: nearbyCount, accent: 'text-secondary' },
          { label: 'Resolved cases', value: resolvedCasesCount, accent: 'text-success' },
          { label: 'Active alerts', value: activeAlertsCount, accent: 'text-danger' },
        ].map((item) => (
          <motion.div
            key={item.label}
            className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-sm text-text-muted">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold ${item.accent}`}>{item.value}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-text">Live Crime Feed</h2>
            <Link to="/map" className="text-sm font-medium text-primary hover:underline">
              Open full map
            </Link>
          </div>

          <CrimeFilters
            filters={{ ...filters, search: searchInput }}
            onChange={handleFilterChange}
          />

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : null}

          {!isLoading && reports.length === 0 ? <EmptyState title="No live reports" /> : null}

          {!isLoading && reports.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {reports.map((report) => {
                const distance = latitude && longitude && report.location?.coordinates
                  ? getDistanceKm(latitude, longitude, report.location.coordinates[1], report.location.coordinates[0])
                  : null;

                return (
                  <motion.article
                    key={report._id}
                    className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-text-muted">{report.crimeType}</p>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Severity {report.severity}
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-text">{report.title}</h3>
                    <p className="mt-2 text-sm text-text-muted">{clampText(report.description, 120)}</p>

                    <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                      <div className="inline-flex items-center gap-1">
                        <MapPin size={13} />
                        <span>{distance ? `${distance.toFixed(1)} km away` : 'Distance unavailable'}</span>
                      </div>
                      <span>{formatRelativeTime(report.createdAt)}</span>
                    </div>

                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-danger"
                        style={{ width: `${(Number(report.severity || 1) / 5) * 100}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary">
                        {report.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-text transition hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => handleOpenReportView(report)}
                          aria-label="View report details"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-text transition hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => handleUpvote(report._id)}
                          disabled={upvotePendingIds.includes(report._id)}
                          aria-label="Upvote report"
                        >
                          <ThumbsUp size={13} /> {upvotePendingIds.includes(report._id) ? '...' : (report.upvoteCount || 0)}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFilters({ page: Math.max(1, (pagination.page || 1) - 1) })}
              disabled={(pagination.page || 1) <= 1}
              className="btn-surface"
              aria-label="Previous page"
            >
              Previous
            </button>
            <p className="text-sm text-text-muted">
              Page {pagination.page || 1} of {pagination.totalPages || 1}
            </p>
            <button
              type="button"
              onClick={() => setFilters({ page: Math.min((pagination.totalPages || 1), (pagination.page || 1) + 1) })}
              disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
              className="btn-surface"
              aria-label="Next page"
            >
              Next
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-text">Recent Alerts</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                <AlertTriangle size={12} /> {unreadCount} unread
              </span>
            </div>

            {notifications.length === 0 ? (
              <EmptyState title="No recent alerts" message="You will see nearby incident alerts here." />
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((alert) => (
                  <div key={alert._id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-semibold text-text">{alert.title}</p>
                    <p className="mt-1 text-xs text-text-muted">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
            <h3 className="font-heading text-lg font-semibold text-text">Nearby Crime Map</h3>
            <p className="mt-1 text-xs text-text-muted">Live incidents around your current location</p>
            <div className="mt-3">
              <CrimeMap reports={nearbyReports} center={mapCenter} zoom={12} />
            </div>
          </div>
        </div>
      </section>

      {viewModal}
    </PageTransition>
  );
};

export default HomePage;
