const mongoose = require("mongoose");

const royaltySchema = new mongoose.Schema({

  email: String,

  directCount: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: false
  },

  wallet: {
    type: Number,
    default: 0
  },

  thisMonthTurnover: {
    type: Number,
    default: 0
  },

  history: [
    {
      fromUser: String,
      investAmount: Number,
      royalty: Number,
      date: Date
    }
  ]

});

module.exports = mongoose.model(
  "RoyaltyBonus",
  royaltySchema
);
