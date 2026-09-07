import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API } from "../config";

export default function Refer() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ name: "", email: "", photo: "" });
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

  // SIDEBAR
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // Transaction details popup
  const [selectedTx, setSelectedTx] = useState(null);

  // Modal capture ref
  const shareAreaRef = useRef(null);

  // Custom date range filter
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

  const referCode = user?.referCode || "SAVE100";

  // Helper Utilities
  const money = (val) => Number(val || 0).toLocaleString("en-IN");

  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const numberToWords = (num) => {
    return `${num || 0} Rupees Only`;
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    triggerStatusOverlay("success", "Copied to clipboard!");
  };

  const shareWhatsapp = () => {
    const text = `Join Save Money using my referral code: ${referCode}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const loadReferData = (month, year) => {
    console.log("Loading refer data for:", month, year);
  };

  const go = (path) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  const handleDownloadPlan = () => {
    if (isDownloadingPlan) return;
    setIsDownloadingPlan(true);

    setTimeout(() => {
      const link = document.createElement("a");
      link.href = "/SAVE_MONEY_PRIVATE_LIMITED.pdf";
      link.download = "SAVE_MONEY_PRIVATE_LIMITED.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloadingPlan(false);
    }, 1200);
  };

  const handleLogout = async () => {
    try {
      if (email) {
        await fetch(`${API}/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
      }
    } catch (err) {
      console.log("Logout backend error:", err);
    } finally {
      localStorage.clear();
      navigate("/login");
      window.location.reload();
    }
  };

  const fileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${API}/uploads/${path}`;
  };

  const profilePhoto = useMemo(() => {
    return fileUrl(user?.photo || user?.profilePhoto || user?.selfiePhoto || "");
  }, [user]);

  const getDynamicUserPhoto = (item) => {
    const rawPath = item?.fromPhoto || item?.photo || item?.profilePhoto || item?.selfiePhoto || "";
    return fileUrl(rawPath);
  };

  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 2200);
  };

  const safeHistory = Array.isArray(history) ? history : [];
  const filteredBonusHistory = Array.isArray(bonusHistory) ? bonusHistory : [];
  const performanceHistory = Array.isArray(performance?.history) ? performance.history : [];
  const pendingRefers = safeHistory.filter((x) => x.status !== "Active");
  const todayJoinMembers = safeHistory.filter((x) => x.isToday);

  const perfAmt = performance?.totalBonus || 0;
  const teamAmt = team?.totalIncome || 0;
  const royAmt = royalty?.balance || 0;
  const selectedFilteredTotalIncome = team?.filteredIncome || 0;
  const selectedFilteredHistory = Array.isArray(team?.history) ? team.history : [];
  const dynamicCounts = team?.levelCounts || {};
  const dynamicIncomes = team?.levelIncomes || {};

  const handleShareTx = (tx) => {
    triggerStatusOverlay("info", "Sharing transaction details...");
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <div style={styles.loadingIcon}>⏳</div>
          <p>Loading Refer Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button style={styles.referMenuButton} onClick={() => setIsDrawerOpen(true)}>
        ☰
      </button>

      {/* SIDEBAR DRAWER */}
      {isDrawerOpen && (
        <div style={styles.drawerOverlay}>
          <div style={styles.drawerContainer}>
            <div style={styles.drawerHeader}>
              <div style={styles.drawerBrand}>
                <div style={styles.drawerLogoWrapper}>
                  <img src="/logo512.png" alt="SAVE MONEY" style={styles.drawerLogoImg} />
                </div>
                <div>
                  <div style={styles.drawerLogoText}>SAVE MONEY</div>
                  <div style={styles.drawerLogoSubtext}>Invest Small, Earn Big</div>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <div style={styles.drawerNavList}>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavDashboard }} onClick={() => go("/home")}>
                <span style={styles.drawerNavIcon}>⌂</span>
                <span style={styles.drawerNavText}>Dashboard</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavMyInvestment }} onClick={() => go("/my-investment")}>
                <span style={styles.drawerNavIcon}>💼</span>
                <span style={styles.drawerNavText}>My Investment</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavSaveMoney }} onClick={() => go("/save-money")}>
                <span style={styles.drawerNavIcon}>💰</span>
                <span style={styles.drawerNavText}>Save Money</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavOneTime }} onClick={() => go("/one-time")}>
                <span style={styles.drawerNavIcon}>💵</span>
                <span style={styles.drawerNavText}>One Time</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavPlan }} onClick={handleDownloadPlan}>
                <span style={styles.drawerNavIcon}>📄</span>
                <span style={styles.drawerNavText}>{isDownloadingPlan ? "Downloading..." : "Plan PDF"}</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavAddFund }} onClick={() => go("/wallet")}>
                <span style={styles.drawerNavIcon}>➕</span>
                <span style={styles.drawerNavText}>Add Fund</span>
              </button>
              <button
                style={{
                  ...styles.drawerNavItem,
                  ...styles.drawerNavRefer,
                  ...(location.pathname === "/refer" ? styles.drawerNavItemActive : {})
                }}
                onClick={() => go("/refer")}
              >
                <span style={styles.drawerNavIcon}>🤝</span>
                <span style={styles.drawerNavText}>Refer & Earn</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavWithdraw }} onClick={() => go("/withdraw")}>
                <span style={styles.drawerNavIcon}>🏦</span>
                <span style={styles.drawerNavText}>Withdraw</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavDailyReward }} onClick={() => go("/daily-reward")}>
                <span style={styles.drawerNavIcon}>🎁</span>
                <span style={styles.drawerNavText}>Daily Reward</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavInvestmentAssistant }} onClick={() => go("/investment-assistant")}>
                <span style={styles.drawerNavIcon}>🤖</span>
                <span style={styles.drawerNavText}>Investment Assistance</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavSupport }} onClick={() => go("/support")}>
                <span style={styles.drawerNavIcon}>🎧</span>
                <span style={styles.drawerNavText}>Support</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavProfile }} onClick={() => go("/kyc")}>
                <span style={styles.drawerNavIcon}>👤</span>
                <span style={styles.drawerNavText}>Profile</span>
              </button>
              <button style={{ ...styles.drawerNavItem, ...styles.drawerNavLogout }} onClick={handleLogout}>
                <span style={styles.drawerNavIcon}>🚪</span>
                <span style={styles.drawerNavText}>Logout</span>
              </button>
            </div>

            <div style={styles.treePlantOnlyWrapper}>
              <img
                src="/tree plant.png"
                alt="Tree Plant"
                style={styles.treePlantOnlyImg}
                onError={(e) => { e.currentTarget.src = "/tree plant.jpg"; }}
              />
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div style={styles.header}>
        <p style={styles.welcome}>Welcome back!</p>
        <h1 style={styles.mainTitle}>Refer & Earn</h1>
        <p style={styles.tagline}>Invite your friends and earn rewards together</p>
      </div>

      {/* TRANSACTION HISTORY SECTION */}
      <section style={styles.txHistorySection}>
        <div style={styles.txHistoryHeader}>
          <h2 style={styles.txHistoryTitle}>Recent Transactions</h2>
        </div>

        <div style={styles.txHistoryList}>
          {filteredBonusHistory.length === 0 ? (
            <div style={styles.historyEmpty}>No transactions found</div>
          ) : (
            filteredBonusHistory.slice(0, showAllBonusHistory ? filteredBonusHistory.length : 5).map((item, idx) => {
              const isReceived = item.type !== "Debit";
              return (
                <div key={item._id || idx} style={styles.txHistoryItem} onClick={() => setSelectedTx(item)}>
                  <div style={styles.txLeftSection}>
                    {getDynamicUserPhoto(item) ? (
                      <img src={getDynamicUserPhoto(item)} alt="User" style={styles.txUserAvatarImage} />
                    ) : (
                      <div style={{ ...styles.txAvatarCircle, background: "#f3e8ff", color: "#7c3aed" }}>
                        {getInitials(item.fromName || item.name)}
                      </div>
                    )}
                    <div style={styles.txMetaDetails}>
                      <h4 style={styles.txSenderName}>{item.fromName || item.name || "System"}</h4>
                      <p style={styles.txTimeStamp}>
                        {new Date(item.date || item.createdAt).toLocaleString()}
                      </p>
                      <div style={styles.txTagBadge}>💵 {item.bonusType || "Money Received"}</div>
                    </div>
                  </div>

                  <div style={styles.txRightSection}>
                    <h3 style={{ ...styles.txAmountText, color: isReceived ? "#16a34a" : "#dc2626" }}>
                      {isReceived ? "+ " : "- "}₹{money(item.amount)}
                    </h3>
                    <p style={styles.txFromBankText}>In <span style={styles.upiIconSmall}>🌐</span></p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredBonusHistory.length > 5 && (
          <button style={styles.viewMoreBtn} onClick={() => setShowAllBonusHistory(!showAllBonusHistory)}>
            {showAllBonusHistory ? "Show Less ⌃" : "View More ⌄"}
          </button>
        )}
      </section>

      {/* REFERRAL MEMBERS SECTION */}
      <section style={styles.historyCard}>
        <div style={styles.historyCardHeader}>
          <div>
            <h2 style={styles.historyTitle}>👥 My Referral Members</h2>
            <p style={styles.historySubtitle}>People joined using your referral</p>
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {safeHistory.length === 0 ? (
            <div style={styles.historyEmpty}>
              <div style={{ fontSize: 40 }}>👥</div>
              <p>No referral members found</p>
            </div>
          ) : (
            safeHistory
              .filter((item) => {
                if (statusFilter === "All") return true;
                if (statusFilter === "Active") return String(item.status || "").toLowerCase() === "active";
                return String(item.status || "").toLowerCase() !== "active";
              })
              .slice(0, showAllHistory ? safeHistory.length : 5)
              .map((item, index) => {
                const memberPhoto = getDynamicUserPhoto(item);

                return (
                  <div key={item._id || index} style={styles.historyRow}>
                    <div style={styles.historyUser}>
                      {memberPhoto ? (
                        <img src={memberPhoto} alt={item.name || "Member"} style={styles.historyAvatar} />
                      ) : (
                        <div style={styles.historyAvatarFallback}>
                          {getInitials(item.name || item.fromName || item.userName)}
                        </div>
                      )}

                      <div>
                        <h4 style={styles.historyUserName}>
                          {item.name || item.fromName || item.userName || "SAVE MONEY Member"}
                        </h4>
                        <p style={styles.historyUserEmail}>{item.email || "No email"}</p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          background: String(item.status || "").toLowerCase() === "active" ? "#dcfce7" : "#fef3c7",
                          color: String(item.status || "").toLowerCase() === "active" ? "#15803d" : "#a16207"
                        }}
                      >
                        {item.status || "Pending"}
                      </span>
                      <p style={styles.historyDate}>
                        {item.date ? new Date(item.date).toLocaleDateString() : "Recently joined"}
                      </p>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {safeHistory.length > 5 && (
          <button style={styles.viewMoreBtn} onClick={() => setShowAllHistory(!showAllHistory)}>
            {showAllHistory ? "Show Less" : "View All Members"}
          </button>
        )}
      </section>

      {/* PERFORMANCE BONUS SECTION */}
      <section style={styles.historyCard}>
        <div style={styles.historyCardHeader}>
          <div>
            <h2 style={styles.historyTitle}>📈 Performance Bonus</h2>
            <p style={styles.historySubtitle}>Your recurring performance income</p>
          </div>

          <select value={performanceFilter} onChange={(e) => setPerformanceFilter(e.target.value)} style={styles.filterSelect}>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="allTime">All Time</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px", background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Performance Income</p>
            <h2 style={{ margin: "10px 0 0", color: "#1e293b", fontSize: "28px" }}>₹{money(perfAmt)}</h2>
            <button
              style={{ marginTop: "15px", border: "none", background: "#2563eb", color: "#fff", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
              onClick={() => setBonusModal("performance")}
            >
              View Details
            </button>
          </div>
        </div>
      </section>

      {/* ROYALTY SECTION */}
      <section style={styles.historyCard}>
        <div style={styles.historyCardHeader}>
          <div>
            <h2 style={styles.historyTitle}>👑 Royalty Income</h2>
            <p style={styles.historySubtitle}>Special rewards for growing leaders</p>
          </div>
        </div>

        <div style={{ background: "#fdf4ff", padding: "20px", borderRadius: "16px", border: "1px solid #f5d0fe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#86198f" }}>Total Royalty Income</p>
            <h2 style={{ margin: "5px 0", color: "#701a75" }}>₹{money(royAmt)}</h2>
          </div>
          <button
            style={{ border: "none", background: "#a21caf", color: "#fff", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}
            onClick={() => setBonusModal("royalty")}
          >
            View Details
          </button>
        </div>
      </section>

      {/* BOTTOM BANNER */}
      <section style={styles.bottomBanner}>
        <div style={styles.bottomGift}>🎁</div>
        <div style={{ flex: 1 }}>
          <h2>Keep Referring & Earning</h2>
          <p>Your network is your net worth.</p>
        </div>
        <button style={styles.referNowBtn} onClick={shareWhatsapp}>🔗 Refer Now</button>
      </section>

      {/* TRANSACTION DETAILS MODAL */}
      {selectedTx && (
        <div style={styles.modalOverlay} onClick={() => setSelectedTx(null)}>
          <div style={styles.txDetailsCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.txDetailsHeader}>
              <button style={styles.txBackArrow} onClick={() => setSelectedTx(null)}>←</button>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Money Received</h3>
              <div style={{ display: "flex", gap: "15px" }}>
                <span style={styles.txHeaderLink} onClick={() => handleShareTx(selectedTx)}>Share</span>
              </div>
            </div>

            <div ref={shareAreaRef} style={styles.txDetailsInnerBox}>
              <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "1px dashed #e2e8f0" }}>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Amount</p>
                <h1 style={styles.txDetailMainAmount}>
                  ₹{money(selectedTx.amount)} <span style={styles.verifiedCheck}>✓</span>
                </h1>
                <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize", fontSize: "13px" }}>
                  {numberToWords(selectedTx.amount)}
                </p>
              </div>

              <div style={{ padding: "14px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <p style={styles.sectionLabel}>From</p>
                <h4 style={styles.sectionValueName}>{selectedTx.fromName || "Sender User"}</h4>
              </div>

              <div style={{ padding: "14px 0" }}>
                <p style={styles.sectionLabel}>To</p>
                <h4 style={styles.sectionValueName}>{user.name || "Save Money User"}</h4>
              </div>
            </div>

            <button style={styles.closeBtn} onClick={() => setSelectedTx(null)}>Close</button>
          </div>
        </div>
      )}

      {/* PERFORMANCE BONUS MODAL */}
      {bonusModal === "performance" && (
        <NewModal onClose={() => setBonusModal(null)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0 }}>📊 Performance Bonus</h2>
            <button style={styles.modalRoundCloseBtn} onClick={() => setBonusModal(null)}>✕</button>
          </div>

          <div style={{ textAlign: "center", padding: "20px", background: "#f8fafc", borderRadius: "16px" }}>
            <p style={{ margin: 0, color: "#64748b" }}>Total Performance Income</p>
            <h1 style={{ margin: "10px 0", color: "#16a34a" }}>₹{money(performance?.totalBonus || 0)}</h1>
          </div>

          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </NewModal>
      )}

      {/* ROYALTY MODAL */}
      {bonusModal === "royalty" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>👑 Royalty Bonus</h2>
          <h1>₹{money(royalty.balance)}</h1>
          <p>Status: <b>{royalty.enabled ? "Active" : "Inactive"}</b></p>
          <p>Direct Refer: <b>{royalty.directCount || 0}</b> / 50</p>
          <p style={styles.infoBox}>
            Royalty status will become active once 50 direct referrals are completed.
          </p>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}
    </div>
  );
}

function NewModal({ children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
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

const styles = {
  page: { minHeight: "100vh", padding: "28px 16px", background: "#f8fafc", fontFamily: "Arial, sans-serif", position: "relative" },
  loadingPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" },
  loadingBox: { textAlign: "center", padding: "30px", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
  loadingIcon: { fontSize: "40px" },
  referMenuButton: { position: "absolute", top: 20, left: 20, width: 44, height: 44, borderRadius: 12, border: "none", background: "#1e293b", color: "#fff", fontSize: 20, cursor: "pointer" },
  header: { textAlign: "center", marginTop: 20, marginBottom: 30 },
  welcome: { margin: 0, color: "#64748b" },
  mainTitle: { margin: "5px 0", fontSize: "36px", color: "#1e293b" },
  tagline: { margin: 0, color: "#94a3b8" },
  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000 },
  drawerContainer: { width: "280px", height: "100%", background: "#0f172a", color: "#fff", padding: "20px", display: "flex", flexDirection: "column" },
  drawerHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  drawerBrand: { display: "flex", alignItems: "center", gap: "10px" },
  drawerLogoWrapper: { width: "36px", height: "36px" },
  drawerLogoImg: { width: "100%", height: "100%" },
  drawerLogoText: { fontWeight: "bold", fontSize: "16px" },
  drawerLogoSubtext: { fontSize: "10px", color: "#94a3b8" },
  drawerNavList: { display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflowY: "auto" },
  drawerNavItem: { display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: "none", color: "#cbd5e1", padding: "10px", borderRadius: "8px", cursor: "pointer", textAlign: "left" },
  drawerNavItemActive: { background: "#2563eb", color: "#fff" },
  drawerNavIcon: { fontSize: "18px" },
  drawerNavText: { fontSize: "14px" },
  treePlantOnlyWrapper: { marginTop: "auto", textAlign: "center", paddingTop: "15px" },
  treePlantOnlyImg: { width: "100px" },
  txHistorySection: { background: "#fff", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  txHistoryHeader: { marginBottom: "15px" },
  txHistoryTitle: { margin: 0, fontSize: "18px", color: "#1e293b" },
  txHistoryList: { display: "flex", flexDirection: "column", gap: "12px" },
  txHistoryItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" },
  txLeftSection: { display: "flex", alignItems: "center", gap: "12px" },
  txUserAvatarImage: { width: "40px", height: "40px", borderRadius: "50%" },
  txAvatarCircle: { width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  txMetaDetails: { display: "flex", flexDirection: "column" },
  txSenderName: { margin: 0, fontSize: "14px", color: "#1e293b" },
  txTimeStamp: { margin: 0, fontSize: "11px", color: "#94a3b8" },
  txTagBadge: { fontSize: "10px", color: "#16a34a", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px", width: "fit-content", marginTop: "4px" },
  txRightSection: { textAlign: "right" },
  txAmountText: { margin: 0, fontSize: "16px" },
  txFromBankText: { margin: 0, fontSize: "11px", color: "#94a3b8" },
  upiIconSmall: { fontSize: "10px" },
  historyCard: { background: "#fff", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  historyCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  historyTitle: { margin: 0, fontSize: "18px", color: "#1e293b" },
  historySubtitle: { margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" },
  filterSelect: { padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" },
  historyEmpty: { textAlign: "center", padding: "30px", color: "#94a3b8" },
  historyRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  historyUser: { display: "flex", alignItems: "center", gap: "12px" },
  historyAvatar: { width: "40px", height: "40px", borderRadius: "50%" },
  historyAvatarFallback: { width: "40px", height: "40px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  historyUserName: { margin: 0, fontSize: "14px" },
  historyUserEmail: { margin: 0, fontSize: "12px", color: "#94a3b8" },
  historyDate: { margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" },
  viewMoreBtn: { display: "block", margin: "15px auto 0", border: "none", background: "transparent", color: "#2563eb", fontWeight: "bold", cursor: "pointer" },
  bottomBanner: { background: "linear-gradient(90deg, #2563eb, #1d4ed8)", color: "#fff", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "15px" },
  bottomGift: { fontSize: "40px" },
  referNowBtn: { border: "none", background: "#fff", color: "#2563eb", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" },
  modalBox: { background: "#fff", padding: "20px", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" },
  closeBtn: { width: "100%", padding: "12px", border: "none", background: "#f1f5f9", borderRadius: "8px", marginTop: "15px", cursor: "pointer", fontWeight: "bold" },
  infoBox: { background: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#64748b", marginTop: "10px" },
  txDetailsCard: { background: "#fff", padding: "20px", borderRadius: "16px", width: "100%", maxWidth: "400px" },
  txDetailsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  txBackArrow: { border: "none", background: "transparent", fontSize: "20px", cursor: "pointer" },
  txHeaderLink: { color: "#2563eb", cursor: "pointer", fontSize: "14px" },
  txDetailsInnerBox: { border: "1px solid #e2e8f0", padding: "15px", borderRadius: "12px" },
  txDetailMainAmount: { fontSize: "24px", margin: "10px 0", color: "#1e293b" },
  verifiedCheck: { color: "#16a34a" },
  sectionLabel: { margin: 0, fontSize: "12px", color: "#94a3b8" },
  sectionValueName: { margin: "4px 0 0", fontSize: "14px", color: "#1e293b" },
  modalRoundCloseBtn: { border: "none", background: "#f1f5f9", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer" }
};
