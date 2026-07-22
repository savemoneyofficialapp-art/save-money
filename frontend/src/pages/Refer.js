import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

// নম্বর থেকে টাকায় (কথায়) রূপান্তর করার ছোট হেল্পার ফাংশন
const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  let n = Math.floor(num);
  if (n === 0) return 'Zero Rupees Only';
  
  let str = '';
  if (n >= 1000) {
    str += numberToWords(Math.floor(n / 1000)) + 'Thousand ';
    n %= 1000;
  }
  if (n >= 100) {
    str += a[Math.floor(n / 100)] + 'Hundred ';
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) str += a[n];
    else str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
  }
  return str.trim() + ' Rupees Only';
};

export default function Refer() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [history, setHistory] = useState([]);
  const [bonusHistory, setBonusHistory] = useState([]);
  const [performance, setPerformance] = useState({});
  const [team, setTeam] = useState({});
  const [royalty, setRoyalty] = useState({});
  const [treeData, setTreeData] = useState({});
  const [bonusModal, setBonusModal] = useState(null);
  
  // ⚡ নতুন স্টেট: নির্দিষ্ট ট্রানসাকশান ডিটেইলস দেখানোর জন্য
  const [selectedTxn, setSelectedTxn] = useState(null);

  const [treeOpen, setTreeOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [referBonus, setReferBonus] = useState({});
  const [performanceFilter, setPerformanceFilter] = useState("thisMonth");
  
  const [teamTimeFilter, setTeamTimeFilter] = useState("allTime"); 
  const [teamStartDate, setTeamStartDate] = useState("");
  const [teamEndDate, setTeamEndDate] = useState("");

  const [bonusFilter, setBonusFilter] = useState("All");
  const [showAllBonusHistory, setShowAllBonusHistory] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showTodayJoinModal, setShowTodayJoinModal] = useState(false);

  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 2200);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [bonusModal, selectedTxn]);

  useEffect(() => {
    loadReferData();
  }, []);

  const loadReferData = async (month = "", year = new Date().getFullYear()) => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/refer-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email, month, year })
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user || {});
        setHistory(Array.isArray(data.history) ? data.history : []);
        setBonusHistory(Array.isArray(data.bonusHistory) ? data.bonusHistory : []);
        setPerformance(data.performance || {});
        setTeam(data.team || {}); 
        setRoyalty(data.royalty || {});
        setTreeData(data.treeData || {});
        setReferBonus(data.referBonus || {});
      }
    } catch (err) {
      console.log("REFER DATA ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTeamHistory = () => {
    const teamHistoryList = team.history || [];
    const now = new Date();

    return teamHistoryList.filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      d.setHours(0, 0, 0, 0);

      if (teamTimeFilter === "thisMonth") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (teamTimeFilter === "lastMonth") {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
      }
      if (teamTimeFilter === "customRange") {
        const start = teamStartDate ? new Date(teamStartDate) : null;
        const end = teamEndDate ? new Date(teamEndDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        if (start && end) return d >= start && d <= end;
        if (start) return d >= start;
        if (end) return d <= end;
      }
      return true;
    });
  };

  const getDynamicLevelCounts = () => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const filteredHistory = getFilteredTeamHistory();
    
    filteredHistory.forEach(item => {
      const lvl = Number(item.level);
      if (lvl >= 1 && lvl <= 5) {
        counts[lvl] += 1;
      }
    });

    if (teamTimeFilter === "allTime") {
      if (counts[1] === 0) {
        counts[1] = Array.isArray(history) ? history.length : (team.totalJoinCount?.[1] || 0);
      }
      for (let i = 2; i <= 5; i++) {
        if (counts[i] === 0) {
          counts[i] = team.totalJoinCount?.[i] || team.levelCount?.[i] || 0;
        }
      }
    }
    return counts;
  };

  const getDynamicLevelIncomes = () => {
    const incomes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const filteredHistory = getFilteredTeamHistory();

    filteredHistory.forEach(item => {
      const lvl = Number(item.level);
      if (lvl >= 1 && lvl <= 5) {
        incomes[lvl] += Number(item.amount || 0);
      }
    });

    if (teamTimeFilter === "allTime") {
      if (incomes[1] === 0) incomes[1] = team.level1Income || 0;
      if (incomes[2] === 0) incomes[2] = team.level2Income || 0;
      if (incomes[3] === 0) incomes[3] = team.level3Income || 0;
      if (incomes[4] === 0) incomes[4] = team.level4Income || 0;
      if (incomes[5] === 0) incomes[5] = team.level5Income || 0;
    }
    return incomes;
  };

  const filteredPerformanceHistory = (performance.history || []).filter((item) => {
    const d = new Date(item.date);
    const now = new Date();
    if (performanceFilter === "thisMonth") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (performanceFilter === "lastMonth") {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
    }
    return true;
  });

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const referCode = user.referCode || user.referralCode || user.walletId || "SMREF0001";
  
  const perfAmt = Number(performance.balance || user.performanceIncome || 0);
  const teamAmt = Number(team.balance || user.teamIncome || 0);
  const royAmt = Number(royalty.balance || user.royaltyIncome || 0);
  const refAmt = Number(referBonus.totalBonus || user.referIncome || 0);

  const totalAllTimeBalance = perfAmt + teamAmt + royAmt + refAmt;
  const referLink = `${window.location.origin}/register?ref=${referCode}`;

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerStatusOverlay("success", "Copied Successfully! 🎉");
    } catch {
      triggerStatusOverlay("error", "Copy failed!");
    }
  };

  const shareWhatsapp = () => {
    const text = `Join SAVE MONEY using my refer link: ${referLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareTelegram = () => {
    const text = `Join SAVE MONEY using my refer link: ${referLink}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referLink)}&text=${encodeURIComponent(
        "Join SAVE MONEY"
      )}`,
      "_blank"
    );
  };

  // ⚡ ট্রানসাকশান ডিটেইলস শেয়ার করার লজিক
  const shareTransactionDetails = (txn) => {
    const text = `💰 *SAVE MONEY Payment Receipt* 💰\n\nAmount: ${money(txn.amount)}\nType: ${txn.bonusType}\nFrom: ${txn.fromName || 'User'}\nDate: ${new Date(txn.date).toLocaleString("en-IN")}\nStatus: Success ✅\n\nJoin Now: ${referLink}`;
    if (navigator.share) {
      navigator.share({
        title: 'Payment Receipt',
        text: text,
      }).catch(console.error);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const safeHistory = Array.isArray(history) ? history : [];
  const safeBonusHistory = Array.isArray(bonusHistory) ? bonusHistory : [];

  const filteredBonusHistory =
    bonusFilter === "All"
      ? safeBonusHistory
      : safeBonusHistory.filter((x) => x.bonusType === bonusFilter);

  const visibleBonusHistory = showAllBonusHistory
    ? filteredBonusHistory
    : filteredBonusHistory.slice(0, 5);

  const bonusCards = [
    { key: "performance", title: "Performance Bonus", amount: perfAmt, icon: "📈", color: "#c026d3", bg: "#fff0ff" },
    { key: "team", title: "Team Bonus", amount: teamAmt, icon: "👥", color: "#2563eb", bg: "#eff6ff" },
    { key: "royalty", title: "Royalty Bonus", amount: royAmt, icon: "👑", color: "#f97316", bg: "#fff7ed" },
    { key: "refer", title: "Refer Bonus", amount: refAmt, icon: "🎁", color: "#16a34a", bg: "#ecfdf5" }
  ];

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <div style={styles.loadingIcon}>🎁</div>
          <h2>Loading Refer World...</h2>
        </div>
      </div>
    );
  }

  const pendingRefers = history.filter((x) => x.status !== "Active");
  const todayJoinMembers = (team.history || []).filter((item) => {
    const itemDate = new Date(item.date).toDateString();
    const todayDate = new Date().toDateString();
    return itemDate === todayDate;
  });

  const dynamicCounts = getDynamicLevelCounts();
  const dynamicIncomes = getDynamicLevelIncomes();
  const selectedFilteredHistory = getFilteredTeamHistory();
  const selectedFilteredTotalIncome = selectedFilteredHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div style={styles.page}>
      
      {statusOverlay.show && (
        <div style={styles.statusOverlayBg}>
          <div style={{
            ...styles.statusOverlayCard,
            borderTop: statusOverlay.type === "success" ? "5px solid #10b981" : statusOverlay.type === "error" ? "5px solid #ef4444" : "5px solid #3b82f6"
          }}>
            <div style={{
              ...styles.statusOverlayIcon,
              background: statusOverlay.type === "success" ? "linear-gradient(135deg, #dcfce7, #bbf7d0)" : statusOverlay.type === "error" ? "linear-gradient(135deg, #fee2e2, #fecaca)" : "linear-gradient(135deg, #dbeafe, #bfdbfe)",
              color: statusOverlay.type === "success" ? "#16a34a" : statusOverlay.type === "error" ? "#dc2626" : "#2563eb"
            }}>
              {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "error" ? "✕" : "ℹ"}
            </div>
            <h3 style={styles.statusOverlayText}>{statusOverlay.message}</h3>
          </div>
        </div>
      )}

      <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
      <button style={styles.bellBtn} onClick={() => navigate("/notifications")}>🔔</button>

      <header style={styles.header}>
        <p style={styles.welcome}>Welcome to</p>
        <h1 style={styles.mainTitle}>🎁 SAVE MONEY</h1>
        <h2 style={styles.referWorld}>Refer World</h2>
        <p style={styles.tagline}>Refer More, Earn More, Grow Together!</p>
      </header>

      <section style={styles.heroCard}>
        <div style={styles.heroLeft}>
          <div style={styles.avatarWrap}>
            <img style={styles.avatar} src={user.photo || "https://i.pravatar.cc/160?img=12"} alt="user" />
            <div style={styles.crown}>♛</div>
          </div>
          <div>
            <h2>{user.name || "Save Money User"}</h2>
            <span style={styles.activeMember}>
              <span style={{ ...styles.greenDot, background: String(user.activeStatus || "Inactive").toLowerCase() === "active" ? "#22c55e" : "#ef4444" }} />
              {user.activeStatus || "Inactive"} Member
            </span>
            <p style={styles.smallText}>Refer ID</p>
            <div style={styles.referIdBox}>
              <span>{referCode}</span>
              <button onClick={() => copyText(referCode)}>Copy</button>
            </div>
          </div>
        </div>
        <div style={styles.heroRight}>
          <div style={styles.walletRound}>⚡</div>
          <p>All Time Balance</p>
          <h1>{money(totalAllTimeBalance)}</h1>
        </div>
      </section>

      <section style={styles.linkCard}>
        <div style={styles.linkIcon}>🔗</div>
        <div style={styles.linkMiddle}>
          <h3>Your Refer Link</h3>
          <div style={styles.copyBox}>
            <span>{referLink}</span>
            <button style={styles.copyLinkBtn} onClick={() => copyText(referLink)}>🔗 Copy Link</button>
          </div>
        </div>
        <div style={styles.shareBox}>
          <h3>Share via</h3>
          <button style={styles.whatsapp} onClick={shareWhatsapp}>🟢</button>
          <button style={styles.telegram} onClick={shareTelegram}>⌲</button>
        </div>
      </section>

      <section style={styles.bonusGrid}>
        {bonusCards.map((b) => (
          <div key={b.key} style={{ ...styles.bonusCard, background: b.bg }}>
            <div style={{ ...styles.bonusIcon, background: b.color }}>{b.icon}</div>
            <h3>{b.title}</h3>
            <h2>{money(b.amount)}</h2>
            <button style={{ ...styles.detailBtn, color: b.color }} onClick={() => setBonusModal(b.key)}>View Details</button>
          </div>
        ))}
      </section>

      {/* 🛠️ ১ম স্ক্রিনশটের মতো তৈরি করা আকর্ষণীয় হিস্ট্রি লিস্ট */}
      <section style={styles.historyCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2>💰 All Bonus History</h2></div>
          <select value={bonusFilter} onChange={(e) => setBonusFilter(e.target.value)} style={styles.filterSelect}>
            <option value="All">All Bonus</option>
            <option value="Referral Bonus">🎁 Referral</option>
            <option value="Performance Bonus">📈 Performance</option>
            <option value="Team Bonus">👥 Team</option>
            <option value="Royalty Bonus">👑 Royalty</option>
          </select>
        </div>

        <div style={styles.txnListWrapper}>
          {safeBonusHistory.length === 0 ? (
            <p style={{ textAlign: "center", padding: 20, color: "#666" }}>No Bonus History Found</p>
          ) : (
            visibleBonusHistory.map((item, index) => {
              // নামের প্রথম ২ অক্ষর লোগোর জন্য
              const shortName = (item.fromName || "SM").substring(0, 2).toUpperCase();
              return (
                <div 
                  key={index} 
                  style={styles.txnItemCard} 
                  onClick={() => setSelectedTxn(item)} // ক্লিক করলে ২য় স্ক্রিনশটের মতো মোডাল খুলবে
                >
                  <div style={styles.txnLeftSection}>
                    <div style={styles.txnAvatarCircle}>
                      {shortName}
                    </div>
                    <div>
                      <h4 style={styles.txnNameText}>{item.fromName || "Save Money User"}</h4>
                      <p style={styles.txnTimeText}>Received {new Date(item.date).toLocaleDateString("en-IN")} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <span style={styles.txnBadgeTag}>
                        💰 {item.bonusType ? item.bonusType.replace("Bonus", "").trim() : "Bonus"}
                      </span>
                    </div>
                  </div>
                  <div style={styles.txnRightSection}>
                    <h4 style={styles.txnAmountText}>+ {money(item.amount)}</h4>
                    <p style={styles.txnBankText}>In <span style={styles.paytmMinilogo}>⚡</span></p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {filteredBonusHistory.length > 5 && (
        <button style={styles.viewMoreBtn} onClick={() => setShowAllBonusHistory(!showAllBonusHistory)}>
          {showAllBonusHistory ? "Show Less ⌃" : "View More ⌄"}
        </button>
      )}

      <section style={styles.bottomBanner}>
        <div style={styles.bottomGift}>🎁</div>
        <div style={{ flex: 1 }}>
          <h2>Keep Referring & Earning</h2>
          <p>Your network is your net worth.</p>
        </div>
        <button style={styles.referNowBtn} onClick={shareWhatsapp}>🔗 Refer Now</button>
      </section>

      {/* 🛠️ ২য় স্ক্রিনশটের মতো হুবহু তৈরি করা রিসিট ডিটেইলস মোডাল (Shareable) */}
      {selectedTxn && (
        <div style={styles.modalOverlay} onClick={() => setSelectedTxn(null)}>
          <div style={styles.receiptContainer} onClick={(e) => e.stopPropagation()}>
            
            {/* রিসিট হেডার */}
            <div style={styles.receiptHeader}>
              <button style={styles.receiptBackBtn} onClick={() => setSelectedTxn(null)}>←</button>
              <h3 style={styles.receiptHeaderTitle}>Money Received</h3>
              <div style={{ display: "flex", gap: "15px" }}>
                <span style={styles.receiptTopActionBtn} onClick={() => shareTransactionDetails(selectedTxn)}>Share</span>
                <span style={styles.receiptTopActionBtn} onClick={() => triggerStatusOverlay("info", "Help support raised!")}>Help</span>
              </div>
            </div>

            {/* রিসিট মূল বডি কার্ড */}
            <div style={styles.receiptBodyCard}>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Amount</p>
              <div style={styles.receiptAmountRow}>
                <h1>{money(selectedTxn.amount)}</h1>
                <span style={styles.verifiedCheckBadge}>✓</span>
              </div>
              <p style={styles.receiptInWords}>{numberToWords(selectedTxn.amount)}</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
                <span style={styles.receiptStatusTag}>💵 Money Received</span>
                <span style={{ color: "#2563eb", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>Edit</span>
              </div>

              <div style={styles.receiptDivider} />

              {/* From সেকশন */}
              <div style={{ position: "relative" }}>
                <p style={{ margin: 0, color: "#666", fontSize: "14px", fontWeight: "bold" }}>From</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <div style={styles.receiptUserAvatar}>{(selectedTxn.fromName || "U").substring(0, 2).toUpperCase()}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#111" }}>{selectedTxn.fromName || "Associated Partner"}</h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#666" }}>ID: {selectedTxn.fromEmail || "user@savemoney"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button style={styles.receiptActionOutlineBtn} onClick={shareWhatsapp}>Pay</button>
                  <button style={styles.receiptActionOutlineBtn} onClick={() => setSelectedTxn(null)}>View History</button>
                </div>
              </div>

              <div style={styles.receiptDivider} />

              {/* To সেকশন */}
              <div>
                <p style={{ margin: 0, color: "#666", fontSize: "14px", fontWeight: "bold" }}>To</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <img style={styles.receiptToUserImg} src={user.photo || "https://i.pravatar.cc/160?img=12"} alt="Me" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#111" }}>{user.name || "Save Money User"}</h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#666" }}>Wallet ID: {referCode}</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#888" }}>SAVE MONEY Main Bank - 7707 ⚡</p>
                  </div>
                </div>
              </div>

              <div style={styles.receiptDivider} />

              {/* ফুটার ট্রানসাকশান টাইম ও আইডি */}
              <div style={styles.receiptFooterDetails}>
                <p>Received at {new Date(selectedTxn.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}, {new Date(selectedTxn.date).toLocaleDateString("en-IN", {day: 'numeric', month: 'short', year: 'numeric'})}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                  <p style={{ margin: 0 }}>Ref No: TXN{new Date(selectedTxn.date).getTime().toString().slice(-10)}</p>
                  <b style={{ color: "#2563eb", cursor: "pointer", fontSize: "14px" }} onClick={() => copyText(`TXN${new Date(selectedTxn.date).getTime().toString().slice(-10)}`)}>Copy</b>
                </div>
              </div>

            </div>

            <button style={styles.receiptCloseFullBtn} onClick={() => setSelectedTxn(null)}>Close Receipt</button>
          </div>
        </div>
      )}

      {/* --- Performance Modal --- */}
      {bonusModal === "performance" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>📈 Performance Bonus</h2>
          <h1>{money(performance.balance)}</h1>
          <p>Status : <b style={{ color: performance.enabled ? "#16a34a" : "#ef4444" }}>{performance.enabled ? "Active" : "Inactive"}</b></p>
          {!performance.enabled && !performance.adminOverride && !performance.expired && (
            <div style={styles.infoBox}>
              <h3>Task Progress</h3>
              <p>Completed : <b>{performance.directActiveCount}</b> /10</p>
              <p>Remaining : <b>{performance.remaining}</b></p>
              <p>Days Left : <b>{performance.daysLeft}</b> Days</p>
            </div>
          )}
          {performance.expired && !performance.enabled && (
            <p style={styles.dangerText}>You did not complete your task. Please contact your upline.</p>
          )}
          {performance.enabled && (
            <>
              <p>This Month Bonus</p>
              <h3>{money(performance.thisMonthBonus)}</h3>
              <p>Last Month Bonus</p>
              <h3>{money(performance.lastMonthBonus)}</h3>
              <select value={performanceFilter} onChange={(e) => setPerformanceFilter(e.target.value)} style={styles.filterSelect}>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="all">All</option>
              </select>
              <div style={{ marginTop: 20 }}>
                <h3>Performance History</h3>
                {filteredPerformanceHistory.length === 0 ? <p>No History</p> : filteredPerformanceHistory.map((item, index) => (
                  <div key={index} style={styles.historyItem}>
                    <b>{item.fromName}</b>
                    <p>Bonus : {money(item.amount)}</p>
                    <p>Date : {new Date(item.date).toLocaleDateString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {/* --- Team Modal --- */}
      {bonusModal === "team" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>👥 Team Bonus</h2>
          <h1>{money(team.balance || 0)}</h1>
          <p>Status : <b style={{ color: team.enabled ? "#16a34a" : "#ef4444" }}>{team.enabled ? "Active" : "Inactive"}</b></p>
          <hr />
          <h3>Today's Report</h3>
          <p>Today's Income : <b>{money(team.todayBonus)}</b></p>
          <button style={styles.todayJoinBtn} onClick={() => setShowTodayJoinModal(true)}>
            📊 Network Joining Today: <b>{team.todayJoin || 0}</b> (View All)
          </button>
          <hr />
          <div style={{ marginTop: 15, marginBottom: 15 }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>⏱ Select Time Frame:</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select value={teamTimeFilter} onChange={(e) => setTeamTimeFilter(e.target.value)} style={styles.filterSelect}>
                <option value="allTime">🌐 All Time</option>
                <option value="thisMonth">📅 This Month</option>
                <option value="lastMonth">📅 Last Month</option>
                <option value="customRange">📆 Select Date Range</option>
              </select>
              {teamTimeFilter === "customRange" && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <small style={{ display: "block", color: "#666" }}>Start Date:</small>
                    <input type="date" value={teamStartDate} onChange={(e) => setTeamStartDate(e.target.value)} style={{ ...styles.filterSelect, width: "100%" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <small style={{ display: "block", color: "#666" }}>End Date:</small>
                    <input type="date" value={teamEndDate} onChange={(e) => setTeamEndDate(e.target.value)} style={{ ...styles.filterSelect, width: "100%" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <h3>Total Level Members</h3>
          <div style={styles.levelGrid}>
            <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "10px" }}><b>L1</b><br />Users: {dynamicCounts[1]}</div>
            <div><b>L2</b><br />Users: {dynamicCounts[2]}</div>
            <div><b>L3</b><br />Users: {dynamicCounts[3]}</div>
            <div><b>L4</b><br />Users: {dynamicCounts[4]}</div>
            <div><b>L5</b><br />Users: {dynamicCounts[5]}</div>
          </div>
          <hr />
          <h3>Income Summary</h3>
          <p>Selected Filter Total Income: <b style={{ color: "#2563eb" }}>{teamTimeFilter === "allTime" ? money(team.balance) : money(selectedFilteredTotalIncome)}</b></p>
          <hr />
          <h3>Level Income</h3>
          <div style={styles.levelGrid}>
            <div>Level 1<br />{money(dynamicIncomes[1])}</div>
            <div>Level 2<br />{money(dynamicIncomes[2])}</div>
            <div>Level 3<br />{money(dynamicIncomes[3])}</div>
            <div>Level 4<br />{money(dynamicIncomes[4])}</div>
            <div>Level 5<br />{money(dynamicIncomes[5])}</div>
          </div>
          <hr />
          <h3>Team Bonus History</h3>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr><th>User</th><th>Upline</th><th>Level</th><th>Earned</th></tr>
              </thead>
              <tbody>
                {selectedFilteredHistory.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: "center", padding: 10 }}>No Team Bonus History</td></tr>
                ) : (
                  selectedFilteredHistory.map((item, index) => (
                    <tr key={index}>
                      <td><b>{item.fromName || "-"}</b></td>
                      <td>{item.uplineName || "-"}</td>
                      <td>L{item.level || "-"}</td>
                      <td style={{ fontWeight: "bold", color: "#2563eb" }}>{money(item.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {/* --- Royalty Modal --- */}
      {bonusModal === "royalty" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>👑 Royalty Bonus</h2>
          <h1>{money(royalty.balance)}</h1>
          <p>Status: <b>{royalty.enabled ? "Active" : "Inactive"}</b></p>
          <p>Direct Refer: <b>{royalty.directCount || 0}</b> / 50</p>
          <p>This Month Royalty: <b>{money(royalty.thisMonthRoyalty)}</b></p>
          <p style={styles.infoBox}>Royalty status will become active once 50 direct referrals are completed.</p>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {/* --- Refer Modal --- */}
      {bonusModal === "refer" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>🎁 Refer Bonus</h2>
          <button style={styles.pendingToggleBtn} onClick={() => setShowPendingModal(true)}>⏳ View Pending Refers ({pendingRefers.length})</button>
          <h1>{money(referBonus.totalBonus || 0)}</h1>
          <div style={styles.levelGrid}>
            <div>Total Direct<br /><b>{history.length}</b></div>
            <div>Active<br /><b>{history.filter((x) => x.status === "Active").length}</b></div>
            <div>Inactive<br /><b>{history.filter((x) => x.status === "Inactive").length}</b></div>
          </div>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {/* Sub Modals */}
      {showPendingModal && (
        <Modal onClose={() => setShowPendingModal(false)}>
          <h2 style={{ color: "#ea580c" }}>⏳ Pending Refers List</h2>
          <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingRefers.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: 12, borderRadius: 14 }}>
                <div><b>{item.name}</b><br/><small>{item.email}</small></div>
                <span style={{ background: "#ffedd5", color: "#ea580c", padding: "6px 12px", borderRadius: 8 }}>Pending</span>
              </div>
            ))}
          </div>
          <button style={styles.closeBtn} onClick={() => setShowPendingModal(false)}>Back</button>
        </Modal>
      )}

      {showTodayJoinModal && (
        <Modal onClose={() => setShowTodayJoinModal(false)}>
          <h2>📊 Today's Network Joining List</h2>
          <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {todayJoinMembers.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: 12, borderRadius: 14 }}>
                <div><b>{item.fromName}</b><br/><small>Level {item.level}</small></div>
                <span style={{ background: "#dbeafe", color: "#2563eb", padding: "6px 12px", borderRadius: 8 }}>Today</span>
              </div>
            ))}
          </div>
          <button style={styles.closeBtn} onClick={() => setShowTodayJoinModal(false)}>Back</button>
        </Modal>
      )}

    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// 🛠️ সম্পূর্ণ ইনলাইন স্টাইল অবজেক্ট যেখানে নতুন ফিচারের সব ডিজাইন যোগ করা হয়েছে
const styles = {
  // ⚡ নতুন ট্রানসাকশান হিস্ট্রি লিস্টের স্টাইলস (১ম স্ক্রিনশট ম্যাচিং)
  txnListWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    background: "#e2e8f0",
    borderRadius: "16px",
    overflow: "hidden"
  },
  txnItemCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#ffffff",
    cursor: "pointer",
    transition: "background 0.2s",
    borderBottom: "1px solid #f1f5f9"
  },
  txnLeftSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  txnAvatarCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "16px",
    letterSpacing: "0.5px"
  },
  txnNameText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b"
  },
  txnTimeText: {
    margin: "3px 0 6px 0",
    fontSize: "13px",
    color: "#64748b"
  },
  txnBadgeTag: {
    fontSize: "12px",
    background: "#f1f5f9",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "20px",
    fontWeight: "500"
  },
  txnRightSection: {
    textAlign: "right"
  },
  txnAmountText: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#16a34a"
  },
  txnBankText: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  paytmMinilogo: {
    color: "#00baf2",
    fontWeight: "bold"
  },

  // ⚡ নতুন ডিজিটাল পেমেন্ট রিসিটের স্টাইলস (২য় স্ক্রিনশট ম্যাচিং)
  receiptContainer: {
    width: "min(440px, 96vw)",
    background: "#f4f6f9",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    overflowY: "auto",
    maxHeight: "92vh"
  },
  receiptHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  receiptBackBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#333"
  },
  receiptHeaderTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#111"
  },
  receiptTopActionBtn: {
    color: "#2563eb",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "15px"
  },
  receiptBodyCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px 20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.03)"
  },
  receiptAmountRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px"
  },
  verifiedCheckBadge: {
    background: "#00baf2",
    color: "#fff",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold"
  },
  receiptInWords: {
    margin: "4px 0 0 0",
    color: "#666",
    fontSize: "14px",
    fontStyle: "italic"
  },
  receiptStatusTag: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600"
  },
  receiptDivider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "20px 0"
  },
  receiptUserAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#fecdd3",
    color: "#e11d48",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  receiptActionOutlineBtn: {
    flex: 1,
    background: "none",
    border: "1px solid #00baf2",
    color: "#00baf2",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "center"
  },
  receiptToUserImg: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #e2e8f0"
  },
  receiptFooterDetails: {
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#64748b"
  },
  receiptCloseFullBtn: {
    width: "100%",
    padding: "14px",
    background: "#1e293b",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontWeight: "bold",
    marginTop: "16px",
    cursor: "pointer"
  },

  // আগের অন্যান্য প্রয়োজনীয় স্টাইলসমূহ
  statusOverlayBg: { position: "fixed", inset: 0, background: "rgba(10, 15, 30, 0.45)", backdropFilter: "blur(8px)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center" },
  statusOverlayCard: { background: "rgba(255, 255, 255, 0.95)", padding: "30px 40px", borderRadius: "20px", textAlign: "center", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.15)", maxWidth: "360px", width: "85%", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  statusOverlayIcon: { width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "bold" },
  statusOverlayText: { fontSize: "17px", color: "#1e293b", margin: 0, fontWeight: "700" },
  loadingPage: { minHeight: "100vh", background: "#fff7ff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial" },
  loadingBox: { background: "white", padding: 35, borderRadius: 30, textAlign: "center", boxShadow: "0 20px 45px rgba(124,58,237,.18)" },
  loadingIcon: { fontSize: 70 },
  page: { minHeight: "100vh", padding: 28, background: "radial-gradient(circle at top left,#fff0ff,transparent 28%),radial-gradient(circle at top right,#ffe8f5,transparent 30%),linear-gradient(135deg,#fffaff,#f8f3ff,#ffffff)", fontFamily: "Arial, sans-serif", color: "#111542", position: "relative" },
  backBtn: { position: "absolute", top: 24, left: 24, width: 54, height: 54, border: "none", borderRadius: 16, background: "white", boxShadow: "0 12px 30px rgba(137,84,255,.22)", fontSize: 30, cursor: "pointer" },
  bellBtn: { position: "absolute", top: 24, right: 24, width: 58, height: 58, border: "none", borderRadius: 18, background: "white", boxShadow: "0 12px 30px rgba(137,84,255,.22)", fontSize: 25, cursor: "pointer" },
  header: { textAlign: "center" },
  welcome: { margin: 0, fontSize: 22 },
  mainTitle: { margin: "2px 0 0", fontSize: 58, fontWeight: 900, background: "linear-gradient(90deg,#1463ff,#8b20ff,#ff1685)", WebkitBackgroundClip: "text", color: "transparent" },
  referWorld: { margin: 0, fontSize: 36 },
  tagline: { color: "#62678c", fontSize: 18 },
  heroCard: { width: "min(1050px, 94vw)", margin: "30px auto 18px", padding: 40, borderRadius: 34, background: "linear-gradient(135deg,#3a19d6,#6b08d8,#b616a1)", color: "white", display: "flex", justifyContent: "space-between", gap: 30, boxShadow: "0 30px 55px rgba(102,38,190,.35)" },
  heroLeft: { display: "flex", alignItems: "center", gap: 28 },
  avatarWrap: { position: "relative" },
  avatar: { width: 140, height: 140, borderRadius: "50%", border: "8px solid white", objectFit: "cover" },
  crown: { position: "absolute", right: -4, bottom: 12, width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#e11dff,#9f18ff)", display: "grid", placeItems: "center", fontSize: 24, border: "4px solid white" },
  activeMember: { display: "inline-block", margin: "12px 0", padding: "10px 18px", borderRadius: 12, background: "rgba(255,255,255,.16)", fontWeight: 700 },
  greenDot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block", marginRight: 8 },
  smallText: { margin: "8px 0", opacity: 0.9 },
  referIdBox: { border: "1px dashed rgba(255,255,255,.85)", borderRadius: 14, padding: "12px 16px", fontSize: 20, fontWeight: 900, display: "flex", gap: 18, justifyContent: "space-between" },
  heroRight: { minWidth: 270 },
  walletRound: { width: 76, height: 76, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", fontSize: 38 },
  linkCard: { width: "min(1120px, 94vw)", margin: "20px auto", padding: 28, borderRadius: 26, background: "white", boxShadow: "0 16px 36px rgba(156,105,255,.16)", display: "flex", alignItems: "center", gap: 24 },
  linkIcon: { width: 90, height: 90, borderRadius: 22, background: "#f0e7ff", display: "grid", placeItems: "center", fontSize: 48 },
  linkMiddle: { flex: 1 },
  copyBox: { border: "1px solid #ddd9ec", borderRadius: 14, padding: 12, display: "flex", justifyContent: "space-between", gap: 10 },
  copyLinkBtn: { border: "none", borderRadius: 12, padding: "12px 22px", background: "linear-gradient(90deg,#7c3aed,#d946ef)", color: "#fff", fontWeight: 900, cursor: "pointer" },
  shareBox: { borderLeft: "1px solid #e7e2f0", paddingLeft: 30, minWidth: 190 },
  whatsapp: { width: 58, height: 58, border: "none", borderRadius: "50%", background: "#16c768", color: "white", fontSize: 24, marginRight: 12, cursor: "pointer" },
  telegram: { width: 58, height: 58, border: "none", borderRadius: "50%", background: "#2196f3", color: "white", fontSize: 30, cursor: "pointer" },
  bonusGrid: { width: "min(1120px, 94vw)", margin: "26px auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 },
  bonusCard: { borderRadius: 24, padding: "34px 18px", textAlign: "center", boxShadow: "0 14px 34px rgba(0,0,0,.08)" },
  bonusIcon: { width: 78, height: 78, borderRadius: 22, margin: "0 auto 18px", display: "grid", placeItems: "center", color: "white", fontSize: 38 },
  detailBtn: { border: "1px solid currentColor", borderRadius: 12, background: "white", padding: "12px 22px", fontWeight: 900, cursor: "pointer" },
  historyCard: { width: "min(1120px, 94vw)", margin: "26px auto", background: "white", borderRadius: 26, padding: 28, boxShadow: "0 16px 36px rgba(156,105,255,.16)" },
  filterSelect: { padding: "12px 18px", borderRadius: 14, border: "1px solid #ddd", fontSize: "15px", outline: "none", background: "#fff" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 700, textAlign: "left" },
  viewMoreBtn: { display: "block", margin: "22px auto 0", border: "none", background: "white", color: "#7b20e8", fontSize: 18, fontWeight: 900, cursor: "pointer" },
  bottomBanner: { width: "min(1120px, 94vw)", margin: "26px auto 10px", padding: "26px 34px", borderRadius: 24, background: "linear-gradient(90deg,#fff2ff,#f5eaff)", display: "flex", alignItems: "center", gap: 24 },
  bottomGift: { fontSize: 70 },
  referNowBtn: { border: "none", borderRadius: 16, padding: "18px 48px", color: "white", background: "linear-gradient(90deg,#7b20ff,#c515e9)", fontSize: 20, fontWeight: 900, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { width: "min(760px, 96vw)", maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: 28, padding: 28, boxShadow: "0 30px 90px rgba(0,0,0,.25)" },
  closeBtn: { marginTop: 20, width: "100%", border: "none", borderRadius: 14, padding: 14, background: "#e5e7eb", fontWeight: 900, cursor: "pointer" },
  levelGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "16px 0", fontWeight: 700 },
  infoBox: { background: "#f8fafc", padding: 14, borderRadius: 14, lineHeight: 1.6 },
  historyItem: { padding: 15, marginTop: 10, background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" },
  dangerText: { color: "#dc2626", fontWeight: "bold", marginTop: 20 },
  successText: { color: "#16a34a", fontWeight: 900 },
  pendingToggleBtn: { display: "block", width: "100%", padding: "14px", margin: "10px 0 20px 0", background: "linear-gradient(90deg, #ff9800, #f44336)", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" },
  todayJoinBtn: { display: "block", width: "100%", padding: "12px", margin: "12px 0", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "12px", textAlign: "left", fontSize: "15px", cursor: "pointer", fontWeight: "500" }
};
