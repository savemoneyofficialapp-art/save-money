import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { API } from "../config";

export default function DailyReward() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [history, setHistory] = useState([]);
  const [walletId, setWalletId] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(false);
  
  // MLM Reward Balance & Streak States
  const [claimCount, setClaimCount] = useState(0);
  const [lastClaimDate, setLastClaimDate] = useState("");
  const [totalReward, setTotalReward] = useState(0); // এ পর্যন্ত মোট পাওয়া রিওয়ার্ড[span_1](start_span)[span_1](end_span)
  const [latestAmount, setLatestAmount] = useState(null);
  const [isSpecial, setIsSpecial] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);

  const todayStr = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  const isAlreadyClaimedToday = lastClaimDate === todayStr;

  let currentStreakDay = claimCount;
  if (claimCount >= 10) {
    currentStreakDay = 10;
  }

  // 🔄 Fetch Wallet & Reward Data[span_2](start_span)[span_2](end_span)
  const fetchRewardData = async () => {
    const currentEmail = localStorage.getItem("email");
    const currentToken = localStorage.getItem("token");
    if (!currentEmail) return;

    try {
      const res = await fetch(`${API}/daily-reward/${currentEmail}`, {
        method: "GET",
        headers: { authorization: currentToken || "" },
      });
      const data = await res.json();
      
      if (res.ok && data) {
        const parsedWalletId = data.walletId || `WL-${currentEmail.split('@')[0].toUpperCase()}`;
        setWalletId(parsedWalletId);

        let rawHistory = [];
        if (data.reward && Array.isArray(data.reward.history)) {
          rawHistory = data.reward.history;
          setClaimCount(data.reward.claimCount || 0);
          setLastClaimDate(data.reward.lastClaimDate || "");
          setTotalReward(data.reward.totalReward || 0); // টোটাল আর্নড রিওয়ার্ড আপডেট[span_3](start_span)[span_3](end_span)
        } else if (data.history && Array.isArray(data.history)) {
          rawHistory = data.history;
        }
        
        setHistory(Array.isArray(rawHistory) ? [...rawHistory].reverse() : []);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  };

  useEffect(() => {
    fetchRewardData();
  }, []); 

  // 🎁 Claim Reward Function[span_4](start_span)[span_4](end_span)
  const claimReward = async () => {
    if (isAlreadyClaimedToday) {
      toast.warning("Already claimed today!");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API}/daily-reward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        toast.error(data.msg || "Reward claim failed");
        fetchRewardData();
        return;
      }

      setLatestAmount(data.amount || 0);
      setIsSpecial(data.special || false);
      setPopup(true);
      
      fetchRewardData(); 
      setTimeout(() => setPopup(false), 4000);
    } catch (err) {
      toast.error("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!receiptRef.current) return;
    try {
      toast.info("Preparing receipt...");
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        backgroundColor: "#0b0f19",
        scale: 2, 
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const txRef = selectedTx.date ? new Date(selectedTx.date).getTime() : "Daily";
        const file = new File([blob], `Receipt-${txRef}.png`, { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Daily Reward Receipt",
            text: `I just earned ${selectedTx.rewardAmt} from Daily Rewards! 🎉`,
          });
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `Receipt_${selectedTx.rewardAmt}.png`;
          link.click();
          window.open(`https://api.whatsapp.com/send?text=Claimed Daily Reward: ${selectedTx.rewardAmt}`, "_blank");
          toast.success("Receipt downloaded!");
        }
      }, "image/png");
    } catch (error) {
      toast.error("Sharing failed.");
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

  const cardDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div style={styles.container}>
      
      {/* 🔝 MLM Wallet Bar (টোটাল রিওয়ার্ড ব্যালেন্স শো করবে) */}
      <div style={styles.topBar}>
        <button style={styles.backArrow} onClick={() => window.history.back()}>➔</button>
        <div style={styles.walletContainer}>
          <span style={styles.walletIcon}>💳</span>
          <div style={styles.walletDetails}>
            <span style={styles.walletLabel}>Total Rewards</span>
            <span style={styles.walletBalance}>{totalReward}</span> 
          </div>
          <button style={styles.plusBtn}>+</button>
        </div>
      </div>

      <h1 style={styles.mainTitle}>Daily Rewards</h1>
      <p style={styles.subtitle}>📊 Login every day and claim your reward!</p>

      {/* ⚡ Streak Progress Panel */}
      <div style={styles.streakPanel}>
        <div style={styles.streakHeader}>
          <div style={styles.streakBadgeCirc}>
            <span style={styles.streakBadgeNum}>{currentStreakDay}</span>
            <span style={styles.streakBadgeTxt}>Day Streak</span>
          </div>
          <div style={styles.streakTextContainer}>
            <p style={styles.keepStreakTxt}>Keep your streak going!</p>
            
            {/* লাইন প্রোগ্রেস ও ডট ইন্ডিকেটর */}
            <div style={styles.dotProgressLine}>
              {cardDays.map((d) => {
                const isDone = d <= currentStreakDay;
                const isCurrent = d === currentStreakDay;
                return (
                  <div key={d} style={styles.dotWrapper}>
                    <div style={{
                      ...styles.miniDot,
                      background: isCurrent ? "#8b5cf6" : isDone ? "#eab308" : "#1e293b",
                      border: isCurrent ? "2px solid #a78bfa" : "1px solid #334155",
                    }}>
                      {isDone && d < currentStreakDay ? "✓" : d}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 📦 10 Days Professional MLM Grid */}
        <div style={styles.gridContainer}>
          {cardDays.map((d) => {
            const isClaimed = d < currentStreakDay || (d === currentStreakDay && isAlreadyClaimedToday);
            const isCurrentActive = d === currentStreakDay && !isAlreadyClaimedToday;
            const isLocked = d > currentStreakDay;
            const isDay10 = d === 10;

            const estimatedAmount = isDay10 ? "50" : `${d * 10}`; 

            return (
              <div 
                key={d} 
                style={{
                  ...styles.dayCard,
                  border: isCurrentActive ? "2px solid #8b5cf6" : "1px solid #1e293b",
                  background: isCurrentActive ? "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)" : "#0f172a",
                }}
              >
                <span style={styles.cardDayTitle}>Day {d}</span>
                
                <div style={styles.cardIconBox}>
                  {isDay10 ? (
                    <span style={styles.mlmWalletIconSpecial}>💰</span>
                  ) : (
                    <span style={{fontSize: "22px", opacity: isLocked ? 0.3 : 1}}>💼</span>
                  )}
                </div>

                <span style={styles.cardAmount}>{estimatedAmount}</span>

                {isClaimed ? (
                  <div style={styles.statusClaimed}>✓ Claimed</div>
                ) : isCurrentActive ? (
                  <button style={styles.cardClaimBtn} onClick={claimReward}>Claim</button>
                ) : (
                  <div style={styles.statusLocked}>🔒</div>
                )}

                {isDay10 && <div style={styles.specialTag}>SPECIAL</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🎯 Bottom Claim Bar */}
      <div style={styles.nextClaimPanel}>
        <div style={styles.nextLeft}>
          <span style={styles.calIcon}>📅</span>
          <div>
            <p style={styles.nextSub}>Come back tomorrow for</p>
            <h4 style={styles.nextTitle}>Day {currentStreakDay >= 10 ? 1 : currentStreakDay + 1} reward</h4>
          </div>
        </div>
        <button 
          style={{
            ...styles.mainClaimActionBtn,
            background: isAlreadyClaimedToday ? "#1e293b" : "linear-gradient(135deg, #ca8a04 0%, #eab308 100%)",
            color: isAlreadyClaimedToday ? "#6b7280" : "#000",
            cursor: isAlreadyClaimedToday || loading ? "not-allowed" : "pointer"
          }}
          disabled={isAlreadyClaimedToday || loading}
          onClick={claimReward}
        >
          {loading ? "PROCESSING..." : isAlreadyClaimedToday ? "CLAIMED" : "CLAIM NOW"}
        </button>
      </div>

      {/* 📜 Reward History Logs */}
      <div style={styles.historySection}>
        <div style={styles.historyHeaderRow}>
          <h3 style={styles.historySectionTitle}>🕒 Reward History</h3>
          <span style={styles.viewAllBtn}>View All ➔</span>
        </div>

        {history.length === 0 ? (
          <div style={styles.emptyCard}>No rewards claimed yet.</div>
        ) : (
          <div style={styles.historyList}>
            {history.map((h, i) => {
              const rewardAmt = h.amount || 0;
              const logDate = h.date;
              return (
                <div key={i} style={styles.historyRow} onClick={() => setSelectedTx({ ...h, rewardAmt })}>
                  <div style={styles.rowLeft}>
                    <div style={styles.calendarMiniBadge}>
                      <span style={styles.calMonth}>
                        {logDate ? new Date(logDate).toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'DAY'}
                      </span>
                      <span style={styles.calDay}>
                        {logDate ? new Date(logDate).getDate() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <h4 style={styles.rowTitle}>
                        {h.special ? "Special Income Disbursed" : "Daily Bonus Credited"}
                      </h4>
                      <p style={styles.rowTime}>
                        {logDate ? new Date(logDate).toLocaleDateString() : ''} • {logDate ? new Date(logDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </p>
                    </div>
                  </div>
                  <div style={styles.rowRight}>
                    <span style={styles.rowAmount}>+{rewardAmt}</span>
                    <span style={styles.rowStatusBadge}>Success</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🎉 Popup Modal */}
      {popup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupCard}>
            <div style={styles.popupIcon}>{isSpecial ? "🎉" : "💼"}</div>
            <h2 style={styles.popupTitle}>
              {isSpecial ? "Special Executive Bonus!" : "Bonus Distributed!"}
            </h2>
            <h1 style={styles.popupAmount}>+{latestAmount}</h1>
            <p style={styles.popupText}>Successfully added to your total reward statement</p>
            <button style={styles.popupCloseBtn} onClick={() => setPopup(false)}>Confirm</button>
          </div>
        </div>
      )}

      {/* 📄 Receipt Modal */}
      {selectedTx && (
        <div style={styles.receiptOverlay}>
          <div style={styles.popupModalCard}>
            <div style={styles.receiptHeaderBar}>
              <button style={styles.backBtn} onClick={() => setSelectedTx(null)}>✕ Close</button>
              <button style={styles.whatsappBtn} onClick={handleWhatsAppShare}>🟢 Share WhatsApp</button>
            </div>
            <div style={styles.receiptScrollContainer}>
              <div ref={receiptRef} style={styles.receiptCard}>
                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>Amount Transferred</span>
                  <div style={styles.receiptAmountRow}>
                    <h1 style={styles.receiptAmount}>{selectedTx.rewardAmt}</h1>
                    <span style={styles.verifiedCheck}>✓</span>
                  </div>
                  <p style={styles.amountInWords}>{inWords(selectedTx.rewardAmt)}</p>
                  <div style={styles.moneyReceivedTag}>💰 Corporate Incentive</div>
                </div>
                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>From Account</span>
                  <div style={styles.profileRow}>
                    <div style={styles.receiptAvatar}>🏢</div>
                    <div style={styles.profileDetails}>
                      <h4 style={styles.profileName}>Incentive Distribution System <span style={styles.blueTick}>✓</span></h4>
                      <p style={styles.upiId}>TXN: {selectedTx.date ? new Date(selectedTx.date).getTime() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>To (Reward Wallet Account)</span>
                  <div style={styles.profileRow}>
                    <div style={{...styles.receiptAvatar, backgroundColor: '#1e293b', color: '#4ade80'}}>👤</div>
                    <div style={styles.profileDetails}>
                      <h4 style={styles.profileName}>Affiliate Member Account</h4>
                      <p style={styles.upiId}><b>Wallet ID:</b> {walletId}</p>
                    </div>
                  </div>
                  <div style={styles.divider}></div>
                  <p style={styles.timeText}><b>Timestamp:</b> {selectedTx.date ? new Date(selectedTx.date).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 🎨 Professional MLM / Fintech Dark Style Sheet
const styles = {
  container: { minHeight: "100vh", background: "#060b13", color: "#f3f4f6", padding: "16px 16px 80px", fontFamily: "'Inter', sans-serif" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  backArrow: { background: "none", border: "none", color: "#fff", fontSize: "22px", cursor: "pointer", transform: "rotate(180deg)" },
  walletContainer: { display: "flex", alignItems: "center", background: "#0f172a", border: "1px solid #1e293b", padding: "6px 14px", borderRadius: "14px", gap: "10px" },
  walletIcon: { fontSize: "18px" },
  walletDetails: { display: "flex", flexDirection: "column" },
  walletLabel: { fontSize: "10px", color: "#9ca3af", fontWeight: "500", textTransform: "uppercase" },
  walletBalance: { color: "#eab308", fontWeight: "800", fontSize: "16px", lineHeight: "1.1" },
  plusBtn: { background: "#22c55e", border: "none", borderRadius: "6px", width: "20px", height: "20px", color: "#fff", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  
  mainTitle: { fontSize: "26px", fontWeight: "800", margin: "0 0 4px 0", letterSpacing: "-0.5px" },
  subtitle: { fontSize: "13px", color: "#9ca3af", margin: "0 0 20px 0" },
  
  streakPanel: { background: "linear-gradient(180deg, #0f172a 0%, #090d16 100%)", borderRadius: "20px", border: "1px solid #1e293b", padding: "16px", marginBottom: "20px" },
  streakHeader: { display: "flex", gap: "14px", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "16px", marginBottom: "16px" },
  streakBadgeCirc: { width: "65px", height: "65px", borderRadius: "16px", border: "2px solid #8b5cf6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#090d16" },
  streakBadgeNum: { fontSize: "22px", fontWeight: "800", color: "#fff", lineHeight: "1" },
  streakBadgeTxt: { fontSize: "8px", color: "#a78bfa", fontWeight: "700", textAlign: "center", textTransform: "uppercase", marginTop: "2px" },
  streakTextContainer: { flex: 1 },
  keepStreakTxt: { margin: "0 0 10px 0", fontSize: "14px", fontWeight: "600", color: "#e5e7eb" },
  dotProgressLine: { display: "flex", justifyContent: "space-between", gap: "2px" },
  miniDot: { width: "20px", height: "20px", borderRadius: "6px", fontSize: "9px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },

  gridContainer: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" },
  dayCard: { position: "relative", borderRadius: "12px", padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", overflow: "hidden" },
  cardDayTitle: { fontSize: "11px", color: "#9ca3af", fontWeight: "500", marginBottom: "6px" },
  cardIconBox: { margin: "4px 0" },
  cardAmount: { fontSize: "14px", fontWeight: "800", color: "#fff", marginBottom: "8px" },
  cardClaimBtn: { width: "100%", background: "#eab308", color: "#000", border: "none", borderRadius: "6px", padding: "4px 0", fontSize: "10px", fontWeight: "700", cursor: "pointer" },
  statusClaimed: { fontSize: "10px", color: "#22c55e", fontWeight: "600" },
  statusLocked: { fontSize: "10px", color: "#4b5563" },
  specialTag: { position: "absolute", top: "0", right: "0", background: "#8b5cf6", color: "#fff", fontSize: "6px", fontWeight: "900", padding: "1px 4px", borderRadius: "0 0 0 6px" },

  nextClaimPanel: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", border: "1px solid #1e293b", padding: "14px", borderRadius: "16px", marginBottom: "25px" },
  nextLeft: { display: "flex", alignItems: "center", gap: "12px" },
  calIcon: { fontSize: "22px" },
  nextSub: { margin: 0, fontSize: "11px", color: "#9ca3af" },
  nextTitle: { margin: 0, fontSize: "14px", fontWeight: "700", color: "#fff" },
  mainClaimActionBtn: { padding: "10px 20px", border: "none", borderRadius: "10px", fontWeight: "800", fontSize: "13px" },

  historySection: { display: "flex", flexDirection: "column", gap: "12px" },
  historyHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  historySectionTitle: { margin: 0, fontSize: "16px", color: "#f3f4f6", fontWeight: "700" },
  viewAllBtn: { fontSize: "12px", color: "#9ca3af", cursor: "pointer" },
  emptyCard: { background: "#0f172a", padding: "20px", borderRadius: "14px", textAlign: "center", color: "#6b7280", border: "1px solid #1e293b" },
  historyList: { display: "flex", flexDirection: "column", gap: "8px" },
  historyRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "12px", cursor: "pointer" },
  rowLeft: { display: "flex", alignItems: "center", gap: "12px" },
  calendarMiniBadge: { background: "#1e293b", borderRadius: "8px", width: "42px", height: "42px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  calMonth: { fontSize: "8px", fontWeight: "800", color: "#ef4444" },
  calDay: { fontSize: "15px", fontWeight: "800", color: "#fff" },
  rowTitle: { margin: 0, fontSize: "13px", fontWeight: "700", color: "#fff" },
  rowTime: { margin: 0, fontSize: "11px", color: "#9ca3af" },
  rowRight: { textAlign: "right" },
  rowAmount: { fontSize: "15px", fontWeight: "800", color: "#22c55e", display: "block" },
  rowStatusBadge: { fontSize: "10px", color: "#22c55e", fontWeight: "600" },

  popupOverlay: { position: "fixed", inset: "0", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999 },
  popupCard: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: "24px", padding: "24px", textAlign: "center", width: "280px", color: "#ffffff" },
  popupIcon: { fontSize: "44px" },
  popupTitle: { fontSize: "16px", margin: "6px 0", fontWeight: "700" },
  popupAmount: { color: "#22c55e", fontSize: "36px", margin: "10px 0", fontWeight: "800" },
  popupText: { color: "#94a3b8", fontSize: "12px" },
  popupCloseBtn: { width: "100%", padding: "10px", background: "#1e293b", color: "#fff", border: "none", borderRadius: "8px", marginTop: "12px", fontWeight: "700" },
  
  receiptOverlay: { position: "fixed", inset: "0px", background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", justifyContent: "center", alignItems: "center", padding: "12px" },
  popupModalCard: { background: "#060b13", width: "100%", maxWidth: "400px", borderRadius: "24px", overflow: "hidden", border: "1px solid #1e293b", display: "flex", flexDirection: "column", maxHeight: "90vh" },
  receiptHeaderBar: { background: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #1e293b" },
  backBtn: { background: "none", border: "none", fontSize: "15px", fontWeight: "600", color: "#ef4444", cursor: "pointer" },
  whatsappBtn: { background: "#25D366", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "12px", fontWeight: "700", fontSize: "13px", cursor: "pointer" },
  receiptScrollContainer: { flex: 1, overflowY: "auto", padding: "12px" },
  receiptCard: { display: "flex", flexDirection: "column", gap: "10px" },
  receiptSectionBox: { background: "#0f172a", borderRadius: "16px", padding: "16px", border: "1px solid #1e293b" },
  fieldLabel: { fontSize: "11px", color: "#9ca3af", fontWeight: "600" },
  receiptAmountRow: { display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" },
  receiptAmount: { fontSize: "32px", fontWeight: "800", color: "#fff", margin: 0 },
  verifiedCheck: { width: "20px", height: "20px", background: "#22c55e", color: "#ffffff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" },
  amountInWords: { fontSize: "12px", color: "#9ca3af", margin: "4px 0 10px" },
  moneyReceivedTag: { display: "inline-block", background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  profileRow: { display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" },
  receiptAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "#1e293b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" },
  profileDetails: { flex: 1 },
  profileName: { margin: 0, fontSize: "14px", fontWeight: "700", color: "#fff" },
  blueTick: { color: "#38bdf8", fontSize: "12px" },
  upiId: { margin: "2px 0 0", fontSize: "11px", color: "#9ca3af", wordBreak: "break-all" },
  divider: { height: "1px", background: "#1e293b", margin: "12px 0" },
  timeText: { fontSize: "12px", color: "#d1d5db", margin: "0 0 4px" }
};
