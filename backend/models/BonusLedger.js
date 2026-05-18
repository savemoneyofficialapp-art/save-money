const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: String,
  fromEmail: String,
  fromName: String,
  type: String,
  level: Number,
  amount: Number,
  note: String,
  status: { type: String, default: "Paid" },
  refId: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BonusLedger", schema);