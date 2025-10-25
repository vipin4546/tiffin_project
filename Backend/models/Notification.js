const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    type: {
      type: String,
      enum: [
        "subscription_created",
        "subscription_updated",
        "payment_success",
        "payment_failed",
        "chef_approved",
        "chef_rejected",
        "new_review",
        "order_reminder",
        "system_announcement",
      ],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["unread", "read", "dismissed"],
      default: "unread",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    actionUrl: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSchema.index({ user: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for user notifications
notificationSchema.index({
  user: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Notification", notificationSchema);
