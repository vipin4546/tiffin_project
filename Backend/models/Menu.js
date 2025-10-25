const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Menu item name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"],
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    enum: ["veg", "non-veg", "vegan", "jain"],
    default: "veg",
  },
  cuisineType: {
    type: String,
    required: [true, "Cuisine type is required"],
    trim: true,
  },
  spiceLevel: {
    type: String,
    enum: ["mild", "medium", "spicy"],
    default: "medium",
  },
  dietaryTags: [
    {
      type: String,
      trim: true,
    },
  ],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: Number, // in minutes
    default: 30,
  },
  image: {
    type: String,
    default: null,
  },
  addons: [
    {
      name: String,
      price: Number,
      isAvailable: Boolean,
    },
  ],
});

const menuSchema = new mongoose.Schema(
  {
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: [true, "Chef reference is required"],
    },
    name: {
      type: String,
      required: [true, "Menu name is required"],
      trim: true,
      maxlength: [100, "Menu name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    menuItems: [menuItemSchema],
    schedule: {
      type: {
        type: String,
        enum: ["daily", "weekly", "custom"],
        default: "daily",
      },
      days: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      ],
      startTime: String, // HH:MM format
      endTime: String, // HH:MM format
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mealTypes: [
      {
        type: String,
        enum: ["breakfast", "lunch", "dinner"],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
menuSchema.index({ chef: 1 });
menuSchema.index({ isActive: 1 });
menuSchema.index({ "menuItems.category": 1 });
menuSchema.index({ "menuItems.cuisineType": 1 });

module.exports = mongoose.model("Menu", menuSchema);
