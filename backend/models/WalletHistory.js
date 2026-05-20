const mongoose = require("mongoose");

const walletHistorySchema =
  new mongoose.Schema({

    email: String,

    type: String,

    amount: Number,

    note: String,

    date: {
      type: Date,
      default: Date.now
    }

  });

module.exports =
  mongoose.model(
    "WalletHistory",
    walletHistorySchema
  );