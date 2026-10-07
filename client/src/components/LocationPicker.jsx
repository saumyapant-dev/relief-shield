/**
 * Location Picker Component
 * 
 * WHY GOOGLE MAPS API & GEOLOCATION:
 * In natural disasters (floods, hurricanes, earthquakes), traditional street addresses and street signs
 * are frequently obscured or destroyed. Responders need precise decimal latitude and longitude.
 * This component captures coordinates via browser GPS or user input, ready to be encoded as
 * GeoJSON Point [longitude, latitude] for MongoDB's 2dsphere geospatial index.
 */

import React, { useState } from 'react';

export const LocationPicker = ({ latitude, longitude, onChange }) => {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'placeholder_google_maps_api_key';
  const hasRealKey = mapsApiKey && !mapsApiKey.includes('placeholder');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        onChange({
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
        });
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(`Could not fetch location: ${err.message}. Please enter coordinates manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePreset = (lat, lng) => {
    onChange({ latitude: lat, longitude: lng });
  };

  return (
    <div className="card" style={{ background: '#f8fafc', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontWeight: 600 }}>Emergency Incident Location (GPS Coordinates)</label>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleGetCurrentLocation}
          disabled={geoLoading}
        >
          {geoLoading ? 'Detecting GPS...' : '📍 Use Current Location'}
        </button>
      </div>

      {geoError && <div className="alert alert-error" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>{geoError}</div>}

      <div className="form-row">
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latitude (e.g. 40.7488)</label>
          <input
            type="number"
            step="any"
            className="form-control"
            value={latitude || ''}
            onChange={(e) => onChange({ latitude: parseFloat(e.target.value) || '', longitude })}
            placeholder="Latitude"
            required
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Longitude (e.g. -73.9851)</label>
          <input
            type="number"
            step="any"
            className="form-control"
            value={longitude || ''}
            onChange={(e) => onChange({ latitude, longitude: parseFloat(e.target.value) || '' })}
            placeholder="Longitude"
            required
          />
        </div>
      </div>

      <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Quick Demo Presets:</span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginRight: '6px', padding: '2px 6px' }}
          onClick={() => handlePreset(40.7488, -73.9851)}
        >
          Zone A (Manhattan 40.7488, -73.9851)
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginRight: '6px', padding: '2px 6px' }}
          onClick={() => handlePreset(40.7128, -74.006)}
        >
          Zone B (Civic Center 40.7128, -74.0060)
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ padding: '2px 6px' }}
          onClick={() => handlePreset(40.7648, -73.9712)}
        >
          Zone C (Central 40.7648, -73.9712)
        </button>
      </div>

      {hasRealKey ? (
        <div style={{ marginTop: '12px', height: '180px', borderRadius: '4px', overflow: 'hidden' }}>
          <iframe
            title="Google Maps Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${latitude},${longitude}`}
          />
        </div>
      ) : (
        <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          * Google Maps API Key: using placeholder key. GPS coordinates will be indexed via MongoDB 2dsphere.
        </div>
      )}
    </div>
  );
};
