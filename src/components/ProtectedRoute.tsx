import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/firestore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const { user, userDocument, loading } = useAuth();
  const location = useLocation();

  // Show nothing while loading auth state
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          color: '#ffffff',
        }}
      >
        Loading...
      </div>
    );
  }

  // Redirect to login if auth is required but user is not logged in
  if (requireAuth && !user) {
    // Save the intended URL (with query params) so we can return after login
    const fullPath = location.pathname + location.search;
    if (fullPath !== '/') {
      sessionStorage.setItem('authReturnUrl', fullPath);
    }
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0 && userDocument) {
    if (!allowedRoles.includes(userDocument.role)) {
      // Redirect based on role
      if (userDocument.role === 'teacher') {
        return <Navigate to="/teacher" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
