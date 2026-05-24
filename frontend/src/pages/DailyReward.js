import { useState } from "react";

const API =
  process.env.REACT_APP_API ||
  "https://save-money-yyv1.onrender.com";
  
export default function DailyReward() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const claim = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/daily-reward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      setResult(data.msg || "Reward updated");

      if (data.reward?.history) {
        setHistory([...data.reward.history].reverse());
      }

      setLoading(false);

    } catch (err) {
  console.log("Daily reward fetch error:", err);
      setLoading(false);
      alert("Backend connection failed.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Daily Reward</h1>

        <p style={styles.sub}>
          Claim your daily surprise reward
        </p>

        <p style={styles.small}>
          Special surprise unlocks on every 10th claim
        </p>

        <div style={styles.gift}>🎁</div>

        <button style={styles.btn} onClick={claim}>
          {loading ? "Claiming..." : "Claim Reward"}
        </button>

        {result && <h3 style={styles.result}>{result}</h3>}
      </div>

      <h3 style={styles.historyTitle}>Reward History</h3>

      {history.map((h, i) => (
        <div key={i} style={styles.history}>
          <b>Reward Claimed</b>
          <span>{new Date(h.date).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "white",
    padding: "20px"
  },

  card: {
    background: "linear-gradient(145deg,#1e293b,#020617)",
    padding: "25px",
    borderRadius: "24px",
    textAlign: "center",
    border: "2px solid #facc15",
    boxShadow: "0 0 25px rgba(250,204,21,0.25)"
  },

  sub: {
    color: "#e2e8f0",
    fontWeight: "bold"
  },

  small: {
    color: "#94a3b8",
    fontSize: "13px"
  },

  gift: {
    fontSize: "90px",
    margin: "20px"
  },

  btn: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#facc15,#f59e0b)",
    color: "#020617",
    fontWeight: "bold"
  },

  result: {
    color: "#22c55e",
    marginTop: "18px"
  },

  historyTitle: {
    marginTop: "25px",
    color: "#facc15"
  },

  history: {
    background: "#1e293b",
    padding: "14px",
    borderRadius: "14px",
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between"
  }
};