const mongoose = require("mongoose");

// ==========================================
// ১. ওটিপি কালেকশন স্কিমা (নতুন যুক্ত করা হলো)
// ==========================================
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

const OtpModel = mongoose.models.Otp || mongoose.model("Otp", otpSchema);

// ==========================================
// ২. ইউজার কালেকশন স্কিমা
// ==========================================
const userSchema = new mongoose.Schema({

  // 🔹 BASIC INFO
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  mobile: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  walletAddress: {
    type: String,
    default: ""
  },

  termsAccepted: {
    type: Boolean,
    default: false
  },
  
  role: {
    type: String,
    default: "user"
  },

  refreshToken: {
    type: String,
    default: ""
  },

  banned: {
    type: Boolean,
    default: false
  },

  freezeWallet: {
    type: Boolean,
    default: false
  },

  disableInvestment: {
    type: Boolean,
    default: false
  },

  disableWithdrawal: {
    type: Boolean,
    default: false
  },

  disableBonus: {
    type: Boolean,
    default: false
  },

  banReason: {
    type: String,
    default: ""
  },

  // 🔹 DOCUMENT INFO
  aadhaar:{
    type:String,
    default:""
  },

  pan:{
    type:String,
    default:""
  },

  aadhaarNumber:{
    type:String,
    default:""
  },

  panNumber:{
    type:String,
    default:""
  },

  referralIncome: {
    type: Number,
    default: 0
  },

  performanceEnabled:{
    type:Boolean,
    default:false
  },

  performanceActivatedAt: {
    type: Date,
    default: null
  },

  performanceActivatedBy: {
    type: String,
    enum: ["AUTO", "ADMIN", "" ],
    default: ""
  },

  performanceCompleted: {
    type: Boolean,
    default: false
  },

  performanceStatus:{
    type:String,
    default:"Pending"
  },

  performanceStartDate:Date,

  performanceExpireDate:Date,

  performanceAdminOverride:{
    type:Boolean,
    default:false
  },

  performanceIncome:{
    type:Number,
    default:0
  },

  royaltyIncome: {
    type: Number,
    default: 0
  },

  referCode: {
    type: String,
    default:""
  },
  
  // 🔹 TEAM / REFERRAL
  referredBy: {
    type: String,
    default: ""
  },

  accountActive: {
    type: Boolean,
    default: false
  },

  activeStatus: {
    type: String,
    default: "Inactive"
  },

  // 🔹 WALLET SYSTEM
  walletId: {
    type: String,
    unique: true
  },

  wallet: {
    type: Number,
    default: 0
  },

  monthlyDirects: {
    type: Number,
    default: 0
  },

  balance: {
    type: Number,
    default: 0 
  },

  // 🔹 KYC STATUS
  kycStatus:{
    type:String,
    enum:[
      "Not Submitted",
      "reviewing",
      "approved",
      "rejected"
    ],
    default:"Not Submitted"
  },

  kycRejectReason:{
     type:String,
     default:""
  },

  // 🔹 FILE UPLOAD PATHS
  aadhaarFile: {
    type: String,
    default: ""
  },

  panFile: {
    type: String,
    default: ""
  },

  photo: {
    type: String,
    default: ""
  },

  // 🔹 INVESTMENT SUMMARY
  activeInvestment: {
    amount: Number,
    years: Number,
    startDate: Date,
    maturityDate: Date,
    status: String
  },

  teamIncome: {
    type: Number,
    default: 0
  },

  // 🔹 ACCOUNT STATUS
  isBlocked: {
    type: Boolean,
    default: false
  },

  // 🔹 CREATED TIME
  createdAt: {
    type: Date,
    default: Date.now
  },

  rank: {
    type: String,
    default: "Starter"
  },

  rankPoints: {
    type: Number,
    default: 0
  },

  totalEarning: {
    type: Number,
    default: 0
  },

  totalDirect: {
    type: Number,
    default: 0
  },

  resetOtp: {
    type: String,
    default: null
  },

  resetOtpExpire: {
    type: Date,
    default: null
  },

  teamBonusEnabled: {
    type: Boolean,
    default: true
  },

  royaltyBonusEnabled: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model("User", userSchema);

// ==========================================
// ৩. দুটি মডেলই অবজেক্ট আকারে এক্সপোর্ট করা হলো
// ==========================================
module.exports = { User, OtpModel };
