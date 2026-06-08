import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { User } from '../api/mockDb';

interface ProtectedRouteProps {
  allowedRoles?: User['role'][];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();
  const user = authApi.getCurrentUser();

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
