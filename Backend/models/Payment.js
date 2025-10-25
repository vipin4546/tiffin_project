const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer reference is required"],
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: [true, "Chef reference is required"],
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: [true, "Subscription reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet"],
      required: [true, "Payment method is required"],
    },
    paymentGateway: {
      type: String,
      enum: ["razorpay", "stripe", "paypal"],
      required: [true, "Payment gateway is required"],
    },
    gatewayPaymentId: {
      type: String,
      required: [true, "Gateway payment ID is required"],
      unique: true,
    },
    gatewayOrderId: {
      type: String,
      required: [true, "Gateway order ID is required"],
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    refund: {
      amount: Number,
      reason: String,
      processedAt: Date,
      gatewayRefundId: String,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    billingPeriod: {
      start: Date,
      end: Date,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Generate invoice number before save
paymentSchema.pre("save", async function (next) {
  if (this.isNew && this.status === "success" && !this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${Date.now()}-${count + 1}`;
  }
  next();
});

// Update chef earnings on successful payment
paymentSchema.post("save", async function (doc) {
  if (doc.status === "success") {
    const Chef = require("./Chef");

    // Update chef's total earnings
    await Chef.findByIdAndUpdate(doc.chef, {
      $inc: {
        "earnings.total": doc.amount,
        "earnings.pending": doc.amount,
      },
    });

    // Update subscription payment status
    const Subscription = require("./Subscription");
    await Subscription.findByIdAndUpdate(doc.subscription, {
      paymentStatus: "paid",
      status: "active",
    });
  }
});

// Indexes for better query performance
paymentSchema.index({ customer: 1 });
paymentSchema.index({ chef: 1 });
paymentSchema.index({ subscription: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ invoiceNumber: 1 });

// Compound indexes for reporting
paymentSchema.index({
  paymentDate: 1,
  status: 1,
});

paymentSchema.index({
  chef: 1,
  paymentDate: 1,
});

// Static method for chef earnings calculation
paymentSchema.statics.getChefEarnings = async function (
  chefId,
  startDate,
  endDate
) {
  const matchStage = {
    chef: mongoose.Types.ObjectId(chefId),
    status: "success",
    paymentDate: { $gte: startDate, $lte: endDate },
  };

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$amount" },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: "$amount" },
      },
    },
  ]);

  return (
    result[0] || { totalEarnings: 0, totalOrders: 0, averageOrderValue: 0 }
  );
};

module.exports = mongoose.model("Payment", paymentSchema);
