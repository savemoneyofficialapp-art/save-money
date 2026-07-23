import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { API } from "../config";

export default function DailyReward() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");
  const walletId = localStorage.getItem("walletId") || localStorage.getItem("userId") || "WLT-" + (email ? email.split('@')[0] : "USER");

  const [result, setResult] = useState("");
  const [amount, setAmount] = useState(null);
  const [special, setSpecial] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(false);

  // ট্রানজেকশন পপআপ এবং রেফ
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);

  // হিস্টরি ফেচ করার ফাংশন (ফিক্সড)
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
      
      // ব্যাকএন্ড রেসপন্স চেক করে সরাসরি স্টেট আপডেট
      if (res.ok && data) {
        if (data.reward?.history) {
          setHistory([...data.reward.history].reverse());
        } else if (data.history) {
          setHistory([...data.history].reverse());
        }
      }
    } catch (err) {
      console.log("Fetch history error:", err);
    }
  }, [email, token]);

  // পেজে প্রবেশ করলেই যাতে ১০০% হিস্টরি লোড হয়
  useEffect(() => {
    if (email) {
      fetchHistory();
    }
  }, [email, fetchHistory]);

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
        fetchHistory(); 
        return;
      }

      setResult(data.msg || "Reward Claimed Successfully");
      setAmount(data.amount || data.rewardAmount || 0);
      setSpecial(data.special || false);
      setPopup(true);
      
      // ক্লেইম করার পর হিস্টরি রিফ্রেশ
      fetchHistory();
      
      setTimeout(() => setPopup(false), 4000);
    } catch (err) {
      console.log("Daily reward fetch error:", err);
      toast.error("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 DIRECT WHATSAPP IMAGE SHARING FUNCTION
  const handleWhatsAppShare = async () => {
    if (!receiptRef.current) return;
    try {
      toast.info("Preparing receipt for WhatsApp...");
      
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 2, 
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Receipt-${selectedTx._id || "Daily"}.png`, { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Daily Reward Receipt",
            text: `Hey! I just earned ₹${selectedTx.rewardAmt} from Daily Loot Box! 🎉`,
          });
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `Receipt_Earned_₹${selectedTx.rewardAmt}.png`;
          link.click();
          
          const textMessage = encodeURIComponent(`I just claimed my Daily Reward! Earned: ₹${selectedTx.rewardAmt}. Receipt downloaded!`);
          window.open(`https://api.whatsapp.com/send?text=${textMessage}`, "_blank");
          toast.success("Receipt downloaded & Opening WhatsApp!");
        }
      }, "image/png");
    } catch (error) {
      console.error("WhatsApp share error:", error);
      toast.error("Sharing failed. Try downloading.");
    }
  };

  const inWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return '';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[5] != 0) ? (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + ' ' : '';
    return str ? str + 'Rupees Only' : 'Rupees Only';
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

      {/* 📜 REWARD LOGS / HISTORY */}
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
              const rewardAmt = h.amount || h.reward || 0;
              return (
                <div key={i} style={styles.logRow} onClick={() => setSelectedTx({ ...h, rewardAmt })}>
                  <div style={styles.logLeft}>
                    <div style={{
                      ...styles.logIconCircle,
                      background: isSpecial ? "#ede9fe" : "#e0f2fe",
                      color: isSpecial ? "#7c3aed" : "#0284c7"
                    }}>
                      {isSpecial ? "⭐" : "🎁"}
                    </div>
                    <div>
                      <b style={styles.logType}>
                        {isSpecial ? "Special Multiplier Box" : "Daily Reward Loot"}
                      </b>
                      <span style={styles.logDate}>
                        Received, {new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={styles.moneyBadge}>
                        💵 Money Received
                      </div>
                    </div>
                  </div>
                  <div style={styles.logRight}>
                    <span style={styles.logAmount}>
                      + ₹{rewardAmt}
                    </span>
                    <span style={styles.inText}>In Wallet ➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔮 TRANSACTION DETAIL POPUP MODAL */}
      {selectedTx && (
        <div style={styles.receiptOverlay}>
          <div style={styles.popupModalCard}>
            
            {/* TOP ACTIONS */}
            <div style={styles.receiptHeaderBar}>
              <button style={styles.backBtn} onClick={() => setSelectedTx(null)}>✕ Close</button>
              <div style={styles.rightNavBtn}>
                <button style={styles.whatsappBtn} onClick={handleWhatsAppShare}>
                  🟢 Share WhatsApp
                </button>
              </div>
            </div>

            <div style={styles.receiptScrollContainer}>
              {/* SCREENSHOT AREA */}
              <div ref={receiptRef} style={styles.receiptCard}>
                
                {/* AMOUNT AREA */}
                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>Amount Received</span>
                  <div style={styles.receiptAmountRow}>
                    <h1 style={styles.receiptAmount}>₹{selectedTx.rewardAmt}</h1>
                    <span style={styles.verifiedCheck}>✓</span>
                  </div>
                  <p style={styles.amountInWords}>{inWords(selectedTx.rewardAmt)}</p>
                  <div style={styles.moneyReceivedTag}>
                    💰 Money Received
                  </div>
                </div>

                {/* SENDER INFO */}
                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>From</span>
                  <div style={styles.profileRow}>
                    <div style={styles.receiptAvatar}>
                      {selectedTx.special ? "🎁" : "⚙️"}
                    </div>
                    <div style={styles.profileDetails}>
                      <h4 style={styles.profileName}>
                        {selectedTx.special ? "Special Multiplier Reward" : "Daily Check-in System"} <span style={styles.blueTick}>✓</span>
                      </h4>
                      <p style={styles.upiId}>TX ID: {selectedTx._id || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* RECEIVER INFO (FIXED: SHOWING WALLET ID INSTEAD OF EMAIL) */}
                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>To (Wallet Account)</span>
                  <div style={styles.profileRow}>
                    <div style={{...styles.receiptAvatar, backgroundColor: '#f0fdf4', color: '#166534'}}>
                      👤
                    </div>
                    <div style={styles.profileDetails}>
                      <h4 style={styles.profileName}>User Account</h4>
                      <p style={styles.upiId}><b>Wallet ID:</b> {selectedTx.walletId || walletId}</p>
                      <p style={styles.bankName}>Status: Credited Successfully</p>
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  {/* REAL DATE & TIME FROM BACKEND */}
                  <p style={styles.timeText}>
                    <b>Date:</b> {new Date(selectedTx.date).toLocaleDateString([], {day:'numeric', month:'long', year:'numeric'})}
                  </p>
                  <p style={styles.timeText}>
                    <b>Time:</b> {new Date(selectedTx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                  </p>
                  <p style={styles.refText}>
                    <b>Ref No:</b> REF{new Date(selectedTx.date).getTime()}
                  </p>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 সিএসএস স্টাইল শিট 
const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "20px 14px 60px",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  heroCard: {
    position: "relative",
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "24px",
    padding: "24px 16px",
    textAlign: "center",
    color: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
  },
  cardGlow: {
    position: "absolute",
    top: "-40px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "160px",
    height: "160px",
    background: "rgba(250, 204, 21, 0.12)",
    filter: "blur(50px)",
    borderRadius: "50%"
  },
  badgeContainer: {
    display: "inline-flex",
    background: "rgba(250, 204, 21, 0.1)",
    border: "1px solid rgba(250, 204, 21, 0.2)",
    padding: "4px 12px",
    borderRadius: "20px",
    marginBottom: "12px"
  },
  badgeText: {
    color: "#facc15",
    fontSize: "10px",
    fontWeight: "800"
  },
  mainTitle: {
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 6px 0"
  },
  subtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "0 auto 20px",
    maxWidth: "280px"
  },
  giftWrapper: {
    position: "relative",
    width: "100px",
    height: "100px",
    margin: "0 auto 20px"
  },
  giftPulse: {
    position: "absolute",
    inset: "0px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(234, 179, 8, 0.25) 0%, transparent 70%)"
  },
  giftBoxInner: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #facc15 0%, #ca8a04 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "10px auto"
  },
  giftEmoji: {
    fontSize: "40px"
  },
  claimBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #facc15 0%, #eab308 100%)",
    color: "#0f172a",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer"
  },
  btnContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #0f172a",
    borderTopColor: "transparent",
    borderRadius: "50%"
  },
  resultMessage: {
    marginTop: "16px",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid",
    fontSize: "12px"
  },
  resultAmountText: {
    margin: "2px 0 0",
    fontWeight: "700"
  },
  historySection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  historyTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#334155",
    fontWeight: "700"
  },
  historyCounter: {
    fontSize: "11px",
    color: "#64748b"
  },
  emptyCard: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "16px",
    color: "#64748b",
    textAlign: "center",
    border: "1px solid #e2e8f0"
  },
  logsContainer: {
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0"
  },
  logRow: {
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    background: "#ffffff"
  },
  logLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  logIconCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
  },
  logType: {
    display: "block",
    fontSize: "13px",
    color: "#0f172a"
  },
  logDate: {
    display: "block",
    fontSize: "11px",
    color: "#64748b"
  },
  moneyBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "8px",
    marginTop: "4px",
    fontWeight: "600"
  },
  logRight: {
    textAlign: "right"
  },
  logAmount: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#16a34a",
    display: "block"
  },
  inText: {
    fontSize: "10px",
    color: "#94a3b8"
  },
  popupOverlay: {
    position: "fixed",
    inset: "0",
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999
  },
  popupCard: {
    background: "#0f172a",
    border: "2px solid #eab308",
    borderRadius: "24px",
    padding: "24px",
    textAlign: "center",
    width: "280px",
    color: "#ffffff"
  },
  popupIcon: { fontSize: "48px" },
  popupTitle: { fontSize: "16px", margin: "6px 0" },
  popupAmount: { color: "#22c55e", fontSize: "36px", margin: "10px 0" },
  popupText: { color: "#94a3b8", fontSize: "12px" },
  popupCloseBtn: { width: "100%", padding: "10px", background: "#1e293b", color: "#fff", border: "none", borderRadius: "8px", marginTop: "12px", cursor: "pointer" },
  
  receiptOverlay: {
    position: "fixed",
    inset: "0px",
    background: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(6px)",
    zIndex: 999999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "12px"
  },
  popupModalCard: {
    background: "#f8fafc",
    width: "100%",
    maxWidth: "400px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh"
  },
  receiptHeaderBar: {
    background: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0"
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: "15px",
    fontWeight: "600",
    color: "#ef4444",
    cursor: "pointer"
  },
  whatsappBtn: {
    background: "#25D366",
    color: "#ffffff",
    border: "none",
    padding: "6px 14px",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer"
  },
  receiptScrollContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "12px"
  },
  receiptCard: {
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "12px",
    borderRadius: "16px"
  },
  receiptSectionBox: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e2e8f0"
  },
  fieldLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600"
  },
  receiptAmountRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "2px"
  },
  receiptAmount: {
    fontSize: "30px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0
  },
  verifiedCheck: {
    width: "20px",
    height: "20px",
    background: "#22c55e",
    color: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold"
  },
  amountInWords: {
    fontSize: "12px",
    color: "#475569",
    margin: "4px 0 10px"
  },
  moneyReceivedTag: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#16a34a",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600"
  },
  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "6px"
  },
  receiptAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#991b1b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  profileDetails: {
    flex: 1
  },
  profileName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a"
  },
  blueTick: {
    color: "#38bdf8",
    fontSize: "12px"
  },
  upiId: {
    margin: "2px 0 0",
    fontSize: "11px",
    color: "#64748b",
    wordBreak: "break-all"
  },
  bankName: {
    margin: "2px 0 0",
    fontSize: "11px",
    color: "#16a34a",
    fontWeight: "600"
  },
  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "12px 0"
  },
  timeText: {
    fontSize: "12px",
    color: "#334155",
    margin: "0 0 4px"
  },
  refText: {
    fontSize: "12px",
    color: "#334155",
    margin: 0
  },
  copyBtn: {
    color: "#144cc7",
    fontWeight: "600",
    marginLeft: "8px",
    cursor: "pointer"
  }
};
