const mongoose = require("mongoose");

const chefSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Chef name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    cuisineSpecialties: [
      {
        type: String,
        required: [true, "At least one cuisine specialty is required"],
        trim: true,
        enum: [
          "north indian",
          "south indian",
          "mughlai",
          "continental",
          "chinese",
          "italian",
          "mexican",
          "jain",
          "diet",
          "multiple",
        ],
      },
    ],
    bio: {
      type: String,
      required: [true, "Bio is required"],
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
      trim: true,
    },
    experience: {
      type: String,
      required: [true, "Experience details are required"],
      enum: ["beginner", "1-3 years", "3-5 years", "5+ years", "professional"],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    location: {
      address: {
        type: String,
        required: [true, "Address is required"],
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
      coordinates: {
        lat: Number,
        lng: Number,
      },
      deliveryRadius: {
        type: Number,
        default: 10, // in kilometers
        min: 1,
        max: 50,
      },
    },
    profileImage: {
      type: String,
      default: null,
    },
    kitchenImages: [
      {
        type: String,
        required: [true, "At least one kitchen image is required"],
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    fssaiLicense: {
      number: {
        type: String,
        required: [true, "FSSAI license number is required"],
      },
      image: {
        type: String,
        required: [true, "FSSAI license image is required"],
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },
    idProof: {
      type: {
        type: String,
        required: [true, "ID proof type is required"],
        enum: ["aadhar", "pan", "driving_license", "passport"],
      },
      number: {
        type: String,
        required: [true, "ID proof number is required"],
      },
      image: {
        type: String,
        required: [true, "ID proof image is required"],
      },
    },
    subscriptionSettings: {
      maxDailyOrders: {
        type: Number,
        default: 30,
        min: 5,
        max: 100,
      },
      isAcceptingOrders: {
        type: Boolean,
        default: false, // Only true after approval
      },
    },
    mealTypes: [
      {
        type: String,
        enum: ["breakfast", "lunch", "dinner"],
        required: [true, "At least one meal type is required"],
      },
    ],
    rejectionReason: {
      type: String,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
chefSchema.index({ user: 1 });
chefSchema.index({ status: 1 });
chefSchema.index({ "location.city": 1 });
chefSchema.index({ cuisineSpecialties: 1 });
chefSchema.index({ rating: -1 });
chefSchema.index({ createdAt: -1 });

// Virtual for chef approval status
chefSchema.virtual("isApproved").get(function () {
  return this.status === "approved";
});

// Method to check if chef can accept orders
chefSchema.methods.canAcceptOrders = function () {
  return (
    this.status === "approved" && this.subscriptionSettings.isAcceptingOrders
  );
};

module.exports = mongoose.model("Chef", chefSchema);
