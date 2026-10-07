/**
 * Request Details Page
 * 
 * Displays deep inspection of an emergency ticket: exact coordinates, photos,
 * contact info, responder status, and action buttons.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { apiFetch } from '../utils/api';

export const RequestDetailsPage = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const { user, token } = useAuth();
  const navigate = useNavigate();
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'placeholder_google_maps_api_key';
  const hasRealKey = mapsApiKey && !mapsApiKey.includes('placeholder');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRequest(data.request);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, token]);

  const handleClaim = async () => {
    try {
      const data = await apiFetch(`/requests/${id}/claim`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setActionMsg('You have successfully claimed this emergency!');
      setRequest(data.request);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (nextStatus) => {
    try {
      const data = await apiFetch(`/requests/${id}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      setActionMsg(`Status changed to ${nextStatus.toUpperCase()}`);
      setRequest(data.request);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading emergency incident details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="card">
        <div className="alert alert-error">{error || 'Request not found'}</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          &larr; Go Back
        </button>
      </div>
    );
  }

  const [lng, lat] = request.location?.coordinates || [0, 0];
  const isClaimedByMe =
    request.assignedVolunteer &&
    (request.assignedVolunteer._id === user._id || request.assignedVolunteer === user._id);
  const isPending = request.status === 'pending' || request.status === 'verified';

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '14px' }}>
        &larr; Back to List
      </button>

      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}

      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2>{request.type} Emergency Details</h2>
              <UrgencyBadge urgency={request.urgency} />
              <StatusBadge status={request.status} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Reference ID: <strong>{request.requestId}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {isPending && (user.role === 'volunteer' || user.role === 'ngo') && (
              <button onClick={handleClaim} className="btn btn-primary">
                ✋ Claim This Incident
              </button>
            )}

            {isClaimedByMe && request.status === 'claimed' && (
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                className="btn btn-secondary"
              >
                🚚 Mark In Progress
              </button>
            )}

            {isClaimedByMe && (request.status === 'claimed' || request.status === 'in_progress') && (
              <button
                onClick={() => handleUpdateStatus('resolved')}
                className="btn btn-success"
              >
                ✅ Mark Resolved
              </button>
            )}
          </div>
        </div>

        <div style={{ margin: '16px 0' }}>
          <h4>Incident Description:</h4>
          <p style={{ marginTop: '6px', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
            {request.description}
          </p>
        </div>

        {request.photoUrl && (
          <div style={{ margin: '16px 0' }}>
            <h4>Incident Photo:</h4>
            <img
              src={request.photoUrl}
              alt="Disaster report"
              className="photo-preview"
              style={{ maxHeight: '350px' }}
            />
          </div>
        )}

        <div style={{ margin: '20px 0', padding: '16px', background: '#f8fafc', borderRadius: '6px' }}>
          <h4>Geospatial Coordinates:</h4>
          <p style={{ margin: '6px 0' }}>
            <strong>Latitude:</strong> {lat} | <strong>Longitude:</strong> {lng}
          </p>

          {hasRealKey ? (
            <div style={{ marginTop: '12px', height: '240px', borderRadius: '4px', overflow: 'hidden' }}>
              <iframe
                title="Google Maps Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${lat},${lng}`}
              />
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
              Google Maps Key: configured as placeholder. Coordinates are indexed natively in MongoDB 2dsphere.
            </p>
          )}
        </div>

        <div className="request-meta" style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <div>
            <strong>Reported By:</strong> {request.userId?.name} ({request.userId?.email})
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <strong>Assigned Responder:</strong>{' '}
            {request.assignedVolunteer ? (
              <span style={{ color: 'var(--success)' }}>
                {request.assignedVolunteer.name} ({request.assignedVolunteer.email})
              </span>
            ) : (
              <span style={{ color: 'var(--warning)' }}>Unclaimed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
