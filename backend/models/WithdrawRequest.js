const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    name: { type: String, default: "" },
    walletId: { type: String, default: "" },

    amount: { type: Number, required: true },
    walletBalance: { type: Number, default: 0 },
    withdrawableBalance: { type: Number, default: 0 },

    bankDetails: {
      accountHolderName: String,
      mobile: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String
    },

    status: {
      type: String,
      enum: ["Pending", "Success", "Rejected"],
      default: "Pending"
    },

    rejectReason: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    actionDate: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);