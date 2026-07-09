আপনার DailyReward পেজটিকেও আগের মতোই সমস্ত মেথড, রিয়েল-টাইম হিস্ট্রি ট্র্যাকিং এবং কোর লজিক অক্ষুণ্ণ রেখে একটি **লাক্সারি গ্লাস-মরফিজম এবং আল্ট্রা-প্রিমিয়াম থিমে** রূপান্তর করা হলো।
এতে 3D টাইপের গ্রেডিয়েন্ট এফেক্ট, লাকি বক্স গ্লো এবং অ্যানিমেটেড ফিলিং দেওয়া হয়েছে যা প্রিমিয়াম গেমিং বা ফিনটেক ড্যাশবোর্ডের মতো ভাইব দেবে।
### 💎 আল্ট্রা-প্রিমিয়াম ডেইলি রিওয়ার্ড কোড (DailyReward.jsx)
```jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function DailyReward() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [result, setResult] = useState("");
  const [amount, setAmount] = useState(null);
  const [special, setSpecial] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(false);

  // হিস্টরি ফেচ করার ফাংশন
  const fetchHistory = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API}/daily-reward/${email}`, {
        method: "GET",
        headers: {
          authorization: token || "",
        },
      });
      const data = await res.json();
      if (res.ok && data.reward?.history) {
        setHistory([...data.reward.history].reverse());
      }
    } catch (err) {
      console.log("Fetch history error:", err);
    }
  }, [email, token]);

  // পেজে প্রবেশ করলেই হিস্টরি লোড হবে
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const claim = async () => {
    try {
      setLoading(true);
      setResult("");
      setAmount(null);

      const res = await fetch(`${API}/daily-reward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setResult(data.error || data.msg || "Reward claim failed");
        if (data.reward?.history) {
          setHistory([...data.reward.history].reverse());
        }
        return;
      }

      setResult(data.msg || "Reward Claimed Successfully");
      setAmount(data.amount || data.rewardAmount || 0);
      setSpecial(data.special || false);
      setPopup(true);
      
      if (data.reward?.history) {
        setHistory([...data.reward.history].reverse());
      }
      
      setTimeout(() => setPopup(false), 4000);
    } catch (err) {
      console.log("Daily reward fetch error:", err);
      toast.error("Backend connection failed.");
    } finally {
      // ফিক্সড: জাস্ট সেট স্টেটে ব্যাক করা হলো
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* SUCCESS POPUP WITH HIGH-END BLUR */}
      {popup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupCard}>
            <div style={styles.popupGlow}></div>
            <div style={styles.popupIcon}>{special ? "🎉" : "🎁"}</div>
            <h2 style={styles.popupTitle}>
              {special ? "Special Bonus Unlocked!" : "Claimed Successfully!"}
            </h2>
            <h1 style={styles.popupAmount}>₹{amount}</h1>
            <p style={styles.popupText}>Successfully added to your wallet balance</p>
            <button style={styles.popupCloseBtn} onClick={() => setPopup(false)}>Awesome</button>
          </div>
        </div>
      )}
      
      {/* MAIN BONUS ZONE */}
      <div style={styles.heroCard}>
        <div style={styles.cardGlow}></div>
        
        <div style={styles.badgeContainer}>
          <span style={styles.badgeText}>✨ STREAK BONUS AVAILABLE</span>
        </div>
        
        <h1 style={styles.mainTitle}>Daily Loot Box</h1>
        <p style={styles.subtitle}>
          Claim your free mystery credits every 24 hours. Get huge multipliers on every <span style={{color: "#ffd700", fontWeight: "bold"}}>10th streak</span> claim!
        </p>
        
        {/* ANIMATED PREMIUM GIFT BOX CONTAINER */}
        <div style={styles.giftWrapper}>
          <div style={styles.giftPulse}></div>
          <div style={styles.giftBoxInner}>
            <span style={styles.giftEmoji}>🎁</span>
          </div>
        </div>
        
        <button
          style={{ 
            ...styles.claimBtn, 
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer" 
          }}
          onClick={claim}
          disabled={loading}
        >
          {loading ? (
            <span style={styles.btnContent}>
              <span style={styles.spinner}></span> Opening Box...
            </span>
          ) : "Unlock Daily Reward"}
        </button>
        
        {/* BANNER RESULT FROM BACKEND */}
        {result && (
          <div style={{
            ...styles.resultMessage,
            borderColor: amount ? "#22c55e" : "#ef4444",
            background: amount ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            color: amount ? "#4ade80" : "#f87171"
          }}>
            <p style={{ margin: 0, fontWeight: "600" }}>{result}</p>
            {amount !== null && <p style={styles.resultAmountText}>Earned: +₹{amount}</p>}
          </div>
        )}
      </div>

      {/* REWARD LOGS / HISTORY */}
      <div style={styles.historySection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.historyTitle}>📜 Claim Logs</h3>
          <span style={styles.historyCounter}>{history.length} Claims total</span>
        </div>

        {history.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={{ margin: 0 }}>You haven't claimed any daily rewards yet.</p>
          </div>
        ) : (
          <div style={styles.logsContainer}>
            {history.map((h, i) => {
              const isSpecial = h.special;
              return (
                <div key={i} style={styles.logRow}>
                  <div style={styles.logLeft}>
                    <div style={{
                      ...styles.logIconCircle,
                      background: isSpecial ? "linear-gradient(135deg, #7c3aed, #c084fc)" : "rgba(255,255,255,0.05)"
                    }}>
                      {isSpecial ? "⭐" : "💎"}
                    </div>
                    <div>
                      <b style={{
                        ...styles.logType,
                        color: isSpecial ? "#c084fc" : "#f1f5f9"
                      }}>
                        {isSpecial ? "Special Multiplier" : "Standard Daily Claim"}
                      </b>
                      <span style={styles.logDate}>
                        {new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div style={styles.logRight}>
                    <span style={{
                      ...styles.logAmount,
                      color: isSpecial ? "#a78bfa" : "#34d399"
                    }}>
                      +₹{h.amount || h.reward || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 💎 প্রিমিয়াম ডার্ক নিওন স্টাইলস
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #090d1f 50%, #020617 100%)",
    color: "#f8fafc",
    padding: "24px 16px 60px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },

  /* 🌟 PREMIUM DASHBOARD HERO CARD */
  heroCard: {
    position: "relative",
    background: "linear-gradient(145deg, rgba(22, 32, 61, 0.7), rgba(11, 17, 36, 0.9))",
    border: "1px solid rgba(250, 204, 21, 0.25)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.05)",
    borderRadius: "32px",
    padding: "30px 20px",
    textAlign: "center",
    overflow: "hidden"
  },

  cardGlow: {
    position: "absolute",
    top: "-50px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "200px",
    height: "200px",
    background: "rgba(250, 204, 21, 0.15)",
    filter: "blur(60px)",
    pointerEvents: "none",
    borderRadius: "50%"
  },

  badgeContainer: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(250, 204, 21, 0.08)",
    border: "1px solid rgba(250, 204, 21, 0.2)",
    padding: "6px 14px",
    borderRadius: "30px",
    marginBottom: "16px"
  },

  badgeText: {
    color: "#eab308",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px"
  },

  mainTitle: {
    fontSize: "30px",
    fontWeight: "900",
    color: "#ffffff",
    margin: "0 0 10px 0",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "1.6",
    maxWidth: "310px",
    margin: "0 auto 24px"
  },

  /* 📦 3D-EFFECT BOX DESIGN */
  giftWrapper: {
    position: "relative",
    width: "140px",
    height: "140px",
    margin: "0 auto 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  giftPulse: {
    position: "absolute",
    inset: "0px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(234, 179, 8, 0.3) 0%, transparent 70%)",
    filter: "blur(4px)"
  },

  giftBoxInner: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #facc15 0%, #ca8a04 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 25px rgba(234, 179, 8, 0.4), inset 0 -4px 10px rgba(0,0,0,0.2)"
  },

  giftEmoji: {
    fontSize: "52px"
  },

  claimBtn: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)",
    color: "#020617",
    fontWeight: "800",
    fontSize: "16px",
    letterSpacing: "0.5px",
    boxShadow: "0 6px 20px rgba(234, 179, 8, 0.3)",
    transition: "transform 0.1s ease"
  },

  btnContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },

  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(2,6,23,0.3)",
    borderTopColor: "#020617",
    borderRadius: "50%"
  },

  resultMessage: {
    marginTop: "20px",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid",
    fontSize: "13px"
  },

  resultAmountText: {
    margin: "4px 0 0", 
    fontWeight: "800", 
    fontSize: "15px"
  },

  /* 📜 CLAIMS LOGS LOGIC VIEW */
  historySection: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 4px"
  },

  historyTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#94a3b8"
  },

  historyCounter: {
    fontSize: "12px",
    color: "#475569"
  },

  emptyCard: {
    background: "rgba(15, 23, 42, 0.4)",
    padding: "20px",
    borderRadius: "18px",
    color: "#64748b",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.03)",
    fontSize: "13px"
  },

  logsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  logRow: {
    background: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(255,255,255,0.05)",
    padding: "14px 16px",
    borderRadius: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  logIconCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },

  logType: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600"
  },

  logDate: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px"
  },

  logAmount: {
    fontSize: "15px",
    fontWeight: "800"
  },

  /* 🔮 CELEBRATION MODAL OVERLAY */
  popupOverlay: {
    position: "fixed",
    inset: "0px",
    background: "rgba(2, 6, 23, 0.85)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
    padding: "20px"
  },

  popupCard: {
    position: "relative",
    background: "linear-gradient(145deg, #0f172a, #020617)",
    border: "2px solid #eab308",
    borderRadius: "28px",
    padding: "30px 24px",
    width: "100%",
    maxWidth: "320px",
    textAlign: "center",
    boxShadow: "0 25px 50px rgba(0,0,0,0.6), 0 0 40px rgba(234,179,8,0.25)",
    overflow: "hidden"
  },

  popupGlow: {
    position: "absolute",
    width: "140px",
    height: "140px",
    background: "#eab308",
    filter: "blur(50px)",
    top: "-30px",
    left: "50%",
    transform: "translateX(-50%)",
    opacity: 0.2,
    borderRadius: "50%"
  },

  popupIcon: {
    fontSize: "64px",
    marginBottom: "10px"
  },

  popupTitle: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "800",
    margin: "0 0 6px 0"
  },

  popupAmount: {
    color: "#10b981",
    fontSize: "44px",
    fontWeight: "900",
    margin: "12px 0",
    letterSpacing: "-1px"
  },

  popupText: {
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0 0 24px 0"
  },

  popupCloseBtn: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f1f5f9",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer"
  }
};

```
