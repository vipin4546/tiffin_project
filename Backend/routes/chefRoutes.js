const express = require('express');
const router = express.Router();
const chefMiddleware = require('../middleware/chefMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const chefController = require('../controllers/chefController');
// Add this to your existing auth middleware or create new middleware
router.get('/dashboard', authMiddleware, chefMiddleware, chefController.getDashboardData);
router.put('/order/:orderId/accept', authMiddleware, chefMiddleware, chefController.acceptOrder);

// Check if user is chef
exports.isChef = async (req, res, next) => {
  try {
    const Chef = require("../models/Chef");
    const chef = await Chef.findOne({ user: req.user.id });

    if (!chef) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Chef profile required.",
      });
    }

    req.chef = chef;
    next();
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Check if chef is approved
exports.isApprovedChef = async (req, res, next) => {
  try {
    const Chef = require("../models/Chef");
    const chef = await Chef.findOne({
      user: req.user.id,
      status: "approved",
    });

    if (!chef) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Your chef profile is not approved yet.",
      });
    }

    req.chef = chef;
    next();
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
module.exports = router;