/**
 * Emergency Request Controller
 * 
 * WHY 2DSPHERE & GEOJSON:
 * Location coordinates are stored as GeoJSON Point [longitude, latitude] to leverage
 * MongoDB's 2dsphere indexing for instant proximity querying and spatial sorting.
 * 
 * WHY REAL-TIME SOCKET.IO NOTIFICATION:
 * When a request is created, verified, claimed, or resolved, emitting real-time events lets
 * connected volunteers, admins, and victims see immediate updates without polling.
 */

const { v4: uuidv4 } = require('uuid');
const EmergencyRequest = require('../models/EmergencyRequest');
const { uploadImage } = require('../config/cloudinary');

// Helper to safely format ID queries without passing { _id: null }
const getQueryByIdOrRequestId = (id) => {
  if (!id) return { _id: '000000000000000000000000' };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    return { _id: id };
  }
  return { requestId: id };
};

// @desc    Create a new emergency request
// @route   POST /api/requests
// @access  Private (Victim role, or any user in emergency)
const createRequest = async (req, res) => {
  try {
    const { type, description, urgency, latitude, longitude, customPhotoUrl } = req.body;

    if (!type || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: 'Type, description, latitude, and longitude are required',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required',
      });
    }

    // Handle photo upload via Cloudinary or fallback
    let photoUrl = customPhotoUrl || '';
    if (req.file) {
      photoUrl = await uploadImage(req.file.buffer, req.file.originalname);
    }

    const shortId = uuidv4().slice(0, 8).toUpperCase();
    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}-${shortId}`;

    const newRequest = await EmergencyRequest.create({
      requestId,
      userId: req.user._id,
      type,
      description,
      urgency: urgency || 'Medium',
      location: {
        type: 'Point',
        // Crucial: GeoJSON standard specifies [longitude, latitude]
        coordinates: [lng, lat],
      },
      photoUrl,
      status: 'pending',
      assignedVolunteer: null,
      timestamp: new Date(),
    });

    // Populate user details for immediate client display
    await newRequest.populate('userId', 'name email');

    // Emit real-time event via Socket.IO if instance attached
    const io = req.app.get('io');
    if (io) {
      io.emit('request:created', newRequest);
    }

    res.status(201).json({
      success: true,
      request: newRequest,
    });
  } catch (err) {
    console.error('[Create Request Error]:', err);
    res.status(500).json({ message: err.message || 'Server error creating request' });
  }
};

// @desc    Get feed of pending, verified, and claimed requests
// @route   GET /api/requests/feed
// @access  Private (Volunteer, NGO, Admin)
const getFeed = async (req, res) => {
  try {
    const { type, urgency, status } = req.query;

    const query = {};

    // Filter by status, or default to actionable requests
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['pending', 'verified', 'claimed', 'in_progress'] };
    }

    if (type && type !== 'All') query.type = type;
    if (urgency && urgency !== 'All') query.urgency = urgency;

    const requests = await EmergencyRequest.find(query)
      .populate('userId', 'name email role')
      .populate('assignedVolunteer', 'name email role skills')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    console.error('[Get Feed Error]:', err);
    res.status(500).json({ message: 'Server error retrieving feed' });
  }
};

// @desc    Geospatial Proximity Matching Query using MongoDB 2dsphere index
// @route   GET /api/requests/nearby
// @access  Private (Volunteer, NGO, Admin)
const getNearbyRequests = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50, type, urgency } = req.query;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and Longitude query parameters are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
      return res.status(400).json({ message: 'Coordinates and radius must be valid numbers' });
    }

    // Convert km to meters for $maxDistance
    const maxDistanceMeters = radiusKm * 1000;

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
      status: { $in: ['pending', 'verified', 'claimed', 'in_progress'] },
    };

    if (type && type !== 'All') query.type = type;
    if (urgency && urgency !== 'All') query.urgency = urgency;

    const requests = await EmergencyRequest.find(query)
      .populate('userId', 'name email role')
      .populate('assignedVolunteer', 'name email role skills');

    // Calculate approximate distance for each request
    const earthRadiusKm = 6371;
    const requestsWithDistance = requests.map((doc) => {
      const obj = doc.toObject();
      const [rLng, rLat] = obj.location.coordinates;
      const dLat = ((rLat - lat) * Math.PI) / 180;
      const dLon = ((rLng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((rLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = Math.round(earthRadiusKm * c * 10) / 10;
      obj.distanceKm = distanceKm;
      return obj;
    });

    res.json({
      success: true,
      count: requestsWithDistance.length,
      radiusKm,
      requests: requestsWithDistance,
    });
  } catch (err) {
    console.error('[Nearby Requests Error]:', err);
    res.status(500).json({ message: err.message || 'Server error searching nearby requests' });
  }
};

// @desc    Claim an emergency request (Atomic operation)
// @route   PUT /api/requests/:id/claim
// @access  Private (Volunteer, NGO)
const claimRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getQueryByIdOrRequestId(id);

    // Atomic update preventing race condition between multiple concurrent responders
    const request = await EmergencyRequest.findOneAndUpdate(
      {
        ...query,
        status: { $in: ['pending', 'verified'] },
      },
      {
        $set: {
          status: 'claimed',
          assignedVolunteer: req.user._id,
        },
      },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('assignedVolunteer', 'name email role skills');

    if (!request) {
      // Check if it exists but is already claimed
      const existing = await EmergencyRequest.findOne(query);
      if (!existing) {
        return res.status(404).json({ message: 'Emergency request not found' });
      }
      return res.status(400).json({
        message: `Request cannot be claimed because it is currently '${existing.status}'`,
      });
    }

    // Notify all active clients in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('request:claimed', request);
    }

    res.json({
      success: true,
      message: 'Request claimed successfully',
      request,
    });
  } catch (err) {
    console.error('[Claim Request Error]:', err);
    res.status(500).json({ message: err.message || 'Server error claiming request' });
  }
};

// @desc    Admin Verify Request
// @route   PUT /api/requests/:id/verify
// @access  Private (Admin)
const verifyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getQueryByIdOrRequestId(id);

    const request = await EmergencyRequest.findOneAndUpdate(
      query,
      { $set: { status: 'verified' } },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('assignedVolunteer', 'name email role skills');

    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('request:verified', request);
      io.emit('request:status_updated', request);
    }

    res.json({
      success: true,
      message: 'Emergency request verified by admin',
      request,
    });
  } catch (err) {
    console.error('[Verify Request Error]:', err);
    res.status(500).json({ message: 'Server error verifying request' });
  }
};

// @desc    Admin Reject Request
// @route   PUT /api/requests/:id/reject
// @access  Private (Admin)
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getQueryByIdOrRequestId(id);

    const request = await EmergencyRequest.findOneAndUpdate(
      query,
      { $set: { status: 'rejected' } },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('assignedVolunteer', 'name email role skills');

    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('request:rejected', request);
      io.emit('request:status_updated', request);
    }

    res.json({
      success: true,
      message: 'Emergency request marked as rejected',
      request,
    });
  } catch (err) {
    console.error('[Reject Request Error]:', err);
    res.status(500).json({ message: 'Server error rejecting request' });
  }
};

// @desc    Update status of a request (in_progress, resolved, etc.)
// @route   PUT /api/requests/:id/status
// @access  Private
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'pending',
      'verified',
      'claimed',
      'in_progress',
      'resolved',
      'rejected',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const query = getQueryByIdOrRequestId(id);
    const request = await EmergencyRequest.findOne(query);

    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    // Authorization check: only assigned volunteer, request creator, or admin can update status
    const isOwner = request.userId.toString() === req.user._id.toString();
    const isVolunteer =
      request.assignedVolunteer &&
      request.assignedVolunteer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isVolunteer && !isAdmin) {
      return res.status(403).json({
        message: 'You are not authorized to update the status of this request',
      });
    }

    request.status = status;
    await request.save();

    await request.populate('userId', 'name email');
    await request.populate('assignedVolunteer', 'name email role skills');

    // Emit real-time status update
    const io = req.app.get('io');
    if (io) {
      io.emit('request:status_updated', request);
    }

    res.json({
      success: true,
      message: `Request status updated to ${status}`,
      request,
    });
  } catch (err) {
    console.error('[Update Status Error]:', err);
    res.status(500).json({ message: err.message || 'Server error updating status' });
  }
};

// @desc    Get requests relevant to the logged-in user
// @route   GET /api/requests/my-requests
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'victim') {
      // Victims see requests they submitted
      query.userId = req.user._id;
    } else if (req.user.role === 'volunteer' || req.user.role === 'ngo') {
      // Volunteers and NGOs see requests they have claimed
      query.assignedVolunteer = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admins see all
      query = {};
    } else {
      // Donors see none directly under my-requests (they use donations dashboard)
      return res.json({ success: true, count: 0, requests: [] });
    }

    const requests = await EmergencyRequest.find(query)
      .populate('userId', 'name email')
      .populate('assignedVolunteer', 'name email role skills')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    console.error('[My Requests Error]:', err);
    res.status(500).json({ message: 'Server error retrieving your requests' });
  }
};

// @desc    Get request by ID or requestId
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getQueryByIdOrRequestId(id);

    const request = await EmergencyRequest.findOne(query)
      .populate('userId', 'name email')
      .populate('assignedVolunteer', 'name email role skills');

    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    res.json({
      success: true,
      request,
    });
  } catch (err) {
    console.error('[Get Request By ID Error]:', err);
    res.status(500).json({ message: 'Server error retrieving request details' });
  }
};

module.exports = {
  createRequest,
  getFeed,
  getNearbyRequests,
  claimRequest,
  verifyRequest,
  rejectRequest,
  updateStatus,
  getMyRequests,
  getRequestById,
};
