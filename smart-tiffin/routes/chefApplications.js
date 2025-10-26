const express = require('express');
const multer = require('multer');
const path = require('path');
const ChefApplication = require('../models/ChefApplication');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ------------------------------------------------------------------
// MULTER CONFIGURATION FOR FILE UPLOADS
// ------------------------------------------------------------------

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure this directory exists or is created before running the server
        cb(null, 'uploads/chef-applications/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Check if the file MIME type starts with 'image/'
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            // Reject the file and provide an error message
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// ------------------------------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------------------------------

// @desc    Test route
// @route   GET /api/chef-applications/test
// @access  Public
router.get('/test', (req, res) => {
    console.log('✅ Chef applications test route called');

    res.json({
        success: true,
        message: 'Chef applications routes are working!'
    });
});

// @desc    Submit chef application
// @route   POST /api/chef-applications
// @access  Public
// @desc    Submit chef application - SIMPLIFIED FOR TESTING
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

        // Create application (without file upload for now)
        const application = new ChefApplication({
            ...req.body,
            status: 'pending'
        });

        await application.save();

        console.log('✅ Application saved to database');

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

// ------------------------------------------------------------------
// PRIVATE/ADMIN ROUTES (Requires 'protect' and 'authorize('admin'))
// ------------------------------------------------------------------

// @desc    Get all chef applications (Admin only)
// @route   GET /api/chef-applications
// @access  Private/Admin
router.get('/', /*protect, authorize('admin'), */async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};
        // Build the query object based on optional 'status' filter
        if (status && status !== 'all') {
            query.status = status;
        }

        // Pagination setup
        const limitInt = parseInt(limit);
        const pageInt = parseInt(page);
        const skip = (pageInt - 1) * limitInt;

        const applications = await ChefApplication.find(query)
            .sort({ appliedAt: -1 })
            .limit(limitInt)
            .skip(skip)
            // Exclude sensitive banking data from the list view
            .select('-accountNumber -ifscCode -bankName');

        const total = await ChefApplication.countDocuments(query);

        res.json({
            success: true,
            data: applications,
            pagination: {
                page: pageInt,
                limit: limitInt,
                total,
                pages: Math.ceil(total / limitInt)
            }
        });

    } catch (error) {
        console.error('Get all applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching applications'
        });
    }
});

// @desc    Get single chef application
// @route   GET /api/chef-applications/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const application = await ChefApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Full application data, including banking info, for the admin to view
        res.json({
            success: true,
            data: application
        });

    } catch (error) {
        console.error('Get single application error:', error);
        // Handle case where ID format is invalid (e.g., CastError)
        if (error.name === 'CastError') {
             return res.status(400).json({
                success: false,
                message: 'Invalid application ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error fetching application'
        });
    }
});

// @desc    Update application status (Approve/Reject)
// @route   PUT /api/chef-applications/:id/status
// @access  Private/Admin
router.put('/:id/status', /*protect, authorize('admin'), */async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        console.log('🔄 Updating application status:', { 
            id: req.params.id, 
            status, 
            adminNotes 
        });


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

        // Prevent updating if already processed (approved or rejected)
        if (application.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Application has already been ${application.status}`
            });
        }

        application.status = status;
        application.adminNotes = adminNotes || '';
        application.reviewedAt = new Date();
        // Assuming 'req.user' is populated by the 'protect' middleware
        application.reviewedBy = 'admin-001'; //req.user._id; // Store admin user ID who reviewed

        await application.save();
        console.log('✅ Application status updated successfully');


        // TODO: Send email notification to applicant (e.g., using a separate service function)

        res.json({
            success: true,
            message: `Application ${status} successfully`,
            data: application
        });

    } catch (error) {
        console.error('Update application status error:', error);
         
        res.status(500).json({
            success: false,
            message: 'Server error updating application status'
        });
    }
});


// @desc    Get application statistics overview
// @route   GET /api/chef-applications/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
    try {
        // Aggregate to count applications by status
        const stats = await ChefApplication.aggregate([
            {
                $group: {
                    _id: '$status', // Group by the status field
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await ChefApplication.countDocuments();
        
        // Initialize an object with default zero counts
        const statsObj = {
            total,
            pending: 0,
            approved: 0,
            rejected: 0
        };

        // Populate the object with counts from the aggregation result
        stats.forEach(stat => {
            // stat._id will be 'pending', 'approved', or 'rejected'
            statsObj[stat._id] = stat.count;
        });

        // Recent applications (last 7 days) for a time series chart
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Calculate the date 7 days ago

        const recentStats = await ChefApplication.aggregate([
            {
                // Filter documents applied in the last 7 days
                $match: {
                    appliedAt: { $gte: oneWeekAgo }
                }
            },
            {
                // Group by the formatted date string to count daily applications
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sort by date ascending
        ]);

        res.json({
            success: true,
            data: {
                overview: statsObj,
                recent: recentStats // Time-series data
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching statistics'
        });
    }
});

module.exports = router;