import { useState } from "react";

const API = "https://save-money-yyv1.onrender.com";

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

      setResult(data.msg || "Reward claimed");

      if (data.reward?.history) {
        setHistory(data.reward.history.reverse());
      }

      setLoading(false);

    } catch (err) {
      setLoading(false);
      alert("Backend not connected. Please start backend server.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Daily Reward</h1>
        <p>Daily reward ₹1 to ₹10</p>
        <p>Every 10th claim special reward ₹11 to ₹20</p>

        <div style={styles.gift}>🎁</div>

        <button style={styles.btn} onClick={claim}>
          {loading ? "Claiming..." : "Claim Reward"}
        </button>

        {result && <h3 style={styles.result}>{result}</h3>}
      </div>

      <h3 style={styles.historyTitle}>Reward History</h3>

      {history.map((h, i) => (
        <div key={i} style={styles.history}>
          <b>₹{h.amount}</b>
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
    background: "#1e293b",
    padding: "25px",
    borderRadius: "22px",
    textAlign: "center",
    border: "2px solid #facc15"
  },

  gift: {
    fontSize: "80px",
    margin: "20px"
  },

  btn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
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