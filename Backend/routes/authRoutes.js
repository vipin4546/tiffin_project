const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/login", authController.login);

// Protected routes (require authentication)
router.use(authMiddleware.verifyToken);

router.get("/me", authMiddleware , authController.getMe);

module.exports = router;
