const mongoose = require("mongoose");

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

  referralIncome: {
  type: Number,
  default: 0
},

performanceIncome: {
  type: Number,
  default: 0
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
  kycStatus: {
  type: String,
  enum: [
    "none",
    "pending",
    "reviewing",
    "approved",
    "rejected"
  ],
  default: "none"
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

  // 🔹 INVESTMENT SUMMARY (optional quick access)
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
  default: ""
},
resetOtpExpire: {
  type: Date,
  default: null
},

performanceBonusEnabled: {
  type: Boolean,
  default: false
},

performanceActivatedAt: Date,

teamBonusEnabled: {
  type: Boolean,
  default: false
},

royaltyBonusEnabled: {
  type: Boolean,
  default: false
},

royaltyActivatedAt: Date,

});

module.exports = mongoose.model("User", userSchema);
