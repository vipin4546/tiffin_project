const express = require("express");
const authController = require("../controllers/authController");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

// Customer routes
router.post("/create", paymentController.createPayment);
router.get("/customer/:customerId", paymentController.getCustomerPayments);

// Chef routes
router.get("/chef/:chefId", paymentController.getChefEarnings);

// Admin routes for payment management
router.use(authController.restrictTo("admin"));
router.patch("/:paymentId/status", paymentController.updatePaymentStatus);

module.exports = router;
