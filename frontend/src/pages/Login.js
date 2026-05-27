import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState("");

  const saveLogin = (data) => {
    const token = data.token || data.accessToken;

    localStorage.setItem("token", token || "");
    localStorage.setItem("accessToken", token || "");
    localStorage.setItem("email", data.email || data.user?.email || "");
    localStorage.setItem("name", data.name || data.user?.name || "");
    localStorage.setItem("role", data.role || data.user?.role || "user");

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    if (remember) {
      localStorage.setItem("rememberLogin", mode === "email" ? email : mobile);
      localStorage.setItem("rememberMode", mode);
    }

    const role = data.role || data.user?.role || "user";

    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  };

  const loginEmail = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Login failed");
        return;
      }

      saveLogin(data);
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      setMessage("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!mobile) {
      setMessage("Please enter mobile number");
      return;
    }

    try {
      setOtpLoading(true);
      setMessage("");

      const res = await fetch(`${API}/send-login-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mobile: mobile.trim()
        })
      });

      const data = await res.json();
      setMessage(data.msg || "OTP sent successfully");
    } catch (err) {
      console.log("OTP ERROR:", err);
      setMessage("OTP send failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const loginMobile = async () => {
    if (!mobile || !otp) {
      setMessage("Please enter mobile number and OTP");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API}/mobile-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mobile: mobile.trim(),
          otp: otp.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Mobile login failed");
        return;
      }

      saveLogin(data);
    } catch (err) {
      console.log("MOBILE LOGIN ERROR:", err);
      setMessage("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (mode === "email") {
      loginEmail();
    } else {
      loginMobile();
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.bgCircleOne}></div>
      <div style={styles.bgCircleTwo}></div>
      <div style={styles.bgPill}></div>

      <div style={styles.mainCard}>

        <div style={styles.decorDotsLeft}>•••<br />•••<br />•••</div>
        <div style={styles.decorDotsRight}>•••<br />•••<br />•••</div>
        <div style={styles.floatingChart}>▂▅█</div>
        <div style={styles.floatingShield}>✓</div>

        <div style={styles.logoArea}>

          <div style={styles.piggyBase}>
            <div style={styles.coin}>₹</div>

            <div style={styles.piggy}>
              <span style={styles.earLeft}></span>
              <span style={styles.earRight}></span>
              <span style={styles.eyeLeft}></span>
              <span style={styles.eyeRight}></span>
              <span style={styles.nose}>••</span>
              <span style={styles.legLeft}></span>
              <span style={styles.legRight}></span>
            </div>
          </div>

          <h1 style={styles.logoText}>
            <span style={styles.logoSave}>save</span>{" "}
            <span style={styles.logoMoney}>money</span>
          </h1>

         <div style={styles.tagline}>
  <span style={styles.taglineLine}></span>

  <p>Save Today, Secure Tomorrow</p>

  <span style={styles.taglineLine}></span>
</div>

          <h2 style={styles.welcomeTitle}>Welcome Back!</h2>
          <p style={styles.welcomeSub}>
            Login to continue your financial journey
          </p>
        </div>

        <div style={styles.loginBox}>

          <div style={styles.switchTop}>
            <div style={styles.switchBox}>
              <button
                type="button"
                style={{
                  ...styles.switchBtn,
                  ...(mode === "email" ? styles.switchActive : {})
                }}
                onClick={() => setMode("email")}
              >
                ✉ Email
              </button>

              <button
                type="button"
                style={{
                  ...styles.switchBtn,
                  ...(mode === "mobile" ? styles.switchActive : {})
                }}
                onClick={() => setMode("mobile")}
              >
                📱 Mobile
              </button>
            </div>

            <button
              type="button"
              style={styles.changeBtn}
              onClick={() => setMode(mode === "email" ? "mobile" : "email")}
            >
              ⇄ Change
            </button>
          </div>

          {message && (
            <div style={styles.messageBox}>
              {message}
            </div>
          )}

          {mode === "email" ? (
            <>
              <div style={styles.inputActive}>
                <div style={styles.inputIcon}>✉</div>
                <input
                  style={styles.input}
                  placeholder="Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div style={styles.sideIcon}>👤</div>
              </div>

              <div style={styles.inputBox}>
                <div style={styles.inputIcon}>🔒</div>
                <input
                  style={styles.input}
                  placeholder="Password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                >
                  👁
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={styles.inputActive}>
                <div style={styles.inputIcon}>📱</div>
                <input
                  style={styles.input}
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
                <button
                  type="button"
                  style={styles.sendOtp}
                  onClick={sendOtp}
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>

              <div style={styles.inputBox}>
                <div style={styles.inputIcon}>🔐</div>
                <input
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div style={styles.sideIcon}>✓</div>
              </div>
            </>
          )}

          <div style={styles.optionsRow}>
            <label style={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember Me
            </label>

           <button
  type="button"
  style={styles.forgot}
  onClick={() => {
    console.log("Forgot clicked");
    navigate("/forgot-password");
  }}
>
  Forgot Password?
</button>
          </div>

          <button
            style={styles.loginBtn}
            onClick={handleLogin}
            disabled={loading}
          >
            <span style={styles.lockCircle}>🔒</span>
            {loading ? "Please Wait..." : "Login Now"}
            <span style={styles.arrowCircle}>›</span>
          </button>

          <div style={styles.orRow}>
            <span></span>
            <p>OR</p>
            <span></span>
          </div>

          <div style={styles.socialRow}>
            <p>Login with</p>
            <button type="button" style={styles.googleBtn}>G</button>
            <button type="button" style={styles.facebookBtn}>f</button>
            <button type="button" style={styles.appleBtn}></button>
          </div>

        </div>

        <div style={styles.registerCard}>
          <div style={styles.registerIcon}>🪪</div>

          <div style={styles.registerContent}>
            <h3>Don’t have an account?</h3>
            <p>Create a new account and start saving with us.</p>
          </div>

          <button
            style={styles.registerBtn}
            onClick={() => navigate("/register")}
          >
            👤+ Register Now
          </button>
        </div>

        <div style={styles.trustRow}>
          <Trust icon="🛡️" title="100% Secure" text="& Safe" />
          <Trust icon="🔒" title="Your Data is" text="Protected" />
          <Trust icon="🎧" title="24/7 Customer" text="Support" />
          <Trust icon="⭐" title="Trusted by" text="Thousands" />
        </div>

      </div>
    </div>
  );
}

function Trust({ icon, title, text }) {
  return (
    <div style={styles.trustItem}>
      <div style={styles.trustIcon}>{icon}</div>
      <p>
        {title}
        <br />
        {text}
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#e9f4ff 0%,#f7f1ff 45%,#ffeef8 100%)",
    padding: "32px 16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    position: "relative",
    overflow: "hidden"
  },

  bgCircleOne: {
    position: "fixed",
    top: "-90px",
    left: "18%",
    width: "260px",
    height: "260px",
    border: "30px solid rgba(167,139,250,0.28)",
    borderRadius: "50%"
  },

  bgCircleTwo: {
    position: "fixed",
    right: "-80px",
    top: "42%",
    width: "180px",
    height: "95px",
    background: "rgba(244,114,182,0.45)",
    borderRadius: "90px"
  },

  bgPill: {
    position: "fixed",
    left: "-75px",
    bottom: "110px",
    width: "170px",
    height: "230px",
    background: "rgba(216,180,254,0.55)",
    borderRadius: "90px",
    transform: "rotate(35deg)"
  },

  mainCard: {
    width: "100%",
    maxWidth: "920px",
    background: "rgba(255,255,255,0.88)",
    borderRadius: "46px",
    padding: "32px 64px 38px",
    boxShadow: "0 35px 90px rgba(99,102,241,0.22)",
    border: "1px solid rgba(255,255,255,0.9)",
    position: "relative",
    overflow: "hidden",
    zIndex: 2
  },

  decorDotsLeft: {
    position: "absolute",
    left: "34px",
    top: "275px",
    color: "#c4b5fd",
    lineHeight: "14px",
    letterSpacing: "8px",
    fontSize: "18px"
  },

  decorDotsRight: {
    position: "absolute",
    right: "28px",
    bottom: "255px",
    color: "#c4b5fd",
    lineHeight: "14px",
    letterSpacing: "8px",
    fontSize: "18px"
  },

  floatingChart: {
    position: "absolute",
    top: "112px",
    left: "80px",
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg,#4f46e5,#d946ef)",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
    fontSize: "25px",
    boxShadow: "0 12px 26px rgba(79,70,229,0.35)"
  },

  floatingShield: {
    position: "absolute",
    top: "160px",
    right: "120px",
    width: "76px",
    height: "76px",
    background: "linear-gradient(135deg,#22c55e,#10b981)",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "42px",
    fontWeight: "900",
    boxShadow: "0 14px 28px rgba(34,197,94,0.35)"
  },

  logoArea: {
    textAlign: "center",
    position: "relative",
    zIndex: 2
  },

  piggyBase: {
    width: "185px",
    height: "140px",
    margin: "0 auto 10px",
    position: "relative",
    background: "linear-gradient(135deg,#7c3aed,#d946ef)",
    borderRadius: "90px 90px 30px 30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end"
  },

  coin: {
    position: "absolute",
    top: "-18px",
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f97316)",
    color: "#92400e",
    fontWeight: "900",
    fontSize: "29px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "4px solid #ffd166",
    zIndex: 4
  },

  piggy: {
    width: "136px",
    height: "88px",
    background: "linear-gradient(135deg,#ffc2d1,#ff8fab)",
    borderRadius: "58px 62px 46px 46px",
    position: "relative",
    marginBottom: "18px",
    boxShadow: "inset -10px -8px 0 rgba(244,63,94,0.14)"
  },

  earLeft: {
    position: "absolute",
    top: "-16px",
    left: "25px",
    width: "30px",
    height: "30px",
    background: "#ff8fab",
    borderRadius: "10px 22px 10px 22px",
    transform: "rotate(28deg)"
  },

  earRight: {
    position: "absolute",
    top: "-12px",
    right: "22px",
    width: "25px",
    height: "25px",
    background: "#ff8fab",
    borderRadius: "10px 20px 10px 20px",
    transform: "rotate(45deg)"
  },

  eyeLeft: {
    position: "absolute",
    top: "28px",
    left: "76px",
    width: "7px",
    height: "7px",
    background: "#111827",
    borderRadius: "50%"
  },

  eyeRight: {
    position: "absolute",
    top: "28px",
    left: "98px",
    width: "7px",
    height: "7px",
    background: "#111827",
    borderRadius: "50%"
  },

  nose: {
    position: "absolute",
    right: "-8px",
    top: "36px",
    width: "36px",
    height: "26px",
    background: "#fb7185",
    borderRadius: "50%",
    color: "#7f1d1d",
    fontSize: "9px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  legLeft: {
    position: "absolute",
    bottom: "-7px",
    left: "35px",
    width: "20px",
    height: "16px",
    background: "#fb7185",
    borderRadius: "0 0 8px 8px"
  },

  legRight: {
    position: "absolute",
    bottom: "-7px",
    right: "34px",
    width: "20px",
    height: "16px",
    background: "#fb7185",
    borderRadius: "0 0 8px 8px"
  },

  logoText: {
    margin: 0,
    fontSize: "58px",
    lineHeight: "62px",
    fontWeight: "900",
    letterSpacing: "-2px"
  },

  logoSave: {
    color: "#071b4d"
  },

  logoMoney: {
    color: "#22c55e"
  },

  tagline: {
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    color: "#4b5563",
    fontSize: "20px"
  },

  taglineLine: {
  width: "60px",
  height: "3px",
  borderRadius: "10px",
  background: "linear-gradient(135deg,#7c3aed,#ec4899)"
},

  welcomeTitle: {
    margin: "25px 0 6px",
    fontSize: "42px",
    color: "#071b4d",
    fontWeight: "900"
  },

  welcomeSub: {
    margin: 0,
    fontSize: "18px",
    color: "#64748b",
    fontWeight: "600"
  },

  loginBox: {
    margin: "25px auto 0",
    maxWidth: "760px",
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 20px 50px rgba(15,23,42,0.10)",
    border: "1px solid #edf0f7",
    position: "relative",
    zIndex: 2
  },

  switchTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px"
  },

  switchBox: {
    display: "flex",
    background: "#f3f0fb",
    borderRadius: "16px",
    padding: "4px",
    border: "1px solid #ddd6fe"
  },

  switchBtn: {
    minWidth: "155px",
    height: "56px",
    border: "none",
    borderRadius: "14px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer",
    background: "transparent",
    color: "#64748b"
  },

  switchActive: {
    background: "linear-gradient(135deg,#5b21b6,#ec4899)",
    color: "white",
    boxShadow: "0 12px 28px rgba(124,58,237,0.25)"
  },

  changeBtn: {
    background: "transparent",
    border: "none",
    color: "#6d28d9",
    fontSize: "17px",
    fontWeight: "900",
    cursor: "pointer"
  },

  messageBox: {
    textAlign: "center",
    marginBottom: "14px",
    color: "#7c3aed",
    fontWeight: "900",
    background: "#f5f3ff",
    padding: "10px",
    borderRadius: "14px"
  },

  inputActive: {
    height: "76px",
    borderRadius: "18px",
    border: "1.8px solid #ec4899",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    marginTop: "18px",
    background: "white"
  },

  inputBox: {
    height: "76px",
    borderRadius: "18px",
    border: "1.5px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    marginTop: "18px",
    background: "white"
  },

  inputIcon: {
    width: "82px",
    height: "100%",
    background: "#f3f0fb",
    color: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    height: "100%",
    padding: "0 22px",
    fontSize: "19px",
    color: "#111827",
    background: "transparent"
  },

  sideIcon: {
    width: "70px",
    color: "#9ca3af",
    fontSize: "26px",
    textAlign: "center"
  },

  eyeBtn: {
    width: "70px",
    border: "none",
    background: "transparent",
    fontSize: "24px",
    cursor: "pointer"
  },

  sendOtp: {
    marginRight: "10px",
    border: "none",
    borderRadius: "13px",
    padding: "12px 14px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    color: "white",
    fontWeight: "900",
    cursor: "pointer"
  },

  optionsRow: {
    marginTop: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  remember: {
    display: "flex",
    gap: "12px",
    color: "#64748b",
    fontSize: "16px",
    alignItems: "center"
  },

  forgot: {
  border: "none",
  background: "transparent",
  color: "#6d28d9",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "pointer",
  position: "relative",
  zIndex: 50
},

  loginBtn: {
    marginTop: "30px",
    width: "100%",
    height: "78px",
    border: "none",
    borderRadius: "25px",
    background: "linear-gradient(135deg,#4f46e5,#7c3aed,#ec4899)",
    color: "white",
    fontSize: "24px",
    fontWeight: "900",
    position: "relative",
    cursor: "pointer",
    boxShadow: "0 15px 30px rgba(124,58,237,0.35)"
  },

  lockCircle: {
    position: "absolute",
    left: "22px",
    top: "14px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  arrowCircle: {
    position: "absolute",
    right: "22px",
    top: "14px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "white",
    color: "#ec4899",
    fontSize: "42px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    lineHeight: "42px"
  },

  orRow: {
    marginTop: "32px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: "800"
  },

  socialRow: {
    marginTop: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "22px"
  },

  googleBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    background: "white",
    color: "#ef4444",
    fontWeight: "900",
    fontSize: "20px"
  },

  facebookBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    background: "#2563eb",
    color: "white",
    fontWeight: "900",
    fontSize: "22px"
  },

  appleBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    background: "#111827",
    color: "white",
    fontWeight: "900",
    fontSize: "22px"
  },

  registerCard: {
    maxWidth: "760px",
    margin: "22px auto 0",
    background: "white",
    borderRadius: "24px",
    padding: "24px 30px",
    display: "flex",
    alignItems: "center",
    gap: "22px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
    border: "1px solid #edf0f7",
    position: "relative",
    zIndex: 2
  },

  registerIcon: {
    fontSize: "58px"
  },

  registerContent: {
    flex: 1
  },

  registerBtn: {
    border: "1.8px solid #d946ef",
    background: "white",
    color: "#7c3aed",
    padding: "15px 24px",
    borderRadius: "22px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer"
  },

  trustRow: {
    maxWidth: "760px",
    margin: "28px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "16px",
    position: "relative",
    zIndex: 2
  },

  trustItem: {
    textAlign: "center",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "700"
  },

  trustIcon: {
    fontSize: "30px",
    marginBottom: "6px"
  }
};