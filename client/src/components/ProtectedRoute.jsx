/**
 * Protected Route Component
 * 
 * Enforces role-based route access using JWT auth state from AuthContext.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', margin: '40px auto', maxWidth: '400px' }}>
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div className="alert alert-error">
          <h3>Access Restricted</h3>
          <p>
            Your current role is <strong>{user.role.toUpperCase()}</strong>.
            This screen requires one of the following roles: {allowedRoles.join(', ')}.
          </p>
        </div>
      </div>
    );
  }

  return children;
};
