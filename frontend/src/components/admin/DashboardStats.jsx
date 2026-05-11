import StatCard from '../analytics/StatCard';

const DashboardStats = ({ stats }) => {
  const items = [
    { label: 'Total users', value: stats?.totalUsers || 0, accent: 'text-primary' },
    { label: 'Total reports', value: stats?.totalReports || 0, accent: 'text-secondary' },
    { label: 'Open alerts', value: stats?.openAlerts || 0, accent: 'text-danger' },
    { label: 'Resolved cases', value: stats?.resolvedReports || 0, accent: 'text-success' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
};

export default DashboardStats;
