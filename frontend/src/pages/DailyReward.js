import { useState } from "react";
import axios from "axios";
import API from "../api.js";

export default function DailyReward() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const claim = async () => {
    setLoading(true);

    const res = await fetch(`${API}/daily-reward`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setResult(data.msg);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Daily Reward</h1>
        <p>Claim your daily bonus and grow your wallet.</p>

        <div style={styles.gift}>🎁</div>

        <button style={styles.btn} onClick={claim}>
          {loading ? "Claiming..." : "Claim Reward"}
        </button>

        {result && <h3 style={styles.result}>{result}</h3>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "white",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    background: "#1e293b",
    padding: "25px",
    borderRadius: "22px",
    textAlign: "center",
    width: "90%",
    maxWidth: "380px",
    border: "2px solid #22c55e"
  },
  gift: {
    fontSize: "70px",
    margin: "20px"
  },
  btn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#22c55e",
    color: "#020617",
    fontWeight: "bold"
  },
  result: {
    color: "#22c55e"
  }
};