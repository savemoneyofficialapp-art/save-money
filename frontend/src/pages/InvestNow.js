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
    loadSummary();
  }, []);

  const loadSummary = async () => {
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
      console.log("INVESTMENT SUMMARY ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const comingSoon = () => {
    alert("Temporary Unavailable - Coming Soon");
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>💰</div>
          <h2>Loading Investment</h2>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      <div style={styles.hero}>
        <div style={styles.network}>
          <span style={styles.netDot1}></span>
          <span style={styles.netDot2}></span>
          <span style={styles.netDot3}></span>
          <span style={styles.netDot4}></span>
          <span style={styles.netLine1}></span>
          <span style={styles.netLine2}></span>
          <span style={styles.netLine3}></span>
        </div>

        <div style={styles.heroLeft}>
          <p style={styles.heroLabel}>Total Investment Value 👁</p>

          <h1 style={styles.heroAmount}>
            {money(summary.totalInvestment)}.00
          </h1>

          <h3 style={styles.heroGain}>
            +{money(summary.monthlyInvestment)}.00 ▲ {summary.returnRate}%
          </h3>

          <p style={styles.heroSmall}>This Month Added</p>
        </div>

        <div style={styles.piggyArea}>
          <div style={styles.coin}>₹</div>
          <div style={styles.piggyGlow}></div>
          <div style={styles.piggy}>🐷</div>
          <div style={styles.floatCoin1}>🪙</div>
          <div style={styles.floatCoin2}>💎</div>
        </div>
      </div>

      <div style={styles.quickBox}>
        <button style={styles.quickBtn} onClick={() => navigate("/wallet")}>
          <span style={styles.quickIconPurple}>💳</span>
          <div>
            <b>Add Money</b>
            <p>Top up balance</p>
          </div>
        </button>

        <div style={styles.quickDivider}></div>

        <button style={styles.quickBtn} onClick={() => navigate("/my-investment")}>
          <span style={styles.quickIconGreen}>📋</span>
          <div>
            <b>My Investments</b>
            <p>View all plans</p>
          </div>
        </button>
      </div>

      <SectionTitle title="Active Investment" />

      <div style={styles.activeGrid}>
        <PlanCard
          type="save"
          icon="🌱"
          title="SAVE MONEY"
          tag="SIP Invest Plan"
          heading="Start small, grow big"
          text="Build your wealth step by step with our SIP plan."
          button="Invest Now"
          onClick={() => navigate("/save-money")}
        />

        <PlanCard
          type="one"
          icon="🚀"
          title="ONE TE"
          tag="Upgrade Money"
          heading="Upgrade your future"
          text="Make a smart move and unlock higher returns."
          button="Upgrade Now"
          onClick={comingSoon}
        />
      </div>

      <SectionTitle title="Coming Soon 🕒" />

      <div style={styles.comingGrid}>
        <ComingCard
          icon="🪙"
          title="Invest GOLD"
          text="Secure your future with the value of gold."
          bg={styles.goldCard}
          onClick={comingSoon}
        />

        <ComingCard
          icon="🥈"
          title="Invest SILVER"
          text="Invest in silver, secure tomorrow."
          bg={styles.silverCard}
          onClick={comingSoon}
        />

        <ComingCard
          icon="🐷"
          title="RECCURING DEPOSIT"
          text="Save regularly, get valuable returns."
          bg={styles.rdCard}
          onClick={comingSoon}
        />
      </div>

      <div style={styles.motivation}>
        <div style={styles.trophy}>🏆</div>
        <div style={styles.motiveText}>
          <h1>Discipline Today, Wealth Tomorrow.</h1>
          <p>Small steps now, big freedom later.</p>
        </div>
        <div style={styles.chart}>📈</div>
      </div>

      <div style={styles.bottomStats}>
        <MiniStat icon="📈" title="Total Invested" value={money(summary.totalInvestment)} />
        <MiniStat icon="🏦" title="Total Return" value={money(summary.totalReturn)} />
        <MiniStat icon="%" title="Return Rate" value={`${summary.returnRate}%`} />
        <MiniStat icon="📅" title="Active Plan" value={summary.activePlan} />
      </div>

    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div style={styles.sectionTitle}>
      <span></span>
      <h2>{title}</h2>
      <span></span>
    </div>
  );
}

