const mongoose = require("mongoose");

const dailyRewardSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },

    totalReward: {
      type: Number,
      default: 0
    },

    claimCount: {
      type: Number,
      default: 0
    },

    lastClaimDate: {
      type: String,
      default: ""
    },

    history: [
      {
        amount: Number,
        special: {
          type: Boolean,
          default: false
        },
        date: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyReward", dailyRewardSchema);