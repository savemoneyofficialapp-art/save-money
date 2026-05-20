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
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const DailyReward = require("./models/DailyReward");
const SupportTicket = require("./models/SupportTicket");
const BonusLedger = require("./models/BonusLedger");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const validator = require("validator");
const sanitize = require("mongo-sanitize");


const app = express();

app.get("/", (req, res) => {
  res.send("Save Money Backend Live");
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend running",
    time: new Date()
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://save-money-indol.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(helmet());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use((req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);

  // req.query sanitize করবে না, Render/Express এ query read-only
  next();
});



const allowedOrigins = [
  "http://localhost:3000",
  "https://save-money-indol.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "authorization"],
  credentials: true
}));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://save-money-indol.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "authorization"],
  credentials: true
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    msg: "Too many requests. Please try again later."
  }
});

app.use(apiLimiter);

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        msg: "No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        msg: "User not found"
      });
    }

    if (user.banned) {
      return res.status(403).json({
        msg: "Your account is banned",
        reason: user.banReason
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

async function addBonus({ email, fromEmail, fromName, type, level, amount, note, refId }) {
  const exists = await BonusLedger.findOne({ email, type, refId });

  if (exists) return;

  const user = await User.findOne({ email });
  if (!user) return;

  if (user.disableBonus) {
  return;
}

  user.wallet += amount;
  user.totalEarning = (user.totalEarning || 0) + amount;

  if (type === "Referral Bonus") {
    user.referralIncome = (user.referralIncome || 0) + amount;
  }

  if (type === "Performance Bonus") {
    user.performanceIncome = (user.performanceIncome || 0) + amount;
  }

  if (type === "Team Bonus") {
    user.teamIncome = (user.teamIncome || 0) + amount;
  }

  if (type === "Royalty Bonus") {
    user.royaltyIncome = (user.royaltyIncome || 0) + amount;
  }

  await user.save();

  await BonusLedger.create({
    email,
    fromEmail,
    fromName,
    type,
    level,
    amount,
    note,
    refId
  });

  await WalletHistory.create({
    email,
    type,
    amount,
    note
  });

  if (typeof sendNotification === "function") {
    await sendNotification(
      email,
      type,
      `${type} ₹${amount} received from ${fromName}`
    );
  }

await sendEmail(
  email,
  `${type} Credited`,
  `You received ${type} of ₹${amount} from ${fromName}.`
  );
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
        const royalty = Math.floor(investment.monthlyAmount * 0.01);

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
          note: "1% royalty from network first investment",
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
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, message) {
  try {
    await transporter.sendMail({
      from: `"Save Money" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family:Arial;background:#f8fafc;padding:20px;">
          <div style="max-width:500px;margin:auto;background:white;padding:20px;border-radius:12px;">
            <h2 style="color:#16a34a;">Save Money</h2>
            <p style="font-size:15px;color:#111827;">${message}</p>
            <hr/>
            <p style="font-size:12px;color:#64748b;">
              This is an automated email from Save Money.
            </p>
          </div>
        </div>
      `
    });

    console.log("Email sent:", to);
  } catch (err) {
    console.log("EMAIL ERROR:", err.message);
  }
}

require("dotenv").config();

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



let users = {};

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  // 🔥 user login করলে frontend থেকে email পাঠাবে
  socket.on("register", (email) => {
    users[email] = socket.id;
    console.log("Registered user:", email);
  });

  // 🔥 user disconnect হলে remove
  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);

    for (let email in users) {
      if (users[email] === socket.id) {
        delete users[email];
      }
    }

  });

});

app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "authorization"]
}));

// 👉 static folder (image দেখার জন্য)
app.use("/uploads", express.static("uploads"));

// ================= STORAGE =================

const storage = multer.diskStorage({

  destination: function(req, file, cb) {

    cb(null, "uploads/");

  },

  filename: function(req, file, cb) {

    cb(
      null,
      Date.now() + "-" + file.originalname
    );

  }

});

