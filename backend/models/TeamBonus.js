const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: String,

  challengeStart: Date,
  directCount: { type: Number, default: 0 },

  isActive: { type: Boolean, default: false },
  isFailed: { type: Boolean, default: false },

  wallet: { type: Number, default: 0 },

  history: [
    {
      fromUser: String,
      level: Number,
      amount: Number,
      date: Date,
      status: String
    }
  ]
});

module.exports = mongoose.model("TeamBonus", schema);
