require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const nodemailer = require("nodemailer");
const http = require("http");
const { Server } = require("socket.io");
const User = require("./models/User"); 
const Notification = require("./models/Notification");
const Investment = require("./models/Investment");
const {updatePerformanceStatus}=require("./models/PerformanceHelper");
const cron = require("node-cron");
const {getUplines,teamBonusAmount} = require("./models/teamHelper");
const RoyaltyBonus = require("./models/RoyaltyBonus");
const WalletHistory = require("./models/WalletHistory");
const AddCash = require("./models/AddCash");
const DepositRequest = require("./models/DepositRequest");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const DailyReward = require("./models/DailyReward");
const SupportTicket = require("./models/SupportTicket");
const BonusLedger = require("./models/BonusLedger");
const cloudinary = require("cloudinary").v2;
const OtpModel = require("./models/Otp");
const axios = require("axios");
const { CloudinaryStorage } =
require("multer-storage-cloudinary");
const helmet = require("helmet");
const validator = require("validator");
const sanitize = require("mongo-sanitize");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const BankDetails = require("./models/BankDetails");
const WithdrawRequest = require("./models/WithdrawRequest");
const AutoWithdraw = require("./models/AutoWithdraw");
const { P2PUser, P2PReview } = require("./models/p2p");
const sendPushNotification = require("./utils/sendPush");







const app = express();



console.log("SERVER VERSION: CORS TEST ACTIVE");




app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "authorization"]
}));

app.post("/razorpay-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (signature !== expected) {
      return res.status(400).send("Invalid webhook signature");
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      await WalletTransaction.updateOne(
        { razorpayOrderId: payment.order_id },
        {
          $set: {
            status: "Failed",
            description: payment.error_description || "Payment failed",
            razorpayPaymentId: payment.id
          }
        }
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.log("WEBHOOK ERROR:", err);
    res.status(500).send("Webhook error");
  }
});

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const server = http.createServer(app);

const walletTransactionSchema = new mongoose.Schema(
  {
    email: String,
    walletId: String,
    type: String,
    title: String,
    description: String,
    amount: Number,
    status: { type: String, default: "Pending" },

    openingBalance: { type: Number, default: 0 },
    closingBalance: { type: Number, default: 0 },

    fromWalletId: String,
    toWalletId: String,

    razorpayOrderId: String,
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true
    },
    razorpaySignature: String
  },
  { timestamps: true }
);



const WalletTransaction =
  mongoose.models.WalletTransaction ||
  mongoose.model("WalletTransaction", walletTransactionSchema);

// ================= CORS =================

const allowedOrigins = [
  "http://localhost:3000",
  "https://save-moneyy-indol.vercel.app"
];


  
// ================= SOCKET =================

const io = new Server(server, {

  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

// ================= SECURITY =================

app.use(helmet());

app.use(express.json({
  limit: "10mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "10mb"
}));

// ================= SANITIZE =================

app.use((req, res, next) => {

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
});

// ================= ROOT =================

app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send("Save Money Backend Live");
});

app.get("/cors-test", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({ msg: "CORS OK" });
});

// ================= SOCKET USERS =================

const onlineUsers = {};

io.on("connection", (socket) => {

  console.log("User Connected");

  socket.on("join", (email) => {

    onlineUsers[email] = socket.id;

  });

  socket.on("disconnect", () => {

    for (let email in onlineUsers) {

      if (onlineUsers[email] === socket.id) {

        delete onlineUsers[email];

      }

    }

  });

});

app.use(express.urlencoded({ extended: true, limit: "2mb" }));


const auth = async (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ msg: "No token" });
        }

        if (token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }

        // টোকেন ভেরিফাই করা
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ডেটাবেজ থেকে ইউজার বের করা
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ msg: "User not found" });
        }

        // টোকেন ম্যাচিং ভেরিফিকেশন
        if (user.current_token !== token) {
            return res.status(401).json({
                msg: "Token expired or invalid"
            });
        }

        // ========================================================
        // নতুন লজিক: ১০ মিনিট ইন-অ্যাক্টিভিটি চেক (১০ মিনিট = ৬০০,০০০ ms)
        // ========================================================
        const tenMinutes = 10 * 60 * 1000;
        const now = new Date();
        const timeDifference = now - new Date(user.lastActive || now);

        if (timeDifference > tenMinutes) {
            // ইউজার ১০ মিনিট কোনো কাজ করেনি, তাই সেশন ক্লিয়ার করে দেওয়া হলো
            user.current_token = "";
            await user.save();
            return res.status(401).json({ msg: "Token expired or invalid" });
        }

        // ইউজার ব্যানড কিনা চেক
        if (user.banned) {
            return res.status(403).json({
                msg: "Your account is banned.",
                reason: user.banReason || ""
            });
        }

        // ইউজার অ্যাক্টিভ আছে, তাই লাস্ট অ্যাক্টিভ টাইম আপডেট করে দেওয়া হলো
        user.lastActive = now;
        await user.save();

        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({
            msg: "Token expired or invalid"
        });
    }
};




const adminAuth = async (req, res, next) => {

  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        msg: "User not found"
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        msg: "Admin access only"
      });
    }

    if (user.banned) {
      return res.status(403).json({
        msg: "Admin banned"
      });
    }

    next();

  } catch (err) {

    return res.status(500).json({
      msg: "Admin auth failed"
    });

  }

};

console.log("Mongo URL:",process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)
.then(() => {
  console.log("MongoDB Atlas Connected");
})
.catch((err) => {
  console.log("MongoDB Error:", err.message);
});

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET
});


const submitP2pReview = async (ratingVal) => {
  if (!reviewText.trim()) {
    return triggerStatusOverlay("warning", "Please write a review comment");
  }
  try {
    const res = await fetch(`${API}/p2p-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token || ""
      },
      body: JSON.stringify({
        senderWalletId: selectedP2pUser.walletId,
        reviewerEmail: email,
        rating: Number(ratingVal),
        review: reviewText.trim()
      })
    });
    const data = await res.json();
    if (data.success) {
      triggerStatusOverlay("success", "Review submitted successfully! ⭐");
      setReviewText("");
      setReviewModalOpen(false);
      loadP2pUsers();
    } else {
      triggerStatusOverlay("error", data.msg || "Failed to submit review");
    }
  } catch (err) {
    console.log("REVIEW ERROR:", err);
    triggerStatusOverlay("error", "Server connection error");
  }
};




async function payRoyaltyBonus(newInvestorEmail, amount) {

  const newUser = await User.findOne({
    email: newInvestorEmail
  });

  if (!newUser || !newUser.referredBy) return;

  // sponsor = B
  const sponsor = await User.findOne({
    referCode: newUser.referredBy
  });

  if (!sponsor || !sponsor.referredBy) return;

  // owner = A
  const owner = await User.findOne({
    referCode: sponsor.referredBy
  });

  if (!owner) return;

  let rb = await RoyaltyBonus.findOne({
    email: owner.email
  });

  if (!rb || !rb.isActive) return;

  const royalty = Math.floor(amount * 0.01);

  rb.wallet += royalty;

  rb.thisMonthTurnover += amount;

  rb.history.push({
    fromUser: newUser.name,
    investAmount: amount,
    royalty,
    date: new Date()
  });

  await rb.save();

  owner.wallet += royalty;

  await owner.save();
}

async function checkKYC(email) {

  const user = await User.findOne({ email });

  if (!user) {
    return {
      ok: false,
      msg: "User not found"
    };
  }

  if (user.kycStatus !== "approved") {

    return {
      ok: false,
      msg: "Please Complete Your KYC First"
    };

  }

  return {
    ok: true
  };

}


  async function payTeamBonus(newInvestorEmail, investment) {

  try {

    const investor = await User.findOne({
      email: String(newInvestorEmail).toLowerCase()
    });

    if (!investor) return;

    if (!investor.referredBy) return;

    // Only first investment
    const totalInvestments = await Investment.countDocuments({
      email: investor.email.toLowerCase()
    });

    if (totalInvestments !== 1) return;

    const uplines = await getUplines(investor, 5);

    for (const item of uplines) {

      const sponsor = item.user;
      const level = item.level;

      if (!sponsor) continue;

      // Admin disabled
      // Sponsor must be active
if (sponsor.activeStatus !== "Active")
    continue;

// Admin disabled
if (sponsor.teamBonusEnabled === false)
    continue;

// Bonus disabled
if (sponsor.disableBonus)
    continue;

      // Bonus amount
      const amount = teamBonusAmount(level);

      // Level 1 = ₹0
      if (amount <= 0)
        continue;

      await addBonus({

        email: sponsor.email,

        fromEmail: investor.email,

        fromName: investor.name,
        uplineName: sponsor.name,

        type: "Team Bonus",

        level,

        amount,

        note:
          `Level ${level} Team Bonus`,

        refId:
          `TEAM-${investment._id}-L${level}`

      });

    }

  } catch (err) {

    console.log(
      "TEAM BONUS ERROR:",
      err
    );

  }

  }     

async function updateUserRank(email) {
  const user = await User.findOne({ email });
  if (!user) return;

  const directCount = await User.countDocuments({
    referredBy: user.referCode
  });

  user.totalDirect = directCount;

  let rank = "Starter";
  let points = 0;

  if (directCount >= 5) {
    rank = "Bronze";
    points = 100;
  }

  if (directCount >= 10) {
    rank = "Silver";
    points = 300;
  }

  if (directCount >= 25) {
    rank = "Gold";
    points = 700;
  }

  if (directCount >= 50) {
    rank = "Diamond";
    points = 1500;
  }

  if (directCount >= 100) {
    rank = "Crown";
    points = 3000;
  }

  user.rank = rank;
  user.rankPoints = points;

  await user.save();
}

async function addBonus({
  email,
  fromEmail,
  fromName,
  uplineName = "",
  type,
  level = 0,
  amount = 0,
  note = "",
  refId = ""
}) 
{
  try {
    const bonusAmount = Number(amount || 0);
    if (!email || bonusAmount <= 0) return;

    const bonusType = type;

    const exists = await BonusLedger.findOne({
      email: String(email).toLowerCase(),
      bonusType,
      refId
    });

    if (exists) return;

    const user = await User.findOne({
      email: String(email).toLowerCase()
    });

    if (!user) return;
    if (user.disableBonus) return;

    // [MODIFIED] মেইন ওয়ালেটে টাকা অ্যাড হবে না, শুধুমাত্র Today Wallet-এ অ্যাড হবে
    user.todayBalance = Number(user.todayBalance || 0) + bonusAmount;
    user.totalEarning = Number(user.totalEarning || 0) + bonusAmount;

    if (bonusType === "Referral Bonus") {
      user.referralIncome = Number(user.referralIncome || 0) + bonusAmount;
    }

    if (bonusType === "Performance Bonus") {
      user.performanceIncome = Number(user.performanceIncome || 0) + bonusAmount;
    }

    if (bonusType === "Team Bonus") {
      user.teamIncome = Number(user.teamIncome || 0) + bonusAmount;
    }

    if (bonusType === "Royalty Bonus") {
      user.royaltyIncome = Number(user.royaltyIncome || 0) + bonusAmount;
    }

    await user.save();

    // ডুপ্লিকেট বোনাস চেক করার জন্য লেজার ক্রিয়েট সচল রাখা হলো
    await BonusLedger.create({
      email: String(email).toLowerCase(),
      fromEmail,
      fromName: fromName || "User",
      uplineName: uplineName || "",
      type: bonusType,
      bonusType,
      level,
      amount: bonusAmount,
      note,
      status: "Paid",
      refId,
      date: new Date()
    });

    // [REMOVED] এখান থেকে WalletHistory.create মুছে দেওয়া হয়েছে যাতে মেইন হিস্ট্রি তৈরি না হয়

    if (typeof sendNotification === "function") {
      await sendNotification(
        String(email).toLowerCase(),
        bonusType,
        `${bonusType} ₹${bonusAmount} received from ${fromName}`
      );
    }
     // 🔔 Push Notification for Bonus Received
    await sendPushNotification(
      String(email).toLowerCase(),
      "Bonus Received! 🎁",
      `You have received a new bonus of ₹${bonusAmount} in your account.`,
      "/wallet"
    );

  } catch (err) {
    console.log("ADD BONUS ERROR:", err);
  }
}


function referralBonusRate(years) {

  years = Number(years);

  if (years === 1) return 499;
  if (years === 3) return 599;
  if (years === 5) return 699;
  if (years === 10) return 799;

  return 0;
}

function performanceBonusRate(years) {
  if (Number(years) === 1) return 699;
  if (Number(years) === 2) return 799;
  return 899;
}


async function processFirstInvestmentBonuses(investorEmail, investment) {

    try {

        const investor = await User.findOne({
            email: String(investorEmail).toLowerCase()
        });

        if (!investor) return;

        if (!investor.referredBy) return;

        const sponsor = await User.findOne({
            $or: [
                { referCode: investor.referredBy },
                { walletId: investor.referredBy }
            ]
        });

        if (!sponsor) return;

        // Sponsor-এর Active Investment থাকতে হবে
        const sponsorInvestment = await Investment.findOne({
            email: sponsor.email.toLowerCase(),
            status: "Active"
        });

        if (!sponsorInvestment) return;

        // একই First Investment-এ Bonus যেন একবারই যায়
        const refId = `FIRST-${investment._id}`;

        let referralBonus = 0;

        switch (Number(investment.years)) {

            case 1:
                referralBonus = 499;
                break;

            case 3:
                referralBonus = 599;
                break;

            case 5:
                referralBonus = 699;
                break;

            case 10:
                referralBonus = 799;
                break;

            default:
                referralBonus = 0;

        }

        if (referralBonus > 0) {

            await addBonus({

                email: sponsor.email,

                fromEmail: investor.email,

                fromName: investor.name,

                type: "Referral Bonus",

                amount: referralBonus,

                level: 0,

                note: `First Investment (${investment.years} Year)`,

                refId: refId + "-REF"

            });

        }

        // নতুন Direct Active Member যুক্ত হয়েছে,
        // তাই Performance Status Auto Check
        await updatePerformanceStatus(
            sponsor.email
        );

    }

    catch (err) {

        console.log(
            "FIRST INVESTMENT BONUS ERROR:",
            err
        );

    }

}


async function processRenewBonuses(investorEmail, investment) {
    try {
        const investor = await User.findOne({
            email: String(investorEmail).toLowerCase()
        });

        if (!investor) return;
        if (investor.referredBy) return;

        const sponsor = await User.findOne({
            $or: [
                { referCode: investor.referredBy },
                { walletId: investor.referredBy }
            ]
        });

        if (!sponsor) return;

        // Sponsor investment active থাকতে হবে
        const sponsorInvestment = await Investment.findOne({
            email: sponsor.email.toLowerCase(),
            status: "Active"
        });

        if (!sponsorInvestment) return;

        // Performance Bonus Active থাকতে হবে
        if (!sponsor.performanceEnabled) return;
        if (sponsor.performanceStatus !== "Active") return;

        let bonus = 0;

        switch (Number(investment.years)) {
            case 1:
                bonus = 699;
                break;

            case 3:
                bonus = 799;
                break;

            case 5:
                bonus = 899;
                break;

            case 10:
                bonus = 999;
                break;

            default:
                bonus = 0;
        }

        if (bonus > 0) {
            await addBonus({
                email: sponsor.email,
                fromEmail: investor.email,
                fromName: investor.name,
                uplineName: sponsor.name,
                type: "Performance Bonus",
                amount: bonus,
                level: 0,
                note: `Performance Bonus (${investment.years} Year Renewal)`,
                refid: `PERFORMANCE-RENEW-${investment._id}-${investment.monthsPaid}`
            });
        }

        // --- টিম বোনাস রিনিউ লজিক (আপলাইন ৫ লেভেল পর্যন্ত) ---
        const uplines = await getUplines(investor, 5);

        for (const item of uplines) {
            const teamSponsor = item.user;
            const level = item.level;

            if (!teamSponsor) continue;

            // Sponsor active থাকতে হবে
            if (teamSponsor.activeStatus !== "Active") continue;
            if (teamSponsor.teamBonusEnabled === false) continue;
            if (teamSponsor.disableBonus) continue;

            const teamBonusAmt = teamBonusAmount(level);
            if (teamBonusAmt <= 0) continue;

            await addBonus({
                email: teamSponsor.email,
                fromEmail: investor.email,
                fromName: investor.name,
                uplineName: teamSponsor.name,
                type: "Team Bonus",
                level,
                amount: teamBonusAmt,
                note: `Level ${level} Team Bonus (Renewal)`,
                refid: `TEAM-RENEW-${investment._id}-${investment.monthsPaid || 0}-L${level}`
            });
        }

    } catch (err) {
        console.log(
            "PROCESS PERFORMANCE & TEAM RENEW ERROR:",
            err
        );
    }
}

async function updateInvestmentStatus(email) {
  const user = await User.findOne({ email });
  if (!user) return;

  const inv = await Investment.findOne({
    email,
    status: "Active"
  });

  if (!inv) {
    user.accountActive = false;
    user.activeStatus = "Inactive";
    await user.save();
    return;
  }

  const today = new Date();
  const renewStart = new Date(inv.nextRenewDate);
  const renewEnd = new Date(inv.nextRenewDate);
  renewEnd.setDate(renewEnd.getDate() + 5);

  if (today > renewEnd) {
    inv.renewStatus = "Overdue";
    await inv.save();

    user.accountActive = false;
    user.activeStatus = "Inactive";
    await user.save();
    return;
  }

  user.accountActive = true;
  user.activeStatus = "Active";
  await user.save();
}


const createNotification = async (email, message) => {
  await Notification.create({
    email,
    message
  });
};


  // 🌟 Nodemailer SMTP পার্টটি রেন্ডারে টাইমআউট এরর তৈরি করছিল। 
// যেহেতু আপনি নিচে Brevo API ব্যবহার করছেন, তাই SMTP ট্রান্সপোর্টার আর প্রয়োজন নেই।
// ====================================================================
/*
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP ERROR:", error);
  } else {
    console.log("SMTP READY");
  }
});
*/


// ====================================================================
// 🚀 BREVO API EMAIL FUNCTION (এটি আপনার মেইল পাঠানোর মূল লজিক)
// ====================================================================
async function sendEmail(to, subject, message) {
  try {
    // ইমেইল এড্রেস ট্রিম এবং লোয়ারকেস নিশ্চিত করা
    const recipientEmail = to.trim().toLowerCase();

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Save Money",
          email: process.env.EMAIL_USER // নিশ্চিত করুন এই ইমেইলটি Brevo তে ভেরিফাইড সেন্ডার হিসেবে আছে
        },
        to: [
          {
            email: recipientEmail
          }
        ],
        subject: subject,
        htmlContent: `
          <div style="font-family:Arial;padding:20px;border:1px solid #eee;border-radius:5px;">
            <h2 style="color:#7c3aed;margin-bottom:15px;">Save Money Notification</h2>
            <div style="font-size:16px;color:#333;line-height:1.5;">
              ${message}
            </div>
            <p style="font-size:12px;color:#777;margin-top:25px;border-top:1px solid #eee;padding-top:10px;">
              This is an automated message from Save Money platform. Please do not reply directly to this email.
            </p>
          </div>
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY, // Render environment variables এ এটি থাকতে হবে
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`[Brevo API] Email successfully sent to ${recipientEmail}. Message ID:`, response.data.messageId);
    return response.data;

  } catch (mailErr) {
    // এরর ডিবাগিং সহজ করার জন্য বিস্তারিত লগ
    console.log("BREVO API EMAIL ERROR:", mailErr.response?.data || mailErr.message);
    throw mailErr; // এই throw টি আপনার /send-email-otp রাউটকে এরর হ্যান্ডেল করতে সাহায্য করবে
  }
}


app.post("/send-email-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, msg: "Email is required" });
    }

    const lowerEmail = email.trim().toLowerCase();
    
    // ৬ ডিজিটের ওটিপি জেনারেট করুন
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ১. আগের কোনো ওটিপি থাকলে ডাটাবেজ থেকে মুছে দিন
    await OtpModel.deleteMany({ email: lowerEmail });

    // ২. নতুন ওটিপি ডাটাবেজে সেভ করুন
    await OtpModel.create({ email: lowerEmail, otp });

    console.log(`OTP for ${lowerEmail} is: ${otp}`); // কনসোল লগ

    // 🚀 ৩. Brevo API দিয়ে মেইল পাঠানোর আসল লজিক (যা আগে বন্ধ ছিল)
    await sendEmail(
      lowerEmail, 
      "Your OTP Verification Code", 
      `Your OTP verification code is: <strong style="font-size: 20px; color: #7c3aed;">${otp}</strong>. It will expire in 10 minutes.`
    );

    // মেইল সফলভাবে যাওয়ার পরেই কেবল সাকসেস মেসেজ রেসপন্স যাবে
    return res.status(200).json({ success: true, msg: "OTP sent successfully to your email" });

  } catch (err) {
    console.log("SEND OTP ERROR:", err.message);
    return res.status(500).json({ success: false, msg: "Failed to send OTP. Please try again." });
  }
});


