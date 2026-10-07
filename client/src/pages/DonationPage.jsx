/**
 * Donation Screen (Donor Role & Supporters)
 * 
 * WHY SIMULATED DONATIONS:
 * In accordance with Phase 5, allows Donors to contribute to a general disaster relief pool
 * or a specific emergency request ticket without needing external payment credentials.
 * Aggregates real-time funding statistics.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiFetch } from '../utils/api';

export const DonationPage = () => {
  const [amount, setAmount] = useState(50);
  const [targetRequestId, setTargetRequestId] = useState('');
  const [requests, setRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [totalPool, setTotalPool] = useState(0);
  const [generalPool, setGeneralPool] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const { user, token } = useAuth();
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      // 1. Fetch available requests for targeted donation
      try {
        const d = await apiFetch('/requests/feed', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(d.requests || []);
      } catch (e) {
        console.error('[Donations] Error fetching feed:', e);
      }

      // 2. Fetch all pool stats
      try {
        const d = await apiFetch('/donations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDonations(d.donations || []);
        setTotalPool(d.totalAmount || 0);
        setGeneralPool(d.generalPool || 0);
      } catch (e) {
        console.error('[Donations] Error fetching donations:', e);
      }

      // 3. Fetch user's own donations
      try {
        const d = await apiFetch('/donations/my-donations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyDonations(d.donations || []);
      } catch (e) {
        console.error('[Donations] Error fetching my donations:', e);
      }
    } catch (err) {
      console.error('[Donations] Error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Real-time update when donations arrive
  useEffect(() => {
    if (!socket) return;

    const handleDonation = (newDonation) => {
      setDonations((prev) => [newDonation, ...prev]);
      setTotalPool((prev) => prev + newDonation.amount);
      if (!newDonation.requestId) {
        setGeneralPool((prev) => prev + newDonation.amount);
      }
      if (newDonation.donorId?._id === user._id) {
        setMyDonations((prev) => [newDonation, ...prev]);
      }
    };

    socket.on('donation:created', handleDonation);

    return () => {
      socket.off('donation:created', handleDonation);
    };
  }, [socket, user]);

  const handleDonate = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');

    if (amount <= 0) {
      setError('Please specify a donation amount greater than 0');
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiFetch('/donations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          requestId: targetRequestId || null,
        }),
      });

      setSuccessMsg(`Thank you! Your simulated contribution of $${amount} was received (Ref: ${data.donation.donationId}).`);
      setTargetRequestId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2>💰 Disaster Relief Fund & Donations</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Simulate contributions to support critical field rescues, medical provisions, and emergency supplies.
        </p>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ textAlign: 'center', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>TOTAL FUNDS RAISED</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
            ${totalPool.toLocaleString()}
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <span style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>GENERAL RELIEF POOL</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e40af', marginTop: '4px' }}>
            ${generalPool.toLocaleString()}
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', background: '#faf5ff', borderColor: '#e9d5ff' }}>
          <span style={{ fontSize: '0.8rem', color: '#7e22ce', fontWeight: 600 }}>YOUR CONTRIBUTIONS</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6b21a8', marginTop: '4px' }}>
            ${myDonations.reduce((acc, d) => acc + (d.amount || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Donation Form */}
        <div className="card">
          <h3 style={{ marginBottom: '12px' }}>Make a Contribution</h3>

          <form onSubmit={handleDonate}>
            <div className="form-group">
              <label>Select Amount ($ USD)</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {[25, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`btn ${amount === preset ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ flex: 1 }}
                    onClick={() => setAmount(preset)}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                step="any"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                required
              />
            </div>

            <div className="form-group">
              <label>Target Incident / Destination</label>
              <select
                className="form-control"
                value={targetRequestId}
                onChange={(e) => setTargetRequestId(e.target.value)}
              >
                <option value="">🌐 General Disaster Relief Pool (Default)</option>
                {requests.map((r) => (
                  <option key={r._id} value={r._id}>
                    🚨 {r.type} [{r.urgency}]: {r.description.slice(0, 40)}...
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-success"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={submitting}
            >
              {submitting ? 'Processing Transaction...' : `💳 Donate $${amount || 0}`}
            </button>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
              * Simulated transaction per Phase 5 spec. No payment card required.
            </p>
          </form>
        </div>

        {/* My Donation History */}
        <div className="card">
          <h3 style={{ marginBottom: '12px' }}>Your Donation History</h3>

          {myDonations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              You haven't made any simulated contributions yet.
            </p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {myDonations.map((d) => (
                <div
                  key={d._id}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>${d.amount.toFixed(2)}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {d.requestId ? `Target: ${d.requestId.type} Emergency` : 'General Relief Pool'} •{' '}
                      {new Date(d.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="badge badge-resolved">COMPLETED</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
