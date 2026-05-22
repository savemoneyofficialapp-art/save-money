import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://save-money-yyv1.onrender.com";

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
          name,
          mobile,
          email,
          password,
          walletAddress,
          referCode,
          termsAccepted: true
        })
      });

      const data = await res.json();
      alert(data.msg);

      if (data.msg === "Registered Successfully") {
        navigate("/login");
      }

    } catch (err) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.slogan}>
          Join Save Money & start your journey
        </p>

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
          placeholder="Refer Code (Optional)"
          value={referCode}
          onChange={(e) => setReferCode(e.target.value)}
        />

        <label style={styles.checkRow}>
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />

          <span>
            I accept the Terms & Conditions
          </span>
        </label>

        <button style={styles.btn} onClick={register}>
          {loading ? "Creating Account..." : "Register"}
        </button>

        <p style={styles.loginText}>
          Already have account?{" "}
          <span
            style={styles.link}
            onClick={() => navigate("/login")}
          >
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
    background: "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px",
    color: "white"
  },

  card: {
    width: "100%",
    maxWidth: "390px",
    background: "rgba(30,41,59,0.95)",
    padding: "26px",
    borderRadius: "26px",
    boxShadow: "0 0 35px rgba(34,197,94,0.20)",
    border: "1px solid #334155"
  },

  title: {
    textAlign: "center",
    color: "#22c55e",
    fontSize: "32px",
    margin: 0
  },

  slogan: {
    textAlign: "center",
    color: "#38bdf8",
    marginTop: "8px",
    marginBottom: "20px",
    fontWeight: "bold"
  },

  input: {
    width: "100%",
    padding: "14px",
    marginTop: "12px",
    borderRadius: "14px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
    outline: "none"
  },

  passwordBox: {
    display: "flex",
    alignItems: "center",
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: "14px",
    marginTop: "12px",
    overflow: "hidden"
  },

  passInput: {
    flex: 1,
    padding: "14px",
    border: "none",
    background: "transparent",
    color: "white",
    outline: "none"
  },

  eyeBtn: {
    padding: "14px",
    border: "none",
    background: "#3b82f6",
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