app.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, msg: "Email and OTP are required" });
    }

    const lowerEmail = email.trim().toLowerCase();

    // ডাটাবেজে এই ইমেইলের ওটিপি খুঁজুন
    const otpRecord = await OtpModel.findOne({ email: lowerEmail });

    if (!otpRecord) {
      return res.status(400).json({ success: false, msg: "OTP expired or not requested. Please try again." });
    }

    // ওটিপি চেক করুন
    if (otpRecord.otp !== otp.trim()) {
      return res.status(400).json({ success: false, msg: "Invalid OTP. Please try again." });
    }

    // ওটিপি মিলে গেলে ডাটাবেজে ভেরিফাইড ফ্ল্যাগটি ট্রু করে দিন
    otpRecord.isVerified = true;
    await otpRecord.save();

    return res.status(200).json({ success: true, msg: "Email verified successfully!" });

  } catch (err) {
    console.log("VERIFY OTP ERROR:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});



const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const getRate = (y) => {
  if (y == 1) return 11;
  if (y == 3) return 14;
  return 20;
};




// 👉 static folder (image দেখার জন্য)
app.use("/uploads", express.static("uploads"));

// ================= STORAGE =================

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {

    let folder = "save-money";

    if (file.fieldname === "aadhaarFile") {
      folder = "save-money/aadhaar";
    }

    if (file.fieldname === "panFile") {
      folder = "save-money/pan";
    }

    if (file.fieldname === "photo") {
      folder = "save-money/photo";
    }

    return {
      folder,
      allowed_formats: [
        "jpg",
        "png",
        "jpeg",
        "webp"
      ],

      public_id:
        Date.now() +
        "-" +
        file.originalname
    };
  }
});

const upload = multer({ storage });

// ================= MODELS =================

const OTP = mongoose.model("OTP", {
  mobile: String,
  email: String,
  otp: String,
  expiresAt: Date
});

const Txn = mongoose.model("Txn", {
  email: String,
  amount: Number,
  status: String,
  type: String,
  date: String,
  screenshot: String
});

// helper
const makeCode = () => Math.random().toString(36).substring(2, 8);

async function generateShortWalletId() {
  let walletId;
  let exists = true;

  while (exists) {
    walletId = "WAL" + Math.floor(100000 + Math.random() * 900000);
    exists = await User.findOne({ walletId });
  }

  return walletId;
}

// ================= REGISTER WITH T&C AND OTP VERIFICATION =================

         app.post("/register", async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const {
      name,
      mobile,
      email,
      password,
      referCode,
      otp,
      termsAccepted
    } = req.body;

    // ১. সব রিকোয়ার্ড ফিল্ড ভ্যালিডেশন
    if (!name || !mobile || !email || !password || !otp) {
      return res.status(400).json({ msg: "Please fill all required fields and enter OTP" });
    }

    const lowerEmail = email.trim().toLowerCase();

    // ২. Terms & Conditions চেক
    if (!termsAccepted) {
      return res.status(400).json({ msg: "You must accept the Terms and Conditions to register." });
    }

    // ৩. ইমেইল ভ্যালিডেশন
    if (!validator.isEmail(lowerEmail)) {
      return res.status(400).json({ msg: "Invalid email" });
    }

    // ৪. ডাটাবেজ থেকে ওটিপি স্ট্যাটাস চেক করুন (নতুন ডাটাবেজ লজিক)
    const otpRecord = await OtpModel.findOne({ email: lowerEmail });

    if (!otpRecord || !otpRecord.isVerified) {
      return res.status(400).json({ msg: "Please verify your email OTP first." });
    }

    // ৫. ওটিপি রেকর্ড ডাটাবেজ থেকে ডিলিট করে দিন (ক্লিনআপ)
    await OtpModel.deleteOne({ email: lowerEmail });

    // ৬. পাসওয়ার্ড স্ট্রং কিনা চেক
    if (!validator.isStrongPassword(password, {
        minLength: 6, minNumbers: 1, minLowercase: 1, minUppercase: 1, minSymbols: 0
      })) {
      return res.status(400).json({ msg: "Password must contain letters and numbers" });
    }

    // ৭. ডুপ্লিকেট ইমেইল চেক
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // ৮. ডুপ্লিকেট মোবাইল চেক
    const existingMobile = await User.findOne({ mobile: mobile.trim() });
    if (existingMobile) {
      return res.status(400).json({ msg: "Mobile already registered" });
    }

    // ৯. পাসওয়ার্ড হ্যাশিং
    const hashedPassword = await bcrypt.hash(password, 10);
    const myReferCode = "SM" + Math.floor(100000 + Math.random() * 900000);
    const walletId = await generateShortWalletId();

    let referredBy = "";
    if (referCode) {
      const refUser = await User.findOne({ referCode: referCode.trim() });
      if (refUser) referredBy = referCode.trim();
    }

    // ১০. নতুন ইউজার তৈরি
    const newUser = new User({
      name: name.trim(),
      mobile: mobile.trim(),
      email: lowerEmail,
      password: hashedPassword,
      referCode: myReferCode,
      referredBy,
      walletId: walletId,
      role: "user",
      activeStatus: "Inactive",
      kycStatus: "Not Submitted",
      termsAccepted: true
    });

    await newUser.save();

    // স্পন্সর পারফরম্যান্স আপডেট
    if (referredBy) {
      try {
        const sponsor = await User.findOne({ $or: [{ referCode: referredBy }, { walletId: referredBy }] });
        if (sponsor) await updatePerformanceStatus(sponsor.email);
      } catch (err) {
        console.log("PERFORMANCE UPDATE ERROR", err);
      }
    }

    // স্বাগতম নোটিফিকেশন
    try {
      await Notification.create({
        email: newUser.email,
        title: "Welcome",
        message: "Welcome to Save Money platform"
      });
    } catch (e) {
      console.log("Notification error");
    }

    return res.status(201).json({ success: true, msg: "Registered Successfully" });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});


// ================= LOGIN =================

app.post("/login", async (req, res) => {
    try {
        console.log("LOGIN BODY:", req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                msg: "Email and password required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                msg: "User not found"
            });
        }

        if (user.banned) {
            return res.status(403).json({
                msg: "Your account is banned"
            });
        }

        let isMatch = false;

        // পাসওয়ার্ড চেক লজিক
        if (user.password && (user.password.startsWith("$2a") || user.password.startsWith("$2b") || user.password.startsWith("$2y"))) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // ওল্ড প্লেইন পাসওয়ার্ড সাপোর্ট
            isMatch = user.password === password;
        }

        if (!isMatch) {
            return res.status(401).json({
                msg: "Wrong password"
            });
        }

        // অন্য ডিভাইসে অলরেডি লগইন আছে কিনা চেক
        

        // নতুন টোকেন তৈরি
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        // ডেটাবেজে নতুন টোকেন এবং লগইনের সময়ে লাস্ট অ্যাক্টিভ সেট করা
        user.current_token = token;
        user.lastActive = new Date(); // লগইনের সময় অ্যাক্টিভ টাইম সেট হলো
        await user.save();

        return res.json({
            success: true,
            msg: "Login Successful",
            token,
            role: user.role || "user",
            email: user.email,
            referCode: user.referCode,
            name: user.name,
            kycStatus: user.kycStatus,
            walletId: user.walletId
        });

    } catch (err) {
        console.log("LOGIN ERROR:", err.message);
        console.log(err);

        return res.status(500).json({
            msg: err.message || "Server error"
        });
    }
});




app.post("/send-otp", async (req, res) => {

  const { mobile } = req.body;

  // OTP generate
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // expiry 5 min
  const expiry = new Date(Date.now() + 5 * 60 * 1000);

  // DB save
  await OTP.findOneAndUpdate(
    { mobile },
    { otp, expiresAt: expiry },
    { upsert: true }
  );

  // SMS send
  await sendSMS(
    mobile,
    `Your OTP is ${otp}. Valid for 5 minutes.`
  );

  res.json({ msg: "OTP Sent" });
});

// SEND FORGOT PASSWORD OTP BY EMAIL
app.post("/send-forgot-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        msg: "Email required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // ৬ ডিজিটের ওটিপি জেনারেট করা হচ্ছে
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ইউজারের মডেলে ওটিপি এবং ৫ মিনিটের এক্সপায়ার টাইম সেট করা হচ্ছে
    user.resetOtp = otp;
    user.resetOtpExpire = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    console.log("FORGOT PASSWORD OTP SENT TO:", email, "OTP:", otp);

    try {
      // Brevo API দিয়ে ইমেইল পাঠানো
      await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: {
            name: "Save Money",
            email: process.env.EMAIL_USER
          },
          to: [{ email: email.toLowerCase() }],
          subject: "Save Money Password Reset OTP",
          htmlContent: `
            <div style="font-family:Arial;padding:20px;border:1px solid #e1e1e1;border-radius:10px;max-width:500px;">
              <h2 style="color:#7c3aed;text-align:center;">Save Money</h2>
              <p style="font-size:16px;">Dear User,</p>
              <p style="font-size:16px;">Your password reset OTP is:</p>
              <h1 style="letter-spacing:6px;color:#16a34a;text-align:center;font-size:36px;margin:20px 0;">${otp}</h1>
              <p style="color:#ef4444;font-size:14px;text-align:center;">This OTP will expire in 5 minutes.</p>
            </div>
          `
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

    } catch (mailErr) {
      console.log("SEND FORGOT OTP EMAIL ERROR:", mailErr.response?.data || mailErr.message);
      return res.status(500).json({
        success: false,
        msg: "Failed to send OTP email"
      });
    }

    return res.json({
      success: true,
      msg: "OTP sent successfully"
    });

  } catch (err) {
    console.log("FORGOT OTP MAIN ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});


// VERIFY FORGOT PASSWORD OTP
app.post("/verify-forgot-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        msg: "Email and OTP are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    if (!user.resetOtp) {
      return res.status(400).json({
        success: false,
        msg: "No OTP requested. Please send a new OTP."
      });
    }

    // ওটিপি ভেরিফিকেশন চেক (এখানে ওটিপি ডাটাবেজ থেকে মোছা যাবে না)
    const isOtpMatched = user.resetOtp.toString() === otp.toString();
    const isOtpExpired = new Date() > new Date(user.resetOtpExpire);

    if (isOtpExpired) {
      return res.status(400).json({
        success: false,
        msg: "OTP has expired. Please request a new one."
      });
    }

    if (!isOtpMatched) {
      return res.status(400).json({
        success: false,
        msg: "Invalid OTP. Please try again."
      });
    }

    // দ্রষ্টব্য: ওটিপি সঠিক হলে শুধু সাকসেস মেসেজ পাঠানো হবে, পাসওয়ার্ড পরিবর্তন করার পর এটি ডিলিট করা হবে।
    return res.json({
      success: true,
      msg: "OTP verified successfully. You can now reset your password."
    });

  } catch (err) {
    console.log("VERIFY OTP ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error during verification"
    });
  }
});



// RESET PASSWORD
app.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        msg: "Email, OTP and new password required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        msg: "User not found" 
      });
    }

    // ১. ডাটাবেজে ওটিপি আছে কিনা চেক করা
    if (!user.resetOtp) {
      return res.status(400).json({ 
        success: false, 
        msg: "No OTP found. Please request a new one." 
      });
    }

    // ২. String-এ কনভার্ট করে ওটিপি ম্যাচ করানো (টাইপ সেফটির জন্য)
    if (user.resetOtp.toString() !== otp.toString()) {
      return res.status(400).json({ 
        success: false, 
        msg: "Invalid OTP" 
      });
    }

    // ৩. ওটিপি এক্সপায়ার চেক
    if (!user.resetOtpExpire || new Date(user.resetOtpExpire) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        msg: "OTP expired" 
      });
    }

    // ৪. পাসওয়ার্ড হ্যাশ করে আপডেট করা
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // ৫. পাসওয়ার্ড সফলভাবে রিসেট হওয়ার পর ওটিপি মুছে ফেলা
    user.resetOtp = null;
    user.resetOtpExpire = null;

    await user.save();

    return res.json({
      success: true,
      msg: "Password reset successfully"
    });

  } catch (err) {
    console.log("RESET PASSWORD ERROR:", err);
    res.status(500).json({ 
      success: false, 
      msg: "Server error" 
    });
  }
});


app.post("/invest", async (req, res) => {
  const { email, amount, years } = req.body;

  try {

    // ❗ আগে কোনো active আছে কিনা check
    const existing = await Investment.findOne({
      email,
      status: "Active"
    });

    if (existing) {
      return res.json({ msg: "Already have active investment" });
    }

    const totalInvest = amount * 12 * years;
    const interest = Math.floor((totalInvest * 0.15 * years) / 2);

    const maturityDate = new Date();
    maturityDate.setFullYear(maturityDate.getFullYear() + years);

    await Investment.create({
      email,
      amount,
      years,
      total: totalInvest + interest,
      interest,
      maturityDate
    });

    res.json({ msg: "Investment Started" });

  } catch (err) {
    console.log(err);
    res.json({ msg: "Error" });
  }
});

