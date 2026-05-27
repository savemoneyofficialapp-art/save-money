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
    const token = data.accessToken || data.token;

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("accessToken", token);
    }

    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
    if (data.email || data.user?.email) localStorage.setItem("email", data.email || data.user.email);
    if (data.name || data.user?.name) localStorage.setItem("name", data.name || data.user.name);
    if (data.role || data.user?.role) localStorage.setItem("role", data.role || data.user.role || "user");
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

    if (remember) {
      localStorage.setItem("rememberLogin", mode === "email" ? email : mobile);
      localStorage.setItem("rememberMode", mode);
    }

    setMessage("Login Successful");

    setTimeout(() => {
      const role = data.role || data.user?.role || "user";
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/home", { replace: true });
    }, 700);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setMessage(data.msg || "Login failed");
        return;
      }

      saveLogin(data);
    } catch (err) {
      console.log("EMAIL LOGIN ERROR:", err);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim() })
      });

      const data = await res.json();
      setMessage(data.msg || "OTP sent");
    } catch (err) {
      console.log("OTP SEND ERROR:", err);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim(), otp: otp.trim() })
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
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
    if (mode === "email") loginEmail();
    else loginMobile();
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgBlob1}></div>
      <div style={styles.bgBlob2}></div>
      <div style={styles.bgBlob3}></div>

      <main style={styles.shell}>
        <div style={styles.floatChart}>▂▅█</div>
        <div style={styles.floatShield}>✓</div>
        <div style={styles.dotBoxLeft}>•••<br />•••<br />•••</div>
        <div style={styles.dotBoxRight}>•••<br />•••<br />•••</div>

        <section style={styles.brandTop}>
          <div style={styles.piggyCircle}>
            <div style={styles.coin}>₹</div>
            <div style={styles.piggy}>
              <span style={styles.pigEar1}></span>
              <span style={styles.pigEar2}></span>
              <span style={styles.pigEye1}></span>
              <span style={styles.pigEye2}></span>
              <span style={styles.pigNose}>••</span>
              <span style={styles.pigLeg1}></span>
              <span style={styles.pigLeg2}></span>
            </div>
          </div>

          <h1 style={styles.logo}>
            <span>save</span> <b>money</b>
          </h1>

          <div style={styles.tagLine}>
            <span></span>
            Save Today, Secure Tomorrow
            <span></span>
          </div>

          <h2 style={styles.welcome}>Welcome Back!</h2>
          <p style={styles.subTitle}>Login to continue your financial journey</p>
        </section>

        <section style={styles.loginCard}>
          <div style={styles.switchRow}>
            <div style={styles.switchBox}>
              <button
                style={{
                  ...styles.switchBtn,
                  ...(mode === "email" ? styles.switchActive : styles.switchInactive)
                }}
                onClick={() => {
                  setMode("email");
                  setMessage("");
                }}
                type="button"
              >
                ✉ Email
              </button>

              <button
                style={{
                  ...styles.switchBtn,
                  ...(mode === "mobile" ? styles.switchActive : styles.switchInactive)
                }}
                onClick={() => {
                  setMode("mobile");
                  setMessage("");
                }}
                type="button"
              >
                📱 Mobile
              </button>
            </div>

            <button
              style={styles.changeBtn}
              type="button"
              onClick={() => setMode(mode === "email" ? "mobile" : "email")}
            >
              ⇄ Change
            </button>
          </div>

          {message && <div style={styles.message}>{message}</div>}

          {mode === "email" ? (
            <>
              <div style={styles.inputBoxActive}>
                <div style={styles.inputIcon}>✉</div>
                <input
                  style={styles.input}
                  placeholder="Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div style={styles.rightIcon}>♙</div>
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
                <button style={styles.eyeBtn} type="button" onClick={() => setShowPass(!showPass)}>
                  👁
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={styles.inputBoxActive}>
                <div style={styles.inputIcon}>📱</div>
                <input
                  style={styles.input}
                  placeholder="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
                <button style={styles.sendOtpBtn} type="button" onClick={sendOtp}>
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
                <div style={styles.rightIcon}>✓</div>
              </div>
            </>
          )}

          <div style={styles.optionRow}>
            <label style={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember Me
            </label>

            <button style={styles.forgot} type="button" onClick={() => navigate("/forgot-password")}>
              Forgot Password?
            </button>
          </div>

          <button style={styles.loginBtn} onClick={handleLogin} disabled={loading}>
            <span style={styles.lockCircle}>🔒</span>
            {loading ? "Please Wait..." : "Login Now"}
            <span style={styles.arrowCircle}>›</span>
          </button>

          <div style={styles.orRow}>
            <span></span>
            OR
            <span></span>
          </div>

          <div style={styles.socialRow}>
            <p>Login with</p>
            <button type="button">G</button>
            <button type="button">f</button>
            <button type="button"></button>
          </div>
        </section>

        <section style={styles.registerCard}>
          <div style={styles.clipIcon}>🪪</div>

          <div style={styles.registerText}>
            <h3>Don’t have an account?</h3>
            <p>Create a new account and start saving with us.</p>
          </div>

          <button style={styles.registerBtn} onClick={() => navigate("/register")}>
            👤+ Register Now
          </button>
        </section>

        <section style={styles.trustFooter}>
          <div><span>🛡️</span><p>100% Secure<br />& Safe</p></div>
          <div><span>🔒</span><p>Your Data is<br />Protected</p></div>
          <div><span>🎧</span><p>24/7 Customer<br />Support</p></div>
          <div><span>⭐</span><p>Trusted by<br />Thousands</p></div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#eaf4ff 0%,#f6f2ff 40%,#ffeef9 100%)",
    padding: "34px 16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    overflow: "hidden",
    position: "relative"
  },

  bgBlob1: {
    position: "fixed",
    left: "-70px",
    bottom: "120px",
    width: "170px",
    height: "220px",
    background: "rgba(216,180,254,.65)",
    borderRadius: "80px",
    transform: "rotate(35deg)"
  },

  bgBlob2: {
    position: "fixed",
    right: "-70px",
    top: "45%",
    width: "170px",
    height: "90px",
    background: "rgba(244,114,182,.55)",
    borderRadius: "80px"
  },

  bgBlob3: {
    position: "fixed",
    left: "20%",
    top: "-90px",
    width: "260px",
    height: "260px",
    border: "28px solid rgba(196,181,253,.35)",
    borderRadius: "50%"
  },

  shell: {
    width: "100%",
    maxWidth: "920px",
    background: "rgba(255,255,255,.86)",
    borderRadius: "46px",
    padding: "32px 64px 38px",
    boxShadow: "0 35px 90px rgba(99,102,241,.22)",
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.9)"
  },

  floatChart: {
    position: "absolute",
    top: "115px",
    left: "82px",
    width: "70px",
    height: "70px",
    background: "linear-gradient(135deg,#4f46e5,#d946ef)",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
    fontSize: "26px",
    boxShadow: "0 12px 26px rgba(79,70,229,.35)"
  },

  floatShield: {
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
    boxShadow: "0 14px 28px rgba(34,197,94,.35)"
  },

  dotBoxLeft: {
    position: "absolute",
    left: "34px",
    top: "275px",
    color: "#c4b5fd",
    lineHeight: "14px",
    letterSpacing: "8px"
  },

  dotBoxRight: {
    position: "absolute",
    right: "28px",
    bottom: "255px",
    color: "#c4b5fd",
    lineHeight: "14px",
    letterSpacing: "8px"
  },

  brandTop: {
    textAlign: "center",
    position: "relative",
    zIndex: 2
  },

  piggyCircle: {
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
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f97316)",
    color: "#b45309",
    fontWeight: "900",
    fontSize: "28px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "4px solid #ffd166",
    zIndex: 4
  },

  piggy: {
    width: "135px",
    height: "88px",
    background: "linear-gradient(135deg,#ffc2d1,#ff8fab)",
    borderRadius: "58px 62px 46px 46px",
    position: "relative",
    marginBottom: "18px",
    boxShadow: "inset -10px -8px 0 rgba(244,63,94,.14)"
  },

  pigEar1: {
    position: "absolute",
    top: "-16px",
    left: "25px",
    width: "30px",
    height: "30px",
    background: "#ff8fab",
    borderRadius: "10px 22px 10px 22px",
    transform: "rotate(28deg)"
  },

  pigEar2: {
    position: "absolute",
    top: "-12px",
    right: "22px",
    width: "25px",
    height: "25px",
    background: "#ff8fab",
    borderRadius: "10px 20px 10px 20px",
    transform: "rotate(45deg)"
  },

  pigEye1: {
    position: "absolute",
    top: "28px",
    left: "76px",
    width: "7px",
    height: "7px",
    background: "#111827",
    borderRadius: "50%"
  },

  pigEye2: {
    position: "absolute",
    top: "28px",
    left: "98px",
    width: "7px",
    height: "7px",
    background: "#111827",
    borderRadius: "50%"
  },

  pigNose: {
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

  pigLeg1: {
    position: "absolute",
    bottom: "-7px",
    left: "35px",
    width: "20px",
    height: "16px",
    background: "#fb7185",
    borderRadius: "0 0 8px 8px"
  },

  pigLeg2: {
    position: "absolute",
    bottom: "-7px",
    right: "34px",
    width: "20px",
    height: "16px",
    background: "#fb7185",
    borderRadius: "0 0 8px 8px"
  },

  logo: {
    margin: 0,
    fontSize: "58px",
    lineHeight: "62px",
    fontWeight: "900",
    letterSpacing: "-2px"
  },

  save: { color: "#071b4d" },
  money: { color: "#22c55e" },

  tagLine: {
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    color: "#4b5563",
    fontSize: "20px"
  },

  welcome: {
    margin: "25px 0 6px",
    fontSize: "42px",
    color: "#071b4d",
    fontWeight: "900"
  },

  subTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#64748b",
    fontWeight: "600"
  },

  loginCard: {
    margin: "25px auto 0",
    maxWidth: "760px",
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 20px 50px rgba(15,23,42,.10)",
    border: "1px solid #edf0f7"
  },

  switchRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px"
  },

  switchBox: {
    display: "flex",
    background: "#f3f0fb",
    borderRadius: "16px",
    padding: "1px",
    border: "1px solid #ddd6fe"
  },

  switchBtn: {
    minWidth: "165px",
    height: "60px",
    border: "none",
    borderRadius: "15px",
    fontSize: "20px",
    fontWeight: "800",
    cursor: "pointer"
  },

  switchActive: {
    boxShadow: "0 12px 28px rgba(124,58,237,.25)"
  },

  switchInactive: {},

  changeBtn: {
    background: "transparent",
    border: "none",
    color: "#6d28d9",
    fontSize: "19px",
    fontWeight: "900",
    cursor: "pointer"
  },

  message: {
    textAlign: "center",
    marginBottom: "14px",
    color: "#7c3aed",
    fontWeight: "900"
  },

  inputBoxActive: {
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
    width: "85px",
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
    padding: "0 24px",
    fontSize: "20px",
    color: "#111827",
    background: "transparent"
  },

  rightIcon: {
    width: "70px",
    color: "#9ca3af",
    fontSize: "28px",
    textAlign: "center"
  },

  eyeBtn: {
    width: "70px",
    border: "none",
    background: "transparent",
    fontSize: "24px",
    cursor: "pointer"
  },

  sendOtpBtn: {
    marginRight: "10px",
    border: "none",
    borderRadius: "13px",
    padding: "12px 14px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    color: "white",
    fontWeight: "900"
  },

  optionRow: {
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
    cursor: "pointer"
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
    boxShadow: "0 15px 30px rgba(124,58,237,.35)"
  },

  lockCircle: {
    position: "absolute",
    left: "22px",
    top: "14px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "rgba(255,255,255,.18)",
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
    marginTop: "35px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: "800"
  },

  socialRow: {
    marginTop: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "26px"
  },

  loginWith: {},

  registerCard: {
    maxWidth: "760px",
    margin: "22px auto 0",
    background: "white",
    borderRadius: "24px",
    padding: "25px 34px",
    display: "flex",
    alignItems: "center",
    gap: "24px",
    boxShadow: "0 18px 45px rgba(15,23,42,.08)",
    border: "1px solid #edf0f7"
  },

  clipIcon: {
    fontSize: "70px"
  },

  registerText: {
    flex: 1
  },

  registerTitle: {
    margin: 0,
    fontSize: "23px",
    color: "#071b4d"
  },

  registerSub: {
    margin: "7px 0 0",
    color: "#64748b"
  },

  registerBtn: {
    border: "1.8px solid #d946ef",
    background: "white",
    color: "#7c3aed",
    padding: "16px 28px",
    borderRadius: "22px",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer"
  },

  trustFooter: {
    maxWidth: "760px",
    margin: "30px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "18px"
  }
};