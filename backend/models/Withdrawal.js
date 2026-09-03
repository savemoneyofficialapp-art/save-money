const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String },
    accountDetails: { type: String },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Withdrawal ||
  mongoose.model("Withdrawal", withdrawalSchema);
