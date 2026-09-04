const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    name: { 
      type: String 
    },
    email: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0
    },
    paymentMethod: { 
      type: String, 
      default: "Bank Transfer" 
    },
    accountDetails: { 
      type: String 
    },
    bankDetails: {
      holderName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifsc: { type: String, default: "" }
    },
    status: { 
      type: String, 
      enum: ["Pending", "Success", "Rejected"],
      default: "Pending" 
    },
    rejectReason: { 
      type: String, 
      default: "" 
    }
  },
  { 
    timestamps: true 
  }
);

module.exports =
  mongoose.models.Withdrawal ||
  mongoose.model("Withdrawal", withdrawalSchema);
