const express = require('express');
const {
  submitApplication,
  getApplications,
  getApplication,
  updateApplicationStatus
} = require('../controllers/chefApplicationsController');

const router = express.Router();

// Public route - anyone can submit application
router.post('/', submitApplication);

// Public routes for testing (remove protect temporarily)
router.get('/', getApplications);
router.get('/:id', getApplication);
router.put('/:id/status', updateApplicationStatus);

module.exports = router;