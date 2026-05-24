import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { API } from "../config";

export default function Refer() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const [code, setCode] = useState("");
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const kyc = (user?.kycStatus || localStorage.getItem("kycStatus") || "").toLowerCase();

    if (kyc !== "approved") {
      alert("Please Complete Your KYC First");
      navigate("/kyc");
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

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

      setCode(d.myCode || d.referCode || "");
      setTeam(Array.isArray(d.team) ? d.team : []);
    } catch (err) {
      console.log("REFER LOAD ERROR:", err);
      toast.error("Refer data loading failed");
    } finally {
      setLoading(false);
    }
  };

  const referLink = `${window.location.origin}/register?ref=${code}`;

  const copyText = (text, msg) => {
    if (!text) {
      toast.error("No code found");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent("Join Save Money using my refer link: " + referLink)}`,
      "_blank"
    );
  };

  const shareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referLink)}&text=${encodeURIComponent("Join Save Money")}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loaderCard}>
          <div style={styles.logo}>🔗</div>
          <h2>Loading Refer System</h2>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>

        <h1 style={styles.title}>💎 Refer & Earn</h1>
        <p style={styles.subtitle}>Share your code and grow your income network</p>

        <div style={styles.glowCard}>
          <p style={styles.label}>🎟 UNIQUE REFER CODE</p>

          <div style={styles.codeBox}>
            <span style={styles.codeText}>{code || "NO CODE"}</span>

            <button
              style={styles.copyBtn}
              onClick={() => copyText(code, "Refer code copied")}
            >
              📋 Copy
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <p style={styles.label}>🔗 REFER LINK WITH CODE</p>

          <div style={styles.linkBox}>
            <p style={styles.linkText}>{referLink}</p>

            <button
              style={styles.copyBtnBlue}
              onClick={() => copyText(referLink, "Refer link copied")}
            >
              📎 Copy Link
            </button>
          </div>
        </div>

        <div style={styles.socialRow}>
          <button style={styles.whatsapp} onClick={shareWhatsApp}>
            🟢 WhatsApp
          </button>

          <button style={styles.telegram} onClick={shareTelegram}>
            🔵 Telegram
          </button>
        </div>

        <div style={styles.bonusGrid}>
          <button
            style={styles.performance}
            onClick={() => navigate("/performance-bonus")}
          >
            🚀 Performance Bonus
          </button>

          <button
            style={styles.team}
            onClick={() => navigate("/team-bonus")}
          >
            👥 Team Bonus
          </button>

          <button
            style={styles.royalty}
            onClick={() => navigate("/royalty-bonus")}
          >
            👑 Royalty Bonus
          </button>

          <button
            style={styles.treeBtn}
            onClick={() => navigate("/referral-tree")}
          >
            🌳 View 7 Level Referral Tree
          </button>
        </div>

        <h3 style={styles.historyTitle}>📜 Referral History</h3>

        {team.length === 0 && (
          <div style={styles.empty}>No referrals yet</div>
        )}

        {team.map((u, i) => (
          <div key={i} style={styles.historyCard}>
            <div>
              <p style={styles.name}>👤 {u.name}</p>
              <p style={styles.date}>
                Joined: {u.date ? new Date(u.date).toLocaleDateString() : "N/A"}
              </p>
            </div>

            <span
              style={{
                ...styles.status,
                background:
                  u.status === "Active" ? "#14532d" : "#7f1d1d",
                color:
                  u.status === "Active" ? "#22c55e" : "#ef4444",
                border:
                  u.status === "Active"
                    ? "1px solid #22c55e"
                    : "1px solid #ef4444"
              }}
            >
              {u.status || "Inactive"}
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
      "linear-gradient(rgba(2,6,23,0.88), rgba(2,6,23,0.94)), url('/network-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "white",
    padding: "18px",
    fontFamily: "Arial"
  },

  overlay: {
    maxWidth: "850px",
    margin: "auto"
  },

  title: {
    textAlign: "center",
    color: "#22c55e",
    fontSize: "36px",
    marginBottom: "6px"
  },

  subtitle: {
    textAlign: "center",
    color: "#93c5fd",
    marginBottom: "25px",
    fontWeight: "bold"
  },

  card: {
    background: "rgba(15,23,42,0.92)",
    padding: "18px",
    borderRadius: "20px",
    marginTop: "16px",
    border: "1px solid rgba(56,189,248,0.25)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.45)"
  },

  glowCard: {
    background: "linear-gradient(135deg,rgba(30,41,59,0.96),rgba(2,6,23,0.96))",
    padding: "20px",
    borderRadius: "22px",
    marginTop: "16px",
    border: "1px solid rgba(34,197,94,0.45)",
    boxShadow: "0 0 35px rgba(34,197,94,0.25)"
  },

  label: {
    fontSize: "13px",
    letterSpacing: "1px",
    color: "#cbd5e1",
    marginBottom: "12px",
    fontWeight: "bold"
  },

  codeBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#020617",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid #334155"
  },

  codeText: {
    fontSize: "26px",
    fontWeight: "bold",
    color: "#facc15"
  },

  linkBox: {
    background: "#020617",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #334155"
  },

  linkText: {
    fontSize: "13px",
    color: "#e2e8f0",
    wordBreak: "break-all",
    marginBottom: "12px"
  },

  copyBtn: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#020617",
    fontWeight: "bold",
    cursor: "pointer"
  },

  copyBtnBlue: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#38bdf8,#0284c7)",
    color: "#020617",
    fontWeight: "bold",
    cursor: "pointer"
  },

  socialRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "16px"
  },

  whatsapp: {
    padding: "15px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#25D366,#16a34a)",
    color: "white",
    fontWeight: "bold",
    fontSize: "15px"
  },

  telegram: {
    padding: "15px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#38bdf8,#2563eb)",
    color: "white",
    fontWeight: "bold",
    fontSize: "15px"
  },

  bonusGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    marginTop: "20px"
  },

  performance: btn("linear-gradient(135deg,#2563eb,#38bdf8)"),
  team: btn("linear-gradient(135deg,#7c3aed,#a855f7)"),
  royalty: btn("linear-gradient(135deg,#ca8a04,#facc15)", "#1c1917"),

  treeBtn: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#020617",
    fontWeight: "bold",
    fontSize: "15px"
  },

  historyTitle: {
    marginTop: "28px",
    color: "#e2e8f0"
  },

  empty: {
    background: "rgba(30,41,59,0.9)",
    padding: "16px",
    borderRadius: "14px",
    color: "#94a3b8",
    textAlign: "center",
    border: "1px solid #334155"
  },

  historyCard: {
    background: "rgba(30,41,59,0.95)",
    padding: "15px",
    marginTop: "12px",
    borderRadius: "16px",
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
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#94a3b8"
  },

  status: {
    padding: "7px 13px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "12px"
  },

  loaderCard: {
    background: "rgba(30,41,59,0.94)",
    padding: "28px",
    borderRadius: "22px",
    textAlign: "center",
    marginTop: "120px",
    border: "1px solid #334155"
  },

  logo: {
    fontSize: "38px"
  }
};

function btn(bg, color = "white") {
  return {
    width: "100%",
    padding: "15px",
    borderRadius: "16px",
    border: "none",
    background: bg,
    color,
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer"
  };
}