function PlanCard({ type, icon, title, tag, heading, text, button, onClick }) {
  const isSave = type === "save";

  return (
    <div style={isSave ? styles.saveCard : styles.oneCard}>
      <div style={styles.cardGlow}></div>

      <div style={styles.planTop}>
        <div style={styles.planIcon}>{icon}</div>

        <div style={styles.planTitleBox}>
          <h1>{title}</h1>
          <span>{tag}</span>
        </div>
      </div>

      <div style={styles.planText}>
        <h2>{heading}</h2>
        <p>{text}</p>
      </div>

      <button
        style={{
          ...styles.planBtn,
          color: isSave ? "#16a34a" : "#2563eb"
        }}
        onClick={onClick}
      >
        {button}
        <b style={{ background: isSave ? "#22c55e" : "#2563eb" }}>➜</b>
      </button>
    </div>
  );
}

function ComingCard({ icon, title, text, bg, onClick }) {
  return (
    <button style={{ ...styles.comingCard, ...bg }} onClick={onClick}>
      <div style={styles.ribbon}>Coming Soon</div>
      <div style={styles.comingIcon}>{icon}</div>
      <h2>{title}</h2>
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
    background: "linear-gradient(180deg,#ffffff,#f5f7ff)",
    padding: "16px",
    fontFamily: "Arial",
    color: "#111827"
  },

  loading: {
    minHeight: "100vh",
    background: "#f8fbff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loadingCard: {
    background: "white",
    padding: "30px",
    borderRadius: "28px",
    textAlign: "center",
    boxShadow: "0 15px 40px rgba(124,58,237,.18)"
  },

  loadingIcon: {
    fontSize: "60px"
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "34px",
    padding: "25px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg,#4338ca,#7c3aed,#ec4899)",
    boxShadow: "0 20px 45px rgba(124,58,237,.35)"
  },

  network: {
    position: "absolute",
    inset: 0,
    opacity: 0.35
  },

  netDot1: {
    position: "absolute",
    top: "35px",
    left: "55%",
    width: "13px",
    height: "13px",
    borderRadius: "50%",
    background: "white"
  },

  netDot2: {
    position: "absolute",
    top: "95px",
    right: "110px",
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    background: "#fde68a"
  },

  netDot3: {
    position: "absolute",
    bottom: "45px",
    right: "210px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "white"
  },

  netDot4: {
    position: "absolute",
    bottom: "95px",
    left: "48%",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#bbf7d0"
  },

  netLine1: {
    position: "absolute",
    top: "45px",
    left: "55%",
    width: "180px",
    height: "2px",
    background: "white",
    transform: "rotate(22deg)"
  },

  netLine2: {
    position: "absolute",
    top: "110px",
    right: "120px",
    width: "150px",
    height: "2px",
    background: "white",
    transform: "rotate(-30deg)"
  },

  netLine3: {
    position: "absolute",
    bottom: "78px",
    right: "170px",
    width: "210px",
    height: "2px",
    background: "white",
    transform: "rotate(12deg)"
  },

  heroLeft: {
    position: "relative",
    zIndex: 2
  },

  heroLabel: {
    fontSize: "18px",
    margin: 0,
    opacity: 0.95
  },

  heroAmount: {
    fontSize: "44px",
    margin: "16px 0 8px",
    fontWeight: "900"
  },

  heroGain: {
    margin: 0,
    color: "#4ade80",
    fontSize: "22px"
  },

  heroSmall: {
    marginTop: "8px",
    fontSize: "15px",
    opacity: 0.9
  },

  piggyArea: {
    width: "190px",
    height: "160px",
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  piggyGlow: {
    position: "absolute",
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    background: "rgba(255,255,255,.15)",
    filter: "blur(8px)"
  },

  piggy: {
    position: "relative",
    zIndex: 2,
    fontSize: "105px"
  },

  coin: {
    position: "absolute",
    top: "2px",
    right: "55px",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#facc15",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "25px",
    zIndex: 3
  },

  floatCoin1: {
    position: "absolute",
    left: "0",
    top: "40px",
    fontSize: "25px"
  },

  floatCoin2: {
    position: "absolute",
    right: "0",
    bottom: "25px",
    fontSize: "24px"
  },

  quickBox: {
    marginTop: "18px",
    background: "white",
    borderRadius: "28px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "1fr 2px 1fr",
    gap: "14px",
    boxShadow: "0 12px 30px rgba(15,23,42,.08)"
  },

  quickBtn: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    textAlign: "left"
  },

  quickIconPurple: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
    color: "white",
    fontSize: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  quickIconGreen: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#22c55e,#10b981)",
    color: "white",
    fontSize: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  quickDivider: {
    background: "#e5e7eb"
  },

  sectionTitle: {
    margin: "30px 0 18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "14px"
  },

  activeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },

  saveCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "32px",
    padding: "24px",
    background: "linear-gradient(135deg,#22c55e,#00c27a)",
    color: "white",
    boxShadow: "0 18px 38px rgba(34,197,94,.3)"
  },

  oneCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "32px",
    padding: "24px",
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    color: "white",
    boxShadow: "0 18px 38px rgba(37,99,235,.3)"
  },

  cardGlow: {
    position: "absolute",
    right: "-50px",
    top: "-50px",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background: "rgba(255,255,255,.18)"
  },

  planTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",
    zIndex: 2
  },

  planIcon: {
    width: "112px",
    height: "112px",
    borderRadius: "50%",
    background: "white",
    fontSize: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 14px 30px rgba(0,0,0,.18)"
  },

  planTitleBox: {
    textAlign: "right"
  },

  planText: {
    marginTop: "25px",
    position: "relative",
    zIndex: 2
  },

  planBtn: {
    marginTop: "25px",
    width: "100%",
    height: "68px",
    border: "none",
    borderRadius: "20px",
    background: "white",
    fontSize: "24px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 22px"
  },

  comingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "15px"
  },

  comingCard: {
    position: "relative",
    border: "none",
    borderRadius: "28px",
    padding: "28px 16px 18px",
    minHeight: "235px",
    textAlign: "center",
    overflow: "hidden",
    boxShadow: "0 12px 30px rgba(15,23,42,.08)"
  },

  ribbon: {
    position: "absolute",
    top: 0,
    left: "22px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    color: "white",
    padding: "8px 16px",
    borderBottomLeftRadius: "14px",
    borderBottomRightRadius: "14px",
    fontWeight: "900",
    fontSize: "12px"
  },

  comingIcon: {
    fontSize: "72px",
    marginTop: "25px"
  },

  comingBtn: {
    marginTop: "14px",
    borderRadius: "18px",
    background: "rgba(124,58,237,.1)",
    color: "#7c3aed",
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
    borderRadius: "30px",
    padding: "24px",
    color: "white",
    background: "linear-gradient(135deg,#2e1065,#4c1d95,#312e81)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 16px 38px rgba(76,29,149,.3)"
  },

  trophy: {
    fontSize: "70px"
  },

  chart: {
    fontSize: "68px"
  },

  motiveText: {
    flex: 1,
    textAlign: "center"
  },

  bottomStats: {
    marginTop: "22px",
    background: "white",
    borderRadius: "28px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "10px",
    boxShadow: "0 12px 30px rgba(15,23,42,.08)"
  },

  miniStat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "10px"
  }
};