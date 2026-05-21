import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer";

import { BRAND } from "../brand";
import axios from "axios";

const API = "https://save-money-yyv1.onrender.com";

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

      if (
  data.msg === "Token expired or invalid"
) {

  localStorage.clear();

  alert("Session expired. Please login again.");

  window.location.href = "/login";

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

if (
  data.msg === "Token expired or invalid"
) {

  localStorage.clear();

  alert("Session expired. Please login again.");

  window.location.href = "/login";

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

    <h2 style={styles.brandName}>
      {SAFE_BRAND.appName}
    </h2>

    <p style={styles.brandSlogan}>
      {SAFE_BRAND.slogan}
    </p>

  </div>

</div>
        <div>
          <h2 style={styles.welcome}>
            Welcome {user?.name || savedUser?.name || "User"}

            {user?.kycStatus === "approved" && (
              <span style={styles.badge}>✔</span>
            )}
          </h2>

          <p style={styles.slogan}></p>
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
          <button style={styles.logoutBtn} onClick={logout}>
        Logout
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

<button
  style={styles.aboutBtn}
  onClick={() => navigate("/about")}
>
  🏢 About Save Money
</button>



<h2 style={styles.help}>HELP OTHER FOR EARN</h2>

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
  container:{
    minHeight:"100vh",
    backgroundImage:
      "linear-gradient(rgba(2,6,23,0.88), rgba(15,23,42,0.92)), url('/network-bg.jpg')",
    backgroundSize:"cover",
    backgroundPosition:"center",
    backgroundRepeat:"no-repeat",
    backgroundAttachment:"fixed",
    color:"white",
    padding:"20px",
    paddingBottom:"95px"
  },

  header:{
    display:"flex",
    flexDirection:"column",
    gap:"14px"
  },

  brandHeader:{
    display:"flex",
    alignItems:"center",
    gap:"12px",
    background:"linear-gradient(135deg,#0f172a,#1e293b)",
    padding:"14px",
    borderRadius:"20px",
    border:"1px solid #334155",
    boxShadow:"0 0 20px rgba(34,197,94,0.15)"
  },

  brandLogo:{
    width:"55px",
    height:"55px",
    borderRadius:"16px",
    objectFit:"cover",
    background:"#0f172a",
    border:"2px solid #22c55e"
  },

  brandName:{
    margin:0,
    color:"#22c55e",
    fontSize:"23px",
    fontWeight:"900"
  },

  brandSlogan:{
    margin:0,
    color:"#38bdf8",
    fontSize:"13px",
    fontWeight:"bold"
  },

  welcome:{
    margin:0,
    fontSize:"25px",
    fontWeight:"900"
  },

  slogan:{
    marginTop:"5px",
    color:"#22c55e",
    fontWeight:"bold"
  },

  badge:{
    background:"linear-gradient(135deg,#2563eb,#38bdf8)",
    color:"white",
    borderRadius:"50%",
    padding:"3px 8px",
    marginLeft:"8px",
    fontSize:"13px",
    boxShadow:"0 0 12px rgba(59,130,246,0.8)"
  },

  rankCard:{
    background:"linear-gradient(135deg,#1e293b,#020617)",
    border:"1px solid #334155",
    borderRadius:"22px",
    padding:"18px",
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    boxShadow:"0 0 24px rgba(168,85,247,0.2)"
  },

  rankLabel:{
    color:"#94a3b8",
    fontSize:"12px",
    marginBottom:"5px",
    letterSpacing:"1px"
  },

  rankName:{
    margin:0,
    fontSize:"25px",
    fontWeight:"900"
  },

  rankRight:{
    textAlign:"center",
    fontWeight:"bold",
    background:"#0f172a",
    padding:"12px",
    borderRadius:"16px"
  },

  headerBtns:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr 1fr",
    gap:"10px"
  },

  iconBtn:{
    position:"relative",
    background:"linear-gradient(135deg,#f59e0b,#facc15)",
    color:"#020617",
    border:"none",
    borderRadius:"16px",
    padding:"13px",
    fontSize:"18px",
    fontWeight:"bold",
    boxShadow:"0 8px 18px rgba(245,158,11,0.35)"
  },

  count:{
    position:"absolute",
    top:"-6px",
    right:"-6px",
    background:"#ef4444",
    color:"white",
    borderRadius:"50%",
    padding:"3px 7px",
    fontSize:"10px"
  },

  kycBtn:{
    background:"linear-gradient(135deg,#3b82f6,#2563eb)",
    color:"white",
    border:"none",
    borderRadius:"16px",
    padding:"13px",
    fontWeight:"900",
    boxShadow:"0 8px 18px rgba(59,130,246,0.35)"
  },

  logoutBtn:{
    padding:"13px",
    border:"none",
    borderRadius:"16px",
    background:"linear-gradient(135deg,#ef4444,#b91c1c)",
    color:"white",
    fontWeight:"900",
    boxShadow:"0 8px 18px rgba(239,68,68,0.35)"
  },

  hero:{
    marginTop:"25px",
    padding:"24px",
    borderRadius:"26px",
    background:"linear-gradient(135deg,#22c55e,#38bdf8,#3b82f6)",
    color:"#020617",
    textAlign:"center",
    fontWeight:"900",
    boxShadow:"0 0 28px rgba(34,197,94,0.35)"
  },

  mainCard:{
    background:"rgba(15,23,42,0.92)",
    marginTop:"22px",
    padding:"20px",
    borderRadius:"24px",
    border:"1px solid #334155",
    boxShadow:"0 0 25px rgba(0,0,0,0.45)"
  },

  sectionTitle:{
    textAlign:"center",
    color:"#22c55e",
    letterSpacing:"2px",
    fontWeight:"900"
  },

  saveBtn:{
    width:"100%",
    padding:"17px",
    marginTop:"12px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#22c55e,#16a34a)",
    color:"#020617",
    fontWeight:"900",
    fontSize:"16px",
    boxShadow:"0 10px 22px rgba(34,197,94,0.35)"
  },

  oneTimeBtn:{
    width:"100%",
    padding:"17px",
    marginTop:"12px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#06b6d4,#2563eb)",
    color:"white",
    fontWeight:"900",
    fontSize:"16px",
    boxShadow:"0 10px 22px rgba(37,99,235,0.35)"
  },

  coming:{
    textAlign:"center",
    color:"#facc15",
    fontWeight:"900",
    letterSpacing:"1px"
  },

  goldBtn:{
    width:"100%",
    padding:"16px",
    marginTop:"10px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#facc15,#f59e0b)",
    color:"#020617",
    fontWeight:"900",
    boxShadow:"0 8px 18px rgba(250,204,21,0.35)"
  },

  silverBtn:{
    width:"100%",
    padding:"16px",
    marginTop:"10px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#e5e7eb,#64748b)",
    color:"#020617",
    fontWeight:"900",
    boxShadow:"0 8px 18px rgba(203,213,225,0.25)"
  },

  rdBtn:{
    width:"100%",
    padding:"16px",
    marginTop:"10px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#a855f7,#7c3aed)",
    color:"white",
    fontWeight:"900",
    boxShadow:"0 8px 18px rgba(168,85,247,0.35)"
  },

  leaderBtn:{
    width:"100%",
    padding:"16px",
    marginTop:"13px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#facc15,#f97316)",
    color:"#020617",
    fontWeight:"900",
    fontSize:"15px",
    boxShadow:"0 8px 18px rgba(249,115,22,0.35)"
  },

  supportBtn:{
    width:"100%",
    padding:"16px",
    marginTop:"13px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#06b6d4,#0ea5e9)",
    color:"white",
    fontWeight:"900",
    fontSize:"15px",
    boxShadow:"0 8px 18px rgba(14,165,233,0.35)"
  },

  analyticsBtn:{
    width:"100%",
    padding:"16px",
    marginTop:"13px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#8b5cf6,#ec4899)",
    color:"white",
    fontWeight:"900",
    fontSize:"15px",
    boxShadow:"0 8px 18px rgba(236,72,153,0.35)"
  },

  aboutBtn:{
    width:"100%",
    padding:"16px",
    marginTop:"13px",
    border:"none",
    borderRadius:"18px",
    background:"linear-gradient(135deg,#14b8a6,#0f766e)",
    color:"white",
    fontWeight:"900",
    fontSize:"15px",
    boxShadow:"0 8px 18px rgba(20,184,166,0.35)"
  },

  help:{
    textAlign:"center",
    color:"#22c55e",
    marginTop:"26px",
    fontWeight:"900",
    textShadow:"0 0 15px rgba(34,197,94,0.6)"
  },

  bottomNav:{
    position:"fixed",
    bottom:0,
    left:0,
    width:"100%",
    background:"rgba(2,6,23,0.96)",
    borderTop:"1px solid #334155",
    display:"flex",
    gap:"8px",
    padding:"10px",
    boxShadow:"0 -8px 25px rgba(0,0,0,0.5)",
    zIndex:999
  },

  homeNav:{
    flex:1,
    padding:"13px",
    border:"none",
    borderRadius:"16px",
    background:"linear-gradient(135deg,#22c55e,#16a34a)",
    color:"#020617",
    fontWeight:"900"
  },

  walletNav:{
    flex:1,
    padding:"13px",
    border:"none",
    borderRadius:"16px",
    background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",
    color:"white",
    fontWeight:"900"
  },

  referNav:{
    flex:1,
    padding:"13px",
    border:"none",
    borderRadius:"16px",
    background:"linear-gradient(135deg,#f59e0b,#f97316)",
    color:"#020617",
    fontWeight:"900"
  }
};