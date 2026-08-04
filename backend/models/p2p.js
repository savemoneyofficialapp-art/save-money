const mongoose = require("mongoose");

// P2P Registration Schema
const p2pUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  walletId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, default: "" },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const P2PUser = mongoose.model("P2PUser", p2pUserSchema);

// P2P Review Schema
const p2pReviewSchema = new mongoose.Schema({
  senderWalletId: { type: String, required: true },
  reviewerEmail: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const P2PReview = mongoose.model("P2PReview", p2pReviewSchema);


module.exports = {
  P2PUser,
  P2PReview
};


