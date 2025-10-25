const User = require("../models/User");
const Chef = require("../models/Chef");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Review = require("../models/Review");
const Menu = require("../models/Menu");

// Customer Dashboard
exports.getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Get active subscriptions
    const activeSubscriptions = await Subscription.find({
      customer: customerId,
      status: "active",
    })
      .populate("chef", "name profileImage rating location")
      .sort({ startDate: -1 })
      .limit(5);

    // Get recent payments
    const recentPayments = await Payment.find({
      customer: customerId,
      status: "success",
    })
      .populate("chef", "name")
      .sort({ paymentDate: -1 })
      .limit(5);

    // Get subscription stats
    const subscriptionStats = await Subscription.aggregate([
      {
        $match: { customer: mongoose.Types.ObjectId(customerId) },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get total spent
    const totalSpent = await Payment.aggregate([
      {
        $match: {
          customer: mongoose.Types.ObjectId(customerId),
          status: "success",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Get recent reviews
    const recentReviews = await Review.find({
      customer: customerId,
    })
      .populate("chef", "name profileImage")
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      status: "success",
      data: {
        dashboard: {
          user: {
            name: req.user.name,
            email: req.user.email,
            profileImage: req.user.profileImage,
          },
          overview: {
            activeSubscriptions: activeSubscriptions.length,
            totalSubscriptions: subscriptionStats.reduce(
              (acc, stat) => acc + stat.count,
              0
            ),
            totalSpent: totalSpent[0]?.total || 0,
            reviewsGiven: recentReviews.length,
          },
          activeSubscriptions,
          recentPayments,
          recentReviews,
          subscriptionStats: subscriptionStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Chef Dashboard
exports.getChefDashboard = async (req, res) => {
  try {
    const chefId = req.chef._id;

    // Get active subscribers count
    const activeSubscribers = await Subscription.countDocuments({
      chef: chefId,
      status: "active",
    });

    // Get today's meal count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMeals = await Subscription.aggregate([
      {
        $match: {
          chef: chefId,
          status: "active",
          startDate: { $lte: tomorrow },
          endDate: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          lunchCount: {
            $sum: {
              $cond: [{ $in: ["$plan.type", ["lunch", "both"]] }, 1, 0],
            },
          },
          dinnerCount: {
            $sum: {
              $cond: [{ $in: ["$plan.type", ["dinner", "both"]] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get earnings data
    const earnings = await Payment.aggregate([
      {
        $match: {
          chef: chefId,
          status: "success",
          paymentDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          monthlyEarnings: { $sum: "$amount" },
          totalEarnings: { $sum: "$amount" },
        },
      },
    ]);

    // Get recent reviews with ratings
    const recentReviews = await Review.find({
      chef: chefId,
      status: "active",
    })
      .populate("customer", "name profileImage")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get menu items count
    const menuItemsCount = await Menu.aggregate([
      {
        $match: { chef: chefId },
      },
      {
        $unwind: "$menuItems",
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          availableItems: {
            $sum: {
              $cond: ["$menuItems.isAvailable", 1, 0],
            },
          },
        },
      },
    ]);

    // Get subscription growth (last 30 days)
    const subscriptionGrowth = await Subscription.aggregate([
      {
        $match: {
          chef: chefId,
          status: "active",
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        dashboard: {
          chef: {
            name: req.chef.name,
            rating: req.chef.rating,
            status: req.chef.status,
          },
          overview: {
            activeSubscribers,
            todaysLunchMeals: todaysMeals[0]?.lunchCount || 0,
            todaysDinnerMeals: todaysMeals[0]?.dinnerCount || 0,
            monthlyEarnings: earnings[0]?.monthlyEarnings || 0,
            totalEarnings: req.chef.earnings?.total || 0,
            averageRating: req.chef.rating?.average || 0,
            totalReviews: req.chef.rating?.count || 0,
          },
          recentReviews,
          menuStats: menuItemsCount[0] || { totalItems: 0, availableItems: 0 },
          subscriptionGrowth,
          capacity: {
            maxDailyOrders: req.chef.subscriptionSettings?.maxDailyOrders || 30,
            currentUtilization: Math.round(
              (activeSubscribers /
                (req.chef.subscriptionSettings?.maxDailyOrders || 30)) *
                100
            ),
          },
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    // Get pending chef approvals count
    const pendingChefsCount = await Chef.countDocuments({ status: "pending" });

    // Get total users count
    const usersCount = await User.countDocuments();
    const customersCount = await User.countDocuments({ role: "customer" });
    const chefsCount = await User.countDocuments({ role: "chef" });

    // Get platform analytics
    const platformStats = await Promise.all([
      // Total subscriptions
      Subscription.countDocuments(),
      // Active subscriptions
      Subscription.countDocuments({ status: "active" }),
      // Total revenue
      Payment.aggregate([
        {
          $match: { status: "success" },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),
      // Monthly revenue
      Payment.aggregate([
        {
          $match: {
            status: "success",
            paymentDate: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ),
            },
          },
        },
        {
          $group: {
            _id: null,
            monthlyRevenue: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    // Get recent activities
    const recentActivities = await Promise.all([
      // Recent chef registrations
      Chef.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(5),
      // Recent payments
      Payment.find()
        .populate("customer", "name")
        .populate("chef", "name")
        .sort({ paymentDate: -1 })
        .limit(5),
      // Recent reviews
      Review.find()
        .populate("customer", "name")
        .populate("chef", "name")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Get growth metrics (last 30 days)
    const growthMetrics = await Promise.all([
      // User growth
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      // Chef growth
      Chef.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      // Revenue growth
      Payment.aggregate([
        {
          $match: {
            status: "success",
            paymentDate: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        dashboard: {
          overview: {
            pendingChefs: pendingChefsCount,
            totalUsers: usersCount,
            totalCustomers: customersCount,
            totalChefs: chefsCount,
            totalSubscriptions: platformStats[0],
            activeSubscriptions: platformStats[1],
            totalRevenue: platformStats[2][0]?.totalRevenue || 0,
            monthlyRevenue: platformStats[3][0]?.monthlyRevenue || 0,
          },
          growth: {
            newUsers: growthMetrics[0],
            newChefs: growthMetrics[1],
            recentRevenue: growthMetrics[2][0]?.revenue || 0,
          },
          recentActivities: {
            chefRegistrations: recentActivities[0],
            recentPayments: recentActivities[1],
            recentReviews: recentActivities[2],
          },
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Chef-specific dashboard endpoints
exports.getChefSubscribers = async (req, res) => {
  try {
    const chefId = req.chef._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const subscribers = await Subscription.find({
      chef: chefId,
      status: "active",
    })
      .populate("customer", "name email phone profileImage")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments({
      chef: chefId,
      status: "active",
    });

    res.status(200).json({
      status: "success",
      results: subscribers.length,
      data: {
        subscribers,
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

exports.getChefEarnings = async (req, res) => {
  try {
    const chefId = req.chef._id;
    const period = req.query.period || "monthly"; // weekly, monthly, quarterly, yearly

    const startDate = getPeriodStartDate(period);
    const endDate = new Date();

    const earnings = await Payment.aggregate([
      {
        $match: {
          chef: chefId,
          status: "success",
          paymentDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" },
          },
          dailyEarnings: { $sum: "$amount" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const totalEarnings = earnings.reduce(
      (sum, day) => sum + day.dailyEarnings,
      0
    );
    const totalOrders = earnings.reduce((sum, day) => sum + day.orderCount, 0);

    res.status(200).json({
      status: "success",
      data: {
        period: {
          start: startDate,
          end: endDate,
          type: period,
        },
        totalEarnings,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalEarnings / totalOrders : 0,
        dailyBreakdown: earnings,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getChefReviews = async (req, res) => {
  try {
    const chefId = req.chef._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      chef: chefId,
      status: "active",
    })
      .populate("customer", "name profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      chef: chefId,
      status: "active",
    });

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      {
        $match: {
          chef: chefId,
          status: "active",
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
        ratingStats,
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

// Admin-specific dashboard endpoints
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
        pendingChefs,
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

exports.getUserManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role; // Optional filter by role

    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
        statistics: userStats,
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

exports.getAdminAnalytics = async (req, res) => {
  try {
    const period = req.query.period || "monthly";

    const analytics = await Promise.all([
      // Revenue analytics
      Payment.aggregate([
        {
          $match: {
            status: "success",
            paymentDate: { $gte: getPeriodStartDate(period) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" },
            },
            revenue: { $sum: "$amount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // User growth
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: getPeriodStartDate(period) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            newUsers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Chef growth
      Chef.aggregate([
        {
          $match: {
            createdAt: { $gte: getPeriodStartDate(period) },
            status: "approved",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            newChefs: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        period: {
          start: getPeriodStartDate(period),
          end: new Date(),
          type: period,
        },
        revenueAnalytics: analytics[0],
        userGrowth: analytics[1],
        chefGrowth: analytics[2],
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Helper function to get period start date
const getPeriodStartDate = (period) => {
  const now = new Date();
  switch (period) {
    case "weekly":
      return new Date(now.setDate(now.getDate() - 7));
    case "monthly":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "quarterly":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "yearly":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
};
