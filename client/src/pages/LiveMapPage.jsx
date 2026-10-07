/**
 * Live Map Screen
 * 
 * Plots active disaster emergency requests as pins color-coded by urgency:
 * - Critical: Red (pulse)
 * - High: Orange
 * - Medium: Yellow
 * - Low: Gray
 * 
 * WHY REAL-TIME SOCKET.IO:
 * Responders in incident command centers monitor this map continuously;
 * Socket.IO dynamically drops new pins the moment victims submit emergencies.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { apiFetch } from '../utils/api';

export const LiveMapPage = () => {
  const [requests, setRequests] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterUrgency, setFilterUrgency] = useState('All');

  const { user, token } = useAuth();
  const { socket } = useSocket();
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'placeholder_google_maps_api_key';
  const hasRealKey = mapsApiKey && !mapsApiKey.includes('placeholder');

  const fetchActiveRequests = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/requests/feed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(data.requests || []);
      if (data.requests?.length > 0) {
        setSelectedReq(data.requests[0]);
      }
    } catch (err) {
      console.error('[LiveMap] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRequests();
  }, [token]);

  // Real-time pin updates via centralized Socket
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newReq) => {
      setRequests((prev) => [newReq, ...prev.filter((r) => r._id !== newReq._id)]);
    };

    const handleClaimed = (updatedReq) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === updatedReq._id ? updatedReq : r))
      );
      if (selectedReq?._id === updatedReq._id) {
        setSelectedReq(updatedReq);
      }
    };

    const handleStatus = (updatedReq) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === updatedReq._id ? updatedReq : r))
      );
      if (selectedReq?._id === updatedReq._id) {
        setSelectedReq(updatedReq);
      }
    };

    socket.on('request:created', handleCreated);
    socket.on('request:claimed', handleClaimed);
    socket.on('request:status_updated', handleStatus);

    return () => {
      socket.off('request:created', handleCreated);
      socket.off('request:claimed', handleClaimed);
      socket.off('request:status_updated', handleStatus);
    };
  }, [socket, selectedReq]);

  const handleClaim = async (requestId) => {
    try {
      const data = await apiFetch(`/requests/${requestId}/claim`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setRequests((prev) =>
        prev.map((r) => (r._id === data.request._id ? data.request : r))
      );
      setSelectedReq(data.request);
    } catch (err) {
      console.error('[LiveMap] Claim error:', err);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterUrgency !== 'All' && r.urgency !== filterUrgency) return false;
    return true;
  });

  const getPinColor = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return '#dc2626';
      case 'High':
        return '#ea580c';
      case 'Medium':
        return '#ca8a04';
      default:
        return '#64748b';
    }
  };

  // Center coordinates calculation for radar preview
  const centerLat = selectedReq?.location?.coordinates?.[1] || 40.75;
  const centerLng = selectedReq?.location?.coordinates?.[0] || -73.98;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2>🗺️ Live Disaster Incident Map</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Active emergencies plotted with GPS coordinates and color-coded urgency pins.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.85rem' }}
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
          >
            <option value="All">All Urgency Levels</option>
            <option value="Critical">🔴 Critical Only</option>
            <option value="High">🟠 High Only</option>
            <option value="Medium">🟡 Medium Only</option>
            <option value="Low">⚪ Low Only</option>
          </select>
          <button onClick={fetchActiveRequests} className="btn btn-secondary btn-sm">
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>Loading map coordinates...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
          {/* Main Map View */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {hasRealKey ? (
              <iframe
                title="Google Maps Overview"
                width="100%"
                height="460"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${centerLat},${centerLng}&zoom=12`}
              />
            ) : (
              /* High-fidelity interactive radar canvas plotting pins across real latitude/longitude */
              <div
                style={{
                  height: '460px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  position: 'relative',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>📡 Real-time GPS Spatial Plotter (2dsphere coordinates)</span>
                  <span>Center: {centerLat.toFixed(3)}°N, {centerLng.toFixed(3)}°W</span>
                </div>

                {/* Plotted Incident Pins */}
                <div style={{ position: 'relative', height: '360px', width: '100%', border: '1px dashed #334155', borderRadius: '8px' }}>
                  {filteredRequests.map((req, idx) => {
                    const [lng, lat] = req.location?.coordinates || [0, 0];
                    // Normalize relative to center for visual scatter
                    const offsetX = Math.max(8, Math.min(90, 50 + (lng - centerLng) * 350));
                    const offsetY = Math.max(8, Math.min(90, 50 - (lat - centerLat) * 350));
                    const isSelected = selectedReq?._id === req._id;
                    const pinColor = getPinColor(req.urgency);

                    return (
                      <div
                        key={req._id}
                        onClick={() => setSelectedReq(req)}
                        title={`${req.type} (${req.urgency}): ${req.description}`}
                        style={{
                          position: 'absolute',
                          left: `${offsetX}%`,
                          top: `${offsetY}%`,
                          transform: 'translate(-50%, -50%)',
                          cursor: 'pointer',
                          zIndex: isSelected ? 10 : 2,
                        }}
                      >
                        <div
                          style={{
                            background: pinColor,
                            color: '#fff',
                            padding: isSelected ? '4px 8px' : '2px 6px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: isSelected
                              ? `0 0 14px ${pinColor}`
                              : '0 2px 4px rgba(0,0,0,0.4)',
                            border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.4)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{req.urgency === 'Critical' ? '🚨' : '📍'}</span>
                          <span>{req.type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span><strong style={{ color: '#dc2626' }}>●</strong> Critical</span>
                  <span><strong style={{ color: '#ea580c' }}>●</strong> High</span>
                  <span><strong style={{ color: '#ca8a04' }}>●</strong> Medium</span>
                  <span><strong style={{ color: '#64748b' }}>●</strong> Low</span>
                  <span style={{ marginLeft: 'auto' }}>Click pins to inspect incident card</span>
                </div>
              </div>
            )}
          </div>

          {/* Incident Pin Card */}
          <div>
            {selectedReq ? (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>{selectedReq.type} Incident</h3>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <UrgencyBadge urgency={selectedReq.urgency} />
                      <StatusBadge status={selectedReq.status} />
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Ref: {selectedReq.requestId}
                </p>

                <p style={{ fontSize: '0.9rem', marginBottom: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedReq.description}
                </p>

                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '12px' }}>
                  <div>📍 <strong>Lat/Lng:</strong> {selectedReq.location?.coordinates?.[1]?.toFixed(4)}°N, {selectedReq.location?.coordinates?.[0]?.toFixed(4)}°W</div>
                  <div style={{ marginTop: '4px' }}>👤 <strong>Reported by:</strong> {selectedReq.userId?.name || 'Victim'}</div>
                  {selectedReq.assignedVolunteer && (
                    <div style={{ marginTop: '4px', color: 'var(--success)' }}>
                      🤝 <strong>Claimed by:</strong> {selectedReq.assignedVolunteer?.name}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  {(selectedReq.status === 'pending' || selectedReq.status === 'verified') &&
                    (user.role === 'volunteer' || user.role === 'ngo') && (
                      <button
                        onClick={() => handleClaim(selectedReq._id)}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                      >
                        ✋ Claim Incident
                      </button>
                    )}

                  <Link to={`/requests/${selectedReq._id}`} className="btn btn-secondary btn-sm" style={{ textAlign: 'center' }}>
                    Open Full Details &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Select an incident on the map</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
