const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: [true, "Subscription reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer",
      },
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      trim: true,
    },
    aspects: {
      taste: {
        type: Number,
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "Taste rating must be an integer",
        },
      },
      quantity: {
        type: Number,
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "Quantity rating must be an integer",
        },
      },
      packaging: {
        type: Number,
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "Packaging rating must be an integer",
        },
      },
      delivery: {
        type: Number,
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "Delivery rating must be an integer",
        },
      },
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (images) {
            return images.length <= 5;
          },
          message: "Cannot upload more than 5 images",
        },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    helpful: {
      count: {
        type: Number,
        default: 0,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    response: {
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      message: {
        type: String,
        maxlength: [500, "Response cannot exceed 500 characters"],
      },
      respondedAt: Date,
    },
    status: {
      type: String,
      enum: ["active", "flagged", "removed"],
      default: "active",
    },
    reportedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure one review per subscription
reviewSchema.index({ subscription: 1 }, { unique: true });

// Indexes for better query performance
reviewSchema.index({ chef: 1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ "helpful.count": -1 });
reviewSchema.index({ status: 1 });

// Compound indexes
reviewSchema.index({
  chef: 1,
  status: 1,
});

reviewSchema.index({
  chef: 1,
  rating: 1,
});

// Virtual for review age
reviewSchema.virtual("daysAgo").get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to calculate average rating for a chef
reviewSchema.statics.calculateAverageRating = async function (chefId) {
  const stats = await this.aggregate([
    {
      $match: {
        chef: chefId,
        status: "active",
      },
    },
    {
      $group: {
        _id: "$chef",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        ratingDistribution: {
          $push: "$rating",
        },
      },
    },
  ]);

  if (stats.length > 0) {
    const Chef = require("./Chef");
    await Chef.findByIdAndUpdate(chefId, {
      "rating.average": Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
      "rating.count": stats[0].nRating,
      "rating.distribution": calculateRatingDistribution(
        stats[0].ratingDistribution
      ),
    });
  } else {
    const Chef = require("./Chef");
    await Chef.findByIdAndUpdate(chefId, {
      "rating.average": 0,
      "rating.count": 0,
      "rating.distribution": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }
};

// Calculate rating distribution
const calculateRatingDistribution = (ratings) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((rating) => {
    distribution[rating]++;
  });
  return distribution;
};

// Update chef rating after saving a review
reviewSchema.post("save", function () {
  this.constructor.calculateAverageRating(this.chef);
});

// Update chef rating after removing a review
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.chef);
  }
});

// Instance method to mark review as helpful
reviewSchema.methods.markHelpful = async function (userId) {
  if (this.helpful.users.includes(userId)) {
    // User already marked as helpful, remove it
    this.helpful.users.pull(userId);
    this.helpful.count = Math.max(0, this.helpful.count - 1);
  } else {
    // Add user to helpful list
    this.helpful.users.push(userId);
    this.helpful.count += 1;
  }
  await this.save();
  return this.helpful.count;
};

// Static method to validate if customer can review
reviewSchema.statics.canCustomerReview = async function (
  customerId,
  chefId,
  subscriptionId
) {
  const Subscription = require("./Subscription");

  // Check if subscription exists and is active/completed
  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    customer: customerId,
    chef: chefId,
    status: { $in: ["completed", "active"] },
  });

  if (!subscription) {
    throw new Error("You can only review chefs you have subscribed to");
  }

  // Check if customer already reviewed this subscription
  const existingReview = await this.findOne({ subscription: subscriptionId });
  if (existingReview) {
    throw new Error("You have already reviewed this subscription");
  }

  return true;
};

module.exports = mongoose.model("Review", reviewSchema);
