const express = require("express");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");
const chefMiddleware = require("../middleware/chefMiddleware");

const router = express.Router();

// Public routes
router.get("/chef/:chefId", reviewController.getChefReviews);

// All routes below require authentication
router.use(authController.protect);

// Customer routes
router.post("/create", reviewController.createReview);
router.get("/my-reviews", reviewController.getMyReviews);
router.patch("/:reviewId/helpful", reviewController.markHelpful);

// Chef routes (require chef authentication)
router.use(chefMiddleware.isApprovedChef);
router.patch("/:reviewId/response", reviewController.addResponse);

// Admin routes can be added here
// router.use(authController.restrictTo('admin'));

module.exports = router;
