import { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute';
import Footer from './components/common/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import MobileBottomNav from './components/common/MobileBottomNav';
import useSocket from './hooks/useSocket';
import useAuthStore from './store/authStore';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

const HomePage = lazy(() => import('./pages/citizen/HomePage'));
const MapPage = lazy(() => import('./pages/citizen/MapPage'));
const ReportCrimePage = lazy(() => import('./pages/citizen/ReportCrimePage'));
const MyReportsPage = lazy(() => import('./pages/citizen/MyReportsPage'));
const AlertsPage = lazy(() => import('./pages/citizen/AlertsPage'));
const ProfilePage = lazy(() => import('./pages/citizen/ProfilePage'));

const OfficerDashboard = lazy(() => import('./pages/officer/OfficerDashboard'));
const ManageReportsPage = lazy(() => import('./pages/officer/ManageReportsPage'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsersPage = lazy(() => import('./pages/admin/ManageUsersPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const AppLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { isConnected } = useSocket();

  return (
    <motion.div
      className="min-h-screen bg-background text-text"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} isRealtimeConnected={isConnected} />
      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar open mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        <motion.main
          className="w-full flex-1 px-4 py-6 pb-28 sm:px-6 lg:pb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Suspense
            fallback={
              <div className="grid h-full min-h-[50vh] place-items-center">
                <LoadingSpinner label="Loading page..." />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </motion.main>
      </div>
      <Footer />
      <MobileBottomNav />
    </motion.div>
  );
};

function App() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const hydrateUser = useAuthStore((state) => state.hydrateUser);

  useEffect(() => {
    const initialize = async () => {
      if (!accessToken) {
        await refreshToken();
      }
      await hydrateUser();
    };

    initialize().catch(() => {});
  }, [accessToken, hydrateUser, refreshToken]);

  return (
    <Suspense
      fallback={(
        <div className="grid min-h-screen place-items-center">
          <LoadingSpinner label="Loading page" />
        </div>
      )}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute allowedRoles={['citizen', 'officer', 'admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/report-crime" element={<ReportCrimePage />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['officer', 'admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/officer/reports" element={<ManageReportsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsersPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
