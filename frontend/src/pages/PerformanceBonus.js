import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth }
from "../utils/fetchWithAuth";
import axios from "axios";
import { API } from "../config";



export default function PerformanceBonus() {

  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetchWithAuth(`${API}/performance-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const result = await res.json();
      setData(result);
      setLoading(false);

    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // ✅ No challenge started
  if (!data || data.msg === "No challenge started") {
    return (
      <div style={styles.container}>

        <h1 style={styles.title}>Performance Bonus</h1>

        <div style={styles.statusCard}>
          <div style={styles.icon}>🚀</div>

          <h2 style={styles.heading}>
            Start Your First Save Money Investment
          </h2>

          <p style={styles.sub}>
            Please start your first Save Money investment first.
            After your first investment, your 30 days performance challenge will begin.
          </p>

          <button style={styles.btn} onClick={() => navigate("/save-money")}>
            Start Save Money
          </button>
        </div>

      </div>
    );
  }

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>Performance Bonus</h1>

      <div style={styles.statusCard}>

        {!data.isActive && !data.isFailed && (
          <>
            <div style={styles.icon}>🎯</div>

            <h2 style={styles.heading}>
              Activate Your Performance Bonus
            </h2>

            <p style={styles.sub}>
              Complete 10 Direct Active Referrals within 30 days from your first investment.
            </p>

            <div style={styles.daysBox}>
              ⏳ Remaining Days: {data.remainingDays || 0} Days
            </div>

            <div style={styles.progressBox}>
              <p>Direct Referrals Completed</p>
              <h1 style={styles.progress}>
                {data.totalDirect || 0}/10
              </h1>
            </div>
          </>
        )}

        {data.isFailed && (
          <>
            <div style={styles.failIcon}>❌</div>
            <h2 style={styles.failed}>You Are Failed</h2>
            <p style={styles.sub}>
              You could not complete 10 direct referrals within 30 days.
            </p>
          </>
        )}

        {data.isActive && (
          <>
            <div style={styles.successIcon}>🏆</div>
            <h2 style={styles.active}>Performance Bonus Active</h2>
            <p style={styles.sub}>
              Congratulations! Your performance bonus is active.
            </p>
          </>
        )}

      </div>

      <div style={styles.walletCard}>
        <h2>💰 Bonus Wallet</h2>

        <div style={styles.walletRow}>
          <span>This Month</span>
          <span>₹ {data.thisMonthBonus || 0}</span>
        </div>

        <div style={styles.walletRow}>
          <span>Last Month</span>
          <span>₹ {data.lastMonthBonus || 0}</span>
        </div>

        <hr />

        <div style={styles.total}>
          Total Bonus Earned
          <h1>₹ {data.totalBonus || 0}</h1>
        </div>
      </div>

      <h2 style={{ marginTop: "20px" }}>Bonus History</h2>

      {(data.history || []).map((h, i) => (
        <div key={i} style={styles.history}>
          <div>
            <p style={{ fontWeight: "bold" }}>{h.fromUser}</p>
            <small>{h.plan}</small>
          </div>

          <div>
            <h3>₹ {h.amount}</h3>
            <p style={{ color: h.status === "Paid" ? "#22c55e" : "#f59e0b" }}>
              {h.status}
            </p>
          </div>
        </div>
      ))}

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    padding: "20px",
    color: "white"
  },

  title: {
    textAlign: "center",
    color: "#22c55e",
    marginBottom: "20px",
    fontSize: "32px"
  },

  statusCard: {
    background: "linear-gradient(135deg,#1e293b,#0f172a)",
    padding: "25px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 0 20px rgba(0,0,0,0.5)"
  },

  icon: { fontSize: "55px" },
  successIcon: { fontSize: "60px" },
  failIcon: { fontSize: "60px" },

  heading: {
    marginTop: "10px",
    color: "#38bdf8"
  },

  sub: {
    color: "#94a3b8",
    marginTop: "10px",
    lineHeight: "24px"
  },

  daysBox: {
    marginTop: "20px",
    background: "#0f172a",
    padding: "12px",
    borderRadius: "12px",
    fontWeight: "bold",
    color: "#facc15"
  },

  progressBox: {
    marginTop: "20px",
    background: "#020617",
    padding: "15px",
    borderRadius: "15px"
  },

  progress: {
    color: "#22c55e",
    fontSize: "40px"
  },

  failed: { color: "#ef4444" },
  active: { color: "#22c55e" },

  walletCard: {
    marginTop: "20px",
    background: "#1e293b",
    padding: "20px",
    borderRadius: "18px"
  },

  walletRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px"
  },

  total: {
    textAlign: "center",
    color: "#22c55e"
  },

  history: {
    marginTop: "10px",
    background: "#1e293b",
    padding: "15px",
    borderRadius: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  btn: {
    marginTop: "20px",
    padding: "12px",
    width: "100%",
    background: "#22c55e",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  card: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "15px",
    textAlign: "center"
  }
};