app.post("/start-invest", async (req, res) => {
  try {
    const {
      email,
      amount,
      years,
      rate      
    } = req.body;

    const investAmount = Number(amount);

    if (!email) {
      return res.status(400).json({
        success: false,
        msg: "Email required"
      });
    }

    if (!investAmount || investAmount < 2000) {
      return res.status(400).json({
        success: false,
        msg: "Minimum investment is ₹2000"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // KYC Approved Required
if (
  String(user.kycStatus || "").toLowerCase() !== "approved"
) {
  return res.status(403).json({
    success: false,
    msg: "Your KYC is not approved. Please Complete KYC First."
  });
}

    const walletBalance = Number(
      user.balance ??
      user.wallet ??
      user.walletBalance ??
      user.amount ??
      0
    );

    if (walletBalance < investAmount) {
      return res.status(400).json({
        success: false,
        msg: "Insufficient wallet balance"
      });
    }

    // Balance deduct
    const newBalance = walletBalance - investAmount;

    user.balance = newBalance;
    user.wallet = newBalance;
    user.walletBalance = newBalance;

    await user.save();

    const certificateNo =
      "SM-CERT-" + Date.now();

    const slipNo =
      "SM-SLIP-" + Date.now();

    const startDate = new Date();

    const nextRenewDate = new Date(startDate);
    nextRenewDate.setDate(
      nextRenewDate.getDate() + 30
    );

            const monthly = investAmount;

const annualRate = Number(rate || 0);

const totalYears = Number(years || 1);

const r = annualRate / 100 / 12;

const n = totalYears * 12;


let maturityAmount = 0;

let totalInterest = 0;


if (r > 0) {

  maturityAmount =
    monthly *
    (
      ((Math.pow(1 + r, n) - 1) / r)
      *
      (1 + r)
    );
totalInterest =
    maturityAmount -
    (monthly * n);

} else {

  maturityAmount =
    monthly * n;

  totalInterest = 0;

}

    const investment = await Investment.create({

  email,

  planName: "Save Money SIP",

  monthlyAmount: investAmount,

  amount: investAmount,

  years: Number(years || 1),

  monthsPaid: 1,

  rate: Number(rate || 0),

  totalInterest,

  maturityAmount,

  certificateNo,

  slipNo,

  startDate,

  nextRenewDate,

  renewCount: 0,

  renewStatus: "Waiting",

  status: "Active",

  lastRenewDate: startDate,

  history: [
    {
      type: "START SIP",
      amount: investAmount,
      date: startDate,
      slipNo
    }
  ]

});

    user.activeStatus = "Active";
    if (!user.firstInvestmentDone) {
    user.firstInvestmentDone = true;
    user.teamBonusEnabled = true;
    }

if (!user.performanceStartDate) {

    const start = new Date();

    const expire = new Date(start);

    expire.setDate(expire.getDate() + 30);

    user.performanceStartDate = start;

    user.performanceExpireDate = expire;

    user.performanceStatus = "Pending";
}

await user.save();

    if(!user.performanceStartDate){
const start = new Date();

    const expire = new Date(start);

    expire.setDate(expire.getDate() + 30);

    user.performanceStartDate = start;

    user.performanceExpireDate = expire;

    user.performanceStatus = "Pending";
}

await user.save();

    if(!user.performanceStartDate){

const start = new Date();

const expire = new Date(start);

expire.setDate(

expire.getDate()+30

);


user.performanceStartDate=start;

user.performanceExpireDate=expire;


user.performanceStatus="Pending";


await user.save();

    }



try{

await processFirstInvestmentBonuses(
    email,
    investment
);

// Performance Task Check
await updatePerformanceStatus(email);

await payTeamBonus(
  email,
  investment
);

await payRoyaltyBonus(
    email,
    investAmount
);

}catch(err){

console.log(
"BONUS ERROR:",
err
);

}

   await WalletHistory.create({
  email,
  amount: investAmount,
  type: "Debit",
  status: "Success",
  description: "Save Money SIP Started",
  date: new Date()
});

  // ইনভেস্টমেন্ট সাকসেস হওয়ার পর:
await sendPushNotification(email, "SIP Investment Success 🚀", "Your new SIP investment has been successfully placed.", "/my-investment");
    
return res.status(200).json({
      success: true,
      msg: "Investment Started Successfully",

      investmentId:
        investment._id,

      certificateNo,
      slipNo,

      walletBalance: newBalance,

      investment
    });

  } catch (err) {
    console.log(
      "START INVEST ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
});
  


app.post("/renew-invest", async (req, res) => {
  try {
    const { investmentId } = req.body;

    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res.json({
        success: false,
        msg: "Investment not found"
      });
    }

    const user = await User.findOne({
      email: String(investment.email).toLowerCase()
    });

    if (!user) {
      return res.json({
        success: false,
        msg: "User not found"
      });
    }

    // ইনভেস্টমেন্ট অলরেডি একটিভ এবং কোনো ডিউ না থাকলে রিনিউ আটকানো
    if (investment.renewStatus !== "Due" && investment.status === "Active") {
      return res.json({
        success: false,
        msg: "Investment is not due"
      });
    }

    // ফ্রন্টএন্ডের সাথে মিল রেখে সঠিক অ্যামাউন্ট ফিল্ড চেক করা (monthlyReturn বা amount)
    const renewAmount = Number(
      investment.monthlyAmount || 
      investment.monthlyReturn || 
      investment.amount || 
      0
    );

    // ইউজারের ওয়ালেট ব্যালেন্স চেক (যে কোনো একটি ভেরিয়েবলে ব্যালেন্স থাকলেই যেন কাজ করে)
    const balance = Number(user.balance || user.wallet || user.walletBalance || 0);

    if (balance < renewAmount) {
      return res.json({
        success: false,
        msg: `Insufficient Balance! Need ₹${renewAmount.toLocaleString('en-IN')}`
      });
    }

    // ইউজারের সবকটি ওয়ালেট ফিল্ড থেকে ব্যালেন্স মাইনাস করা
    user.balance = Math.max(0, Number(user.balance || 0) - renewAmount);
    user.wallet = Math.max(0, Number(user.wallet || 0) - renewAmount);
    user.walletBalance = Math.max(0, Number(user.walletBalance || 0) - renewAmount);
    
    user.activeStatus = "Active";
    user.status = "Active";
    await user.save();

    // পেমেন্ট স্টেটমেন্ট মডালের জন্য সঠিক ফরম্যাটে হিস্ট্রি পুশ
    investment.history.push({
      type: "RENEW",
      amount: renewAmount,
      date: new Date(),
      slipNo: "RN-" + Date.now()
    });

    investment.monthsPaid = Number(investment.monthsPaid || 1) + 1;
    investment.renewCount = Number(investment.renewCount || 0) + 1;
    investment.lastRenewDate = new Date();

    // ================== ফিক্সড ৩০ দিনের লজিক ==================
    // পরবর্তী রিনিউ ডেট সেট করা (বর্তমান সময় থেকে ঠিক ৩০ দিন পর)
    const nextRenew = new Date();
    nextRenew.setDate(nextRenew.getDate() + 30);

    // ফ্রন্টএন্ডে daysLeft হিসাবের সুবিধার্থে দুটি ফিল্ডই আপডেট রাখা হলো
    investment.nextRenewDate = nextRenew;
    investment.renewDate = nextRenew; 
    // ==========================================================

    investment.status = "Active";
    investment.renewStatus = "Renewed";
    await investment.save();

    // বোনাস এবং পারফরম্যান্স প্রсеসিং (ট্রাই-ক্যাচ ব্লকে সুরক্ষিত)
    try {
      await updatePerformanceStatus(investment.email);
      await processRenewBonuses(investment.email, investment);
      await payRoyaltyBonus(investment.email, renewAmount);
    } catch (err) {
      console.log("RENEW BONUS ERROR:", err);
    }

    // ওয়ালেট ট্রানজেকশন হিস্ট্রি তৈরি
    await WalletHistory.create({
      email: user.email,
      amount: renewAmount,
      type: "Debit",
      status: "Success",
      description: "SIP Renew Payment",
      date: new Date()
    });

    // 🔔 Push Notification for SIP Renewal
    await sendPushNotification(user.email, "SIP Renewed 🔄", "Your monthly SIP has been successfully renewed.", "/my-investment");

    // ফ্রন্টএন্ডে রেসপন্স পাঠানো
    res.json({
      success: true,
      msg: "Investment renewed successfully",
      nextRenewDate: investment.nextRenewDate,
      renewCount: investment.renewCount,
      monthsPaid: investment.monthsPaid
    });

  } catch (err) {
    console.log("RENEW ERROR:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});

      


app.post("/team-bonus-data", async (req, res) => {
  try {
    const { email } = req.body;

    let tb = await TeamBonus.findOne({ email });

    if (!tb) {
      return res.json({
        started: false,
        msg: "Please complete your first investment first"
      });
    }

    await updateTeamChallenge(email);
    tb = await TeamBonus.findOne({ email });

    const daysPassed = Math.floor(
      (new Date() - new Date(tb.challengeStart)) /
      (1000 * 60 * 60 * 24)
    );

    const remainingDays = Math.max(0, 30 - daysPassed);

    const me = await User.findOne({ email });

    if (!me) {
      return res.json({ started: false, msg: "User not found" });
    }

    const level1 = await User.find({ referredBy: me.referCode });

    const level2 = [];
    for (let u of level1) {
      const users = await User.find({ referredBy: u.referCode });
      level2.push(...users);
    }

    const level3 = [];
    for (let u of level2) {
      const users = await User.find({ referredBy: u.referCode });
      level3.push(...users);
    }

    const now = new Date();

    const thisMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const lastMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    );

    const countThisMonth = (arr) =>
      arr.filter((u) => new Date(u.createdAt) >= thisMonthStart).length;

    const countLastMonth = (arr) =>
      arr.filter((u) => {
        const d = new Date(u.createdAt);
        return d >= lastMonthStart && d <= lastMonthEnd;
      }).length;

    res.json({
      started: true,

      isActive: tb.isActive,
      isFailed: tb.isFailed,

      directCount: tb.directCount,
      remainingDays,

      wallet: tb.wallet,
      history: tb.history,

      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,

      thisMonth: {
        level1: countThisMonth(level1),
        level2: countThisMonth(level2),
        level3: countThisMonth(level3)
      },

      lastMonth: {
        level1: countLastMonth(level1),
        level2: countLastMonth(level2),
        level3: countLastMonth(level3)
      }
    });

  } catch (err) {
    console.log("TEAM BONUS DATA ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/royalty-data", async (req, res) => {
  try {
    const { email } = req.body;

    // Save Money investment আছে কি না check
    const investment = await Investment.findOne({
      email: email,
      status: "Active"
    });

    if (!investment) {
      return res.json({
        noInvestment: true,
        message: "Invest your Save Money first"
      });
    }

    let royalty = await RoyaltyBonus.findOne({ email });

    if (!royalty) {
      royalty = await RoyaltyBonus.create({
        email,
        isActive: false,
        directCount: 0,
        wallet: 0,
        thisMonthTurnover: 0,
        history: []
      });
    }

    return res.json({
      noInvestment: false,
      isActive: royalty.isActive,
      directCount: royalty.directCount || 0,
      wallet: royalty.wallet || 0,
      thisMonthTurnover: royalty.thisMonthTurnover || 0,
      history: royalty.history || []
    });

  } catch (err) {
    console.log("ROYALTY DATA ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


app.post("/wallet-summary", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, msg: "Email is required" });
    }

    // ১. ইউজার ডাটা খুঁজে বের করা
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // ২. আজকের দিনের শুরু (রাত ১২:০০ টা বা 00:00:00) নির্ধারণ করা
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ৩. শুধুমাত্র আজকের দিনের আসল বোনাস কালেকশন থেকে হিস্ট্রি খুজে বের করা
    const todayTransactions = await BonusLedger.find({
      email: String(email).toLowerCase(),
      date: { $gte: todayStart, $lte: todayEnd }
    });

    // ৪. আজকের ট্রানজেকশন থেকে আলাদা আলাদা বোনাস ক্যালকুলেট করা
    let todayReferral = 0;
    let todayPerformance = 0;
    let todayTeam = 0;
    let todayRoyalty = 0;

    todayTransactions.forEach((tx) => {
      const type = String(tx.bonusType || tx.type || "").toLowerCase();
      const note = String(tx.note || "").toLowerCase();
      const amount = Number(tx.amount || 0);

      if (type.includes("referral") || note.includes("referral")) {
        todayReferral += amount;
      } else if (type.includes("performance") || note.includes("performance")) {
        todayPerformance += amount;
      } else if (type.includes("team") || note.includes("team")) {
        todayTeam += amount;
      } else if (type.includes("royalty") || note.includes("royalty")) {
        todayRoyalty += amount;
      }
    });

    // ৫. ইউজারের অল-টাইম ট্রানজেকশন হিস্ট্রি
    const fullHistory = await WalletHistory.find({ email: String(email).toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(50);

    // ৬. ফ্রন্টএন্ডের চাহিদা অনুযায়ী রেসপন্স পাঠানো
    return res.status(200).json({
      success: true,
      walletId: user.walletId || "N/A",
      name: user.name || "User",
      avatar: user.photo || user.photoImage || "",
      user: user,

      // লাইফটাইম মেইন ব্যালেন্স
      balance: Number(user.balance || 0),

      // [পরিবর্তন] আজকের ৪টি ইনকামের যোগফল পাঠানো হলো (ইউজার ওয়ালেটেও ফাইনাল হবে না)
      todayBalance: todayReferral + todayPerformance + todayTeam + todayRoyalty,
      referral: todayReferral,
      performance: todayPerformance,
      team: todayTeam,
      royalty: todayRoyalty,

      // ফুল হিস্ট্রি অ্যারে
      history: fullHistory
    });

  } catch (error) {
    console.error("Wallet Summary API Error:", error);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
});






app.post("/wallet-user", async (req, res) => {
  try {
    const { walletId } = req.body;

    const user = await User.findOne({
      $or: [
        { walletId: walletId },
        { referralCode: walletId },
        { _id: mongoose.Types.ObjectId.isValid(walletId) ? walletId : null }
      ]
    });

    if (!user) {
      return res.json({
        success: false,
        msg: "Receiver wallet not found"
      });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        walletId: user.walletId || user.referralCode || user._id.toString()
      }
    });

  } catch (err) {
    console.log("WALLET USER ERROR:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});

app.post("/wallet-data", auth, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found"
      });
    }

    const history = await WalletHistory.find({
      email
    }).sort({ date: -1 });

    res.json({
      wallet: Number(user.balance || user.wallet || 0),
      referralIncome: Number(user.referralIncome || 0),
      performanceIncome: Number(user.performanceIncome || 0),
      teamIncome: Number(user.teamIncome || 0),
      royaltyIncome: Number(user.royaltyIncome || 0),
      totalEarning: Number(user.totalEarning || user.todayBalance || 0),
      walletId: user.walletId || "",
      history
    });

  } catch (err) {
    console.log("WALLET DATA ERROR:", err);
    res.status(500).json({
      msg: "Wallet data loading failed"
    });
  }
});


// ১. P2P ইউজার রেজিস্ট্রেশন API (রিয়েল ডাটা ফেচ সহ)
app.post("/register-p2p", async (req, res) => {
  try {
    const { email, walletId } = req.body;

    // ইউজার ইতিমধ্যে P2P তে রেজিস্টার্ড কি না চেক করা
    const alreadyP2p = await P2PUser.findOne({ email });
    if (alreadyP2p) {
      return res.status(400).json({ success: false, msg: "You are already registered for P2P!" });
    }

    // মূল User মডেল বা ডাটাবেজ থেকে ইউজারের রিয়েল নাম, মোবাইল ও ব্যালেন্স বের করা
    // (আপনার প্রজেক্টের মেইন ইউজার মডেলের নাম অনুযায়ী 'User' পরিবর্তন করে নিতে পারেন)
    const userRealData = await User.findOne({ email }); 
    
    if (!userRealData) {
      return res.status(404).json({ success: false, msg: "User profile not found in database" });
    }

    // ব্যালেন্স ২০০০ টাকার বেশি আছে কিনা চেক করা
    const currentBalance = Number(userRealData.balance || 0);
    if (currentBalance <= 2000) {
      return res.status(400).json({ success: false, msg: "Your wallet balance must be greater than ₹2,000!" });
    }

    // ডেটাবেজে রিয়েল ইনফরমেশন দিয়ে সেভ করা
    const newP2pUser = new P2PUser({
      email: userRealData.email,
      walletId: userRealData.walletId || walletId,
      name: userRealData.name || "Wallet User",
      mobile: userRealData.mobile || userRealData.phone || "N/A",
      balance: currentBalance
    });

    await newP2pUser.save();

    res.json({ success: true, msg: "Successfully registered for P2P! 🎉" });
  } catch (err) {
    console.error("P2P Register Error:", err);
    res.status(500).json({ success: false, msg: "Server error during P2P registration" });
  }
});

// ৪. P2P রেজিস্ট্রেশন আন্ডু (Undo) করার API
app.post("/undo-p2p", async (req, res) => {
  try {
    const { email, walletId } = req.body;

    // ডাটাবেজ থেকে ইউজারের P2P রেজিস্ট্রেশন ডিলিট বা রিমুভ করা
    const deletedUser = await P2PUser.findOneAndDelete({ 
      $or: [{ email }, { walletId }] 
    });

    if (!deletedUser) {
      return res.status(404).json({ success: false, msg: "You are not registered in P2P!" });
    }

    res.json({ success: true, msg: "Successfully removed from P2P senders." });
  } catch (err) {
    console.error("P2P Undo Error:", err);
    res.status(500).json({ success: false, msg: "Server error during P2P undo" });
  }
});


// ২. সকল P2P ইউজার এবং তাদের রিভিউগুলো লিস্ট আকারে ফেচ করার API
app.get("/p2p-users", async (req, res) => {
  try {
    // রেজিস্টার্ড সকল P2P ইউজারের লেটেস্ট ব্যালেন্স মূল ইউজার টেবিল থেকে আপডেট করে বা সরাসরি ফেচ করা
    const users = await P2PUser.find().lean();
    
    // প্রতিটি ইউজারের রিয়েল ব্যালেন্স মূল ওয়ালেট/ইউজার টেবিল থেকে সিংক্রোনাইজ করে নেওয়া
    for (let u of users) {
      const liveUser = await User.findOne({ email: u.email });
      if (liveUser) {
        u.balance = Number(liveUser.balance || 0);
        // যদি ব্যালেন্স ২০০০ বা তার নিচে নেমে যায়, তবে অটো রিমুভ বা আপডেট করতে পারেন
      }
    }

    // সকল রিভিউ ফেচ করা
    const allReviews = await P2PReview.find();
    
    // রিভিউগুলোকে walletId অনুযায়ী অবজেক্ট ফরম্যাটে সাজানো
    const reviewsMap = {};
    allReviews.forEach(rev => {
      if (!reviewsMap[rev.senderWalletId]) {
        reviewsMap[rev.senderWalletId] = [];
      }
      reviewsMap[rev.senderWalletId].push({
        reviewer: rev.reviewerEmail ? rev.reviewerEmail.split('@')[0] : "Anonymous",
        comment: rev.comment,
        date: rev.createdAt
      });
    });

    res.json({
      success: true,
      users: users,
      reviews: reviewsMap
    });
  } catch (err) {
    console.error("P2P Users Fetch Error:", err);
    res.status(500).json({ success: false, msg: "Failed to fetch P2P users" });
  }
});

// ৩. P2P রিভিউ সাবমিট করার API
app.post("/p2p-review", async (req, res) => {
  try {
    const { senderWalletId, reviewerEmail, review } = req.body;

    if (!review || !review.trim()) {
      return res.status(400).json({ success: false, msg: "Review text cannot be empty" });
    }

    const newReview = new P2PReview({
      senderWalletId,
      reviewerEmail: reviewerEmail || "Anonymous",
      comment: review.trim()
    });

    await newReview.save();

    res.json({ success: true, msg: "Review submitted successfully! ⭐" });
  } catch (err) {
    console.error("P2P Review Error:", err);
    res.status(500).json({ success: false, msg: "Failed to submit review" });
  }
});



// নতুন ডিপোজিট এপিআই (স্ক্রিনশট ছাড়া, শুধু ট্রানজেকশন আইডি দিয়ে)
app.post("/deposit-request", async (req, res) => {
  try {
    const { email, amount, txnId } = req.body;

    // চেক করা হচ্ছে সব ডাটা ঠিকঠাক এসেছে কি না (এখানে আর req.file চেক হবে না)
    if (!email || !amount || !txnId || !txnId.trim()) {
      return res.status(400).json({
        success: false,
        msg: "All fields required (Email, Amount, and Transaction ID)"
      });
    }

    // ডাটাবেজে ডিপোজিট রিকোয়েস্ট তৈরি (screenshot ফিল্ডটি বাদ দেওয়া হয়েছে বা ফাঁকা রাখা হয়েছে)
    await DepositRequest.create({
      email: String(email).toLowerCase(),
      amount: Number(amount),
      txnId: txnId.trim(),
      screenshot: "", // আপনার স্কিমাতে যদি স্ক্রিনশট ফিল্ডটি রিকোয়ার্ড থাকে, তবে ফাঁকা স্ট্রিং জমা থাকবে
      status: "pending",
      date: new Date()
    });

    // ইউজারকে নোটিফিকেশন পাঠানো
    await Notification.create({
      email: String(email).toLowerCase(),
      title: "Deposit Request Submitted",
      message: `Your deposit request of ₹${amount} is pending admin approval.`,
      read: false,
      date: new Date()
    });

    res.json({
      success: true,
      msg: "Deposit request submitted successfully"
    });
  } catch (err) {
    console.log("DEPOSIT REQUEST ERROR:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});


app.post("/refresh-token", async (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {

    return res.status(401).json({
      msg: "No refresh token"
    });

  }

  try {

    const verified = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET
    );

    const user = await User.findById(
      verified.id
    );

    if (
      !user ||
      user.refreshToken !== refreshToken
    ) {

      return res.status(403).json({
        msg: "Invalid refresh token"
      });

    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      accessToken
    });

  } catch {

    res.status(403).json({
      msg: "Token expired"
    });

  }

});

// এখানে আমরা 'auth' মিডলওয়্যারটি সরিয়ে দিয়েছি যাতে লগআউট কখনো না আটকায়
app.post("/logout", async (req, res) => {
    try {
        const { email } = req.body; // ফ্রন্টএন্ড থেকে বডিতে ইমেইল পাঠাবেন

        if (!email) {
            return res.status(400).json({ msg: "Email is required to logout" });
        }

        // ইউজার খুঁজে বের করা
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // টোকেন এবং সেশন সম্পূর্ণ খালি (Clear) করে দেওয়া
        user.refreshToken = "";
        user.current_token = ""; 
        
        await user.save();

        return res.json({
            success: true,
            msg: "Logout success"
        });
    } catch (err) {
        return res.status(500).json({ msg: "Server error" });
    }
});


app.post("/user-dashboard-chart", auth, async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        msg: "User not found"
      });
    }

    const today = new Date();

    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {

      const start = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );

      const end = new Date(
        today.getFullYear(),
        today.getMonth() - i + 1,
        0,
        23,
        59,
        59
      );

      const walletIncome = await WalletHistory.aggregate([
        {
          $match: {
            email,
            date: {
              $gte: start,
              $lte: end
            },
            amount: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount"
            }
          }
        }
      ]);

      const invest = await Investment.aggregate([
        {
          $match: {
            email,
            startDate: {
              $gte: start,
              $lte: end
            }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$monthlyAmount"
            }
          }
        }
      ]);

      const referrals = await User.countDocuments({
        referredBy: user.referCode,
        createdAt: {
          $gte: start,
          $lte: end
        }
      });

      monthlyData.push({
        month: start.toLocaleString("default", {
          month: "short"
        }),

        income:
          walletIncome[0]?.total || 0,

        investment:
          invest[0]?.total || 0,

        referrals
      });

    }

    const totalBonus =
      (user.referralIncome || 0) +
      (user.performanceIncome || 0) +
      (user.teamIncome || 0) +
      (user.royaltyIncome || 0);

    res.json({

      wallet: user.wallet || 0,

      totalBonus,

      activeStatus:
        user.activeStatus || "Inactive",

      monthlyData,

      incomeBreakdown: [

        {
          name: "Referral",
          value: user.referralIncome || 0
        },

        {
          name: "Performance",
          value: user.performanceIncome || 0
        },

        {
          name: "Team",
          value: user.teamIncome || 0
        },

        {
          name: "Royalty",
          value: user.royaltyIncome || 0
        }

      ]

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "Server error"
    });

  }

});

app.post('/wallet-transfer', async (req, res) => {
    try {
        const { senderEmail, receiverWalletId, amount } = req.body;
        const transferAmount = Number(amount);

        if (!senderEmail || !receiverWalletId || transferAmount <= 0) {
            return res.json({
                success: false,
                msg: "Invalid transfer data"
            });
        }

        const sender = await User.findOne({
            email: senderEmail.toLowerCase()
        });

        if (!sender) {
            return res.json({
                success: false,
                msg: "Sender not found"
            });
        }

        const receiver = await User.findOne({
            $or: [
                { walletId: receiverWalletId },
                { referralCode: receiverWalletId },
                {
                    _id: mongoose.Types.ObjectId.isValid(receiverWalletId)
                        ? receiverWalletId
                        : null
                }
            ]
        });

        if (!receiver) {
            return res.json({
                success: false,
                msg: "Receiver not found"
            });
        }

        if (sender.email === receiver.email) {
            return res.json({
                success: false,
                msg: "You cannot transfer to your own wallet"
            });
        }

        const senderBalance = Number(sender.balance || sender.wallet || 0);

        // ১. চেক করা হচ্ছে কমপক্ষে ২০০০ টাকার কম কিনা
        if (senderBalance < 2000) {
            return res.json({
                success: false,
                msg: "You must keep a minimum balance of ₹2,000 in your wallet"
            });
        }

        // ২. সর্বোচ্চ কত টাকা ট্রান্সফার করা সম্ভব তা নির্ধারণ করা হচ্ছে
        const maxTransferableAmount = senderBalance - 2000;

        if (transferAmount > maxTransferableAmount) {
            return res.json({
                success: false,
                msg: `You can transfer a maximum of ₹${maxTransferableAmount.toLocaleString("en-IN")} (Keeping ₹2,000 main balance)`
            });
        }

        // ব্যালেন্স আপডেট
        sender.balance = senderBalance - transferAmount;
        receiver.balance = Number(receiver.balance || receiver.wallet || 0) + transferAmount;

        await sender.save();
        await receiver.save();

        // ১. সেন্ডারের জন্য (Debit)
await WalletHistory.create({
  email: sender.email,
  type: 'Debit',
  amount: transferAmount,
  title: 'Wallet Transfer Sent',
  description: `Sent to ${receiver.walletId} (${receiver.name})`,
  receiverName:  receiver.name, // এটি যোগ করুন
  senderName: sender.name,     // এটি যোগ করুন
  status: 'Success',
  date: new Date()
});
        // 🔔 Push Notification to Sender (Money Sent)
    await sendPushNotification(sender.email, "Money Sent 💸", `You have successfully transferred ₹${transferAmount} to ${receiver.name}.`, "/wallet");

// ২. রিসিভারের জন্য (Credit)
await WalletHistory.create({
  email: receiver.email,
  type: 'Credit',
  amount: transferAmount,
  title: 'Wallet Transfer Received',
  description: `Received from ${sender.walletId} (${sender.name}) `,
  receiverName:  receiver.name,  // এটি যোগ করুন
  senderName: sender.name,     // এটি যোগ করুন
  status: 'Success',
  date: new Date()
});
      // 🔔 Push Notification to Receiver (Money Received)
    await sendPushNotification(receiver.email, "Money Received 💰", `You have successfully received ₹${transferAmount} from ${sender.name}.`, "/wallet");


        res.json({
            success: true,
            msg: "Transfer successful"
        });

    } catch (err) {
        console.log("WALLET TRANSFER ERROR:", err);
        res.status(500).json({
            success: false,
            msg: "Server error"
        });
    }
});




app.post("/my-plan", auth, async (req, res) => {
  
  const { email } = req.body;

  await updateInvestmentStatus(email);

  const plan = await Investment.findOne({
    email,
    status: "Active"
  });

  if (!plan) return res.json(null);

  const today = new Date();
  const renewStart = new Date(plan.nextRenewDate);
  const renewEnd = new Date(plan.nextRenewDate);
  renewEnd.setDate(renewEnd.getDate() + 5);

  let renewStatus = "Waiting";

  if (today >= renewStart && today <= renewEnd) {
    renewStatus = "Open";
  }

 if (today > renewEnd) {
    renewStatus = "Overdue";
    plan.status = "Inactive";
}


  plan.renewStatus = renewStatus;
  await plan.save();

  res.json(plan);
});

app.post("/renew", async (req, res) => {
  const { email, amount, years } = req.body;

  try {

    // পুরনো active investment complete করে দাও
    await Investment.updateMany(
      { email, status: "Active" },
      { status: "Completed" }
    );

    const totalInvest = amount * 12 * years;
    const interest = Math.floor((totalInvest * 0.15 * years) / 2);

    const maturityDate = new Date();
    maturityDate.setFullYear(maturityDate.getFullYear() + years);

    await Investment.create({
      email,
      amount,
      years,
      total: totalInvest + interest,
      interest,
      maturityDate,
      status: "Active"
    });

    res.json({ msg: "Investment Renewed" });

  } catch (err) {
    console.log(err);
    res.json({ msg: "Error" });
  }
});

app.post("/my-investments", auth, async (req, res) => {
  try {
    const { email } = req.body;

    const investments = await Investment.find({
  email: email.toLowerCase()
}).sort({ createdAt: -1 });

for (const inv of investments) {
  if (
    inv.nextRenewDate &&
    new Date() > new Date(inv.nextRenewDate) &&
    inv.status === "Active"
  ) {
    inv.status = "Inactive";
    inv.renewStatus = "Overdue";
    await inv.save();
  }
}

const fixedInvestments = investments.map((i, index) => {

  const monthly = Number(i.monthlyAmount || i.amount || 0);

  const years = Number(i.years || 0);

  const rate = Number(i.rate || 0);


  const requiredInvestment = monthly * 12 * years;


  const investedAmount =
    monthly * Number(i.monthsPaid || 1);


  const startDate =
    i.startDate || i.createdAt;


  const endDate = new Date(startDate);

  endDate.setFullYear(

    endDate.getFullYear() + years

  );



  // SIP Calculation

  let maturityAmount = 0;

  let totalReturn = 0;


  if (rate > 0) {

    const r = rate / 100 / 12;

    const n = years * 12;


    maturityAmount =

      monthly *

      (

        ((Math.pow(1 + r, n) - 1) / r)

        *

        (1 + r)

      );


    totalReturn =

      maturityAmount -

      (monthly * n);

  }



  return {

    _id: i._id,


    investmentId:
      `SM${new Date(startDate).getFullYear()}${String(index + 1).padStart(4, "0")}${String(i._id).slice(-4)}`,



    planType: "save",

    planName: "Save Money",

    planSub: "SIP Invest Plan",



    requiredInvestment,

    investedAmount,



    amount: requiredInvestment,


    monthlyAmount: monthly,


    monthlyReturn: monthly,


    years,


    returnRate: rate,



    totalReturn,


    maturityAmount,



    startDate,


    endDate,


    renewDate: i.nextRenewDate,



    daysLeft: i.nextRenewDate

      ? Math.max(

          0,

          Math.ceil(

            (

              new Date(i.nextRenewDate) -

              new Date()

            )

            /

            (1000 * 60 * 60 * 24)

          )

        )

      : 0,



    status:

      i.status || "Active",



    progress:

      i.monthsPaid

        ?

        Math.min(

          Math.floor(

            (

              i.monthsPaid /

              (years * 12)

            )

            * 100

          ),

          100

        )

        : 1,



    history:

      i.history || []

  };

});

    
   const summary = {
  totalInvestment: fixedInvestments.reduce(
    (a, b) => a + (b.requiredInvestment || 0),
    0
  ),

  investedAmount: fixedInvestments.reduce(
    (a, b) => a + (b.investedAmount || 0),
    0
  ),

  totalReturn: fixedInvestments.reduce(
    (a, b) => a + (b.totalReturn || 0),
    0
  ),

  activeInvestments: fixedInvestments.length,

  averageReturnRate:
    fixedInvestments.length > 0
      ? fixedInvestments.reduce(
          (a, b) => a + (b.returnRate || 0),
          0
        ) / fixedInvestments.length
      : 0
};

res.json({
  success: true,
  investments: fixedInvestments,
  summary
});

  } catch (err) {
    console.log("MY INVESTMENTS ERROR:", err);

    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});

app.post("/kyc-upload", upload.fields([
  { name: "aadhaarFile" },
  { name: "panFile" },
  { name: "photo" }
]), async (req, res) => {

  const { email } = req.body;

  const aadhaarFile = req.files["aadhaarFile"][0].path;
const panFile = req.files["panFile"][0].path;
const photo = req.files["photo"][0].path;

  await User.updateOne(

{email},

{

aadhaarFile,
panFile,
photo,

kycStatus:"reviewing",

rejectReason:"",
kycRejectReason:""

}

);

  res.json({ msg: "KYC submitted again" });
});

app.post("/get-user", async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ msg: "User not found" });
  }

  res.json(user);
});

