const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: String,
  lastClaimDate: Date,
  totalReward: { type: Number, default: 0 },
  history: [
    {
      amount: Number,
      date: Date,
      status: String
    }
  ]
});

module.exports = mongoose.model("DailyReward", schema);