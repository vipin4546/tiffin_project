const express = require('express');
const ChefApplication = require('../models/ChefApplication');
// Remove auth middleware temporarily for testing
// const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Enable CORS for all routes
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// @desc    Submit chef application
// @route   POST /api/chef-applications
// @access  Public
router.post('/', async (req, res) => {
    try {
        console.log('📨 Received application:', req.body);
        
        // Simple validation
        const { fullName, email, phone } = req.body;
        
        if (!fullName || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and phone are required'
            });
        }

        // Create application
        const application = new ChefApplication({
            ...req.body,
            status: 'pending',
            appliedAt: new Date()
        });

        await application.save();

        console.log('✅ Application saved to database:', application._id);

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            data: {
                id: application._id,
                name: application.fullName,
                status: application.status
            }
        });

    } catch (error) {
        console.error('❌ Chef application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// @desc    Get all chef applications
// @route   GET /api/chef-applications
// @access  Public (temporarily for testing)
router.get('/', async (req, res) => {
    try {
        console.log('📋 Fetching all applications');
        
        const applications = await ChefApplication.find()
            .sort({ appliedAt: -1 })
            .select('-accountNumber -ifscCode'); // Exclude sensitive data

        console.log(`✅ Found ${applications.length} applications`);

        res.json({
            success: true,
            data: applications
        });

    } catch (error) {
        console.error('❌ Get applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching applications'
        });
    }
});

// @desc    Update application status (Approve/Reject)
// @route   PUT /api/chef-applications/:id/status
// @access  Public (temporarily for testing)
router.put('/:id/status', async (req, res) => {
    try {
        console.log('🔄 Updating application status:', req.params.id, req.body);
        
        let { status, adminNotes } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        status = status.toLowerCase();

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Use "approved" or "rejected"'
            });
        }

        const application = await ChefApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Update application
        application.status = status;
        application.adminNotes = adminNotes || '';
        application.reviewedAt = new Date();
        application.reviewedBy = 'admin-user'; // You can update this later

        await application.save();
        
        console.log('✅ Application status updated successfully:', application._id);

        res.json({
            success: true,
            message: `Application ${status} successfully`,
            data: {
                id: application._id,
                status: application.status,
                reviewedAt: application.reviewedAt
            }

        });

    } catch (error) {
        console.error('❌ Update application status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating application status: ' + error.message
        });
    }
});

// @desc    Get single application
// @route   GET /api/chef-applications/:id
// @access  Public (temporarily for testing)
router.get('/:id', async (req, res) => {
    try {
        const application = await ChefApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.json({
            success: true,
            data: application
        });

    } catch (error) {
        console.error('Get single application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching application'
        });
    }
});

module.exports = router;