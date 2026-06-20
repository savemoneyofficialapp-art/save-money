const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: String,

  challengeStart: Date,

  totalDirect: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: false
  },

  isFailed: {
    type: Boolean,
    default: false
  },

  thisMonthBonus: {
    type: Number,
    default: 0
  },

  lastMonthBonus: {
    type: Number,
    default: 0
  },

  totalBonus: {
    type: Number,
    default: 0
  },

  history: [
    {
      fromUser: String,
      amount: Number,
      plan: String,
      date: Date,
      status: String
    }
  ]
});

module.exports = mongoose.model("PerformanceBonus", schema);
