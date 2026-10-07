/**
 * Admin Dashboard Screen
 * 
 * Central oversight hub for Relief Shield operations:
 * - Real-time relief KPI cards
 * - Pending Verification Queue (Admin marks requests Verified or Rejected)
 * - Comprehensive requests table with quick filters
 * - Registered volunteers and users management
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { apiFetch } from '../utils/api';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState('');

  const { token } = useAuth();
  const { socket } = useSocket();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsData, queueData, reqsData, usersData] = await Promise.all([
        apiFetch('/admin/stats', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        apiFetch('/admin/queue', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        apiFetch('/requests/feed?status=', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        apiFetch('/admin/users', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      if (statsData) setStats(statsData.stats);
      if (queueData) setQueue(queueData.queue || []);
      if (reqsData) setAllRequests(reqsData.requests || []);
      if (usersData) setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newReq) => {
      setQueue((prev) => [newReq, ...prev]);
      setAllRequests((prev) => [newReq, ...prev]);
      setStats((prev) => prev ? { ...prev, totalRequests: prev.totalRequests + 1, pendingRequests: prev.pendingRequests + 1 } : prev);
    };

    const handleUpdated = (updatedReq) => {
      setQueue((prev) => prev.filter((r) => r._id !== updatedReq._id));
      setAllRequests((prev) => prev.map((r) => (r._id === updatedReq._id ? updatedReq : r)));
    };

    socket.on('request:created', handleCreated);
    socket.on('request:verified', handleUpdated);
    socket.on('request:rejected', handleUpdated);
    socket.on('request:claimed', handleUpdated);
    socket.on('request:status_updated', handleUpdated);

    return () => {
      socket.off('request:created', handleCreated);
      socket.off('request:verified', handleUpdated);
      socket.off('request:rejected', handleUpdated);
      socket.off('request:claimed', handleUpdated);
      socket.off('request:status_updated', handleUpdated);
    };
  }, [socket]);

  const handleVerify = async (requestId) => {
    try {
      setActionMsg('');
      const data = await apiFetch(`/requests/${requestId}/verify`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setActionMsg(`Emergency request ${data.request.requestId} verified! Now broadcast to responders.`);
      setQueue((prev) => prev.filter((r) => r._id !== requestId));
      setAllRequests((prev) => prev.map((r) => (r._id === requestId ? data.request : r)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionMsg('');
      const data = await apiFetch(`/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setActionMsg(`Emergency request ${data.request.requestId} marked as rejected.`);
      setQueue((prev) => prev.filter((r) => r._id !== requestId));
      setAllRequests((prev) => prev.map((r) => (r._id === requestId ? data.request : r)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2>🛡️ Incident Command & Admin Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Verify pending distress calls, monitor active rescue operations, and coordinate responders.
          </p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
          🔄 Refresh Data
        </button>
      </div>

      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* KPI Summary Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL REQUESTS</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalRequests}</div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: '#fde047', background: '#fefce8' }}>
            <span style={{ fontSize: '0.75rem', color: '#854d0e' }}>PENDING REVIEW</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ca8a04' }}>{queue.length}</div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: '#bfdbfe', background: '#eff6ff' }}>
            <span style={{ fontSize: '0.75rem', color: '#1e40af' }}>CLAIMED / ACTIVE</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>{stats.claimedRequests + stats.inProgressRequests}</div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
            <span style={{ fontSize: '0.75rem', color: '#166534' }}>RESOLVED</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{stats.resolvedRequests}</div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VOLUNTEERS</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.volunteersCount}</div>
          </div>
          <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FUNDS RAISED</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>${stats.totalDonations}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('queue')}
        >
          ⏳ Verification Queue ({queue.length})
        </button>
        <button
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('requests')}
        >
          📋 All Requests ({allRequests.length})
        </button>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Directory ({users.length})
        </button>
      </div>

      {/* Tab 1: Verification Queue */}
      {activeTab === 'queue' && (
        <div>
          {queue.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                🎉 Verification Queue is clear! All emergency requests have been reviewed.
              </p>
            </div>
          ) : (
            <div className="request-list">
              {queue.map((req) => (
                <div key={req._id} className="card">
                  <div className="card-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="card-title">{req.type} Emergency</span>
                        <UrgencyBadge urgency={req.urgency} />
                        <StatusBadge status={req.status} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Ref: {req.requestId} • Submitted: {new Date(req.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleVerify(req._id)}
                      >
                        ✅ Verify Request
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc2626' }}
                        onClick={() => handleReject(req._id)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: '8px 0' }}>{req.description}</p>

                  <div className="request-meta">
                    <span>📍 Coordinates: [{req.location?.coordinates?.join(', ')}]</span>
                    <span>👤 Victim: {req.userId?.name} ({req.userId?.email})</span>
                    <Link to={`/requests/${req._id}`} style={{ marginLeft: 'auto' }}>Inspect &rarr;</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Requests */}
      {activeTab === 'requests' && (
        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>ID / Type</th>
                <th style={{ padding: '10px 14px' }}>Urgency</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Reported By</th>
                <th style={{ padding: '10px 14px' }}>Assigned To</th>
                <th style={{ padding: '10px 14px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {allRequests.map((r) => (
                <tr key={r._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{r.type}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.requestId}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}><UrgencyBadge urgency={r.urgency} /></td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '10px 14px' }}>{r.userId?.name || 'Victim'}</td>
                  <td style={{ padding: '10px 14px' }}>{r.assignedVolunteer?.name || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <Link to={`/requests/${r._id}`} className="btn btn-secondary btn-sm">Inspect</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Users Directory */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Name</th>
                <th style={{ padding: '10px 14px' }}>Email</th>
                <th style={{ padding: '10px 14px' }}>Role</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Skills / Radius</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '10px 14px' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`role-pill role-${u.role}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="badge badge-resolved">{u.verificationStatus || 'verified'}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {u.role === 'volunteer'
                      ? `${u.skills?.join(', ') || 'General'} (${u.serviceRadius || 10} km)`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
