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
const PerformanceBonus = require("./models/PerformanceBonus");
const cron = require("node-cron");
const TeamBonus = require("./models/TeamBonus");
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
const Otp = require("./models/Otp");
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




const app = express();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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
  "https://save-money-indol.vercel.app"
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    if (user.banned) {
      return res.status(403).json({
        msg: "Your account is banned",
        reason: user.banReason || ""
      });
    }

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

async function updateTeamChallenge(email) {

  const tb = await TeamBonus.findOne({ email });

  if (!tb || tb.isActive || tb.isFailed) return;

  const days =
    (new Date() - new Date(tb.challengeStart))
    / (1000 * 60 * 60 * 24);

  // ❌ failed
  if (days > 30 && tb.directCount < 10) {

    tb.isFailed = true;

    await tb.save();

    return;
  }

  // ✅ active
  if (tb.directCount >= 10) {

    tb.isActive = true;

    await tb.save();
  }
}



// 🔥 PAY TEAM BONUS
async function payTeamBonus(newInvestorEmail) {

  // NEW USER
  const user = await User.findOne({
    email: newInvestorEmail
  });

  if (!user || !user.referredBy) return;


  // LEVEL A
  const sponsor1 = await User.findOne({
    referCode: user.referredBy
  });

  if (!sponsor1) return;


  // LEVEL B
  const sponsor2 = sponsor1.referredBy
    ? await User.findOne({
        referCode: sponsor1.referredBy
      })
    : null;


  // LEVEL C
  const sponsor3 = sponsor2?.referredBy
    ? await User.findOne({
        referCode: sponsor2.referredBy
      })
    : null;


  // LEVEL D
  const sponsor4 = sponsor3?.referredBy
    ? await User.findOne({
        referCode: sponsor3.referredBy
      })
    : null;


  // BONUS SYSTEM
  const payouts = [

    {
      user: sponsor2,
      level: 1,
      amount: 70
    },

    {
      user: sponsor3,
      level: 2,
      amount: 50
    },

    {
      user: sponsor4,
      level: 3,
      amount: 35
    }

  ];


  // LOOP
  for (let p of payouts) {

    if (!p.user) continue;

    const tb = await TeamBonus.findOne({
      email: p.user.email
    });

    // ONLY ACTIVE USER GET BONUS
    if (tb && tb.isActive && !tb.isFailed) {

      // WALLET ADD
      tb.wallet += p.amount;

      // HISTORY ADD
      tb.history.push({

        fromUser: user.name,

        level: p.level,

        amount: p.amount,

        date: new Date(),

        status: "Paid"
      });

      await tb.save();

      // MAIN USER WALLET ADD
      p.user.wallet += p.amount;

      await p.user.save();
    }
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
  type,
  level = 0,
  amount = 0,
  note = "",
  refId = ""
}) {
  try {
    const bonusAmount = Number(amount || 0);
    if (!email || bonusAmount <= 0) return;

    const bonusType = type;

    const exists = await BonusLedger.findOne({
      email: String(email).toLowerCase(),
      type: bonusType,
      refId
    });

    if (exists) return;

    const user = await User.findOne({
      email: String(email).toLowerCase()
    });

    if (!user) return;

    if (user.disableBonus) return;

    user.wallet = Number(user.wallet || 0) + bonusAmount;
    user.balance = Number(user.balance || 0) + bonusAmount;
    user.walletBalance = Number(user.walletBalance || 0) + bonusAmount;
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

    await BonusLedger.create({
      email: String(email).toLowerCase(),
      fromEmail,
      fromName: fromName || "User",
      type: bonusType,
      bonusType,
      level,
      amount: bonusAmount,
      note,
      status: "Paid",
      refId,
      date: new Date()
    });

    await WalletHistory.create({
      email: String(email).toLowerCase(),
      type: bonusType,
      amount: bonusAmount,
      note: note || `${bonusType} received from ${fromName}`,
      status: "Success",
      date: new Date()
    });

    if (typeof sendNotification === "function") {
      await sendNotification(
        String(email).toLowerCase(),
        bonusType,
        `${bonusType} ₹${bonusAmount} received from ${fromName}`
      );
    }

  } catch (err) {
    console.log("ADD BONUS ERROR:", err);
  }
}

function referralBonusRate(years) {
  if (Number(years) === 1) return 499;
  if (Number(years) === 2) return 599;
  return 699;
}

function performanceBonusRate(years) {
  if (Number(years) === 1) return 699;
  if (Number(years) === 2) return 799;
  return 899;
}

