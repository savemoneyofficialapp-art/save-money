import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
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

  // নতুন স্টেট: সিলেক্টেড ট্রানজেকশন ডিটেইলস এর জন্য
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);

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
      setLoading(false);
    }
  };

  // 📸 ইমেজ শেয়ারিং ফাংশন (html2canvas)
  const handleShareReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 2, // ভালো কোয়ালিটির ইমেজের জন্য
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `receipt-${selectedTx._id || "tx"}.png`, { type: "image/png" });
        
        // যদি ব্রাউজার ফাইল শেয়ার সাপোর্ট করে (যেমন মোবাইল Chrome/Safari)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Transaction Receipt",
            text: "My Daily Reward Cashback Receipt!",
          });
        } else {
          // Fallback: সাপোর্ট না করলে সরাসরি ইমেজ ডাউনলোড হবে
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `Receipt_${selectedTx._id || "DailyReward"}.png`;
          link.click();
          toast.success("Receipt downloaded successfully!");
        }
      }, "image/png");
    } catch (error) {
      console.error("Error sharing receipt:", error);
      toast.error("Failed to generate image.");
    }
  };

  // সংখ্যাকে কথায় রূপান্তর করার সিম্পল ফাংশন
  const inWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + ' ' : '';
    return str ? str + 'Rupees Only' : 'Zero Rupees Only';
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

      {/* 📜 REWARD LOGS / HISTORY (PAYTM / PHONEPE STYLE LIGHT THEME) */}
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
                        Received Today, {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={styles.moneyBadge}>
                        💰 Money Received
                      </div>
                    </div>
                  </div>
                  <div style={styles.logRight}>
                    <span style={styles.logAmount}>
                      + ₹{rewardAmt}
                    </span>
                    <span style={styles.inText}>In <span style={styles.appSymbol}>⚙️</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🖼️ TRANSACTION DETAIL RECEIPT POPUP (PHONEPE STYLED) */}
      {selectedTx && (
        <div style={styles.receiptOverlay}>
          <div style={styles.receiptHeaderBar}>
            <button style={styles.backBtn} onClick={() => setSelectedTx(null)}>← Money Received</button>
            <div style={styles.rightNavBtn}>
              <button style={styles.navLinkBtn} onClick={handleShareReceipt}>Share</button>
              <button style={styles.navLinkBtn} onClick={() => setSelectedTx(null)}>Help</button>
            </div>
          </div>

          <div style={styles.receiptScrollContainer}>
            {/* HTML2CANVAS WILL CAPTURE THIS BLOCK */}
            <div ref={receiptRef} style={styles.receiptCard}>
              
              {/* SECTION 1: AMOUNT BOX */}
              <div style={styles.receiptSectionBox}>
                <span style={styles.fieldLabel}>Amount</span>
                <div style={styles.receiptAmountRow}>
                  <h1 style={styles.receiptAmount}>₹{selectedTx.rewardAmt}</h1>
                  <span style={styles.verifiedCheck}>✓</span>
                </div>
                <p style={styles.amountInWords}>{inWords(selectedTx.rewardAmt)}</p>
                <div style={styles.moneyReceivedTag}>
                  💵 Money Received
                </div>
              </div>

              {/* SECTION 2: FROM INFO */}
              <div style={styles.receiptSectionBox}>
                <span style={styles.fieldLabel}>From</span>
                <div style={styles.profileRow}>
                  <div style={styles.receiptAvatar}>
                    {selectedTx.special ? "SB" : "DR"}
                  </div>
                  <div style={styles.profileDetails}>
                    <h4 style={styles.profileName}>
                      {selectedTx.special ? "Special Bonus Loot" : "Daily Bonus System"} <span style={styles.blueTick}>✓</span>
                    </h4>
                    <p style={styles.upiId}>UPI ID: rewards@backend on <span style={{color:'#673ab7', fontWeight:'bold'}}>PhonePe</span></p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: TO INFO */}
              <div style={styles.receiptSectionBox}>
                <span style={styles.fieldLabel}>To</span>
                <div style={styles.profileRow}>
                  <div style={{...styles.receiptAvatar, backgroundColor: '#e2e8f0', color: '#475569'}}>
                    U
                  </div>
                  <div style={styles.profileDetails}>
                    <h4 style={styles.profileName}>{email ? email.split('@')[0].toUpperCase() : "User Account"}</h4>
                    <p style={styles.upiId}>UPI ID: {email || "user@wallet"}</p>
                    <p style={styles.bankName}>App Wallet Balance - ****</p>
                  </div>
                </div>

                <div style={styles.divider}></div>

                <p style={styles.timeText}>
                  Received at {new Date(selectedTx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}, {new Date(selectedTx.date).toLocaleDateString([], {day:'numeric', month:'short', year:'numeric'})}
                </p>
                <p style={styles.refText}>
                  Ref No: TXN{new Date(selectedTx.date).getTime()} <span style={styles.copyBtn} onClick={() => {
                    navigator.clipboard.writeText(`TXN${new Date(selectedTx.date).getTime()}`);
                    toast.success("Copied to clipboard!");
                  }}>Copy</span>
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 স্টাইলস (লাইট-ওয়েট প্রিমিয়াম লুক ফর হিস্টরি অ্যান্ড রিসিট)
const styles = {
  container: {
    minHeight: "100vh",
    background: "#f4f6f9",
    color: "#1e293b",
    padding: "24px 16px 60px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },

  heroCard: {
    position: "relative",
    background: "linear-gradient(145deg, #0f172a, #1e293b)",
    border: "1px solid rgba(250, 204, 21, 0.25)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
    borderRadius: "32px",
    padding: "30px 20px",
    textAlign: "center",
    overflow: "hidden",
    color: "#ffffff"
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
    boxShadow: "0 10px 25px rgba(234, 179, 8, 0.4)"
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
    boxShadow: "0 6px 20px rgba(234, 179, 8, 0.3)"
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

  /* 📜 CLAIMS LOGS WHITE BACKGROUND STYLE (PAYTM / PHONEPE LOOK) */
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
    color: "#475569"
  },

  historyCounter: {
    fontSize: "12px",
    color: "#64748b"
  },

  emptyCard: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "18px",
    color: "#64748b",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    fontSize: "13px"
  },

  logsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
    background: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
  },

  logRow: {
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
    ":last-child": { borderBottom: "none" }
  },

  logLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  logIconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },

  logType: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b"
  },

  logDate: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px"
  },

  moneyBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#e8f5e9",
    color: "#2e7d32",
    fontSize: "11px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "12px",
    marginTop: "6px"
  },

  logRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column"
  },

  logAmount: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2e7d32"
  },

  inText: {
    fontSize: "11px",
    color: "#94a3b8"
  },

  appSymbol: {
    color: "#0284c7"
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
    boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
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
    margin: "12px 0"
  },

  popupText: {
    color: "#94a3b8",
    fontSize: "12px",
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
    cursor: "pointer"
  },

  /* 📱 FULL PHONEPE STYLE SLIDE POPUP */
  receiptOverlay: {
    position: "fixed",
    inset: "0px",
    background: "#f4f6f9",
    zIndex: 999999,
    display: "flex",
    flexDirection: "column"
  },

  receiptHeaderBar: {
    height: "56px",
    background: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
  },

  backBtn: {
    background: "none",
    border: "none",
    fontSize: "17px",
    fontWeight: "600",
    color: "#1e293b",
    cursor: "pointer"
  },

  rightNavBtn: {
    display: "flex",
    gap: "16px"
  },

  navLinkBtn: {
    background: "none",
    border: "none",
    color: "#144cc7",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer"
  },

  receiptScrollContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px"
  },

  receiptCard: {
    background: "#f4f6f9",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "480px",
    margin: "0 auto",
    padding: "4px"
  },

  receiptSectionBox: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "20px 16px",
    border: "1px solid #e2e8f0",
    position: "relative"
  },

  fieldLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
    display: "block",
    marginBottom: "4px"
  },

  receiptAmountRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  receiptAmount: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#1e293b",
    margin: 0
  },

  verifiedCheck: {
    width: "24px",
    height: "24px",
    background: "#00c853",
    color: "#ffffff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px"
  },

  amountInWords: {
    fontSize: "13px",
    color: "#475569",
    margin: "4px 0 12px"
  },

  moneyReceivedTag: {
    display: "inline-flex",
    alignItems: "center",
    background: "#e8f5e9",
    border: "1px solid #c8e6c9",
    color: "#2e7d32",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600"
  },

  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "8px"
  },

  receiptAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#ffcdd2",
    color: "#c62828",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px"
  },

  profileDetails: {
    flex: 1
  },

  profileName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b"
  },

  blueTick: {
    color: "#03a9f4",
    fontSize: "14px"
  },

  upiId: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#64748b"
  },

  bankName: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#64748b"
  },

  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "16px 0"
  },

  timeText: {
    fontSize: "12px",
    color: "#475569",
    margin: "0 0 4px"
  },

  refText: {
    fontSize: "12px",
    color: "#475569",
    margin: 0
  },

  copyBtn: {
    color: "#144cc7",
    fontWeight: "600",
    marginLeft: "8px",
    cursor: "pointer"
  }
};
