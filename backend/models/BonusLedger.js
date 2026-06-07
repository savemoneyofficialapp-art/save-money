const mongoose = require("mongoose");

const BonusLedgerSchema = new mongoose.Schema({
  email: String,
  fromEmail: String,
  fromName: String,
  bonusType: String, // performance/team/royalty
  level: Number,
  amount: Number,
  description: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BonusLedger", BonusLedgerSchema);