/**
 * Emergency Request Routes
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  createRequest,
  getFeed,
  getNearbyRequests,
  claimRequest,
  verifyRequest,
  rejectRequest,
  updateStatus,
  getMyRequests,
  getRequestById,
} = require('../controllers/requestController');

// Create emergency request (with optional photo upload)
router.post('/', protect, upload.single('photo'), createRequest);

// Volunteer/NGO/Admin Feed of requests
router.get('/feed', protect, getFeed);

// Geospatial Proximity Matching (2dsphere $near query)
router.get('/nearby', protect, getNearbyRequests);

// User-specific requests (Victim's submitted requests OR Volunteer's claimed requests)
router.get('/my-requests', protect, getMyRequests);

// Get single request details
router.get('/:id', protect, getRequestById);

// Claim request (Volunteers & NGOs)
router.put('/:id/claim', protect, requireRole('volunteer', 'ngo'), claimRequest);

// Admin Verification actions
router.put('/:id/verify', protect, requireRole('admin'), verifyRequest);
router.put('/:id/reject', protect, requireRole('admin'), rejectRequest);

// Update request status (e.g., claimed -> in_progress -> resolved)
router.put('/:id/status', protect, updateStatus);

module.exports = router;