app.post("/get-user-data", auth, async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email })
      .select("-password");

    if (!user) {
      return res.json({
        msg: "User not found"
      });
    }

    res.json(user);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "Server error"
    });

  }

});

// পুশ নোটিফিকেশন সাবস্ক্রিপশন সেভ করার রুট
app.post('/save-push-subscription', async (req, res) => {
  try {
    const { email, subscription } = req.body;
    
    if (!email || !subscription) {
      return res.status(400).json({ error: "Email and subscription required" });
    }

    // ইউজারের ডাটাবেসে সাবস্ক্রিপশন সেভ করা
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { $set: { pushSubscription: subscription } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true, message: "Push subscription saved successfully" });
  } catch (err) {
    console.error("Save push subscription error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/check-kyc", async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({ email });

  // 🔥 safety check
  if (!user) {
    return res.json({
      status: "none",
      reason: ""
    });
  }

  res.json({
    status: user.kycStatus || "none",
    reason: user.rejectReason || ""
  });
});

app.post("/update-mobile", async (req, res) => {
  const { email, mobile } = req.body;

  await User.updateOne(
    { email },
    { mobile }
  );

  res.json({ msg: "Mobile updated" });
});

app.post("/submit-kyc", upload.fields([
  { name: "aadhaarFile", maxCount: 1 },
  { name: "panFile", maxCount: 1 },
  { name: "photo", maxCount: 1 }
]), async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase();
    const aadhaarNumber = req.body.aadhaarNumber || req.body.aadhaar || "";
    const panNumber = req.body.panNumber || req.body.pan || "";

    if (!req.files || !req.files.aadhaarFile || !req.files.panFile || !req.files.photo) {
      return res.status(400).json({ success: false, msg: "All files are required" });
    }

    // Cloudinary-তে ফাইলগুলো আপলোড করার জন্য ফাংশন
    const uploadToCloudinary = async (fileBufferOrPath) => {
      const result = await cloudinary.uploader.upload(fileBufferOrPath, {
        folder: "kyc_documents"
      });
      return result.secure_url; // ক্লাউডিনারি থেকে যে সিকিউর লিংক পাওয়া যাবে
    };

    // ৩টি ফাইল ক্লাউডিনারিতে আপলোড করা হচ্ছে
    const aadhaarUrl = await uploadToCloudinary(req.files.aadhaarFile[0].path);
    const panUrl = await uploadToCloudinary(req.files.panFile[0].path);
    const photoUrl = await uploadToCloudinary(req.files.photo[0].path);

    console.log("KYC API HIT:", email);

    // ডাটাবেজে ক্লাউডিনারি লিংকগুলো এবং সাবমিট করার সময় সেভ করা
    await User.updateOne(
      { email },
      {
        aadhaarNumber,
        pan: panNumber,
        panNumber,
        aadhaarFile: aadhaarUrl, // লোকাল পাথের বদলে Cloudinary URL
        panFile: panUrl,         // লোকাল পাথের বদলে Cloudinary URL
        photo: photoUrl,         // লোকাল পাথের বদলে Cloudinary URL
        kycStatus: "reviewing",
        kycSubmittedAt: new Date(), // <--- আজকের KYC কাউন্ট ট্র্যাক করার জন্য এটি যুক্ত করা হলো
        rejectReason: "",
        kycRejectReason: ""
      }
    );

    await createNotification(email, "KYC Submitted Successfully");
    res.json({ success: true, msg: "KYC submitted successfully" });

     // 🔔 Push Notification for KYC Submit
    await sendPushNotification(email, "KYC Submitted 📝", "Your KYC documents have been submitted successfully and are under review.", "/kyc");

    res.json({ success: true, msg: "KYC submitted successfully" });

  } catch (err) {
    console.log("KYC ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error during KYC upload" });
  }
});



app.post("/kyc-info", async (req, res) => {

  try {

    const { email } = req.body;

    const user =
      await User.findOne({ email });

    if (!user) {

      return res.json({
        success: false
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {

    console.log(err);

    res.json({
      success: false
    });
  }
});



app.get("/kyc-list", async (req, res) => {

  const users = await User.find({ kycStatus: "reviewing" });

  res.json(users);
});



app.post("/reject-kyc", auth, adminAuth, async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ msg: "Reject reason required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        kycStatus: "rejected",
        kycRejectReason: reason
      },
      { new: true }
    );

    await Notification.create({
      email: user.email,
      title: "KYC Rejected",
      message: `Your KYC was rejected. Reason: ${reason}`,
      read: false
    });

    res.json({ msg: "KYC Rejected" });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});



// ================= DASHBOARD =================
app.post("/dashboard", auth, async (req, res) => {
  try {
    const { email } = req.body;
    
    // ইমেইল লোয়ারকেস করা হলো যাতে কোনো কেস-সেন্সিটিভিটি সমস্যা না হয়
    const normalizedEmail = email ? email.toLowerCase() : "";

    const user = await User.findOne({ email: normalizedEmail }).select("-password");

    if (!user) {
      return res.status(404).json({
        msg: "User not found"
      });
    }

    // ইনভেস্টমেন্ট খোঁজার সময়ও লোয়ারকেস ইমেইল ব্যবহার করা হলো
    const investments = await Investment.find({
      email: normalizedEmail
    });

    let totalInvestment = 0;
    let totalReturn = 0;

    investments.forEach((inv) => {
      // /my-investments API এর মতো করে মাসিক অ্যামাউন্ট বের করা হলো
      const monthly = Number(inv.monthlyAmount || inv.amount || 0);
      
      // প্রকৃত ইনভেস্ট করা টাকা = প্রতি মাসের টাকা × যত মাস পেইড হয়েছে (ডিফল্ট ১)
      const investedAmount = monthly * Number(inv.monthsPaid || 1);

      const roi =
        Number(inv.roi) ||
        Number(inv.roiPercent) ||
        Number(inv.interestRate) ||
        Number(inv.returnPercent) ||
        Number(inv.rate) || // আপনার my-investments এ 'rate' ফিল্ডটি রয়েছে
        0;

      // হোম পেজের জন্য মোট ইনভেস্টমেন্ট যোগ করা হচ্ছে
      totalInvestment += investedAmount;

      const monthlyPercent = roi / 12;
      const monthlyReturn = (investedAmount * monthlyPercent) / 100;

      totalReturn += monthlyReturn;
    });

    const totalReferral = await User.countDocuments({
      referredBy: user.referCode
    });

    let totalWithdraw = 0;

    try {
      const withdrawData = await WalletHistory.aggregate([
        {
          $match: {
            email: normalizedEmail,
            type: {
              $in: [
                "withdraw",
                "withdrawal",
                "auto-withdrawal",
                "Auto Withdrawal"
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]);

      totalWithdraw = withdrawData[0]?.total || 0;
    } catch (e) {
      totalWithdraw = user.totalWithdraw || 0;
    }

    res.json({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      wallet: Number(
        user.balance ??
        user.wallet ??
        user.walletBalance ??
        user.amount ??
        0
      ),
      walletId: user.walletId,
      referCode: user.referCode,
      kycStatus: user.kycStatus,
      photo: user.photo,

      totalInvestment, // এখন এটি সঠিকভাবে ৮,০০০ টাকা (৪,০০০ + ৪,০০০) রিটার্ন করবে
      totalReturn: Math.round(totalReturn),
      totalReferral,
      totalWithdraw
    });

  } catch (err) {
    console.log("DASHBOARD ERROR:", err);
    res.status(500).json({
      msg: "Server error"
    });
  }
});

// ================= UPLOAD WITH IMAGE =================
app.post("/upload", upload.single("file"), async (req, res) => {
  const { email, amount } = req.body;

  const txn = new Txn({
    email,
    amount,
    status: "Pending",
    type: "Deposit",
    date: new Date().toLocaleDateString(),
    screenshot: req.file.filename
  });

  await txn.save();

  res.json({ msg: "Uploaded" });
});

// ================= ADMIN =================
app.post("/admin/approve", async (req, res) => {

  const { id } = req.body;

  const txn = await Txn.findById(id);

  if (!txn) {
    return res.json({ msg: "Transaction not found" });
  }

  txn.status = "Approved";
  await txn.save();

  // 👉 user balance add
  const user = await User.findOne({ email: txn.email });

  if (user) {
    user.balance += txn.amount;
    await user.save();

    // 👉 referral + team income
    if (user.referredBy) {

      const refUser = await User.findOne({ email: user.referredBy });

      if (refUser) {

        refUser.referralIncome += 499;
        refUser.teamIncome += 200;

        await refUser.save();

        await new Txn({
          email: refUser.email,
          amount: 499,
          status: "Approved",
          type: "Referral",
          date: new Date().toLocaleDateString()
        }).save();

        await new Txn({
          email: refUser.email,
          amount: 200,
          status: "Approved",
          type: "Team Bonus",
          date: new Date().toLocaleDateString()
        }).save();
      }
    }
  }

  res.json({ msg: "Approved" });
});

app.get("/admin-analytics", auth, adminAuth, async (req, res) => {

  const totalUsers = await User.countDocuments();

  const kycApproved = await User.countDocuments({
    kycStatus: "approved"
  });

  const kycPending = await User.countDocuments({
    kycStatus: "reviewing"
  });

  // আজকের দিনে যারা KYC সাবমিট করে রিভিউতে আছে
  const kycPendingToday = await User.countDocuments({
    kycStatus: "reviewing",
    kycSubmittedAt: {
      $gte: new Date(
        new Date().setHours(0, 0, 0, 0)
      )
    }
  });

  const totalInvestment = await Investment.aggregate([
    {
      $group: {
        _id: null,
        total: {
          $sum: "$monthlyAmount"
        }
      }
    }
  ]);

  const activePlans = await Investment.countDocuments({
    status: "Active"
  });

  const completedPlans = await Investment.countDocuments({
    status: "Completed"
  });

  const totalWallet = await User.aggregate([
    {
      $group: {
        _id: null,
        total: {
          $sum: "$wallet"
        }
      }
    }
  ]);

  const pendingCash = await AddCash.countDocuments({
    status: "Pending"
  });

  const todayUsers = await User.countDocuments({
    createdAt: {
      $gte: new Date(
        new Date().setHours(0,0,0,0)
      )
    }
  });

  res.json({

    totalUsers,

    todayUsers,

    kycApproved,

    kycPending,

    kycPendingToday, // <--- এটি রেসপন্সে যুক্ত করা হলো

    totalInvestment:
      totalInvestment[0]?.total || 0,

    activePlans,

    completedPlans,

    totalWallet:
      totalWallet[0]?.total || 0,

    pendingCash

  });

});

app.get("/all-users", auth, adminAuth, async (req, res) => {

  const users = await User.find()
    .sort({ createdAt: -1 });

  res.json(users);

});

app.get("/pending-kyc", auth, adminAuth, async (req,res)=>{

try{

const users = await User.find({

kycStatus:{
$in:[
"reviewing",
"pending",
"Pending",
"Reviewing"
]
}

})
.select("-password");


res.json(users);


}

catch(err){

console.log(err);

res.status(500).json({
msg:"Server error"
})

}

})



app.post("/auto-withdraw-status", async(req,res)=>{

try{

const {email} = req.body;


if(!email){

return res.status(400).json({

success:false,
msg:"Email required"

});

}


const investment = await Investment.findOne({

email:email.toLowerCase(),
status:"Active"

}).sort({

createdAt:-1

});


/*
No active investment
*/

if(!investment){

return res.json({

success:true,

enabled:false,

status:"Inactive",

nextWithdrawal:null,

message:"No Active Investment"

});

}



/*
Renew pending
*/

if(

investment.renewStatus==="Due"

||

investment.renewStatus==="Overdue"

){

return res.json({

success:true,

enabled:false,

status:"Paused",

nextWithdrawal:null,

message:
"Investment renewal required"

});

}



/*
Next withdrawal date
*/


const today = new Date();


let nextWithdrawal;


if(today.getDate()<=5){

nextWithdrawal = new Date(

today.getFullYear(),
today.getMonth(),
5

);

}else{

nextWithdrawal = new Date(

today.getFullYear(),
today.getMonth()+1,
5

);

}



return res.json({


success:true,


enabled:true,


status:"Active",


nextWithdrawal,


message:
"Auto Withdrawal Active",



note:[


"Auto withdrawal runs automatically on the 5th of every month.",


"Investment must remain active.",


"If investment renewal is Due or Overdue, auto withdrawal will be paused.",


"Entire Main Wallet balance available on the withdrawal date will be submitted automatically.",


"Bank details updated by the user will be used for payment."


]


});


}catch(err){

console.log(err);


res.status(500).json({

success:false,

msg:"Server error"

});

}


});

// এডমিন উইথড্র লিস্ট রাউট
app.get("/admin/auto-withdraws", auth, adminAuth, async (req, res) => {
    try {
        const requests = await AutoWithdraw.find().sort({ createdAt: -1 });

        // যদি কোনো রিকোয়েস্টে ব্যাংক ডিটেইলস মিসিং থাকে, ইউজার থেকে ডাইনামিক ফেচ করে জোড়া লাগানো
        const enrichedRequests = await Promise.all(requests.map(async (item) => {
            let reqObj = item.toObject();
            if (!reqObj.bankDetails || !reqObj.bankDetails.accountNumber || reqObj.bankDetails.accountNumber === "N/A") {
                let userBank = await BankDetails.findOne({ email: reqObj.email });
                let userDoc = await User.findOne({ email: reqObj.email });
                reqObj.bankDetails = {
                    bankName: userBank?.bankName || userDoc?.bankName || "N/A",
                    accountNumber: userBank?.accountNumber || userDoc?.accountNumber || "N/A",
                    ifsc: userBank?.ifsc || userDoc?.ifsc || "N/A",
                    holderName: userBank?.userName || userDoc?.name || reqObj.name
                };
            }
            return reqObj;
        }));

        res.send({
            success: true,
            requests: enrichedRequests
        });
    } catch (err) {
        console.log("Admin auto-withdraws error:", err);
        res.send({ success: false, requests: [] });
    }
});

app.post("/admin/auto-withdraw-action", auth, adminAuth, async (req, res) => {
    try {
        const { id, status, rejectReason } = req.body;

        const reqData = await AutoWithdraw.findById(id);
        if (!reqData) {
            return res.send({ success: false, msg: "Request not found" });
        }

        if (reqData.status === "Approved" || reqData.status === "Rejected") {
            return res.send({ success: false, msg: "Action already taken on this request" });
        }

        reqData.status = status;
        reqData.actionDate = new Date();

        if (status === "Rejected") {
            reqData.rejectReason = rejectReason || "Rejected by Admin";

            // ইউজারের ব্যালেন্স রিফান্ড করা
            const user = await User.findOne({ email: reqData.email });
            if (user) {
                user.balance = Number(user.balance || 0) + Number(reqData.amount);
                await user.save();

                // এখানে type এ "Credit" দেওয়া হয়েছে যা মঙ্গুজ এনামের বাইরে যাবে না।
                // আর description বা title এ "refund" রাখা হয়েছে যাতে ফ্রন্টএন্ডের isCredit (refund keyword) একে পজিটিভ ধরে।
                await WalletHistory.create({
                    email: user.email,
                    type: "Credit", // <-- Mongoose enum-এর ভেতরে থাকা একটি ভ্যালিড টাইপ
                    amount: reqData.amount,
                    title: "Withdrawal Refund",
                    description: `Sallary Refund. Reason: ${reqData.rejectReason}`,
                    status: "Success",
                    date: new Date()
                });
            }
        } else if (status === "Approved" || status === "Authorize") {
            reqData.status = "Approved";
            
            await WalletHistory.create({
                email: user.email,
                type: "Debit", // অথবা আপনার স্কিমার নিয়মানুযায়ী অন্য কোনো ভ্যালিড টাইপ
                amount: reqData.amount,
                title: "Withdrawal Successful",
                description: `Your withdrawal request of ₹${reqData.amount} has been approved.`,
                status: "Success",
                date: new Date()
            });
        }

        await reqData.save();

        res.send({
            success: true,
            msg: "Action processed successfully"
        });

    } catch (err) {
        console.log("ADMIN WITHDRAW ACTION ERROR:", err);
        res.status(500).send({ success: false, msg: "Server error" });
    }
});




app.post("/admin-withdraw-list", async(req,res)=>{

try{

const requests =
await AutoWithdraw.find()
.sort({
createdAt:-1
});


res.json({

success:true,

requests

});

}catch(err){

console.log(err);

res.status(500).json({

success:false,
msg:"Server error"

});

}

});


app.post("/approve-kyc",auth,adminAuth,async(req,res)=>{


try{


const {userId}=req.body;



await User.findByIdAndUpdate(

userId,

{

kycStatus:"approved",

kycRejectReason:""

}

);

// 🔔 Push Notification for KYC Approval
      await sendPushNotification(updatedUser.email, "KYC Approved! 🎉", "Congratulations! Your KYC verification has been approved successfully.", "/kyc");

res.json({

success:true,

msg:"KYC Approved"

})


}

catch(err){


res.status(500).json({

success:false,

msg:"Server error"

})


}


})

app.post("/reject-kyc",auth,adminAuth,async(req,res)=>{


try{


const{

userId,

reason

}=req.body;




await User.findByIdAndUpdate(

userId,

{

kycStatus:"rejected",

kycRejectReason:reason

}

);

// 🔔 Push Notification for KYC Rejection
      await sendPushNotification(updatedUser.email, "KYC Rejected ❌", "Your KYC verification was rejected. Please re-submit with correct details.", "/kyc");

res.json({

success:true,

msg:"KYC Rejected"

})


}


catch(err){

res.status(500).json({

success:false,

msg:"Server error"

})

}


})


app.post("/reply-ticket", auth, adminAuth, async (req, res) => {
  try {
    const { ticketId, message } = req.body;

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.json({ msg: "Ticket not found" });
    }

    ticket.replies.push({
      sender: "admin",
      message
    });

    ticket.status = "Replied";

    await ticket.save();

    await sendNotification(
      ticket.email,
      "Support Reply",
      "Admin replied to your support ticket"
    );

    await sendEmail(
  ticket.email,
  "Support Ticket Reply",
  `Admin has replied to your support ticket: ${message}`
);

    res.json({ msg: "Reply sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post(
  "/admin-ban-user",
  auth,
  adminAuth,
  async (req, res) => {

    try {

      const {
        email,
        reason
      } = req.body;

      const user = await User.findOne({ email });

      if (!user) {

        return res.json({
          msg: "User not found"
        });

      }

      user.banned = true;

      user.banReason =
        reason || "Violation detected";

      await user.save();

      res.json({
        msg: "User banned successfully"
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        msg: "Server error"
      });

    }

  }
);

app.post(
  "/admin-unban-user",
  auth,
  adminAuth,
  async (req, res) => {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {

      return res.json({
        msg: "User not found"
      });

    }

    user.banned = false;

    user.banReason = "";

    await user.save();

    res.json({
      msg: "User unbanned successfully"
    });

  }
);

app.post("/admin-freeze-wallet", auth, adminAuth, async (req, res) => {

  const { email, freeze } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      msg: "User not found"
    });
  }

  user.freezeWallet = freeze;

  await user.save();

  res.json({
    msg: freeze
      ? "Wallet frozen"
      : "Wallet unfrozen"
  });

});

app.post("/admin-disable-investment", auth, adminAuth, async (req, res) => {

  const { email, disable } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      msg: "User not found"
    });
  }

  user.disableInvestment = disable;

  await user.save();

  res.json({
    msg: disable
      ? "Investment disabled"
      : "Investment enabled"
  });

});

app.post("/admin-disable-withdrawal", auth, adminAuth, async (req, res) => {

  const { email, disable } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      msg: "User not found"
    });
  }

  user.disableWithdrawal = disable;

  await user.save();

  res.json({
    msg: disable
      ? "Withdrawal disabled"
      : "Withdrawal enabled"
  });

});

