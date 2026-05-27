import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [referCode, setReferCode] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!name || !mobile || !email || !password || !walletAddress) {
      alert("Please fill all required fields");
      return;
    }

    if (!terms) {
      alert("Please accept Terms & Conditions");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim().toLowerCase(),
          password,
          walletAddress: walletAddress.trim(),
          usdtWallet: walletAddress.trim(),
          referCode: referCode.trim(),
          termsAccepted: true
        })
      });

      const data = await res.json();
      alert(data.msg || "Registered");

      if (data.msg === "Registered Successfully" || data.success === true) {
        navigate("/login");
      }
    } catch (err) {
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.leftPanel}>
          <div style={styles.piggy}>🐷</div>

          <h1 style={styles.brand}>
            save<br />
            <span>money</span>
          </h1>

          <p style={styles.brandSub}>
            Save Today, Secure Tomorrow
          </p>

          <h2 style={styles.why}>Why Join Us?</h2>

          <Benefit icon="🛡️" title="100% Secure" text="Your data is safe with us" />
          <Benefit icon="👛" title="Save More" text="Smart saving for a better future" />
          <Benefit icon="📈" title="Grow Faster" text="Achieve your financial goals with us" />
          <Benefit icon="🎁" title="Exciting Rewards" text="Earn points and get amazing rewards" />

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
          <InputBox color="#0ea5e9" icon="✉️" placeholder="Email ID" value={email} setValue={setEmail} />

          <div style={{ ...styles.inputWrap, borderColor: "#10b981" }}>
            <div style={{ ...styles.iconBox, background: "linear-gradient(135deg,#10b981,#22c55e)" }}>🔒</div>
            <input
              style={styles.input}
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button style={styles.eye} type="button" onClick={() => setShowPass(!showPass)}>
              👁
            </button>
          </div>

          <InputBox color="#06b6d4" icon="💰" placeholder="USDT Wallet Address" value={walletAddress} setValue={setWalletAddress} />
          <InputBox color="#f59e0b" icon="🎁" placeholder="Refer Code (Optional)" value={referCode} setValue={setReferCode} />

          <label style={styles.checkRow}>
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              style={styles.checkbox}
            />
            <span>
              I agree to the <b style={{ color: "#7c3aed" }}>Terms & Conditions</b>
            </span>
          </label>

          <button style={styles.registerBtn} onClick={register} disabled={loading}>
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
              <h3>Disclaimer</h3>
              <p>
                The information provided is for general purposes only. Please read all
                the terms carefully before investing or using our services.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

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

  piggy: {
    width: "130px",
    height: "130px",
    borderRadius: "38px",
    background: "linear-gradient(135deg,#ffb3c7,#ff6aa2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "72px",
    marginBottom: "28px"
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
    marginTop: "80px",
    fontSize: "24px"
  },

  benefit: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginTop: "20px"
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
    bottom: "30px",
    left: "35px",
    fontSize: "26px",
    color: "#efe7ff",
    fontStyle: "italic",
    lineHeight: "36px"
  },

  rightPanel: {
    flex: 1,
    padding: "55px 42px"
  },

  create: {
    textAlign: "center",
    fontSize: "34px",
    color: "#0f172a",
    margin: 0
  },

  account: {
    textAlign: "center",
    fontSize: "72px",
    margin: "-5px 0 10px",
    background: "linear-gradient(135deg,#ff2ebd,#8b2cff,#118cff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "900",
    fontFamily: "cursive"
  },

  join: {
    textAlign: "center",
    fontSize: "17px",
    color: "#475569",
    marginBottom: "30px"
  },

  inputWrap: {
    height: "72px",
    border: "1.8px solid",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    gap: "18px",
    marginTop: "16px"
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

  eye: {
    border: "none",
    background: "transparent",
    fontSize: "22px"
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
    boxShadow: "0 14px 25px rgba(124,58,237,.35)"
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
    marginTop: "28px",
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
    fontSize: "28px"
  }
};