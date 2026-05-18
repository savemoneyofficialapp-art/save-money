import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState("");

  const login = async () => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await res.json();

      if (data.msg === "Login success") {
        localStorage.setItem("token", data.token || data.accessToken);
        localStorage.setItem("accessToken", data.token || data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/home");

        setPopup("Login Successful");

       setTimeout(() => {

  if (data.user.role === "admin") {
    navigate("/admin-user-control", {
      replace: true
    });
  } else {
    navigate("/home", {
      replace: true
    });
  }

}, 1000);

      } else {
        setPopup(data.msg || "Login failed");
      }
    } catch (err) {
      setPopup("Backend server not running");
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

        <button style={styles.btn} onClick={login}>
          Login
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
    fontWeight: "bold"
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