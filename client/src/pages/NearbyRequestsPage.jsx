/**
 * Nearby Requests Screen
 * 
 * WHY 2DSPHERE GEOSPATIAL PROXIMITY MATCHING:
 * Uses MongoDB's 2dsphere index to rank emergency requests by real-world spherical distance (km)
 * from the volunteer's current GPS coordinates or base camp.
 * Volunteers can adjust their service radius dynamically to focus on immediate local cases.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { apiFetch } from '../utils/api';

export const NearbyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latitude, setLatitude] = useState(40.7488);
  const [longitude, setLongitude] = useState(-73.9851);
  const [radius, setRadius] = useState(25);
  const [filterType, setFilterType] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState('');

  const { user, token } = useAuth();

  const fetchNearby = async () => {
    try {
      setLoading(true);
      setError('');

      const url = `/requests/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}&type=${filterType}&urgency=${filterUrgency}`;
      const data = await apiFetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [latitude, longitude, radius, filterType, filterUrgency, token]);

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
        },
        (err) => {
          setError(`GPS lookup failed: ${err.message}`);
        }
      );
    }
  };

  const handleClaim = async (requestId) => {
    try {
      setActionMsg('');
      const data = await apiFetch(`/requests/${requestId}/claim`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setActionMsg(`Claimed emergency: ${data.request.requestId}!`);
      setRequests((prev) =>
        prev.map((r) => (r._id === data.request._id ? { ...r, status: 'claimed' } : r))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2>📍 Proximity-Based Incident Matching</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Powered by MongoDB 2dsphere index: incidents ranked by spherical distance from your location.
          </p>
        </div>
        <button onClick={handleUseGPS} className="btn btn-secondary btn-sm">
          📍 Use My Current GPS
        </button>
      </div>

      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Geospatial Control Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Center Latitude</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Center Longitude</label>
            <input
              type="number"
              step="any"
              className="form-control"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Radius: <strong>{radius} km</strong>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              style={{ width: '100%', marginTop: '6px' }}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Type</label>
            <select
              className="form-control"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Medical">Medical</option>
              <option value="Rescue">Rescue</option>
              <option value="Water">Water</option>
              <option value="Food">Food</option>
              <option value="Shelter">Shelter</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p>Calculating nearest emergency requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            No emergency requests found within {radius} km of selected coordinates. Try widening your radius.
          </p>
        </div>
      ) : (
        <div className="request-list">
          {requests.map((req) => {
            const isPending = req.status === 'pending' || req.status === 'verified';

            return (
              <div key={req._id} className="card">
                <div className="card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="card-title">{req.type} Emergency</span>
                      <UrgencyBadge urgency={req.urgency} />
                      <StatusBadge status={req.status} />
                      <span
                        style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                        }}
                      >
                        🚗 {req.distanceKm} km away
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ID: {req.requestId} • Coordinates: [{req.location?.coordinates?.join(', ')}]
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
                  </div>
                </div>

                <p style={{ margin: '8px 0', fontSize: '0.95rem' }}>{req.description}</p>

                <div className="request-meta">
                  <span>👤 <strong>Victim:</strong> {req.userId?.name} ({req.userId?.email})</span>
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
