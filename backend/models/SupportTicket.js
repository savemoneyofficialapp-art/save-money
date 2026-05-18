const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: String,
  subject: String,
  message: String,

  status: {
    type: String,
    default: "Open"
  },

  replies: [
    {
      sender: String,
      message: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SupportTicket", schema);