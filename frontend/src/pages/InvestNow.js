import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function InvestNow() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalInvestment: 0,
    monthlyInvestment: 0,
    totalReturn: 0,
    returnRate: 0,
    activePlan: 0
  });

  useEffect(() => {
    loadInvestmentSummary();
  }, []);

  const loadInvestmentSummary = async () => {
    try {
      const res = await fetch(`${API}/investment-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      setSummary({
        totalInvestment: Number(data.totalInvestment || 0),
        monthlyInvestment: Number(data.monthlyInvestment || 0),
        totalReturn: Number(data.totalReturn || 0),
        returnRate: Number(data.returnRate || 0),
        activePlan: Number(data.activePlan || 0)
      });
    } catch (err) {
      console.log("Investment summary error:", err);
    } finally {
      setLoading(false);
    }
  };

  const comingSoon = () => {
    alert("Coming Soon");
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Investment...
      </div>
    );
  }

  return (
    <div style={styles.page}>

      <div style={styles.topBanner}>
        <div>
          <p style={styles.small}>Total Investment Value 👁</p>

          <h1 style={styles.bigAmount}>
            ₹ {summary.totalInvestment.toLocaleString("en-IN")}.00
          </h1>

          <h3 style={styles.gain}>
            +₹ {summary.monthlyInvestment.toLocaleString("en-IN")}.00
            {" "}
            (▲ {summary.returnRate || 0}%)
          </h3>

          <p style={styles.small}>This Month Added</p>
        </div>

        <div style={styles.piggyBox}>
          <div style={styles.coin}>₹</div>
          🐷
        </div>
      </div>

      <div style={styles.quickCard}>
        <button style={styles.quickBtn} onClick={() => navigate("/wallet")}>
          <span style={styles.quickIconPurple}>👛</span>
          <div>
            <b>Add Money</b>
            <p>Top up balance</p>
          </div>
        </button>

        <div style={styles.divider}></div>

        <button style={styles.quickBtn} onClick={() => navigate("/my-investment")}>
          <span style={styles.quickIconGreen}>📋</span>
          <div>
            <b>My Investments</b>
            <p>View all plans</p>
          </div>
        </button>
      </div>

      <Title text="Active Investment" />

      <div style={styles.activeGrid}>
        <div style={styles.saveCard}>
          <div style={styles.circleIcon}>🌱</div>

          <div style={styles.cardText}>
            <h2>SAVE MONEY</h2>
            <span>SIP Invest Plan</span>
            <p>
              Start small, grow big<br />
              Build your wealth step by step<br />
              with our SIP plan.
            </p>
          </div>

          <button style={styles.whiteBtn} onClick={() => navigate("/save-money")}>
            Invest Now <b>›</b>
          </button>
        </div>

        <div style={styles.oneCard}>
          <div style={styles.circleIcon}>🚀</div>

          <div style={styles.cardText}>
            <h2>ONE TE</h2>
            <span>Upgrade Money</span>
            <p>
              Upgrade your future<br />
              Make a smart move and<br />
              unlock higher returns.
            </p>
          </div>

          <button style={styles.whiteBtnBlue} onClick={comingSoon}>
            Upgrade Now <b>›</b>
          </button>
        </div>
      </div>

      <Title text="Coming Soon 🕒" />

      <div style={styles.comingGrid}>
        <ComingCard
          bg={styles.goldCard}
          icon="🪙"
          title="Invest GOLD"
          text="Secure your future with the value of gold."
          onClick={comingSoon}
        />

        <ComingCard
          bg={styles.silverCard}
          icon="🥈"
          title="Invest SILVER"
          text="Invest in silver, secure tomorrow."
          onClick={comingSoon}
        />

        <ComingCard
          bg={styles.rdCard}
          icon="🐷"
          title="RECCURING DEPOSIT"
          text="Save regularly, get valuable returns."
          onClick={comingSoon}
        />
      </div>

      <div style={styles.motivation}>
        <div style={styles.trophy}>🏆</div>
        <div>
          <h2>Discipline Today, Wealth Tomorrow.</h2>
          <p>Small steps now, big freedom later.</p>
        </div>
        <div style={styles.chart}>📈</div>
      </div>

      <div style={styles.bottomStats}>
        <MiniStat icon="📈" title="Total Invested" value={`₹ ${summary.totalInvestment.toLocaleString("en-IN")}`} />
        <MiniStat icon="📊" title="Total Return" value={`₹ ${summary.totalReturn.toLocaleString("en-IN")}`} />
        <MiniStat icon="%" title="Return Rate" value={`${summary.returnRate || 0}%`} />
        <MiniStat icon="📅" title="Active Plan" value={summary.activePlan} />
      </div>

    </div>
  );
}

function Title({ text }) {
  return (
    <div style={styles.titleRow}>
      <span></span>
      <h2>{text}</h2>
      <span></span>
    </div>
  );
}

function ComingCard({ bg, icon, title, text, onClick }) {
  return (
    <button style={{ ...styles.comingCard, ...bg }} onClick={onClick}>
      <div style={styles.ribbon}>Coming Soon</div>
      <div style={styles.comingIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div style={styles.comingBtn}>🕒 Coming Soon</div>
    </button>
  );
}

function MiniStat({ icon, title, value }) {
  return (
    <div style={styles.miniStat}>
      <span>{icon}</span>
      <div>
        <p>{title}</p>
        <b>{value}</b>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#ffffff,#f8fbff)",
    padding: "18px",
    fontFamily: "Arial",
    color: "#0f172a"
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold"
  },

  topBanner: {
    background: "linear-gradient(135deg,#6d28d9,#8b5cf6,#7c3aed)",
    borderRadius: "28px",
    padding: "28px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 18px 35px rgba(124,58,237,0.28)"
  },

  small: {
    margin: 0,
    fontSize: "18px",
    opacity: 0.95
  },

  bigAmount: {
    fontSize: "48px",
    margin: "18px 0 10px",
    fontWeight: "900"
  },

  gain: {
    color: "#35f08b",
    fontSize: "22px",
    margin: "0 0 12px"
  },

  piggyBox: {
    width: "210px",
    height: "160px",
    borderRadius: "30px",
    background: "rgba(255,255,255,0.12)",
    fontSize: "95px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },

  coin: {
    position: "absolute",
    top: "0",
    right: "55px",
    width: "48px",
    height: "48px",
    background: "#facc15",
    color: "#b45309",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "24px"
  },

  quickCard: {
    marginTop: "18px",
    background: "white",
    borderRadius: "28px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "1fr 2px 1fr",
    gap: "18px",
    boxShadow: "0 12px 28px rgba(15,23,42,0.08)"
  },

  quickBtn: {
    border: "none",
    background: "transparent",
    display: "flex",
    gap: "14px",
    alignItems: "center",
    textAlign: "left",
    color: "#0f172a"
  },

  quickIconPurple: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: "24px"
  },

  quickIconGreen: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#22c55e,#10b981)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: "24px"
  },

  divider: {
    background: "#e5e7eb"
  },

  titleRow: {
    margin: "30px 0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px"
  },

  activeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px"
  },

  saveCard: {
    background: "linear-gradient(135deg,#22c55e,#00c27a)",
    borderRadius: "26px",
    padding: "22px",
    color: "white",
    boxShadow: "0 16px 32px rgba(34,197,94,0.25)"
  },

  oneCard: {
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    borderRadius: "26px",
    padding: "22px",
    color: "white",
    boxShadow: "0 16px 32px rgba(37,99,235,0.25)"
  },

  circleIcon: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    background: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "60px",
    marginBottom: "14px"
  },

  cardText: {
    minHeight: "170px"
  },

  whiteBtn: {
    width: "100%",
    height: "58px",
    border: "none",
    borderRadius: "18px",
    background: "white",
    color: "#16a34a",
    fontSize: "20px",
    fontWeight: "900"
  },

  whiteBtnBlue: {
    width: "100%",
    height: "58px",
    border: "none",
    borderRadius: "18px",
    background: "white",
    color: "#2563eb",
    fontSize: "20px",
    fontWeight: "900"
  },

  comingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px"
  },

  comingCard: {
    position: "relative",
    border: "1px solid #eee",
    borderRadius: "25px",
    padding: "26px 16px 16px",
    textAlign: "center",
    minHeight: "235px",
    overflow: "hidden"
  },

  ribbon: {
    position: "absolute",
    top: 0,
    left: "22px",
    background: "#a855f7",
    color: "white",
    padding: "8px 18px",
    borderBottomLeftRadius: "12px",
    borderBottomRightRadius: "12px"
  },

  comingIcon: {
    fontSize: "72px",
    marginTop: "25px"
  },

  comingBtn: {
    marginTop: "15px",
    background: "rgba(168,85,247,0.12)",
    color: "#7c3aed",
    borderRadius: "20px",
    padding: "12px",
    fontWeight: "900"
  },

  goldCard: {
    background: "linear-gradient(135deg,#fff7d6,#fff)"
  },

  silverCard: {
    background: "linear-gradient(135deg,#f8fafc,#ffffff)"
  },

  rdCard: {
    background: "linear-gradient(135deg,#fff1f2,#ffffff)"
  },

  motivation: {
    marginTop: "24px",
    background: "linear-gradient(135deg,#2e1065,#4c1d95,#312e81)",
    color: "white",
    borderRadius: "26px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  trophy: {
    fontSize: "72px"
  },

  chart: {
    fontSize: "70px"
  },

  bottomStats: {
    marginTop: "22px",
    background: "white",
    borderRadius: "26px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "10px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)"
  },

  miniStat: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid #e5e7eb"
  }
};