import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchWithAuth }
from "../utils/fetchWithAuth";
import axios from "axios";
import { API } from "../config";



export default function Refer() {
  const email = localStorage.getItem("email");
  const referCode = localStorage.getItem("referCode") || "----";
  const navigate = useNavigate();

  useEffect(() => {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  if (user?.SaveMoney !== "activete") {

    toast.error("Please Invest SaveMoney First");

    navigate("/save-money");
    return false;

  }

}, []);

  const [code, setCode] = useState("");
  const [team, setTeam] = useState([]);
  const [history, setHistory] = useState([]);


  useEffect(() => {
    load();
  }, []);

  const load = async () => {
  const res = await fetchWithAuth(`${API}/my-referrals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  const d = await res.json();

  if (d.msg === "Token expired or invalid") {
    localStorage.clear();
    toast.error("Session expired. Please login again.");
    window.location.href = "/login";
    return;
  }

  setCode(d.myCode || d.referCode || "NO CODE");
  setTeam(d.team || []);
};
  

const referLink = `${window.location.origin}/register?ref=${code}`;

  const copyText = (text, msg) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>Refer & Earn</h1>
      <p style={styles.subtitle}>Share your code and grow your team</p>

      {/* REF CODE */}
      <div style={styles.card}>
        <p style={styles.label}>UNIQUE REFER CODE</p>

        <div style={styles.copyBox}>
          <span style={styles.codeText}>{code || "----"}</span>

          <button
            style={styles.copyBtn}
            onClick={() => copyText(code, "Refer code copied")}
          >
            Copy
          </button>
        </div>
      </div>

      {/* REF LINK */}
      <div style={styles.card}>
        <p style={styles.label}>REFER LINK WITH CODE</p>

        <div style={styles.linkBox}>
          <p style={styles.linkText}>{referLink}</p>

          <button
            style={styles.copyBtnBlue}
            onClick={() => copyText(referLink, "Refer link copied")}
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* SOCIAL BUTTONS */}
      <div style={styles.socialRow}>
        <button style={styles.whatsapp}>WhatsApp</button>
        <button style={styles.telegram}>Telegram</button>
      </div>

      {/* BONUS BUTTONS */}
      <div style={styles.bonusGrid}>
        <button
  style={styles.bonus}
  onClick={() => {
    toast.success("Open Performance Bonus");
        navigate("/performance-bonus");
  }}
>
  Performance Bonus
</button>
        <button
  style={styles.bonus}
  onClick={() => {
    toast.success("Open Team Bonus");
         navigate("/team-bonus");
  }}
>
  Team Bonus
</button>
        <button
  style={styles.bonus}
  onClick={() => {
    toast.success("Open Royalty Bonus");
        navigate("/royalty-bonus");
  }}
>
  Royality Bonus
</button>

<button
  style={styles.treeBtn}
  onClick={() =>{toast.success("Open Referral tree");
   navigate("/referral-tree");
  }}
>
  🌳 View 7 Level Referral Tree
</button>
      </div>

      {/* HISTORY */}
      <h3 style={styles.historyTitle}>Referral History</h3>

      {team.length === 0 && (
        <div style={styles.empty}>No referrals yet</div>
      )}

      {team.map((u, i) => (
        <div key={i} style={styles.historyCard}>
          <div>
            <p style={styles.name}>{u.name}</p>
            <p style={styles.date}>
              Joined: {new Date(u.date).toLocaleDateString()}
            </p>
          </div>

          <span
  style={{
    ...styles.status,

    background:
      u.status === "Active"
        ? "#14532d"
        : "#7f1d1d",

    color:
      u.status === "Active"
        ? "#22c55e"
        : "#ef4444",

    border:
      u.status === "Active"
        ? "1px solid #22c55e"
        : "1px solid #ef4444"
  }}
>
            {u.status}
          </span>
        </div>
      ))}

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#111827)",
    color: "white",
    padding: "20px",
    fontFamily: "Arial"
  },

  title: {
    textAlign: "center",
    color: "#22c55e",
    fontSize: "32px",
    marginBottom: "5px"
  },

  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: "25px"
  },

  card: {
    background: "linear-gradient(135deg,#1e293b,#0f172a)",
    padding: "16px",
    borderRadius: "16px",
    marginTop: "14px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
    border: "1px solid #334155"
  },

  bonus:{
  flex:1,
  padding:"12px",
  borderRadius:"10px",
  background:"#3b82f6",
  color:"white",
  border:"none",
  fontWeight:"bold",
  cursor:"pointer"
},

  label: {
    fontSize: "12px",
    letterSpacing: "1px",
    color: "#94a3b8",
    marginBottom: "10px",
    fontWeight: "bold"
  },

  copyBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#020617",
    padding: "12px",
    borderRadius: "12px"
  },

  codeText: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#facc15"
  },

  linkBox: {
    background: "#020617",
    padding: "12px",
    borderRadius: "12px"
  },

  linkText: {
    fontSize: "12px",
    color: "#cbd5e1",
    wordBreak: "break-all",
    marginBottom: "10px"
  },

  copyBtn: {
    padding: "9px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#22c55e",
    color: "#02130a",
    fontWeight: "bold",
    cursor: "pointer"
  },

  copyBtnBlue: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    background: "#38bdf8",
    color: "#082f49",
    fontWeight: "bold",
    cursor: "pointer"
  },

  socialRow: {
    display: "flex",
    gap: "12px",
    marginTop: "14px"
  },

  whatsapp: {
    flex: 1,
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    background: "#25D366",
    color: "white",
    fontWeight: "bold",
    fontSize: "15px"
  },

  telegram: {
    flex: 1,
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    background: "#229ED9",
    color: "white",
    fontWeight: "bold",
    fontSize: "15px"
  },

  bonusGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "18px"
  },

  

  bonusPurple: {
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg,#7c3aed,#a855f7)",
    color: "white",
    fontWeight: "bold"
  },

  bonusGreen: {
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "white",
    fontWeight: "bold"
  },

  bonusGold: {
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg,#ca8a04,#facc15)",
    color: "#1c1917",
    fontWeight: "bold"
  },

  treeBtn: {
  width: "100%",
  padding: "15px",
  marginTop: "15px",
  border: "none",
  borderRadius: "15px",
  background: "linear-gradient(135deg,#22c55e,#16a34a)",
  color: "#020617",
  fontWeight: "bold"
},

  historyTitle: {
    marginTop: "25px",
    color: "#e2e8f0"
  },

  empty: {
    background: "#1e293b",
    padding: "14px",
    borderRadius: "12px",
    color: "#94a3b8",
    textAlign: "center"
  },

  historyCard: {
    background: "#1e293b",
    padding: "14px",
    marginTop: "10px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #334155"
  },

  name: {
    margin: 0,
    fontWeight: "bold"
  },

  date: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: "#94a3b8"
  },

  status:{
  padding:"6px 12px",
  borderRadius:"20px",
  fontWeight:"bold",
  fontSize:"12px"
},
};