const User = require("../models/User");
const crypto = require("crypto");

/**
 * Utility functions for user management in Smart Tiffin
 */

// Create admin user if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      role: "admin",
      email: process.env.ADMIN_EMAIL || "admin@smarttiffin.com",
    });

    if (!adminExists) {
      const adminUser = await User.create({
        name: process.env.ADMIN_NAME || "Smart Tiffin Admin",
        email: process.env.ADMIN_EMAIL || "admin@smarttiffin.com",
        password: process.env.ADMIN_PASSWORD || "admin123",
        role: "admin",
        phone: process.env.ADMIN_PHONE || "+91 9876543210",
        emailVerified: true,
        isActive: true,
      });

      console.log("✅ Default admin user created:", adminUser.email);
      return adminUser;
    } else {
      console.log("ℹ️  Admin user already exists");
      return adminExists;
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
    throw error;
  }
};

// Validate user data before creation
const validateUserData = (userData) => {
  const errors = [];

  // Name validation
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (userData.name && userData.name.trim().length > 100) {
    errors.push("Name cannot exceed 100 characters");
  }

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!userData.email || !emailRegex.test(userData.email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation
  if (userData.password && userData.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // Phone validation (if provided)
  if (userData.phone && userData.phone.trim() !== "") {
    const cleanedPhone = userData.phone.replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      errors.push("Please provide a valid 10-digit phone number");
    }
  }

  // Role validation
  const validRoles = ["customer", "chef", "admin"];
  if (userData.role && !validRoles.includes(userData.role)) {
    errors.push("Invalid user role");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

// Sanitize user data for output (remove sensitive fields)
const sanitizeUserData = (user) => {
  if (!user) return null;

  // Handle both mongoose document and plain object
  const userObj = user.toObject ? user.toObject() : { ...user };

  // Remove sensitive fields
  const sensitiveFields = [
    "password",
    "passwordResetToken",
    "passwordResetExpires",
    "verificationToken",
    "verificationTokenExpires",
    "__v",
  ];

  sensitiveFields.forEach((field) => {
    delete userObj[field];
  });

  return userObj;
};

// Generate random password
const generateRandomPassword = (length = 12) => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";

  // Ensure at least one character from each set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

// Check if user has permission for action based on role hierarchy
const hasPermission = (user, requiredRole, action = null) => {
  if (!user || !user.role) return false;

  const roleHierarchy = {
    customer: 1,
    chef: 2,
    admin: 3,
  };

  // Admin has all permissions
  if (user.role === "admin") return true;

  // Check role hierarchy
  const userRoleLevel = roleHierarchy[user.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
};

// Get user role display name
const getRoleDisplayName = (role) => {
  const roleDisplayNames = {
    customer: "Customer",
    chef: "Chef",
    admin: "Administrator",
  };

  return roleDisplayNames[role] || role;
};

// Format user data for different contexts (API responses)
const formatUserResponse = (user, context = "public") => {
  const baseData = {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  switch (context) {
    case "public":
      return baseData;

    case "profile":
      return {
        ...baseData,
        phone: user.phone,
        address: user.address,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
      };

    case "admin":
      return {
        ...baseData,
        phone: user.phone,
        address: user.address,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        passwordChangedAt: user.passwordChangedAt,
        deactivatedAt: user.deactivatedAt,
        deactivationReason: user.deactivationReason,
      };

    default:
      return baseData;
  }
};

// Check if email is already registered
const isEmailRegistered = async (email) => {
  try {
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    return !!existingUser;
  } catch (error) {
    console.error("Error checking email registration:", error);
    throw error;
  }
};

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash verification token (similar to password reset token)
const hashVerificationToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Calculate user statistics for dashboard
const calculateUserStats = async (timeframe = "all") => {
  try {
    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case "today":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
          },
        };
        break;
      case "week":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "month":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        };
        break;
      // 'all' case - no date filter
    }

    const stats = await User.aggregate([
      {
        $match: {
          ...dateFilter,
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: ["$emailVerified", 1, 0] },
          },
        },
      },
      {
        $project: {
          role: "$_id",
          count: 1,
          verifiedCount: 1,
          verificationRate: {
            $round: [
              { $multiply: [{ $divide: ["$verifiedCount", "$count"] }, 100] },
              2,
            ],
          },
        },
      },
    ]);

    return stats;
  } catch (error) {
    console.error("Error calculating user stats:", error);
    throw error;
  }
};

module.exports = {
  createDefaultAdmin,
  validateUserData,
  sanitizeUserData,
  generateRandomPassword,
  hasPermission,
  getRoleDisplayName,
  formatUserResponse,
  isEmailRegistered,
  generateVerificationToken,
  hashVerificationToken,
  calculateUserStats,
};
