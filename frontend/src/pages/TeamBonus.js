import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth }
from "../utils/fetchWithAuth";
import axios from "axios";

const API =
  process.env.REACT_APP_API ||
  "https://save-money-yyv1.onrender.com";
  
export default function TeamBonus() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await fetchWithAuth(`${API}/team-bonus-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const d = await res.json();
    setData(d);
  };

  if (!data) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>Team Bonus</h1>

      {/* NOT STARTED */}
      {!data.started && (
        <div style={styles.hero}>
          <div style={styles.icon}>🧑‍🤝‍🧑</div>

          <h2 style={styles.blueTitle}>
            Start Your First Save Money Investment
          </h2>

          <p style={styles.text}>
            Please start your first Save Money investment first. After your first
            investment, your 30 days team bonus challenge will begin.
          </p>

          <button
            style={styles.fullGreen}
            onClick={() => navigate("/save-money")}
          >
            Start Save Money
          </button>
        </div>
      )}

      {/* TASK PENDING */}
      {data.started && !data.isActive && !data.isFailed && (
        <div style={styles.hero}>
          <div style={styles.icon}>🎯</div>

          <h2 style={styles.yellowTitle}>
            Please Complete Your Task First
          </h2>

          <p style={styles.text}>
            Your remaining days is {data.remainingDays} days
          </p>

          <div style={styles.progress}>
            <h1>{data.directCount}/10</h1>
            <p>Direct Referrals Completed</p>
          </div>
        </div>
      )}

      {/* FAILED */}
      {data.started && data.isFailed && (
        <div style={styles.hero}>
          <div style={styles.icon}>❌</div>

          <h2 style={styles.redTitle}>You Are Failed</h2>

          <p style={styles.text}>
            You did not complete 10 direct referrals within 30 days.
          </p>
        </div>
      )}

      {/* ACTIVE */}
      {data.started && data.isActive && (
        <>
          <div style={styles.hero}>
            <div style={styles.icon}>✅</div>

            <h2 style={styles.greenTitle}>
              Team Bonus Active
            </h2>

            <p style={styles.text}>
              Your team bonus is active. You can earn from Level 1, Level 2 and Level 3 team.
            </p>
          </div>

          <div style={styles.wallet}>
            <p>Team Bonus Wallet</p>
            <h1>₹ {data.wallet}</h1>
          </div>

          <div style={styles.card}>
            <h3>Total Network Team</h3>

            <div style={styles.grid}>
              <div style={styles.box}>
                <h2>{data.level1Count}</h2>
                <p>Level 1</p>
              </div>

              <div style={styles.box}>
                <h2>{data.level2Count}</h2>
                <p>Level 2</p>
              </div>

              <div style={styles.box}>
                <h2>{data.level3Count}</h2>
                <p>Level 3</p>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3>This Month Joined</h3>

            <div style={styles.grid}>
              <div style={styles.smallBox}>L1: {data.thisMonth.level1}</div>
              <div style={styles.smallBox}>L2: {data.thisMonth.level2}</div>
              <div style={styles.smallBox}>L3: {data.thisMonth.level3}</div>
            </div>
          </div>

          <div style={styles.card}>
            <h3>Last Month Joined</h3>

            <div style={styles.grid}>
              <div style={styles.smallBox}>L1: {data.lastMonth.level1}</div>
              <div style={styles.smallBox}>L2: {data.lastMonth.level2}</div>
              <div style={styles.smallBox}>L3: {data.lastMonth.level3}</div>
            </div>
          </div>

          <div style={styles.card}>
            <h3>Bonus History</h3>

            {data.history.length === 0 && (
              <p style={styles.text}>No bonus history</p>
            )}

            {data.history.map((h, i) => (
              <div key={i} style={styles.history}>
                <div>
                  <b>{h.fromUser}</b>
                  <p style={styles.small}>Level {h.level}</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <b>₹ {h.amount}</b>
                  <p style={styles.paid}>{h.status}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}

const styles = {

  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#020617,#0f172a)",
    color: "white",
    paddingBottom: "20px"
  },

  title: {
    textAlign: "center",
    color: "#22c55e",
    marginBottom: "20px",
    fontSize: "32px"
  },

  hero: {
    width: "88%",
    margin: "auto",
    background: "linear-gradient(135deg,#102844,#0f172a)",
    padding: "40px 22px",
    borderRadius: "22px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 0 30px rgba(0,0,0,0.35)"
  },

  icon: {
    fontSize: "52px",
    marginBottom: "18px"
  },

  blueTitle: {
    color: "#38bdf8",
    fontSize: "28px",
    marginBottom: "16px",
    fontWeight: "700"
  },

  yellowTitle: {
    color: "#facc15",
    fontSize: "28px",
    marginBottom: "16px",
    fontWeight: "700"
  },

  greenTitle: {
    color: "#22c55e",
    fontSize: "30px",
    marginBottom: "16px",
    fontWeight: "700"
  },

  redTitle: {
    color: "#ef4444",
    fontSize: "30px",
    marginBottom: "16px",
    fontWeight: "700"
  },

  text: {
    color: "#e2e8f0",
    fontSize: "15px",
    lineHeight: "24px",
    marginTop: "10px"
  },

  fullGreen: {
  marginTop: "24px",
  width: "100%",
  padding: "16px",
  background: "linear-gradient(135deg,#22c55e,#4ade80)",
  border: "none",
  borderRadius: "14px",
  color: "#052e16",
  fontWeight: "700",
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 4px 18px rgba(34,197,94,0.35)"
},

  progress: {
    background: "#020617",
    padding: "18px",
    borderRadius: "18px",
    marginTop: "22px",
    border: "1px solid rgba(255,255,255,0.06)"
  },

  wallet: {
    width: "88%",
    margin: "20px auto 0 auto",
    background: "linear-gradient(135deg,#16a34a,#4ade80)",
    color: "#02140a",
    padding: "22px",
    borderRadius: "22px",
    textAlign: "center",
    fontWeight: "bold",
    boxShadow: "0 4px 20px rgba(34,197,94,0.35)"
  },

  card: {
    width: "88%",
    margin: "18px auto 0 auto",
    background: "#111c2e",
    padding: "18px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 0 18px rgba(0,0,0,0.25)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    marginTop: "15px"
  },

  box: {
    background: "linear-gradient(135deg,#1e293b,#0f172a)",
    padding: "18px 10px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.06)"
  },

  smallBox: {
    background: "#1e293b",
    padding: "14px",
    borderRadius: "14px",
    textAlign: "center",
    fontWeight: "700",
    color: "#f8fafc"
  },

  history: {
    background: "#020617",
    padding: "14px",
    borderRadius: "16px",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.05)"
  },

  small: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0
  },

  paid: {
    color: "#22c55e",
    fontSize: "12px",
    margin: 0,
    fontWeight: "bold"
  }
};