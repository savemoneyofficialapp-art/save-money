import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { API } from "../config";

export default function Refer() {
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [team, setTeam] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user?.kycStatus !== "approved") {
      alert("Please Complete Your KYC First");
      navigate("/kyc");
      return;
    }

    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetchWithAuth(`${API}/my-referrals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const d = await res.json();

      if (d.msg === "Token expired or invalid") {
        localStorage.clear();
        alert("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      setCode(d.myCode || d.referCode || "NO CODE");
      setTeam(Array.isArray(d.team) ? d.team : []);

    } catch (err) {
      console.log("REFER ERROR:", err);
      toast.error("Failed to load referral data");
    }
  };

  const referLink = `${window.location.origin}/register?ref=${code}`;

  const copyText = (text, msg) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  return (
    <div style={styles.container}>

      <div style={styles.overlay}>

        <h1 style={styles.title}>Refer & Earn</h1>
        <p style={styles.subtitle}>Share your code and grow your team</p>

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

        <div style={styles.socialRow}>
          <button style={styles.whatsapp}>WhatsApp</button>
          <button style={styles.telegram}>Telegram</button>
        </div>

        <div style={styles.bonusGrid}>
          <button style={styles.bonus} onClick={() => navigate("/performance-bonus")}>
            Performance Bonus
          </button>

          <button style={styles.bonus} onClick={() => navigate("/team-bonus")}>
            Team Bonus
          </button>

          <button style={styles.bonus} onClick={() => navigate("/royalty-bonus")}>
            Royalty Bonus
          </button>

          <button style={styles.treeBtn} onClick={() => navigate("/referral-tree")}>
            🌳 View 7 Level Referral Tree
          </button>
        </div>

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
                background: u.status === "Active" ? "#14532d" : "#7f1d1d",
                color: u.status === "Active" ? "#22c55e" : "#ef4444",
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
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundImage:
      "linear-gradient(rgba(2,6,23,0.82),rgba(2,6,23,0.95)), url('/network-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    color: "white",
    padding: "20px",
    fontFamily: "Arial"
  },

  overlay: {
    maxWidth: "900px",
    margin: "auto"
  },

  title: {
    textAlign: "center",
    color: "#22c55e",
    fontSize: "34px",
    marginBottom: "5px"
  },

  subtitle: {
    textAlign: "center",
    color: "#cbd5e1",
    marginBottom: "25px"
  },

  card: {
    background: "rgba(30,41,59,0.88)",
    padding: "16px",
    borderRadius: "18px",
    marginTop: "14px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
    border: "1px solid #334155",
    backdropFilter: "blur(10px)"
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
    fontSize: "24px",
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
    fontWeight: "bold"
  },

  telegram: {
    flex: 1,
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    background: "#229ED9",
    color: "white",
    fontWeight: "bold"
  },

  bonusGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "18px"
  },

  bonus: {
    padding: "14px",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#0ea5e9,#2563eb)",
    color: "white",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer"
  },

  treeBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "5px",
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
    background: "rgba(30,41,59,0.88)",
    padding: "14px",
    borderRadius: "12px",
    color: "#94a3b8",
    textAlign: "center"
  },

  historyCard: {
    background: "rgba(30,41,59,0.9)",
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

  status: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "12px"
  }
};