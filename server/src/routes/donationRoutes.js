/**
 * Donation Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createDonation,
  getDonations,
  getMyDonations,
} = require('../controllers/donationController');

router.use(protect);

router.post('/', createDonation);
router.get('/', getDonations);
router.get('/my-donations', getMyDonations);

module.exports = router;
