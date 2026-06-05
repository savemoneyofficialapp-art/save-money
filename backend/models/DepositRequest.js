const mongoose = require("mongoose");

const DepositRequestSchema = new mongoose.Schema({
  email: String,
  amount: Number,
  txnId: String,
  screenshot: String,
  status: {
    type: String,
    default: "pending"
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "DepositRequest",
  DepositRequestSchema
);