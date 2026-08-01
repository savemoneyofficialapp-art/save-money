import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas"; 
import { API } from "../config";

// মেইন মোডাল কম্পোনেন্ট (Image 1, 2, 3 এর ডিজাইনের জন্য)
function NewModal({ children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modernModalContainerCard} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// জেনারেল মোডাল কম্পোনেন্ট
function Modal({ children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

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
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [referBonus, setReferBonus] = useState({});
  const [performanceFilter, setPerformanceFilter] = useState("thisMonth");
  
  // নতুন স্টেট: পারফর্ম্যান্স রেফারাল সাব-লিস্ট দেখার জন্য
  const [showPerfReferList, setShowPerfReferList] = useState(false);

  // ট্রানসাকশান ডিটেইলস পপআপের জন্য স্টেট
  const [selectedTx, setSelectedTx] = useState(null);

  // মোডাল ক্যাপচার করার জন্য রেফ
  const shareAreaRef = useRef(null);

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

  // ফাইল URL রিটার্ন করার হেল্পার ফাংশন
  const fileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API}/uploads/${path}`;
  };

  // মেইন ইউজারের প্রোফাইল ফটো লজিক
  const profilePhoto = useMemo(() => {
    return fileUrl(
      user?.photo ||
      user?.profilePhoto ||
      user?.selfiePhoto ||
      ""
    );
  }, [user]);

  // যেকোনো ট্রানসাকশান বা হিস্ট্রি অবজেক্ট থেকে ডাইনামিক ফটো বের করার ফাংশন
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

  // ফিল্টার অনুযায়ী ডাইনামিক লেভেল মেম্বার কাউন্ট
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

  // ফিল্টার অনুযায়ী ডাইনামিক লেভেল ইনকাম
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

  const handleShareTx = async (tx) => {
    if (!shareAreaRef.current) return;
    try {
      triggerStatusOverlay("info", "Generating receipt image... 📸");

      const canvas = await html2canvas(shareAreaRef.current, {
        useCORS: true, 
        backgroundColor: "#ffffff",
        scale: 2 
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          triggerStatusOverlay("error", "Failed to generate image");
          return;
        }

        const file = new File([blob], `SaveMoney_Receipt_${tx._id || "tx"}.png`, { type: "image/png" });
        const shareText = `💰 Save Money Transaction details:\n\nAmount: ₹${tx.amount}\nFrom: ${tx.fromName || "User"}\nType: ${tx.bonusType}\nStatus: Paid/Success ✅`;

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Transaction Receipt",
            text: shareText
          });
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `SaveMoney_Receipt_${tx._id || "tx"}.png`;
          link.click();
          
          copyText(shareText);
          alert("Receipt Image downloaded & text details copied! You can now send it on WhatsApp.");
        }
      }, "image/png");

    } catch (error) {
      console.error("Share error:", error);
      triggerStatusOverlay("error", "Sharing failed!");
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
    {
      key: "performance",
      title: "Performance Bonus",
      amount: perfAmt,
      icon: "📈",
      color: "#c026d3",
      bg: "#fff0ff"
    },
    {
      key: "team",
      title: "Team Bonus",
      amount: teamAmt,
      icon: "👥",
      color: "#2563eb",
      bg: "#eff6ff"
    },
    {
      key: "royalty",
      title: "Royalty Bonus",
      amount: royAmt,
      icon: "👑",
      color: "#f97316",
      bg: "#fff7ed"
    },
    {
      key: "refer",
      title: "Refer Bonus",
      amount: refAmt,
      icon: "🎁",
      color: "#16a34a",
      bg: "#ecfdf5"
    }
  ];

  const getInitials = (name) => {
    if (!name) return "SM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
      
      {/* প্রিমিয়াম টোস্ট ওভারলে */}
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

      {/* Hero কার্ড */}
      <section style={styles.heroCard}>
        <div style={styles.heroLeft}>
          <div style={styles.avatarWrap}>
            <img
              style={styles.avatar}
              src={profilePhoto || "https://i.pravatar.cc/160?img=12"}
              alt="user"
            />
            <div style={styles.crown}>♛</div>
          </div>

          <div>
            <h2>{user.name || "Save Money User"}</h2>
            <span style={styles.activeMember}>
              <span
                style={{
                  ...styles.greenDot,
                  background:
                    String(user.activeStatus || "Inactive").toLowerCase() === "active"
                      ? "#22c55e"
                      : "#ef4444"
                }}
              />
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

      {/* রেফার লিংক সেকশন */}
      <section style={styles.linkCard}>
        <div style={styles.linkIcon}>🔗</div>
        <div style={styles.linkMiddle}>
          <h3>Your Refer Link</h3>
          <div style={styles.copyBox}>
            <span>{referLink}</span>
            <button style={styles.copyLinkBtn} onClick={() => copyText(referLink)}>
              🔗 Copy Link
            </button>
          </div>
        </div>
        <div style={styles.shareBox}>
          <h3>Share via</h3>
          <button style={styles.whatsapp} onClick={shareWhatsapp}>🟢</button>
          <button style={styles.telegram} onClick={shareTelegram}>⌲</button>
        </div>
      </section>

      {/* বোনাস গ্রিড কার্ডস */}
      <section style={styles.bonusGrid}>
        {bonusCards.map((b) => (
          <div key={b.key} style={{ ...styles.bonusCard, background: b.bg }}>
            <div style={{ ...styles.bonusIcon, background: b.color }}>
              {b.icon}
            </div>
            <h3>{b.title}</h3>
            <h2>{money(b.amount)}</h2>
            <button
              style={{ ...styles.detailBtn, color: b.color }}
              onClick={() => {
                setShowPerfReferList(false); // মোডাল ওপেন হওয়ার সময় সাব-লিস্ট অফ থাকবে
                setBonusModal(b.key);
              }}
            >
              View Details
            </button>
          </div>
        ))}
      </section>

      {/* বোনাস ট্রানসাকশান হিস্ট্রি */}
      <section style={styles.historyCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2 style={{ fontSize: "20px", fontWeight: "700" }}>💰 All Bonus History</h2></div>
          <select
            value={bonusFilter}
            onChange={(e) => setBonusFilter(e.target.value)}
            style={styles.filterSelect}
          >
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
            visibleBonusHistory.map((item, index) => {
              const userPhotoUrl = getDynamicUserPhoto(item);
              return (
                <div 
                  key={index} 
                  style={styles.txItemRow} 
                  onClick={() => setSelectedTx(item)}
                >
                  <div style={styles.txLeftSection}>
                    {userPhotoUrl ? (
                      <img 
                        style={styles.txUserAvatarImage} 
                        src={userPhotoUrl} 
                        alt={item.fromName || "User"} 
                      />
                    ) : (
                      <div style={{ 
                        ...styles.txAvatarCircle, 
                        background: "#f1f5f9", 
                        color: "#475569" 
                      }}>
                        {getInitials(item.fromName)}
                      </div>
                    )}
                    
                    <div style={styles.txMetaDetails}>
                      <h4 style={styles.txSenderName}>{item.fromName || "Save Money User"}</h4>
                      <p style={styles.txTimeStamp}>{new Date(item.date).toLocaleDateString("en-IN")}, {new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      <div style={styles.txTagBadge}>💵 {item.bonusType || "Money Received"}</div>
                    </div>
                  </div>

                  <div style={styles.txRightSection}>
                    <h3 style={{ ...styles.txAmountText, color: "#16a34a" }}>
                      + {money(item.amount)}
                    </h3>
                    <p style={styles.txFromBankText}>In <span style={styles.upiIconSmall}>🌐</span></p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={styles.paytmBrandFooter}>
          <span style={{ fontWeight: "bold", color: "#7b20ff", textTransform: "uppercase", letterSpacing: "1px" }}>save money</span>
        </div>
      </section>

      {filteredBonusHistory.length > 5 && (
        <button
          style={styles.viewMoreBtn}
          onClick={() => setShowAllBonusHistory(!showAllBonusHistory)}
        >
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


      {/* 📸 রসিদ ইমেজ মোডাল পপআপ */}
      {selectedTx && (
        <div style={styles.modalOverlay} onClick={() => setSelectedTx(null)}>
          <div style={styles.txDetailsCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.txDetailsHeader}>
              <button style={styles.txBackArrow} onClick={() => setSelectedTx(null)}>←</button>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Money Received</h3>
              <div style={{ display: "flex", gap: "15px" }}>
                <span style={styles.txHeaderLink} onClick={() => handleShareTx(selectedTx)}>Share</span>
                <span style={styles.txHeaderLink} onClick={() => setSelectedTx(null)}>Close</span>
              </div>
            </div>

            <div ref={shareAreaRef} style={styles.txDetailsInnerBox}>
              <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "1px dashed #e2e8f0" }}>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Amount</p>
                <h1 style={styles.txDetailMainAmount}>
                  {money(selectedTx.amount)} <span style={styles.verifiedCheck}>✓</span>
                </h1>
                <div style={styles.moneyReceivedTag}>💵 {selectedTx.bonusType || "Money Received"}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <div>
                  <p style={styles.sectionLabel}>From</p>
                  <h4 style={styles.sectionValueName}>{selectedTx.fromName || "Sender User"} <span style={styles.blueTick}>✓</span></h4>
                  <p style={styles.sectionSubValue}>{selectedTx.fromEmail || "user@savemoney"}</p>
                </div>
                {getDynamicUserPhoto(selectedTx) ? (
                  <img style={styles.detailUserImage} src={getDynamicUserPhoto(selectedTx)} alt="Sender" />
                ) : (
                  <div style={{ ...styles.detailAvatarCircle, background: "#e0f2fe", color: "#0369a1" }}>
                    {getInitials(selectedTx.fromName)}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0" }}>
                <div>
                  <p style={styles.sectionLabel}>To</p>
                  <h4 style={styles.sectionValueName}>{user.name || "Save Money User"}</h4>
                  <p style={styles.sectionSubValue}>{user.email || "wallet@id"}</p>
                  <p style={styles.bankNameFooter}>Save Money Wallet - {referCode}</p>
                </div>
                <img style={styles.detailUserImage} src={profilePhoto || "https://i.pravatar.cc/160?img=12"} alt="Receiver" />
              </div>

              <div style={styles.txFooterMetaDetails}>
                <p>Received at {new Date(selectedTx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, {new Date(selectedTx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Ref No: TXN{Math.floor(100000000 + Math.random() * 900000000)}</span>
                  <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: "bold" }} onClick={() => copyText("TXN123456")}>Copy</span>
                </p>
              </div>
            </div>
            <button style={styles.imgCloseBtn} onClick={() => setSelectedTx(null)}>Close</button>
          </div>
        </div>
      )}

      {/* ==========================================================
          IMAGE 1: PERFORMANCE BONUS MODAL WITH NEW REFER LIST
          ========================================================== */}
      {bonusModal === "performance" && (
        <NewModal onClose={() => setBonusModal(null)}>
          <div style={styles.modalHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={styles.perfHeaderIconBox}>📊</div>
              <h2 style={styles.modalMainTitle}>Performance Bonus</h2>
            </div>
            <button style={styles.modalRoundCloseBtn} onClick={() => setBonusModal(null)}>✕</button>
          </div>

          {!showPerfReferList ? (
            <>
              <div style={styles.perfGradientBanner}>
                <div style={styles.bannerLeftInfo}>
                  <p style={styles.bannerSubText}>Total Performance Bonus</p>
                  <h1 style={styles.bannerMainAmount}>{money(performance.balance || 0)}</h1>
                </div>
                <div style={styles.bannerRightBadgeWrap}>
                  <span style={styles.bannerStatusLabel}>Status</span>
                  <span style={styles.bannerActiveBadge}>● Active</span>
                </div>
                <div style={styles.bannerGraphicIllustration}>📈</div>
              </div>

              <div style={styles.twoColumnStatsGrid}>
                <div style={styles.subStatCardItem}>
                  <div style={styles.statIconBadgePurp}>📅</div>
                  <div>
                    <p style={styles.statCardLabelText}>This Month Bonus</p>
                    <h3 style={styles.statCardAmountVal}>{money(performance.thisMonthBonus || 0)}</h3>
                  </div>
                </div>
                
                <div style={{ ...styles.subStatCardItem, borderLeft: "1px solid #eef2f6" }}>
                  <div style={styles.statIconBadgeBlue}>📅</div>
                  <div>
                    <p style={styles.statCardLabelText}>Last Month Bonus</p>
                    <h3 style={styles.statCardAmountVal}>{money(performance.lastMonthBonus || 0)}</h3>
                  </div>
                </div>
              </div>

              {/* 🎯 পারফর্ম্যান্স মেম্বারদের দেখার প্রিমিয়াম বোতাম */}
              <button 
                style={styles.perfReferListTriggerBtn}
                onClick={() => setShowPerfReferList(true)}
              >
                👥 View Performance Refer List
              </button>

              <div style={styles.modalHorizontalLine} />

              <div style={{ marginBottom: "20px" }}>
                <div style={styles.modernSelectInputWrapper}>
                  <span style={{ fontSize: "16px" }}>📅</span>
                  <select
                    value={performanceFilter}
                    onChange={(e) => setPerformanceFilter(e.target.value)}
                    style={styles.modernDropdownField}
                  >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>

              <div style={styles.historyHeadingSection}>
                <span style={{ fontSize: "18px", color: "#4f46e5" }}>🕒</span>
                <h3 style={styles.historySectionTitleText}>Performance History</h3>
              </div>

              <div style={styles.modalDataLogsContainer}>
                {filteredPerformanceHistory.length === 0 ? (
                  <div style={styles.emptyHistoryStateBox}>
                    <div style={styles.emptyStateIconPurple}>📄</div>
                    <h4 style={styles.emptyStateMainTitle}>No History</h4>
                    <p style={styles.emptyStateSubtitleText}>Your performance history will appear here</p>
                  </div>
                ) : (
                  filteredPerformanceHistory.map((item, index) => (
                    <div key={index} style={styles.historyItemRowCard}>
                      <div>
                        <h4 style={styles.logUserNameText}>{item.fromName || "User Name"}</h4>
                        <p style={styles.logDateSubText}>{new Date(item.date).toLocaleDateString("en-IN")}</p>
                      </div>
                      <h3 style={styles.logIncomeValueGreen}>+{money(item.amount)}</h3>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* ==========================================
               ✨ ডাইনামিক পারফর্ম্যান্স রেফারাল সাব-লিস্ট ভিউ
               ========================================== */
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <button 
                  onClick={() => setShowPerfReferList(false)}
                  style={styles.subListBackBtn}
                >
                  ← Back
                </button>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Performance Refer List</h3>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead style={styles.tableHeaderStyleRow}>
                    <tr>
                      <th style={styles.tableHeadCellText}>Name</th>
                      <th style={styles.tableHeadCellText}>Mobile</th>
                      <th style={styles.tableHeadCellText}>Next Renew Date</th>
                      <th style={styles.tableHeadCellText}>Expected Bonus</th>
                      <th style={styles.tableHeadCellText}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history && history.length > 0 ? (
                      history.map((member, i) => {
                        const renewDateStr = member.nextRenewDate || member.renewDate || "N/A";
                        const isOverdue = renewDateStr !== "N/A" && new Date() > new Date(renewDateStr);
                        const displayStatus = member.status === "Active" && !isOverdue ? "Bonus Received" : "Renew Due";
                        const expectedBonus = member.performanceBonus || member.bonusAmount || 0;

                        return (
                          <tr key={i} style={styles.tableBodyRowItem}>
                            <td style={styles.tableDataCellText}><b>{member.name || "User"}</b></td>
                            <td style={styles.tableDataCellText}>{member.mobile || member.phone || "N/A"}</td>
                            <td style={styles.tableDataCellText}>
                              {renewDateStr !== "N/A" ? new Date(renewDateStr).toLocaleDateString("en-IN") : "N/A"}
                            </td>
                            <td style={{ ...styles.tableDataCellText, fontWeight: "bold", color: "#c026d3" }}>
                              {money(expectedBonus)}
                            </td>
                            <td style={styles.tableDataCellText}>
                              <span style={{
                                ...styles.statusBadgeGlobal,
                                background: displayStatus === "Bonus Received" ? "#dcfce7" : "#fee2e2",
                                color: displayStatus === "Bonus Received" ? "#16a34a" : "#dc2626"
                              }}>
                                {displayStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                          No Referrals Found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <button style={styles.modalFooterPrimaryBtn} onClick={() => setBonusModal(null)}>Close</button>
        </NewModal>
      )}

      {/* ==========================================================
          IMAGE 2: TEAM BONUS MODAL
          ========================================================== */}
      {bonusModal === "team" && (
        <NewModal onClose={() => setBonusModal(null)}>
          <div style={styles.modalHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={styles.teamHeaderIconBox}>👥</div>
              <div>
                <h2 style={styles.modalMainTitle}>Team Bonus</h2>
                <p style={styles.modalSubTitleDescription}>View your team's performance and earnings</p>
              </div>
            </div>
            <button style={styles.modalRoundCloseBtn} onClick={() => setBonusModal(null)}>✕</button>
          </div>

          <div style={styles.teamMainAmountContainerCard}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h1 style={styles.teamBigAmountHeading}>{money(team.balance || 0)}</h1>
              <p style={styles.teamAmountLabelCaptionText}>Total Team Bonus</p>
            </div>
            <div style={styles.teamStatusBadgeFlexBox}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Status</span>
              <span style={styles.teamActiveBadgeFill}>● Active</span>
            </div>
            <div style={styles.teamGraphicIllustrationRight}>👥</div>
          </div>

          <div style={styles.teamDualFlexGridWrapper}>
            <div style={styles.teamFlexGridHalfBlock}>
              <div style={styles.cardHeaderHeadingRow}>
                <span>📊</span>
                <h4 style={styles.cardBlockTitleInlineText}>Today's Report</h4>
              </div>
              <p style={styles.reportInsideLabelSubText}>Today's Income</p>
              <h3 style={styles.reportInsideValueBoldNumber}>{money(team.todayBonus || 0)}</h3>
              
              <button style={styles.networkJoinBadgeLinkBtn} onClick={() => setShowTodayJoinModal(true)}>
                📈 Network Joining Today: {team.todayJoin || 0} (View All)
              </button>
            </div>

            <div style={styles.teamFlexGridHalfBlock}>
              <div style={styles.cardHeaderHeadingRow}>
                <span>🕒</span>
                <h4 style={styles.cardBlockTitleInlineText}>Select Time Frame</h4>
              </div>
              
              <div style={{ ...styles.modernSelectInputWrapper, marginTop: "15px" }}>
                <span>🌐</span>
                <select
                  value={teamTimeFilter}
                  onChange={(e) => setTeamTimeFilter(e.target.value)}
                  style={styles.modernDropdownField}
                >
                  <option value="allTime">All Time</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="customRange">Select Date Range</option>
                </select>
              </div>

              {teamTimeFilter === "customRange" && (
                <div style={styles.customDateInputsFlexRow}>
                  <input 
                    type="date" 
                    value={teamStartDate}
                    onChange={(e) => setTeamStartDate(e.target.value)}
                    style={styles.datePickerInputField}
                  />
                  <input 
                    type="date" 
                    value={teamEndDate}
                    onChange={(e) => setTeamEndDate(e.target.value)}
                    style={styles.datePickerInputField}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={styles.sectionHeadingRowFlex}>
            <span>👥</span>
            <h3 style={styles.sectionTitleBlockHeader}>Total Level Members ({teamTimeFilter === "allTime" ? "All Time" : "Filtered"})</h3>
          </div>

          <div style={styles.levelHorizontalFlexTrack}>
            <div style={{ ...styles.levelHorizontalItemBox, borderLeft: "4px solid #16a34a", background: "#f0fdf4" }}>
              <h4 style={{ ...styles.levelLabelNumberTitle, color: "#16a34a" }}>L1</h4>
              <p style={styles.levelUserCountValueText}>Users: {dynamicCounts[1]}</p>
            </div>
            <div style={styles.levelHorizontalItemBox}>
              <h4 style={styles.levelLabelNumberTitle}>L2</h4>
              <p style={styles.levelUserCountValueText}>Users: {dynamicCounts[2]}</p>
            </div>
            <div style={styles.levelHorizontalItemBox}>
              <h4 style={styles.levelLabelNumberTitle}>L3</h4>
              <p style={styles.levelUserCountValueText}>Users: {dynamicCounts[3]}</p>
            </div>
            <div style={styles.levelHorizontalItemBox}>
              <h4 style={styles.levelLabelNumberTitle}>L4</h4>
              <p style={styles.levelUserCountValueText}>Users: {dynamicCounts[4]}</p>
            </div>
            <div style={styles.levelHorizontalItemBox}>
              <h4 style={styles.levelLabelNumberTitle}>L5</h4>
              <p style={styles.levelUserCountValueText}>Users: {dynamicCounts[5]}</p>
            </div>
          </div>

          <div style={styles.teamDualFlexGridWrapper}>
            <div style={styles.teamFlexGridHalfBlock}>
              <div style={styles.cardHeaderHeadingRow}>
                <span>⚙️</span>
                <h4 style={styles.cardBlockTitleInlineText}>Income Summary</h4>
              </div>
              
              <div style={styles.summaryListItemsFlexColumn}>
                <div style={styles.summaryTableRowLine}>
                  <span style={styles.summaryRowLabelCell}><span style={{marginRight:6}}>🔵</span> Selected Filter Total Income</span>
                  <span style={styles.summaryRowValueCellBlue}>{teamTimeFilter === "allTime" ? money(team.balance) : money(selectedFilteredTotalIncome)}</span>
                </div>
                <div style={styles.summaryTableRowLine}>
                  <span style={styles.summaryRowLabelCell}><span style={{marginRight:6}}>🟢</span> This Month Default Income</span>
                  <span style={styles.summaryRowValueCellDark}>{money(team.thisMonthBonus)}</span>
                </div>
                <div style={styles.summaryTableRowLine}>
                  <span style={styles.summaryRowLabelCell}><span style={{marginRight:6}}>🟣</span> Last Month Default Income</span>
                  <span style={styles.summaryRowValueCellDark}>{money(team.lastMonthBonus)}</span>
                </div>
              </div>
            </div>

            <div style={styles.teamFlexGridHalfBlock}>
              <div style={styles.cardHeaderHeadingRow}>
                <span>📊</span>
                <h4 style={styles.cardBlockTitleInlineText}>Level Income</h4>
              </div>
              
              <div style={styles.levelIncomeDenseBlockGrid}>
                <div style={styles.levelMiniBlockGridItem}>
                  <span style={styles.miniBlockLabelText}>Level 1</span>
                  <h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[1])}</h5>
                </div>
                <div style={styles.levelMiniBlockGridItem}>
                  <span style={styles.miniBlockLabelText}>Level 2</span>
                  <h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[2])}</h5>
                </div>
                <div style={styles.levelMiniBlockGridItem}>
                  <span style={styles.miniBlockLabelText}>Level 3</span>
                  <h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[3])}</h5>
                </div>
                <div style={styles.levelMiniBlockGridItem}>
                  <span style={styles.miniBlockLabelText}>Level 4</span>
                  <h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[4])}</h5>
                </div>
                <div style={styles.levelMiniBlockGridItem}>
                  <span style={styles.miniBlockLabelText}>Level 5</span>
                  <h5 style={styles.miniBlockValueAmountText}>{money(dynamicIncomes[5])}</h5>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.sectionHeadingRowFlex}>
            <span>📄</span>
            <h3 style={styles.sectionTitleBlockHeader}>Team Bonus History</h3>
          </div>

          <div style={styles.modalDataLogsContainer}>
            {selectedFilteredHistory.length === 0 ? (
              <div style={styles.emptyHistoryStateBox}>
                <div style={styles.emptyStateIconBlue}>📄</div>
                <h4 style={styles.emptyStateMainTitle}>No Team Bonus History Found</h4>
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead style={styles.tableHeaderStyleRow}>
                    <tr>
                      <th style={styles.tableHeadCellText}>User</th>
                      <th style={styles.tableHeadCellText}>Upline Name</th>
                      <th style={styles.tableHeadCellText}>Level</th>
                      <th style={styles.tableHeadCellText}>You Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFilteredHistory.map((item, index) => (
                      <tr key={index} style={styles.tableBodyRowItem}>
                        <td style={styles.tableDataCellText}><b>{item.fromName || "-"}</b><br/><small style={{color:"#64748b"}}>{item.fromEmail}</small></td>
                        <td style={styles.tableDataCellText}>{item.uplineName || "-"}</td>
                        <td style={styles.tableDataCellText}><span style={styles.tableLevelBadgeTag}>L{item.level || "-"}</span></td>
                        <td style={{ ...styles.tableDataCellText, fontWeight: "bold", color: "#2563eb" }}>{money(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <button style={styles.modalFooterPrimaryBtn} onClick={() => setBonusModal(null)}>Close</button>
        </NewModal>
      )}

      {/* ==========================================================
          IMAGE 3: REFER BONUS MODAL
          ========================================================== */}
      {bonusModal === "refer" && (
        <NewModal onClose={() => setBonusModal(null)}>
          <div style={styles.modalHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={styles.referGiftIconBox}>🎁</div>
              <div>
                <h2 style={styles.modalMainTitle}>Refer Bonus</h2>
                <p style={styles.modalSubTitleDescription}>Earn bonus from your direct referrals</p>
              </div>
            </div>
            <button style={styles.modalRoundCloseBtn} onClick={() => setBonusModal(null)}>✕</button>
          </div>

          <div style={styles.referSuccessCalloutAlertBanner}>
            <span style={styles.alertSuccessCheckIcon}>✓</span>
            <p style={styles.alertSuccessBannerInlineMessageText}>Congratulations! Every direct user's first investment gives you Refer Bonus.</p>
          </div>

          <div style={styles.teamDualFlexGridWrapper}>
            <div style={styles.referOrangeBannerCardContainer}>
              <p style={styles.orangeBannerSubTitleLabel}>Total Refer Bonus</p>
              <h1 style={styles.orangeBannerBigAmountDisplay}>{money(referBonus.totalBonus || 0)}</h1>
              <div style={styles.orangeBannerGraphicAssetIllustration}>💰</div>
            </div>

            <div style={styles.referPendingActionFlexCenterBlock}>
              <button 
                style={styles.referOrangePendingArrowActionBtn}
                onClick={() => setShowPendingModal(true)}
              >
                <span style={{marginRight:8}}>⏳</span> View Pending Refers ({pendingRefers.length}) <span style={{marginLeft:"auto", fontWeight:"bold"}}>˃</span>
              </button>
            </div>
          </div>

          <div style={styles.teamDualFlexGridWrapper}>
            <div style={{ ...styles.teamFlexGridHalfBlock, flex: 1.1 }}>
              <div style={styles.verticalMetricsFlexListColumn}>
                <div style={styles.metricListingInlineRow}>
                  <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                    <span style={styles.metricIconCircleOrange}>📅</span>
                    <span style={styles.metricLabelNameText}>Today's Bonus</span>
                  </div>
                  <span style={styles.metricBoldValueNumberText}>{money(referBonus.todayBonus || 0)}</span>
                </div>

                <div style={styles.metricListingInlineRow}>
                  <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                    <span style={styles.metricIconCircleGreen}>📅</span>
                    <span style={styles.metricLabelNameText}>This Month Bonus</span>
                  </div>
                  <span style={styles.metricBoldValueNumberText}>{money(referBonus.todayBonus || 0)}</span>
                </div>

                <div style={styles.metricListingInlineRow}>
                  <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                    <span style={styles.metricIconCircleBlue}>📅</span>
                    <span style={styles.metricLabelNameText}>Last Month Bonus</span>
                  </div>
                  <span style={styles.metricBoldValueNumberText}>{money(referBonus.lastMonthBonus || 0)}</span>
                </div>

                <div style={styles.metricListingInlineRow}>
                  <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                    <span style={styles.metricIconCirclePurp}>💼</span>
                    <span style={styles.metricLabelNameText}>Total Refer Bonus</span>
                  </div>
                  <span style={styles.metricBoldValueNumberText}>{money(referBonus.totalBonus || 0)}</span>
                </div>

                <div style={{ ...styles.metricListingInlineRow, border: "none", paddingBottom: 0 }}>
                  <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                    <span style={styles.metricIconCircleOrange}>👥</span>
                    <span style={styles.metricLabelNameText}>Eligible Refers</span>
                  </div>
                  <span style={styles.metricBoldValueNumberText}>{referBonus.count || 0}</span>
                </div>
              </div>
            </div>

            <div style={{ ...styles.teamFlexGridHalfBlock, flex: 0.9, display: "flex", flexDirection: "column", gap: "15px", background: "none", border: "none", padding: 0, boxShadow: "none" }}>
              <div style={styles.tripleSquareBadgesFlexRowTrack}>
                <div style={styles.squareStatusBadgeMetricsItemBox}>
                  <div style={styles.squareIconTrackBlue}>👥</div>
                  <p style={styles.squareBadgeLabelCaption}>Total Direct</p>
                  <h3 style={styles.squareBadgeValueNumberHeading}>{history.length}</h3>
                </div>

                <div style={styles.squareStatusBadgeMetricsItemBox}>
                  <div style={styles.squareIconTrackGreen}>👤</div>
                  <p style={styles.squareBadgeLabelCaption}>Active Refers</p>
                  <h3 style={styles.squareBadgeValueNumberHeading}>{history.filter((x) => x.status === "Active").length}</h3>
                </div>

                <div style={styles.squareStatusBadgeMetricsItemBox}>
                  <div style={styles.squareIconTrackRed}>👤</div>
                  <p style={styles.squareBadgeLabelCaption}>Inactive</p>
                  <h3 style={styles.squareBadgeValueNumberHeading}>{history.filter((x) => x.status === "Inactive").length}</h3>
                </div>
              </div>

              <div style={styles.modernSelectInputWrapper}>
                <span style={{ fontSize: "16px" }}>📅</span>
                <select
                  style={styles.modernDropdownField}
                  value={selectedMonth}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedMonth(value);
                    let targetMonth = "";
                    let targetYear = new Date().getFullYear();

                    if (value === "thisMonth") {
                      targetMonth = "";
                    } else if (value === "lastMonth") {
                      const d = new Date();
                      d.setMonth(d.getMonth() - 1);
                      targetMonth = String(d.getMonth() + 1);
                      targetYear = d.getFullYear();
                    } else {
                      targetMonth = value;
                    }
                    loadReferData(targetMonth, targetYear);
                  }}
                >
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={styles.historyHeadingSection}>
            <span style={{ fontSize: "18px", color: "#f97316" }}>🕒</span>
            <h3 style={styles.historySectionTitleText}>Bonus History</h3>
          </div>

          <div style={styles.modalDataLogsContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHeaderStyleRow}>
                <tr>
                  <th style={styles.tableHeadCellText}>User</th>
                  <th style={styles.tableHeadCellText}>Date</th>
                  <th style={styles.tableHeadCellText}>Level</th>
                  <th style={styles.tableHeadCellText}>Bonus</th>
                  <th style={styles.tableHeadCellText}>Type</th>
                </tr>
              </thead>
              <tbody>
                {(referBonus.history || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      No referral history found.
                    </td>
                  </tr>
                ) : (
                  (referBonus.history || []).map((x, i) => {
                    const historyPhotoUrl = getDynamicUserPhoto(x);
                    return (
                      <tr key={i} style={styles.tableBodyRowItem}>
                        <td style={{ ...styles.tableDataCellText, display: "flex", alignItems: "center", gap: "10px" }}>
                          {historyPhotoUrl ? (
                            <img src={historyPhotoUrl} style={styles.tableAvatarIconRoundPhoto} alt="user" />
                          ) : (
                            <span style={styles.tableInitialPlaceholderBadgeCircle}>{x.fromName ? x.fromName[0] : "S"}</span>
                          )}
                          <div>
                            <b>{x.fromName || "User"}</b>
                            <br />
                            <small style={{ color: "#64748b" }}>{x.fromEmail}</small>
                          </div>
                        </td>
                        <td style={styles.tableDataCellText}>{x.date ? new Date(x.date).toLocaleDateString("en-IN") : "-"}</td>
                        <td style={styles.tableDataCellText}><span style={styles.tableLevelBadgeTag}>L{x.level || 1}</span></td>
                        <td style={{ ...styles.tableDataCellText, fontWeight: "bold", color: "#16a34a" }}>{money(x.amount)}</td>
                        <td style={styles.tableDataCellText}><small style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>{x.note || "First Investment"}</small></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <button style={styles.referModalFooterCloseButton} onClick={() => setBonusModal(null)}>Close</button>
        </NewModal>
      )}

      {/* --- Royalty Modal --- */}
      {bonusModal === "royalty" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>👑 Royalty Bonus</h2>
          <h1>{money(royalty.balance)}</h1>
          <p>Status: <b>{royalty.enabled ? "Active" : "Inactive"}</b></p>
          <p>Direct Refer: <b>{royalty.directCount || 0}</b> / 50</p>
          <p>Remaining: <b>{royalty.remaining || 0}</b></p>
          <p style={styles.infoBox}>
            Royalty status will become active once 50 direct referrals are completed. You will receive a 3% royalty bonus on business generated after becoming active.
          </p>
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {/* --- পেন্ডিং রেফারাল সাব-মডাল --- */}
      {showPendingModal && (
        <div style={styles.subModalOverlay} onClick={() => setShowPendingModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "#ea580c" }}>⏳ Pending Refers List</h2>
            <div style={{ maxHeight: "350px", overflowY: "auto", margin: "20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingRefers.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No pending refers available.</p>
              ) : (
                pendingRefers.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                    <div>
                      <b style={{ color: "#1e293b", fontSize: 15 }}>{item.name || "Save Money User"}</b><br />
                      <small style={{ color: "#64748b" }}>{item.email}</small>
                    </div>
                    <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#ffedd5", color: "#ea580c", fontWeight: 700 }}>Registered</span>
                  </div>
                ))
              )}
            </div>
            <button style={{ ...styles.closeBtn, background: "#ea580c", color: "#fff" }} onClick={() => setShowPendingModal(false)}>Back</button>
          </div>
        </div>
      )}

      {/* --- আজকে জয়েন হওয়া মেম্বারদের সাব-মডাল --- */}
      {showTodayJoinModal && (
        <div style={styles.subModalOverlay} onClick={() => setShowTodayJoinModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "#2563eb" }}>📊 Today's Network Joining List</h2>
            <div style={{ maxHeight: "350px", overflowY: "auto", margin: "20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              {todayJoinMembers.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No members joined today yet.</p>
              ) : (
                todayJoinMembers.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                    <div>
                      <b style={{ color: "#1e293b", fontSize: 15 }}>{item.fromName || "Save Money User"}</b><br />
                      <small style={{ color: "#64748b" }}>Level {item.level || "-"}</small>
                    </div>
                    <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#dbeafe", color: "#2563eb", fontWeight: 700 }}>Today Joined</span>
                  </div>
                ))
              )}
            </div>
            <button style={{ ...styles.closeBtn, background: "#2563eb", color: "#fff" }} onClick={() => setShowTodayJoinModal(false)}>Back</button>
          </div>
        </div>
      )}

    </div>
  );
}

// 🎨 প্রিমিয়াম লাক্সারি স্টাইলিং শীট
const styles = {
  page: {
    padding: "20px",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    color: "#1e293b",
    position: "relative"
  },
  loadingPage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f8fafc"
  },
  loadingBox: {
    textAlign: "center"
  },
  loadingIcon: {
    fontSize: "50px",
    animation: "pulse 1.5s infinite"
  },
  backBtn: {
    position: "absolute",
    top: "20px",
    left: "20px",
    background: "#fff",
    border: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  bellBtn: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "#fff",
    border: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    textAlign: "center",
    marginTop: "60px",
    marginBottom: "30px"
  },
  welcome: {
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "2px",
    color: "#64748b",
    fontWeight: "600",
    margin: 0
  },
  mainTitle: {
    fontSize: "32px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "5px 0"
  },
  referWorld: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#2563eb",
    margin: 0
  },
  tagline: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "5px"
  },
  heroCard: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "24px",
    padding: "25px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
    marginBottom: "25px"
  },
  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  avatarWrap: {
    position: "relative"
  },
  avatar: {
    width: "75px",
    height: "75px",
    borderRadius: "50%",
    border: "3px solid #38bdf8",
    objectFit: "cover"
  },
  crown: {
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "20px",
    color: "#fbbf24"
  },
  activeMember: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.1)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "5px"
  },
  greenDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%"
  },
  smallText: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: "10px 0 2px 0",
    textTransform: "uppercase"
  },
  referIdBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.05)",
    padding: "6px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  heroRight: {
    textAlign: "right",
    background: "rgba(255,255,255,0.05)",
    padding: "15px 25px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  walletRound: {
    fontSize: "22px",
    marginBottom: "5px"
  },
  linkCard: {
    background: "#fff",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "25px"
  },
  linkIcon: {
    fontSize: "30px",
    background: "#f0fdf4",
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  linkMiddle: {
    flex: 1,
    minWidth: "250px"
  },
  copyBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f8fafc",
    padding: "8px 12px",
    borderRadius: "14px",
    border: "1px dashed #cbd5e1",
    marginTop: "8px",
    overflow: "hidden"
  },
  copyLinkBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px"
  },
  shareBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  whatsapp: {
    background: "#dcfce7",
    border: "none",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer"
  },
  telegram: {
    background: "#e0f2fe",
    border: "none",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer"
  },
  bonusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
  },
  bonusCard: {
    borderRadius: "24px",
    padding: "25px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.02)",
    position: "relative",
    overflow: "hidden"
  },
  bonusIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "20px",
    marginBottom: "15px"
  },
  detailBtn: {
    background: "#fff",
    border: "1px solid currentColor",
    padding: "6px 16px",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    marginTop: "10px",
    transition: "all 0.2s"
  },
  historyCard: {
    background: "#fff",
    borderRadius: "28px",
    padding: "25px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.03)",
    marginBottom: "20px"
  },
  filterSelect: {
    padding: "10px 16px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontWeight: "600",
    color: "#475569",
    outline: "none"
  },
  txListWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  txItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    padding: "16px",
    borderRadius: "20px",
    border: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
  },
  txLeftSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  txUserAvatarImage: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #e2e8f0"
  },
  txAvatarCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "16px"
  },
  txMetaDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },
  txSenderName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a"
  },
  txTimeStamp: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b"
  },
  txTagBadge: {
    display: "inline-block",
    alignSelf: "flex-start",
    fontSize: "11px",
    background: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: "6px",
    color: "#475569",
    fontWeight: "600",
    marginTop: "4px"
  },
  txRightSection: {
    textAlign: "right"
  },
  txAmountText: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800"
  },
  txFromBankText: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b"
  },
  upiIconSmall: {
    fontSize: "12px"
  },
  paytmBrandFooter: {
    textAlign: "center",
    marginTop: "20px",
    paddingTop: "15px",
    borderTop: "1px dashed #e2e8f0"
  },
  viewMoreBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#475569",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "30px"
  },
  bottomBanner: {
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    borderRadius: "24px",
    padding: "25px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "40px"
  },
  bottomGift: {
    fontSize: "35px"
  },
  referNowBtn: {
    background: "#fff",
    color: "#4f46e5",
    border: "none",
    padding: "12px 25px",
    borderRadius: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "15px"
  },
  modernModalContainerCard: {
    background: "#ffffff",
    borderRadius: "32px",
    width: "100%",
    maxWidth: "680px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "28px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
    border: "1px solid #f1f5f9"
  },
  modalHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px"
  },
  perfHeaderIconBox: {
    fontSize: "24px",
    background: "#fdf4ff",
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#c026d3"
  },
  modalMainTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a"
  },
  modalRoundCloseBtn: {
    border: "none",
    background: "#f1f5f9",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#64748b"
  },
  perfGradientBanner: {
    background: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
    borderRadius: "24px",
    padding: "24px",
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    border: "1px solid #f5d0fe"
  },
  bannerLeftInfo: {
    zIndex: 2
  },
  bannerSubText: {
    margin: 0,
    fontSize: "13px",
    color: "#a21caf",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  bannerMainAmount: {
    margin: "5px 0 0 0",
    fontSize: "32px",
    fontWeight: "800",
    color: "#701a75"
  },
  bannerRightBadgeWrap: {
    textAlign: "right",
    zIndex: 2
  },
  bannerStatusLabel: {
    display: "block",
    fontSize: "11px",
    color: "#a21caf",
    textTransform: "uppercase"
  },
  bannerActiveBadge: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#16a34a"
  },
  bannerGraphicIllustration: {
    position: "absolute",
    right: "20px",
    bottom: "10px",
    fontSize: "70px",
    opacity: 0.12,
    userSelect: "none"
  },
  twoColumnStatsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#f8fafc",
    borderRadius: "20px",
    padding: "16px",
    marginBottom: "20px",
    border: "1px solid #e2e8f0"
  },
  subStatCardItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px"
  },
  statIconBadgePurp: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "#fdf4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  statIconBadgeBlue: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  statCardLabelText: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b"
  },
  statCardAmountVal: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b"
  },
  modalHorizontalLine: {
    height: "1px",
    background: "#e2e8f0",
    margin: "20px 0"
  },
  modernSelectInputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    padding: "10px 16px",
    borderRadius: "14px"
  },
  modernDropdownField: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontWeight: "600",
    color: "#334155",
    fontSize: "14px"
  },
  historyHeadingSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px"
  },
  historySectionTitleText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#334155"
  },
  modalDataLogsContainer: {
    maxHeight: "260px",
    overflowY: "auto",
    paddingRight: "5px",
    marginBottom: "20px"
  },
  emptyHistoryStateBox: {
    textAlign: "center",
    padding: "30px 10px"
  },
  emptyStateIconPurple: {
    fontSize: "36px",
    color: "#d946ef",
    marginBottom: "10px"
  },
  emptyStateMainTitle: {
    margin: "0 0 4px 0",
    color: "#475569"
  },
  emptyStateSubtitleText: {
    margin: 0,
    fontSize: "13px",
    color: "#94a3b8"
  },
  historyItemRowCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#f8fafc",
    borderRadius: "14px",
    marginBottom: "10px",
    border: "1px solid #f1f5f9"
  },
  logUserNameText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600"
  },
  logDateSubText: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b"
  },
  logIncomeValueGreen: {
    margin: 0,
    color: "#16a34a",
    fontSize: "15px",
    fontWeight: "700"
  },
  modalFooterPrimaryBtn: {
    width: "100%",
    padding: "14px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  perfReferListTriggerBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #c026d3, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "20px",
    boxShadow: "0 8px 20px rgba(124, 58, 237, 0.25)"
  },
  subListBackBtn: {
    border: "none",
    background: "#f1f5f9",
    padding: "8px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  statusBadgeGlobal: {
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700"
  },
  teamHeaderIconBox: {
    fontSize: "24px",
    background: "#eff6ff",
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb"
  },
  modalSubTitleDescription: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b"
  },
  teamMainAmountContainerCard: {
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    borderRadius: "24px",
    padding: "24px",
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    border: "1px solid #bfdbfe"
  },
  teamBigAmountHeading: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#1e40af"
  },
  teamAmountLabelCaptionText: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#2563eb",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  teamStatusBadgeFlexBox: {
    textAlign: "right",
    zIndex: 2
  },
  teamActiveBadgeFill: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#16a34a"
  },
  teamGraphicIllustrationRight: {
    position: "absolute",
    right: "20px",
    bottom: "10px",
    fontSize: "70px",
    opacity: 0.1,
    userSelect: "none"
  },
  teamDualFlexGridWrapper: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px"
  },
  teamFlexGridHalfBlock: {
    flex: 1,
    minWidth: "240px",
    background: "#f8fafc",
    borderRadius: "20px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
  },
  cardHeaderHeadingRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px"
  },
  cardBlockTitleInlineText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#475569"
  },
  reportInsideLabelSubText: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b"
  },
  reportInsideValueBoldNumber: {
    margin: "2px 0 10px 0",
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a"
  },
  networkJoinBadgeLinkBtn: {
    width: "100%",
    padding: "8px 12px",
    background: "#e0f2fe",
    color: "#0369a1",
    border: "none",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "left"
  },
  customDateInputsFlexRow: {
    display: "flex",
    gap: "10px",
    marginTop: "10px"
  },
  datePickerInputField: {
    flex: 1,
    padding: "8px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "12px",
    outline: "none"
  },
  sectionHeadingRowFlex: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px"
  },
  sectionTitleBlockHeader: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#334155"
  },
  levelHorizontalFlexTrack: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "10px",
    marginBottom: "20px"
  },
  levelHorizontalItemBox: {
    flex: "1 0 100px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px",
    textAlign: "center"
  },
  levelLabelNumberTitle: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "800",
    color: "#475569"
  },
  levelUserCountValueText: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600"
  },
  summaryListItemsFlexColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px"
  },
  summaryTableRowLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid #f1f5f9"
  },
  summaryRowLabelCell: {
    color: "#64748b",
    fontWeight: "600"
  },
  summaryRowValueCellBlue: {
    fontWeight: "700",
    color: "#2563eb"
  },
  summaryRowValueCellDark: {
    fontWeight: "700",
    color: "#1e293b"
  },
  levelIncomeDenseBlockGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "10px"
  },
  levelMiniBlockGridItem: {
    background: "#fff",
    border: "1px solid #f1f5f9",
    padding: "8px",
    borderRadius: "10px",
    textAlign: "center"
  },
  miniBlockLabelText: {
    display: "block",
    fontSize: "11px",
    color: "#64748b"
  },
  miniBlockValueAmountText: {
    margin: "2px 0 0 0",
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a"
  },
  emptyStateIconBlue: {
    fontSize: "36px",
    color: "#3b82f6",
    marginBottom: "10px"
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    marginTop: "10px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "13px"
  },
  tableHeaderStyleRow: {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0"
  },
  tableHeadCellText: {
    padding: "12px 10px",
    fontWeight: "700",
    color: "#475569"
  },
  tableBodyRowItem: {
    borderBottom: "1px solid #f1f5f9"
  },
  tableDataCellText: {
    padding: "12px 10px",
    color: "#334155"
  },
  tableLevelBadgeTag: {
    background: "#eff6ff",
    color: "#2563eb",
    padding: "2px 6px",
    borderRadius: "6px",
    fontWeight: "700"
  },
  referGiftIconBox: {
    fontSize: "24px",
    background: "#fff7ed",
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f97316"
  },
  referSuccessCalloutAlertBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "12px 16px",
    borderRadius: "16px",
    marginBottom: "20px"
  },
  alertSuccessCheckIcon: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: "16px"
  },
  alertSuccessBannerInlineMessageText: {
    margin: 0,
    fontSize: "12px",
    color: "#166534",
    fontWeight: "600"
  },
  referOrangeBannerCardContainer: {
    flex: 1.1,
    minWidth: "220px",
    background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    borderRadius: "24px",
    padding: "24px",
    position: "relative",
    border: "1px solid #fed7aa"
  },
  orangeBannerSubTitleLabel: {
    margin: 0,
    fontSize: "13px",
    color: "#c2410c",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  orangeBannerBigAmountDisplay: {
    margin: "4px 0 0 0",
    fontSize: "32px",
    fontWeight: "800",
    color: "#9a3412"
  },
  orangeBannerGraphicAssetIllustration: {
    position: "absolute",
    right: "20px",
    bottom: "10px",
    fontSize: "65px",
    opacity: 0.12,
    userSelect: "none"
  },
  referPendingActionFlexCenterBlock: {
    flex: 0.9,
    minWidth: "200px",
    display: "flex",
    alignItems: "center"
  },
  referOrangePendingArrowActionBtn: {
    width: "100%",
    padding: "16px",
    background: "#fff",
    border: "2px solid #ffedd5",
    borderRadius: "20px",
    color: "#ea580c",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 4px 6px rgba(234, 88, 12, 0.02)"
  },
  verticalMetricsFlexListColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  metricListingInlineRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "10px",
    borderBottom: "1px solid #e2e8f0"
  },
  metricIconCircleOrange: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#fff7ed",
    color: "#f97316",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px"
  },
  metricIconCircleGreen: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#f0fdf4",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px"
  },
  metricIconCircleBlue: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px"
  },
  metricIconCirclePurp: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#fdf4ff",
    color: "#c026d3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px"
  },
  metricLabelNameText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569"
  },
  metricBoldValueNumberText: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a"
  },
  tripleSquareBadgesFlexRowTrack: {
    display: "flex",
    gap: "8px"
  },
  squareStatusBadgeMetricsItemBox: {
    flex: 1,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "10px 6px",
    textAlign: "center"
  },
  squareIconTrackBlue: {
    fontSize: "16px",
    color: "#2563eb",
    marginBottom: "4px"
  },
  squareIconTrackGreen: {
    fontSize: "16px",
    color: "#16a34a",
    marginBottom: "4px"
  },
  squareIconTrackRed: {
    fontSize: "16px",
    color: "#dc2626",
    marginBottom: "4px"
  },
  squareBadgeLabelCaption: {
    margin: 0,
    fontSize: "10px",
    color: "#64748b",
    fontWeight: "600"
  },
  squareBadgeValueNumberHeading: {
    margin: "2px 0 0 0",
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a"
  },
  tableAvatarIconRoundPhoto: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    objectFit: "cover"
  },
  tableInitialPlaceholderBadgeCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700"
  },
  referModalFooterCloseButton: {
    width: "100%",
    padding: "14px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginTop: "10px"
  },
  modalBox: {
    background: "#fff",
    borderRadius: "24px",
    padding: "30px",
    width: "100%",
    maxWidth: "460px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
  },
  closeBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "15px"
  },
  infoBox: {
    background: "#f8fafc",
    padding: "15px",
    borderRadius: "14px",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.6",
    textAlign: "left",
    border: "1px dashed #cbd5e1"
  },
  subModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1100,
    padding: "15px"
  },
  statusOverlayBg: {
    position: "fixed",
    top: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    width: "90%",
    maxWidth: "380px",
    animation: "slideDown 0.3s ease-out"
  },
  statusOverlayCard: {
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 15px 35px rgba(15, 23, 42, 0.12)"
  },
  statusOverlayIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "15px"
  },
  statusOverlayText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b"
  },
  txDetailsCard: {
    background: "#fff",
    borderRadius: "28px",
    width: "100%",
    maxWidth: "480px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    border: "1px solid #e2e8f0"
  },
  txDetailsHeader: {
    background: "#00baf2",
    color: "#fff",
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  txBackArrow: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "22px",
    cursor: "pointer"
  },
  txHeaderLink: {
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer"
  },
  txDetailsInnerBox: {
    padding: "24px"
  },
  txDetailMainAmount: {
    margin: "5px 0 0 0",
    fontSize: "36px",
    fontWeight: "800",
    color: "#0f172a"
  },
  verifiedCheck: {
    color: "#00baf2",
    fontSize: "24px"
  },
  moneyReceivedTag: {
    display: "inline-block",
    background: "#f1f5f9",
    padding: "4px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    marginTop: "10px"
  },
  sectionLabel: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase"
  },
  sectionValueName: {
    margin: "2px 0 0 0",
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a"
  },
  blueTick: {
    color: "#00baf2"
  },
  sectionSubValue: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b"
  },
  detailUserImage: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #e2e8f0"
  },
  detailAvatarCircle: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700"
  },
  bankNameFooter: {
    margin: "4px 0 0 0",
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  txFooterMetaDetails: {
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "12px 16px",
    fontSize: "12px",
    color: "#64748b",
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  imgCloseBtn: {
    width: "90%",
    margin: "0 auto 20px auto",
    display: "block",
    padding: "12px",
    borderRadius: "14px",
    border: "none",
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center"
  }
};
