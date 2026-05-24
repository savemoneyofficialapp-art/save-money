import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";




export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState("");
  const [loading, setLoading] = useState(false);

const login = async () => {
  if (!email || !password) {
    setPopup("Please enter email and password");
    return;
  }

  try {
    setLoading(true);
    setPopup("");

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

    const text = await res.text();
    console.log("LOGIN STATUS:", res.status);
    console.log("LOGIN RESPONSE:", text);

    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      setPopup("Invalid backend response");
      return;
    }

    if (!res.ok) {
      setPopup(data.msg || "Login failed");
      return;
    }

    if (data.success === true || data.msg === "Login Successful") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("name", data.name || "");
      localStorage.setItem("referCode",data.referCode ||"");
      localStorage.setItem("role", data.role || "user");

      setPopup("Login Successful");

      setTimeout(() => {
        if ((data.role || "").toLowerCase() === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      }, 500);

      return;
    }

    setPopup(data.msg || "Login failed");

  } catch (err) {
    console.log("LOGIN FETCH ERROR:", err);
    setPopup("Backend connection failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        {popup && <p style={styles.popup}>{popup}</p>}

        <input
          style={styles.input}
          placeholder="Email"
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

        <button
          style={styles.btn}
          onClick={login}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={styles.link} onClick={() => navigate("/forgot")}>
          Forgot Password?
        </p>

        <p style={styles.link} onClick={() => navigate("/register")}>
          New user? Register
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white"
  },

  card: {
    background: "#1e293b",
    padding: "25px",
    borderRadius: "18px",
    width: "320px"
  },

  title: {
    textAlign: "center",
    color: "#22c55e"
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "none"
  },

  btn: {
    width: "100%",
    padding: "12px",
    marginTop: "15px",
    border: "none",
    borderRadius: "12px",
    background: "#22c55e",
    fontWeight: "bold",
    cursor: "pointer"
  },

  link: {
    textAlign: "center",
    color: "#38bdf8",
    cursor: "pointer",
    marginTop: "12px"
  },

  popup: {
    textAlign: "center",
    color: "#facc15"
  }
};