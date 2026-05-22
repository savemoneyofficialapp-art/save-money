import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://save-money-yyv1.onrender.com";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referCode, setReferCode] = useState("");

  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!name || !mobile || !email || !password) {
      alert("Please fill all required fields");
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
          referCode
        })
      });

      const data = await res.json();

      setLoading(false);

      alert(data.msg || "Registration response received");

      if (
        data.msg === "Register success" ||
        data.msg === "Registration successful" ||
        data.success
      ) {
        navigate("/login");
      }

    } catch (err) {
      setLoading(false);
      console.log("REGISTER ERROR:", err);
      alert("Server Error: Backend not connected or API failed");
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <div style={styles.logoBox}>
          <div style={styles.logo}>₹</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.sub}>Join Save Money & start your journey</p>
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
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Refer Code (Optional)"
          value={referCode}
          onChange={(e) => setReferCode(e.target.value)}
        />

        <button
          style={styles.registerBtn}
          onClick={register}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Register"}
        </button>

        <p style={styles.legalText}>
          By creating an account, you agree to our
          <span
            style={styles.legalLink}
            onClick={() => navigate("/legal/terms")}
          >
            {" "}Terms
          </span>
          {" "}and
          <span
            style={styles.legalLink}
            onClick={() => navigate("/legal/privacy")}
          >
            {" "}Privacy Policy
          </span>
        </p>

        <p style={styles.loginText}>
          Already have account?
          <span
            style={styles.loginLink}
            onClick={() => navigate("/login")}
          >
            {" "}Go for Login
          </span>
        </p>

      </div>

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(rgba(2,6,23,0.88), rgba(15,23,42,0.94)), url('/network-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(15,23,42,0.92)",
    borderRadius: "26px",
    padding: "25px",
    border: "1px solid rgba(34,197,94,0.35)",
    boxShadow: "0 0 35px rgba(34,197,94,0.22)",
    backdropFilter: "blur(14px)"
  },

  logoBox: {
    textAlign: "center",
    marginBottom: "20px"
  },

  logo: {
    width: "70px",
    height: "70px",
    margin: "auto",
    borderRadius: "22px",
    background: "linear-gradient(135deg,#22c55e,#3b82f6)",
    color: "#020617",
    fontSize: "38px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 25px rgba(34,197,94,0.45)"
  },

  title: {
    color: "#22c55e",
    marginBottom: "5px"
  },

  sub: {
    color: "#94a3b8",
    fontSize: "13px"
  },

  input: {
    width: "100%",
    padding: "14px",
    marginTop: "12px",
    border: "1px solid #334155",
    borderRadius: "15px",
    outline: "none",
    background: "#e2e8f0",
    color: "#020617",
    fontWeight: "bold"
  },

  registerBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "18px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#020617",
    fontWeight: "900",
    fontSize: "16px",
    boxShadow: "0 12px 25px rgba(34,197,94,0.35)"
  },

  legalText: {
    color: "#cbd5e1",
    fontSize: "12px",
    marginTop: "14px",
    textAlign: "center",
    lineHeight: "20px"
  },

  legalLink: {
    color: "#38bdf8",
    cursor: "pointer",
    fontWeight: "bold"
  },

  loginText: {
    textAlign: "center",
    marginTop: "18px",
    color: "#94a3b8"
  },

  loginLink: {
    color: "#38bdf8",
    fontWeight: "900",
    cursor: "pointer"
  }
};