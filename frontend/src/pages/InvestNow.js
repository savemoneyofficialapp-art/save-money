import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function InvestNow() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

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
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      setSummary({
        totalInvestment: Number(data.totalInvestment || 25680),
        monthlyInvestment: Number(data.monthlyInvestment || 2560),
        totalReturn: Number(data.totalReturn || 2560),
        returnRate: Number(data.returnRate || 11.09),
        activePlan: Number(data.activePlan || 2)
      });
    } catch (err) {
      console.log(err);
    }
  };

  const money = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN")}.00`;
  const soon = () => alert("Coming Soon");

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>

        <div style={styles.hero}>
          <div style={styles.heroText}>
            <p style={styles.heroLabel}>Total Investment Value 👁</p>
            <h1 style={styles.heroAmount}>{money(summary.totalInvestment)}</h1>
            <h3 style={styles.gain}>
              +₹ {summary.monthlyInvestment.toLocaleString("en-IN")}.00 (▲ {summary.returnRate}%)
            </h3>
            <p style={styles.allTime}>All Time Gain</p>
          </div>

          <div style={styles.graph}>
            <span style={styles.arrow}>↗</span>
            <span style={styles.bar1}></span>
            <span style={styles.bar2}></span>
            <span style={styles.bar3}></span>
            <span style={styles.bar4}></span>
            <span style={styles.bar5}></span>
          </div>

          <div style={styles.pigStage}>
            <div style={styles.coin}>$</div>
            <div style={styles.pigFace}>🐷</div>
          </div>
        </div>

        <div style={styles.quick}>
          <button style={styles.quickBtn} onClick={() => navigate("/wallet")}>
            <span style={styles.walletIcon}>▣</span>
            <div>
              <b>Add Money</b>
              <p>Top up balance</p>
            </div>
          </button>

          <span style={styles.vLine}></span>

          <button style={styles.quickBtn} onClick={() => navigate("/my-investment")}>
            <span style={styles.investIcon}>▤</span>
            <div>
              <b>My Investments</b>
              <p>View all plans</p>
            </div>
          </button>
        </div>

        <Section title="Active Investment" />

        <div style={styles.activeGrid}>
          <div style={styles.saveCard}>
            <div style={styles.roundPic}>
              <div style={styles.plantIcon}>🌱</div>
              <div style={styles.smallCoin}>$</div>
            </div>

            <div style={styles.planText}>
              <h2>SAVE MONEY</h2>
              <span>SIP Invest Plan</span>
              <p>Start small, grow big<br />Build your wealth step by step<br />with our SIP plan.</p>
            </div>

            <button style={styles.planBtnGreen} onClick={() => navigate("/save-money")}>
              Invest Now <b>›</b>
            </button>
          </div>

          <div style={styles.oneCard}>
            <div style={styles.roundPic}>
              <div style={styles.rocketIcon}>🚀</div>
            </div>

            <div style={styles.planText}>
              <h2>ONE TE</h2>
              <span>Upgrade Money</span>
              <p>Upgrade your future<br />Make a smart move and<br />unlock higher returns.</p>
            </div>

            <button style={styles.planBtnBlue} onClick={soon}>
              Upgrade Now <b>›</b>
            </button>
          </div>
        </div>

        <Section title="Coming Soon ⏱" />

        <div style={styles.comingGrid}>
          <Coming icon="🪙" title="Invest GOLD" text="Secure your future with the value of gold." bg={styles.gold} onClick={soon} />
          <Coming icon="🥈" title="Invest SILVER" text="Invest in silver, secure tomorrow." bg={styles.silver} onClick={soon} />
          <Coming icon="🐷" title="RECCURING DEPOSIT" text="Save regularly, get valuable returns." bg={styles.rd} onClick={soon} />
        </div>

        <div style={styles.motive}>
          <div style={styles.trophy}>🏆</div>
          <div>
            <h2>Discipline Today, Wealth Tomorrow.</h2>
            <p>Small steps now, big freedom later.</p>
          </div>
          <div style={styles.motiveGraph}>▂▃▅▇</div>
        </div>

        <div style={styles.stats}>
          <Mini icon="↗" title="Total Invested" value={`₹ ${summary.totalInvestment.toLocaleString("en-IN")}`} color="#20c997" />
          <Mini icon="↗" title="Total Return" value={`₹ ${summary.totalReturn.toLocaleString("en-IN")}`} color="#279eff" />
          <Mini icon="%" title="Return Rate" value={`${summary.returnRate}%`} color="#8b5cf6" />
          <Mini icon="▣" title="Active Plan" value={summary.activePlan} color="#ff9500" />
        </div>

      </div>
    </div>
  );
}

