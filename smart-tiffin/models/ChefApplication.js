const mongoose = require('mongoose');

const chefApplicationSchema = new mongoose.Schema({
    // Personal Information
    fullName: {
        type: String,
        required: false,
        trim: true
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: false,
        trim: true
    },
    dob: {
        type: Date,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    experience: {
        type: String,
        required: false,
        enum: ['0-1', '1-3', '3-5', '5+']
    },

    // Kitchen & Cuisine Details
    kitchenName: {
        type: String,
        required: false,
        trim: true
    },
    cuisine: {
        type: String,
        required: false,
        enum: ['north-indian', 'south-indian', 'mumbai-street', 'continental', 'multiple']
    },
    fssaiLicense: {
        type: String,
        default: ''
    },
    maxOrders: {
        type: Number,
        required: false,
        enum: [10, 20, 30, 40, 50]
    },
    kitchenAddress: {
        type: String,
        required: false
    },
    equipment: [{
        type: String
    }],

    // Bank Details
    accountHolder: {
        type: String,
        required: false
    },
    accountNumber: {
        type: String,
        required: false
    },
    ifscCode: {
        type: String,
        required: false
    },
    bankName: {
        type: String,
        required: false
    },

    // Additional Information
    motivation: {
        type: String,
        required: false
    },
    foodPhotos: [{
        type: String // Store file paths
    }],

    // Application Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: String,
        ref: 'User'
    }
});

// Add index for better query performance
chefApplicationSchema.index({ status: 1, appliedAt: -1 });
chefApplicationSchema.index({ email: 1 });

module.exports = mongoose.model('ChefApplication', chefApplicationSchema);