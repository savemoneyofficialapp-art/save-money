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
        headers: {
          "Content-Type": "application/json"
        },
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

      alert(data.msg);

      if (
        data.msg === "Registered Successfully" ||
        data.success === true
      ) {
        navigate("/login");
      }

    } catch (err) {
      console.log(err);
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (

    <div style={styles.container}>

      <div style={styles.mainCard}>

        {/* LEFT SIDE */}

        <div style={styles.leftPanel}>

          <div style={styles.logoTop}>

            <div style={styles.piggyBox}>
              🐷
            </div>

            <h1 style={styles.saveMoney}>
              save
              <br />
              money
            </h1>

            <p style={styles.leftSub}>
              Save Today, Secure Tomorrow
            </p>

          </div>

          <div style={styles.whyBox}>

            <h2 style={styles.whyTitle}>
              Why Join Us?
            </h2>

            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>🛡</div>

              <div>
                <h4 style={styles.featureHead}>
                  100% Secure
                </h4>

                <p style={styles.featureText}>
                  Your data is safe with us
                </p>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIconGreen}>💼</div>

              <div>
                <h4 style={styles.featureHead}>
                  Save More
                </h4>

                <p style={styles.featureText}>
                  Smart saving for a better future
                </p>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIconOrange}>📈</div>

              <div>
                <h4 style={styles.featureHead}>
                  Grow Faster
                </h4>

                <p style={styles.featureText}>
                  Achieve your financial goals
                </p>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIconPink}>🎁</div>

              <div>
                <h4 style={styles.featureHead}>
                  Exciting Rewards
                </h4>

                <p style={styles.featureText}>
                  Earn points and rewards
                </p>
              </div>
            </div>

          </div>

          <div style={styles.bottomText}>
            Small Steps
            <br />
            Big Savings!
          </div>

        </div>

        {/* RIGHT SIDE */}

        <div style={styles.rightPanel}>

          <div style={styles.topArea}>

            <h2 style={styles.createText}>
              Create Your
            </h2>

            <h1 style={styles.accountText}>
              Account
            </h1>

            <p style={styles.joinText}>
              Join <span style={styles.joinSave}>Save Money</span> and
              start your journey to financial freedom.
            </p>

          </div>

          {/* NAME */}

          <div style={styles.inputBoxPink}>

            <div style={styles.iconPink}>
              👤
            </div>

            <input
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

          </div>

          {/* MOBILE */}

          <div style={styles.inputBoxPurple}>

            <div style={styles.iconPurple}>
              📱
            </div>

            <input
              style={styles.input}
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />

          </div>

          {/* EMAIL */}

          <div style={styles.inputBoxBlue}>

            <div style={styles.iconBlue}>
              ✉
            </div>

            <input
              style={styles.input}
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

          </div>

          {/* PASSWORD */}

          <div style={styles.inputBoxGreen}>

            <div style={styles.iconGreen}>
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
              style={styles.eyeBtn}
              onClick={() => setShowPass(!showPass)}
            >
              👁
            </button>

          </div>

          {/* WALLET */}

          <div style={styles.inputBoxWallet}>

            <div style={styles.iconWallet}>
              💰
            </div>

            <input
              style={styles.input}
              placeholder="USDT Wallet Address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />

          </div>

          {/* REFER */}

          <div style={styles.inputBoxOrange}>

            <div style={styles.iconOrange}>
              🎁
            </div>

            <input
              style={styles.input}
              placeholder="Refer Code (Optional)"
              value={referCode}
              onChange={(e) => setReferCode(e.target.value)}
            />

          </div>

          {/* TERMS */}

          <label style={styles.checkRow}>

            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              style={styles.check}
            />

            <span style={styles.termsText}>
              I agree to the Terms & Conditions
            </span>

          </label>

          {/* BUTTON */}

          <button
            style={styles.registerBtn}
            onClick={register}
            disabled={loading}
          >

            {loading
              ? "Creating Account..."
              : "Register Now"
            }

            <div style={styles.arrowCircle}>
              ➜
            </div>

          </button>

          {/* LOGIN */}

          <div style={styles.loginArea}>

            Already have an account?

            <span
              style={styles.loginLink}
              onClick={() => navigate("/login")}
            >
              Login
            </span>

          </div>

          {/* DISCLAIMER */}

          <div style={styles.disclaimerBox}>

            <div style={styles.disclaimerIcon}>
              🛡
            </div>

            <div>

              <h3 style={styles.disclaimerTitle}>
                Disclaimer
              </h3>

              <p style={styles.disclaimerText}>
                The information provided is for general
                purposes only. Please read all terms
                carefully before using our services.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

