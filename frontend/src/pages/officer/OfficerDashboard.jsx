import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { getByType, getDetailed, getTrends } from '../../api/analyticsApi';
import CrimeTypeChart from '../../components/analytics/CrimeTypeChart';
import HeatmapChart from '../../components/analytics/HeatmapChart';
import SeverityChart from '../../components/analytics/SeverityChart';
import StatCard from '../../components/analytics/StatCard';
import TrendChart from '../../components/analytics/TrendChart';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTransition from '../../components/common/PageTransition';
import StatusBadge from '../../components/crime/StatusBadge';
import { formatCrimeType, formatRelativeTime } from '../../utils/formatters';

const OfficerDashboard = () => {
  const [period, setPeriod] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [detailed, setDetailed] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [typeData, setTypeData] = useState([]);

  useEffect(() => {
    document.title = 'Officer Dashboard | CrimeWatch';
  }, []);

  useEffect(() => {
    const loadOfficerAnalytics = async () => {
      setIsLoading(true);
      try {
        const [detailedResponse, trendsResponse, byTypeResponse] = await Promise.all([
          getDetailed({ period }),
          getTrends({ period, groupBy: period > 60 ? 'week' : 'day' }),
          getByType({ period }),
        ]);

        setDetailed(detailedResponse?.data || null);

        const mappedTrends = Array.isArray(trendsResponse?.data?.trends)
          ? trendsResponse.data.trends.map((item) => ({
              label: item.date,
              count: item.total,
            }))
          : [];
        setTrendData(mappedTrends);
        setTypeData(Array.isArray(byTypeResponse?.data?.byType) ? byTypeResponse.data.byType : []);
      } finally {
        setIsLoading(false);
      }
    };

    loadOfficerAnalytics().catch(() => {});
  }, [period]);

  const statusMap = useMemo(() => {
    const entries = Array.isArray(detailed?.reportsByStatus) ? detailed.reportsByStatus : [];
    return entries.reduce((accumulator, item) => {
      if (item?.status) {
        accumulator[item.status] = Number(item.count || 0);
      }
      return accumulator;
    }, {});
  }, [detailed?.reportsByStatus]);

  const overview = detailed?.overview || {};
  const severityData = Array.isArray(detailed?.reportsBySeverity) ? detailed.reportsBySeverity : [];
  const recentActivity = Array.isArray(detailed?.recentActivity) ? detailed.recentActivity : [];
  const resolutionTime = detailed?.resolutionTime || null;
  const peakHourData = useMemo(() => {
    const source = Array.isArray(detailed?.peakHours) ? detailed.peakHours : [];
    const byHour = source.reduce((accumulator, entry) => {
      const hour = Number(entry?.hour);
      if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
        accumulator[hour] = Number(entry?.count || 0);
      }
      return accumulator;
    }, {});

    return Array.from({ length: 24 }, (_, hour) => ({
      area: `${String(hour).padStart(2, '0')}:00`,
      count: byHour[hour] || 0,
    }));
  }, [detailed?.peakHours]);

  return (
    <PageTransition className="space-y-6">
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <div>
          <h1 className="font-heading text-3xl font-bold text-text">Officer Command Center</h1>
          <p className="text-sm text-text-muted">Live field intelligence, workload signals, and verification trends.</p>
        </div>

        <motion.select
          className="input-field w-full sm:w-auto"
          value={period}
          onChange={(event) => setPeriod(Number(event.target.value))}
          aria-label="Select analytics period"
          whileFocus={{ scale: 1.01 }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </motion.select>
      </motion.div>

      {isLoading ? <LoadingSpinner label="Loading officer analytics" /> : null}

      {!isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Reports in scope" value={overview.newReports || 0} accent="text-danger" />
          <StatCard label="Pending" value={statusMap.pending || 0} accent="text-warning" />
          <StatCard label="Investigating" value={statusMap.investigating || 0} accent="text-primary" />
          <StatCard label="Resolved" value={statusMap.resolved || 0} accent="text-success" />
        </div>
      ) : null}

      {!isLoading ? (
        <motion.div className="grid gap-5 xl:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.04, duration: 0.24 }}>
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
            <h2 className="mb-2 font-heading text-lg font-semibold text-text">Incident Volume Trend</h2>
            <TrendChart data={trendData} />
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.04 }}>
            <h2 className="mb-2 font-heading text-lg font-semibold text-text">Crime Type Distribution</h2>
            <CrimeTypeChart data={typeData} />
          </motion.section>
        </motion.div>
      ) : null}

      {!isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Avg resolution (hours)" value={resolutionTime?.avgHours || 0} accent="text-primary" />
          <StatCard label="Fastest resolution (hours)" value={resolutionTime?.minHours || 0} accent="text-success" />
          <StatCard label="Longest resolution (hours)" value={resolutionTime?.maxHours || 0} accent="text-danger" />
        </div>
      ) : null}

      {!isLoading ? (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.24 }}>
          <h2 className="mb-2 font-heading text-lg font-semibold text-text">Peak Incident Hours</h2>
          <HeatmapChart data={peakHourData} />
        </motion.section>
      ) : null}

      {!isLoading ? (
        <motion.div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08, duration: 0.24 }}>
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
            <h2 className="mb-2 font-heading text-lg font-semibold text-text">Severity Distribution</h2>
            <SeverityChart data={severityData} />
          </motion.section>

          <motion.section
            className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.04 }}
          >
            <h2 className="font-heading text-lg font-semibold text-text">Recent Field Activity</h2>

            {recentActivity.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No recent activity" message="Incoming reports will appear here." />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {recentActivity.map((report) => (
                  <motion.article
                    key={report._id}
                    className="rounded-xl border border-border p-3"
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text">{report.title}</p>
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatCrimeType(report.crimeType)} • Severity {report.severity}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted">{formatRelativeTime(report.createdAt)}</p>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.section>
        </motion.div>
      ) : null}
    </PageTransition>
  );
};

export default OfficerDashboard;
