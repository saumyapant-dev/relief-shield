/**
 * Request Feed Page (Volunteer & NGO Role)
 * 
 * WHY REST API & SOCKET.IO:
 * The initial dataset of active disaster requests is fetched via REST API (GET /api/requests/feed).
 * Real-time updates via Socket.IO listen for 'request:created' and 'request:claimed' events,
 * updating the feed dynamically when new emergencies arrive or when other responders claim tickets.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { apiFetch } from '../utils/api';

export const FeedPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');

  const { user, token } = useAuth();
  const { socket } = useSocket();

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/requests/feed', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newReq) => {
      setRequests((prev) => [newReq, ...prev.filter((r) => r._id !== newReq._id)]);
    };

    const handleClaimed = (updatedReq) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === updatedReq._id ? updatedReq : r))
      );
    };

    const handleStatusUpdated = (updatedReq) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === updatedReq._id ? updatedReq : r))
      );
    };

    socket.on('request:created', handleCreated);
    socket.on('request:claimed', handleClaimed);
    socket.on('request:status_updated', handleStatusUpdated);

    return () => {
      socket.off('request:created', handleCreated);
      socket.off('request:claimed', handleClaimed);
      socket.off('request:status_updated', handleStatusUpdated);
    };
  }, [socket]);

  const handleClaim = async (requestId) => {
    try {
      setActionMsg('');
      setError('');

      const data = await apiFetch(`/requests/${requestId}/claim`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setActionMsg(`Success: You claimed emergency request ${data.request.requestId}!`);
      // Update local state immediately
      setRequests((prev) =>
        prev.map((r) => (r._id === data.request._id ? data.request : r))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filterType !== 'All' && req.type !== filterType) return false;
    if (filterUrgency !== 'All' && req.urgency !== filterUrgency) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2>📡 Emergency Request Feed</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Live emergency requests requiring rescue, medical, food, and shelter deployment.
          </p>
        </div>
        <button onClick={fetchFeed} className="btn btn-secondary btn-sm">
          🔄 Refresh Feed
        </button>
      </div>

      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '6px' }}>Filter Type:</label>
            <select
              className="form-control"
              style={{ display: 'inline-block', width: 'auto', padding: '4px 8px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Medical">Medical</option>
              <option value="Rescue">Rescue</option>
              <option value="Food">Food</option>
              <option value="Water">Water</option>
              <option value="Shelter">Shelter</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '6px' }}>Filter Urgency:</label>
            <select
              className="form-control"
              style={{ display: 'inline-block', width: 'auto', padding: '4px 8px' }}
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
            >
              <option value="All">All Urgencies</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredRequests.length}</strong> active emergencies
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p>Loading emergency requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>No emergency requests found matching current filters.</p>
        </div>
      ) : (
        <div className="request-list">
          {filteredRequests.map((req) => {
            const isClaimedByMe =
              req.assignedVolunteer &&
              (req.assignedVolunteer._id === user._id || req.assignedVolunteer === user._id);

            const isPending = req.status === 'pending' || req.status === 'verified';

            return (
              <div key={req._id} className="card">
                <div className="card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="card-title">{req.type} Emergency</span>
                      <UrgencyBadge urgency={req.urgency} />
                      <StatusBadge status={req.status} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ID: {req.requestId} • Posted: {new Date(req.timestamp || req.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    {isPending && (user.role === 'volunteer' || user.role === 'ngo') && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleClaim(req._id)}
                      >
                        ✋ Claim Request
                      </button>
                    )}

                    {isClaimedByMe && (
                      <Link to="/my-requests" className="btn btn-success btn-sm">
                        ✅ Claimed by You (Manage)
                      </Link>
                    )}

                    {!isPending && !isClaimedByMe && req.assignedVolunteer && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Claimed by: {req.assignedVolunteer.name || 'Responder'}
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ margin: '8px 0', fontSize: '0.95rem' }}>{req.description}</p>

                {req.photoUrl && (
                  <div>
                    <img
                      src={req.photoUrl}
                      alt="Incident documentation"
                      className="photo-preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="request-meta">
                  <span>
                    📍 <strong>Coordinates:</strong>{' '}
                    {req.location?.coordinates
                      ? `${req.location.coordinates[1].toFixed(4)}°N, ${req.location.coordinates[0].toFixed(4)}°W`
                      : 'N/A'}
                  </span>
                  <span>
                    👤 <strong>Victim:</strong> {req.userId?.name || 'Anonymous Victim'} (
                    {req.userId?.email || 'Contact through team'})
                  </span>
                  <Link to={`/requests/${req._id}`} style={{ marginLeft: 'auto' }}>
                    View Full Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
