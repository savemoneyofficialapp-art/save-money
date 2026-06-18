const mongoose = require("mongoose");

const walletHistorySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    type: {
      type: String,
      enum: [

"Credit",
"Debit",

"Admin Credit",
"Admin Debit",

"Withdraw",
"Withdraw Success",
"Withdraw Refund",

"Daily Reward",

"Transfer Sent",
"Transfer Received",


"Refer Bonus",

"Performance Bonus",

"Team Bonus",

"Royalty Bonus"

],
      default: "Credit"
    },

    amount: {
      type: Number,
      default: 0
    },

    balance:{
type:Number,
default:0
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
