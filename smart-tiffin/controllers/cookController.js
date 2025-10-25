const Cook = require('../models/Cook');
const User = require('../models/User');

// @desc    Apply as cook
// @route   POST /api/cooks/apply
// @access  Private
exports.applyAsCook = async (req, res) => {
  try {
    // Check if user is already a cook
    const existingCook = await Cook.findOne({ user: req.user.id });
    if (existingCook) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied as a cook'
      });
    }

    // Update user role to cook
    await User.findByIdAndUpdate(req.user.id, { role: 'cook' });

    const cook = await Cook.create({
      user: req.user.id,
      ...req.body,
      verificationStatus: 'pending'
    });

    // Update session with new role
    req.session.user.role = 'cook';

    res.status(201).json({
      success: true,
      data: cook,
      message: 'Application submitted successfully. Waiting for verification.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get cook profile
// @route   GET /api/cooks/profile
// @access  Private (Cook only)
exports.getCookProfile = async (req, res) => {
  try {
    const cook = await Cook.findOne({ user: req.user.id }).populate('user', 'name email phone');

    if (!cook) {
      return res.status(404).json({
        success: false,
        message: 'Cook profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: cook
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};