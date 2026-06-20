const mongoose = require("mongoose");

const bonusLedgerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true
    },

    fromEmail: {
      type: String,
      default: "",
      lowercase: true
    },

    fromName: {
      type: String,
      default: ""
    },

    bonusType: {
      type: String,
      enum: ["referral", "performance", "team", "royalty"],
      required: true
    },

    level: {
      type: Number,
      default: 0
    },

    amount: {
      type: Number,
      default: 0
    },

    businessAmount: {
      type: Number,
      default: 0
    },

    note: {
      type: String,
      default: ""
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BonusLedger", bonusLedgerSchema);
