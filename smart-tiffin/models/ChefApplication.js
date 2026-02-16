const mongoose = require('mongoose');

const chefApplicationSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  experience: {
    type: String,
    required: [true, 'Experience is required'],
    enum: ['0-1', '1-3', '3-5', '5+']
  },

  // Kitchen Details
  kitchenName: {
    type: String,
    required: [true, 'Kitchen name is required'],
    trim: true
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine specialty is required'],
    enum: ['north-indian', 'south-indian', 'mumbai-street', 'continental', 'multiple']
  },
  fssaiLicense: {
    type: String,
    default: ''
  },
  maxOrders: {
    type: Number,
    required: [true, 'Maximum orders is required'],
    min: 10,
    max: 100
  },
  kitchenAddress: {
    type: String,
    required: [true, 'Kitchen address is required'],
    trim: true
  },
  equipment: [{
    type: String,
    enum: ['gas-stove', 'oven', 'mixer', 'refrigerator']
  }],

  // Bank Details
  accountHolder: {
    type: String,
    required: [true, 'Account holder name is required'],
    trim: true
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true
  },
  ifscCode: {
    type: String,
    required: [true, 'IFSC code is required'],
    trim: true
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true
  },

  // Additional Information
  motivation: {
    type: String,
    required: [true, 'Motivation is required'],
    minlength: [50, 'Motivation must be at least 50 characters long'],
    maxlength: [1000, 'Motivation cannot exceed 1000 characters']
  },

  // Application Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  }

}, {
  timestamps: true
});

// Index for better query performance
chefApplicationSchema.index({ email: 1 });
chefApplicationSchema.index({ status: 1 });
chefApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChefApplication', chefApplicationSchema);