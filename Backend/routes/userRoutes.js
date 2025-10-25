const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// All routes after this middleware are protected
router.use(authController.protect);

// User profile routes
router.get("/me", authController.getMe);
router.patch("/updateMe", userController.updateMe);
router.patch("/updatePassword", authController.updatePassword);
router.delete("/deleteMe", userController.deleteMe);

// Admin only routes
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
