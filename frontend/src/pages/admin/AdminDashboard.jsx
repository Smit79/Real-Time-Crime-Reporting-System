import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { getDashboardStats } from '../../api/adminApi';
import CrimeTypeChart from '../../components/analytics/CrimeTypeChart';
import SeverityChart from '../../components/analytics/SeverityChart';
import TrendChart from '../../components/analytics/TrendChart';
import DashboardStats from '../../components/admin/DashboardStats';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTransition from '../../components/common/PageTransition';
import { formatCrimeType } from '../../utils/formatters';

const AdminDashboard = () => {
  const [period, setPeriod] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    document.title = 'Admin Dashboard | CrimeWatch';
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const response = await getDashboardStats({ period });
        setStats(response?.data || null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats().catch(() => {});
  }, [period]);

  const statusMap = useMemo(() => {
    const source = Array.isArray(stats?.reportsByStatus) ? stats.reportsByStatus : [];
    return source.reduce((accumulator, item) => {
      if (item?._id) accumulator[item._id] = Number(item.count || 0);
      return accumulator;
    }, {});
  }, [stats?.reportsByStatus]);

  const chartTrendData = useMemo(() => {
    const source = Array.isArray(stats?.dailyTrend) ? stats.dailyTrend : [];
    return source.map((item) => ({ label: item._id, count: item.count }));
  }, [stats?.dailyTrend]);

  const typeData = useMemo(() => {
    const source = Array.isArray(stats?.reportsByType) ? stats.reportsByType : [];
    return source.map((item) => ({ crimeType: item._id, count: item.count }));
  }, [stats?.reportsByType]);

  const severityData = useMemo(() => {
    const source = Array.isArray(stats?.reportsBySeverity) ? stats.reportsBySeverity : [];
    return source.map((item) => ({ severity: item._id, count: item.count }));
  }, [stats?.reportsBySeverity]);

  const usersByRole = Array.isArray(stats?.usersByRole) ? stats.usersByRole : [];
  const overview = stats?.overview || {};

  const dashboardStats = {
    totalUsers: overview.totalUsers || 0,
    totalReports: overview.totalReports || 0,
    openAlerts: (statusMap.pending || 0) + (statusMap.verified || 0) + (statusMap.investigating || 0),
    resolvedReports: statusMap.resolved || 0,
  };

  return (
    <PageTransition className="space-y-6">
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: 'easeOut' }}
      >
        <div>
          <h1 className="font-heading text-3xl font-bold text-text">Admin Operations Dashboard</h1>
          <p className="text-sm text-text-muted">Platform scale, throughput, and risk posture in one place.</p>
        </div>

        <motion.select
          className="input-field w-full sm:w-auto"
          value={period}
          onChange={(event) => setPeriod(Number(event.target.value))}
          aria-label="Select dashboard period"
          whileFocus={{ scale: 1.01 }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </motion.select>
      </motion.div>

      {isLoading ? <LoadingSpinner label="Loading admin dashboard" /> : null}

      {!isLoading ? <DashboardStats stats={dashboardStats} /> : null}

      {!isLoading ? (
        <motion.div
          className="grid gap-5 xl:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.24 }}
        >
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
            <h2 className="mb-2 font-heading text-lg font-semibold text-text">Report Volume Trend</h2>
            <TrendChart data={chartTrendData} />
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.04 }}>
            <h2 className="mb-2 font-heading text-lg font-semibold text-text">Top Crime Types</h2>
            <CrimeTypeChart data={typeData} />
          </motion.section>
        </motion.div>
      ) : null}

      {!isLoading ? (
        <motion.div
          className="grid gap-5 xl:grid-cols-[1.2fr_1fr]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.24 }}
        >
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
            <h2 className="mb-2 font-heading text-lg font-semibold text-text">Severity Distribution</h2>
            <SeverityChart data={severityData} />
          </motion.section>

          <motion.section
            className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-soft"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.04 }}
          >
            <div>
              <h2 className="font-heading text-lg font-semibold text-text">Report Status Mix</h2>
              <div className="mt-2 space-y-2 text-sm">
                {['pending', 'verified', 'investigating', 'resolved', 'rejected'].map((status) => (
                  <motion.div
                    key={status}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    whileHover={{ x: 2 }}
                  >
                    <span className="capitalize text-text-muted">{status}</span>
                    <span className="font-semibold text-text">{statusMap[status] || 0}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-heading text-lg font-semibold text-text">Users By Role</h2>
              {usersByRole.length === 0 ? (
                <div className="mt-2">
                  <EmptyState title="No role data" message="Role distribution will appear after users are loaded." />
                </div>
              ) : (
                <div className="mt-2 space-y-2 text-sm">
                  {usersByRole.map((item) => (
                    <motion.div
                      key={item._id || 'unknown'}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      whileHover={{ x: 2 }}
                    >
                      <span className="capitalize text-text-muted">{item._id || 'unknown'}</span>
                      <span className="font-semibold text-text">{item.count || 0}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {typeData.length > 0 ? (
              <div>
                <h2 className="font-heading text-lg font-semibold text-text">Top Incident</h2>
                <p className="mt-1 text-sm text-text-muted">
                  {formatCrimeType(typeData[0].crimeType)} leads with {typeData[0].count} reports in this period.
                </p>
              </div>
            ) : null}
          </motion.section>
        </motion.div>
      ) : null}
    </PageTransition>
  );
};

export default AdminDashboard;
