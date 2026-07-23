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
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [walletId, setWalletId] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(false);

  // 🔍 ফিল্টার স্টেটসমূহ
  const [filterType, setFilterType] = useState("all"); 
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 📂 ট্রানজেকশন পপআপ এবং রেফ
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);

  // 🔄 ডাটা ফেচিং ফাংশন (অটো-ফরম্যাট ডিটেকশন সহ ফিক্সড)
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
      
      if (res.ok && data) {
        let rawHistory = [];
        let parsedWalletId = "";

        // ১. যদি ডাটা সরাসরি একটি অ্যারে (Array) হয়ে আসে
        if (Array.isArray(data)) {
          rawHistory = [...data].reverse();
          parsedWalletId = data[0]?.walletId || `WL-${email.split('@')[0].toUpperCase()}`;
        } 
        // ২. যদি ডাটার ভেতর 'reward' অবজেক্ট থাকে
        else if (data.reward) {
          if (Array.isArray(data.reward.history)) {
            rawHistory = [...data.reward.history].reverse();
          } else if (Array.isArray(data.reward)) {
            rawHistory = [...data.reward].reverse();
          }
          parsedWalletId = data.reward.walletId || data.reward._id;
        } 
        // ৩. যদি ডাটার ভেতর সরাসরি 'history' কি (Key) থাকে
        else if (data.history && Array.isArray(data.history)) {
          rawHistory = [...data.history].reverse();
          parsedWalletId = data.walletId || `WL-${email.split('@')[0].toUpperCase()}`;
        }

        // স্টেট আপডেট
        setHistory(rawHistory);
        setFilteredHistory(rawHistory);
        setWalletId(parsedWalletId || `WL-${email.split('@')[0].toUpperCase()}`);
      }
    } catch (err) {
      console.error("Fetch history critical error:", err);
      toast.error("হিস্টরি ডাটা লোড করতে সমস্যা হয়েছে।");
    }
  }, [email, token]);

  // পেজে ঢোকার সাথে সাথে হিস্টরি কল হবে
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 📊 ইনস্ট্যান্ট ফিল্টারিং লজিক 
  useEffect(() => {
    let updatedList = [...history];
    const now = new Date();

    if (filterType === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      updatedList = updatedList.filter(h => new Date(h.date) >= oneWeekAgo);
    } else if (filterType === "thisMonth") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      updatedList = updatedList.filter(h => new Date(h.date) >= startOfMonth);
    } else if (filterType === "lastMonth") {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      updatedList = updatedList.filter(h => {
        const d = new Date(h.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
    } else if (filterType === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      updatedList = updatedList.filter(h => {
        const d = new Date(h.date);
        return d >= start && d <= end;
      });
    }

    setFilteredHistory(updatedList);
  }, [filterType, startDate, endDate, history]);

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
      
      fetchHistory(); // ক্লাইম করার সাথে সাথে হিস্টরি রিফ্রেশ হবে
      setTimeout(() => setPopup(false), 4000);
    } catch (err) {
      console.log("Daily reward fetch error:", err);
      toast.error("সিস্টেম ত্রুটি, আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!receiptRef.current) return;
    try {
      toast.info("রসিদ তৈরি হচ্ছে...");
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
          toast.success("রসিদ ডাউনলোড হয়েছে ও হোয়াটসঅ্যাপ ওপেন হচ্ছে!");
        }
      }, "image/png");
    } catch (error) {
      console.error("WhatsApp share error:", error);
      toast.error("শেয়ার করা সম্ভব হয়নি।");
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
      {popup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupCard}>
            <div style={styles.popupIcon}>{special ? "🎉" : "🎁"}</div>
            <h2 style={styles.popupTitle}>{special ? "Special Bonus Unlocked!" : "Claimed Successfully!"}</h2>
            <h1 style={styles.popupAmount}>₹{amount}</h1>
            <p style={styles.popupText}>Successfully added to your wallet balance</p>
            <button style={styles.popupCloseBtn} onClick={() => setPopup(false)}>Awesome</button>
          </div>
        </div>
      )}
      
      <div style={styles.heroCard}>
        <div style={styles.badgeContainer}><span style={styles.badgeText}>✨ STREAK BONUS AVAILABLE</span></div>
        <h1 style={styles.mainTitle}>Daily Loot Box</h1>
        <p style={styles.subtitle}>Claim your free mystery credits every 24 hours.</p>
        <div style={styles.giftWrapper}>
          <div style={styles.giftBoxInner}><span style={styles.giftEmoji}>🎁</span></div>
        </div>
        <button style={styles.claimBtn} onClick={claim} disabled={loading}>
          {loading ? "Opening Box..." : "Unlock Daily Reward"}
        </button>
        {result && (
          <div style={{
            ...styles.resultMessage,
            borderColor: amount ? "#22c55e" : "#ef4444",
            background: amount ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            color: amount ? "#4ade80" : "#f87171"
          }}>
            <p style={{ margin: 0, fontWeight: "600" }}>{result}</p>
          </div>
        )}
      </div>

      {/* 📜 REWARD LOGS SECTION */}
      <div style={styles.historySection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.historyTitle}>📜 Claim Logs</h3>
          <span style={styles.historyCounter}>{filteredHistory.length} Total Logs</span>
        </div>

        {/* 🔍 FILTER TABS */}
        <div style={styles.filterBar}>
          {["all", "week", "thisMonth", "lastMonth", "custom"].map((type) => (
            <button 
              key={type}
              style={{...styles.filterTab, ...(filterType === type ? styles.activeFilterTab : {})}} 
              onClick={() => setFilterType(type)}
            >
              {type === "all" && "All"}
              {type === "week" && "This Week"}
              {type === "thisMonth" && "This Month"}
              {type === "lastMonth" && "Last Month"}
              {type === "custom" && "Date Range"}
            </button>
          ))}
        </div>

        {filterType === "custom" && (
          <div style={styles.dateSelectorContainer}>
            <div style={styles.dateInputGroup}>
              <label style={styles.dateLabel}>From:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.dateInput} />
            </div>
            <div style={styles.dateInputGroup}>
              <label style={styles.dateLabel}>To:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.dateInput} />
            </div>
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={{ margin: 0 }}>No transactions found.</p>
          </div>
        ) : (
          <div style={styles.logsContainer}>
            {filteredHistory.map((h, i) => {
              const rewardAmt = h.amount || h.reward || 0;
              return (
                <div key={i} style={styles.logRow} onClick={() => setSelectedTx({ ...h, rewardAmt })}>
                  <div style={styles.logLeft}>
                    <div style={{...styles.logIconCircle, background: h.special ? "#ede9fe" : "#e0f2fe"}}>
                      {h.special ? "⭐" : "🎁"}
                    </div>
                    <div>
                      <b style={styles.logType}>{h.special ? "Special Box" : "Daily Loot"}</b>
                      <span style={styles.logDate}>{new Date(h.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={styles.logRight}>
                    <span style={styles.logAmount}>+ ₹{rewardAmt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔮 SLIDE POPUP MODAL */}
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
                  <span style={styles.fieldLabel}>Amount Received</span>
                  <div style={styles.receiptAmountRow}>
                    <h1 style={styles.receiptAmount}>₹{selectedTx.rewardAmt}</h1>
                  </div>
                  <p style={styles.amountInWords}>{inWords(selectedTx.rewardAmt)}</p>
                </div>

                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>From</span>
                  <p style={styles.profileName}>Daily Check-in System</p>
                  <p style={styles.upiId}>TX ID: {selectedTx._id || "N/A"}</p>
                </div>

                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>To (Wallet Account)</span>
                  <p style={styles.profileName}>User Account</p>
                  <p style={styles.upiId}><b>Wallet ID:</b> {walletId}</p>
                  <div style={styles.divider}></div>
                  <p style={styles.timeText}><b>Date:</b> {new Date(selectedTx.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: "20px 14px 60px", fontFamily: "sans-serif", display: "flex", flexDirection: "column", gap: "20px" },
  heroCard: { background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "24px", padding: "24px 16px", textAlign: "center", color: "#ffffff" },
  badgeContainer: { display: "inline-flex", background: "rgba(250, 204, 21, 0.1)", padding: "4px 12px", borderRadius: "20px", marginBottom: "12px" },
  badgeText: { color: "#facc15", fontSize: "10px", fontWeight: "800" },
  mainTitle: { fontSize: "26px", fontWeight: "800", margin: "0" },
  subtitle: { fontSize: "12px", color: "#94a3b8" },
  giftWrapper: { width: "100px", height: "100px", margin: "0 auto 20px" },
  giftBoxInner: { width: "80px", height: "80px", borderRadius: "50%", background: "#facc15", display: "flex", alignItems: "center", justifyContent: "center", margin: "10px auto" },
  giftEmoji: { fontSize: "40px" },
  claimBtn: { width: "100%", padding: "14px", border: "none", borderRadius: "14px", background: "#facc15", color: "#0f172a", fontWeight: "700" },
  resultMessage: { marginTop: "16px", padding: "10px", borderRadius: "12px", border: "1px solid" },
  historySection: { display: "flex", flexDirection: "column", gap: "10px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  historyTitle: { fontSize: "15px", color: "#334155", fontWeight: "700" },
  historyCounter: { fontSize: "11px", color: "#64748b" },
  filterBar: { display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px" },
  filterTab: { background: "#ffffff", border: "1px solid #e2e8f0", padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap" },
  activeFilterTab: { background: "#0f172a", color: "#ffffff" },
  dateSelectorContainer: { display: "flex", gap: "10px", background: "#ffffff", padding: "10px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  dateInputGroup: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
  dateLabel: { fontSize: "11px", color: "#64748b" },
  dateInput: { border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px", fontSize: "12px" },
  emptyCard: { background: "#ffffff", padding: "20px", borderRadius: "16px", color: "#64748b", textAlign: "center" },
  logsContainer: { display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "18px", overflow: "hidden", border: "1px solid #e2e8f0" },
  logRow: { padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", background: "#ffffff" },
  logLeft: { display: "flex", alignItems: "center", gap: "10px" },
  logIconCircle: { width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  logType: { display: "block", fontSize: "13px" },
  logDate: { display: "block", fontSize: "11px", color: "#64748b" },
  logRight: { textAlign: "right" },
  logAmount: { fontSize: "15px", fontWeight: "700", color: "#16a34a" },
  popupOverlay: { position: "fixed", inset: "0", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 },
  popupCard: { background: "#0f172a", padding: "24px", borderRadius: "24px", textAlign: "center", color: "#fff" },
  popupAmount: { color: "#22c55e" },
  popupCloseBtn: { width: "100%", padding: "10px", background: "#1e293b", color: "#fff", border: "none", borderRadius: "8px" },
  receiptOverlay: { position: "fixed", inset: "0", background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" },
  popupModalCard: { background: "#f8fafc", width: "90%", maxWidth: "400px", borderRadius: "24px", overflow: "hidden" },
  receiptHeaderBar: { background: "#ffffff", display: "flex", justifyBetween: "center", padding: "12px" },
  backBtn: { background: "none", border: "none", color: "#ef4444", fontWeight: "bold" },
  whatsappBtn: { background: "#25D366", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "12px" },
  receiptScrollContainer: { padding: "12px" },
  receiptSectionBox: { background: "#ffffff", padding: "16px", borderRadius: "16px", marginBottom: "10px", border: "1px solid #e2e8f0" },
  fieldLabel: { fontSize: "11px", color: "#64748b" },
  receiptAmountRow: { display: "flex", alignItems: "center" },
  receiptAmount: { fontSize: "30px", margin: 0 },
  amountInWords: { fontSize: "12px", color: "#475569" },
  profileName: { margin: 0, fontWeight: "bold" },
  upiId: { fontSize: "11px", color: "#64748b" },
  timeText: { fontSize: "12px" },
  divider: { height: "1px", background: "#e2e8f0", margin: "10px 0" }
};
