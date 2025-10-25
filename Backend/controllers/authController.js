const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Pre-defined admin credentials
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || "admin@smarttiffin.com",
  password: process.env.ADMIN_PASSWORD || "admin123",
};

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || "your_fallback_secret_key",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide email and password",
      });
    }

    let user;
    let isPasswordValid = false;

    // 2) Check if it's admin login
    if (role === "admin") {
      if (
        email === ADMIN_CREDENTIALS.email &&
        password === ADMIN_CREDENTIALS.password
      ) {
        user = {
          _id: "admin-id",
          name: "Smart Tiffin Admin",
          email: ADMIN_CREDENTIALS.email,
          role: "admin",
          profileImage: null,
          phone: null,
        };
        isPasswordValid = true;
      }
    } else {
      // 3) Find user in MongoDB for customer/chef
      user = await User.findOne({ email, role });

      if (user) {
        // Compare hashed password
        isPasswordValid = await bcrypt.compare(password, user.password);
      }
    }

    // 4) Check if user exists and password is correct
    if (!user || !isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email, password, or role",
      });
    }

    // 5) Check if user is active (for non-admin users)
    if (user.isActive === false && role !== "admin") {
      return res.status(401).json({
        status: "error",
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // 6) Generate JWT token
    const token = generateToken(user._id, user.role);

    // 7) Prepare user data for response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      phone: user.phone,
    };

    // 8) Send response
    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during login",
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
