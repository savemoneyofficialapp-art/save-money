import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // 🎯 useLocation ইম্পোর্ট করা হলো
import { toast } from "react-toastify";
import { API } from "../config";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation(); // 🎯 ইউআরএল ট্র্যাকিংয়ের জন্য ইনিশিয়েট করা হলো

  // 🔗 ইউআরএল (URL) থেকে 'ref' প্যারামিটারটি খুঁজে বের করার লজিক
  const queryParams = new URLSearchParams(location.search);
  const urlReferCode = queryParams.get("ref") || ""; 

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referCode, setReferCode] = useState(urlReferCode); // 🎯 ডিফল্ট ভ্যালু হিসেবে লিংকের কোড সেট করা হলো
  const [terms, setTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Email Verification States
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false); // ওটিপি ভেরিফাই স্টেট
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false); // ভেরিফিকেশন লোডিং

  // OTP Countdown Timer Effect
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Send OTP Function
  const sendOtpCode = async () => {
    if (!email) {
      toast.warning("Please enter your email address first");
      return;
    }

    try {
      setSendingOtp(true);
      const res = await fetch(`${API}/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        setIsOtpSent(true);
        setIsOtpVerified(false); // নতুন করে ওটিপি পাঠালে আগের ভেরিফিকেশন রিসেট হবে
        setOtpTimer(120); // 2 minutes countdown
        toast.success("Verification code sent to your email!");
      } else {
        toast.error(data.msg || "Failed to send OTP");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to connect for sending OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP Function (নতুন ট্যাব/বাটনের লজিক)
  const verifyOtpCode = async () => {
    if (!otp || otp.trim().length !== 6) {
      toast.warning("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await fetch(`${API}/verify-email-otp`, { // আপনার এপিআই এন্ডপয়েন্ট অনুযায়ী নাম পরিবর্তন করতে পারেন
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          otp: otp.trim() 
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        setIsOtpVerified(true);
        toast.success("Email verified successfully!");
      } else {
        toast.error(data.msg || "Invalid OTP");
      }
    } catch (err) {
      console.log(err);
      toast.error("Verification failed. Try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const register = async () => {
    if (!name || !mobile || !email || !password) {
      toast.warning("Please fill all required fields");
      return;
    }

    if (!terms) {
      toast.warning("Please accept Terms & Conditions");
      return;
    }

    if (!isOtpSent || !otp) {
      toast.warning("Please enter your email OTP verification code");
      return;
    }

    if (!isOtpVerified) {
      toast.warning("Please verify your email OTP first before registration");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: otp.trim(),
          referCode: referCode.trim(),
          termsAccepted: true
        })
      });

      const data = await res.json();

      if (res.ok || data.success === true) {
        toast.success(data.msg || "Registered Successfully");
        navigate("/login");
      } else {
        toast.error(data.msg || "Registration failed");
      }
    } catch (err) {
      console.log(err);
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.leftPanel}>
          <div style={styles.piggyWrap}>
            <div style={styles.coin}>₹</div>
            <div style={styles.piggy}>
              <div style={styles.earLeft}></div>
              <div style={styles.earRight}></div>
              <div style={styles.eyeLeft}></div>
              <div style={styles.eyeRight}></div>
              <div style={styles.nose}>● ●</div>
              <div style={styles.legOne}></div>
              <div style={styles.legTwo}></div>
            </div>
          </div>

          <h1 style={styles.brand}>
            save<br />
            money
          </h1>

          <p style={styles.brandSub}>
            Save Today, Secure Tomorrow
          </p>

          <h2 style={styles.why}>Why Join Us?</h2>

          <Benefit icon="🛡️" title="100% Secure" text="Your data is safe with us" />
          <Benefit icon="👛" title="Save More" text="Smart saving for a better future" />
          <Benefit icon="📈" title="Grow Faster" text="Achieve your financial goals" />
          <Benefit icon="🎁" title="Exciting Rewards" text="Earn rewards and benefits" />

          <div style={styles.smallSteps}>
            Small Steps<br />Big Savings!
          </div>
        </div>

        <div style={styles.rightPanel}>
          <h2 style={styles.create}>Create Your</h2>
          <h1 style={styles.account}>Account</h1>

          <p style={styles.join}>
            Join <b>Save Money</b> and start your journey to financial freedom.
          </p>

          <InputBox color="#ff4cc4" icon="👤" placeholder="Full Name" value={name} setValue={setName} />
          <InputBox color="#7c3aed" icon="📱" placeholder="Mobile Number" value={mobile} setValue={setMobile} />
          
          {/* Email input with inline OTP dispatch button */}
          <div style={{ ...styles.inputWrap, borderColor: isOtpVerified ? "#22c55e" : "#0ea5e9" }}>
            <div style={{ ...styles.iconBox, background: isOtpVerified ? "linear-gradient(135deg,#22c55e,#10b981)" : "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
              {isOtpVerified ? "✓" : "✉️"}
            </div>
            <input
              style={styles.input}
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isOtpVerified}
            />
            <button
              style={{
                ...styles.otpInlineBtn,
                opacity: (sendingOtp || otpTimer > 0 || isOtpVerified) ? 0.6 : 1,
                background: isOtpVerified ? "#10b981" : "linear-gradient(135deg,#0ea5e9,#7c3aed)"
              }}
              type="button"
              onClick={sendOtpCode}
              disabled={sendingOtp || otpTimer > 0 || isOtpVerified}
            >
              {isOtpVerified ? "Verified" : sendingOtp ? "Sending..." : otpTimer > 0 ? `${otpTimer}s` : isOtpSent ? "Resend" : "Send OTP"}
            </button>
          </div>

          {/* Conditional Input Box for Email OTP verification with NEW Verify Tab */}
          {isOtpSent && (
            <div style={{ ...styles.inputWrap, borderColor: isOtpVerified ? "#22c55e" : "#f43f5e" }}>
              <div style={{ ...styles.iconBox, background: isOtpVerified ? "linear-gradient(135deg,#22c55e,#10b981)" : "linear-gradient(135deg,#f43f5e,#7c3aed)" }}>
                🔑
              </div>
              <input
                style={styles.input}
                placeholder="Enter 6-Digit Email OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isOtpVerified}
                maxLength={6}
              />
              <button
                style={{
                  ...styles.otpInlineBtn,
                  background: isOtpVerified ? "#22c55e" : "linear-gradient(135deg,#f43f5e,#e11d48)",
                  opacity: verifyingOtp ? 0.6 : 1
                }}
                type="button"
                onClick={verifyOtpCode}
                disabled={verifyingOtp || isOtpVerified}
              >
                {verifyingOtp ? "Verifying..." : isOtpVerified ? "Verified ✓" : "Verify OTP"}
              </button>
            </div>
          )}

          <div style={{ ...styles.inputWrap, borderColor: "#10b981" }}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#10b981,#22c55e)" }}>
              🔒
            </div>

            <input
              style={styles.input}
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              style={styles.eye}
              type="button"
              onClick={() => setShowPass(!showPass)}
            >
              👁
            </button>
          </div>

          {/* 🎁 রেফার কোড ইনপুট বক্স (অটো-পেস্ট এবং রিড-অনলি মোড লক লজিক সহ) */}
          <div style={{ ...styles.inputWrap, borderColor: "#f59e0b", background: urlReferCode ? "#f8fafc" : "transparent" }}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#f59e0b,#7c3aed)" }}>
              🎁
            </div>
            <input
              style={{
                ...styles.input,
                color: urlReferCode ? "#64748b" : "#0f172a",
                cursor: urlReferCode ? "not-allowed" : "text"
              }}
              placeholder="Refer Code Optional"
              value={referCode}
              onChange={(e) => !urlReferCode && setReferCode(e.target.value)}
              readOnly={!!urlReferCode} // যদি লিংক থেকে কোড আসে তবে ফিল্ড লক হয়ে যাবে
            />
          </div>

          {/* Checkbox triggers T&C verification explicitly */}
          <label style={styles.checkRow}>
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                e.preventDefault();
                if (!terms) {
                  setShowTerms(true);
                } else {
                  setTerms(false);
                }
              }}
              style={styles.checkbox}
            />

            <span>
              I agree to the{" "}
              <b
                style={styles.termsLink}
                onClick={(e) => {
                  e.preventDefault();
                  setShowTerms(true);
                }}
              >
                Terms & Conditions
              </b>
            </span>
          </label>

          <button
            style={{
              ...styles.registerBtn,
              opacity: (loading || !isOtpVerified) ? 0.7 : 1
            }}
            onClick={register}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register Now"}
            <span style={styles.arrow}>›</span>
          </button>

          <p style={styles.loginText}>
            Already have an account?
            <span
              style={styles.loginLink}
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>

          <div style={styles.disclaimer}>
            <div style={styles.disIcon}>🛡️</div>

            <div>
              <h3 style={styles.disclaimerTitle}>Disclaimer</h3>

              <p style={styles.disclaimerText}>
                Save Money is a private digital saving and investment initiative.
                Investment returns may vary based on company performance, market
                conditions, internal policies and future updates. Early closure may
                include deduction as per platform policy. Referral, performance,
                team, royalty and reward benefits are subject to eligibility rules.
              </p>
            </div>
          </div>

          <div style={styles.bottomFeatures}>
            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "linear-gradient(135deg,#22c55e,#86efac)" }}>🛡</div>
              <div>
                <div style={styles.bottomTitle}>100% Secure</div>
                <div style={styles.bottomText}>& Safe</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "linear-gradient(135deg,#9333ea,#c084fc)" }}>🔒</div>
              <div>
                <div style={styles.bottomTitle}>Your Data is</div>
                <div style={styles.bottomText}>Protected</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}>🎧</div>
              <div>
                <div style={styles.bottomTitle}>24/7 Customer</div>
                <div style={styles.bottomText}>Support</div>
              </div>
            </div>

            <div style={styles.bottomItem}>
              <div style={{ ...styles.bottomIcon, background: "linear-gradient(135deg,#f59e0b,#facc15)" }}>⭐</div>
              <div>
                <div style={styles.bottomTitle}>Trusted by</div>
                <div style={styles.bottomText}>Thousands</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showTerms && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Save Money Terms & Conditions</h2>

            <div style={styles.modalBody}>
              <p>
                Save Money is a private digital saving and investment initiative created
                to help users build disciplined saving habits and explore digital earning
                opportunities through a structured platform.
              </p>

              <p>
                Users must complete registration with correct personal information and
                must complete KYC verification before accessing investment, referral,
                wallet and earning related features.
              </p>

              <p>
                Users are responsible for providing accurate mobile number, email ID,
                USDT wallet address, PAN details, Aadhaar details and uploaded documents.
                Wrong information may result in rejection, delay, freeze or restriction.
              </p>

              <p>
                If a user closes an investment before completing the selected tenure,
                the platform may deduct 20% from the principal investment amount and
                return the remaining principal without interest, according to company
                policy.
              </p>

              <p>
                Save Money works as a systematic saving and investment style platform.
                ROI may be updated, increased or decreased depending on company profit,
                business performance, risk factors, market conditions and internal
                decisions.
              </p>

              <p>
                Referral income, performance bonus, team bonus, royalty bonus and daily
                reward are not guaranteed income. These benefits depend on eligibility,
                active status, investment completion, renewals, direct referral tasks
                and other platform rules.
              </p>

              <p>
                Wallet balance, rewards, referral income and other earnings may be
                reviewed by admin before approval, withdrawal or adjustment. Any
                suspicious activity, fake account, duplicate KYC, false referral or
                policy violation may result in account block.
              </p>

              <p>
                Auto withdrawal is subject to renewal status, wallet eligibility, admin
                verification and company policy. Withdrawal delays may happen due to
                verification, bank or wallet network issues.
              </p>

              <p>
                Save Money aims to grow into a bigger, transparent and legally compliant
                financial technology ecosystem in the future. Users should use the
                platform only after understanding all possible risks and rules.
              </p>

              <p>
                By creating an account, the user confirms that they have read,
                understood and accepted all policies, risks, rules, conditions,
                deductions, renewal rules, KYC rules and platform limitations.
              </p>
            </div>

            <button
              style={styles.modalBtn}
              onClick={() => {
                setTerms(true);
                setShowTerms(false);
              }}
            >
              Accept & Continue
            </button>

            <button
              style={styles.closeBtn}
              onClick={() => {
                setTerms(false);
                setShowTerms(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// InputBox কম্পোনেন্টটি আগের মতোই থাকবে
function InputBox({ color, icon, placeholder, value, setValue }) {
  return (
    <div style={{ ...styles.inputWrap, borderColor: color }}>
      <div style={{ ...styles.iconBox, background: `linear-gradient(135deg,${color},#7c3aed)` }}>
        {icon}
      </div>

      <input
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

function Benefit({ icon, title, text }) {
  return (
    <div style={styles.benefit}>
      <div style={styles.benefitIcon}>{icon}</div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

// স্টাইল অবজেক্ট সম্পূর্ণ অপরিবর্তিত রাখা হয়েছে
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#ffd18a,#eef3ff,#dff7ff)",
    padding: "25px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  card: {
    width: "100%",
    maxWidth: "980px",
    minHeight: "92vh",
    background: "#fff",
    borderRadius: "46px",
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 25px 70px rgba(0,0,0,.18)"
  },

  leftPanel: {
    width: "33%",
    background: "linear-gradient(180deg,#7c2cff,#4f20d8,#631bd9)",
    color: "white",
    padding: "38px 32px",
    borderTopRightRadius: "60px",
    borderBottomRightRadius: "60px",
    position: "relative"
  },

  piggyWrap: {
    position: "relative",
    width: "145px",
    height: "125px",
    marginBottom: "25px"
  },

  coin: {
    position: "absolute",
    top: "-8px",
    left: "52px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#ffd43b",
    color: "#7c3aed",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    zIndex: 3,
    boxShadow: "0 8px 15px rgba(0,0,0,.2)"
  },

  piggy: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "135px",
    height: "92px",
    borderRadius: "55px 60px 45px 45px",
    background: "linear-gradient(135deg,#ffb3c7,#ff6aa2)",
    boxShadow: "inset -10px -8px 0 rgba(255,0,100,.16)"
  },

  earLeft: {
    position: "absolute",
    top: "-18px",
    left: "25px",
    width: "32px",
    height: "32px",
    background: "#ff8ab8",
    borderRadius: "8px 20px 8px 20px",
    transform: "rotate(25deg)"
  },

  earRight: {
    position: "absolute",
    top: "-14px",
    right: "20px",
    width: "26px",
    height: "26px",
    background: "#ff8ab8",
    borderRadius: "8px 18px 8px 18px",
    transform: "rotate(45deg)"
  },

  eyeLeft: {
    position: "absolute",
    top: "28px",
    left: "78px",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#1e293b"
  },

  eyeRight: {
    position: "absolute",
    top: "28px",
    left: "100px",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#1e293b"
  },

  nose: {
    position: "absolute",
    right: "-8px",
    top: "36px",
    width: "36px",
    height: "26px",
    borderRadius: "50%",
    background: "#ff8ab8",
    color: "#7c2d12",
    fontSize: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  legOne: {
    position: "absolute",
    bottom: "-8px",
    left: "32px",
    width: "20px",
    height: "18px",
    background: "#ff6aa2",
    borderRadius: "0 0 8px 8px"
  },

  legTwo: {
    position: "absolute",
    bottom: "-8px",
    right: "34px",
    width: "20px",
    height: "18px",
    background: "#ff6aa2",
    borderRadius: "0 0 8px 8px"
  },

  brand: {
    fontSize: "58px",
    lineHeight: "52px",
    margin: 0,
    fontWeight: "900",
    letterSpacing: "-2px"
  },

  brandSub: {
    marginTop: "20px",
    fontSize: "17px"
  },

  why: {
    color: "#ffde3b",
    marginTop: "70px",
    fontSize: "24px"
  },

  benefit: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginTop: "18px"
  },

  benefitIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    flexShrink: 0
  },

  smallSteps: {
    position: "absolute",
    bottom: "28px",
    left: "35px",
    fontSize: "24px",
    color: "#efe7ff",
    fontStyle: "italic",
    lineHeight: "34px"
  },

  rightPanel: {
    flex: 1,
    padding: "48px 42px"
  },

  create: {
    textAlign: "center",
    fontSize: "34px",
    color: "#0f172a",
    margin: 0
  },

  account: {
    textAlign: "center",
    fontSize: "68px",
    margin: "-5px 0 10px",
    background: "linear-gradient(135deg,#ff2ebd,#8b2cff,#118cff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "900"
  },

  join: {
    textAlign: "center",
    fontSize: "17px",
    color: "#475569",
    marginBottom: "28px"
  },

  inputWrap: {
    height: "70px",
    border: "1.8px solid",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    gap: "18px",
    marginTop: "15px"
  },

  iconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "17px",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    flexShrink: 0
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "18px",
    color: "#0f172a",
    background: "transparent"
  },

  otpInlineBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg,#0ea5e9,#7c3aed)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  eye: {
    border: "none",
    background: "transparent",
    fontSize: "22px",
    cursor: "pointer"
  },

  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "22px",
    fontSize: "16px",
    color: "#334155"
  },

  checkbox: {
    width: "22px",
    height: "22px"
  },

  termsLink: {
    color: "#7c3aed",
    cursor: "pointer"
  },

  registerBtn: {
    width: "100%",
    height: "74px",
    border: "none",
    borderRadius: "26px",
    marginTop: "26px",
    background: "linear-gradient(135deg,#ff2ebd,#8b2cff,#412cff)",
    color: "white",
    fontSize: "24px",
    fontWeight: "900",
    position: "relative",
    boxShadow: "0 14px 25px rgba(124,58,237,.35)",
    cursor: "pointer"
  },

  arrow: {
    position: "absolute",
    right: "20px",
    top: "12px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "white",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px"
  },

  loginText: {
    textAlign: "center",
    marginTop: "20px",
    color: "#475569"
  },

  loginLink: {
    color: "#7c3aed",
    fontWeight: "900",
    cursor: "pointer",
    marginLeft: "6px"
  },

  disclaimer: {
    marginTop: "26px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "24px",
    padding: "18px",
    display: "flex",
    gap: "16px"
  },

  disIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0
  },

  disclaimerTitle: {
    margin: 0,
    color: "#16a34a"
  },

  disclaimerText: {
    color: "#334155",
    lineHeight: "24px",
    fontSize: "14px"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px"
  },

  modal: {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "82vh",
    background: "white",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 25px 70px rgba(0,0,0,.35)"
  },

  modalTitle: {
    margin: 0,
    color: "#7c3aed",
    textAlign: "center"
  },

  modalBody: {
    marginTop: "18px",
    maxHeight: "52vh",
    overflowY: "auto",
    color: "#334155",
    lineHeight: "25px",
    fontSize: "14px"
  },

  modalBtn: {
    width: "100%",
    marginTop: "18px",
    padding: "14px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer"
  },

  closeBtn: {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    border: "none",
    borderRadius: "14px",
    background: "#e2e8f0",
    color: "#334155",
    fontWeight: "800",
    cursor: "pointer"
  },

  bottomFeatures: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginTop: "28px",
    flexWrap: "wrap"
  },

  bottomItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: "140px"
  },

  bottomIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "15px",
    boxShadow: "0 8px 15px rgba(0,0,0,0.12)"
  },

  bottomTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "18px"
  },

  bottomText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "18px"
  }
};