async function processFirstInvestmentBonuses(investorEmail, investment) {
  const investor = await User.findOne({ email: investorEmail });
  if (!investor || !investor.referredBy) return;

  const sponsor = await User.findOne({ referCode: investor.referredBy });
  if (!sponsor) return;

  const sponsorActiveInvestment = await Investment.findOne({
  email: sponsor.email,
  status: "Active"
});

if (!sponsorActiveInvestment) return;

// ✅ Performance bonus eligibility
const directUsers = await User.find({
  referredBy: sponsor.referCode
});

let activeDirectCount = 0;

for (const du of directUsers) {
  const activeInv = await Investment.findOne({
    email: du.email,
    status: "Active"
  });

  if (activeInv) activeDirectCount++;
}

const sponsorJoin = sponsor.createdAt || sponsor.date || new Date();
const performanceDeadline = new Date(sponsorJoin);
performanceDeadline.setDate(performanceDeadline.getDate() + 30);

const taskExpired = new Date() > performanceDeadline;

let performanceAmount = 0;

if (activeDirectCount >= 10 && !taskExpired) {
  performanceAmount = 699;

  if (activeDirectCount >= 15) performanceAmount = 799;
  if (activeDirectCount >= 20) performanceAmount = 899;
  if (activeDirectCount >= 21) performanceAmount = 999;

  await addBonus({
    email: sponsor.email,
    fromEmail: investor.email,
    fromName: investor.name,
    type: "Performance Bonus",
    level: 1,
    amount: performanceAmount,
    note: "Direct active referral performance bonus",
    refId: refId + "-PERFORMANCE"
  });
}

  const refId = `FIRST-${investment._id}`;

  // Direct Referral Bonus
  await addBonus({
    email: sponsor.email,
    fromEmail: investor.email,
    fromName: investor.name,
    type: "Referral Bonus",
    level: 0,
    amount: referralBonusRate(investment.years),
    note: "Direct first investment bonus",
    refId: refId + "-REF"
  });

  // Team Bonus: Sponsor's uplines get bonus
  const level1Owner = sponsor.referredBy
    ? await User.findOne({ referCode: sponsor.referredBy })
    : null;

  const level2Owner = level1Owner?.referredBy
    ? await User.findOne({ referCode: level1Owner.referredBy })
    : null;

  const level3Owner = level2Owner?.referredBy
    ? await User.findOne({ referCode: level2Owner.referredBy })
    : null;

  const teamPayouts = [
    { user: level1Owner, level: 1, amount: 70 },
    { user: level2Owner, level: 2, amount: 50 },
    { user: level3Owner, level: 3, amount: 35 }
  ];

  for (let p of teamPayouts) {
    if (!p.user) continue;

    const tb = await TeamBonus.findOne({ email: p.user.email });

    if (tb && tb.isActive && !tb.isFailed) {
      tb.wallet += p.amount;

      tb.history.push({
        fromUser: investor.name,
        level: p.level,
        amount: p.amount,
        date: new Date(),
        status: "Paid"
      });

      await tb.save();

      await addBonus({
        email: p.user.email,
        fromEmail: investor.email,
        fromName: investor.name,
        type: "Team Bonus",
        level: p.level,
        amount: p.amount,
        note: `Level ${p.level} first investment bonus`,
        refId: refId + "-TEAM-" + p.level
      });
    }
  }

  // Royalty Bonus
  const directSponsor = sponsor;

  if (directSponsor.referredBy) {
    const royaltyOwner = await User.findOne({
      referCode: directSponsor.referredBy
    });

    if (royaltyOwner) {
      const rb = await RoyaltyBonus.findOne({ email: royaltyOwner.email });

      if (rb && rb.isActive) {
        const royalty = Math.floor(investment.monthlyAmount * 0.03);

        rb.wallet += royalty;
        rb.thisMonthTurnover += investment.monthlyAmount;

        rb.history.push({
          fromUser: investor.name,
          investAmount: investment.monthlyAmount,
          royalty,
          date: new Date()
        });

        await rb.save();

        await addBonus({
          email: royaltyOwner.email,
          fromEmail: investor.email,
          fromName: investor.name,
          type: "Royalty Bonus",
          level: 0,
          amount: royalty,
          note: "3% royalty from network first investment",
          refId: refId + "-ROYALTY"
        });
      }
    }
  }
}

