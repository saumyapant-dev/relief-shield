/**
 * Donation Controller
 * 
 * WHY SIMULATED DONATION TRANSACTIONS:
 * As specified in Phase 5, simulated donation transactions capture the amount,
 * donor reference, and optional target emergency request or general pool.
 * Real-time event broadcasting updates fund totals instantly on donor dashboards.
 */

const { v4: uuidv4 } = require('uuid');
const Donation = require('../models/Donation');
const EmergencyRequest = require('../models/EmergencyRequest');

// @desc    Create a simulated donation
// @route   POST /api/donations
// @access  Private (Donor, or any authenticated user)
const createDonation = async (req, res) => {
  try {
    const { amount, requestId } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'A valid donation amount greater than 0 is required' });
    }

    let targetRequest = null;
    if (requestId) {
      targetRequest = await EmergencyRequest.findOne({
        $or: [{ _id: requestId.match(/^[0-9a-fA-F]{24}$/) ? requestId : null }, { requestId }],
      });
      if (!targetRequest) {
        return res.status(404).json({ message: 'Target emergency request not found' });
      }
    }

    const shortId = uuidv4().slice(0, 6).toUpperCase();
    const donationId = `DON-${Date.now().toString(36).toUpperCase()}-${shortId}`;

    const donation = await Donation.create({
      donationId,
      donorId: req.user._id,
      requestId: targetRequest ? targetRequest._id : null,
      amount: Math.round(numAmount * 100) / 100,
      status: 'completed',
      timestamp: new Date(),
    });

    await donation.populate('donorId', 'name email');
    if (donation.requestId) {
      await donation.populate('requestId', 'requestId type description urgency');
    }

    // Broadcast real-time donation event
    const io = req.app.get('io');
    if (io) {
      io.emit('donation:created', donation);
    }

    res.status(201).json({
      success: true,
      message: 'Donation processed successfully',
      donation,
    });
  } catch (err) {
    console.error('[Donation Error]:', err);
    res.status(500).json({ message: err.message || 'Server error processing donation' });
  }
};

// @desc    Get all donations & relief pool summary
// @route   GET /api/donations
// @access  Private
const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'completed' })
      .populate('donorId', 'name email')
      .populate('requestId', 'requestId type description urgency')
      .sort({ createdAt: -1 });

    const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const generalPool = donations
      .filter((d) => !d.requestId)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    const targetedTotal = totalAmount - generalPool;

    res.json({
      success: true,
      totalAmount,
      generalPool,
      targetedTotal,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error('[Get Donations Error]:', err);
    res.status(500).json({ message: 'Server error retrieving donations' });
  }
};

// @desc    Get logged-in user's donation history
// @route   GET /api/donations/my-donations
// @access  Private
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id, status: 'completed' })
      .populate('requestId', 'requestId type description urgency')
      .sort({ createdAt: -1 });

    const myTotal = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    res.json({
      success: true,
      myTotal,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error('[My Donations Error]:', err);
    res.status(500).json({ message: 'Server error retrieving your donation history' });
  }
};

module.exports = {
  createDonation,
  getDonations,
  getMyDonations,
};
