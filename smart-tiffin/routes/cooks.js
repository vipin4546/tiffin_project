const express = require('express');
const {
  applyAsCook,
  getCookProfile
} = require('../controllers/cookController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/apply', protect, applyAsCook);
router.get('/profile', protect, authorize('cook'), getCookProfile);

module.exports = router;