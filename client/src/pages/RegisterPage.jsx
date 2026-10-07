/**
 * Registration Page
 * 
 * Allows new users to sign up and choose their role in the disaster relief network.
 * Dynamically presents volunteer-specific fields (skills, serviceRadius) when Volunteer role is chosen.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('victim');
  const [skillsText, setSkillsText] = useState('First Aid, Search & Rescue');
  const [serviceRadius, setServiceRadius] = useState(15);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const skills =
        role === 'volunteer'
          ? skillsText
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const user = await register({
        name,
        email,
        password,
        role,
        skills,
        serviceRadius: role === 'volunteer' ? Number(serviceRadius) : undefined,
      });

      if (user.role === 'victim') {
        navigate('/create-request');
      } else {
        navigate('/feed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '6px' }}>Join Relief Shield</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
          Select your role to participate in emergency disaster response
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name / Organization</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe or Rapid Relief Team"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
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
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label>Your Role in the Relief Effort</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="victim">Victim (Need disaster assistance / emergency relief)</option>
              <option value="volunteer">Volunteer (Provide on-ground aid & response)</option>
              <option value="ngo">NGO / Relief Organization (Manage resources & claim relief)</option>
              <option value="donor">Donor (Support relief operations)</option>
              <option value="admin">Admin (Coordination & verification authority)</option>
            </select>
          </div>

          {role === 'volunteer' && (
            <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>Skills & Capabilities (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g. Medical, First Aid, Boat Rescue, Driving"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Service Radius (in kilometers)</label>
                <input
                  type="number"
                  className="form-control"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                  min={1}
                  max={200}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};
