import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * ProtectedRoute
 * Redirects unauthenticated users to /login.
 * Redirects wrong-role users to /unauthorized.
 * Shows spinner while auth state is loading.
 */
export default function ProtectedRoute({ children, roles, fallback = '/login' }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-page">
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
