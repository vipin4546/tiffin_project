const express = require("express");
const authController = require("../controllers/authController");
const subscriptionController = require("../controllers/subscriptionController");

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

// Customer routes
router.post("/create", subscriptionController.createSubscription);
router.get(
  "/customer/:customerId",
  subscriptionController.getCustomerSubscriptions
);

// Chef and admin routes
router.get("/chef/:chefId", subscriptionController.getChefSubscribers);

module.exports = router;
