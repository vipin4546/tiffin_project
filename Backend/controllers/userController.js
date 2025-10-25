const User = require("../models/User");
const {
  validateUserData,
  sanitizeUserData,
  hasPermission,
} = require("../utils/userUtils");

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: sanitizeUserData(user),
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update user profile
exports.updateMe = async (req, res) => {
  try {
    // 1) Create error if user POSTs password data
    if (req.body.password) {
      return res.status(400).json({
        status: "error",
        message:
          "This route is not for password updates. Please use /updatePassword.",
      });
    }

    // 2) Filtered out unwanted fields that are not allowed to be updated
    const filteredBody = {
      name: req.body.name,
      phone: req.body.phone,
      profileImage: req.body.profileImage,
      address: req.body.address,
      preferences: req.body.preferences,
    };

    // Remove undefined fields
    Object.keys(filteredBody).forEach((key) => {
      if (filteredBody[key] === undefined) {
        delete filteredBody[key];
      }
    });

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: sanitizeUserData(updatedUser),
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete user (soft delete)
exports.deleteMe = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isActive: false,
      deactivatedAt: new Date(),
      deactivationReason: "User requested deletion",
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const isActive = req.query.isActive;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    // Sanitize users data
    const sanitizedUsers = users.map((user) => sanitizeUserData(user));

    res.status(200).json({
      status: "success",
      results: sanitizedUsers.length,
      data: {
        users: sanitizedUsers,
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get user by ID (Admin only)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: sanitizeUserData(user),
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: sanitizeUserData(user),
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete user (Admin only - hard delete)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get user statistics (Admin only)
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.getUserStats();

    res.status(200).json({
      status: "success",
      data: {
        statistics: stats,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
