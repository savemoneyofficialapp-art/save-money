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
  const [showTerms, setShowTerms] = useState(false);

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

      alert(data.msg || "Registered");

      if (data.msg === "Registered Successfully" || data.success === true) {
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
          <InputBox color="#0ea5e9" icon="✉️" placeholder="Email ID" value={email} setValue={setEmail} />

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

          <InputBox color="#06b6d4" icon="💰" placeholder="USDT Wallet Address" value={walletAddress} setValue={setWalletAddress} />
          <InputBox color="#f59e0b" icon="🎁" placeholder="Refer Code Optional" value={referCode} setValue={setReferCode} />

          <label style={styles.checkRow}>
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
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
              opacity: loading ? 0.7 : 1
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
        </div>
      </div>

      <div style={styles.bottomFeatures}>

  <div style={styles.bottomItem}>
    <div style={{
      ...styles.bottomIcon,
      background: "linear-gradient(135deg,#22c55e,#86efac)"
    }}>
      🛡
    </div>

    <div>
      <div style={styles.bottomTitle}>100% Secure</div>
      <div style={styles.bottomText}>& Safe</div>
    </div>
  </div>

  <div style={styles.bottomItem}>
    <div style={{
      ...styles.bottomIcon,
      background: "linear-gradient(135deg,#9333ea,#c084fc)"
    }}>
      🔒
    </div>

    <div>
      <div style={styles.bottomTitle}>Your Data is</div>
      <div style={styles.bottomText}>Protected</div>
    </div>
  </div>

  <div style={styles.bottomItem}>
    <div style={{
      ...styles.bottomIcon,
      background: "linear-gradient(135deg,#2563eb,#60a5fa)"
    }}>
      🎧
    </div>

    <div>
      <div style={styles.bottomTitle}>24/7 Customer</div>
      <div style={styles.bottomText}>Support</div>
    </div>
  </div>

  <div style={styles.bottomItem}>
    <div style={{
      ...styles.bottomIcon,
      background: "linear-gradient(135deg,#f59e0b,#facc15)"
    }}>
      ⭐
    </div>

    <div>
      <div style={styles.bottomTitle}>Trusted by</div>
      <div style={styles.bottomText}>Thousands</div>
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
              onClick={() => setShowTerms(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
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

  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#fdf2f8,#e0f2fe,#ede9fe)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px"
  },

  card: {
    width: "100%",
    maxWidth: "1050px",
    minHeight: "92vh",
    background: "#ffffff",
    borderRadius: "45px",
    display: "flex",
    overflow: "hidden",
    boxShadow: "0 25px 70px rgba(0,0,0,0.15)"
  },

  /* LEFT PANEL */

  leftPanel: {
    width: "33%",
    background: "linear-gradient(180deg,#5b21b6,#2563eb)",
    padding: "35px 28px",
    position: "relative",
    overflow: "hidden",
    color: "white"
  },

  piggy: {
    width: "120px",
    marginBottom: "20px"
  },

  saveMoney: {
    fontSize: "72px",
    fontWeight: "900",
    lineHeight: "70px",
    margin: 0,
    color: "#ffffff"
  },

  saveYellow: {
    color: "#facc15"
  },

  leftSub: {
    marginTop: "18px",
    fontSize: "24px",
    lineHeight: "36px",
    color: "rgba(255,255,255,0.9)"
  },

  whyTitle: {
    marginTop: "55px",
    fontSize: "38px",
    fontWeight: "800",
    color: "#facc15"
  },

  leftFeature: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    marginTop: "32px"
  },

  leftIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px",
    color: "white"
  },

  leftFeatureTitle: {
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "5px"
  },

  leftFeatureText: {
    fontSize: "20px",
    lineHeight: "30px",
    color: "rgba(255,255,255,0.88)"
  },

  bottomTextLeft: {
    position: "absolute",
    bottom: "45px",
    left: "35px",
    fontSize: "34px",
    lineHeight: "52px",
    color: "#ffffff",
    fontStyle: "italic",
    fontWeight: "700"
  },

  /* RIGHT PANEL */

  rightPanel: {
    flex: 1,
    padding: "45px 42px",
    background: "#ffffff",
    position: "relative"
  },

  heading: {
    fontSize: "76px",
    fontWeight: "900",
    lineHeight: "82px",
    margin: 0,
    color: "#111827"
  },

  gradientText: {
    background: "linear-gradient(135deg,#ec4899,#2563eb)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },

  subtitle: {
    marginTop: "18px",
    fontSize: "23px",
    color: "#4b5563",
    lineHeight: "36px"
  },

  saveBlue: {
    color: "#2563eb",
    fontWeight: "800"
  },

  /* INPUTS */

  inputWrapper: {
    height: "72px",
    borderRadius: "25px",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    padding: "0 22px",
    marginTop: "22px",
    border: "2px solid #e5e7eb"
  },

  iconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: "24px",
    marginRight: "16px"
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "21px",
    color: "#111827",
    background: "transparent"
  },

  eye: {
    fontSize: "24px",
    color: "#6b7280",
    cursor: "pointer"
  },

  /* TERMS */

  termsRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "22px"
  },

  checkbox: {
    width: "22px",
    height: "22px"
  },

  termsText: {
    fontSize: "18px",
    color: "#6b7280"
  },

  termsLink: {
    color: "#4f46e5",
    fontWeight: "700",
    cursor: "pointer"
  },

  /* BUTTON */

  registerBtn: {
    width: "100%",
    height: "76px",
    border: "none",
    borderRadius: "24px",
    marginTop: "24px",
    background: "linear-gradient(135deg,#ec4899,#2563eb)",
    color: "white",
    fontSize: "34px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px 0 40px",
    boxShadow: "0 15px 30px rgba(99,102,241,.25)"
  },

  arrowCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "white",
    color: "#2563eb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "30px",
    fontWeight: "bold"
  },

  loginText: {
    marginTop: "18px",
    textAlign: "center",
    fontSize: "18px",
    color: "#6b7280"
  },

  loginLink: {
    color: "#2563eb",
    fontWeight: "800",
    cursor: "pointer"
  },

  /* WHY JOIN */

  whyJoinRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "35px",
    marginBottom: "20px"
  },

  line: {
    flex: 1,
    height: "2px",
    background: "#e5e7eb"
  },

  whyJoinText: {
    fontSize: "22px",
    color: "#6b7280",
    fontWeight: "700"
  },

  /* DISCLAIMER */

  disclaimer: {
    background: "#f0fdf4",
    border: "2px solid #bbf7d0",
    borderRadius: "28px",
    padding: "24px",
    display: "flex",
    gap: "18px",
    marginTop: "20px"
  },

  disclaimerIcon: {
    width: "70px",
    height: "70px",
    borderRadius: "20px",
    background: "#dcfce7",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "34px",
    color: "#16a34a"
  },

  disclaimerTitle: {
    fontSize: "34px",
    fontWeight: "800",
    color: "#16a34a",
    marginBottom: "10px"
  },

  disclaimerText: {
    fontSize: "19px",
    lineHeight: "32px",
    color: "#374151"
  },

  /* BOTTOM FEATURES */

  bottomFeatures: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "18px",
    marginTop: "28px",
    width: "100%"
  },

  bottomItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  bottomIcon: {
    width: "50px",
    height: "50px",
    minWidth: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "22px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.12)"
  },

  bottomTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#111827",
    lineHeight: "24px"
  },

  bottomText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#374151",
    lineHeight: "24px"
  }

};