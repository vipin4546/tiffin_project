const Chef = require("../models/Chef");
const User = require("../models/User");

// Register new chef
exports.registerChef = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      cuisineSpecialties,
      bio,
      experience,
      address,
      city,
      state,
      zipCode,
      deliveryRadius,
      fssaiNumber,
      fssaiImage,
      idProofType,
      idProofNumber,
      idProofImage,
      mealTypes,
      maxDailyOrders,
      kitchenImages,
    } = req.body;

    // Check if user already has a chef profile
    const existingChef = await Chef.findOne({ user: req.user.id });
    if (existingChef) {
      return res.status(400).json({
        status: "error",
        message: "You already have a chef profile",
      });
    }

    // Check if email is already registered
    const existingEmail = await Chef.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        status: "error",
        message: "Email is already registered with another chef",
      });
    }

    // Create new chef profile
    const newChef = await Chef.create({
      user: req.user.id,
      name,
      email,
      phone,
      cuisineSpecialties,
      bio,
      experience,
      location: {
        address,
        city,
        state,
        zipCode,
        deliveryRadius: deliveryRadius || 10,
      },
      profileImage: req.body.profileImage || null,
      kitchenImages,
      fssaiLicense: {
        number: fssaiNumber,
        image: fssaiImage,
        verified: false,
      },
      idProof: {
        type: idProofType,
        number: idProofNumber,
        image: idProofImage,
      },
      mealTypes,
      subscriptionSettings: {
        maxDailyOrders: maxDailyOrders || 30,
      },
      status: "pending",
    });

    // Update user role to chef (pending approval)
    await User.findByIdAndUpdate(req.user.id, {
      $set: { role: "chef" },
    });

    res.status(201).json({
      status: "success",
      message: "Chef profile created successfully. Waiting for admin approval.",
      data: {
        chef: newChef,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get pending chefs (Admin only)
exports.getPendingChefs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pendingChefs = await Chef.find({ status: "pending" })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Chef.countDocuments({ status: "pending" });

    res.status(200).json({
      status: "success",
      results: pendingChefs.length,
      data: {
        chefs: pendingChefs,
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get approved chefs for menu page
exports.getApprovedChefs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: "approved" };

    // Add location filter if provided
    if (req.query.city) {
      filter["location.city"] = new RegExp(req.query.city, "i");
    }

    // Add cuisine filter if provided
    if (req.query.cuisine) {
      filter.cuisineSpecialties = { $in: [req.query.cuisine] };
    }

    const approvedChefs = await Chef.find(filter)
      .select("-fssaiLicense -idProof -rejectionReason -approvedBy")
      .populate("user", "name profileImage")
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Chef.countDocuments(filter);

    res.status(200).json({
      status: "success",
      results: approvedChefs.length,
      data: {
        chefs: approvedChefs,
      },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Admin approve chef
exports.approveChef = async (req, res) => {
  try {
    const { chefId } = req.params;

    const chef = await Chef.findById(chefId);
    if (!chef) {
      return res.status(404).json({
        status: "error",
        message: "Chef not found",
      });
    }

    if (chef.status === "approved") {
      return res.status(400).json({
        status: "error",
        message: "Chef is already approved",
      });
    }

    // Update chef status to approved
    const updatedChef = await Chef.findByIdAndUpdate(
      chefId,
      {
        status: "approved",
        approvedAt: Date.now(),
        approvedBy: req.user.id,
        "fssaiLicense.verified": true,
        "subscriptionSettings.isAcceptingOrders": true,
      },
      { new: true, runValidators: true }
    ).populate("user", "name email");

    // Update user role to approved chef
    await User.findByIdAndUpdate(chef.user, {
      $set: { role: "chef" },
    });

    res.status(200).json({
      status: "success",
      message: "Chef approved successfully",
      data: {
        chef: updatedChef,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Admin reject chef
exports.rejectChef = async (req, res) => {
  try {
    const { chefId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: "error",
        message: "Rejection reason is required",
      });
    }

    const chef = await Chef.findById(chefId);
    if (!chef) {
      return res.status(404).json({
        status: "error",
        message: "Chef not found",
      });
    }

    // Update chef status to rejected
    const updatedChef = await Chef.findByIdAndUpdate(
      chefId,
      {
        status: "rejected",
        rejectionReason: reason,
        approvedBy: req.user.id,
        "subscriptionSettings.isAcceptingOrders": false,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      message: "Chef rejected successfully",
      data: {
        chef: updatedChef,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get chef by ID
exports.getChefById = async (req, res) => {
  try {
    const { chefId } = req.params;

    const chef = await Chef.findById(chefId)
      .populate("user", "name email phone profileImage")
      .populate("approvedBy", "name");

    if (!chef) {
      return res.status(404).json({
        status: "error",
        message: "Chef not found",
      });
    }

    // Hide sensitive information for non-admin users
    if (req.user.role !== "admin") {
      chef.fssaiLicense = undefined;
      chef.idProof = undefined;
      chef.rejectionReason = undefined;
    }

    res.status(200).json({
      status: "success",
      data: {
        chef,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get current user's chef profile
exports.getMyChefProfile = async (req, res) => {
  try {
    const chef = await Chef.findOne({ user: req.user.id })
      .populate("user", "name email phone profileImage")
      .populate("approvedBy", "name");

    if (!chef) {
      return res.status(404).json({
        status: "error",
        message: "Chef profile not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        chef,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
