/**
 * EmergencyRequest Model
 * 
 * WHY 2DSPHERE GEOSPATIAL INDEX:
 * MongoDB's '2dsphere' index supports queries that calculate geometries on an Earth-like sphere.
 * In a disaster relief system, emergency matching requires calculating real-world spherical distances
 * (e.g. using $near / $geoWithin) between victims' coordinates and volunteers' service areas,
 * accounting for the curvature of the Earth with high indexing performance.
 * 
 * GEOJSON FORMAT REQUIREMENT:
 * GeoJSON specifies coordinates in [longitude, latitude] order (X axis before Y axis).
 */

const mongoose = require('mongoose');

const EmergencyRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Request must belong to a user'],
    },
    type: {
      type: String,
      required: [true, 'Request type is required'],
      enum: ['Food', 'Water', 'Medical', 'Shelter', 'Rescue'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description of the emergency need'],
      trim: true,
    },
    urgency: {
      type: String,
      required: [true, 'Urgency level is required'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    // GeoJSON Point for MongoDB 2dsphere indexing
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      // [longitude, latitude]
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (val) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 && // longitude
              val[1] >= -90 &&
              val[1] <= 90 // latitude
            );
          },
          message: 'Coordinates must be valid [longitude, latitude]',
        },
      },
    },
    photoUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'pending',
        'verified',
        'claimed',
        'in_progress',
        'resolved',
        'rejected',
      ],
      default: 'pending',
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Crucial: 2dsphere geospatial index enabling location-based matching
EmergencyRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencyRequest', EmergencyRequestSchema);
