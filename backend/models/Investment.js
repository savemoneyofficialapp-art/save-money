const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    email: String,

    monthlyAmount: Number,
    amount: Number,
    years: Number,
    rate: Number,

    totalPlanAmount: Number,
    totalInterest: Number,
    maturityAmount: Number,

    monthsPaid: {
      type: Number,
      default: 1
    },

    renewCount: {
      type: Number,
      default: 0
    },

    certificateNo: {
      type: String,
      default: ""
    },

    nextRenewDate: Date,
    lastRenewDate: Date,
    startDate: Date,

    renewStatus: {
      type: String,
      default: "Waiting" // Waiting / Open / Overdue / Completed
    },

    

    history: [
      {
        type: {
          type: String,
          default: "START SIP"
        },
        amount: Number,
        date: Date,
        slipNo: String
      }
    ],

    status: {
      type: String,
      default: "Active"
    },

    referralBonusGiven: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Investment", schema);