const styles = {

  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#f8d7ff,#e9f3ff,#fff6e0)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "25px"
  },

  mainCard: {
    width: "100%",
    maxWidth: "1180px",
    background: "white",
    borderRadius: "50px",
    overflow: "hidden",
    display: "flex",
    boxShadow: "0 20px 60px rgba(0,0,0,0.18)"
  },

  leftPanel: {
    width: "34%",
    background:
      "linear-gradient(180deg,#7c3aed,#4f46e5,#5b21b6)",
    padding: "40px 30px",
    color: "white",
    position: "relative"
  },

  logoTop: {
    textAlign: "left"
  },

  piggyBox: {
    width: "120px",
    height: "120px",
    borderRadius: "35px",
    background:
      "linear-gradient(135deg,#ff9bd2,#ff6ec7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "65px",
    marginBottom: "20px"
  },

  saveMoney: {
    fontSize: "74px",
    lineHeight: "72px",
    margin: 0,
    fontWeight: "900",
    color: "#ffd43b"
  },

  leftSub: {
    fontSize: "22px",
    marginTop: "20px",
    color: "#ffffff"
  },

  whyBox: {
    marginTop: "60px"
  },

  whyTitle: {
    color: "#ffd43b",
    marginBottom: "28px",
    fontSize: "38px"
  },

  featureItem: {
    display: "flex",
    gap: "18px",
    marginBottom: "24px",
    alignItems: "center"
  },

  featureIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#38bdf8,#2563eb)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px"
  },

  featureIconGreen: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px"
  },

  featureIconOrange: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#fb923c,#f97316)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px"
  },

  featureIconPink: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#ff4ecd,#ff0080)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px"
  },

  featureHead: {
    margin: 0,
    fontSize: "26px"
  },

  featureText: {
    margin: "6px 0 0",
    color: "#f1f5f9",
    fontSize: "18px"
  },

  bottomText: {
    position: "absolute",
    bottom: "40px",
    left: "40px",
    fontSize: "40px",
    fontWeight: "bold",
    color: "#e9d5ff",
    lineHeight: "52px"
  },

  rightPanel: {
    flex: 1,
    padding: "45px"
  },

  topArea: {
    textAlign: "center",
    marginBottom: "28px"
  },

  createText: {
    margin: 0,
    fontSize: "52px",
    color: "#0f172a"
  },

  accountText: {
    margin: 0,
    fontSize: "88px",
    lineHeight: "95px",
    background:
      "linear-gradient(135deg,#ff00aa,#7c3aed,#2563eb)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "900"
  },

  joinText: {
    marginTop: "14px",
    fontSize: "24px",
    color: "#475569",
    lineHeight: "40px"
  },

  joinSave: {
    color: "#7c3aed",
    fontWeight: "bold"
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "24px",
    color: "#0f172a"
  },

  inputBoxPink: {
    height: "88px",
    borderRadius: "30px",
    border: "2px solid #ff7ac8",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    marginTop: "18px",
    gap: "18px"
  },

  inputBoxPurple: {
    height: "88px",
    borderRadius: "30px",
    border: "2px solid #a855f7",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    marginTop: "18px",
    gap: "18px"
  },

  inputBoxBlue: {
    height: "88px",
    borderRadius: "30px",
    border: "2px solid #3b82f6",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    marginTop: "18px",
    gap: "18px"
  },

  inputBoxGreen: {
    height: "88px",
    borderRadius: "30px",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    marginTop: "18px",
    gap: "18px"
  },

  inputBoxWallet: {
    height: "88px",
    borderRadius: "30px",
    border: "2px solid #06b6d4",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    marginTop: "18px",
    gap: "18px"
  },

  inputBoxOrange: {
    height: "88px",
    borderRadius: "30px",
    border: "2px solid #f59e0b",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    marginTop: "18px",
    gap: "18px"
  },

  iconPink: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#ff4ecd,#c026d3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px"
  },

  iconPurple: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#9333ea,#7c3aed)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px"
  },

  iconBlue: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#3b82f6,#2563eb)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px"
  },

  iconGreen: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px"
  },

  iconWallet: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#06b6d4,#0284c7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px"
  },

  iconOrange: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#f59e0b,#f97316)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px"
  },

  eyeBtn: {
    border: "none",
    background: "transparent",
    fontSize: "28px",
    cursor: "pointer"
  },

  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginTop: "26px"
  },

  check: {
    width: "24px",
    height: "24px"
  },

  termsText: {
    fontSize: "22px",
    color: "#334155"
  },

  registerBtn: {
    width: "100%",
    height: "90px",
    border: "none",
    borderRadius: "30px",
    marginTop: "28px",
    background:
      "linear-gradient(135deg,#ff2ea6,#7c3aed,#4338ca)",
    color: "white",
    fontSize: "36px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    cursor: "pointer",
    position: "relative"
  },

  arrowCircle: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "white",
    color: "#4338ca",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px",
    position: "absolute",
    right: "20px"
  },

  loginArea: {
    marginTop: "25px",
    textAlign: "center",
    fontSize: "22px",
    color: "#475569"
  },

  loginLink: {
    color: "#7c3aed",
    fontWeight: "bold",
    marginLeft: "10px",
    cursor: "pointer"
  },

  disclaimerBox: {
    marginTop: "40px",
    background: "#f0fdf4",
    borderRadius: "30px",
    padding: "25px",
    display: "flex",
    gap: "20px",
    alignItems: "flex-start"
  },

  disclaimerIcon: {
    width: "75px",
    height: "75px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "36px"
  },

  disclaimerTitle: {
    margin: 0,
    color: "#16a34a",
    fontSize: "34px"
  },

  disclaimerText: {
    marginTop: "10px",
    color: "#334155",
    lineHeight: "38px",
    fontSize: "20px"
  }

};