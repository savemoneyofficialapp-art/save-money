const mongoose = require("mongoose");

const schema = new mongoose.Schema({

  email: String,

  type: String,

  amount: Number,

  status: {
    type: String,
    default: "Success"
  },

  note: String,

  date: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("WalletHistory", schema);