app.post("/admin-disable-bonus", auth, adminAuth, async (req, res) => {

  const { email, disable } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      msg: "User not found"
    });
  }

  user.disableBonus = disable;

  await user.save();

  res.json({
    msg: disable
      ? "Bonus disabled"
      : "Bonus enabled"
  });

});



app.get("/admin-advanced-analytics", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ activeStatus: "Active" });
    const inactiveUsers = await User.countDocuments({ activeStatus: "Inactive" });
    const kycApproved = await User.countDocuments({ kycStatus: "approved" });
    const kycPending = await User.countDocuments({ kycStatus: { $ne: "approved" } });
    const bannedUsers = await User.countDocuments({ banned: true });

    const totalWallet = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$wallet" } } }
    ]);

    const totalInvestment = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: "$monthlyAmount" } } }
    ]);

    const topEarners = await User.find()
      .sort({ totalEarning: -1 })
      .limit(10)
      .select("name email totalEarning rank totalDirect wallet");

    const topReferrers = await User.find()
      .sort({ totalDirect: -1 })
      .limit(10)
      .select("name email totalDirect rank totalEarning");

    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));

      const joined = await User.countDocuments({
        createdAt: { $gte: start, $lte: end }
      });

      const invest = await Investment.aggregate([
        {
          $match: {
            startDate: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$monthlyAmount" }
          }
        }
      ]);

      const walletTx = await WalletHistory.aggregate([
        {
          $match: {
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]);

      last7Days.push({
        date: start.toLocaleDateString(),
        users: joined,
        investment: invest[0]?.total || 0,
        wallet: walletTx[0]?.total || 0
      });
    }

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      kycApproved,
      kycPending,
      bannedUsers,
      totalWallet: totalWallet[0]?.total || 0,
      totalInvestment: totalInvestment[0]?.total || 0,
      topEarners,
      topReferrers,
      chart: last7Days
    });

  } catch (err) {
    console.log("ADVANCED ANALYTICS ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/admin-search-users", auth, adminAuth, async (req, res) => {
  try {
    const { search, filter } = req.body;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { walletId: { $regex: search, $options: "i" } },
        { referCode: { $regex: search, $options: "i" } }
      ];
    }

    if (filter === "kyc") {
      query.kycStatus = "approved";
    }

    if (filter === "pending") {
      query.kycStatus = { $ne: "approved" };
    }

    if (filter === "active") {
      query.activeStatus = "Active";
    }

    if (filter === "inactive") {
      query.activeStatus = "Inactive";
    }

    if (filter === "banned") {
      query.banned = true;
    }

    const users = await User.find(query)
.select("-password")
.sort({ createdAt: -1 })
.limit(100);

const finalUsers = users.map(u => ({

    ...u.toObject(),

    performanceBonusEnabled:
      u.performanceEnabled,

    teamBonusEnabled:
      u.teamBonusEnabled,

    royaltyBonusEnabled:
      u.royaltyBonusEnabled

}));

res.json(finalUsers);

  } catch (err) {
    console.log("ADMIN SEARCH ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ১. নির্দিষ্ট তারিখের মধ্যে রেফার হিসাব এবং বোনাস ক্যালকুলেশন এপিআই
app.post("/admin-addon-calc", auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, flatAmount } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, msg: "Start date and end date are required" });
    }

    const amountPerRef = Number(flatAmount) || 799;

    // ডেটের শুরু এবং শেষ সময় পারফেক্ট করার জন্য টাইম জোন ফিক্স করা
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const users = await User.find({});
    let offerResults = [];

    for (let user of users) {
      // ১. আসল রেফারেল কাউন্ট বের করা (শুধুমাত্র 'Referral Bonus' দিয়ে)
      const actualReferrals = await BonusLedger.find({
        email: user.email,
        bonusType: "Referral Bonus",
        createdAt: { $gte: start, $lte: end }
      });

      const referralCount = actualReferrals.length;

      if (referralCount > 0) {
        const targetAmount = referralCount * amountPerRef; 

        // ২. এই ডেট রেঞ্জের মধ্যে ইতিমধ্যে যত পেমেন্ট দেওয়া হয়েছে (Referral Bonus + Offer Add-on) সবগুলোর যোগফল
        const allPayoutsInInterval = await BonusLedger.find({
          email: user.email,
          bonusType: { $in: ["Referral Bonus", "Offer Add-on"] },
          createdAt: { $gte: start, $lte: end }
        });

        const alreadyReceived = allPayoutsInInterval.reduce((sum, ref) => sum + (Number(ref.amount) || 0), 0);
        const remainingBalance = targetAmount - alreadyReceived;

        // ৩. যদি রিমেইনিং ব্যালেন্স শূন্য থেকে বেশি হয়, তবেই লিস্টে দেখাবে (সম্পূর্ণ পেমেন্ট হয়ে গেলে লিস্ট থেকে সরে যাবে)
        if (remainingBalance > 0) {
          offerResults.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            referralCount,
            targetAmount,
            alreadyReceived,
            remainingBalance
          });
        }
      }
    }

    res.json({ success: true, data: offerResults });
  } catch (err) {
    console.error("Calculation Error:", err);
    res.status(500).json({ success: false, msg: "Server error during calculation" });
  }
});






// ২. বাকি টাকা ডিস্ট্রিবিউশন রাউট
app.post("/admin-addon-distribute", auth, adminAuth, async (req, res) => {
  try {
    const { offerList } = req.body;

    if (!offerList || offerList.length === 0) {
      return res.status(400).json({ success: false, msg: "No data available to distribute" });
    }

    for (let item of offerList) {
      if (item.remainingBalance > 0) {
        // সবার todayBalance এ টাকা যোগ করা হলো
        await User.findByIdAndUpdate(item.userId, {
          $inc: { todayBalance: item.remainingBalance }
        });

        // লেজারে 'Offer Add-on' হিসেবে হিস্ট্রি সেভ করা
        await BonusLedger.create({
          email: item.email,
          bonusType: "Offer Add-on",
          amount: item.remainingBalance,
          note: `Offer Add-on Mass Payout Credited (${item.referralCount} referrals calculated)`
        });
      }
    }

    res.json({ success: true, msg: "Remaining balance added to Today Balance for all users successfully!" });
  } catch (err) {
    console.error("Distribution Error:", err);
    res.status(500).json({ success: false, msg: "Failed to distribute amount" });
  }
});



app.post("/admin-addon-single-distribute", auth, adminAuth, async (req, res) => {
  try {
    const { userId, email, remainingBalance, referralCount } = req.body;

    if (!userId || !remainingBalance || remainingBalance <= 0) {
      return res.status(400).json({ success: false, msg: "Invalid user data or balance" });
    }

    // সরাসরি todayBalance এ টাকা যোগ করা হলো
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { todayBalance: remainingBalance } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // বোনাস লেজারে 'Offer Add-on' হিসেবে হিস্ট্রি সেভ করা
    await BonusLedger.create({
      email: email,
      bonusType: "Offer Add-on",
      amount: remainingBalance,
      note: `Offer Add-on Payout Credited (${referralCount} referrals calculated)`
    });

    res.json({ success: true, msg: "Amount added to Today Balance successfully!" });
  } catch (err) {
    console.error("Single Distribution Error:", err);
    res.status(500).json({ success: false, msg: "Failed to distribute amount to user" });
  }
});





app.post("/close-ticket", auth, async (req, res) => {
  const { ticketId } = req.body;

  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    return res.json({ msg: "Ticket not found" });
  }

  ticket.status = "Closed";
  await ticket.save();

  res.json({ msg: "Ticket closed" });
});



app.get("/cash-requests", auth, adminAuth, async (req, res) => {
  try {
    // ডাটাবেজ থেকে পেন্ডিং ডিপোজিট রিকোয়েস্টগুলো ট্রানজেকশন আইডি সহ নিয়ে আসা হচ্ছে
    const requests = await DepositRequest.find({
      status: "pending"
    }).sort({ date: -1 });

    res.json(requests);
  } catch (err) {
    console.log("CASH REQUEST ERROR:", err);
    res.status(500).json([]);
  }
});


app.post("/approve-cash",
auth,
adminAuth,
async (req, res) => {

  const { requestId } = req.body;

  const reqData = await DepositRequest.findById(requestId);

  if (!reqData) {

    return res.json({
      msg: "Request not found"
    });

  }

  const user = await User.findOne({
    email: reqData.email
  });

  user.wallet += Number(reqData.amount);

  await user.save();

  reqData.status = "approved";

  await reqData.save();

  await WalletHistory.create({

    email: user.email,

    type: "Cash Added",

    amount: reqData.amount,

    note: "Admin Approved"

  });

  res.json({
    msg: "Cash Approved"
  });

});

