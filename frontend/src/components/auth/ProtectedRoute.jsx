import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuthStore from '../../store/authStore';
import { ROLE_HOME } from '../../utils/constants';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-text">
        <p className="text-sm text-text-muted">Preparing your secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const destination = ROLE_HOME[user?.role] || '/home';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
