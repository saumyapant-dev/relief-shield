/**
 * Main Application Component & Route Configuration
 * 
 * WHY REACT ROUTER:
 * Single-Page Application (SPA) declarative routing allows dynamic client-side transitions
 * between emergency creation, live feeds, interactive maps, and status monitoring without full-page refreshes.
 * Route guards wrap sensitive endpoints to ensure strict role-based access.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TeamGate } from './components/TeamGate';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { FeedPage } from './pages/FeedPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { NearbyRequestsPage } from './pages/NearbyRequestsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { RequestDetailsPage } from './pages/RequestDetailsPage';
import { DonationPage } from './pages/DonationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Relief Shield...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'victim':
      return <Navigate to="/create-request" replace />;
    case 'volunteer':
    case 'ngo':
      return <Navigate to="/feed" replace />;
    case 'donor':
      return <Navigate to="/donate" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/feed" replace />;
  }
};

export const App = () => {
  return (
    <TeamGate>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="app-container">
              <Navbar />
              <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<RootRedirect />} />

                {/* Victim Flow */}
                <Route
                  path="/create-request"
                  element={
                    <ProtectedRoute allowedRoles={['victim', 'admin']}>
                      <CreateRequestPage />
                    </ProtectedRoute>
                  }
                />

                {/* Responder Feed */}
                <Route
                  path="/feed"
                  element={
                    <ProtectedRoute allowedRoles={['volunteer', 'ngo', 'admin']}>
                      <FeedPage />
                    </ProtectedRoute>
                  }
                />

                {/* Geospatial Features */}
                <Route
                  path="/map"
                  element={
                    <ProtectedRoute>
                      <LiveMapPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/nearby"
                  element={
                    <ProtectedRoute allowedRoles={['volunteer', 'ngo', 'admin']}>
                      <NearbyRequestsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Status Tracking */}
                <Route
                  path="/my-requests"
                  element={
                    <ProtectedRoute>
                      <MyRequestsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Request Details */}
                <Route
                  path="/requests/:id"
                  element={
                    <ProtectedRoute>
                      <RequestDetailsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Donations Flow */}
                <Route
                  path="/donate"
                  element={
                    <ProtectedRoute>
                      <DonationPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  </TeamGate>
  );
};

export default App;
