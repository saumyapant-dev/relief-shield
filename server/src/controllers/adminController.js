/**
 * Admin Controller
 * 
 * Provides centralized administrative oversight:
 * - Real-time relief statistics and KPI aggregation
 * - Verification queue of pending victim requests
 * - User and volunteer management
 */

const EmergencyRequest = require('../models/EmergencyRequest');
const User = require('../models/User');
const Donation = require('../models/Donation');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    const [
      totalRequests,
      pendingRequests,
      verifiedRequests,
      claimedRequests,
      inProgressRequests,
      resolvedRequests,
      rejectedRequests,
      totalUsers,
      volunteersCount,
      donorsCount,
      ngosCount,
      donationsAgg,
    ] = await Promise.all([
      EmergencyRequest.countDocuments(),
      EmergencyRequest.countDocuments({ status: 'pending' }),
      EmergencyRequest.countDocuments({ status: 'verified' }),
      EmergencyRequest.countDocuments({ status: 'claimed' }),
      EmergencyRequest.countDocuments({ status: 'in_progress' }),
      EmergencyRequest.countDocuments({ status: 'resolved' }),
      EmergencyRequest.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'ngo' }),
      Donation.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalDonations = donationsAgg[0]?.totalAmount || 0;
    const donationCount = donationsAgg[0]?.count || 0;

    res.json({
      success: true,
      stats: {
        totalRequests,
        pendingRequests,
        verifiedRequests,
        claimedRequests,
        inProgressRequests,
        resolvedRequests,
        rejectedRequests,
        totalUsers,
        volunteersCount,
        donorsCount,
        ngosCount,
        totalDonations,
        donationCount,
      },
    });
  } catch (err) {
    console.error('[Admin Stats Error]:', err);
    res.status(500).json({ message: 'Server error retrieving admin statistics' });
  }
};

// @desc    Get all users with role and verification status
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error('[Admin Users Error]:', err);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
};

// @desc    Update user verification status
// @route   PUT /api/admin/users/:id/verification
// @access  Private (Admin)
const updateUserVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { verificationStatus } },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User status updated to ${verificationStatus}`,
      user,
    });
  } catch (err) {
    console.error('[Update User Verification Error]:', err);
    res.status(500).json({ message: 'Server error updating user verification' });
  }
};

// @desc    Get pending verification queue for requests
// @route   GET /api/admin/queue
// @access  Private (Admin)
const getVerificationQueue = async (req, res) => {
  try {
    const queue = await EmergencyRequest.find({ status: 'pending' })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 }); // Oldest first for timely verification

    res.json({
      success: true,
      count: queue.length,
      queue,
    });
  } catch (err) {
    console.error('[Admin Queue Error]:', err);
    res.status(500).json({ message: 'Server error retrieving verification queue' });
  }
};

module.exports = {
  getAdminStats,
  getUsers,
  updateUserVerification,
  getVerificationQueue,
};
