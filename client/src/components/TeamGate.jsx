/**
 * Restricted Team Access Gate
 * 
 * Provides an immediate security barrier on deployment:
 * Anyone opening the URL must enter the shared team passcode before
 * the application, login screen, or any emergency relief data loads.
 * 
 * Configurable via VITE_TEAM_PASSWORD environment variable or defaults
 * to the shared password: 'relief-team-2026'.
 */

import React, { useState } from 'react';

const TEAM_PASSWORD = import.meta.env.VITE_TEAM_PASSWORD || 'relief-team-2026';
const STORAGE_KEY = 'relief_shield_team_unlocked';

export const TeamGate = ({ children }) => {
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [inputPass, setInputPass] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    if (inputPass.trim() === TEAM_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setError('');
    } else {
      setError('Incorrect team password. Please enter the shared access password.');
    }
  };

  const handleLockAgain = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#f8fafc',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 8px 0' }}>
              Relief Shield
            </h1>
            <div
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Restricted Team Access
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
              This deployment is protected. Please enter your shared team password to unlock the platform.
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: '#cbd5e1',
                  marginBottom: '8px',
                }}
              >
                Team Access Password
              </label>
              <input
                type="password"
                value={inputPass}
                onChange={(e) => setInputPass(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
            >
              Unlock Access 🔓
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #334155',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            Shared Team Password: <code style={{ color: '#94a3b8' }}>relief-team-2026</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
};
