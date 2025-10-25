const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required"],
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: [true, "Chef reference is required"],
    },
    plan: {
      type: {
        type: String,
        enum: ["lunch", "dinner", "both"],
        required: [true, "Plan type is required"],
      },
      duration: {
        type: String,
        enum: ["weekly", "monthly", "quarterly"],
        required: [true, "Duration is required"],
      },
      price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"],
      },
      mealsPerDay: {
        type: Number,
        default: 1,
        min: 1,
        max: 2,
      },
      daysPerWeek: {
        type: Number,
        default: 6,
        min: 1,
        max: 7,
      },
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (date) {
          return date > new Date();
        },
        message: "Start date must be in the future",
      },
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    deliveryAddress: {
      street: {
        type: String,
        required: [true, "Street address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      zipCode: {
        type: String,
        required: [true, "ZIP code is required"],
      },
      instructions: String,
    },
    preferences: {
      spiceLevel: {
        type: String,
        enum: ["mild", "medium", "spicy"],
        default: "medium",
      },
      dietaryRestrictions: [String],
      allergies: [String],
      specialInstructions: {
        type: String,
        maxlength: [500, "Special instructions cannot exceed 500 characters"],
      },
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "completed", "pending_payment"],
      default: "pending_payment",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    nextBillingDate: Date,
    pauseSettings: {
      isPaused: {
        type: Boolean,
        default: false,
      },
      pauseStart: Date,
      pauseEnd: Date,
      reason: String,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    cancellation: {
      requestedAt: Date,
      reason: String,
      effectiveDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate end date based on duration
subscriptionSchema.pre("save", function (next) {
  if (this.isModified("startDate") || this.isModified("plan.duration")) {
    const durationMap = {
      weekly: 7,
      monthly: 30,
      quarterly: 90,
    };

    const daysToAdd = durationMap[this.plan.duration];
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + daysToAdd);

    // Set next billing date
    this.nextBillingDate = new Date(this.endDate);
  }
  next();
});

// Indexes for better query performance
subscriptionSchema.index({ customer: 1 });
subscriptionSchema.index({ chef: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ paymentStatus: 1 });
subscriptionSchema.index({ startDate: 1, endDate: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Compound indexes
subscriptionSchema.index({
  customer: 1,
  status: 1,
});

subscriptionSchema.index({
  chef: 1,
  status: 1,
});

// Virtual for active subscription check
subscriptionSchema.virtual("isActive").get(function () {
  const now = new Date();
  return (
    this.status === "active" && this.startDate <= now && this.endDate >= now
  );
});

// Method to check if subscription can be created
subscriptionSchema.statics.canCreateSubscription = async function (
  chefId,
  startDate
) {
  const Chef = require("./Chef");
  const chef = await Chef.findById(chefId);

  if (!chef || chef.status !== "approved") {
    throw new Error("Chef is not available for subscriptions");
  }

  if (!chef.subscriptionSettings.isAcceptingOrders) {
    throw new Error("Chef is not currently accepting new orders");
  }

  // Check chef's daily order capacity
  const activeSubscriptions = await this.countDocuments({
    chef: chefId,
    status: "active",
    startDate: { $lte: startDate },
    endDate: { $gte: startDate },
  });

  if (activeSubscriptions >= chef.subscriptionSettings.maxDailyOrders) {
    throw new Error("Chef has reached maximum subscription capacity");
  }

  return true;
};

module.exports = mongoose.model("Subscription", subscriptionSchema);