app.use((err, req, res, next) => {

  console.log("GLOBAL ERROR:", err);

  res.status(500).json({
    msg: "Internal server error"
  });

});

const upload = multer({

  storage: storage,

  limits: {

    fileSize: 2 * 1024 * 1024

  },

  fileFilter: function(req, file, cb) {

    const allowedTypes = [

      "image/png",
      "image/jpeg",
      "image/jpg"

    ];

    if (
      !allowedTypes.includes(file.mimetype)
    ) {

      return cb(
        new Error(
          "Only PNG JPG JPEG allowed"
        )
      );

    }

    cb(null, true);

  }

});

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



const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    msg: "Too many login/register attempts. Try later."
  }
});

// ================= REGISTER =================
app.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, mobile, password, pan, aadhaar, referCode } = req.body;
    
    if (!validator.isEmail(email)) {
  return res.json({
    msg: "Invalid email format"
  });
}

if (!validator.isMobilePhone(mobile + "", "any")) {
  return res.json({
    msg: "Invalid mobile number"
  });
}

if (!validator.isStrongPassword(password, {
  minLength: 6,
  minNumbers: 1
})) {
  return res.json({
    msg: "Password must contain letters and numbers"
  });
}

if (name.length < 3) {
  return res.json({
    msg: "Name too short"
  });
}

    if (!name || !email || !mobile || !password || !pan || !aadhaar) {
      return res.json({ msg: "All fields required" });
    }

    const exist = await User.findOne({ email });
    if (exist) return res.json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const walletId = "WAL" + Math.floor(100000 + Math.random() * 900000);
    const myReferCode = "REF" + Math.floor(100000 + Math.random() * 900000);

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      pan,
      aadhaar,
      referCode: myReferCode,
      referredBy: referCode || "",
      walletId,
      wallet: 0,
      kycStatus: "not submitted",
      role: "user"
    });

     await sendEmail(
  email,
  "Welcome to Save Money",
  `Hello ${name}, your account has been created successfully. Please complete your KYC to start using Save Money.`
);

    res.json({ msg: "Registered Successfully" });

    if (referCode) {
  const refUser = await User.findOne({ referCode });

  if (refUser) {
    await updateUserRank(refUser.email);
  }
}

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ================= LOGIN =================

