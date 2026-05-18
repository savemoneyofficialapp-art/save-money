import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer";

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

  const loadUser = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API}/user-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

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
      const res = await fetch(`${process.env.REACT_APP_API}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setNotificationCount(data.filter((n) => !n.read).length);
      }
    } catch {
      setNotificationCount(0);
    }
  };

  const checkKYC = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API}/user-data`, {
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

  if(rank === "Bronze")
    return "#cd7f32";

  if(rank === "Silver")
    return "#cbd5e1";

  if(rank === "Gold")
    return "#facc15";

  if(rank === "Diamond")
    return "#38bdf8";

  if(rank === "Crown")
    return "#a855f7";

  return "#22c55e";
};

const getRankIcon = (rank) => {

  if(rank === "Bronze")
    return "🥉";

  if(rank === "Silver")
    return "🥈";

  if(rank === "Gold")
    return "🥇";

  if(rank === "Diamond")
    return "💎";

  if(rank === "Crown")
    return "👑";

  return "⭐";
};

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <div>
          <h2 style={styles.welcome}>
            Welcome {user?.name || savedUser?.name || "User"}

            {user?.kycStatus === "approved" && (
              <span style={styles.badge}>✔</span>
            )}
          </h2>

          <p style={styles.slogan}>Save & Earn</p>
        </div>

        <div style={styles.rankCard}>

  <div>
    <p style={styles.rankLabel}>
      YOUR RANK
    </p>

    <h2 style={{
      ...styles.rankName,
      color: getRankColor(user?.rank)
    }}>
      {getRankIcon(user?.rank)} {user?.rank || "Starter"}
    </h2>
  </div>

  <div style={styles.rankRight}>
    <p>{user?.totalDirect || 0}</p>
    <span>Direct</span>
  </div>

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

      <div style={styles.hero}>
        <h1>Grow Your Money</h1>
        <p>Invest smart. Refer more. Earn better.</p>
      </div>

      <div style={styles.mainCard}>
        <h2 style={styles.sectionTitle}>INVEST</h2>

        <button style={styles.saveBtn} onClick={goSaveMoney}>
          SAVE MONEY
        </button>

        <button style={styles.oneTimeBtn} onClick={goOneTime}>
          ONE TIME
        </button>
      </div>

      <div style={styles.mainCard}>
        <h3 style={styles.coming}>COMING SOON</h3>

        <button style={styles.goldBtn}>INVEST GOLD</button>
        <button style={styles.silverBtn}>INVEST SILVER</button>
        <button style={styles.rdBtn}>RECURRING DEPOSIT</button>
      </div>

      <button style={styles.leaderBtn} onClick={() => navigate("/daily-reward")}>
  🎁 Daily Reward
</button>

<button style={styles.leaderBtn} onClick={() => navigate("/assistant")}>
  🤖 Investment Assistant
</button>

<button
  style={styles.supportBtn}
  onClick={() => navigate("/support")}
>
  💬 Live Support
</button>

      <h2 style={styles.help}>HELP OTHER FOR EARN</h2>

      <button style={styles.logoutBtn} onClick={logout}>
        Logout
      </button>
     
      <button
  style={styles.leaderBtn}
  onClick={() => navigate("/leaderboard")}
>
  🏆 Leaderboard
</button>

<button
  style={styles.analyticsBtn}
  onClick={() => navigate("/analytics")}
>
  📊 My Analytics
</button>

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

      <Footer />

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
    color: "white",
    padding: "18px",
    paddingBottom: "95px",
    fontFamily: "Arial"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  welcome: {
    margin: 0,
    fontSize: "24px"
  },
  slogan: {
    marginTop: "5px",
    color: "#22c55e",
    fontWeight: "bold"
  },

  rankCard:{
  marginTop:"20px",
  background:"linear-gradient(135deg,#1e293b,#020617)",
  border:"1px solid #334155",
  borderRadius:"20px",
  padding:"18px",
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  boxShadow:"0 0 20px rgba(0,0,0,0.35)"
},

rankLabel:{
  color:"#94a3b8",
  fontSize:"12px",
  marginBottom:"5px"
},

rankName:{
  margin:0,
  fontSize:"24px",
  fontWeight:"bold"
},

rankRight:{
  textAlign:"center",
  fontWeight:"bold"
},

  badge: {
    background: "#2563eb",
    color: "white",
    borderRadius: "50%",
    padding: "3px 8px",
    marginLeft: "8px",
    fontSize: "13px"
  },
  headerBtns: {
    display: "flex",
    gap: "10px"
  },
  iconBtn: {
    position: "relative",
    background: "#1e293b",
    color: "white",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "11px",
    fontSize: "18px"
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
    background: "linear-gradient(135deg,#3b82f6,#2563eb)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "11px 15px",
    fontWeight: "bold"
  },
  hero: {
    marginTop: "25px",
    padding: "22px",
    borderRadius: "22px",
    background: "linear-gradient(135deg,#22c55e,#3b82f6)",
    color: "#020617",
    textAlign: "center",
    fontWeight: "bold"
  },
  mainCard: {
    background: "rgba(30,41,59,0.95)",
    marginTop: "22px",
    padding: "18px",
    borderRadius: "22px",
    boxShadow: "0 0 20px rgba(0,0,0,0.35)"
  },
  sectionTitle: {
    textAlign: "center",
    color: "#22c55e"
  },
  saveBtn: {
    width: "100%",
    padding: "16px",
    marginTop: "12px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#020617",
    fontWeight: "bold",
    fontSize: "16px"
  },
  oneTimeBtn: {
    width: "100%",
    padding: "16px",
    marginTop: "12px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#06b6d4,#2563eb)",
    color: "white",
    fontWeight: "bold",
    fontSize: "16px"
  },
  coming: {
    textAlign: "center",
    color: "#94a3b8"
  },
  goldBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "10px",
    border: "none",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#facc15,#f59e0b)",
    fontWeight: "bold"
  },
  silverBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "10px",
    border: "none",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#cbd5e1,#64748b)",
    color: "white",
    fontWeight: "bold"
  },
  rdBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "10px",
    border: "none",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#a855f7,#7c3aed)",
    color: "white",
    fontWeight: "bold"
  },
  help: {
    textAlign: "center",
    color: "#22c55e",
    marginTop: "25px"
  },
  logoutBtn: {
    width: "100%",
    padding: "14px",
    marginTop: "15px",
    border: "none",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#ef4444,#b91c1c)",
    color: "white",
    fontWeight: "bold"
  },

  supportBtn: {
  width: "100%",
  padding: "15px",
  marginTop: "12px",
  border: "none",
  borderRadius: "15px",
  background: "linear-gradient(135deg,#06b6d4,#2563eb)",
  color: "white",
  fontWeight: "bold",
  fontSize: "15px"
},

leaderBtn:{
  width:"100%",
  padding:"15px",
  marginTop:"12px",
  border:"none",
  borderRadius:"15px",
  background:
  "linear-gradient(135deg,#facc15,#f59e0b)",
  color:"#020617",
  fontWeight:"bold"
},

analyticsBtn:{
  width:"100%",
  padding:"15px",
  marginTop:"12px",
  border:"none",
  borderRadius:"15px",
  background:
    "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color:"white",
  fontWeight:"bold",
  fontSize:"15px"
},

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    background: "#020617",
    borderTop: "1px solid #334155",
    display: "flex",
    gap: "8px",
    padding: "10px"
  },
  homeNav: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "14px",
    background: "#22c55e",
    color: "#020617",
    fontWeight: "bold"
  },
  walletNav: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "14px",
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold"
  },
  referNav: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "14px",
    background: "#f59e0b",
    color: "#020617",
    fontWeight: "bold"
  }
};