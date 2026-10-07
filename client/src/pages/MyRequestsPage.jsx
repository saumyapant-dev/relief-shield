/**
 * Status Tracking / My Requests Page
 * 
 * WHY THIS PAGE IS CRUCIAL FOR PHASE 2:
 * Closes the Core Loop MVP:
 * - Victims see their submitted requests and observe live status updates (Pending -> Claimed -> In Progress -> Resolved).
 * - Volunteers see requests they have claimed and can update their status as relief is delivered.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { apiFetch } from '../utils/api';

export const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  const { user, token } = useAuth();
  const { socket } = useSocket();

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/requests/my-requests', {
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
    fetchMyRequests();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

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

    socket.on('request:claimed', handleClaimed);
    socket.on('request:status_updated', handleStatusUpdated);

    return () => {
      socket.off('request:claimed', handleClaimed);
      socket.off('request:status_updated', handleStatusUpdated);
    };
  }, [socket]);

  const handleUpdateStatus = async (requestId, nextStatus) => {
    try {
      setUpdateMsg('');
      setError('');

      const data = await apiFetch(`/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      setUpdateMsg(`Request status transitioned to: ${nextStatus.toUpperCase()}`);
      setRequests((prev) =>
        prev.map((r) => (r._id === data.request._id ? data.request : r))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const isVictim = user.role === 'victim';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2>
            {isVictim ? '📋 My Emergency Requests & Status' : '🤝 Requests You Have Claimed'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isVictim
              ? 'Track the real-time fulfillment status of your disaster relief requests.'
              : 'Manage and update the progress of emergency cases assigned to you.'}
          </p>
        </div>

        {isVictim && (
          <Link to="/create-request" className="btn btn-primary btn-sm">
            🚨 Post Another Emergency
          </Link>
        )}
      </div>

      {updateMsg && <div className="alert alert-success">{updateMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p>Loading your requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {isVictim
              ? 'You have not submitted any emergency requests yet.'
              : 'You have not claimed any emergency requests yet.'}
          </p>
          {isVictim ? (
            <Link to="/create-request" className="btn btn-primary">
              Create Emergency Request
            </Link>
          ) : (
            <Link to="/feed" className="btn btn-primary">
              Browse Request Feed & Claim
            </Link>
          )}
        </div>
      ) : (
        <div className="request-list">
          {requests.map((req) => (
            <div key={req._id} className="card">
              <div className="card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="card-title">{req.type} Emergency</span>
                    <UrgencyBadge urgency={req.urgency} />
                    <StatusBadge status={req.status} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ID: {req.requestId} • Created: {new Date(req.timestamp || req.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Status Advancement Controls (for Volunteers/Responders) */}
                {!isVictim && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {req.status === 'claimed' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUpdateStatus(req._id, 'in_progress')}
                      >
                        🚚 Mark In Progress
                      </button>
                    )}

                    {(req.status === 'claimed' || req.status === 'in_progress') && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleUpdateStatus(req._id, 'resolved')}
                      >
                        ✅ Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p style={{ margin: '8px 0', fontSize: '0.95rem' }}>{req.description}</p>

              {req.photoUrl && (
                <div>
                  <img
                    src={req.photoUrl}
                    alt="Emergency attachment"
                    className="photo-preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="request-meta">
                <span>
                  📍 <strong>Location:</strong>{' '}
                  {req.location?.coordinates
                    ? `${req.location.coordinates[1].toFixed(4)}°N, ${req.location.coordinates[0].toFixed(4)}°W`
                    : 'N/A'}
                </span>

                {isVictim ? (
                  <span>
                    🤝 <strong>Assigned Responder:</strong>{' '}
                    {req.assignedVolunteer ? (
                      <strong style={{ color: 'var(--success)' }}>
                        {req.assignedVolunteer.name} ({req.assignedVolunteer.email})
                      </strong>
                    ) : (
                      <em style={{ color: 'var(--warning)' }}>Awaiting volunteer/NGO claim...</em>
                    )}
                  </span>
                ) : (
                  <span>
                    👤 <strong>Victim:</strong> {req.userId?.name} ({req.userId?.email})
                  </span>
                )}

                <Link to={`/requests/${req._id}`} style={{ marginLeft: 'auto' }}>
                  View Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
