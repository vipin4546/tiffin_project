const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin reference is required"],
    },
    actionType: {
      type: String,
      required: [true, "Action type is required"],
      enum: [
        "chef_approval",
        "chef_rejection",
        "chef_suspension",
        "user_management",
        "payment_verification",
        "content_moderation",
        "system_config",
        "data_export",
      ],
    },
    targetModel: {
      type: String,
      enum: ["User", "Chef", "Menu", "Subscription", "Payment", "Review"],
      required: [true, "Target model is required"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    details: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    severity: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      default: "info",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance and auditing
adminLogSchema.index({ admin: 1 });
adminLogSchema.index({ actionType: 1 });
adminLogSchema.index({ targetModel: 1 });
adminLogSchema.index({ targetId: 1 });
adminLogSchema.index({ severity: 1 });
adminLogSchema.index({ createdAt: -1 });

// Compound index for audit reports
adminLogSchema.index({
  actionType: 1,
  createdAt: -1,
});

// TTL index for log retention (optional - keep logs for 2 years)
adminLogSchema.index(
  {
    createdAt: 1,
  },
  {
    expireAfterSeconds: 63072000, // 2 years in seconds
  }
);

module.exports = mongoose.model("AdminLog", adminLogSchema);
