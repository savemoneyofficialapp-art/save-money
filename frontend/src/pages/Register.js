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
  const [showPass, setShowPass] = useState(false);
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
        headers: { "Content-Type": "application/json" },
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

      alert(data.msg || "Registration response");

      if (
        data.msg === "Register success" ||
        data.msg === "Registration successful" ||
        data.success
      ) {
        navigate("/login");
      }

    } catch (err) {
      setLoading(false);
      alert("Backend connection failed.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.logo}>₹</div>

        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.sub}>Join Save Money & start your journey</p>

        <input style={styles.input} placeholder="Full Name" value={name}
          onChange={(e) => setName(e.target.value)} />

        <input style={styles.input} placeholder="Mobile Number" value={mobile}
          onChange={(e) => setMobile(e.target.value)} />

        <input style={styles.input} placeholder="Email Address" value={email}
          onChange={(e) => setEmail(e.target.value)} />

        <div style={styles.passBox}>
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
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>

        <input style={styles.input} placeholder="Refer Code (Optional)" value={referCode}
          onChange={(e) => setReferCode(e.target.value)} />

        <button style={styles.registerBtn} onClick={register} disabled={loading}>
          {loading ? "Creating Account..." : "Register"}
        </button>

        <p style={styles.kycNote}>
          Aadhaar / PAN / Photo upload will be done from KYC page after login.
        </p>

        <p style={styles.legalText}>
          By creating an account, you agree to our
          <span style={styles.link} onClick={() => navigate("/legal/terms")}> Terms </span>
          and
          <span style={styles.link} onClick={() => navigate("/legal/privacy")}> Privacy Policy</span>
        </p>

        <p style={styles.loginText}>
          Already have account?
          <span style={styles.link} onClick={() => navigate("/login")}> Go for Login</span>
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    color: "white"
  },

  card: {
    width: "100%",
    maxWidth: "430px",
    background: "rgba(15,23,42,0.94)",
    borderRadius: "28px",
    padding: "26px",
    border: "1px solid rgba(34,197,94,0.35)",
    boxShadow: "0 0 40px rgba(34,197,94,0.25)",
    backdropFilter: "blur(14px)"
  },

  logo: {
    width: "72px",
    height: "72px",
    margin: "auto",
    borderRadius: "22px",
    background: "linear-gradient(135deg,#22c55e,#38bdf8)",
    color: "#020617",
    fontSize: "40px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  title: {
    textAlign: "center",
    color: "#22c55e",
    marginBottom: "5px"
  },

  sub: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px"
  },

  input: {
    width: "100%",
    padding: "14px",
    marginTop: "12px",
    border: "none",
    borderRadius: "16px",
    background: "#e2e8f0",
    color: "#020617",
    fontWeight: "bold",
    outline: "none"
  },

  passBox: {
    display: "flex",
    alignItems: "center",
    background: "#e2e8f0",
    borderRadius: "16px",
    marginTop: "12px"
  },

  passInput: {
    flex: 1,
    padding: "14px",
    border: "none",
    background: "transparent",
    outline: "none",
    color: "#020617",
    fontWeight: "bold"
  },

  eyeBtn: {
    padding: "12px",
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer"
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
    fontSize: "16px"
  },

  kycNote: {
    textAlign: "center",
    color: "#facc15",
    fontSize: "12px",
    marginTop: "12px"
  },

  legalText: {
    color: "#cbd5e1",
    fontSize: "12px",
    marginTop: "12px",
    textAlign: "center"
  },

  loginText: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: "16px"
  },

  link: {
    color: "#38bdf8",
    fontWeight: "900",
    cursor: "pointer"
  }
};