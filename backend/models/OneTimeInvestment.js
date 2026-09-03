const mongoose = require("mongoose");

const oneTimeInvestmentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: String,
      required: true, // উদাহরণ: "15 Days (0.6%)"
    },
    frequency: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
      default: "Daily",
    },
    dailyReturn: {
      type: Number,
      default: 0,
    },
    totalReturn: {
      type: Number,
      default: 0,
    },
    totalPayout: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    maturityDate: {
      type: Date,
    },
  },
  {
    timestamps: true, // এতে অটোমেটিক createdAt এবং updatedAt যুক্ত হবে
  }
);

module.exports =
  mongoose.models.OneTimeInvestment ||
  mongoose.model("OneTimeInvestment", oneTimeInvestmentSchema);
