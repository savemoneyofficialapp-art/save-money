import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth }
from "../utils/fetchWithAuth";
import axios from "axios";
import API from "../api";


export default function RoyaltyBonus() {

  const navigate = useNavigate();

  const email = localStorage.getItem("email");

  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // ================= LOAD =================

  const loadData = async () => {

    try {

      const res = await fetchWithAuth(`${API}/royalty-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const result = await res.json();

      setData(result);

    } catch (err) {
      console.log(err);
    }
  };

  // ================= LOADING =================

  if (!data) {

    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          Loading...
        </div>
      </div>
    );
  }

  // ================= NO INVESTMENT =================

  if (data.noInvestment) {

    return (
      <div style={styles.container}>

        <h1 style={styles.title}>
          Royalty Bonus
        </h1>

        <div style={styles.lockCard}>

          <div style={styles.lockIcon}>
            🔒
          </div>

          <h2 style={styles.lockTitle}>
            Invest Your Save Money First
          </h2>

          <p style={styles.lockText}>
            Please Invest Your SAVE MONEY First And Active Your Royalty Bonus.
          </p>

          <button
            style={styles.investBtn}
            onClick={() => navigate("/save-money")}
          >
            Start Investment
          </button>

        </div>

      </div>
    );
  }

  // ================= MAIN UI =================

  return (
    <div style={styles.container}>

      {/* HEADER */}

      <div style={styles.headerCard}>

        <h1 style={styles.title}>
          Royalty Bonus
        </h1>

        {data.isActive ? (

          <div style={styles.activeBadge}>
            ✔ ACTIVE
          </div>

        ) : (

          <div style={styles.pendingBadge}>
            PENDING
          </div>

        )}

      </div>

      {/* TASK */}

      {!data.isActive && (

        <div style={styles.taskCard}>

          <h2 style={styles.taskTitle}>
            Complete 50 Direct Referrals
          </h2>

          <p style={styles.taskText}>
            Activate your Royalty Bonus system
          </p>

          <div style={styles.progressOuter}>

            <div
              style={{
                ...styles.progressInner,
                width: `${Math.min((data.directCount / 50) * 100, 100)}%`
              }}
            />

          </div>

          <div style={styles.countBox}>
            {data.directCount || 0} / 50
          </div>

        </div>

      )}

      {/* WALLET */}

      <div style={styles.walletCard}>

        <p style={styles.walletLabel}>
          Royalty Wallet
        </p>

        <h1 style={styles.walletAmount}>
          ₹ {data.wallet || 0}
        </h1>

      </div>

      {/* TURNOVER */}

      <div style={styles.turnoverCard}>

        <div>

          <p style={styles.turnoverLabel}>
            This Month Turnover
          </p>

          <h2 style={styles.turnoverAmount}>
            ₹ {data.thisMonthTurnover || 0}
          </h2>

        </div>

        <div style={styles.turnoverCircle}>
          1%
        </div>

      </div>

      {/* DIRECT */}

      <div style={styles.directCard}>

        <div style={styles.directBox}>
          <p style={styles.directLabel}>
            Direct Referrals
          </p>

          <h2 style={styles.directValue}>
            {data.directCount || 0}
          </h2>
        </div>

        <div style={styles.directBox}>
          <p style={styles.directLabel}>
            Royalty Rate
          </p>

          <h2 style={styles.directValue}>
            1%
          </h2>
        </div>

      </div>

      {/* HISTORY */}

      <h2 style={styles.historyTitle}>
        Royalty History
      </h2>

      {(!data.history || data.history.length === 0) && (

        <div style={styles.emptyCard}>
          No Royalty History
        </div>

      )}

      {data.history && data.history.map((item, index) => (

        <div key={index} style={styles.historyCard}>

          <div>

            <h3 style={styles.historyName}>
              {item.fromUser}
            </h3>

            <p style={styles.historyInvest}>
              Invest: ₹ {item.investAmount}
            </p>

          </div>

          <div style={{ textAlign: "right" }}>

            <h3 style={styles.historyBonus}>
              +₹ {item.royalty}
            </h3>

            <p style={styles.historyDate}>
              {new Date(item.date).toLocaleDateString()}
            </p>

          </div>

        </div>

      ))}

    </div>
  );
}

// ================= STYLES =================

const styles = {

  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#111827)",
    padding: "20px",
    color: "white"
  },

  loading: {
    color: "white",
    textAlign: "center",
    marginTop: "100px"
  },

  title: {
    fontSize: "32px",
    fontWeight: "bold"
  },

  headerCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  activeBadge: {
    background: "#22c55e",
    padding: "8px 15px",
    borderRadius: "30px",
    fontWeight: "bold",
    color: "#020617"
  },

  pendingBadge: {
    background: "#f59e0b",
    padding: "8px 15px",
    borderRadius: "30px",
    fontWeight: "bold",
    color: "#020617"
  },

  // LOCK

  lockCard: {
    background: "#1e293b",
    borderRadius: "25px",
    padding: "40px 25px",
    textAlign: "center",
    marginTop: "40px",
    boxShadow: "0 0 25px rgba(0,0,0,0.4)"
  },

  lockIcon: {
    fontSize: "70px"
  },

  lockTitle: {
    marginTop: "15px",
    color: "#22c55e"
  },

  lockText: {
    color: "#94a3b8",
    marginTop: "10px",
    lineHeight: "24px"
  },

  investBtn: {
    marginTop: "25px",
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#020617",
    fontWeight: "bold",
    fontSize: "16px"
  },

  // TASK

  taskCard: {
    background: "#1e293b",
    borderRadius: "20px",
    padding: "20px",
    marginTop: "25px"
  },

  taskTitle: {
    color: "#facc15"
  },

  taskText: {
    color: "#94a3b8",
    marginTop: "5px"
  },

  progressOuter: {
    width: "100%",
    height: "18px",
    background: "#334155",
    borderRadius: "30px",
    marginTop: "20px",
    overflow: "hidden"
  },

  progressInner: {
    height: "100%",
    background: "linear-gradient(90deg,#22c55e,#4ade80)"
  },

  countBox: {
    textAlign: "center",
    marginTop: "12px",
    fontWeight: "bold",
    color: "#22c55e"
  },

  // WALLET

  walletCard: {
    marginTop: "25px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    padding: "30px",
    borderRadius: "25px",
    color: "#020617",
    boxShadow: "0 10px 30px rgba(34,197,94,0.35)"
  },

  walletLabel: {
    fontSize: "18px",
    fontWeight: "bold"
  },

  walletAmount: {
    marginTop: "10px",
    fontSize: "40px"
  },

  // TURNOVER

  turnoverCard: {
    marginTop: "20px",
    background: "#1e293b",
    padding: "20px",
    borderRadius: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  turnoverLabel: {
    color: "#94a3b8"
  },

  turnoverAmount: {
    marginTop: "5px"
  },

  turnoverCircle: {
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    background: "#22c55e",
    color: "#020617",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "22px"
  },

  // DIRECT

  directCard: {
    display: "flex",
    gap: "15px",
    marginTop: "20px"
  },

  directBox: {
    flex: 1,
    background: "#1e293b",
    padding: "20px",
    borderRadius: "18px"
  },

  directLabel: {
    color: "#94a3b8"
  },

  directValue: {
    marginTop: "8px",
    color: "#22c55e"
  },

  // HISTORY

  historyTitle: {
    marginTop: "30px",
    marginBottom: "10px"
  },

  emptyCard: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "15px",
    textAlign: "center",
    color: "#94a3b8"
  },

  historyCard: {
    background: "#1e293b",
    borderRadius: "18px",
    padding: "18px",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  historyName: {
    color: "#22c55e"
  },

  historyInvest: {
    color: "#94a3b8",
    marginTop: "5px"
  },

  historyBonus: {
    color: "#22c55e"
  },

  historyDate: {
    color: "#94a3b8",
    marginTop: "5px",
    fontSize: "13px"
  }

};