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

    // Referral Bonus / Performance Bonus / Team Bonus / Royalty Bonus
    type: {
      type: String,
      default: ""
    },

    // referral / performance / team / royalty
    bonusType: {
  type: String,
  default: ""
}

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

    status: {
      type: String,
      default: "Paid"
    },

    refId: {
      type: String,
      default: ""
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "BonusLedger",
  bonusLedgerSchema
);
