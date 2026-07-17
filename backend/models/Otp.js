const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 // ১০ মিনিট পর ডাটাবেজ থেকে অটোমেটিক ডিলিট হয়ে যাবে
  }
});

// মঙ্গুস অলরেডি এই মডেল তৈরি করে থাকলে সেটি ব্যবহার করবে, নাহলে নতুন বানাবে
module.exports = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
