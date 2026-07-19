import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  const [referBonus, setReferBonus] = useState({});
  const [performanceFilter, setPerformanceFilter] = useState("thisMonth");
  
  const [teamTimeFilter, setTeamTimeFilter] = useState("allTime"); 
  const [teamStartDate, setTeamStartDate] = useState("");
  const [teamEndDate, setTeamEndDate] = useState("");

  const [bonusFilter, setBonusFilter] = useState("All");
  const [showAllBonusHistory, setShowAllBonusHistory] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showTodayJoinModal, setShowTodayJoinModal] = useState(false);

  const [statusOverlay, setStatusOverlay] = useState({ show: false, type: "info", message: "" });

  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => setStatusOverlay({ show: false, type: "info", message: "" }), 2000);
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
        headers: { "Content-Type": "application/json", authorization: token || "" },
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
      if (teamTimeFilter === "thisMonth") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
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
    getFilteredTeamHistory().forEach(item => {
      const lvl = Number(item.level);
      if (lvl >= 1 && lvl <= 5) counts[lvl] += 1;
    });
    if (teamTimeFilter === "allTime") {
      if (counts[1] === 0) counts[1] = history.length;
      for (let i = 2; i <= 5; i++) {
        if (counts[i] === 0) counts[i] = team.totalJoinCount?.[i] || team.levelCount?.[i] || 0;
      }
    }
    return counts;
  };

  const getDynamicLevelIncomes = () => {
    const incomes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    getFilteredTeamHistory().forEach(item => {
      const lvl = Number(item.level);
      if (lvl >= 1 && lvl <= 5) incomes[lvl] += Number(item.amount || 0);
    });
    if (teamTimeFilter === "allTime") {
      for (let i = 1; i <= 5; i++) {
        if (incomes[i] === 0) incomes[i] = team[`level${i}Income`] || 0;
      }
    }
    return incomes;
  };

  const money = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pBonus = Number(performance.balance || 0);
  const tBonus = Number(team.balance || 0);
  const rBonus = Number(royalty.balance || 0);
  const refBonus = Number(referBonus.totalBonus || 0);

  // ফিক্সড ওয়ালেট হিসাব: কার্ডের ভ্যালুগুলোর নিখুঁত যোগফল
  const totalReferWallet = pBonus + tBonus + rBonus + refBonus;

  const referCode = user.referCode || user.referralCode || "SMREF0001";
  const referLink = `${window.location.origin}/register?ref=${referCode}`;

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerStatusOverlay("success", "Copied Successfully! 🎉");
    } catch {
      triggerStatusOverlay("error", "Copy failed!");
    }
  };

  const visibleBonusHistory = showAllBonusHistory ? (bonusHistory || []) : (bonusHistory || []).slice(0, 5);

  return (
    <div style={styles.page}>
      {statusOverlay.show && (
        <div style={styles.statusOverlayBg}>
          <div style={styles.statusOverlayCard}>
            <div style={{ ...styles.statusOverlayIcon, background: statusOverlay.type === "success" ? "#dcfce7" : "#fee2e2", color: statusOverlay.type === "success" ? "#10b981" : "#ef4444" }}>
              {statusOverlay.type === "success" ? "✓" : "✕"}
            </div>
            <h3 style={styles.statusOverlayText}>{statusOverlay.message}</h3>
          </div>
        </div>
      )}

      <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
      
      <header style={styles.header}>
        <h1 style={styles.mainTitle}>SAVE MONEY</h1>
        <p style={styles.tagline}>🔒 Elite Affiliate & Network Portal</p>
      </header>

      {/* প্রিমিয়াম হিরো সেকশন */}
      <section style={styles.heroCard}>
        <div style={styles.heroLeft}>
          <div style={styles.avatarWrap}>
            <img style={styles.avatar} src={user.photo || "https://i.pravatar.cc/160?img=12"} alt="user" />
            <div style={styles.crown}>👑</div>
          </div>
          <div>
            <h2 style={styles.userName}>{user.name || "User"}</h2>
            <span style={{ ...styles.statusBadge, background: String(user.activeStatus).toLowerCase() === "active" ? "#10b981" : "#ef4444" }}>
              {user.activeStatus || "Inactive"}
            </span>
            <div style={styles.referCodeContainer}>
              <span style={styles.codeLabel}>ID: {referCode}</span>
              <button style={styles.miniCopy} onClick={() => copyText(referCode)}>Copy</button>
            </div>
          </div>
        </div>
        <div style={styles.heroRight}>
          <p style={styles.walletTitle}>Total Wallet Earnings</p>
          <h1 style={styles.walletAmount}>{money(totalReferWallet)}</h1>
        </div>
      </section>

      {/* প্রিমিয়াম লিঙ্ক শেয়ার কার্ড */}
      <section style={styles.linkCard}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#64748b" }}>🔗 Exclusive Invitation Link</h4>
          <div style={styles.copyBox}>
            <span style={styles.linkText}>{referLink}</span>
            <button style={styles.copyLinkBtn} onClick={() => copyText(referLink)}>Copy Link</button>
          </div>
        </div>
        <div style={styles.shareChannels}>
          <button style={{ ...styles.channelBtn, background: "#25D366" }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(referLink)}`, "_blank")}>WhatsApp</button>
        </div>
      </section>

      {/* গ্রিড আর্কিটেকচার কার্ড */}
      <section style={styles.bonusGrid}>
        {[
          { key: "performance", title: "Performance", amount: pBonus, icon: "📈", color: "#8b5cf6" },
          { key: "team", title: "Team Bonus", amount: tBonus, icon: "👥", color: "#3b82f6" },
          { key: "royalty", title: "Royalty Club", amount: rBonus, icon: "👑", color: "#f59e0b" },
          { key: "refer", title: "Direct Refer", amount: refBonus, icon: "🎁", color: "#10b981" }
        ].map(b => (
          <div key={b.key} style={styles.bonusCard}>
            <div style={{ ...styles.cardBadge, background: b.color }}>{b.icon}</div>
            <h4 style={styles.cardTitle}>{b.title}</h4>
            <h2 style={styles.cardPrice}>{money(b.amount)}</h2>
            <button style={styles.cardBtn} onClick={() => setBonusModal(b.key)}>Analytics →</button>
          </div>
        ))}
      </section>

      {/* হিস্ট্রি টেবিল */}
      <section style={styles.historyCard}>
        <div style={styles.historyHeader}>
          <h3 style={{ margin: 0 }}>📊 Financial Statements</h3>
          <select value={bonusFilter} onChange={(e) => setBonusFilter(e.target.value)} style={styles.filterSelect}>
            <option value="All">All Transactions</option>
            <option value="Referral Bonus">Referral</option>
            <option value="Team Bonus">Team</option>
          </select>
        </div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Level</th>
                <th>Credits</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {visibleBonusHistory.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: 20 }}>No logs recorded</td></tr>
              ) : (
                visibleBonusHistory.map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: "600" }}>{item.bonusType}</td>
                    <td><b>{item.fromName || "-"}</b></td>
                    <td>{item.level ? `L${item.level}` : "-"}</td>
                    <td style={{ color: "#10b981", fontWeight: "700" }}>+{money(item.amount)}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Team Modal (Date Range ফিক্স সহ) --- */}
      {bonusModal === "team" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2 style={{ color: "#1e293b", marginBottom: 6 }}>👥 Network Dashboard</h2>
          <p style={{ color: "#64748b", margin: "0 0 20px 0" }}>Real-time hierarchy metrics</p>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: "600", display: "block", marginBottom: 6 }}>Filter Time Frame</label>
            <select value={teamTimeFilter} onChange={(e) => setTeamTimeFilter(e.target.value)} style={{ ...styles.filterSelect, width: "100%" }}>
              <option value="allTime">All Time Records</option>
              <option value="customRange">Custom Range (e.g. 1-15 Days)</option>
            </select>
            {teamTimeFilter === "customRange" && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <input type="date" value={teamStartDate} onChange={(e) => setTeamStartDate(e.target.value)} style={{ ...styles.filterSelect, flex: 1 }} />
                <input type="date" value={teamEndDate} onChange={(e) => setTeamEndDate(e.target.value)} style={{ ...styles.filterSelect, flex: 1 }} />
              </div>
            )}
          </div>

          <div style={styles.levelContainerGrid}>
            {[1, 2, 3, 4, 5].map(lvl => (
              <div key={lvl} style={styles.lvlBox}>
                <span>Level {lvl}</span>
                <h3>{getDynamicLevelCounts()[lvl]} Users</h3>
                <small>{money(getDynamicLevelIncomes()[lvl])}</small>
              </div>
            ))}
          </div>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Dismiss</button>
        </Modal>
      )}

      {/* বাকি মডালগুলো ক্লোজ করার সিম্পল অ্যাকশন হ্যান্ডলার */}
      {bonusModal && bonusModal !== "team" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>{bonusModal.toUpperCase()} Analytics</h2>
          <p>Detailed performance sheets and history configurations.</p>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Dismiss</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 24px",
    fontFamily: "'Inter', sans-serif",
    color: "#0f172a"
  },
  backBtn: {
    border: "none",
    background: "#fff",
    width: 46,
    height: 46,
    borderRadius: "50%",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    cursor: "pointer",
    fontSize: 20
  },
  header: { textAlign: "center", marginBottom: 35 },
  mainTitle: { fontSize: 32, fontWeight: "800", letterSpacing: "-1px", margin: "0 0 6px 0" },
  tagline: { color: "#64748b", fontSize: 15, margin: 0 },
  heroCard: {
    width: "min(1000px, 100%)",
    margin: "0 auto 24px auto",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    borderRadius: 24,
    padding: 32,
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 24,
    boxShadow: "0 20px 40px rgba(124, 58, 237, 0.25)"
  },
  heroLeft: { display: "flex", alignItems: "center", gap: 20 },
  avatarWrap: { position: "relative" },
  avatar: { width: 90, height: 90, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.2)" },
  crown: { position: "absolute", bottom: -2, right: -2, fontSize: 20 },
  userName: { margin: "0 0 4px 0", fontSize: 22, fontWeight: "700" },
  statusBadge: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: "600", display: "inline-block" },
  referCodeContainer: { display: "flex", alignItems: "center", gap: 10, marginTop: 10 },
  codeLabel: { fontSize: 14, opacity: 0.9 },
  miniCopy: { border: "none", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "2px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  heroRight: { textAlign: "right" },
  walletTitle: { margin: "0 0 6px 0", opacity: 0.8, fontSize: 14 },
  walletAmount: { margin: 0, fontSize: 36, fontWeight: "800" },
  linkCard: { width: "min(1000px, 100%)", margin: "0 auto 24px auto", background: "#fff", padding: 24, borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" },
  copyBox: { display: "flex", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginTop: 8, background: "#f8fafc" },
  linkText: { padding: "12px 16px", color: "#475569", fontSize: 14, display: "flex", alignItems: "center", overflowX: "auto", whiteSpace: "nowrap", maxWIdth: "300px" },
  copyLinkBtn: { border: "none", background: "#0f172a", color: "#fff", padding: "0 20px", fontWeight: "600", cursor: "pointer" },
  shareChannels: { display: "flex", alignItems: "center" },
  channelBtn: { border: "none", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: "600", cursor: "pointer" },
  bonusGrid: { width: "min(1000px, 100%)", margin: "0 auto 24px auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 },
  bonusCard: { background: "#fff", padding: 24, borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.02)", position: "relative", border: "1px solid #f1f5f9" },
  cardBadge: { width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", color: "#fff", marginBottom: 16 },
  cardTitle: { margin: "0 0 6px 0", color: "#64748b", fontSize: 15, fontWeight: "500" },
  cardPrice: { margin: "0 0 16px 0", fontSize: 24, fontWeight: "700" },
  cardBtn: { border: "none", background: "none", color: "#4f46e5", fontWeight: "600", cursor: "pointer", padding: 0, fontSize: 14 },
  historyCard: { width: "min(1000px, 100%)", margin: "0 auto auto auto", background: "#fff", padding: 24, borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" },
  historyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  filterSelect: { padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 14, outline: "none" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 600, textAlign: "left", fontSize: 14 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { width: "min(550px, 100%)", background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 20px 50px rgba(0,0,0,0.1)" },
  closeBtn: { width: "100%", border: "none", background: "#f1f5f9", padding: 14, borderRadius: 12, fontWeight: "600", cursor: "pointer", marginTop: 20, color: "#475569" },
  levelContainerGrid: { display: "flex", flexDirection: "column", gap: 12, marginTop: 16 },
  lvlBox: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" },
  statusOverlayBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" },
  statusOverlayCard: { background: "#fff", padding: 24, borderRadius: 16, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
  statusOverlayIcon: { width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 10px auto", fontWeight: "bold" }
};
