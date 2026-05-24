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

    console.log("API:", API);
    console.log("Register clicked");

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

    const text = await res.text();
    console.log("REGISTER STATUS:", res.status);
    console.log("REGISTER RESPONSE:", text);

    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      alert("Backend returned invalid response: " + text);
      return;
    }

    alert(data.msg);

    if (data.msg === "Registered Successfully" || data.success === true) {
      navigate("/login");
    }

  } catch (err) {
    console.log("REGISTER FETCH ERROR:", err);
    alert("Fetch failed: " + err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.logoBox}>
          <div style={styles.logo}>₹</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.slogan}>Join Save Money & start your journey</p>
        </div>

        <input
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Email ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div style={styles.passwordBox}>
          <input
            style={styles.passInput}
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            style={styles.eyeBtn}
            onClick={() => setShowPass(!showPass)}
            type="button"
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>

        <input
          style={styles.input}
          placeholder="USDT Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Refer Code Optional"
          value={referCode}
          onChange={(e) => setReferCode(e.target.value)}
        />

        <label style={styles.checkRow}>
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          <span>I accept the Terms & Conditions</span>
        </label>

        <button
          style={{
            ...styles.btn,
            opacity: loading ? 0.7 : 1
          }}
          onClick={register}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Register"}
        </button>

        <p style={styles.loginText}>
          Already have account?{" "}
          <span style={styles.link} onClick={() => navigate("/login")}>
            Go for Login
          </span>
        </p>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top,#14532d,#020617 45%,#020617)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px",
    color: "white"
  },

  card: {
    width: "100%",
    maxWidth: "410px",
    background: "rgba(15,23,42,0.96)",
    padding: "26px",
    borderRadius: "28px",
    boxShadow: "0 0 40px rgba(34,197,94,0.28)",
    border: "1px solid rgba(34,197,94,0.35)"
  },

  logoBox: {
    textAlign: "center",
    marginBottom: "18px"
  },

  logo: {
    width: "65px",
    height: "65px",
    margin: "0 auto 12px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#22c55e,#3b82f6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#020617",
    fontSize: "34px",
    fontWeight: "bold"
  },

  title: {
    color: "#22c55e",
    fontSize: "31px",
    margin: 0
  },

  slogan: {
    color: "#38bdf8",
    marginTop: "8px",
    fontWeight: "bold"
  },

  input: {
    width: "100%",
    padding: "15px",
    marginTop: "12px",
    borderRadius: "15px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
    outline: "none"
  },

  passwordBox: {
    display: "flex",
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: "15px",
    marginTop: "12px",
    overflow: "hidden"
  },

  passInput: {
    flex: 1,
    padding: "15px",
    border: "none",
    background: "transparent",
    color: "white",
    outline: "none"
  },

  eyeBtn: {
    padding: "0 15px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold"
  },

  checkRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginTop: "15px",
    color: "#cbd5e1",
    fontSize: "13px"
  },

  btn: {
    width: "100%",
    padding: "15px",
    marginTop: "18px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#020617",
    fontWeight: "bold",
    fontSize: "16px"
  },

  loginText: {
    textAlign: "center",
    marginTop: "18px",
    color: "#cbd5e1"
  },

  link: {
    color: "#38bdf8",
    fontWeight: "bold",
    cursor: "pointer"
  }
};