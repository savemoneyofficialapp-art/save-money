const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: String,

  monthlyAmount: Number,
  years: Number,
  rate: Number,

  totalPlanAmount: Number,
  totalInterest: Number,
  maturityAmount: Number,

  monthsPaid: {
    type: Number,
    default: 1
  },

  nextRenewDate:{type: Date},

  history: [
    {
      amount: Number,
      date: Date
    }
  ],

  startDate: Date,

  status: {
    type: String,
    default: "Active"
  },

  referralBonusGiven: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Investment", schema);