/**
 * src/components/ProtectedRoute.jsx
 *
 * Route guard component. Protects pages from unauthorized access.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8' }}>
        Loading Placement Portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user's actual role
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (['tpo', 'admin'].includes(user.role)) return <Navigate to="/tpo" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
