const Subscription = require("../models/Subscription");
const Chef = require("../models/Chef");
const Payment = require("../models/Payment");

// Create new subscription
exports.createSubscription = async (req, res) => {
  try {
    const {
      chefId,
      planType,
      duration,
      startDate,
      deliveryAddress,
      preferences,
    } = req.body;

    // Validate chef availability
    await Subscription.canCreateSubscription(chefId, new Date(startDate));

    // Calculate price based on plan and duration
    const price = calculateSubscriptionPrice(planType, duration);

    // Create subscription
    const subscription = await Subscription.create({
      customer: req.user.id,
      chef: chefId,
      plan: {
        type: planType,
        duration,
        price,
        mealsPerDay: planType === "both" ? 2 : 1,
        daysPerWeek: 6,
      },
      startDate: new Date(startDate),
      deliveryAddress,
      preferences,
      status: "pending_payment",
      paymentStatus: "pending",
    });

    res.status(201).json({
      status: "success",
      message: "Subscription created successfully. Please complete payment.",
      data: {
        subscription,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get customer subscriptions
exports.getCustomerSubscriptions = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Authorization check
    if (req.user.role !== "admin" && req.user.id !== customerId) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Optional status filter

    const filter = { customer: customerId };
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter)
      .populate("chef", "name profileImage rating location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments(filter);

    res.status(200).json({
      status: "success",
      results: subscriptions.length,
      data: {
        subscriptions,
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

// Get chef's active subscribers
exports.getChefSubscribers = async (req, res) => {
  try {
    const { chefId } = req.params;

    // Authorization check
    if (req.user.role !== "admin" && req.user.id !== chefId) {
      const chef = await Chef.findOne({ user: req.user.id });
      if (!chef || chef._id.toString() !== chefId) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const subscriptions = await Subscription.find({
      chef: chefId,
      status: "active",
    })
      .populate("customer", "name email phone profileImage")
      .populate("chef", "name")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments({
      chef: chefId,
      status: "active",
    });

    // Get subscription stats for chef
    const stats = await Subscription.aggregate([
      {
        $match: {
          chef: mongoose.Types.ObjectId(chefId),
          status: "active",
        },
      },
      {
        $group: {
          _id: "$plan.type",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$plan.price" },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: subscriptions.length,
      data: {
        subscriptions,
        stats,
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

// Helper function to calculate subscription price
const calculateSubscriptionPrice = (planType, duration) => {
  const basePrices = {
    lunch: 70,
    dinner: 80,
    both: 140,
  };

  const durationMultipliers = {
    weekly: 6, // 6 days per week
    monthly: 24, // 4 weeks
    quarterly: 72, // 12 weeks
  };

  return basePrices[planType] * durationMultipliers[duration];
};
