/**
 * Navigation Bar Component
 * 
 * Adapts navigation links dynamically according to the authenticated user's role:
 * - Victims see 'New Request' and 'My Requests'
 * - Volunteers & NGOs see 'Request Feed', 'Live Map', 'Nearby', and 'Claimed Requests'
 * - Donors see 'Relief Fund / Donate'
 * - Admins see 'Admin Command', 'Feed', and 'Live Map'
 */

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <span>🛡️</span>
        <span>Relief Shield</span>
      </Link>

      <ul className="nav-links">
        {isAuthenticated ? (
          <>
            {user.role === 'victim' && (
              <>
                <li>
                  <NavLink to="/create-request">🚨 New Emergency</NavLink>
                </li>
                <li>
                  <NavLink to="/my-requests">📋 My Requests</NavLink>
                </li>
                <li>
                  <NavLink to="/donate">💰 Donate</NavLink>
                </li>
              </>
            )}

            {(user.role === 'volunteer' || user.role === 'ngo') && (
              <>
                <li>
                  <NavLink to="/feed">📡 Feed</NavLink>
                </li>
                <li>
                  <NavLink to="/map">🗺️ Live Map</NavLink>
                </li>
                <li>
                  <NavLink to="/nearby">📍 Nearby</NavLink>
                </li>
                <li>
                  <NavLink to="/my-requests">🤝 My Claimed</NavLink>
                </li>
              </>
            )}

            {user.role === 'donor' && (
              <>
                <li>
                  <NavLink to="/donate">💰 Relief Fund & Donate</NavLink>
                </li>
                <li>
                  <NavLink to="/map">🗺️ Live Incident Map</NavLink>
                </li>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <li>
                  <NavLink to="/admin">🛡️ Admin Dashboard</NavLink>
                </li>
                <li>
                  <NavLink to="/feed">📡 Feed</NavLink>
                </li>
                <li>
                  <NavLink to="/map">🗺️ Map</NavLink>
                </li>
                <li>
                  <NavLink to="/donate">💰 Funds</NavLink>
                </li>
              </>
            )}

            <li>
              <div className="user-badge">
                <span>{user.name}</span>
                <span className={`role-pill role-${user.role}`}>{user.role}</span>
              </div>
            </li>

            <li>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login">Login</NavLink>
            </li>
            <li>
              <NavLink to="/register">Register</NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};
