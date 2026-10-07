/**
 * Login Page
 * 
 * Includes one-click quick demo login buttons for each test role (Victim, Volunteer, NGO, Donor, Admin)
 * to facilitate testing of all role-specific screens and core loop capabilities.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (userRole) => {
    switch (userRole) {
      case 'victim':
        navigate('/create-request');
        break;
      case 'volunteer':
      case 'ngo':
        navigate('/feed');
        break;
      case 'donor':
        navigate('/donate');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/feed');
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogin = async (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError('');
    setSubmitting(true);
    try {
      const user = await login(roleEmail, 'password123');
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '6px' }}>Login to Relief Shield</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
          Real-time disaster relief coordination platform
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. victim@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            ⚡ One-Click Demo Logins (Password: password123):
          </p>
          <div className="quick-login-pills">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => quickLogin('victim@example.com')}
            >
              👤 Victim
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => quickLogin('volunteer@example.com')}
            >
              🤝 Volunteer
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => quickLogin('ngo@example.com')}
            >
              🏢 NGO
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => quickLogin('donor@example.com')}
            >
              💰 Donor
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => quickLogin('admin@example.com')}
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
