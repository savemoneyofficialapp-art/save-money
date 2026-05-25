import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function DailyReward() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [result, setResult] = useState("");
  const [amount, setAmount] = useState(null);
  const [special, setSpecial] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(false);

  const claim = async () => {
    try {
      setLoading(true);
      setResult("");
      setAmount(null);

      const res = await fetch(`${API}/daily-reward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(data.msg || "Reward claim failed");
        return;
      }

      setResult(data.msg || "Reward Claimed Successfully");
      setAmount(data.amount || data.rewardAmount || 0);
      setSpecial(data.special || false);
      setPopup(true);

      if (data.reward?.history) {
        setHistory([...data.reward.history].reverse());
      }

      setTimeout(() => setPopup(false), 4000);

    } catch (err) {
      console.log("Daily reward fetch error:", err);
      toast.error("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      {popup && (
        <div style={styles.popup}>
          <div style={styles.popupIcon}>
            {special ? "🎉" : "🎁"}
          </div>

          <h2 style={styles.popupTitle}>
            {special ? "Special Reward!" : "Reward Claimed!"}
          </h2>

          <h1 style={styles.popupAmount}>
            ₹{amount}
          </h1>

          <p style={styles.popupText}>
            Added to your reward wallet
          </p>
        </div>
      )}

      <div style={styles.hero}>

        <div style={styles.badge}>
          Daily Bonus
        </div>

        <h1 style={styles.title}>
          Daily Reward
        </h1>

        <p style={styles.sub}>
          Claim every day and unlock special bonus on every 10th claim
        </p>

        <div style={styles.giftBox}>
          <div style={styles.gift}>🎁</div>
        </div>

        <button
          style={{
            ...styles.btn,
            opacity: loading ? 0.7 : 1
          }}
          onClick={claim}
          disabled={loading}
        >
          {loading ? "Claiming Reward..." : "Claim Reward"}
        </button>

        {result && (
          <div style={styles.resultBox}>
            <h3>{result}</h3>
            {amount !== null && <p>You received ₹{amount}</p>}
          </div>
        )}

      </div>

      <h3 style={styles.historyTitle}>
        Reward History
      </h3>

      {history.length === 0 && (
        <div style={styles.empty}>
          No reward history yet
        </div>
      )}

      {history.map((h, i) => (
        <div key={i} style={styles.history}>
          <div>
            <b>{h.special ? "Special Reward" : "Daily Reward"}</b>
            <p>₹{h.amount || h.reward || 0}</p>
          </div>

          <span>
            {new Date(h.date).toLocaleDateString()}
          </span>
        </div>
      ))}

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top,#1e293b,#020617 65%)",
    color: "white",
    padding: "20px"
  },

  hero: {
    background: "linear-gradient(145deg,#1e293b,#0f172a)",
    padding: "26px",
    borderRadius: "28px",
    textAlign: "center",
    border: "1px solid rgba(250,204,21,0.45)",
    boxShadow: "0 0 35px rgba(250,204,21,0.18)"
  },

  badge: {
    display: "inline-block",
    padding: "7px 16px",
    borderRadius: "20px",
    background: "rgba(250,204,21,0.15)",
    color: "#facc15",
    fontWeight: "bold",
    fontSize: "13px"
  },

  title: {
    fontSize: "34px",
    color: "#facc15",
    marginBottom: "8px"
  },

  sub: {
    color: "#cbd5e1",
    lineHeight: "24px"
  },

  giftBox: {
    width: "135px",
    height: "135px",
    margin: "25px auto",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f97316)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 35px rgba(250,204,21,0.45)"
  },

  gift: {
    fontSize: "75px"
  },

  rewardInfo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "18px"
  },

  infoCard: {
    background: "#020617",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #334155"
  },

  btn: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#facc15,#f59e0b)",
    color: "#020617",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer"
  },

  resultBox: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "16px",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid #22c55e",
    color: "#22c55e"
  },

  popup: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    background: "linear-gradient(145deg,#1e293b,#020617)",
    border: "2px solid #facc15",
    borderRadius: "26px",
    padding: "28px",
    width: "85%",
    maxWidth: "340px",
    textAlign: "center",
    zIndex: 9999,
    boxShadow: "0 0 60px rgba(250,204,21,0.5)"
  },

  popupIcon: {
    fontSize: "70px"
  },

  popupTitle: {
    color: "#facc15",
    margin: "10px 0"
  },

  popupAmount: {
    color: "#22c55e",
    fontSize: "46px",
    margin: "10px 0"
  },

  popupText: {
    color: "#cbd5e1"
  },

  historyTitle: {
    marginTop: "26px",
    color: "#facc15"
  },

  empty: {
    background: "#1e293b",
    padding: "16px",
    borderRadius: "16px",
    color: "#94a3b8",
    textAlign: "center"
  },

  history: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "16px",
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #334155"
  }
};