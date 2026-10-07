/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getUsers,
  updateUserVerification,
  getVerificationQueue,
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect, requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.put('/users/:id/verification', updateUserVerification);
router.get('/queue', getVerificationQueue);

module.exports = router;
