const mongoose = require('mongoose');

const cookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  kitchenName: {
    type: String,
    required: [true, 'Please add a kitchen name']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  cuisineSpecialty: {
    type: [String],
    required: true
  },
  mealTypes: {
    type: [String],
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  fssaiLicense: {
    number: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  kitchenPhotos: [String],
  idProof: {
    type: String
  },
  maxOrdersPerDay: {
    type: Number,
    default: 20
  },
  deliveryAreas: [String],
  availability: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: true }
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isAcceptingOrders: {
    type: Boolean,
    default: true
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cook', cookSchema);