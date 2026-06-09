const mongoose = require("mongoose");

const walletHistorySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true
    },

    type: {
      type: String,
      enum: ["Credit", "Debit"],
      required: true
    },

    amount: {
      type: Number,
      default: 0
    },

    title: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      default: "Success"
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletHistory", walletHistorySchema);