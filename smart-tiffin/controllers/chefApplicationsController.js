const ChefApplication = require('../models/ChefApplication');
const Cook = require('../models/Cook');
const User = require('../models/User');
const { generateRandomPassword, generateCookEmail } = require('../utils/passwordGenerator');

// @desc    Submit chef application
// @route   POST /api/chef-applications
// @access  Public
exports.submitApplication = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      dob,
      city,
      experience,
      kitchenName,
      cuisine,
      fssaiLicense,
      maxOrders,
      kitchenAddress,
      equipment,
      accountHolder,
      accountNumber,
      ifscCode,
      bankName,
      motivation
    } = req.body;

    console.log('📥 Received application:', { fullName, email, kitchenName });

    // Basic validation
    if (!fullName || !email || !phone || !kitchenName || !cuisine) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    // Check if application already exists with this email
    const existingApplication = await ChefApplication.findOne({ email });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Application already submitted with this email'
      });
    }

    // Create new application
    const application = await ChefApplication.create({
      fullName,
      email,
      phone,
      dob,
      city,
      experience,
      kitchenName,
      cuisine,
      fssaiLicense: fssaiLicense || '',
      maxOrders,
      kitchenAddress,
      equipment,
      accountHolder,
      accountNumber,
      ifscCode,
      bankName,
      motivation,
      status: 'pending'
    });

    console.log('✅ Application saved to database:', application._id);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! We will review it within 2-3 business days.',
      data: application
    });

  } catch (error) {
    console.error('❌ Application submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during application submission'
    });
  }
};

// @desc    Get all chef applications
// @route   GET /api/chef-applications
// @access  Public (Temporarily)
exports.getApplications = async (req, res) => {
  try {
    console.log('📥 GET Applications request received');
    
    const applications = await ChefApplication.find().sort({ createdAt: -1 });
    
    console.log(`📊 Found ${applications.length} applications in database`);

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });

  } catch (error) {
    console.error('❌ Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications'
    });
  }
};

// @desc    Get single application
// @route   GET /api/chef-applications/:id
// @access  Public (Temporarily)
exports.getApplication = async (req, res) => {
  try {
    const application = await ChefApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application'
    });
  }
};

// @desc    Update application status
// @route   PUT /api/chef-applications/:id/status
// @access  Public (Temporarily)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    console.log('🔄 Updating application status:', { id, status });

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const application = await ChefApplication.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application status
    application.status = status;
    if (adminNotes) {
      application.adminNotes = adminNotes;
    }
    
    await application.save();

    console.log('✅ Application status updated:', status);

    // ✅ FIXED: If approved, create cook account and send credentials in response
    if (status === 'approved') {
      try {
        const cookCredentials = await createCookAccount(application);
        console.log('✅ Cook account created successfully');
        
        return res.status(200).json({
          success: true,
          message: `Application ${status} successfully`,
          data: application,
          cookCredentials: cookCredentials // ✅ Send credentials in response
        });
      } catch (cookError) {
        console.error('❌ Cook account creation failed:', cookError);
        // Still send success but with warning
        return res.status(200).json({
          success: true,
          message: `Application approved but cook account creation failed: ${cookError.message}`,
          data: application,
          warning: 'Cook account creation failed'
        });
      }
    } else {
      // For rejected applications
      return res.status(200).json({
        success: true,
        message: `Application ${status} successfully`,
        data: application
      });
    }

  } catch (error) {
    console.error('❌ Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application'
    });
  }
};

// Helper function to create cook account
async function createCookAccount(application) {
  try {
    console.log('👨‍🍳 Creating cook account for:', application.kitchenName);

    // Generate cook credentials
    const cookEmail = generateCookEmail(application.kitchenName, application._id);
    const cookPassword = generateRandomPassword();

    console.log('🔐 Generated credentials:', { cookEmail, cookPassword });

    // ✅ FIX: Use cookEmail instead of original email for User account
    const user = new User({
      fullName: application.fullName,
      email: cookEmail, // ✅ Use cook email, not original email
      phone: application.phone,
      password: cookPassword, // This will be hashed by User model
      role: 'cook'
    });

    await user.save();
    console.log('✅ User account created:', user._id);

    // Create cook profile
    const cook = new Cook({
      user: user._id,
      cookEmail: cookEmail,
      cookPassword: cookPassword,
      kitchenName: application.kitchenName,
      description: application.motivation,
      cuisineSpecialty: [application.cuisine],
      mealTypes: ['lunch', 'dinner'], // Default meal types
      fssaiLicense: {
        number: application.fssaiLicense || '',
        verified: !!application.fssaiLicense
      },
      maxOrdersPerDay: application.maxOrders || 20,
      deliveryAreas: [application.city],
      bankDetails: {
        accountHolderName: application.accountHolder,
        accountNumber: application.accountNumber,
        ifscCode: application.ifscCode,
        bankName: application.bankName
      },
      isVerified: true,
      verificationStatus: 'approved'
    });

    await cook.save();
    console.log('✅ Cook profile created:', cook._id);

    // Log credentials (in production, send email)
    console.log('📧 Cook Login Credentials:', {
      kitchenName: application.kitchenName,
      email: cookEmail,
      password: cookPassword
    });

    return { cookEmail, cookPassword };

  } catch (error) {
    console.error('❌ Error creating cook account:', error);
    throw new Error('Failed to create cook account: ' + error.message);
  }
}