async function processRenewBonuses(investorEmail, investment) {
  const investor = await User.findOne({ email: investorEmail });
  if (!investor || !investor.referredBy) return;

  const sponsor = await User.findOne({ referCode: investor.referredBy });
  if (!sponsor) return;

  const pb = await PerformanceBonus.findOne({ email: sponsor.email });

  if (!pb || !pb.isActive || pb.isFailed) return;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyNewDirect = await User.findOne({
    referredBy: sponsor.referCode,
    createdAt: { $gte: monthStart }
  });

  const renewRefId = `RENEW-${investment._id}-${investment.monthsPaid}`;

  if (!monthlyNewDirect) {
    pb.history.push({
      fromUser: investor.name,
      amount: 0,
      plan: investment.years + " Year",
      date: new Date(),
      status: "Pending"
    });

    await pb.save();
    return;
  }

  const bonus = performanceBonusRate(investment.years);

  pb.thisMonthBonus += bonus;
  pb.totalBonus += bonus;

  pb.history.push({
    fromUser: investor.name,
    amount: bonus,
    plan: investment.years + " Year",
    date: new Date(),
    status: "Paid"
  });

  await pb.save();

  await addBonus({
    email: sponsor.email,
    fromEmail: investor.email,
    fromName: investor.name,
    type: "Performance Bonus",
    level: 0,
    amount: bonus,
    note: "Monthly renewal performance bonus",
    refId: renewRefId + "-PERFORMANCE"
  });
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

async function sendEmail(to, subject, message) {

 try {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "Save Money",
        email: process.env.EMAIL_USER
      },
      to: [
        {
          email: email
        }
      ],
      subject: "Save Money Password Reset OTP",
      htmlContent: `
        <div style="font-family:Arial;padding:20px">
          <h2 style="color:#7c3aed">Save Money</h2>
          <p>Your password reset OTP is:</p>
          <h1 style="letter-spacing:6px;color:#16a34a">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
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
  console.log("BREVO API EMAIL ERROR:", mailErr.response?.data || mailErr.message);

  return res.status(500).json({
    msg: "Email send failed"
  });
}
}

app.post("/send-email-otp", async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        msg: "Email required"
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    global.otpStore = global.otpStore || {};

    global.otpStore[email] = otp;

    await sendEmail(
      email,
      "Save Money OTP Verification",
      `Your OTP is: ${otp}`
    );

    res.json({
      success: true,
      msg: "OTP sent successfully"
    });

  } catch (err) {

    console.log(err);

    res.json({
      success: false,
      msg: "OTP send failed"
    });

  }

});

app.post("/verify-email-otp", async (req, res) => {

  try {

    const { email, otp } = req.body;

    if (
      global.otpStore &&
      global.otpStore[email] === otp
    ) {

      delete global.otpStore[email];

      return res.json({
        success: true,
        msg: "OTP verified"
      });

    }

    res.json({
      success: false,
      msg: "Invalid OTP"
    });

  } catch (err) {

    console.log(err);

    res.json({
      success: false,
      msg: "Verification failed"
    });

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

// ================= REGISTER =================
app.post("/register", async (req, res) => {

  try {

    console.log("REGISTER BODY:", req.body);

    const {
      name,
      mobile,
      email,
      password,
      walletAddress,
      referCode
    } = req.body;

    // validation
    if (
      !name ||
      !mobile ||
      !email ||
      !password ||
      !walletAddress
    ) {
      return res.status(400).json({
        msg: "Please fill all required fields"
      });
    }

    // email validate
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        msg: "Invalid email"
      });
    }

    // password validate
    if (
      !validator.isStrongPassword(password, {
        minLength: 6,
        minNumbers: 1,
        minLowercase: 1,
        minUppercase: 0,
        minSymbols: 0
      })
    ) {
      return res.status(400).json({
        msg: "Password must contain letters and numbers"
      });
    }

    // existing email
    const existingUser =
      await User.findOne({
        email: email.toLowerCase()
      });

    if (existingUser) {
      return res.status(400).json({
        msg: "Email already registered"
      });
    }

    // existing mobile
    const existingMobile =
      await User.findOne({
        mobile
      });

    if (existingMobile) {
      return res.status(400).json({
        msg: "Mobile already registered"
      });
    }

    // hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // generate refer code
    const myReferCode =
      "SM" +
      Math.floor(
        100000 + Math.random() * 900000
      );

    // create wallet id
   const walletId = await generateShortWalletId();

    // referred by user
    let referredBy = "";

    if (referCode) {

      const refUser =
        await User.findOne({
          referCode
        });

      if (refUser) {
        referredBy = referCode;
      }

    }

    // create user
    const newUser = new User({

      name,

      mobile,

      email: email.toLowerCase(),

      password: hashedPassword,

      walletAddress,

      referCode: myReferCode,

      referredBy,

      walletId: walletId,

      role: "user",

      wallet: 0,

      totalIncome: 0,

      referralIncome: 0,

      performanceIncome: 0,

      teamIncome: 0,

      royaltyIncome: 0,

      activeStatus: "Inactive",

      kycStatus: "Pending",

      banned: false,

      freezeWallet: false,

      disableInvestment: false,

      disableWithdrawal: false,

      disableBonus: false,

      termsAccepted: true

    });

    await newUser.save();

    // notification
    try {

      await Notification.create({

        email: newUser.email,

        title: "Welcome",

        message:
          "Welcome to Save Money platform"

      });

    } catch (e) {
      console.log("Notification error");
    }

    return res.status(201).json({

      success: true,

      msg: "Registered Successfully"

    });

  } catch (err) {

    console.log("REGISTER ERROR:", err);

    return res.status(500).json({

      msg: "Server error",

      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : undefined

    });

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

    // hashed password check
    if (user.password && user.password.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // old plain password support
      isMatch = user.password === password;
    }

    if (!isMatch) {
      return res.status(401).json({
        msg: "Wrong password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

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
        msg: "Email required"
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

    const otp =
      Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpire =
      new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    console.log("FORGOT PASSWORD OTP:", otp);
try {
    await axios.post(
  "https://api.brevo.com/v3/smtp/email",
  {
    sender: {
      name: "Save Money",
      email: process.env.EMAIL_USER
    },
    to: [{ email }],
    subject: "Save Money Password Reset OTP",
    htmlContent: `<h2>Your OTP: ${otp}</h2>`
  },
  {
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json"
    }
  }
);

    } catch (mailErr) {

      console.log(
        "SEND FORGOT OTP ERROR:",
        mailErr
      );

      return res.status(500).json({
        msg: "Email send failed"
      });
    }

    return res.json({
      success: true,
      msg: "OTP sent successfully"
    });

  } catch (err) {

    console.log(
      "FORGOT OTP MAIN ERROR:",
      err
    );

    return res.status(500).json({
      msg: "Server error"
    });
  }
});


// VERIFY FORGOT PASSWORD OTP
app.post("/verify-forgot-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (!user.resetOtpExpire || user.resetOtpExpire < new Date()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    return res.json({
      success: true,
      msg: "OTP verified successfully"
    });

  } catch (err) {
    console.log("VERIFY OTP ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// RESET PASSWORD
app.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        msg: "Email, OTP and new password required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (!user.resetOtpExpire || user.resetOtpExpire < new Date()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpire = null;

    await user.save();

    return res.json({
      success: true,
      msg: "Password reset successfully"
    });

  } catch (err) {
    console.log("RESET PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Server error" });
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
      rate,
      totalInterest,
      maturityAmount
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

    const investment = await Investment.create({
      email,

      planName: "Save Money SIP",

      monthlyAmount: investAmount,
      amount: investAmount,

      years: Number(years || 1),

      rate: Number(rate || 0),

      totalInterest:
        Number(totalInterest || 0),

      maturityAmount:
        Number(maturityAmount || 0),

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

    // Referral bonus only if referrer has active Save Money investment
try {
  const investor = await User.findOne({
    email: email.toLowerCase()
  });

  const refCode =
    investor.referredBy ||
    investor.referBy ||
    investor.refBy ||
    investor.sponsorCode;

  if (refCode) {
    const referrer = await User.findOne({
      $or: [
        { referCode: refCode },
        { referralCode: refCode },
        { walletId: refCode }
      ]
    });

    if (referrer) {
      const referrerActiveInvestment =
        await Investment.findOne({
          email: referrer.email.toLowerCase(),
          status: "Active"
        });

      if (referrerActiveInvestment) {
        const bonusAmount = 499; // তোমার referral bonus amount

        const oldBalance = Number(
          referrer.balance ??
          referrer.wallet ??
          referrer.walletBalance ??
          0
        );

        const newBalance = oldBalance + bonusAmount;

        referrer.balance = newBalance;
        referrer.wallet = newBalance;
        referrer.walletBalance = newBalance;
        referrer.referralIncome =
          Number(referrer.referralIncome || 0) + bonusAmount;

        await referrer.save();

        await WalletHistory.create({
          email: referrer.email.toLowerCase(),
          amount: bonusAmount,
          type: "credit",
          description: `Referral bonus received from ${investor.name || investor.email}`,
          note: "Referral bonus",
          status: "success",
          date: new Date()
        });
      } else {
        console.log(
          "Referral bonus skipped: Referrer has no active Save Money investment"
        );
      }
    }
  }
} catch (bonusErr) {
  console.log("REFERRAL BONUS ERROR:", bonusErr.message);
}
await distributeBonuses(email, investAmount);

   await WalletHistory.create({
  email,
  amount: investAmount,
  type: "debit",
  status: "success",
  description: "Save Money SIP Started",
  date: new Date()
});

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
      return res.status(404).json({
        success: false,
        msg: "Investment not found"
      });
    }

    // Renew
    const today = new Date();
    const currentDay = today.getDate();

    if (currentDay < 1 || currentDay > 3) {
      return res.status(400).json({
        success: false,
        msg: "Please ComeBack After 30 Days"
      });
    }

    // Add Renew History
    investment.history.push({
      type: "RENEW",
      amount: investment.monthlyAmount || investment.amount,
      date: new Date(),
      slipNo: "RN-" + Date.now()
    });

    investment.renewCount =
      (investment.renewCount || 0) + 1;

    investment.lastRenewDate =
      new Date();

    // Next renew date = next month 1st
    const nextRenew = new Date();

    nextRenew.setMonth(
      nextRenew.getMonth() + 1
    );

    nextRenew.setDate(1);

    investment.nextRenewDate =
      nextRenew;

    investment.renewStatus =
      "Renewed";

   await investment.save();

if (!investment.referralBonusGiven) {
  const investUser = await User.findOne({
    email: String(investment.email).toLowerCase()
  });

  await distributeSaveMoneyBonuses(
    investUser,
    Number(investment.amount || investment.monthlyAmount || 2000)
  );

  investment.referralBonusGiven = true;
  await investment.save();
}

res.json({
  success: true,
  msg: "Investment renewed successfully",
      nextRenewDate:
        investment.nextRenewDate,
      renewCount:
        investment.renewCount
    });

  } catch (err) {

    console.log(err);

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

    const user = await User.findOne({
      email: email?.toLowerCase()
    });

    if (!user) {
      return res.json({
        success: false,
        msg: "User not found"
      });
    }

   const history = await WalletHistory.find({
  email: email.toLowerCase()
})
.sort({ date: -1 })
.limit(20);

    res.json({
      success: true,
      user,
      name: user.name,
      walletId: user.walletId || user.referralCode || user._id.toString(),
      balance: Number(user.balance || user.wallet || 0),
      referral: Number(user.referralIncome || 0),
      performance: Number(user.performanceBonus || 0),
      team: Number(user.teamIncome || 0),
      royalty: Number(user.royaltyIncome || user.realityIncome || 0),
      history
    });

  } catch (err) {
    console.log("WALLET SUMMARY ERROR:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
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

      wallet: user.wallet || 0,

      referralIncome:
        user.referralIncome || 0,

      performanceIncome:
        user.performanceIncome || 0,

      teamIncome:
        user.teamIncome || 0,

      royaltyIncome:
        user.royaltyIncome || 0,

      totalEarning:
        user.totalEarning || 0,

      walletId:
        user.walletId || "",

      history

    });

  } catch (err) {

    console.log("WALLET DATA ERROR:", err);

    res.status(500).json({
      msg: "Wallet data loading failed"
    });

  }

});

app.post("/deposit-request", upload.single("screenshot"), async (req, res) => {
  try {
    const { email, amount, txnId } = req.body;

    if (!email || !amount || !txnId || !req.file) {
      return res.status(400).json({
        success: false,
        msg: "All fields required"
      });
    }

    await DepositRequest.create({
      email: String(email).toLowerCase(),
      amount: Number(amount),
      txnId,
      screenshot: req.file.path,
      status: "pending",
      date: new Date()
    });

    await Notification.create({
      email: String(email).toLowerCase(),
      title: "Deposit Request Submitted",
      message: `Your deposit request of ₹${amount} is pending admin approval.`,
      read: false,
      date: new Date()
    });

    res.json({
      success: true,
      msg: "Deposit request submitted"
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

app.post("/logout", auth, async (req, res) => {

  const user = await User.findById(
    req.user.id
  );

  user.refreshToken = "";

  await user.save();

  res.json({
    msg: "Logout success"
  });

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

app.post("/wallet-transfer", async (req, res) => {
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

    if (senderBalance < transferAmount) {
      return res.json({
        success: false,
        msg: "Insufficient wallet balance"
      });
    }

    sender.balance = senderBalance - transferAmount;
    receiver.balance = Number(receiver.balance || receiver.wallet || 0) + transferAmount;

    await sender.save();
    await receiver.save();

   await WalletHistory.create({
  email: sender.email,
  type: "Debit",
  amount: Number(amount),
  title: "Wallet Transfer Sent",
  description: `Transfer sent to ${receiver.walletId}`,
  status: "Success",
  date: new Date()
});

await WalletHistory.create({
  email: receiver.email,
  type: "Credit",
  amount: Number(amount),
  title: "Wallet Transfer Received",
  description: `Transfer received from ${sender.walletId}`,
  status: "Success",
  date: new Date()
});

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
  const requiredInvestment = monthly * 12 * years;
const investedAmount = monthly * Number(i.monthsPaid || 1);

 const startDate = i.startDate || i.createdAt;

const endDate = new Date(startDate);

endDate.setFullYear(
  endDate.getFullYear() + Number(i.years || 0)
);

  return {
    _id: i._id,
    investmentId: `SM${new Date(startDate).getFullYear()}${String(index + 1).padStart(4, "0")}${String(i._id).slice(-4)}`,
    planType: "save",
    planName: "Save Money",
    planSub: "SIP Invest Plan",

    requiredInvestment,
investedAmount,
amount: requiredInvestment,
monthlyAmount: monthly,
    monthlyReturn: monthly,
    years,
    returnRate: i.rate || 0,

    totalReturn: i.totalInterest || 0,
    maturityAmount: i.maturityAmount || 0,

    startDate,
    endDate,
    renewDate: i.nextRenewDate,

    daysLeft: i.nextRenewDate
      ? Math.max(
          0,
          Math.ceil((new Date(i.nextRenewDate) - new Date()) / (1000 * 60 * 60 * 24))
        )
      : 0,

    status: i.status || "Active",
    progress: i.monthsPaid
      ? Math.min(Math.floor((i.monthsPaid / (years * 12)) * 100), 100)
      : 1,

    history: i.history || []
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
    { email },
    {
      aadhaarFile,
      panFile,
      photo,
      kycStatus: "pending",
      rejectReason: "" // 🔥 reset
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

app.post(
  "/submit-kyc",
  upload.fields([
    { name: "aadhaarFile", maxCount: 1 },
    { name: "panFile", maxCount: 1 },
    { name: "photo", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { email, aadhaar, pan  } = req.body;
      await sendNotification(email, "KYC Submitted Successfully");

      console.log("KYC API HIT:", email);

      await User.updateOne(
        { email },
        { aadhaar, 
          pan,

          aadhaarFile: req.files.aadhaarFile[0].path,
          panFile: req.files.panFile[0].path,
          photo: req.files.photo[0].path,
          kycStatus: "reviewing"
        }
      );
      await createNotification(email, "KYC Submitted Successfully");

      res.json({ msg: "KYC Submitted Successfully" });

    } catch (err) {
      console.log("KYC ERROR:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

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

  const users = await User.find({ kycStatus: "pending" });

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

    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({
        msg: "User not found"
      });
    }

    const investments = await Investment.find({
      email
    });

    let totalInvestment = 0;
    let totalReturn = 0;

    investments.forEach((inv) => {
      const amount =
        Number(inv.amount) ||
        Number(inv.monthlyAmount) ||
        Number(inv.investAmount) ||
        Number(inv.principal) ||
        0;

      const roi =
        Number(inv.roi) ||
        Number(inv.roiPercent) ||
        Number(inv.interestRate) ||
        Number(inv.returnPercent) ||
        0;

      totalInvestment += amount;

      const monthlyPercent = roi / 12;
      const monthlyReturn = (amount * monthlyPercent) / 100;

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
            email,
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

      totalInvestment,
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
    kycStatus: { $ne: "approved" }
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

app.get("/all-users",auth, adminAuth, async (req, res) => {
  const data = await User.find();
  res.json(data);
});

app.get("/pending-kyc", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({
      kycStatus: { $in: ["Pending", "pending"] }
    }).select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/approve-kyc", auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    await User.findByIdAndUpdate(userId, {
      kycStatus: "approved"
    });

    res.json({ msg: "KYC Approved" });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
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

    if (filter === "kyc") query.kycStatus = "approved";
    if (filter === "pending") query.kycStatus = { $ne: "approved" };
    if (filter === "active") query.activeStatus = "Active";
    if (filter === "inactive") query.activeStatus = "Inactive";
    if (filter === "banned") query.banned = true;

    const users = await User.find(query).select("-password")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(users);

  } catch (err) {
    console.log("ADMIN SEARCH ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
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
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(users);

  } catch (err) {
    console.log("SEARCH ERROR:", err);
    res.status(500).json({ msg: "Server error" });
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

app.post("/approve-kyc",
auth,
adminAuth,
async (req, res) => {

  const { userId } = req.body;

  const user = await User.findById(userId);

  user.kycStatus = "approved";

  await user.save();

  res.json({
    msg: "KYC Approved"
  });

});

app.post("/reject-kyc",
auth,
adminAuth,
async (req, res) => {

  const { userId } = req.body;

  const user = await User.findById(userId);

  user.kycStatus = "rejected";

  await user.save();

  res.json({
    msg: "KYC Rejected"
  });

});

app.get("/cash-requests", auth, adminAuth, async (req, res) => {
  try {
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

app.post("/admin/update-bonus-status", async (req, res) => {
  try {
    const {
      userId,
      performanceBonusEnabled,
      teamBonusEnabled,
      royaltyBonusEnabled
    } = req.body;

    await User.findByIdAndUpdate(userId, {
      performanceBonusEnabled,
      teamBonusEnabled,
      royaltyBonusEnabled
    });

    res.json({
      success: true
    });

  } catch (err) {
    res.status(500).json({
      success: false
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

    const oldBalance = Number(user.balance ?? user.wallet ?? user.walletBalance ?? 0);
    const addAmount = Number(request.amount || 0);
    const newBalance = oldBalance + addAmount;

    user.balance = newBalance;
    user.wallet = newBalance;
    user.walletBalance = newBalance;
    await user.save();

    request.status = "approved";
    request.approvedAt = new Date();
    await request.save();

    await WalletHistory.create({
      email: String(request.email).toLowerCase(),
      amount: addAmount,
      type: "Admin Credit",
      note: "Deposit request approved by admin",
      status: "success",
      date: new Date()
    });

    res.json({ success: true, msg: "Deposit approved" });
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

    request.status = "rejected";
    request.rejectedAt = new Date();
    await request.save();

    res.json({ success: true, msg: "Deposit rejected" });
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
      type: type === "add" ? "Admin Credit" : "Admin Debit",
      description: reason,
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

  const { title, message } = req.body;

  const users = await User.find();

  for (let u of team) {

    await Notification.create({
  email: "all",
  title,
  message,
  read: false
});

    const socketId =
      onlineUsers[u.email];

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

  res.json({
    msg:"Broadcast Sent"
  });

});

app.post("/send-notification", async (req, res) => {

  const { email, text } = req.body;

  // 1️⃣ DB-তে save
  const newNotification = await Notification.create({
    email,
    text
  });

  // 2️⃣ realtime send
  if (users[email]) {
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
        { sendTo: "all" },
        { type: "broadcast" }
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
    const { email } = req.body;

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

    if (performanceCompleted && !user.performanceBonusEnabled) {
      user.performanceBonusEnabled = true;
      user.performanceActivatedAt = new Date();
      await user.save();
    }

    if (directUsers.length >= 50 && !user.royaltyBonusEnabled) {
      user.royaltyBonusEnabled = true;
      user.royaltyActivatedAt = new Date();
      await user.save();
    }

    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const allBonusHistory = await BonusLedger.find({
      email: String(user.email).toLowerCase()
    }).sort({ date: -1 });

    const sumBonus = (type, from, to) => {
      return allBonusHistory
        .filter((x) => {
          const d = new Date(x.date);
          return (
            x.bonusType === type &&
            d >= from &&
            (!to || d <= to)
          );
        })
        .reduce((sum, x) => sum + Number(x.amount || 0), 0);
    };

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

    const history = directUsers.map((u) => ({
      name: u.name || "User",
      email: u.email || "",
      mobile: u.mobile || "",
      referId: u.referCode || u.walletId || "",
      joinDate: u.createdAt,
      status: activeEmailSet.has(String(u.email || "").toLowerCase())
        ? "Active"
        : "Inactive",
      earning: Number(u.referralIncome || 0),
      photo: u.photo || ""
    }));

    return res.json({
      success: true,
      user,
      referCode,

      history,

      performance: {
        enabled: !!user.performanceBonusEnabled,
        balance: Number(user.performanceIncome || user.performanceBonus || 0),
        directActiveCount,
        required: 10,
        remaining: Math.max(10 - directActiveCount, 0),
        deadline,
        expired: performanceExpired,
        completed: performanceCompleted,
        thisMonthBonus: sumBonus("performance", startThisMonth),
        lastMonthBonus: sumBonus("performance", startLastMonth, endLastMonth)
      },

      team: {
        enabled: true,
        balance: Number(user.teamIncome || 0),
        level1Count: level1Users.length,
        level2Count: level2Users.length,
        level3Count: level3Users.length,
        level1Income: levelIncome(1),
        level2Income: levelIncome(2),
        level3Income: levelIncome(3),
        thisMonthBonus: sumBonus("team", startThisMonth),
        lastMonthBonus: sumBonus("team", startLastMonth, endLastMonth)
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

app.post("/refer-data", async (req, res) => {
  try {
    const { email } = req.body;

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

    if (performanceCompleted && !user.performanceBonusEnabled) {
      user.performanceBonusEnabled = true;
      user.performanceActivatedAt = new Date();
      await user.save();
    }

    if (directUsers.length >= 50 && !user.royaltyBonusEnabled) {
      user.royaltyBonusEnabled = true;
      user.royaltyActivatedAt = new Date();
      await user.save();
    }

    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const allBonusHistory = await BonusLedger.find({
      email: String(user.email).toLowerCase()
    }).sort({ date: -1 });

    const sumBonus = (type, from, to) => {
      return allBonusHistory
        .filter((x) => {
          const d = new Date(x.date);
          return (
            x.bonusType === type &&
            d >= from &&
            (!to || d <= to)
          );
        })
        .reduce((sum, x) => sum + Number(x.amount || 0), 0);
    };

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

    const history = directUsers.map((u) => ({
      name: u.name || "User",
      email: u.email || "",
      mobile: u.mobile || "",
      referId: u.referCode || u.walletId || "",
      joinDate: u.createdAt,
      status: activeEmailSet.has(String(u.email || "").toLowerCase())
        ? "Active"
        : "Inactive",
      earning: Number(u.referralIncome || 0),
      photo: u.photo || ""
    }));

    return res.json({
      success: true,
      user,
      referCode,

      history,

      performance: {
        enabled: !!user.performanceBonusEnabled,
        balance: Number(user.performanceIncome || user.performanceBonus || 0),
        directActiveCount,
        required: 10,
        remaining: Math.max(10 - directActiveCount, 0),
        deadline,
        expired: performanceExpired,
        completed: performanceCompleted,
        thisMonthBonus: sumBonus("performance", startThisMonth),
        lastMonthBonus: sumBonus("performance", startLastMonth, endLastMonth)
      },

      team: {
        enabled: true,
        balance: Number(user.teamIncome || 0),
        level1Count: level1Users.length,
        level2Count: level2Users.length,
        level3Count: level3Users.length,
        level1Income: levelIncome(1),
        level2Income: levelIncome(2),
        level3Income: levelIncome(3),
        thisMonthBonus: sumBonus("team", startThisMonth),
        lastMonthBonus: sumBonus("team", startLastMonth, endLastMonth)
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
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email required" });
    }

    const investments = await Investment.find({
      email: email.toLowerCase()
    });

    let totalInvestment = 0;
    let monthlyInvestment = 0;
    let totalReturn = 0;
    let activePlan = 0;
    let rateSum = 0;
    let rateCount = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    investments.forEach((inv) => {
      const amount = Number(inv.amount || inv.monthlyAmount || inv.totalAmount || 0);
      const rate = Number(inv.returnRate || inv.interestRate || inv.percent || 0);

      totalInvestment += amount;

      if (inv.status === "Active" || inv.status === "active") {
        activePlan += 1;
      }

      if (rate > 0) {
        rateSum += rate;
        rateCount += 1;
      }

      const created = new Date(inv.createdAt || inv.date);

      if (
        created.getMonth() === currentMonth &&
        created.getFullYear() === currentYear
      ) {
        monthlyInvestment += amount;
      }

      totalReturn += (amount * rate) / 100;
    });

    const returnRate =
      rateCount > 0 ? Number((rateSum / rateCount).toFixed(2)) : 0;

    res.json({
      success: true,
      totalInvestment,
      monthlyInvestment,
      totalReturn,
      returnRate,
      activePlan
    });

  } catch (err) {
    console.log("INVESTMENT SUMMARY ERROR:", err);
    res.status(500).json({ msg: "Server error" });
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

    const today = new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata"
    });

    let reward = await DailyReward.findOne({ email });

    if (!reward) {
      reward = new DailyReward({
        email,
        totalReward: 0,
        claimCount: 0,
        lastClaimDate: "",
        history: []
      });
    }

    if (reward.lastClaimDate === today) {
      return res.status(400).json({
        success: false,
        msg: "Already claimed today",
        reward
      });
    }

    const nextClaimCount = Number(reward.claimCount || 0) + 1;
    const special = nextClaimCount % 10 === 0;
    const amount = special ? 50 : Math.floor(Math.random() * 10) + 1;

    reward.claimCount = nextClaimCount;
    reward.totalReward = Number(reward.totalReward || 0) + amount;
    reward.lastClaimDate = today;
    reward.history.push({
      amount,
      special,
      date: new Date()
    });

    await reward.save();

    user.wallet = Number(user.wallet || 0) + amount;
    user.balance = Number(user.balance || 0) + amount;
    user.totalEarning = Number(user.totalEarning || 0) + amount;

    await user.save();

    const walletHistory = await WalletHistory.create({
      email,
      type: "Credit",
      amount,
      title: special ? "Special Daily Reward" : "Daily Reward",
      description: "Daily reward added ",
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
    const email = String(req.body.email || "").toLowerCase();

    const user = await User.findOne({ email });
    const bank = await BankDetails.findOne({ email });
    const history = await WithdrawRequest.find({ email }).sort({ createdAt: -1 });

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // ✅ Wallet page এর same balance
    const walletBalance = Number(user.balance || 0);
    const withdrawableBalance = Math.floor(walletBalance * 0.8);

    return res.json({
      success: true,
      walletBalance,
      withdrawableBalance,
      bank: bank || null,
      history
    });
  } catch (err) {
    console.log("WITHDRAW INFO ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.post("/withdraw-request", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase();
    const amount = Number(req.body.amount || 0);

    const user = await User.findOne({ email });
    const bank = await BankDetails.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    if (!bank) {
      return res.status(400).json({
        success: false,
        msg: "Please add bank details first"
      });
    }

    const walletBalance = Number(user.balance || 0);
    const withdrawableBalance = Math.floor(walletBalance * 0.8);

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        msg: "Minimum withdraw amount is ₹100"
      });
    }

    if (amount > withdrawableBalance) {
      return res.status(400).json({
        success: false,
        msg: "Amount is greater than withdrawable balance"
      });
    }

    const pending = await WithdrawRequest.findOne({
      email,
      status: "Pending"
    });

    if (pending) {
      return res.status(400).json({
        success: false,
        msg: "You already have a pending withdraw request"
      });
    }

    user.balance = Number(user.balance || 0) - amount;
user.wallet = Number(user.wallet || 0) - amount;
await user.save();

    const request = await WithdrawRequest.create({
      email,
      name: user.name || "",
      walletId: user.walletId || "",
      amount,
      walletBalance,
      withdrawableBalance,
      bankDetails: {
        accountHolderName: bank.accountHolderName,
        mobile: bank.mobile,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        upiId: bank.upiId
      },
      status: "Pending"
    });

    return res.json({
      success: true,
      msg: "Withdraw request submitted successfully",
      request
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

    if (!request) {
      return res.status(404).json({ success: false, msg: "Request not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        msg: "This request already processed"
      });
    }

    if (status === "Success") {
      request.status = "Success";
      request.actionDate = new Date();

      await WalletHistory.create({
        email: request.email,
        type: "Debit",
        amount: request.amount,
        title: "Withdraw Success",
        description: "Withdraw",
        status: "Success",
        date: new Date()
      });
    }

    if (status === "Rejected") {
      request.status = "Rejected";
      request.rejectReason = rejectReason || "Rejected by admin";
      request.actionDate = new Date();

      const user = await User.findOne({ email: request.email });

      if (user) {
        user.wallet = Number(user.wallet || 0) + Number(request.amount || 0);
        user.balance = Number(user.balance || 0) + Number(request.amount || 0);
        await user.save();
      }

      await WalletHistory.create({
        email: request.email,
        type: "Credit",
        amount: request.amount,
        title: "Withdraw Rejected Refund",
        description: request.rejectReason,
        status: "Rejected",
        date: new Date()
      });
    }

    await request.save();

    res.json({
      success: true,
      msg: `Withdraw ${status}`,
      request
    });
  } catch (err) {
    console.log("ADMIN WITHDRAW ACTION ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
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
    const certNo = investment.certificateNo || `SMCERT-${investment._id}`;

    const html = `
      <html>
        <head>
          <title>Investment Certificate</title>
          <style>
            body{font-family:Arial;background:#f4f7ff;padding:30px;color:#071747}
            .card{max-width:750px;margin:auto;background:white;border-radius:24px;padding:35px;border:3px solid #16a34a;box-shadow:0 20px 40px rgba(0,0,0,.12)}
            h1{text-align:center;color:#16a34a;font-size:42px}
            h2{text-align:center;color:#071747}
            .row{display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:14px 0;font-size:18px}
            .seal{text-align:center;margin-top:25px;color:#16a34a;font-weight:bold}
            button{margin-top:25px;width:100%;padding:14px;border:none;border-radius:12px;background:#16a34a;color:white;font-weight:bold;font-size:16px}
          </style>
        </head>
        <body>
          <div class="card">
            <h1>SAVE MONEY</h1>
            <h2>INVESTMENT CERTIFICATE</h2>

            <div class="row"><b>Certificate No</b><span>${certNo}</span></div>
            <div class="row"><b>Monthly Investment</b><span>₹${amount}</span></div>
            <div class="row"><b>Tenure</b><span>${investment.years || 0} Years</span></div>
            <div class="row"><b>Return Rate</b><span>${rate}%</span></div>
            <div class="row"><b>Total Plan Amount</b><span>₹${investment.totalPlanAmount || 0}</span></div>
            <div class="row"><b>Total Interest</b><span>₹${investment.totalInterest || 0}</span></div>
            <div class="row"><b>Maturity Amount</b><span>₹${investment.maturityAmount || 0}</span></div>
            <div class="row"><b>Status</b><span>${investment.status || "Active"}</span></div>

            <p class="seal">✅ Verified Save Money Investment</p>
            <button onclick="window.print()">Download / Print Certificate</button>
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




// ================= AUTO MONTH RESET =================

cron.schedule("0 0 1 * *", async () => {

  console.log("AUTO MONTH RESET RUNNING...");

  try {

    const all = await PerformanceBonus.find();

    for (let pb of all) {

      // move current to last month
      pb.lastMonthBonus = pb.thisMonthBonus;

      // reset current month
      pb.thisMonthBonus = 0;

      await pb.save();
    }

    // 🔥 reset monthly directs
await User.updateMany(
  {},
  { monthlyDirects: 0 }
);
    console.log("MONTH RESET SUCCESS");

  } catch (err) {

    console.log("MONTH RESET ERROR:", err);

  }

});

//================== AUTO INACTIVE CHECK ===================

cron.schedule("0 0 * * *", async () => {
  console.log("Auto inactive check running...");

  const users = await User.find();

  for (let user of users) {
    await updateInvestmentStatus(user.email);
  }

  console.log("Auto inactive check completed");
});

// ================= AUTO MONTH WITHDRAWAL =================

cron.schedule("0 0 5 * *", async () => {

  console.log("AUTO WITHDRAWAL STARTED");

  const users = await User.find();

  for (let user of users) {

    // active investment খুঁজবে
    const inv = await Investment.findOne({
      email: user.email,
      status: "Active"
    });

    if (!inv) continue;

    const now = new Date();

    // renew check
    const renewed = inv.history.find(h => {

      const d = new Date(h.date);

      return (
        d.getMonth() === now.getMonth() &&
        d.getDate() >= 1 &&
        d.getDate() <= 3
      );

    });

    // যদি renew থাকে
    if (renewed) {

      const amount = user.wallet;

      // wallet empty
      user.wallet = 0;

      await user.save();

      // history add
      await WalletHistory.create({
        email: user.email,
        type: "Auto Withdrawal",
        amount,
        note: "Monthly Auto Withdrawal"
      });

      console.log(
        user.email,
        "withdraw successful"
      );

    } else {

      console.log(
        user.email,
        "renew not found"
      );

    }

  }

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

