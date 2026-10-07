/**
 * Emergency Request Creation Page (Victim Role)
 * 
 * WHY REACT ROUTER:
 * Seamless client-side transition to /my-requests upon submission without a full browser reload.
 * 
 * WHY MULTIPART/FORM-DATA & CLOUDINARY:
 * Packages the text payload (type, description, urgency, lat/lng) together with the image file
 * buffer for backend processing and cloud storage streaming.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LocationPicker } from '../components/LocationPicker';
import { apiFetch } from '../utils/api';

export const CreateRequestPage = () => {
  const [type, setType] = useState('Medical');
  const [urgency, setUrgency] = useState('High');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ latitude: 40.7488, longitude: -73.9851 });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!location.latitude || !location.longitude) {
      setError('Please provide valid incident latitude and longitude coordinates.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('urgency', urgency);
      formData.append('description', description);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      await apiFetch('/requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Navigate to status tracking screen to observe the request in "Pending" status
      navigate('/my-requests');
    } catch (err) {
      setError(err.message || 'Error creating request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '20px auto' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <h2>Submit Emergency Relief Request</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
          Provide incident details and location coordinates so nearby volunteers and rescue units can locate you.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Emergency Type</label>
              <select
                className="form-control"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="Medical">🏥 Medical (Injuries, Medicine, Triage)</option>
                <option value="Water">💧 Water (Clean Drinking Water, Purification)</option>
                <option value="Food">🍲 Food (Rations, Baby formula, Non-perishables)</option>
                <option value="Rescue">🛟 Rescue (Evacuation, Stranded, Trapped)</option>
                <option value="Shelter">⛺ Shelter (Tarps, Blankets, Temporary Roof)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Urgency Level</label>
              <select
                className="form-control"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                required
              >
                <option value="Low">Low - Non-immediate need</option>
                <option value="Medium">Medium - Required within 24 hours</option>
                <option value="High">High - Needed within 4-6 hours</option>
                <option value="Critical">Critical - Life-threatening emergency</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Emergency Description & Specific Needs</label>
            <textarea
              className="form-control"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe situation, number of people affected, medical conditions, access hazards (e.g. road underwater)..."
              required
            />
          </div>

          {/* Location picker with 2dsphere coordinate input */}
          <div className="form-group">
            <LocationPicker
              latitude={location.latitude}
              longitude={location.longitude}
              onChange={setLocation}
            />
          </div>

          <div className="form-group">
            <label>Upload Incident Photo (Optional - via Cloudinary)</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handlePhotoChange}
            />
            {photoPreview && (
              <div style={{ marginTop: '8px' }}>
                <img src={photoPreview} alt="Incident preview" className="photo-preview" />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? 'Broadcasting Emergency...' : '🚨 Broadcast Emergency Request'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/my-requests')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
