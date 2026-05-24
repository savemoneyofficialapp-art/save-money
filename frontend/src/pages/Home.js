import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer";
import { BRAND } from "../brand";

const API =
  process.env.REACT_APP_API ||
  "https://save-money-yyv1.onrender.com";
  
const SAFE_BRAND = BRAND || {
  appName: "Save Money",
  slogan: "Save & Earn",
  logo: "/logo.png"
};

export default function Home() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  let savedUser = {};

  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      savedUser = JSON.parse(storedUser);
    }
  } catch (err) {
    savedUser = {};
  }

  const [user, setUser] = useState(savedUser);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadUser();
    loadNotifications();
  }, []);

  const sessionExpired = () => {
    localStorage.clear();
    alert("Session expired. Please login again.");
    window.location.href = "/login";
  };

  const loadUser = async () => {
    try {
      const res = await fetch(`${API}/user-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.msg === "Token expired or invalid") {
        sessionExpired();
        return;
      }

      if (data && data.email) {
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      }
    } catch (err) {
      console.log("User data not loaded");
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.msg === "Token expired or invalid") {
        sessionExpired();
        return;
      }

      if (Array.isArray(data)) {
        setNotificationCount(data.filter((n) => !n.read).length);
      }
    } catch {
      setNotificationCount(0);
    }
  };

  const checkKYC = async () => {
    try {
      const res = await fetch(`${API}/user-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const latest = await res.json();

      if (latest && latest.email) {
        setUser(latest);
        localStorage.setItem("user", JSON.stringify(latest));

        if (latest.kycStatus === "approved") {
          return true;
        }
      }

      alert("Please Complete Your KYC First");
      navigate("/kyc");
      return false;
    } catch {
      if (user?.kycStatus === "approved") return true;

      alert("Please Complete Your KYC First");
      navigate("/kyc");
      return false;
    }
  };

  const goSaveMoney = async () => {
    const ok = await checkKYC();
    if (ok) navigate("/save-money");
  };

  const goRefer = async () => {
    const ok = await checkKYC();
    if (ok) navigate("/refer");
  };

  const goOneTime = async () => {
    const ok = await checkKYC();
    if (ok) alert("One Time Coming Soon");
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const getRankColor = (rank) => {
    if (rank === "Bronze") return "#cd7f32";
    if (rank === "Silver") return "#cbd5e1";
    if (rank === "Gold") return "#facc15";
    if (rank === "Diamond") return "#38bdf8";
    if (rank === "Crown") return "#a855f7";
    return "#22c55e";
  };

  const getRankIcon = (rank) => {
    if (rank === "Bronze") return "🥉";
    if (rank === "Silver") return "🥈";
    if (rank === "Gold") return "🥇";
    if (rank === "Diamond") return "💎";
    if (rank === "Crown") return "👑";
    return "⭐";
  };

  return (
    <div style={styles.container}>

      <div style={styles.topGlass}>

        <div style={styles.brandHeader}>
          <img
            src={SAFE_BRAND.logo}
            alt="logo"
            style={styles.brandLogo}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <div>
            <h2 style={styles.brandName}>{SAFE_BRAND.appName}</h2>
            <p style={styles.brandSlogan}>{SAFE_BRAND.slogan}</p>
          </div>
        </div>

        <div style={styles.profileRow}>
          <div>
            <h2 style={styles.welcome}>
              Welcome {user?.name || savedUser?.name || "User"}
              {user?.kycStatus === "approved" && (
                <span style={styles.badge}>✔</span>
              )}
            </h2>

            <p style={styles.userEmail}>{email}</p>
          </div>

          <div style={styles.headerBtns}>
            <button style={styles.iconBtn} onClick={() => navigate("/notifications")}>
              🔔
              {notificationCount > 0 && (
                <span style={styles.count}>{notificationCount}</span>
              )}
            </button>

            <button style={styles.kycBtn} onClick={() => navigate("/kyc")}>
              KYC
            </button>
          </div>
        </div>

      </div>

      <div style={styles.rankCard}>
        <div>
          <p style={styles.rankLabel}>YOUR RANK</p>

          <h2 style={{ ...styles.rankName, color: getRankColor(user?.rank) }}>
            {getRankIcon(user?.rank)} {user?.rank || "Starter"}
          </h2>
        </div>

        <div style={styles.rankRight}>
          <h2>{user?.totalDirect || 0}</h2>
          <span>Direct</span>
        </div>
      </div>

      <div style={styles.hero}>
        <span style={styles.heroTag}>PREMIUM INVESTMENT PLATFORM</span>
        <h1>Grow Your Money</h1>
        <p>Invest smart. Refer more. Earn better.</p>
      </div>

      <div style={styles.mainCard}>
        <h2 style={styles.sectionTitle}>INVEST</h2>

        <button style={styles.saveBtn} onClick={goSaveMoney}>
          <span>💚</span>
          <div>
            <b>SAVE MONEY</b>
            <small>Monthly SIP plan</small>
          </div>
        </button>

        <button style={styles.oneTimeBtn} onClick={goOneTime}>
          <span>⚡</span>
          <div>
            <b>ONE TIME</b>
            <small>Coming investment plan</small>
          </div>
        </button>
      </div>

      <div style={styles.mainCard}>
        <h3 style={styles.coming}>COMING SOON</h3>

        <button style={styles.goldBtn}>🏆 INVEST GOLD</button>
        <button style={styles.silverBtn}>🥈 INVEST SILVER</button>
        <button style={styles.rdBtn}>🔁 RECURRING DEPOSIT</button>
      </div>

      <div style={styles.quickGrid}>
        <button style={styles.dailyBtn} onClick={() => navigate("/daily-reward")}>
          🎁 Daily Reward
        </button>

        <button style={styles.assistantBtn} onClick={() => navigate("/assistant")}>
          🤖 Assistant
        </button>

        <button style={styles.supportBtn} onClick={() => navigate("/support")}>
          💬 Support
        </button>

        <button style={styles.leaderBtn} onClick={() => navigate("/leaderboard")}>
          🏆 Leaderboard
        </button>

        <button style={styles.analyticsBtn} onClick={() => navigate("/analytics")}>
          📊 Analytics
        </button>

        <button style={styles.aboutBtn} onClick={() => navigate("/about")}>
          🏢 About
        </button>
      </div>

      <h2 style={styles.help}>HELP OTHER FOR EARN</h2>

      <button style={styles.logoutBtn} onClick={logout}>
        🚪 Logout
      </button>

      <Footer />

      <div style={styles.bottomNav}>
        <button style={styles.homeNav} onClick={() => navigate("/home")}>
          🏠 HOME
        </button>

        <button style={styles.walletNav} onClick={() => navigate("/wallet")}>
          💰 WALLET
        </button>

        <button style={styles.referNav} onClick={goRefer}>
          👥 REFER
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundImage:
      "linear-gradient(rgba(2,6,23,0.88), rgba(15,23,42,0.92)), url('/network-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    color: "white",
    padding: "20px",
    paddingBottom: "105px"
  },

  topGlass: {
    background: "rgba(15,23,42,0.82)",
    border: "1px solid rgba(148,163,184,0.25)",
    borderRadius: "24px",
    padding: "16px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
    backdropFilter: "blur(14px)"
  },

  brandHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "linear-gradient(135deg,rgba(34,197,94,0.18),rgba(59,130,246,0.15))",
    padding: "14px",
    borderRadius: "20px",
    border: "1px solid rgba(34,197,94,0.35)"
  },

  brandLogo: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    objectFit: "cover",
    background: "#0f172a",
    border: "1px solid #334155"
  },

  brandName: {
    margin: 0,
    color: "#22c55e",
    fontSize: "23px",
    fontWeight: "900"
  },

  brandSlogan: {
    margin: "4px 0 0",
    color: "#38bdf8",
    fontSize: "13px",
    fontWeight: "bold"
  },

  profileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
    gap: "12px"
  },

  welcome: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "900"
  },

  userEmail: {
    margin: "6px 0 0",
    color: "#94a3b8",
    fontSize: "12px"
  },

  badge: {
    background: "linear-gradient(135deg,#2563eb,#38bdf8)",
    color: "white",
    borderRadius: "50%",
    padding: "3px 8px",
    marginLeft: "8px",
    fontSize: "13px",
    boxShadow: "0 0 12px rgba(59,130,246,0.8)"
  },

  headerBtns: {
    display: "flex",
    gap: "9px",
    alignItems: "center"
  },

  iconBtn: {
    position: "relative",
    background: "linear-gradient(135deg,#1e293b,#0f172a)",
    color: "white",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "12px",
    fontSize: "18px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.35)"
  },

  count: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#ef4444",
    color: "white",
    borderRadius: "50%",
    padding: "2px 6px",
    fontSize: "10px"
  },

  kycBtn: {
    background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "16px",
    padding: "12px 16px",
    fontWeight: "900",
    boxShadow: "0 10px 22px rgba(59,130,246,0.35)"
  },

  rankCard: {
    marginTop: "18px",
    background: "linear-gradient(135deg,rgba(30,41,59,0.95),rgba(2,6,23,0.96))",
    border: "1px solid rgba(250,204,21,0.35)",
    borderRadius: "24px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 0 26px rgba(250,204,21,0.12)"
  },

  rankLabel: {
    color: "#94a3b8",
    fontSize: "12px",
    margin: 0,
    letterSpacing: "1px"
  },

  rankName: {
    margin: "6px 0 0",
    fontSize: "25px",
    fontWeight: "900"
  },

  rankRight: {
    textAlign: "center",
    background: "rgba(15,23,42,0.9)",
    padding: "10px 16px",
    borderRadius: "18px",
    border: "1px solid #334155"
  },

  hero: {
    marginTop: "22px",
    padding: "24px",
    borderRadius: "26px",
    background: "linear-gradient(135deg,#22c55e,#3b82f6,#8b5cf6)",
    color: "#020617",
    textAlign: "center",
    fontWeight: "bold",
    boxShadow: "0 20px 45px rgba(34,197,94,0.25)"
  },

  heroTag: {
    background: "rgba(2,6,23,0.85)",
    color: "#22c55e",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "11px"
  },

  mainCard: {
    background: "rgba(30,41,59,0.92)",
    marginTop: "22px",
    padding: "18px",
    borderRadius: "24px",
    border: "1px solid rgba(148,163,184,0.22)",
    boxShadow: "0 18px 38px rgba(0,0,0,0.35)",
    backdropFilter: "blur(12px)"
  },

  sectionTitle: {
    textAlign: "center",
    color: "#22c55e",
    letterSpacing: "2px"
  },

  saveBtn: {
    width: "100%",
    padding: "17px",
    marginTop: "12px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#020617",
    fontWeight: "900",
    fontSize: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 24px rgba(34,197,94,0.3)"
  },

  oneTimeBtn: {
    width: "100%",
    padding: "17px",
    marginTop: "12px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#06b6d4,#2563eb)",
    color: "white",
    fontWeight: "900",
    fontSize: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 24px rgba(59,130,246,0.3)"
  },

  coming: {
    textAlign: "center",
    color: "#94a3b8",
    letterSpacing: "1px"
  },

  goldBtn: premiumButton("linear-gradient(135deg,#facc15,#f59e0b)", "#020617"),
  silverBtn: premiumButton("linear-gradient(135deg,#cbd5e1,#64748b)", "white"),
  rdBtn: premiumButton("linear-gradient(135deg,#a855f7,#7c3aed)", "white"),

  quickGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "22px"
  },

  dailyBtn: smallPremium("linear-gradient(135deg,#f97316,#facc15)", "#020617"),
  assistantBtn: smallPremium("linear-gradient(135deg,#0ea5e9,#2563eb)", "white"),
  supportBtn: smallPremium("linear-gradient(135deg,#06b6d4,#0f766e)", "white"),
  leaderBtn: smallPremium("linear-gradient(135deg,#facc15,#f59e0b)", "#020617"),
  analyticsBtn: smallPremium("linear-gradient(135deg,#8b5cf6,#7c3aed)", "white"),
  aboutBtn: smallPremium("linear-gradient(135deg,#14b8a6,#0f766e)", "white"),

  help: {
    textAlign: "center",
    color: "#22c55e",
    marginTop: "28px",
    fontSize: "21px",
    fontWeight: "900",
    textShadow: "0 0 18px rgba(34,197,94,0.45)"
  },

  logoutBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "16px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#ef4444,#991b1b)",
    color: "white",
    fontWeight: "900",
    boxShadow: "0 12px 24px rgba(239,68,68,0.28)"
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    background: "rgba(2,6,23,0.96)",
    borderTop: "1px solid rgba(148,163,184,0.25)",
    display: "flex",
    gap: "8px",
    padding: "10px",
    boxShadow: "0 -10px 30px rgba(0,0,0,0.45)",
    backdropFilter: "blur(14px)",
    zIndex: 999
  },

  homeNav: navButton("linear-gradient(135deg,#22c55e,#16a34a)", "#020617"),
  walletNav: navButton("linear-gradient(135deg,#3b82f6,#1d4ed8)", "white"),
  referNav: navButton("linear-gradient(135deg,#f59e0b,#f97316)", "#020617")
};

function premiumButton(bg, color) {
  return {
    width: "100%",
    padding: "15px",
    marginTop: "10px",
    border: "none",
    borderRadius: "17px",
    background: bg,
    color,
    fontWeight: "900",
    fontSize: "15px",
    boxShadow: "0 12px 24px rgba(0,0,0,0.25)"
  };
}

function smallPremium(bg, color) {
  return {
    padding: "15px",
    border: "none",
    borderRadius: "18px",
    background: bg,
    color,
    fontWeight: "900",
    fontSize: "14px",
    minHeight: "58px",
    boxShadow: "0 12px 24px rgba(0,0,0,0.28)"
  };
}

function navButton(bg, color) {
  return {
    flex: 1,
    padding: "13px 8px",
    border: "none",
    borderRadius: "16px",
    background: bg,
    color,
    fontWeight: "900",
    fontSize: "12px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.35)"
  };
}