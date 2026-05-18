const mongoose = require("mongoose");

const schema = new mongoose.Schema({

  email: String,

  amount: Number,

  utr: String,

  screenshot: String,

  status: {
    type: String,
    default: "Pending"
  },

  date: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("AddCash", schema);