app.post("/reject-cash", auth, adminAuth, async (req, res) => {
  try {
    const { requestId } = req.body;

    const reqData = await DepositRequest.findById(requestId);

    if (!reqData) {
      return res.status(404).json({
        success: false,
        msg: "Request not found",
      });
    }

    reqData.status = "rejected";
    await reqData.save();

    res.json({
      success: true,
      msg: "Cash request rejected",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
});

app.get("/admin/finance-report", async (req, res) => {
  try {
    const totalCredit = await WalletTransaction.aggregate([
      { $match: { type: "credit", status: "Success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalDebit = await WalletTransaction.aggregate([
      { $match: { type: "debit", status: "Success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const pendingPayments = await WalletTransaction.countDocuments({
      status: "Pending"
    });

    const failedPayments = await WalletTransaction.countDocuments({
      status: "Failed"
    });

    const recent = await WalletTransaction.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      totalCredit: totalCredit[0]?.total || 0,
      totalDebit: totalDebit[0]?.total || 0,
      pendingPayments,
      failedPayments,
      recent
    });

  } catch (err) {
    console.log("ADMIN FINANCE REPORT ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.post("/admin-user-tree", auth, adminAuth, async (req, res) => {
  try {
    const { email, filter } = req.body;

    const rootUser = await User.findOne({ email });

    if (!rootUser) {
      return res.json({ msg: "User not found" });
    }

    async function buildTree(user, level) {
      if (level > 7) return [];

      let query = { referredBy: user.referCode };

      if (filter === "active") {
        query.kycStatus = "approved";
      }

      if (filter === "pending") {
        query.kycStatus = { $ne: "approved" };
      }

      const children = await User.find(query)
        .select("name email referCode kycStatus createdAt");

      const result = [];

      for (let child of children) {
        result.push({
          name: child.name,
          email: child.email,
          referCode: child.referCode,
          kycStatus: child.kycStatus,
          joinDate: child.createdAt,
          level,
          children: await buildTree(child, level + 1)
        });
      }

      return result;
    }

    const tree = {
      name: rootUser.name,
      email: rootUser.email,
      referCode: rootUser.referCode,
      kycStatus: rootUser.kycStatus,
      level: 0,
      children: await buildTree(rootUser, 1)
    };

    res.json({ tree });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/admin/update-bonus-status", auth, adminAuth, async (req, res) => {
    try {
        const { 
            userId, 
            performanceBonusEnabled, 
            teamBonusEnabled, 
            royaltyBonusEnabled 
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found"
            });
        }

        // Performance Bonus আপডেট
        if (typeof performanceBonusEnabled === "boolean") {
            user.performanceAdminOverride = true;
            user.performanceEnabled = performanceBonusEnabled;
            user.performanceBonusEnabled = performanceBonusEnabled; // মেইন ফিল্ড সিঙ্ক করার জন্য
            user.performanceStatus = performanceBonusEnabled ? "Active" : "Inactive";
        }

        // Team Bonus আপডেট
        if (typeof teamBonusEnabled === "boolean") {
            user.teamBonusEnabled = teamBonusEnabled;
        }

        // Royalty Bonus আপডেট
        if (typeof royaltyBonusEnabled === "boolean") {
            user.royaltyBonusEnabled = royaltyBonusEnabled;
        }

        await user.save();

        res.json({
            success: true,
            msg: "Bonus status updated successfully"
        });

    } catch (err) {
        console.log("ADMIN BONUS UPDATE ERROR:", err);
        res.status(500).json({ success: false, msg: "Server error" });
    }
});


app.post("/admin/reset-performance-auto", async (req, res) => {

  try {

    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {

      return res.json({

        success: false,

        msg: "User not found"

      });

    }

    user.performanceAdminOverride = false;

    await user.save();

    await updatePerformanceStatus(user.email);

    res.json({

      success: true,

      msg: "Performance bonus returned to Auto Mode"

    });

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      success: false,

      msg: "Server error"

    });

  }

});


app.post("/admin/deposit-approve", auth, async (req, res) => {
  try {
    const { id } = req.body;

    const request = await DepositRequest.findById(id);  
    if (!request) {  
      return res.json({ success: false, msg: "Request not found" });  
    }  

    if (request.status === "approved") {  
      return res.json({ success: false, msg: "Already approved" });  
    }  

    const user = await User.findOne({  
      email: String(request.email).toLowerCase()  
    });  

    if (!user) {  
      return res.json({ success: false, msg: "User not found" });  
    }  

    // ইউজারের ব্যালেন্স সেফলি আপডেট করা (আপনার বিদ্যমান লজিক ঠিক রাখা হয়েছে)
    const oldBalance = Number(user.balance ?? user.wallet ?? user.walletBalance ?? 0);  
    const addAmount = Number(request.amount || 0);  
    const newBalance = oldBalance + addAmount;  

    user.balance = newBalance;  
    user.wallet = newBalance;  
    user.walletBalance = newBalance;  
    await user.save();  

    // ডিপোজিট রিকোয়েস্টের স্ট্যাটাস পরিবর্তন
    request.status = "approved";  
    request.approvedAt = new Date();  
    await request.save();  

    // ইউজারের ওয়ালেট হিস্ট্রিতে রেকর্ড যোগ করা
    await WalletHistory.create({  
      email: String(request.email).toLowerCase(),  
      amount: addAmount,  
      type: "Admin Credit",  
      note: `Deposit approved (Txn ID: ${request.txnId || "N/A"})`,  
      status: "success",  
      date: new Date()  
    });

    // ইউজারকে ব্যালেন্স অ্যাডের একটি সাকসেস নোটিফিকেশন পাঠানো
    try {
      await Notification.create({
        email: String(request.email).toLowerCase(),
        title: "Deposit Approved 💰",
        message: `Your deposit of ₹${addAmount} has been approved. Txn ID: ${request.txnId || "N/A"}`,
        read: false,
        date: new Date()
      });
    } catch (notifErr) {
      console.log("Notification create error, but payment approved.");
    }

    res.json({ success: true, msg: "Deposit approved successfully" });

  } catch (err) {
    console.log("DEPOSIT APPROVE ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});


app.post("/admin/deposit-reject", auth, async (req, res) => {
  try {
    const { id } = req.body;

    const request = await DepositRequest.findById(id);  
    if (!request) {  
      return res.json({ success: false, msg: "Request not found" });  
    }  

    if (request.status === "rejected" || request.status === "approved") {  
      return res.json({ success: false, msg: "Request already processed" });  
    }  

    // স্ট্যাটাস রিজেক্ট করা
    request.status = "rejected";  
    request.rejectedAt = new Date();  
    await request.save();  

    // ইউজারকে রিজেকশনের নোটিফিকেশন পাঠানো
    try {
      await Notification.create({
        email: String(request.email).toLowerCase(),
        title: "Deposit Request Rejected ❌",
        message: `Your deposit request of ₹${request.amount} was rejected. Invalid Transaction ID.`,
        read: false,
        date: new Date()
      });
    } catch (notifErr) {
      console.log("Notification error on reject");
    }

    res.json({ success: true, msg: "Deposit request rejected" });

  } catch (err) {
    console.log("DEPOSIT REJECT ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});




app.post("/admin/wallet-adjust", async (req, res) => {
  try {
    const { userId, amount, reason, type } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        msg: "User ID required"
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        msg: "Valid amount required"
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        msg: "Reason required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    const oldBalance = Number(
      user.balance ??
      user.wallet ??
      user.walletBalance ??
      0
    );

    let newBalance = oldBalance;

    if (type === "add") {
      newBalance = oldBalance + Number(amount);
    } else if (type === "deduct") {
      newBalance = oldBalance - Number(amount);
    } else {
      return res.status(400).json({
        success: false,
        msg: "Invalid type"
      });
    }

    user.balance = newBalance;
    user.wallet = newBalance;
    user.walletBalance = newBalance;

    await user.save();

    await WalletHistory.create({
  email: String(user.email).toLowerCase(),
      amount: Number(amount),
type: type === "add" ? "Credit" : "Debit",
title: type === "add" ? "Admin Credit" : "Admin Debit",      description: reason,
      note: reason,
      status: "success",
      date: new Date()
    });

    await Notification.create({
      email: user.email,
      title: "Wallet Updated",
      message:
        type === "add"
          ? `₹${amount} added by admin. Reason: ${reason}`
          : `₹${amount} deducted by admin. Reason: ${reason}`,
      date: new Date(),
      read: false
    });

    return res.json({
      success: true,
      msg: "Wallet updated",
      wallet: newBalance,
      balance: newBalance,
      walletBalance: newBalance
    });
  } catch (err) {
    console.log("ADMIN WALLET ADJUST ERROR:", err);

    return res.status(500).json({
      success: false,
      msg: err.message || "Wallet update failed"
    });
  }
});

app.post("/ban-user",
auth,
adminAuth,
async (req, res) => {

  const { userId } = req.body;

  const user = await User.findById(userId);

  user.banned = true;

  await user.save();

  res.json({
    msg: "User Banned"
  });

});

app.post("/broadcast",
auth,
adminAuth,
async (req, res) => {
  try {
    const { title, message } = req.body;
    const users = await User.find();

    for (let u of users) { // ✅ team পরিবর্তন করে users করা হলো
      await Notification.create({
        email: u.email, // "all" এর পরিবর্তে নির্দিষ্ট ইউজারের ইমেইল বা গ্লোবাল নোটিফিকেশন লজিক
        title,
        message,
        read: false
      });

      const socketId = onlineUsers[u.email];
      if (socketId) {
        io.to(socketId).emit("new_notification", { title, message });
      }
    }
    res.json({ msg: "Broadcast Sent" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});


app.get("/latest-news", async (req, res) => {
  try {
    // অ্যাডমিন প্যানেল থেকে পাঠানো টাইটেল বা নির্দিষ্ট ক্যাটাগরির লেটেস্ট নোটিফিকেশন খুঁজবে
    const latest = await Notification.findOne({
      $or: [
        { title: "App Latest Update" },
        { title: { $regex: /update|announcement|latest/i } }
      ]
    }).sort({ createdAt: -1 });
    
    // যদি নির্দিষ্ট ফরম্যাটের না পাওয়া যায়, তবে একদম সর্বশেষ যে নোটিফিকেশনটি তৈরি হয়েছে সেটি দেখাবে
    const fallbackLatest = latest || await Notification.findOne().sort({ createdAt: -1 });

    if (!fallbackLatest) {
      return res.json({ success: true, message: "No new announcement" });
    }

    res.json({ success: true, message: fallbackLatest.message || fallbackLatest.title });
  } catch (err) {
    console.log("Latest news fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




app.post("/send-notification", async (req, res) => {

  const { email, text } = req.body;

  // 1️⃣ DB-তে save
  const newNotification = await Notification.create({
    email,
    text
  });

  // 2️⃣ realtime send
  if (onlineUsers[email]) {
    io.to(users[email]).emit("new-notification", newNotification);
  }

  res.json({ msg: "Notification sent" });
});

app.post("/get-notifications", auth, async (req, res) => {
  try {
    const { email } = req.body;

    const notifications = await Notification.find({
      $or: [
        { email: email },
        { email: "all" },
        { email: "ALL" },
      
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);

  } catch (err) {
    console.log("GET NOTIFICATION ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});



app.post("/my-referrals", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);

    if (!me) {
      return res.status(404).json({
        myCode: "NO CODE",
        team: []
      });
    }

    if (!me.referCode) {
      me.referCode =
        "SM" + Math.floor(100000 + Math.random() * 900000);
      await me.save();
    }

    const team = await User.find({
      referredBy: me.referCode
    });

    const result = [];

    for (let u of team) {
      result.push({
        name: u.name,
        joinDate: u.createdAt,
        status: u.activeStatus || "Inactive"
      });
    }

    res.json({
      myCode: me.referCode,
      referCode: me.referCode,
      team: result
    });

  } catch (err) {
    console.log("REFERRAL ERROR:", err);
    res.status(500).json({
      msg: "Server error"
    });
  }
});


// 🕸️ এপিআই-এর প্রথম লাইনটি এইভাবে পরিবর্তন করুন:
app.post("/referral-tree", async (req, res) => {

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    // ১. মেইন রুট ইউজারকে ডাটাবেজ থেকে খুঁজে বের করা
    const rootUser = await User.findOne({ email });
    if (!rootUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // ২. গ্লোবাল কাউন্টার এবং অ্যানালিটিক্স ডাটা অবজেক্ট
    let totalUsers = 0;
    let activeUsers = 0;
    let totalBusiness = 0;
    
    // লেভেল ১ থেকে ৭ পর্যন্ত ডেটা ট্র্যাক করার জন্য অবজেক্ট রেডি করা
    const levelsData = {};
    for (let i = 1; i <= 7; i++) {
      levelsData[i] = { users: 0, active: 0, income: 0 };
    }

    // ৩. রিকার্সিভ ফাংশন: যা মাকড়সার জালের মতো ৭ লেভেল পর্যন্ত ডিপ স্ক্যান করবে
    const buildTree = async (currentUser, currentLevel) => {
      // ৭ লেভেলের বেশি নিচে স্ক্র্যাপ করবে না
      if (currentLevel > 7) return null;

      // বর্তমান ইউজারের referCode ব্যবহার করে কারা জয়েন করেছে তাদের বের করা
      const childrenUsers = await User.find({ referBy: currentUser.referCode });

      const childrenNodes = [];

      for (const child of childrenUsers) {
        // টোটাল নেটওয়ার্ক কাউন্ট বৃদ্ধি
        totalUsers++;
        
        // কেওয়াইসি (KYC) স্ট্যাটাস চেক করা (আপনার মডেল অনুযায়ী)
        const isApproved = child.kycStatus === "approved" || child.kycStatus === "Approved";
        if (isApproved) activeUsers++;
        
        // বিজনেস হিসাব (ইউজারের ওয়ালেট ব্যালেন্সকে বিজনেস হিসেবে ধরা হচ্ছে)
        const childBiz = Number(child.wallet || 0);
        totalBusiness += childBiz;

        // নির্দিষ্ট লেভেল অ্যানালিটিক্স আপডেট
        levelsData[currentLevel].users += 1;
        if (isApproved) levelsData[currentLevel].active += 1;
        levelsData[currentLevel].income += childBiz;

        // এই চাইল্ডের নিচে পরবর্তী লেভেলের চিলড্রেন খোঁজার জন্য আবার কল করা (Deep Level Scan)
        const subTree = await buildTree(child, currentLevel + 1);

        childrenNodes.push({
          name: child.name || "Unknown User",
          email: child.email,
          mobile: child.phone || "N/A", // আপনার মডেলের 'phone' ফিল্ড ব্যবহার করা হয়েছে
          referCode: child.referCode || "N/A",
          kycStatus: child.kycStatus ? child.kycStatus.toLowerCase() : "pending",
          level: currentLevel,
          business: childBiz,
          children: subTree ? subTree.children : []
        });
      }

      return {
        children: childrenNodes
      };
    };

    // ৪. মেইন ইউজারের আন্ডারে লেভেল ১ থেকে স্ক্যান শুরু করা
    const treeData = await buildTree(rootUser, 1);

    // ৫. ফ্রন্টএন্ড মাকড়সার জালের ফরম্যাট অনুযায়ী মেইন রুট নোড সাজানো
    const finalTree = {
      name: rootUser.name || "You",
      email: rootUser.email,
      mobile: rootUser.phone || "N/A",
      referCode: rootUser.referCode || "N/A",
      kycStatus: rootUser.kycStatus ? rootUser.kycStatus.toLowerCase() : "pending",
      level: 0,
      business: Number(rootUser.wallet || 0),
      children: treeData ? treeData.children : []
    };

    // ৬. ফ্রন্টএন্ডে সাকসেসফুল রেসপন্স পাঠানো
    return res.status(200).json({
      success: true,
      tree: finalTree,
      analytics: {
        totalUsers,
        activeUsers,
        totalBusiness,
        levels: levelsData
      }
    });

  } catch (err) {
    console.error("SERVER REFERRAL TREE ERROR:", err);
    return res.status(500).json({ msg: "Internal Server Error in Tree Builder" });
  }
});


app.post("/my-rank", auth, async (req, res) => {
  const { email } = req.body;

  await updateUserRank(email);

  const user = await User.findOne({ email }).select(
    "-password name rank rankPoints totalEarning totalDirect kycStatus"
  );

  res.json(user);
});

app.post("/performance-data", async (req, res) => {

  try {

    const { email } = req.body;

    const pb = await PerformanceBonus.findOne({ email });

    if (!pb) {
      return res.json({
        msg: "No challenge started"
      });
    }

    const passed = Math.floor(
      (new Date() - new Date(pb.challengeStart))
      / (1000 * 60 * 60 * 24)
    );

    res.json({
      ...pb._doc,
      remainingDays: Math.max(0, 30 - passed)
    });

  } catch (err) {

    console.log("PERFORMANCE API ERROR:", err);

    res.status(500).json({
      msg: "Server error"
    });
  }

});

app.post("/notifications",
auth,
async (req, res) => {

  const { email } = req.body;

  const data =
    await Notification.find({ email })
    .sort({ date: -1 });

  res.json(data);

});

app.post("/user-data", auth, async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select("-password");

  if (!user) {
    return res.json({ msg: "User not found" });
  }

  res.json(user);
});

app.post("/read-notification",
auth,
async (req, res) => {

  const { id } = req.body;

  await Notification.findByIdAndUpdate(
    id,
    {
      read: true
    }
  );

  res.json({
    msg:"done"
  });

});

app.post("/create-ticket", auth, async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!subject || !message) {
      return res.json({ msg: "Subject and message required" });
    }

    await SupportTicket.create({
      email,
      subject,
      message,
      replies: [
        {
          sender: "user",
          message
        }
      ]
    });

    res.json({ msg: "Ticket created successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/my-tickets", auth, async (req, res) => {
  const { email } = req.body;

  const tickets = await SupportTicket.find({ email })
    .sort({ createdAt: -1 });

  res.json(tickets);
});

app.post("/refer-tree", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: String(email).toLowerCase()
    });

    if (!user) {
      return res.json({
        success: false
      });
    }

    const rootCode =
      user.referCode ||
      user.referralCode;

    async function getLevel(code) {
      return await User.find({
        referredBy: code
      }).select(
        "name email referCode mobile"
      );
    }

    const level1 = await getLevel(rootCode);

    const level2 = [];
    const level3 = [];
    const level4 = [];
    const level5 = [];
    const level6 = [];
    const level7 = [];

    for (const a of level1) {
      level2.push(
        ...(await getLevel(a.referCode))
      );
    }

    for (const a of level2) {
      level3.push(
        ...(await getLevel(a.referCode))
      );
    }

    for (const a of level3) {
      level4.push(
        ...(await getLevel(a.referCode))
      );
    }

    for (const a of level4) {
      level5.push(
        ...(await getLevel(a.referCode))
      );
    }

    for (const a of level5) {
      level6.push(
        ...(await getLevel(a.referCode))
      );
    }

    for (const a of level6) {
      level7.push(
        ...(await getLevel(a.referCode))
      );
    }

    res.json({
      success: true,

      levels: {
        level1,
        level2,
        level3,
        level4,
        level5,
        level6,
        level7
      }
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false
    });

  }
});


app.post("/refer-data", async (req, res) => {
  try {
    const {
  email,
  month,
  year
} = req.body;

    const user = await User.findOne({
      email: String(email || "").toLowerCase()
    });

    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    const referCode = user.referCode || user.referralCode || user.walletId || "";

    const directUsers = await User.find({
      referredBy: referCode
    }).sort({ createdAt: -1 });

    const directEmails = directUsers.map((u) =>
      String(u.email || "").toLowerCase()
    );

    const activeInvestments = await Investment.find({
      email: { $in: directEmails },
      status: "Active"
    });

    const activeEmailSet = new Set(
      activeInvestments.map((i) => String(i.email || "").toLowerCase())
    );

    const directActiveCount = directUsers.filter((u) =>
      activeEmailSet.has(String(u.email || "").toLowerCase())
    ).length;

    const joinDate = user.createdAt || new Date();
    const deadline = new Date(joinDate);
    deadline.setDate(deadline.getDate() + 30);

    const now = new Date();

    const performanceCompleted = directActiveCount >= 10;
    const performanceExpired = now > deadline && !performanceCompleted;

    if (directUsers.length >= 50 && !user.royaltyBonusEnabled) {
      user.royaltyBonusEnabled = true;
      user.royaltyActivatedAt = new Date();
      await user.save();
    }

    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

     const startToday = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate()
);

const endToday = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  23,
  59,
  59
);
    
    let filterStart = startThisMonth;
let filterEnd = null;

if (
  Number.isInteger(Number(month)) &&
  Number.isInteger(Number(year))
) {

  filterStart = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  filterEnd = new Date(
    Number(year),
    Number(month),
    0,
    23,
    59,
    59
  );

}

     const rawBonusHistory = await BonusLedger.find({
  email: String(user.email).toLowerCase()
}).sort({ date: -1 }).lean();

// প্রতিটা হিস্ট্রির জন্য ডাউলাইন বা যার থেকে বোনাস এসেছে তার আসল ইউজার খুঁজে বের করা
const allBonusHistory = await Promise.all(
  rawBonusHistory.map(async (item) => {
    let actualFromName = item.fromName;
    let actualUplineName = user.name;

    // যদি fromEmail থাকে, তবে ইউজার টেবিল থেকে তার আসল নামটি খুঁজে আনুন
    if (item.fromEmail) {
      const downlineUser = await User.findOne({ 
        email: String(item.fromEmail).toLowerCase() 
      }).lean();
      
      if (downlineUser) {
        actualFromName = downlineUser.name;
        // যদি ডাটাবেজে যার রেফার কোড ব্যবহার করে জয়েন করেছে তার নাম বের করতে চান:
        // const referrer = await User.findOne({ referralCode: downlineUser.referredBy }).lean();
        // if (referrer) actualUplineName = referrer.name;
      }
    }

    return {
      ...item,
      fromName: actualFromName || "Direct Member",
      uplineName: actualUplineName
    };
  })
);
      




    const performanceHistory = allBonusHistory
  .filter(
    x =>
      x.bonusType === "performance" ||
      x.type === "Performance Bonus"
  )
  .sort((a, b) => new Date(b.date) - new Date(a.date));

    const sumBonus = (type, from, to) => {

  return allBonusHistory

    .filter(x => {

      const bonusType =
        String(
          x.bonusType || x.type || ""
        ).toLowerCase();

      const target =
        String(type).toLowerCase();

      const d = new Date(x.date);

      return (

        bonusType === target &&

        d >= from &&

        (!to || d <= to)

      );

    })

    .reduce(
      (sum, x) =>
        sum + Number(x.amount || 0),
      0
    );

};

    const teamRows = allBonusHistory.filter(
  x => x.bonusType === "Team Bonus"
);

const teamSum = (from, to) => {

  return teamRows

    .filter(x => {

      const d = new Date(x.date);

      return d >= from && d <= to;

    })

    .reduce(

      (sum, x) => sum + Number(x.amount || 0),

      0

    );

};

const teamLevelIncome = level => {

  return teamRows

    .filter(x => Number(x.level) === level)

    .reduce(

      (sum, x) => sum + Number(x.amount || 0),

      0

    );

};

const todayTeamRows = teamRows.filter(x => {

  const d = new Date(x.date);

  return d >= startToday && d <= endToday;

});

    const level1Users = directUsers;

    const level2Users = await User.find({
      referredBy: { $in: level1Users.map((u) => u.referCode || u.walletId) }
    });

    const level3Users = await User.find({
      referredBy: { $in: level2Users.map((u) => u.referCode || u.walletId) }
    });

    const levelIncome = (level) =>
      allBonusHistory
        .filter((x) => x.bonusType === "team" && Number(x.level) === level)
        .reduce((sum, x) => sum + Number(x.amount || 0), 0);

    const royaltyBusinessRows = allBonusHistory.filter(
      (x) => x.bonusType === "royalty"
    );

    const thisMonthBusiness = royaltyBusinessRows
      .filter((x) => new Date(x.date) >= startThisMonth)
      .reduce((sum, x) => sum + Number(x.businessAmount || 0), 0);

    const lastMonthBusiness = royaltyBusinessRows
      .filter((x) => {
        const d = new Date(x.date);
        return d >= startLastMonth && d <= endLastMonth;
      })
      .reduce((sum, x) => sum + Number(x.businessAmount || 0), 0);

    const getLevelUsers = async (baseUsers, level, result = {}) => {
      if (level > 7 || baseUsers.length === 0) return result;

      const codes = baseUsers.map((u) => u.referCode || u.walletId).filter(Boolean);

      const nextUsers = await User.find({
        referredBy: { $in: codes }
      });

      result[`level${level}Count`] = baseUsers.length;
      result[`level${level}ThisMonth`] = baseUsers.filter(
        (u) => new Date(u.createdAt) >= startThisMonth
      ).length;
      result[`level${level}LastMonth`] = baseUsers.filter((u) => {
        const d = new Date(u.createdAt);
        return d >= startLastMonth && d <= endLastMonth;
      }).length;

      return getLevelUsers(nextUsers, level + 1, result);
    };

    const treeData = await getLevelUsers(directUsers, 1, {});

   const todayJoinCount = {};

for (let level = 1; level <= 5; level++) {

  todayJoinCount[level] = 0;

}

todayTeamRows.forEach(row => {

  const lvl = Number(row.level || 0);

  if (todayJoinCount[lvl] !== undefined) {

    todayJoinCount[lvl]++;

  }

});
    
    
    const referralBonusMap = {};

allBonusHistory
  .filter(x => x.type === "Referral Bonus")
  .forEach(x => {
    referralBonusMap[
      String(x.fromEmail || "").toLowerCase()
    ] = Number(x.amount || 0);
  });
    
    const history = directUsers.map((u) => {

  const inv = activeInvestments.find(
    i => i.email.toLowerCase() === u.email.toLowerCase()
  );

  return {

    name: u.name,

    email: u.email,

    referId: u.referCode || u.walletId,

    joinDate: u.createdAt,

    status: inv ? "Active" : "Inactive",

    firstInvestment: !!inv,

    investmentYears: inv?.years || 0,

    
    earning:
      referralBonusMap[
        String(u.email).toLowerCase()
      ] || 0
  

  };

});

    const referralRows = allBonusHistory.filter(
  x => x.bonusType === "Referral Bonus"
);

const referBonus = {

  enabled: user.activeStatus === "Active",

  balance: Number(user.referralIncome || 0),

  totalBonus: referralRows.reduce(
    (sum, x) => sum + Number(x.amount || 0),
    0
  ),

  count: history.filter(x => x.firstInvestment).length,

  todayBonus: referralRows
    .filter(x => {
      const d = new Date(x.date);
      return d >= startToday && d <= endToday;
    })
    .reduce((sum, x) => sum + Number(x.amount || 0), 0),

  thisMonthBonus: referralRows
    .filter(x => new Date(x.date) >= startThisMonth)
    .reduce((sum, x) => sum + Number(x.amount || 0), 0),

  lastMonthBonus: referralRows
    .filter(x => {
      const d = new Date(x.date);
      return d >= startLastMonth && d <= endLastMonth;
    })
    .reduce((sum, x) => sum + Number(x.amount || 0), 0),

  list: history,

  history: referralRows

};

    const updatedUser = await User.findOne({ email: String(email || "").toLowerCase() });

    return res.json({
      success: true,
      user: updatedUser,
      referCode,

      history,
      referBonus,

      performance: {
  enabled: !!user.performanceEnabled,
  status: user.performanceStatus || "Inactive",

  balance: Number(user.performanceIncome || 0),

totalIncome: Number(user.performanceIncome || 0),

  directActiveCount,

  required: 10,

  remaining: Math.max(10 - directActiveCount, 0),

  deadline,

  daysLeft: Math.max(
    0,
    Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  ),

  expired: user.performanceStatus === "Expired",

  completed: directActiveCount >= 10,

  adminOverride: !!user.performanceAdminOverride,

  thisMonthBonus: sumBonus("Performance Bonus", startThisMonth),

  lastMonthBonus: sumBonus(
    "Performance Bonus",
    startLastMonth,
    endLastMonth
  ),

        selectedMonthBonus: sumBonus(
    "Performance Bonus",
    filterStart,
    filterEnd
),

  history: performanceHistory.filter(item => {

  if (!filterEnd) {

    return new Date(item.date) >= filterStart;

  }

  const d = new Date(item.date);

  return d >= filterStart && d <= filterEnd;

}),
},

      team: {

  enabled:
user.activeStatus === "Active" &&
user.teamBonusEnabled !== false,

  balance: Number(user.teamIncome || 0),

  todayBonus: teamSum(
    startToday,
    endToday
  ),

  thisMonthBonus: teamSum(
    startThisMonth,
    now
  ),

  lastMonthBonus: teamSum(
    startLastMonth,
    endLastMonth
  ),

  todayJoin: todayTeamRows.length,

  todayJoinCount,

  level1Income: teamLevelIncome(1),

  level2Income: teamLevelIncome(2),

  level3Income: teamLevelIncome(3),

  level4Income: teamLevelIncome(4),

  level5Income: teamLevelIncome(5),

  history: teamRows,

  level1Count:
    treeData.level1Count || 0,

  level2Count:
    treeData.level2Count || 0,

  level3Count:
    treeData.level3Count || 0,

  level4Count:
    treeData.level4Count || 0,

  level5Count:
    treeData.level5Count || 0

},

      royalty: {
        enabled: !!user.royaltyBonusEnabled,
        balance: Number(user.royaltyIncome || 0),
        directCount: directUsers.length,
        required: 50,
        remaining: Math.max(50 - directUsers.length, 0),
        thisMonthBusiness,
        lastMonthBusiness,
        thisMonthRoyalty: sumBonus("royalty", startThisMonth),
        lastMonthRoyalty: sumBonus("royalty", startLastMonth, endLastMonth)
      },

      treeData,
      bonusHistory: allBonusHistory
    });
  } catch (err) {
    console.log("REFER DATA ERROR:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.post("/my-bonus-ledger", auth, async (req, res) => {
  const { email } = req.body;

  const data = await BonusLedger.find({ email })
    .sort({ date: -1 });

  res.json(data);
});

app.post("/investment-summary", async (req, res) => {

try{

const { email } = req.body;


if(!email){

return res.status(400).json({

success:false,
msg:"Email required"

});

}


const investments =
await Investment.find({

email:email.toLowerCase()

});


let totalInvestment=0;

let monthlyInvestment=0;

let totalReturn=0;

let activePlan=0;

let rateSum=0;

let rateCount=0;



const now = new Date();

const currentMonth =
now.getMonth();

const currentYear =
now.getFullYear();



for(const inv of investments){


const monthly =
Number(

inv.monthlyAmount||

inv.amount||

0

);



const years =
Number(

inv.years||

1

);



const rate =
Number(

inv.rate||

0

);




const investedAmount =
monthly*
Number(
inv.monthsPaid||1
);




totalInvestment+=investedAmount;




if(

String(inv.status)
==="Active"

){

activePlan++;

}




if(rate>0){

rateSum+=rate;

rateCount++;

}





const created=
new Date(

inv.createdAt||

inv.startDate||

new Date()

);




if(

created.getMonth()
===currentMonth

&&

created.getFullYear()
===currentYear

){

monthlyInvestment+=investedAmount;

}




totalReturn += Number(
    inv.totalInterest || 0
);



}



const returnRate =

rateCount>0

?

Number(

(

rateSum/

rateCount

)

.toFixed(2)

)

:

0;




res.json({

success:true,

totalInvestment,

monthlyInvestment,

totalReturn,

returnRate,

activePlan

});


}catch(err){


console.log(

"INVESTMENT SUMMARY ERROR",

err

);



res.status(500).json({

success:false,

msg:"Server error"

});


}


});

app.post("/create-razorpay-order", async (req, res) => {
  try {
    const { email, amount } = req.body;
    const addAmount = Number(amount);

    if (!email || addAmount < 100) {
      return res.json({ success: false, msg: "Minimum add cash ₹100" });
    }

    if (addAmount > 50000) {
      return res.json({ success: false, msg: "Maximum add cash ₹50,000" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    const order = await razorpay.orders.create({
      amount: addAmount * 100,
      currency: "INR",
      receipt: `wallet_${Date.now()}`
    });

    await WalletTransaction.create({
      email: user.email,
      walletId: user.walletId || user.referralCode || user._id.toString(),
      type: "credit",
      title: "Add Cash",
      description: "Razorpay payment initiated",
      amount: addAmount,
      status: "Pending",
      openingBalance: Number(user.balance || 0),
      closingBalance: Number(user.balance || 0),
      razorpayOrderId: order.id
    });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order
    });

  } catch (err) {
    console.log("RAZORPAY ORDER ERROR:", err);
    res.status(500).json({ success: false, msg: "Order create failed" });
  }
});

app.post("/verify-razorpay-payment", async (req, res) => {
  try {
    const {
      email,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const alreadyPaid = await WalletTransaction.findOne({
      razorpayPaymentId: razorpay_payment_id
    });

    if (alreadyPaid) {
      return res.json({
        success: false,
        msg: "This payment is already credited"
      });
    }

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      await WalletTransaction.updateOne(
        { razorpayOrderId: razorpay_order_id },
        { $set: { status: "Failed", description: "Signature verification failed" } }
      );

      return res.json({ success: false, msg: "Payment verification failed" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    const openingBalance = Number(user.balance || 0);
    const closingBalance = openingBalance + Number(amount);

    user.balance = closingBalance;
    await user.save();

    await WalletTransaction.updateOne(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          status: "Success",
          description: "Wallet cash added by Razorpay",
          openingBalance,
          closingBalance,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        }
      }
    );

    res.json({
      success: true,
      msg: "Wallet balance added successfully"
    });

  } catch (err) {
    console.log("RAZORPAY VERIFY ERROR:", err);

    if (err.code === 11000) {
      return res.json({ success: false, msg: "Duplicate payment detected" });
    }

    res.status(500).json({ success: false, msg: "Payment verify failed" });
  }
});

app.post("/wallet-history", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase();

    const history = await WalletHistory.find({ email }).sort({ date: -1 });

    res.json({
      success: true,
      history
    });
  } catch (err) {
    console.log("WALLET HISTORY ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.post("/bank-details", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase();

    const bank = await BankDetails.findOne({ email });

    return res.json({
      success: true,
      bank
    });
  } catch (err) {
    console.log("BANK DETAILS LOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});

app.post("/save-bank-details", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase();

    const {
      accountHolderName,
      mobile,
      bankName,
      accountNumber,
      ifscCode,
      upiId
    } = req.body;

    if (!email || !accountHolderName || !mobile || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        msg: "All required fields are mandatory"
      });
    }

    const bank = await BankDetails.findOneAndUpdate(
      { email },
      {
        email,
        accountHolderName,
        mobile,
        bankName,
        accountNumber,
        ifscCode: String(ifscCode).toUpperCase(),
        upiId: upiId || ""
      },
      {
        new: true,
        upsert: true
      }
    );

    return res.json({
      success: true,
      msg: "Bank details saved successfully",
      bank
    });
  } catch (err) {
    console.log("BANK DETAILS SAVE ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});


// 🔄 ইউজারের আসল Wallet ID সহ হিস্ট্রি গেট করার API
app.get("/daily-reward/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const formattedEmail = email.toLowerCase();

    // ১. User মডেল থেকে ইউজারের আসল wallet বা আইডি খুঁজে বের করা
    // (এখানে আপনার প্রোজেক্টে User মডেলের নাম User না হয়ে অন্য কিছু হলে সেটা দিন, যেমন: user বা UserModel)
    const userData = await User.findOne({ email: formattedEmail });
    
    // ইউজারের ডাটাবেসে থাকা আসল wallet আইডি, না থাকলে ডামি ব্যাকআপ
    const trueWalletId = userData && userData.wallet ? userData.wallet : "N/A";

    // ২. DailyReward মডেল থেকে হিস্ট্রি খোঁজা
    const rewardData = await DailyReward.findOne({ email: formattedEmail });

    if (!rewardData) {
      return res.status(200).json({
        success: true,
        walletId: trueWalletId, // আসল ওয়ালেট আইডি যাচ্ছে
        history: []
      });
    }

    // ৩. আসল ওয়ালেট আইডি ও হিস্ট্রি ফ্রন্টএন্ডে পাঠানো
    res.status(200).json({
      success: true,
      walletId: trueWalletId, // আসল ওয়ালেট আইডি যাচ্ছে
      history: rewardData.history || []
    });

  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ success: false, msg: "Server error while fetching history" });
  }
});




app.post("/daily-reward", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, msg: "Email required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // আজকের তারিখ (Asia/Kolkata টাইমজোনে স্ট্রিং ফরম্যাট)
    const todayStr = new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata"
    });

    let reward = await DailyReward.findOne({ email });

    // ইউজার যদি একদম প্রথমবার ক্লেইম করে
    if (!reward) {
      reward = new DailyReward({
        email,
        totalReward: 0,
        claimCount: 0,
        lastClaimDate: "",
        history: []
      });
    }

    // একই দিনে দুইবার ক্লেইম করার চেষ্টা করলে আটকে দেবে
    if (reward.lastClaimDate === todayStr) {
      return res.status(400).json({
        success: false,
        msg: "Already claimed today",
        reward
      });
    }

    // --- 🌟 টানা দিন (Streak) চেক করার লজিক 🌟 ---
    let nextClaimCount = Number(reward.claimCount || 0) + 1;

    if (reward.lastClaimDate) {
      // শেষ ক্লেইমের তারিখ এবং আজকের তারিখের মধ্যে দিনের পার্থক্য বের করার নিয়ম
      const [lastDay, lastMonth, lastYear] = reward.lastClaimDate.split("/").map(Number);
      const [currDay, currMonth, currYear] = todayStr.split("/").map(Number);

      // দুই তারিখেরই UTC মিডনাইট অবজেক্ট তৈরি (সঠিক পার্থক্যের জন্য)
      const lastDateObj = new Date(Date.UTC(lastYear, lastMonth - 1, lastDay));
      const currDateObj = new Date(Date.UTC(currYear, currMonth - 1, currDay));

      const timeDiff = currDateObj - lastDateObj;
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // ঠিক পরের দিন এসেছে -> স্ট্রিক বজায় আছে
        // তবে আগের দিন যদি অলরেডি ১০ নম্বর (স্পেশাল) ক্লেইম হয়ে থাকে, তবে আজ আবার ১ থেকে শুরু হবে
        if (reward.claimCount >= 10) {
          nextClaimCount = 1;
        }
      } else if (daysDiff > 1) {
        // ১ দিনের বেশি গ্যাপ হয়েছে -> স্ট্রিক ভেঙে গেছে! আবার ১ম দিন থেকে শুরু
        nextClaimCount = 1;
      }
    }

    // ১০ নম্বর দিন হলে স্পেশাল অফার ট্রু হবে
    const special = nextClaimCount === 10;
    
    // স্পেশাল হলে ৫০ টাকা, নরমাল হলে ১ থেকে ১০ টাকার মধ্যে র্যান্ডম
    const amount = special ? 50 : Math.floor(Math.random() * 10) + 1;

    // ডাটাবেজ মডেল আপডেট
    reward.claimCount = nextClaimCount;
    reward.totalReward = Number(reward.totalReward || 0) + amount;
    reward.lastClaimDate = todayStr;
    reward.history.push({
      amount,
      special,
      date: new Date()
    });

    await reward.save();

    // ইউজারের ওয়ালেট ব্যালেন্স আপডেট
    user.wallet = Number(user.wallet || 0) + amount;
    user.balance = Number(user.balance || 0) + amount;
    user.totalEarning = Number(user.totalEarning || 0) + amount;

    await user.save();

    // ওয়ালেট হিস্ট্রি তৈরি
    const walletHistory = await WalletHistory.create({
      email,
      type: "Credit",
      amount,
      title: special ? "Special Daily Reward" : "Daily Reward",
      description: "Daily reward added",
      status: "Success",
      date: new Date()
    });

    return res.json({
      success: true,
      msg: special 
        ? "Special Reward Claimed Successfully" 
        : "Reward Claimed Successfully",
      amount,
      special,
      wallet: user.wallet,
      balance: user.balance,
      walletHistory,
      reward
    });

  } catch (err) {
    console.log("DAILY REWARD ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message
    });
  }
});






            
app.post("/withdraw-info", async (req, res) => {
  try {
    const rawEmail = req.body.email || "";
    const email = rawEmail.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });

    const bank = await BankDetails.findOne({ email });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // আজকের ডেবিট রিকোয়েস্ট হিসাব
    const totalDebitedDocs = await WithdrawRequest.find({
      email,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $in: ["Pending", "Success"] }
    });

    const totalDebited = totalDebitedDocs.reduce((a, b) => a + Number(b.amount || 0), 0);
    let withdrawableBalance = Number(user.todayBalance || 0) - totalDebited;
    if (withdrawableBalance < 0) withdrawableBalance = 0;

    // ১. উইথড্র হিস্টরি (Debit) ফেচ করা
    const withdrawalHistory = await WithdrawRequest.find({ email }).lean();
    const formattedWithdrawals = withdrawalHistory.map(w => ({
      ...w,
      type: "Debit",
      createdAt: w.createdAt || w.date
    }));

    // ২. BonusLedger থেকে ক্রেডিট হিস্টরি (যেমন ৫০ টাকা বোনাস) ফেচ করা
    let formattedCredits = [];
    try {
      const bonusDocs = await BonusLedger.find({ email }).lean();
      formattedCredits = bonusDocs.map(b => ({
        _id: b._id,
        amount: b.amount,
        status: "Success",
        createdAt: b.createdAt || b.date,
        type: "Credit",
        note: b.note || b.bonusType || "Bonus Credited"
      }));
    } catch (e) {
      console.log("BonusLedger fetch error:", e);
    }

    // ৩. উভয় হিস্টরি একত্রিত করে লেটেস্ট ডেট অনুযায়ী সর্ট করা
    const combinedHistory = [...formattedWithdrawals, ...formattedCredits].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({
      success: true,
      todayBalance: Number(user.todayBalance || 0),
      withdrawableBalance: withdrawableBalance * 0.8,
      bank: bank || null,
      history: combinedHistory
    });

  } catch (err) {
    console.log("WITHDRAW INFO ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});
        



// --- উইথড্র রিকোয়েস্ট সাবমিট করার API ---
app.post("/withdraw-request", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase();
    const amount = Number(req.body.amount);

    const user = await User.findOne({ email });
    const bank = await BankDetails.findOne({ email });

    if (!user) return res.status(404).json({ success: false, msg: "User not found" });
    if (!bank) return res.status(400).json({ success: false, msg: "Please add bank details first" });
    if (amount < 100) return res.status(400).json({ success: false, msg: "Minimum withdraw amount is 100" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeRequestToday = await WithdrawRequest.findOne({
      email,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $in: ["Pending", "Success"] }
    });

    if (activeRequestToday) {
      return res.status(400).json({
        success: false,
        msg: "You can only make one withdraw request per day. Please try again tomorrow."
      });
    }

    const totalDebitedDocs = await WithdrawRequest.find({
      email,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $in: ["Pending", "Success"] }
    });

    const totalDebited = totalDebitedDocs.reduce((a, b) => a + Number(b.amount || 0), 0);
    const withdrawableBalance = Number(user.todayBalance || 0) - totalDebited;

    if (amount > withdrawableBalance) {
      return res.status(400).json({ success: false, msg: "Amount is greater than withdrawable balance" });
    }

    await WithdrawRequest.create({
      email,
      name: user.name || "",
      walletId: user.walletId || "",
      amount,
      bankDetails: {
        accountHolderName: bank.accountHolderName,
        mobile: bank.mobile,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        upiId: bank.upiId
      },
      status: "Pending",
      type: "Debit"
    });

    user.todayBalance = Number(user.todayBalance || 0) - amount;
    await user.save();
    // 🔔 Push Notification for Withdrawal Request
    await sendPushNotification(email, "Withdrawal Update 💸", "Your withdrawal request has been submitted successfully and is being processed.", "/withdraw");

    return res.json({
      success: true,
      msg: "Withdraw request submitted successfully"
    });

  } catch (err) {
    console.log("WITHDRAW REQUEST ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});
    



app.post("/admin/withdraw-action", async (req, res) => {
  try {
    const { id, status, rejectReason } = req.body;
    const request = await WithdrawRequest.findById(id);

    if (!request) return res.status(404).json({ success: false, msg: "Request not found" });
    if (request.status !== "Pending") return res.status(400).json({ success: false, msg: "This request already processed" });

    // --- SUCCESS LOGIC ---
    if (status === "Success") {
      request.status = "Success";
      request.actionDate = new Date();
      await request.save();

      // নোট: আপনার রিকোয়েস্ট অনুযায়ী মেইন ওয়ালেট হিস্ট্রি (WalletHistory) আপডেট সম্পূর্ণ বন্ধ রাখা হলো।

      return res.json({ success: true, msg: "Withdraw Success", request });
    }

    // --- REJECTED LOGIC ---
    if (status === "Rejected") {
      request.status = "Rejected";
      request.rejectReason = rejectReason || "Rejected by admin";
      request.actionDate = new Date();
      await request.save();

      // ⚡ নতুন রিফান্ড লজিক: ইউজারের todayBalance-এ উইথড্রাল অ্যামাউন্টটি যোগ করা হলো
      await User.findOneAndUpdate(
        { email: request.email },
        { $inc: { todayBalance: Number(request.amount || 0) } }
      );

      // নোট: আপনার রিকোয়েস্ট অনুযায়ী মেইন ওয়ালেট হিস্ট্রি (WalletHistory) আপডেট বা ক্রিয়েট সম্পূর্ণ বন্ধ রাখা হলো।

      return res.json({ success: true, msg: "Withdraw Rejected", request });
    }

    return res.status(400).json({ success: false, msg: "Invalid status provided" });
  } catch (err) {
    console.log("ADMIN WITHDRAW ACTION ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// ১. সাবস্ক্রিপশন সেভ করার রাউট
app.post("/save-push-subscription", async (req, res) => {
  try {
    const { email, subscription } = req.body;
    await User.findOneAndUpdate({ email }, { pushSubscription: subscription });
    res.status(200).json({ success: true, message: "Subscription saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ২. VAPID Public Key পাঠানোর রাউট
app.get("/get-vapid-key", (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});




// ================= DOWNLOAD SLIP =================
app.get("/download-slip/:id", async (req, res) => {

  const data = await Investment.findById(req.params.id);

  if (!data) return res.send("No data");

  const text = `
SAVE MONEY SLIP
------------------------
Amount (Monthly): ₹${data.amount}
Years: ${data.years}
Rate: ${data.rate}% p.a

Total Invested: ₹${data.amount * 12 * data.years}
Total Return: ₹${data.total}

Date: ${data.date}
------------------------
`;

  res.setHeader("Content-Disposition", "attachment; filename=slip.txt");
  res.send(text);
});
async function checkMaturity() {

  const now = new Date();

  const data = await Investment.find({
    status: "Active",
    maturityDate: { $lte: now }
  });

  for (let inv of data) {

    const user = await User.findOne({ email: inv.email });

    if (user) {
      user.balance += inv.total;
      await user.save();
    }

    inv.status = "Completed";
    await inv.save();

    await sendSMS(
  user.mobile,
  `Your investment matured. ₹${inv.total} credited to wallet.`
);

    console.log("Maturity done:", inv.email);
  }
}
setInterval(checkMaturity, 60000);

async function sendSMS(to, message) {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to
    });
    console.log("SMS sent");
  } catch (err) {
    console.log("SMS error:", err.message);
  }
}

async function sendNotification(
  email,
  title,
  message
){

  await Notification.create({
    email,
    title,
    message
  });

  const socketId = onlineUsers[email];

  if (socketId) {

    io.to(socketId).emit(
      "new_notification",
      {
        title,
        message
      }
    );

  }

}

app.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.log("USER FETCH ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.get("/verify-certificate/:id", async (req, res) => {
  const inv = await Investment.findById(req.params.id);

  if (!inv) {
    return res.send("<h1>Invalid Certificate</h1>");
  }

  res.send(`
    <h1 style="color:green">Certificate Verified</h1>
    <p>Email: ${inv.email}</p>
    <p>Monthly Investment: INR ${inv.monthlyAmount}</p>
    <p>Status: ${inv.status}</p>
  `);
});

app.get("/notifications/:email", async (req, res) => {
  try {

    const email = req.params.email;

    const data = await Notification.find({ email })
      .sort({ date: -1 }); // latest first

    res.json(data);

  } catch (err) {
    console.log("NOTIFICATION ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});



app.get("/leaderboard", async (req, res) => {

  const users = await User.find()
    .sort({
      totalDirect: -1
    })
    .limit(50)
    .select(
      "name rank totalDirect totalEarning"
    );

  res.json(users);
});

app.get("/admin-tickets", auth, adminAuth, async (req, res) => {
  const tickets = await SupportTicket.find()
    .sort({ createdAt: -1 });

  res.json(tickets);
});

app.get("/admin/withdraw-requests", async (req, res) => {
  try {
    const requests = await WithdrawRequest.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (err) {
    console.log("ADMIN WITHDRAW LIST ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

    
    app.get("/investment-certificate/:id", async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) return res.status(404).send("Investment not found");

    const amount = investment.monthlyAmount || investment.amount || 0;
    const rate = investment.rate || investment.returnRate || 0;
    const certNo = investment.certificateNo || `SM-CERT-${investment._id}`;
    
    // Format issue date or fallback to current date
    const issueDate = investment.createdAt 
      ? new Date(investment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : "12 Aug 2026";

    const html = `
      <html>
        <head>
          <title>Investment Certificate</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #e2e8f0;
              font-family: 'Montserrat', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .certificate-container {
              width: 800px;
              background: #fffdf9;
              background-image: radial-gradient(#e6deb9 0.75px, transparent 0.75px), radial-gradient(#e6deb9 0.75px, #fffdf9 0.75px);
              background-size: 30px 30px;
              background-position: 0 0, 15px 15px;
              border: 16px solid transparent;
              border-image: url('https://i.imgur.com/3QZ1Q7r.png') 30 round; /* Golden Ornate Border Fallback / Styling */
              box-shadow: 0 25px 50px rgba(0,0,0,0.25);
              padding: 40px 50px;
              position: relative;
              box-sizing: border-box;
              overflow: hidden;
            }
            /* Fallback CSS Border if image doesn't load */
            .border-box {
              border: 4px double #b8860b;
              padding: 30px;
              position: relative;
              background: rgba(255, 255, 255, 0.85);
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 380px;
              opacity: 0.06;
              pointer-events: none;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
            }
            .logo-shield {
              width: 75px;
              margin-bottom: 5px;
            }
            .company-name {
              font-family: 'Cinzel', serif;
              font-size: 28px;
              font-weight: 800;
              color: #1a202c;
              letter-spacing: 3px;
              margin: 0;
            }
            .company-sub {
              font-family: 'Cinzel', serif;
              font-size: 11px;
              letter-spacing: 6px;
              color: #b8860b;
              margin-top: 4px;
              font-weight: 700;
            }
            .divider {
              text-align: center;
              color: #b8860b;
              margin: 15px 0;
              font-size: 18px;
            }
            .cert-title {
              font-family: 'Cinzel', serif;
              font-size: 32px;
              font-weight: 700;
              color: #1a202c;
              text-align: center;
              letter-spacing: 1px;
              margin: 10px 0 5px 0;
            }
            .cert-desc {
              text-align: center;
              font-size: 13px;
              color: #4a5568;
              font-family: 'Playfair Display', serif;
              font-style: italic;
              margin-bottom: 30px;
            }
            .details-table {
              width: 100%;
              margin-bottom: 25px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px dotted #cbd5e0;
              padding: 10px 0;
              font-size: 14px;
            }
            .row b {
              color: #2d3748;
              font-weight: 600;
            }
            .row span {
              color: #1a202c;
              font-weight: 600;
            }
            .verified-banner {
              text-align: center;
              color: #b8860b;
              font-weight: 600;
              font-size: 13px;
              margin: 20px 0;
              letter-spacing: 1px;
            }
            .footer-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 30px;
            }
            .issue-box {
              text-align: center;
              font-size: 13px;
              color: #4a5568;
            }
            .issue-box .date {
              font-weight: 600;
              color: #1a202c;
              margin-top: 4px;
              border-top: 1px solid #a0aec0;
              display: inline-block;
              padding-top: 4px;
            }
            .center-seal {
              text-align: center;
            }
            .seal-img {
              width: 110px;
            }
            .signature-box {
              text-align: center;
            }
            .sig-font {
              font-family: 'Playfair Display', cursive;
              font-size: 26px;
              color: #1a202c;
              font-style: italic;
              margin-bottom: -5px;
            }
            .sig-line {
              border-top: 1px solid #a0aec0;
              width: 160px;
              margin-top: 8px;
              padding-top: 4px;
              font-size: 12px;
              color: #4a5568;
            }
            .print-btn {
              display: block;
              margin: 20px auto 0 auto;
              padding: 12px 30px;
              background: #16a34a;
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 15px;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .print-btn:hover { background: #15803d; }
            @media print {
              .print-btn { display: none; }
              body { background: none; padding: 0; }
              .certificate-container { box-shadow: none; border: none; }
            }
          </style>
        </head>
        <body>
          <div>
            <div class="certificate-container">
              <div class="border-box">
                <!-- Background Watermark Shield -->
                <svg class="watermark" viewBox="0 0 24 24" fill="#b8860b"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>

                <div class="header">
                  <svg class="logo-shield" viewBox="0 0 24 24" fill="#d97706"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.85-7 9.92-3.87-1.07-7-5.25-7-9.92V6.3l7-3.12z"/></svg>
                  <div class="company-name">SAVE MONEY</div>
                  <div class="company-sub">INVESTMENT</div>
                </div>

                <div class="divider">❦ ❦ ❦</div>

                <div class="cert-title">INVESTMENT CERTIFICATE</div>
                <div class="cert-desc">This is to certify that the following investment has been successfully created under Save Money Investment.</div>

                <div class="details-table">
                  <div class="row"><b>Certificate No</b><span>${certNo}</span></div>
                  <div class="row"><b>Monthly Investment</b><span>₹${amount}</span></div>
                  <div class="row"><b>Tenure</b><span>${investment.years || 0} Years</span></div>
                  <div class="row"><b>Return Rate</b><span>${rate}%</span></div>
                  <div class="row"><b>Total Plan Amount</b><span>₹${investment.totalPlanAmount || 0}</span></div>
                  <div class="row"><b>Total Interest</b><span>₹${investment.totalInterest || 0}</span></div>
                  <div class="row"><b>Maturity Amount</b><span>₹${investment.maturityAmount || 0}</span></div>
                  <div class="row"><b>Status</b><span>${investment.status || "Active"}</span></div>
                </div>

                <div class="verified-banner">★★★ Verified Save Money Investment ★★★</div>

                <div class="footer-section">
                  <div class="issue-box">
                    <div>Issue Date</div>
                    <div class="date">${issueDate}</div>
                  </div>

                  <div class="center-seal">
                    <svg class="seal-img" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="#d97706" stroke="#fff" stroke-width="2"/>
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="3,3"/>
                      <text x="50" y="25" font-size="9" fill="#fff" font-weight="bold" text-anchor="middle" font-family="Cinzel">VERIFIED INVESTMENT</text>
                      <text x="50" y="80" font-size="9" fill="#fff" font-weight="bold" text-anchor="middle" font-family="Cinzel">SAVE MONEY</text>
                      <path d="M50 35 L58 45 L53 45 L53 58 L47 58 L47 45 L42 45 Z" fill="#fff"/>
                    </svg>
                  </div>

                  <div class="signature-box">
                    <div class="sig-font">Gasleeln</div>
                    <div class="sig-line">Authorized Signatory<br>Save Money Investment</div>
                  </div>
                </div>
              </div>
            </div>
            <button class="print-btn" onclick="window.print()">Download / Print Certificate</button>
          </div>
        </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.log("CERTIFICATE ERROR:", err);
    res.status(500).send("Server error");
  }
});

                  






app.get("/investment-slip/:planId/:historyId", async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.planId);

    if (!investment) return res.status(404).send("Investment not found");

    const history = investment.history.id(req.params.historyId);

    if (!history) return res.status(404).send("Slip not found");

    const slipNo = history.slipNo || `SMSLIP-${history._id || Date.now()}`;
    const type = history.type || "START SIP";
    const amount = history.amount || investment.monthlyAmount || investment.amount || 0;

    const html = `
      <html>
        <head>
          <title>Payment Slip</title>
          <style>
            body{font-family:Arial;background:#f4f7ff;padding:30px;color:#071747}
            .slip{max-width:600px;margin:auto;background:white;border-radius:24px;padding:30px;border:2px solid #2563eb;box-shadow:0 20px 40px rgba(0,0,0,.12)}
            h1{text-align:center;color:#2563eb}
            .row{display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:14px 0;font-size:18px}
            .success{text-align:center;color:#16a34a;font-weight:bold;margin-top:20px}
            button{margin-top:25px;width:100%;padding:14px;border:none;border-radius:12px;background:#2563eb;color:white;font-weight:bold;font-size:16px}
          </style>
        </head>
        <body>
          <div class="slip">
            <h1>PAYMENT SLIP</h1>

            <div class="row"><b>Slip No</b><span>${slipNo}</span></div>
            <div class="row"><b>Payment Type</b><span>${type}</span></div>
            <div class="row"><b>Amount</b><span>₹${amount}</span></div>
            <div class="row"><b>Date</b><span>${new Date(history.date).toLocaleString("en-IN")}</span></div>
            <div class="row"><b>Status</b><span>Success</span></div>

            <p class="success">✅ Payment Successfully Recorded</p>
            <button onclick="window.print()">Download / Print Slip</button>
          </div>
        </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.log("SLIP ERROR:", err);
    res.status(500).send("Server error");
  }
});



app.get(
"/renew-days-left/:id",
async(req,res)=>{

const investment =
await Investment.findById(req.params.id);

const now = new Date();

const renew =
new Date(investment.nextRenewDate);

const diff =
Math.ceil(
(renew-now)/(1000*60*60*24)
);

res.json({
daysLeft: diff
});

});


// ==================== today wallet to main wallet (Updated) ====================
// প্রতিদিন রাত ১২:০০ টায় (0 0 * * *) রান হবে
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running Midnight Wallet Settlement Cron...");

    // যাদের Today Wallet-এ অবশিষ্টাংশ বা পুরো ব্যালেন্স রয়ে গেছে তাদের খোঁজা হবে
    const users = await User.find({ todayBalance: { $gt: 0 } });

    if (users.length === 0) {
      console.log("No users found with remaining todayBalance. Skipping.");
      return;
    }

    const bulkUserOps = [];
    const historyOps = [];

    for (let user of users) {
      const remainingBalance = Number(user.todayBalance || 0);

      if (remainingBalance > 0) {
        // ১. আজ যা বেঁচে আছে (১০০% অথবা ৮০% উইথড্রর পর বাকি ২০%) তা মেইন ওয়ালেটে যোগ হবে
        bulkUserOps.push({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $inc: {
                wallet: remainingBalance,
                balance: remainingBalance,
                walletBalance: remainingBalance
              },
              $set: { todayBalance: 0 } // টুডে ওয়ালেট ক্লিয়ার হয়ে যাবে
            }
          }
        });

        const userEmail = user.email ? String(user.email).toLowerCase() : "unknown@user.com";
        
        // ২. ওয়ালেট হিস্ট্রিতে সেটেলমেন্ট ট্র্যাকিং এন্ট্রি
        historyOps.push({
          email: userEmail,
          type: "Credit",
          amount: remainingBalance,
          note: "Today Wallet Settlement",
          status: "Success",
          date: new Date()
        });
      }
    }

    // ডাটাবেজে বাল্ক রাইট অপারেশন
    if (bulkUserOps.length > 0) {
      await User.bulkWrite(bulkUserOps);
    }

    if (historyOps.length > 0) {
      await WalletHistory.insertMany(historyOps);
    }

    console.log(`Midnight Settlement successfully moved remaining balances for ${bulkUserOps.length} users.`);
  } catch (err) {
    console.error("Cron Job Error:", err);
  }
  },{
              
  scheduled: true,
    timezone: "Asia/Kolkata" 
});




// ==================== AUTO MONTH RESET ====================

cron.schedule("0 0 1 * *", async () => {
    console.log("AUTO MONTH RESET RUNNING...");

    try {
        // ১. সমস্ত ইউজারের চলতি মাসের বোনাসকে গত মাসে শিফট করা এবং চলতি মাসের বোনাস/ডিরেক্ট রেফারেল ০ করা
        const result = await User.updateMany(
            {}, 
            [
                {
                    $set: {
                        // বর্তমান মাসের বোনাসকে গত মাসের বোনাসে নিয়ে যাওয়া
                        lastMonthBonus: { $ifNull: ["$thisMonthBonus", 0] },
                        // চলতি মাসের বোনাস এবং ডিরেক্ট রেফারেল ০ (রিসেট) করা
                        thisMonthBonus: 0,
                        monthlyDirects: 0
                    }
                }
            ]
        );

        console.log(`MONTH RESET SUCCESS. Updated ${result.modifiedCount} users.`);

    } catch (err) {
        console.error("MONTH RESET ERROR:", err);
}
    },{
    scheduled: true,
    timezone: "Asia/Kolkata"
});


//=======================AUTO RENEW=========================
// অটো রিনিউ ক্রন জব (ইন্ডিয়ান টাইমজোন অনুযায়ী প্রতিদিন রাত ১২টায় চলবে)
cron.schedule("0 0 * * *",  async () => {
    console.log("Running Automatic Investment Renewal Cron Job...");
    try {
        const today = new Date();
        // দিনের শুরু না ধরে, সময়কে দিনের একদম শেষ পর্যন্ত (রাত ১১:৫৯:৫৯) সেট করা হলো 
        // যাতে আজকের যেকোনো সময়ের ইনভেস্টমেন্ট ডাটাবেজ থেকে মিস না হয়
        today.setHours(23, 59, 59, 999);

        // ১. যে সব ইনভেস্টমেন্ট Active এবং যাদের পরবর্তী রিনিউ ডেট আজকের বা তার আগের
        const pendingRenewals = await Investment.find({
            status: "Active",
            $or: [
                { nextRenewDate: { $lte: today } },
                { renewDate: { $lte: today } }
            ]
        });

        for (let investment of pendingRenewals) {
            // ইউজারের ডেটা খোঁজা
            const user = await User.findOne({
                email: String(investment.email).toLowerCase()
            });

            if (!user) {
                console.log(`User not found for investment: ${investment.email}`);
                continue;
            }

            // সঠিক রিনিউ অ্যামাউন্ট নির্ধারণ
            const renewAmount = Number(
                investment.monthlyAmount || 
                investment.monthlyReturn || 
                investment.amount || 
                0
            );

            // ইউজারের অ্যাকাউন্ট ব্যালেন্স চেক
            const balance = Number(user.balance || user.wallet || user.walletBalance || 0);

            // ব্যালেন্স পর্যাপ্ত থাকলে অ্যাকাউন্ট ডেবিট হবে
            if (balance >= renewAmount) {
                // ইউজারের ওয়ালেট থেকে ব্যালেন্স মাইনাস করা
                user.balance = Math.max(0, Number(user.balance || 0) - renewAmount);
                user.wallet = Math.max(0, Number(user.wallet || 0) - renewAmount);
                user.walletBalance = Math.max(0, Number(user.walletBalance || 0) - renewAmount);
                
                user.activeStatus = "Active";
                user.status = "Active";
                await user.save();

                // ইনভেস্টমেন্টের হিস্ট্রি রেকর্ড (Statement) যোগ করা
                investment.history.push({
                    type: "AUTO_RENEW",
                    amount: renewAmount,
                    date: new Date(),
                    slipNo: "RNW-" + Date.now()
                });

                investment.monthsPaid = Number(investment.monthsPaid || 1) + 1;
                investment.renewCount = Number(investment.renewCount || 0) + 1;
                investment.lastRenewDate = new Date();

                // ================= কিস্তি লজিক =================
                // বর্তমান রিনিউ করার দিন থেকে ঠিক ৩০ দিন পরের তারিখ সেট করা
                const nextRenew = new Date(investment.nextRenewDate || investment.renewDate);
                nextRenew.setDate(nextRenew.getDate() + 30);

                investment.nextRenewDate = nextRenew;
                investment.renewDate = nextRenew;
                // ==============================================

                investment.status = "Active";
                investment.renewStatus = "Renewed";
                await investment.save();

                // বোনাস এবং রেফারেল লজিক (Try-catch এর ভেতরে)
                try {
                    if (typeof updatePerformanceStatus === 'function') await updatePerformanceStatus(investment.email);
                    if (typeof processRenewBonuses === 'function') await processRenewBonuses(investment.email, investment.amount);
                    if (typeof payRoyaltyBonus === 'function') await payRoyaltyBonus(investment.email, renewAmount);
                } catch (err) {
                    console.log("CRON JOB BONUS ERROR:", err);
                }

                // ওয়ালেট ট্রানজেকশন হিস্ট্রি তৈরি
                await WalletHistory.create({
                    email: user.email,
                    amount: renewAmount,
                    type: "Debit",
                    status: "Success",
                    description: "SIP Auto Renew Payment",
                    date: new Date()
                });

                console.log(`Successfully auto-renewed investment for ${investment.email}`);

            } else {
                // ব্যালেন্স ঠিক না থাকলে ইনভেস্টমেন্ট Overdue/Inactive এবং ইউজারকে Inactive করা
                investment.status = "Inactive";
                investment.renewStatus = "Due";
                await investment.save();

                user.activeStatus = "Inactive";
                user.status = "Inactive";
                await user.save();

                console.log(`Failed auto-renew (Insufficient balance). Account inactivated for ${investment.email}`);
            }
        }
    } catch (error) {
        console.error('Error in Auto Renew Cron Job:', error);
    }
}, {
    // এখানে ইন্ডিয়ান টাইমজোন এবং শিডিউল কনফিগারেশন যোগ করা হলো
    scheduled: true,
    timezone: "Asia/Kolkata" 
});

          


//================== AUTO INACTIVE CHECK ===================

cron.schedule("0 0 * * *", async () => {
  console.log("Auto inactive check running...");

  try {
    const users = await User.find();

    for (let user of users) {
      await updateInvestmentStatus(user.email);
    }

    console.log("Auto inactive check completed");
  } catch (error) {
    console.error("Error in auto inactive check:", error);
  }
}, {
  scheduled: true,
    timezone: "Asia/Kolkata"
});

// =================== AUTO MONTH WITHDRAWAL ===================
cron.schedule("0 0 5 * *", async () => {
    console.log("AUTO WITHDRAW STARTED");

    try {
        const users = await User.find({ 
            activeStatus: { $regex: /^active$/i },
            balance: { $gt: 2000 }
        });
        
        console.log(`Total eligible active users found: ${users.length}`);

        for (let user of users) {
            const mainBalance = Number(user.balance || 0);
            const threshold = 2000;
            const withdrawAmount = mainBalance - threshold;

            // ইউজারের ব্যাংক ডিটেইলস খোঁজা (BankDetails মডেল অথবা ইউজার স্কিমা থেকে)
            let userBank = await BankDetails.findOne({ email: user.email });
            let finalBankDetails = {
                bankName: userBank?.bankName || user.bankDetails?.bankName || user.bankName || "N/A",
                accountNumber: userBank?.accountNumber || user.bankDetails?.accountNumber || user.accountNumber || "N/A",
                ifsc: userBank?.ifsc || user.bankDetails?.ifsc || user.ifsc || "N/A",
                holderName: userBank?.holderName || user.bankDetails?.holderName || user.name
            };

            // ১. অটো উইথড্র রিকোয়েস্ট তৈরি
            await AutoWithdraw.create({
                name: user.name,
                email: user.email,
                walletId: user.walletId || user._id,
                amount: withdrawAmount,
                status: "Pending",
                bankDetails: finalBankDetails,
                createdAt: new Date()
            });

            // ২. ব্যালেন্স আপডেট করে ২০০০ টাকা রাখা
            user.balance = threshold;
            await user.save();

            // ৩. WalletHistory তে Debit এন্ট্রি তৈরি করা
            await WalletHistory.create({
                email: user.email,
                type: "Withdraw",
                amount: withdrawAmount,
                title: "Auto Withdraw Request",
                description: `Sallary Credit`,
                status: "Success",
                date: new Date()
            });

            console.log(`✅ Auto withdraw & history created for: ${user.email}`);
        }

        console.log("AUTO WITHDRAW COMPLETED");
    } catch (err) {
        console.log("AUTO WITHDRAW ERROR:", err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// ১. প্রতিদিন সকালে ডেইলি রিওয়ার্ড ক্লাইম করার নোটিফিকেশন (প্রতিদিন সকাল ৮:০০ টায়)
cron.schedule('0 8,12,20 * * *', async () => {
  try {
    console.log("⏰ Running Daily Reward Cron Job...");
    const users = await User.find({ pushSubscription: { $ne: null } });

    for (let user of users) {
      await sendPushNotification(
        user.email,
        "🎁 Daily Reward Reminder!",
        "শুভ সকাল! প্লিজ আপনার ডেইলি রিওয়ার্ড ক্লেইম করুন 💸✨",
        "/daily-reward"
      );
    }
    console.log("✅ Daily Reward notifications sent successfully!");
  } catch (err) {
    console.error("❌ Daily reward cron error:", err);
  }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// ২. প্রতিদিন ৩ বার রেফার করার নোটিফিকেশন (যেমন: সকাল ১০টা, দুপুর ২টা এবং সন্ধ্যা ৭টায়)
cron.schedule('0 10,14,19 * * *', async () => {
  try {
    console.log("⏰ Running Referral Cron Job...");
    const users = await User.find({ pushSubscription: { $ne: null } });

    for (let user of users) {
      await sendPushNotification(
        user.email,
        "👥 Refer & Earn More!",
        "বন্ধুদের বেশি বেশি রেফার করো আর ঝটপট ইনকাম করো 🚀💰",
        "/refer"
      );
    }
    console.log("✅ Referral notifications sent successfully!");
  } catch (err) {
    console.error("❌ Referral cron error:", err);
  }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// ৩. প্রতিদিন ২ বার SIP ও রেফার আর্নিংয়ের নোটিফিকেশন (যেমন: দুপুর ১২টা এবং বিকেল ৫টায়)
cron.schedule('0 12,17 * * *', async () => {
  try {
    console.log("⏰ Running SIP & Referral Promo Cron Job...");
    const users = await User.find({ pushSubscription: { $ne: null } });

    for (let user of users) {
      await sendPushNotification(
        user.email,
        "🌱 SIP & Earn Opportunity!",
        "সেভ মানি আপনাকে SIP করার সঙ্গে সঙ্গে রেফার করে দুর্দান্ত আর্নিংয়ের সুযোগ করে দিচ্ছে! এখনই শুরু করুন 📈🎯",
        "/invest-now"
      );
    }
    console.log("✅ SIP promo notifications sent successfully!");
  } catch (err) {
    console.error("❌ SIP promo cron error:", err);
  }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});








app.use((err, req, res, next) => {

  console.log("GLOBAL ERROR:", err);

  res.status(500).json({
    msg: "Internal server error"
  });

});

// ✅ server.listen MUST be outside io.on
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);  
});
