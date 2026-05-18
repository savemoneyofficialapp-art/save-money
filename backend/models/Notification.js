const mongoose = require("mongoose");

const schema = new mongoose.Schema({

  email: String,

  title: String,

  message: String,

  read: {
    type: Boolean,
    default: false
  },

  date: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  "Notification",
  schema
);