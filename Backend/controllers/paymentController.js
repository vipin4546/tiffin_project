const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");

// Create payment record
exports.createPayment = async (req, res) => {
  try {
    const {
      subscriptionId,
      amount,
      paymentMethod,
      paymentGateway,
      gatewayPaymentId,
      gatewayOrderId,
      billingPeriod,
    } = req.body;

    // Verify subscription exists and belongs to customer
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      customer: req.user.id,
    });

    if (!subscription) {
      return res.status(404).json({
        status: "error",
        message: "Subscription not found",
      });
    }

    // Create payment record
    const payment = await Payment.create({
      customer: req.user.id,
      chef: subscription.chef,
      subscription: subscriptionId,
      amount,
      paymentMethod,
      paymentGateway,
      gatewayPaymentId,
      gatewayOrderId,
      billingPeriod,
      status: "pending",
    });

    res.status(201).json({
      status: "success",
      message: "Payment record created",
      data: {
        payment,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, gatewayPaymentId, refundDetails } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        status: "error",
        message: "Payment not found",
      });
    }

    // Update payment status
    payment.status = status;
    if (gatewayPaymentId) payment.gatewayPaymentId = gatewayPaymentId;

    if (status === "refunded" && refundDetails) {
      payment.refund = {
        amount: refundDetails.amount || payment.amount,
        reason: refundDetails.reason,
        processedAt: new Date(),
        gatewayRefundId: refundDetails.gatewayRefundId,
      };
    }

    await payment.save();

    res.status(200).json({
      status: "success",
      message: "Payment status updated",
      data: {
        payment,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get customer payments
exports.getCustomerPayments = async (req, res) => {
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

    const payments = await Payment.find({ customer: customerId })
      .populate("chef", "name profileImage")
      .populate("subscription", "plan")
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ customer: customerId });

    res.status(200).json({
      status: "success",
      results: payments.length,
      data: {
        payments,
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

// Get chef earnings
exports.getChefEarnings = async (req, res) => {
  try {
    const { chefId } = req.params;

    // Authorization check
    if (req.user.role !== "admin") {
      const chef = await Chef.findOne({ user: req.user.id });
      if (!chef || chef._id.toString() !== chefId) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }
    }

    const { period = "monthly" } = req.query;
    const startDate = getPeriodStartDate(period);
    const endDate = new Date();

    // Get earnings for the period
    const earnings = await Payment.getChefEarnings(chefId, startDate, endDate);

    // Get payment history for the period
    const payments = await Payment.find({
      chef: chefId,
      status: "success",
      paymentDate: { $gte: startDate, $lte: endDate },
    })
      .populate("customer", "name")
      .populate("subscription", "plan")
      .sort({ paymentDate: -1 })
      .limit(20);

    res.status(200).json({
      status: "success",
      data: {
        earnings,
        payments,
        period: {
          start: startDate,
          end: endDate,
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
