const Review = require("../models/Review");
const Subscription = require("../models/Subscription");

// Create new review
exports.createReview = async (req, res) => {
  try {
    const { chefId, subscriptionId, rating, comment, aspects, images } =
      req.body;

    // Validate if customer can review
    await Review.canCustomerReview(req.user.id, chefId, subscriptionId);

    // Validate aspects if provided
    if (aspects) {
      const validAspects = ["taste", "quantity", "packaging", "delivery"];
      for (const aspect of validAspects) {
        if (aspects[aspect] && (aspects[aspect] < 1 || aspects[aspect] > 5)) {
          return res.status(400).json({
            status: "error",
            message: `${aspect} rating must be between 1 and 5`,
          });
        }
      }
    }

    // Create review
    const review = await Review.create({
      customer: req.user.id,
      chef: chefId,
      subscription: subscriptionId,
      rating,
      comment,
      aspects: aspects || {},
      images: images || [],
      isVerified: true, // Mark as verified since we validated subscription
    });

    // Populate customer details for response
    await review.populate("customer", "name profileImage");

    res.status(201).json({
      status: "success",
      message: "Review submitted successfully",
      data: {
        review,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all reviews for a chef
exports.getChefReviews = async (req, res) => {
  try {
    const { chefId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || "recent"; // recent, helpful, highest, lowest
    const filterRating = req.query.rating ? parseInt(req.query.rating) : null;

    // Build filter object
    const filter = {
      chef: chefId,
      status: "active",
    };

    // Add rating filter if provided
    if (filterRating && filterRating >= 1 && filterRating <= 5) {
      filter.rating = filterRating;
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case "helpful":
        sort = { "helpful.count": -1, createdAt: -1 };
        break;
      case "highest":
        sort = { rating: -1, createdAt: -1 };
        break;
      case "lowest":
        sort = { rating: 1, createdAt: -1 };
        break;
      case "recent":
      default:
        sort = { createdAt: -1 };
        break;
    }

    const reviews = await Review.find(filter)
      .populate("customer", "name profileImage")
      .populate("response.by", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    // Get rating statistics
    const ratingStats = await Review.aggregate([
      {
        $match: {
          chef: mongoose.Types.ObjectId(chefId),
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

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach((stat) => {
      distribution[stat._id] = stat.count;
    });

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
        statistics: {
          totalReviews: total,
          ratingDistribution: distribution,
          averageRating: await calculateAverageRating(chefId),
        },
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

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found",
      });
    }

    const helpfulCount = await review.markHelpful(req.user.id);

    res.status(200).json({
      status: "success",
      message: "Review marked as helpful",
      data: {
        helpfulCount,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Add response to review (Chef only)
exports.addResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { message } = req.body;

    // Verify the chef owns this review
    const review = await Review.findOne({
      _id: reviewId,
      chef: req.chef._id,
    });

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found or access denied",
      });
    }

    // Check if response already exists
    if (review.response.message) {
      return res.status(400).json({
        status: "error",
        message: "Response already exists for this review",
      });
    }

    review.response = {
      by: req.user.id,
      message,
      respondedAt: new Date(),
    };

    await review.save();
    await review.populate("response.by", "name");

    res.status(200).json({
      status: "success",
      message: "Response added successfully",
      data: {
        review,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get customer's reviews
exports.getMyReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ customer: req.user.id })
      .populate("chef", "name profileImage rating")
      .populate("response.by", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ customer: req.user.id });

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
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

// Helper function to calculate average rating
const calculateAverageRating = async (chefId) => {
  const result = await Review.aggregate([
    {
      $match: {
        chef: mongoose.Types.ObjectId(chefId),
        status: "active",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0
    ? {
        average: Math.round(result[0].averageRating * 10) / 10,
        total: result[0].totalReviews,
      }
    : { average: 0, total: 0 };
};
