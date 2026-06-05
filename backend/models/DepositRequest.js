const mongoose = require("mongoose");

const DepositRequestSchema = new mongoose.Schema({
  email: String,
  amount: Number,
  txnId: String,
  transactionId: String,
  screenshot: String,
  rejectReason: String,
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