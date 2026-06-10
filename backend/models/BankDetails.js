const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },
    accountHolderName: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    accountNumber: {
      type: String,
      required: true
    },
    ifscCode: {
      type: String,
      required: true,
      uppercase: true
    },
    upiId: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankDetails", bankDetailsSchema);