app.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
  return res.json({
    msg: "Invalid email"
  });
}

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ msg: "Wrong password" });
    }

    if (user.banned) {
      return res.json({
        msg: "Account Suspended"
      });
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role || "user"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      {
        id: user._id
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      msg: "Login success",
      accessToken,
      refreshToken,
      token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role || "user",
        kycStatus: user.kycStatus,
        activeStatus: user.activeStatus,
        accountActive: user.accountActive,
        walletId: user.walletId,
        wallet: user.wallet
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/send-email-otp", async (req, res) => {

  console.log("EMAIL OTP API HIT");

  const { email } = req.body;

  if (!email) {
    return res.json({ msg: "Email required" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ msg: "Email not registered" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const expiry = new Date(Date.now() + 5 * 60 * 1000);

  await OTP.findOneAndUpdate(
    { email },
    { otp, expiresAt: expiry },
    { upsert: true }
  );

  await transporter.sendMail({
    from: "YOUR_EMAIL@gmail.com",
    to: email,
    subject: "OTP",
    text: `Your OTP is ${otp}`
  });

  res.json({ msg: "OTP sent to email" });
});

app.post("/reset-password", async (req, res) => {

  try {

    const { email, otp, newPassword } = req.body;

    if (otpStore[email] != otp) {
      return res.json({ msg: "Invalid OTP" });
    }

    await User.updateOne(
      { email },
      { password: newPassword }
    );

    delete otpStore[email];

    res.json({ msg: "Password updated" });

  } catch (error) {
    console.log(error);
    res.json({ msg: "Reset failed" });
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

app.post("/send-forgot-otp", async (req, res) => {

  try {

    const { email } = req.body; // ✅ এখানে define হচ্ছে

    console.log("Sending email to:", email); // ✅ এখানে OK

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ msg: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    await transporter.sendMail({
      from: "SaveMoney@gmail.com",
      to: email,
      subject: "OTP",
      text: `Your OTP is ${otp}`
    });

    res.json({ msg: "OTP sent" });

  } catch (err) {
    console.log(err);
    res.json({ msg: "Error sending OTP" });
  }
});

app.post("/verify-otp", async (req, res) => {

  const { mobile, otp } = req.body;

  const data = await OTP.findOne({ mobile });

  if (!data) {
    return res.json({ msg: "OTP not found" });
  }

  if (data.otp !== otp) {
    return res.json({ msg: "Invalid OTP" });
  }

  if (data.expiresAt < new Date()) {
    return res.json({ msg: "OTP expired" });
  }

  const user = await User.findOne({ mobile });

  if (!user) {
    return res.json({ msg: "User not registered" });
  }

  res.json({
    msg: "Login success",
    email: user.email
  });
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

app.post("/start-invest", auth, async (req, res) => {

  try {

    const { email, amount, years } = req.body;

    const kyc = await checkKYC(email);

if (!kyc.ok) {
  return res.json({
    msg: kyc.msg
  });
}

    if (amount < 2000) {
      return res.json({ msg: "Minimum 2000 required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ msg: "User not found" });
    }

    if (user.wallet < amount) {
      return res.json({ msg: "Low balance" });
    }

    if (user.disableInvestment) {
  return res.json({
    msg: "Investment disabled by admin"
  });
}

    // already active plan check
    const oldPlan = await Investment.findOne({ email, status: "Active" });

    if (oldPlan) {
      return res.json({ msg: "Active plan already exists" });
    }

    // rate
    let rate = 20;
    if (years == 1) rate = 11;
    if (years == 3) rate = 14;

    const totalPlan = amount * 12 * years;
    const interest = Math.floor(totalPlan * rate / 100);
    const maturity = totalPlan + interest;

    const nextRenewDate = new Date();
nextRenewDate.setDate(nextRenewDate.getDate() + 30);

const previousInvest = await Investment.countDocuments({ email });

    // create investment
    const inv = await Investment.create({
      email,
      monthlyAmount: amount,
      years,
      rate,
      totalPlanAmount: totalPlan,
      totalInterest: interest,
      maturityAmount: maturity,
      monthsPaid: 1,
      startDate: new Date(),
      status: "Active",
      referralBonusGiven: false,
nextRenewDate,
lastRenewDate: new Date(),
renewStatus: "Waiting",

         history: [
        {
          amount,
          date: new Date()
        }
      ]
    });

    await sendEmail(
  email,
  "Investment Successful",
  `Your Save Money investment of ₹${amount} per month has been started successfully for ${years} years.`
);

    if (previousInvest === 0) {
  await processFirstInvestmentBonuses(email, inv);
}

    await User.updateOne(
  { email },
  {
    accountActive: true,
    activeStatus: "Active"
  }
);

    await payRoyaltyBonus(email, amount);

    const oldTeam = await TeamBonus.findOne({ email });

if (!oldTeam) {
  await TeamBonus.create({
    email,
    challengeStart: new Date()
  });
}

await payTeamBonus(email);

    // deduct wallet
    user.wallet -= amount;
    await user.save();

    const existPB = await PerformanceBonus.findOne({ email });

    

if (!existPB) {
  await PerformanceBonus.create({
    email,
    challengeStart: new Date()
  });
}

    // ================= REFERRAL BONUS =================
    if (user.referredBy && inv.referralBonusGiven === false) {

      const refUser = await User.findOne({ referCode: user.referredBy });

      if (refUser) {

        refUser.referralIncome = (refUser.referralIncome || 0) + 499;
        refUser.wallet = (refUser.wallet || 0) + 499;

        await refUser.save();

        inv.referralBonusGiven = true;
        await inv.save();

        // notification
        if (typeof createNotification === "function") {
          await createNotification(
            refUser.email,
            `You received ₹499 referral income from ${user.name}`
          );
        }
      }
    }

    // user notification
    if (typeof createNotification === "function") {
      await createNotification(
        email,
        "Your Save Money investment started successfully"
      );
    }

    await sendNotification(

  email,

  "Investment Successful",

  `Your investment of ₹${amount} is successful`

);

    res.json({ msg: "Investment Started" });

  } catch (err) {
    console.log("START INVEST ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }

});

app.post("/renew-invest", auth, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    const inv = await Investment.findOne({ email, status: "Active" });

    if (user.disableInvestment) {
  return res.json({
    msg: "Renew disabled by admin"
  });
}

    if (!inv) return res.json({ msg: "No active plan" });

    const today = new Date();
    const renewStart = new Date(inv.nextRenewDate);
    const renewEnd = new Date(inv.nextRenewDate);
    renewEnd.setDate(renewEnd.getDate() + 5);

    if (today < renewStart) {
      return res.json({ msg: "Renew time not started yet" });
    }

    if (today > renewEnd) {
      inv.renewStatus = "Overdue";
      await inv.save();
      return res.json({ msg: "Renew date missed. Plan is overdue" });
    }

    if (user.wallet < inv.monthlyAmount) {
      return res.json({ msg: "Low wallet balance" });
    }

    user.wallet -= inv.monthlyAmount;
    await user.save();

    inv.monthsPaid += 1;

    inv.history.push({
      amount: inv.monthlyAmount,
      date: new Date()
    });

    inv.lastRenewDate = new Date();

    const nextDate = new Date(inv.nextRenewDate);
    nextDate.setDate(nextDate.getDate() + 30);
    inv.nextRenewDate = nextDate;

    inv.renewStatus = "Waiting";

    await User.updateOne(
  { email },
  {
    accountActive: true,
    activeStatus: "Active"
  }
);

    if (inv.monthsPaid >= inv.years * 12) {
      inv.status = "Completed";
      inv.renewStatus = "Completed";
    }

    await inv.save();

    await processRenewBonuses(email, inv);

    await sendEmail(
  email,
  "Investment Renewed",
  `Your monthly Save Money investment has been renewed successfully.`
);

    res.json({ msg: "Renew Successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
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

app.post("/wallet-data", async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({ email });

  const history = await WalletHistory.find({ email })
    .sort({ date: -1 });

  res.json({
    walletId: user.walletId,
    wallet: user.wallet,

    referralIncome: user.referralIncome,
    performanceIncome: user.performanceIncome,
    teamIncome: user.teamIncome,
    royaltyIncome: user.royaltyIncome,

    history
  });

});

app.post(
  "/add-cash",
  upload.single("screenshot"),
  async (req, res) => {

    try {

      const { email, amount, utr } = req.body;

      const screenshot =
        req.file
          ? req.file.filename
          : "";

      await AddCash.create({
        email,
        amount,
        utr,
        screenshot
      });

      await WalletHistory.create({
        email,
        type: "Add Cash Request",
        amount,
        status: "pending",
        note: utr
      });

      res.json({
        msg: "Request Submitted"
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        msg: "Upload failed"
      });

    }

  }
);

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

  const { senderEmail, walletId, amount } = req.body;

  const kyc = await checkKYC(senderEmail);

if (!kyc.ok) {
  return res.json({
    msg: kyc.msg
  });
}

  const sender = await User.findOne({
    email: senderEmail
  });

  if (sender.freezeWallet) {
  return res.json({
    msg: "Wallet is frozen by admin"
  });
}

  const receiver = await User.findOne({
    walletId
  });

  if (!receiver) {
    return res.json({
      msg: "Receiver not found"
    });
  }

  if (sender.wallet < amount) {
    return res.json({
      msg: "Low balance"
    });
  }

  sender.wallet -= amount;
  receiver.wallet += Number(amount);

  await sender.save();
  await receiver.save();

  // sender history
  await WalletHistory.create({
    email: sender.email,
    type: "Wallet Transfer Sent",
    amount,
    note: receiver.walletId
  });

  // receiver history
  await WalletHistory.create({
    email: receiver.email,
    type: "Wallet Transfer Received",
    amount,
    note: sender.walletId
  });

  res.json({
    msg: "Transfer Successful"
  });

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

app.post("/my-investments", async (req, res) => {
  const { email } = req.body;

  const data = await Investment.find({ email }).sort({ startDate: -1 });

  res.json(data);
});

app.post("/kyc-upload", upload.fields([
  { name: "aadhaarFile" },
  { name: "panFile" },
  { name: "photo" }
]), async (req, res) => {

  const { email } = req.body;

  const aadhaarFile = req.files["aadhaarFile"][0].filename;
  const panFile = req.files["panFile"][0].filename;
  const photo = req.files["photo"][0].filename;

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
      const { email } = req.body;
      await sendNotification(email, "KYC Submitted Successfully");

      console.log("KYC API HIT:", email);

      await User.updateOne(
        { email },
        {
          aadhaarFile: req.files.aadhaarFile[0].filename,
          panFile: req.files.panFile[0].filename,
          photo: req.files.photo[0].filename,
          kycStatus: "pending"
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



app.get("/kyc-list", async (req, res) => {

  const users = await User.find({ kycStatus: "pending" });

  res.json(users);
});



app.post("/reject-kyc", async (req, res) => {

  const { email, reason } = req.body;

  await User.updateOne(
    { email },
    {
      kycStatus: "rejected",
      kycReason: reason
    }
  );

  res.json({ msg: "KYC rejected" });
});



// ================= DASHBOARD =================
app.post("/dashboard", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select("-password");

  res.json({
  name: user?.name || "",
  balance: user?.wallet || 0,
  wallet: user?.wallet || 0,
  referralIncome: user?.referralIncome || 0,
  teamIncome: user?.teamIncome || 0,
  myCode: user?.referCode || "",
  kycStatus: user?.kycStatus || "not submitted"
});
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

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    msg: "Too many admin requests."
  }
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

app.post("/add-cash", async (req, res) => {
  const { email, amount, utr, screenshot } = req.body;

  await AddCash.create({
    email,
    amount,
    utr,
    screenshot,
    status: "Pending"
  });

  res.json({ msg: "Request Submitted" });
});


app.get("/admin-analytics", auth, adminAuth, adminLimiter, async (req, res) => {

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
          $sum: "$totalPlanAmount"
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

  const users = await User.find({
    kycStatus: "pending"
  });

  res.json(users);

});

app.post("/approve-kyc", auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ msg: "User not found" });
    }

    user.kycStatus = "approved";
    await user.save();

    await sendEmail(
  user.email,
  "KYC Approved",
  `Hello ${user.name}, your KYC has been approved successfully. You can now use Save Money, Refer & Earn, and Wallet services.`
);

    res.json({ msg: "KYC Approved" });

  } catch (err) {
    console.log("KYC APPROVE ERROR:", err);
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
      { $group: { _id: null, total: { $sum: "$totalPlanAmount" } } }
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
  const requests = await AddCash.find({ status: "Pending" }).sort({ date: -1 });
  res.json(requests);
});

app.post("/approve-cash",
auth,
adminAuth,
async (req, res) => {

  const { requestId } = req.body;

  const reqData = await AddCash.findById(requestId);

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

app.post(
  "/admin-user-tree",
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

    req.body.email = email;

    app._router.handle(
      req,
      res,
      require("express/lib/router/layer")
    );
  }
);

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

  for (let u of users) {

    await Notification.create({

      email: u.email,

      title,

      message

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

app.post("/get-notifications", async (req, res) => {

  const { email } = req.body;

  // DB থেকে ওই user এর সব notification আনবে
  const data = await Notification.find({ email })
    .sort({ createdAt: -1 }); // নতুনটা আগে

  res.json(data);
});



app.post("/my-referrals", async (req, res) => {
  try {
    const { email } = req.body;

    const me = await User.findOne({ email });

    if (!me) {
      return res.json({
        myCode: "NO CODE",
        team: []
      });
    }

    // 🔥 যদি referCode না থাকে, auto generate করে save করবে
    if (!me.referCode) {
      me.referCode = "REF" + Math.floor(100000 + Math.random() * 900000);
      await me.save();
    }

    const team = await User.find({ referredBy: me.referCode });

    const result = [];

for (let u of users) {

  // auto active/inactive check
  await updateInvestmentStatus(u.email);

  // fresh updated user
  const freshUser = await User.findOne({
    email: u.email
  });

  let status =
    freshUser.activeStatus || "Inactive";

  result.push({

    name: u.name,

    joinDate: u.createdAt,

    status

  });
}

    res.json({
      myCode: me.referCode,
      team: result
    });

  } catch (err) {
    console.log("REFERRAL ERROR:", err);
    res.status(500).json({ msg: "Server error" });
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

app.post("/user-data",
auth,
async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({
    email
  });

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

app.post("/referral-tree", auth, async (req, res) => {
  try {

    const { email, filter } = req.body;

    const rootUser = await User.findOne({ email });

    if (!rootUser) {
      return res.json({ msg: "User not found" });
    }

    let analytics = {
      totalUsers: 0,
      activeUsers: 0,
      totalBusiness: 0,
      levels: {}
    };

    async function buildTree(user, level) {

      if (level > 7) return [];

      let query = {
        referredBy: user.referCode
      };

      if (filter === "active") {
        query.kycStatus = "approved";
      }

      if (filter === "pending") {
        query.kycStatus = { $ne: "approved" };
      }

      const children = await User.find(query)
        .select(
          "-password name email referCode kycStatus createdAt wallet"
        );

      const result = [];

      if (!analytics.levels[level]) {
        analytics.levels[level] = {
          users: 0,
          active: 0,
          income: 0
        };
      }

      for (let child of children) {

        analytics.totalUsers += 1;

        analytics.levels[level].users += 1;

        if (child.kycStatus === "approved") {
          analytics.activeUsers += 1;
          analytics.levels[level].active += 1;
        }

        const investment = await Investment.findOne({
          email: child.email,
          status: "Active"
        });

        let business = 0;

        if (investment) {
          business = investment.monthlyAmount || 0;
          analytics.totalBusiness += business;
          analytics.levels[level].income += business;
        }

        result.push({
          _id: child._id,
          name: child.name,
          email: child.email,
          referCode: child.referCode,
          kycStatus: child.kycStatus,
          joinDate: child.createdAt,
          level,
          business,
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

    res.json({
      tree,
      analytics
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      msg: "Server error"
    });
  }
});

app.post("/my-bonus-ledger", auth, async (req, res) => {
  const { email } = req.body;

  const data = await BonusLedger.find({ email })
    .sort({ date: -1 });

  res.json(data);
});




app.post("/daily-reward", auth, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.json({ msg: "User not found" });

    let reward = await DailyReward.findOne({ email });

    if (!reward) {
      reward = await DailyReward.create({ email });
    }

    const today = new Date().toDateString();

    if (
      reward.lastClaimDate &&
      new Date(reward.lastClaimDate).toDateString() === today
    ) {
      return res.json({
        msg: "Already claimed today",
        reward
      });
    }

    const amount = Math.floor(Math.random() * 21) + 10; // ₹10-₹30

    user.wallet += amount;
    await user.save();

    reward.lastClaimDate = new Date();
    reward.totalReward += amount;

    reward.history.push({
      amount,
      date: new Date(),
      status: "Claimed"
    });

    await reward.save();

    await WalletHistory.create({
      email,
      type: "Daily Reward",
      amount,
      note: "Daily login reward"
    });

    res.json({
      msg: `You received ₹${amount}`,
      reward
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
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

app.get("/investment-certificate/:id", async (req, res) => {
  const inv = await Investment.findById(req.params.id);
  if (!inv) return res.send("Investment not found");

  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=investment-certificate.pdf"
  );

  doc.pipe(res);

  doc.rect(0, 0, 595, 842).fill("#020617");
  doc.rect(30, 30, 535, 782).lineWidth(4).stroke("#22c55e");

  doc.fillColor("#22c55e").fontSize(32).text("SAVE MONEY", 0, 70, {
    align: "center"
  });

  doc.fillColor("#ffffff").fontSize(20).text("OFFICIAL INVESTMENT CERTIFICATE", {
    align: "center"
  });

  doc.moveDown(2);

  doc.fillColor("#facc15").fontSize(14).text(`Certificate ID: CERT-${inv._id}`);
  doc.fillColor("#ffffff").text(`Email: ${inv.email}`);
  doc.text(`Monthly Investment: INR ${inv.monthlyAmount}`);
  doc.text(`Tenure: ${inv.years} Years`);
  doc.text(`Interest Rate: ${inv.rate}%`);
  doc.text(`Total Investment: INR ${inv.totalPlanAmount}`);
  doc.text(`Total Interest: INR ${inv.totalInterest}`);

  doc.moveDown(2);

  doc.fillColor("#22c55e").fontSize(24).text(
    `Maturity Return: INR ${inv.maturityAmount}`,
    { align: "center" }
  );

  doc.moveDown(3);

  doc.fillColor("#94a3b8").fontSize(12).text(
    "This certificate confirms your Save Money investment plan.",
    { align: "center" }
  );

  doc.fillColor("#22c55e").fontSize(14).text(
    "Authorized Signature",
    360,
    760
  );

  doc.end();
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

app.get("/investment-slip/:investmentId/:paymentId", async (req, res) => {
  const { investmentId, paymentId } = req.params;

  const inv = await Investment.findById(investmentId);
  if (!inv) return res.send("Investment not found");

  const payment = inv.history.find(
    h => h._id.toString() === paymentId
  );

  if (!payment) return res.send("Payment not found");

  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=payment-slip-${paymentId}.pdf`
  );

  doc.pipe(res);

  doc.rect(0, 0, 595, 842).fill("#f8fafc");
  doc.rect(40, 40, 515, 760).lineWidth(3).stroke("#22c55e");

  doc.fillColor("#020617").fontSize(30).text("SAVE MONEY", {
    align: "center"
  });

  doc.fillColor("#16a34a").fontSize(20).text("OFFICIAL PAYMENT RECEIPT", {
    align: "center"
  });

  doc.moveDown(2);

  doc.fillColor("#020617").fontSize(14).text(`Receipt ID: PAY-${payment._id}`);
  doc.text(`Email: ${inv.email}`);
  doc.text(`Amount Paid: INR ${payment.amount}`);
  doc.text(`Payment Date: ${new Date(payment.date).toLocaleDateString()}`);
  doc.text(`Plan: ${inv.years} Years`);
  doc.text(`Monthly Amount: INR ${inv.monthlyAmount}`);

  doc.moveDown(2);

  doc.fillColor("#22c55e").fontSize(24).text("STATUS: SUCCESS", {
    align: "center"
  });

  doc.moveDown(3);

  doc.fillColor("#64748b").fontSize(12).text(
    "This is a system generated official payment receipt.",
    { align: "center" }
  );

  doc.end();
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

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (email) => {
    onlineUsers[email] = socket.id;
    console.log("User joined:", email);
  });

  socket.on("disconnect", () => {
    for (let email in onlineUsers) {
      if (onlineUsers[email] === socket.id) {
        delete onlineUsers[email];
      }
    }

    console.log("User disconnected");
  });
});

// ✅ server.listen MUST be outside io.on
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});