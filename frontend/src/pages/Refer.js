import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas"; // ছবি জেনারেট করার জন্য নতুন লাইব্রেরি
import { API } from "../config";

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
  const [treeOpen, setTreeOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [referBonus, setReferBonus] = useState({});
  const [performanceFilter, setPerformanceFilter] = useState("thisMonth");
  
  // ট্রানসাকশান ডিটেইলস পপআপের জন্য স্টেট
  const [selectedTx, setSelectedTx] = useState(null);

  // স্ক্রিনশট নেওয়ার জন্য রেফারেন্স
  const receiptRef = useRef(null);

  // কাস্টম ডেট রেঞ্জ ফিল্টার স্টেট
  const [teamTimeFilter, setTeamTimeFilter] = useState("allTime"); 
  const [teamStartDate, setTeamStartDate] = useState("");
  const [teamEndDate, setTeamEndDate] = useState("");

  const [bonusFilter, setBonusFilter] = useState("All");
  const [showAllBonusHistory, setShowAllBonusHistory] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showTodayJoinModal, setShowTodayJoinModal] = useState(false);

  // প্রিমিয়াম ইনফো/স্ট্যাটাস মেসেজ ওভারলে স্টেট
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
  }, [bonusModal]);

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

  // টিম হিস্ট্রি ফিল্টার করার লজিক
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
      minimumFractionDigits: 0,
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

  // 🛠️ রিসিট কার্ডটিকে ইমেজে রূপান্তর করে সরাসরি শেয়ার করার ফাংশন
  const handleShareTxImage = async () => {
    if (!receiptRef.current) return;
    try {
      triggerStatusOverlay("info", "Generating receipt image... ⏳");
      
      // মোডাল এলিমেন্টকে ক্যানভাসে রূপান্তর
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true, 
        allowTaint: true,
        backgroundColor: "#ffffff",
        scale: 2 // হাই কোয়ালিটি ছবির জন্য
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `SaveMoney_Receipt.png`, { type: "image/png" });
        
        // ব্রাউজার যদি ফাইল শেয়ারিং সাপোর্ট করে (যেমন মোবাইল বা মডার্ন ব্রাউজার)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Transaction Receipt",
            text: "Save Money Transaction Successful! ✅"
          });
        } else {
          // পিসিতে বা ব্যাকআপ হিসেবে ইমেজ ডাউনলোড করার সুবিধা
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `Receipt_${Date.now()}.png`;
          link.click();
          triggerStatusOverlay("success", "Receipt downloaded successfully! 🎉");
        }
      }, "image/png");

    } catch (error) {
      console.error("Error sharing image:", error);
      triggerStatusOverlay("error", "Failed to share image!");
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

  const getInitials = (name) => {
    if (!name) return "SM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarBg = (name) => {
    const colors = ["#dcfce7", "#eff6ff", "#fee2e2", "#fff7ed", "#f3e8ff", "#e0f2fe"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getAvatarTextColor = (name) => {
    const colors = ["#15803d", "#1d4ed8", "#b91c1c", "#c2410c", "#6b21a8", "#0369a1"];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
  };

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
    return new Date(item.date).toDateString() === new Date().toDateString();
  });

  const dynamicCounts = getDynamicLevelCounts();
  const dynamicIncomes = getDynamicLevelIncomes();
  const selectedFilteredHistory = getFilteredTeamHistory();
  const selectedFilteredTotalIncome = selectedFilteredHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div style={styles.page}>
      
      {/* স্ট্যাটাস ওভারলে */}
      {statusOverlay.show && (
        <div style={styles.statusOverlayBg}>
          <div style={{
            ...styles.statusOverlayCard,
            borderTop: statusOverlay.type === "success" ? "5px solid #10b981" : statusOverlay.type === "error" ? "5px solid #ef4444" : "5px solid #3b82f6"
          }}>
            <div style={{
              ...styles.statusOverlayIcon,
              background: statusOverlay.type === "success" ? "#dcfce7" : statusOverlay.type === "error" ? "#fee2e2" : "#dbeafe",
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

      {/* হিস্ট্রি লিস্ট এরিয়া */}
      <section style={styles.historyCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2 style={{ fontSize: "20px", fontWeight: "700" }}>💰 All Bonus History</h2></div>
          <select value={bonusFilter} onChange={(e) => setBonusFilter(e.target.value)} style={styles.filterSelect}>
            <option value="All">All Bonus</option>
            <option value="Referral Bonus">🎁 Referral</option>
            <option value="Performance Bonus">📈 Performance</option>
            <option value="Team Bonus">👥 Team</option>
            <option value="Royalty Bonus">👑 Royalty</option>
          </select>
        </div>

        <div style={styles.txListWrapper}>
          {filteredBonusHistory.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>No Bonus History Found</p>
          ) : (
            visibleBonusHistory.map((item, index) => (
              <div key={index} style={styles.txItemRow} onClick={() => setSelectedTx(item)}>
                <div style={styles.txLeftSection}>
                  <div style={{ ...styles.txAvatarCircle, background: getAvatarBg(item.fromName), color: getAvatarTextColor(item.fromName) }}>
                    {getInitials(item.fromName)}
                  </div>
                  <div style={styles.txMetaDetails}>
                    <h4 style={styles.txSenderName}>{item.fromName || "Save Money User"}</h4>
                    <p style={styles.txTimeStamp}>Received Today, {new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    <div style={styles.txTagBadge}>💵 {item.bonusType || "Money Received"}</div>
                  </div>
                </div>
                <div style={styles.txRightSection}>
                  <h3 style={{ ...styles.txAmountText, color: "#16a34a" }}>+ {money(item.amount)}</h3>
                  <p style={styles.txFromBankText}>In <span style={styles.upiIconSmall}>🌐</span></p>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.paytmBrandFooter}>
          <span style={{ fontWeight: "bold", color: "#7b20ff", textTransform: "uppercase", letterSpacing: "1px" }}>save money</span>
        </div>
      </section>

      {filteredBonusHistory.length > 5 && (
        <button style={styles.viewMoreBtn} onClick={() => setShowAllBonusHistory(!showAllBonusHistory)}>
          {showAllBonusHistory ? "Show Less ⌃" : "View More ⌄"}
        </button>
      )}

      {/* ট্রানসাকশান ডিটেইলস মোডাল (এখানেই ছবি শেয়ারের পরিবর্তন করা হয়েছে) */}
      {selectedTx && (
        <div style={styles.modalOverlay} onClick={() => setSelectedTx(null)}>
          <div style={styles.txDetailsCard} onClick={(e) => e.stopPropagation()}>
            
            {/* মোডাল হেডার */}
            <div style={styles.txDetailsHeader}>
              <button style={styles.txBackArrow} onClick={() => setSelectedTx(null)}>←</button>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Money Received</h3>
              <div style={{ display: "flex", gap: "15px" }}>
                {/* 🛠️ এখানে ক্লিক করলেই কার্ডটির ছবি শেয়ার হবে */}
                <span style={styles.txHeaderLink} onClick={handleShareTxImage}>Share Receipt 📸</span>
                <span style={styles.txHeaderLink} onClick={() => setSelectedTx(null)}>Close</span>
              </div>
            </div>

            {/* 🛠️ রিসিট ইমেজের জন্য রেফারেন্স দেওয়া মূল কন্টেন্ট বক্স */}
            <div ref={receiptRef} style={styles.txDetailsInnerBox}>
              
              <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "1px dashed #e2e8f0" }}>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Amount</p>
                <h1 style={styles.txDetailMainAmount}>
                  {money(selectedTx.amount)} <span style={styles.verifiedCheck}>✓</span>
                </h1>
                <div style={styles.moneyReceivedTag}>💵 {selectedTx.bonusType || "Money Received"}</div>
              </div>

              {/* From সেকশন */}
              <div style={{ display: "flex", justifyContext: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <div style={{ flex: 1 }}>
                  <p style={styles.sectionLabel}>From</p>
                  <h4 style={styles.sectionValueName}>{selectedTx.fromName || "Sender User"} <span style={styles.blueTick}>✓</span></h4>
                  <p style={styles.sectionSubValue}>{selectedTx.fromEmail || "user@savemoney"}</p>
                </div>
                {selectedTx.fromPhoto || selectedTx.photo ? (
                  <img style={styles.detailUserImage} src={selectedTx.fromPhoto || selectedTx.photo} alt="Sender" />
                ) : (
                  <div style={{ ...styles.detailAvatarCircle, background: getAvatarBg(selectedTx.fromName), color: getAvatarTextColor(selectedTx.fromName) }}>
                    {getInitials(selectedTx.fromName)}
                  </div>
                )}
              </div>

              {/* To সেকশন */}
              <div style={{ display: "flex", justifyContext: "space-between", alignItems: "center", padding: "18px 0" }}>
                <div style={{ flex: 1 }}>
                  <p style={styles.sectionLabel}>To</p>
                  <h4 style={styles.sectionValueName}>{user.name || "Save Money User"}</h4>
                  <p style={styles.bankNameFooter}>Save Money Wallet - {referCode}</p>
                </div>
                <img style={styles.detailUserImage} src={user.photo || "https://i.pravatar.cc/160?img=12"} alt="Receiver" />
              </div>

              {/* ফুটারে টাইমস্ট্যাম্প ও রেফারেন্স আইডি */}
              <div style={styles.txFooterMetaDetails}>
                <p>Received at {new Date(selectedTx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, {new Date(selectedTx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p style={{ display: "flex", justifyContent: "space-between", margin: 0 }}>
                  <span>Ref No: TXN{Math.floor(100000000 + Math.random() * 900000000)}</span>
                </p>
              </div>
            </div>

            <button style={styles.closeBtn} onClick={() => setSelectedTx(null)}>Close</button>
          </div>
        </div>
      )}

      {/* --- অন্যান্য পূর্ববর্তী মোডালসমূহ --- */}
      {bonusModal === "performance" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>📈 Performance Bonus</h2>
          <h1>{money(performance.balance)}</h1>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {bonusModal === "team" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>👥 Team Bonus</h2>
          <h1>{money(team.balance || 0)}</h1>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {bonusModal === "royalty" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>👑 Royalty Bonus</h2>
          <h1>{money(royalty.balance)}</h1>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {bonusModal === "refer" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>🎁 Refer Bonus</h2>
          <h1>{money(referBonus.totalBonus || 0)}</h1>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
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

// স্টাইলসমূহ অপরিবর্তিত রাখা হয়েছে
const styles = {
  txListWrapper: { display: "flex", flexDirection: "column", gap: "0px" },
  txItemRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" },
  txLeftSection: { display: "flex", alignItems: "center", gap: "14px" },
  txAvatarCircle: { width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContext: "center", fontWeight: "bold", fontSize: "16px" },
  txMetaDetails: { display: "flex", flexDirection: "column", gap: "2px" },
  txSenderName: { margin: 0, fontSize: "16px", fontWeight: "600", color: "#1e293b" },
  txTimeStamp: { margin: 0, fontSize: "13px", color: "#64748b" },
  txTagBadge: { display: "inline-flex", alignItems: "center", background: "#e8f5e9", color: "#2e7d32", fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px", marginTop: "4px" },
  txRightSection: { textAlign: "right" },
  txAmountText: { margin: 0, fontSize: "16px", fontWeight: "700" },
  txFromBankText: { margin: 0, fontSize: "12px", color: "#64748b", marginTop: "2px" },
  paytmBrandFooter: { display: "flex", justifyContext: "center", alignItems: "center", marginTop: "20px", paddingTop: "10px", fontSize: "14px" },
  txDetailsCard: { width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "24px", padding: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" },
  txDetailsHeader: { display: "flex", justifyContext: "space-between", alignItems: "center", paddingBottom: "15px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" },
  txBackArrow: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#1e293b" },
  txHeaderLink: { color: "#2563eb", fontWeight: "600", fontSize: "14px", cursor: "pointer" },
  txDetailsInnerBox: { border: "1px solid #e2e8f0", borderRadius: "20px", padding: "16px", marginTop: "16px", background: "#fff" },
  txDetailMainAmount: { fontSize: "32px", fontWeight: "800", margin: "5px 0", color: "#1e293b", display: "flex", alignItems: "center", justifyContext: "center", gap: "8px" },
  verifiedCheck: { color: "#10b981", fontSize: "24px" },
  moneyReceivedTag: { background: "#e8f5e9", color: "#2e7d32", padding: "6px 14px", borderRadius: "20px", fontWeight: "bold", fontSize: "13px", display: "inline-block", marginTop: "10px" },
  sectionLabel: { margin: 0, fontSize: "13px", color: "#666", fontWeight: "500" },
  sectionValueName: { margin: "2px 0 0 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" },
  blueTick: { color: "#00baf2" },
  sectionSubValue: { margin: 0, fontSize: "13px", color: "#64748b" },
  bankNameFooter: { margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" },
  detailAvatarCircle: { width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContext: "center", fontWeight: "bold" },
  detailUserImage: { width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" },
  txFooterMetaDetails: { background: "#f8fafc", padding: "12px", borderRadius: "12px", marginTop: "12px", fontSize: "12px", color: "#64748b", lineHeight: "1.6" },
  statusOverlayBg: { position: "fixed", inset: 0, background: "rgba(10, 15, 30, 0.45)", backdropFilter: "blur(8px)", zIndex: 100000, display: "flex", alignItems: "center", justifyContext: "center" },
  statusOverlayCard: { background: "rgba(255, 255, 255, 0.95)", padding: "30px 40px", borderRadius: "20px", textAlign: "center", maxWidth: "360px", width: "85%", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  statusOverlayIcon: { width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContext: "center", fontSize: "26px", fontWeight: "bold" },
  statusOverlayText: { fontSize: "17px", color: "#1e293b", margin: 0, fontWeight: "700" },
  loadingPage: { minHeight: "100vh", background: "#fff7ff", display: "flex", alignItems: "center", justifyContext: "center" },
  loadingBox: { background: "white", padding: 35, borderRadius: 30, textAlign: "center" },
  loadingIcon: { fontSize: 70 },
  page: { minHeight: "100vh", padding: 28, background: "linear-gradient(135deg,#fffaff,#f8f3ff,#ffffff)", position: "relative" },
  backBtn: { position: "absolute", top: 24, left: 24, width: 54, height: 54, border: "none", borderRadius: 16, background: "white", fontSize: 30, cursor: "pointer" },
  bellBtn: { position: "absolute", top: 24, right: 24, width: 58, height: 58, border: "none", borderRadius: 18, background: "white", fontSize: 25, cursor: "pointer" },
  header: { textAlign: "center" },
  mainTitle: { margin: "2px 0 0", fontSize: 58, fontWeight: 900, background: "linear-gradient(90deg,#1463ff,#8b20ff,#ff1685)", WebkitBackgroundClip: "text", color: "transparent" },
  heroCard: { width: "min(1050px, 94vw)", margin: "30px auto 18px", padding: 40, borderRadius: 34, background: "linear-gradient(135deg,#3a19d6,#6b08d8,#b616a1)", color: "white", display: "flex", justifyContext: "space-between", gap: 30 },
  heroLeft: { display: "flex", alignItems: "center", gap: 28 },
  avatarWrap: { position: "relative" },
  avatar: { width: 140, height: 140, borderRadius: "50%", border: "8px solid white", objectFit: "cover" },
  crown: { position: "absolute", right: -4, bottom: 12, width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#e11dff,#9f18ff)", display: "grid", placeItems: "center", fontSize: 24, border: "4px solid white" },
  activeMember: { display: "inline-block", margin: "12px 0", padding: "10px 18px", borderRadius: 12, background: "rgba(255,255,255,.16)", fontWeight: 700 },
  referIdBox: { border: "1px dashed rgba(255,255,255,.85)", borderRadius: 14, padding: "12px 16px", fontSize: 20, fontWeight: 900, display: "flex", justifyContext: "space-between" },
  linkCard: { width: "min(1120px, 94vw)", margin: "20px auto", padding: 28, borderRadius: 26, background: "white", display: "flex", alignItems: "center", gap: 24 },
  linkIcon: { width: 90, height: 90, borderRadius: 22, background: "#f0e7ff", display: "grid", placeItems: "center", fontSize: 48 },
  copyBox: { border: "1px solid #ddd9ec", borderRadius: 14, padding: 12, display: "flex", justifyContext: "space-between" },
  copyLinkBtn: { border: "none", borderRadius: 12, padding: "12px 22px", background: "linear-gradient(90deg,#7c3aed,#d946ef)", color: "#fff", fontWeight: 900, cursor: "pointer" },
  whatsapp: { width: 58, height: 58, border: "none", borderRadius: "50%", background: "#16c768", fontSize: 24, marginRight: 12, cursor: "pointer" },
  telegram: { width: 58, height: 58, border: "none", borderRadius: "50%", background: "#2196f3", fontSize: 30, cursor: "pointer" },
  bonusGrid: { width: "min(1120px, 94vw)", margin: "26px auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 },
  bonusCard: { borderRadius: 24, padding: "34px 18px", textAlign: "center", boxShadow: "0 14px 34px rgba(0,0,0,.08)" },
  bonusIcon: { width: 78, height: 78, borderRadius: 22, margin: "0 auto 18px", display: "grid", placeItems: "center", color: "white", fontSize: 38 },
  detailBtn: { border: "1px solid currentColor", borderRadius: 12, background: "white", padding: "12px 22px", fontWeight: 900, cursor: "pointer" },
  historyCard: { width: "min(1120px, 94vw)", margin: "26px auto", background: "white", borderRadius: 26, padding: 28, boxShadow: "0 16px 36px rgba(156,105,255,.16)" },
  filterSelect: { padding: "12px 18px", borderRadius: 14, border: "1px solid #ddd", fontSize: "15px", background: "#fff" },
  viewMoreBtn: { display: "block", margin: "22px auto 0", border: "none", background: "white", color: "#7b20e8", fontSize: 18, fontWeight: 900, cursor: "pointer" },
  modalBox: { width: "min(760px, 96vw)", maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: 28, padding: 28 }
};
