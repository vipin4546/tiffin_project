const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token
module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

// Role-based authorization
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'chef', 'customer']
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

// Optional: Check if user is logged in (without throwing error)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_fallback_secret_key"
      );
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
