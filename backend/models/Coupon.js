const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountAmount: { type: Number, required: true }, // যেমন: 300, 500, 250
  expiryDate: { type: Date, required: true },       // কুপনের মেয়াদ বা ভ্যালিডিটি
  isActive: { type: Boolean, default: true }        // কুপনটি সচল আছে কিনা
});

module.exports = mongoose.model("Coupon", couponSchema);

