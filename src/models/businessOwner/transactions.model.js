const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    paymentGateway: {
      type: String,
      enum: ["stripe"],
      default: "stripe",
    },
    transactionId: String,
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paidAt: Date,
  },
  { timestamps: true }
);
module.exports = mongoose.model("Transaction", transactionSchema);