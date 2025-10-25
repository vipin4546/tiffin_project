const express = require("express");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const chefMiddleware = require("../middleware/chefMiddleware");

const router = express.Router();

// All dashboard routes require authentication
router.use(authController.protect);

// Customer Dashboard
router.get("/customer", dashboardController.getCustomerDashboard);

// Chef Dashboard
router.get(
  "/chef",
  chefMiddleware.isApprovedChef,
  dashboardController.getChefDashboard
);

// Admin Dashboard
router.get(
  "/admin",
  authController.restrictTo("admin"),
  dashboardController.getAdminDashboard
);

// Chef-specific routes
router.get(
  "/chef/subscribers",
  chefMiddleware.isApprovedChef,
  dashboardController.getChefSubscribers
);
router.get(
  "/chef/earnings",
  chefMiddleware.isApprovedChef,
  dashboardController.getChefEarnings
);
router.get(
  "/chef/reviews",
  chefMiddleware.isApprovedChef,
  dashboardController.getChefReviews
);

// Admin-specific routes
router.get(
  "/admin/pending-chefs",
  authController.restrictTo("admin"),
  dashboardController.getPendingChefs
);
router.get(
  "/admin/users",
  authController.restrictTo("admin"),
  dashboardController.getUserManagement
);
router.get(
  "/admin/analytics",
  authController.restrictTo("admin"),
  dashboardController.getAdminAnalytics
);

module.exports = router;