function Section({ title }) {
  return (
    <div style={styles.section}>
      <span></span>
      <h2>{title}</h2>
      <span></span>
    </div>
  );
}

function Coming({ icon, title, text, bg, onClick }) {
  return (
    <button style={{ ...styles.coming, ...bg }} onClick={onClick}>
      <div style={styles.ribbon}>Coming Soon</div>
      <div style={styles.cIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div style={styles.cBtn}>⏱ Coming Soon</div>
    </button>
  );
}

function Mini({ icon, title, value, color }) {
  return (
    <div style={styles.mini}>
      <span style={{ background: color }}>{icon}</span>
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
    background: "#f7f8ff",
    padding: "16px",
    fontFamily: "Arial, sans-serif",
    color: "#101a3a"
  },

  wrap: {
    maxWidth: "940px",
    margin: "0 auto"
  },

  hero: {
    height: "230px",
    borderRadius: "30px",
    background: "linear-gradient(135deg,#4d2df4,#8c34f5,#aa37f2)",
    position: "relative",
    overflow: "hidden",
    padding: "38px 46px",
    color: "white",
    boxShadow: "0 18px 40px rgba(96,57,239,.28)"
  },

  heroText: { position: "relative", zIndex: 3 },

  heroLabel: {
    margin: 0,
    fontSize: "20px",
    opacity: 0.95
  },

  heroAmount: {
    margin: "18px 0 8px",
    fontSize: "50px",
    fontWeight: "900",
    letterSpacing: "1px"
  },

  gain: {
    margin: 0,
    color: "#31e68d",
    fontSize: "23px",
    fontWeight: "900"
  },

  allTime: {
    marginTop: "12px",
    fontSize: "19px",
    opacity: 0.9
  },

  graph: {
    position: "absolute",
    right: "38px",
    bottom: "28px",
    width: "330px",
    height: "170px",
    opacity: 0.28
  },

  arrow: {
    position: "absolute",
    right: "40px",
    top: "4px",
    fontSize: "110px",
    color: "white",
    transform: "rotate(0deg)"
  },

  bar1: { position: "absolute", bottom: 0, left: 0, width: 25, height: 50, background: "white", borderRadius: 8 },
  bar2: { position: "absolute", bottom: 0, left: 45, width: 25, height: 75, background: "white", borderRadius: 8 },
  bar3: { position: "absolute", bottom: 0, left: 90, width: 25, height: 105, background: "white", borderRadius: 8 },
  bar4: { position: "absolute", bottom: 0, left: 135, width: 25, height: 130, background: "white", borderRadius: 8 },
  bar5: { position: "absolute", bottom: 0, left: 180, width: 25, height: 155, background: "white", borderRadius: 8 },

  pigStage: {
    position: "absolute",
    right: "150px",
    top: "38px",
    width: "190px",
    height: "160px",
    borderRadius: "50%",
    background: "radial-gradient(circle,#fff2 0%,#fff0 70%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },

  pigFace: {
    fontSize: "112px",
    filter: "drop-shadow(0 16px 12px rgba(0,0,0,.25))"
  },

  coin: {
    position: "absolute",
    top: "0",
    right: "52px",
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#ffd34d,#ff9f00)",
    color: "#995000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: "900",
    border: "4px solid #ffe08a",
    zIndex: 5
  },

  quick: {
    height: "92px",
    background: "white",
    borderRadius: "28px",
    margin: "18px 4px 0",
    display: "grid",
    gridTemplateColumns: "1fr 1px 1fr",
    alignItems: "center",
    padding: "0 26px",
    boxShadow: "0 12px 30px rgba(16,24,40,.08)"
  },

  quickBtn: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    color: "#101a3a",
    textAlign: "left",
    cursor: "pointer"
  },

  walletIcon: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#7537f4,#9b4dff)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 25
  },

  investIcon: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#18d78b,#0bbf78)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 25
  },

  vLine: {
    height: "45px",
    background: "#d9deea"
  },

  section: {
    margin: "34px 0 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px"
  },

  section: {
    margin: "34px 0 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px"
  },

  activeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px"
  },

  saveCard: {
    background: "linear-gradient(135deg,#22d686,#00b972)",
    borderRadius: "26px",
    minHeight: "250px",
    padding: "22px",
    position: "relative",
    boxShadow: "0 14px 30px rgba(0,185,114,.28)"
  },

  oneCard: {
    background: "linear-gradient(135deg,#27a7ff,#0877ec)",
    borderRadius: "26px",
    minHeight: "250px",
    padding: "22px",
    position: "relative",
    boxShadow: "0 14px 30px rgba(8,119,236,.28)"
  },

  roundPic: {
    width: 118,
    height: 118,
    borderRadius: "50%",
    background: "white",
    position: "absolute",
    top: "28px",
    left: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 26px rgba(0,0,0,.18)"
  },

  plantIcon: { fontSize: 64 },
  rocketIcon: { fontSize: 64 },

  smallCoin: {
    position: "absolute",
    bottom: "8px",
    right: "13px",
    background: "#ffcf32",
    color: "#a75b00",
    width: 35,
    height: 35,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  planText: {
    marginLeft: "155px",
    color: "white"
  },

  planText: {
    marginLeft: "155px",
    color: "white"
  },

  planBtnGreen: {
    position: "absolute",
    left: "22px",
    right: "22px",
    bottom: "18px",
    height: "52px",
    border: "none",
    borderRadius: "16px",
    background: "white",
    color: "#14b873",
    fontSize: "20px",
    fontWeight: "900",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "18px"
  },

  planBtnBlue: {
    position: "absolute",
    left: "22px",
    right: "22px",
    bottom: "18px",
    height: "52px",
    border: "none",
    borderRadius: "16px",
    background: "white",
    color: "#0877ec",
    fontSize: "20px",
    fontWeight: "900",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "18px"
  },

  comingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "18px"
  },

  coming: {
    height: "220px",
    border: "none",
    borderRadius: "24px",
    padding: "20px",
    position: "relative",
    textAlign: "left",
    boxShadow: "0 10px 28px rgba(16,24,40,.08)",
    overflow: "hidden",
    cursor: "pointer"
  },

  ribbon: {
    position: "absolute",
    top: 0,
    left: 22,
    background: "linear-gradient(135deg,#9b5cf7,#b65cff)",
    color: "white",
    padding: "8px 17px",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    fontSize: 14,
    fontWeight: "900"
  },

  cIcon: {
    fontSize: 58,
    marginTop: 42,
    float: "left",
    marginRight: 16
  },

  cBtn: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 14,
    background: "rgba(155,92,247,.10)",
    borderRadius: 15,
    padding: "11px",
    color: "#7c3aed",
    textAlign: "center",
    fontWeight: "900"
  },

  gold: { background: "linear-gradient(135deg,#fff6d6,#fffaf0)" },
  silver: { background: "linear-gradient(135deg,#f6f8ff,#ffffff)" },
  rd: { background: "linear-gradient(135deg,#fff0ec,#fff9f6)" },

  motive: {
    marginTop: "24px",
    height: "130px",
    borderRadius: "26px",
    background: "linear-gradient(135deg,#2500a8,#4300d8,#120082)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    boxShadow: "0 15px 30px rgba(37,0,168,.22)"
  },

  trophy: { fontSize: 72 },
  motiveGraph: { fontSize: 70, color: "#b467ff" },

  stats: {
    height: "85px",
    background: "white",
    marginTop: "20px",
    borderRadius: "25px",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    boxShadow: "0 12px 30px rgba(16,24,40,.08)"
  },

  mini: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRight: "1px solid #e3e7f0"
  }
};