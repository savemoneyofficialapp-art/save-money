import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas"; 
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

  // ফাইল URL রিটার্ন করার হেল্পার ফাংশন (প্রয়োজন অনুযায়ী ব্যাকএন্ড/স্টোরেজ URL অ্যাডজাস্ট করে নিতে পারেন)
  const fileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API}/uploads/${path}`; // অথবা আপনার প্রজেক্টের আপলোড ডিরেক্টরি পাথ
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

  const getAvatarBg = (name) => {
    const colors = ["#dcfce7", "#eff6ff", "#fee2e2", "#fff7ed", "#f3e8ff", "#e0f2fe"];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getAvatarTextColor = (name) => {
    const colors = ["#15803d", "#1d4ed8", "#b91c1c", "#c2410c", "#6b21a8", "#0369a1"];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
      
      {/* প্রিমিয়াম গ্লসি ইনফো মেসেজ টোস্ট ওভারলে */}
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
              onClick={() => setBonusModal(b.key)}
            >
              View Details
            </button>
          </div>
        ))}
      </section>

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
              const isReceived = true;
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
                        background: getAvatarBg(item.fromName), 
                        color: getAvatarTextColor(item.fromName) 
                      }}>
                        {getInitials(item.fromName)}
                      </div>
                    )}
                    
                    <div style={styles.txMetaDetails}>
                      <h4 style={styles.txSenderName}>{item.fromName || "Save Money User"}</h4>
                      <p style={styles.txTimeStamp}>Received Today, {new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      
                      <div style={styles.txTagBadge}>
                        💵 {item.bonusType || "Money Received"}
                      </div>
                    </div>
                  </div>

                  <div style={styles.txRightSection}>
                    <h3 style={{ ...styles.txAmountText, color: isReceived ? "#16a34a" : "#dc2626" }}>
                      {isReceived ? "+ " : "- "}{money(item.amount)}
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
                <span style={styles.txHeaderLink} onClick={() => alert("Help Center Clicked")}>Help</span>
              </div>
            </div>

            {/* মেইন ক্যাপচার এরিয়া বক্স */}
            <div ref={shareAreaRef} style={styles.txDetailsInnerBox}>
              
              <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "1px dashed #e2e8f0" }}>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Amount</p>
                <h1 style={styles.txDetailMainAmount}>
                  {money(selectedTx.amount)} <span style={styles.verifiedCheck}>✓</span>
                </h1>
                <p style={{ margin: 0, color: "#666", textTransform: "capitalize", fontSize: "13px" }}>Rupees One Thousand Only</p>
                <div style={styles.moneyReceivedTag}>
                  💵 Money Received
                </div>
              </div>

              {/* From সেকশন (ফটো ফিক্সড) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <div>
                  <p style={styles.sectionLabel}>From</p>
                  <h4 style={styles.sectionValueName}>{selectedTx.fromName || "Sender User"} <span style={styles.blueTick}>✓</span></h4>
                  <p style={styles.sectionSubValue}>{selectedTx.fromEmail || "user@axl"}</p>
                </div>
                {getDynamicUserPhoto(selectedTx) ? (
                  <img 
                    style={styles.detailUserImage} 
                    src={getDynamicUserPhoto(selectedTx)} 
                    alt="Sender Profile" 
                  />
                ) : (
                  <div style={{ ...styles.detailAvatarCircle, background: getAvatarBg(selectedTx.fromName), color: getAvatarTextColor(selectedTx.fromName) }}>
                    {getInitials(selectedTx.fromName)}
                  </div>
                )}
              </div>

              {/* To সেকশন */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0" }}>
                <div>
                  <p style={styles.sectionLabel}>To</p>
                  <h4 style={styles.sectionValueName}>{user.name || "Save Money User"}</h4>
                  <p style={styles.sectionSubValue}>{user.email || "wallet@id"}</p>
                  <p style={styles.bankNameFooter}>Save Money Wallet - {referCode}</p>
                </div>
                <img 
                  style={styles.detailUserImage} 
                  src={profilePhoto || "https://i.pravatar.cc/160?img=12"} 
                  alt="Receiver Profile" 
                />
              </div>

              <div style={styles.txFooterMetaDetails}>
                <p>Received at {new Date(selectedTx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, {new Date(selectedTx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Ref No: TXN{Math.floor(100000000 + Math.random() * 900000000)}</span>
                  <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: "bold" }} onClick={() => copyText("TXN123456")}>Copy</span>
                </p>
              </div>

            </div>

            <button style={styles.closeBtn} onClick={() => setSelectedTx(null)}>Close</button>
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

              <select
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="all">All</option>
              </select>

              <div style={{ marginTop: 20 }}>
                <h3>Performance History</h3>
                {filteredPerformanceHistory.length === 0 ? (
                  <p>No History</p>
                ) : (
                  filteredPerformanceHistory.map((item, index) => (
                    <div key={index} style={styles.historyItem}>
                      <b>{item.fromName}</b>
                      <p>Bonus : {money(item.amount)}</p>
                      <p>Date : {new Date(item.date).toLocaleDateString("en-IN")}</p>
                    </div>
                  ))
                )}
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
          
          <button 
            style={styles.todayJoinBtn} 
            onClick={() => setShowTodayJoinModal(true)}
          >
            📊 Network Joining Today: <b>{team.todayJoin || 0}</b> (View All)
          </button>
          <hr />

          <div style={{ marginTop: 15, marginBottom: 15 }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>⏱ Select Time Frame:</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select
                value={teamTimeFilter}
                onChange={(e) => setTeamTimeFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="allTime">🌐 All Time</option>
                <option value="thisMonth">📅 This Month</option>
                <option value="lastMonth">📅 Last Month</option>
                <option value="customRange">📆 Select Date Range</option>
              </select>

              {teamTimeFilter === "customRange" && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <small style={{ display: "block", color: "#666" }}>Start Date:</small>
                    <input 
                      type="date" 
                      value={teamStartDate}
                      onChange={(e) => setTeamStartDate(e.target.value)}
                      style={{ ...styles.filterSelect, width: "100%" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <small style={{ display: "block", color: "#666" }}>End Date:</small>
                    <input 
                      type="date" 
                      value={teamEndDate}
                      onChange={(e) => setTeamEndDate(e.target.value)}
                      style={{ ...styles.filterSelect, width: "100%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <h3>Total Level Members ({teamTimeFilter === "allTime" ? "All Time" : teamTimeFilter === "thisMonth" ? "This Month" : teamTimeFilter === "lastMonth" ? "Last Month" : "Selected Range"})</h3>
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
          <p>This Month Default Income: <b>{money(team.thisMonthBonus)}</b></p>
          <p>Last Month Default Income: <b>{money(team.lastMonthBonus)}</b></p>
          <hr />

          <h3>Level Income ({teamTimeFilter === "allTime" ? "All Time" : teamTimeFilter === "thisMonth" ? "This Month" : teamTimeFilter === "lastMonth" ? "Last Month" : "Selected Range"})</h3>
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
                <tr>
                  <th>User</th>
                  <th>Upline Name</th>
                  <th>Level</th>
                  <th>You Earned</th>
                </tr>
              </thead>
              <tbody>
                {selectedFilteredHistory.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: "center", padding: 10 }}>No Team Bonus History Found</td></tr>
                ) : (
                  selectedFilteredHistory.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <b>{item.fromName || "-"}</b>
                      </td>
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
          <p>Remaining: <b>{royalty.remaining || 0}</b></p>
          <p>This Month Business: <b>{money(royalty.thisMonthBusiness)}</b></p>
          <p>Last Month Business: <b>{money(royalty.lastMonthBusiness)}</b></p>
          <p>This Month Royalty: <b>{money(royalty.thisMonthRoyalty)}</b></p>
          <p>Last Month Royalty: <b>{money(royalty.lastMonthRoyalty)}</b></p>

          <p style={styles.infoBox}>
            Royalty status will become active once 50 direct referrals are completed. You will receive a 3% royalty bonus on business generated after becoming active.
          </p>

          <BonusHistory type="royalty" data={bonusHistory} getDynamicUserPhoto={getDynamicUserPhoto} />
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {/* --- Refer Modal --- */}
      {bonusModal === "refer" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>🎁 Refer Bonus</h2>
          <p style={styles.successText}>Congratulations! Every direct user's first investment gives you Refer Bonus.</p>
          
          <button 
            style={styles.pendingToggleBtn}
            onClick={() => setShowPendingModal(true)}
          >
            ⏳ View Pending Refers ({pendingRefers.length})
          </button>

          <h1>{money(referBonus.totalBonus || 0)}</h1>

          <p>Today's Bonus : <b> {money(referBonus.todayBonus || 0)}</b></p>
          <p>This Month Bonus : <b> {money(referBonus.thisMonthBonus || 0)}</b></p>
          <p>Last Month Bonus : <b> {money(referBonus.lastMonthBonus || 0)}</b></p>
          <p>Total Refer Bonus : <b> {money(referBonus.totalBonus || 0)}</b></p>
          <p>Eligible Refers : <b> {referBonus.count || 0}</b></p>

          <div style={styles.levelGrid}>
            <div>Total Direct Refers<br /><b>{history.length}</b></div>
            <div>Active Refers<br /><b>{history.filter((x) => x.status === "Active").length}</b></div>
            <div>Inactive Refers<br /><b>{history.filter((x) => x.status === "Inactive").length}</b></div>
          </div>

          <div style={{ marginTop: 20 }}>
            <select
              style={styles.filterSelect}
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
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <BonusHistory type="Referral Bonus" data={referBonus.history || []} getDynamicUserPhoto={getDynamicUserPhoto} />
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {/* --- পেন্ডিং রেফারাল সাব-মডাল --- */}
      {showPendingModal && (
        <Modal onClose={() => setShowPendingModal(false)}>
          <h2 style={{ color: "#ea580c" }}>⏳ Pending Refers List</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>These users registered but have not made their first investment yet.</p>
          
          <div style={{ maxHeight: "350px", overflowY: "auto", margin: "20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingRefers.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No pending refers available.</p>
            ) : (
              pendingRefers.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                  <div>
                    <b style={{ color: "#1e293b", fontSize: 15 }}>{item.name || "Save Money User"}</b>
                    <br />
                    <small style={{ color: "#64748b" }}>{item.email}</small>
                  </div>
                  <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#ffedd5", color: "#ea580c", fontWeight: 700 }}>
                    {item.kycStatus === "approved" ? "KYC Approved" : "Registered"}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <button 
            style={{ ...styles.closeBtn, background: "#ea580c", color: "#fff" }} 
            onClick={() => setShowPendingModal(false)}
          >
            Back to Refer Bonus
          </button>
        </Modal>
      )}

      {/* --- আজকে জয়েন হওয়া মেম্বারদের সাব-মডাল --- */}
      {showTodayJoinModal && (
        <Modal onClose={() => setShowTodayJoinModal(false)}>
          <h2 style={{ color: "#2563eb" }}>📊 Today's Network Joining List</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>List of users who joined your team network today.</p>
          
          <div style={{ maxHeight: "350px", overflowY: "auto", margin: "20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {todayJoinMembers.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No members joined today yet.</p>
            ) : (
              todayJoinMembers.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                  <div>
                    <b style={{ color: "#1e293b", fontSize: 15 }}>{item.fromName || "Save Money User"}</b>
                    <br />
                    <small style={{ color: "#64748b" }}>Level {item.level || "-"}</small>
                  </div>
                  <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#dbeafe", color: "#2563eb", fontWeight: 700 }}>
                    Today Joined
                  </span>
                </div>
              ))
            )}
          </div>
          
          <button 
            style={{ ...styles.closeBtn, background: "#2563eb", color: "#fff" }} 
            onClick={() => setShowTodayJoinModal(false)}
          >
            Back to Team Bonus
          </button>
        </Modal>
      )}

    </div>
  );
}

function BonusHistory({ type, data, getDynamicUserPhoto }) {
  const rows = (data || []).filter((x) => x.bonusType === type);
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Bonus History</h3>
      {rows.length === 0 ? (
        <p>No history found</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Level</th>
                <th>Bonus</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x, i) => {
                const historyPhotoUrl = getDynamicUserPhoto(x);
                return (
                  <tr key={i}>
                    <td style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {historyPhotoUrl ? (
                        <img src={historyPhotoUrl} style={styles.smallTableAvatar} alt="user" />
                      ) : (
                        <span style={styles.smallTableInitialBackup}>{x.fromName ? x.fromName[0] : "S"}</span>
                      )}
                      <div>
                        <b>{x.fromName}</b><br /><small>{x.fromEmail}</small>
                      </div>
                    </td>
                    <td>{x.date ? new Date(x.date).toLocaleDateString("en-IN") : "-"}</td>
                    <td>L{x.level || 1}</td>
                    <td>₹{Number(x.amount || 0).toLocaleString("en-IN")}</td>
                    <td>{x.note || type}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

const styles = {
  txListWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "0px"
  },
  txItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  txLeftSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  txUserAvatarImage: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e2e8f0"
  },
  txAvatarCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "16px",
    letterSpacing: "0.5px"
  },
  txMetaDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  txSenderName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b"
  },
  txTimeStamp: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b"
  },
  txTagBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#e8f5e9",
    color: "#2e7d32",
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "20px",
    marginTop: "4px",
    width: "fit-content"
  },
  txRightSection: {
    textAlign: "right"
  },
  txAmountText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700"
  },
  txFromBankText: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px"
  },
  upiIconSmall: {
    fontSize: "12px"
  },
  paytmBrandFooter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "20px",
    paddingTop: "10px",
    fontSize: "14px"
  },
  txDetailsCard: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
    fontFamily: "sans-serif"
  },
  txDetailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "15px",
    color: "#1e293b",
    borderBottom: "1px solid #f1f5f9"
  },
  txBackArrow: {
    background: "none",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    color: "#1e293b"
  },
  txHeaderLink: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer"
  },
  txDetailsInnerBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "16px",
    marginTop: "16px",
    background: "#fff"
  },
  txDetailMainAmount: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "5px 0",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  verifiedCheck: {
    color: "#10b981",
    fontSize: "24px"
  },
  moneyReceivedTag: {
    background: "#e8f5e9",
    color: "#2e7d32",
    padding: "6px 14px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "13px",
    display: "inline-block",
    marginTop: "10px"
  },
  sectionLabel: {
    margin: 0,
    fontSize: "13px",
    color: "#666",
    fontWeight: "500"
  },
  sectionValueName: {
    margin: "2px 0 0 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b"
  },
  blueTick: {
    color: "#00baf2"
  },
  sectionSubValue: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b"
  },
  bankNameFooter: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#94a3b8"
  },
  detailAvatarCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  detailUserImage: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e2e8f0"
  },
  txFooterMetaDetails: {
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "12px",
    marginTop: "12px",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.6"
  },
  statusOverlayBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(10, 15, 30, 0.45)",
    backdropFilter: "blur(8px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statusOverlayCard: {
    background: "rgba(255, 255, 255, 0.95)",
    padding: "30px 40px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.6)",
    maxWidth: "360px",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  statusOverlayIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "bold",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)"
  },
  statusOverlayText: {
    fontSize: "17px",
    color: "#1e293b",
    margin: 0,
    fontWeight: "700",
    lineHeight: "1.5",
    letterSpacing: "-0.3px"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#fff7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial"
  },
  loadingBox: {
    background: "white",
    padding: 35,
    borderRadius: 30,
    textAlign: "center",
    boxShadow: "0 20px 45px rgba(124,58,237,.18)"
  },
  loadingIcon: { fontSize: 70 },
  page: {
    minHeight: "100vh",
    padding: 28,
    background:
      "radial-gradient(circle at top left,#fff0ff,transparent 28%),radial-gradient(circle at top right,#ffe8f5,transparent 30%),linear-gradient(135deg,#fffaff,#f8f3ff,#ffffff)",
    fontFamily: "Arial, sans-serif",
    color: "#111542",
    position: "relative"
  },
  backBtn: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 54,
    height: 54,
    border: "none",
    borderRadius: 16,
    background: "white",
    boxShadow: "0 12px 30px rgba(137,84,255,.22)",
    fontSize: 30,
    cursor: "pointer"
  },
  bellBtn: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 58,
    height: 58,
    border: "none",
    borderRadius: 18,
    background: "white",
    boxShadow: "0 12px 30px rgba(137,84,255,.22)",
    fontSize: 25,
    cursor: "pointer"
  },
  header: { textAlign: "center" },
  welcome: { margin: 0, fontSize: 22 },
  mainTitle: {
    margin: "2px 0 0",
    fontSize: 58,
    fontWeight: 900,
    background: "linear-gradient(90deg,#1463ff,#8b20ff,#ff1685)",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },
  referWorld: { margin: 0, fontSize: 36 },
  tagline: { color: "#62678c", fontSize: 18 },
  heroCard: {
    width: "min(1050px, 94vw)",
    margin: "30px auto 18px",
    padding: 40,
    borderRadius: 34,
    background: "linear-gradient(135deg,#3a19d6,#6b08d8,#b616a1)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    gap: 30,
    boxShadow: "0 30px 55px rgba(102,38,190,.35)"
  },
  heroLeft: { display: "flex", alignItems: "center", gap: 28 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: "50%",
    border: "8px solid white",
    objectFit: "cover"
  },
  crown: {
    position: "absolute",
    right: -4,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#e11dff,#9f18ff)",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    border: "4px solid white"
  },
  activeMember: {
    display: "inline-block",
    margin: "12px 0",
    padding: "10px 18px",
    borderRadius: 12,
    background: "rgba(255,255,255,.16)",
    fontWeight: 700
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
    marginRight: 8
  },
  smallText: { margin: "8px 0", opacity: 0.9 },
  referIdBox: {
    border: "1px dashed rgba(255,255,255,.85)",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 20,
    fontWeight: 900,
    display: "flex",
    gap: 18,
    justifyContent: "space-between"
  },
  heroRight: { minWidth: 270 },
  walletRound: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    background: "rgba(255,255,255,.18)",
    display: "grid",
    placeItems: "center",
    fontSize: 38
  },
  linkCard: {
    width: "min(1120px, 94vw)",
    margin: "20px auto",
    padding: 28,
    borderRadius: 26,
    background: "white",
    boxShadow: "0 16px 36px rgba(156,105,255,.16)",
    display: "flex",
    alignItems: "center",
    gap: 24
  },
  linkIcon: {
    width: 90,
    height: 90,
    borderRadius: 22,
    background: "#f0e7ff",
    display: "grid",
    placeItems: "center",
    fontSize: 48
  },
  linkMiddle: { flex: 1 },
  copyBox: {
    border: "1px solid #ddd9ec",
    borderRadius: 14,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 10
  },
  copyLinkBtn: {
    border: "none",
    borderRadius: 12,
    padding: "12px 22px",
    background: "linear-gradient(90deg,#7c3aed,#d946ef)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer"
  },
  shareBox: {
    borderLeft: "1px solid #e7e2f0",
    paddingLeft: 30,
    minWidth: 190
  },
  whatsapp: {
    width: 58,
    height: 58,
    border: "none",
    borderRadius: "50%",
    background: "#16c768",
    color: "white",
    fontSize: 24,
    marginRight: 12,
    cursor: "pointer"
  },
  telegram: {
    width: 58,
    height: 58,
    border: "none",
    borderRadius: "50%",
    background: "#2196f3",
    color: "white",
    fontSize: 30,
    cursor: "pointer"
  },
  bonusGrid: {
    width: "min(1120px, 94vw)",
    margin: "26px auto",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 20
  },
  bonusCard: {
    borderRadius: 24,
    padding: "34px 18px",
    textAlign: "center",
    boxShadow: "0 14px 34px rgba(0,0,0,.08)"
  },
  bonusIcon: {
    width: 78,
    height: 78,
    borderRadius: 22,
    margin: "0 auto 18px",
    display: "grid",
    placeItems: "center",
    color: "white",
    fontSize: 38
  },
  detailBtn: {
    border: "1px solid currentColor",
    borderRadius: 12,
    background: "white",
    padding: "12px 22px",
    fontWeight: 900,
    cursor: "pointer"
  },
  historyCard: {
    width: "min(1120px, 94vw)",
    margin: "26px auto",
    background: "white",
    borderRadius: 26,
    padding: 28,
    boxShadow: "0 16px 36px rgba(156,105,255,.16)"
  },
  filterSelect: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid #ddd",
    fontSize: "15px",
    outline: "none",
    background: "#fff"
  },
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 700,
    textAlign: "left"
  },
  viewMoreBtn: {
    display: "block",
    margin: "22px auto 0",
    border: "none",
    background: "white",
    color: "#7b20e8",
    fontSize: 18,
    fontWeight: 900,
    cursor: "pointer"
  },
  bottomBanner: {
    width: "min(1120px, 94vw)",
    margin: "26px auto 10px",
    padding: "26px 34px",
    borderRadius: 24,
    background: "linear-gradient(90deg,#fff2ff,#f5eaff)",
    display: "flex",
    alignItems: "center",
    gap: 24
  },
  bottomGift: { fontSize: 70 },
  referNowBtn: {
    border: "none",
    borderRadius: 16,
    padding: "18px 48px",
    color: "white",
    background: "linear-gradient(90deg,#7b20ff,#c515e9)",
    fontSize: 20,
    fontWeight: 900,
    cursor: "pointer"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.55)",
    backdropFilter: "blur(8px)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalBox: {
    width: "min(760px, 96vw)",
    maxHeight: "88vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 30px 90px rgba(0,0,0,.25)"
  },
  closeBtn: {
    marginTop: 20,
    width: "100%",
    border: "none",
    borderRadius: 14,
    padding: 14,
    background: "#e5e7eb",
    fontWeight: 900,
    cursor: "pointer"
  },
  levelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 12,
    margin: "16px 0",
    fontWeight: 700
  },
  infoBox: {
    background: "#f8fafc",
    padding: 14,
    borderRadius: 14,
    lineHeight: 1.6
  },
  historyItem: {
    padding: 15,
    marginTop: 10,
    background: "#f8fafc",
    borderRadius: 12,
    border: "1px solid #e5e7eb"
  },
  dangerText: {
    color: "#dc2626",
    fontWeight: "bold",
    marginTop: 20
  },
  successText: {
    color: "#16a34a",
    fontWeight: 900
  },
  pendingToggleBtn: {
    display: "block",
    width: "100%",
    padding: "14px",
    margin: "10px 0 20px 0",
    background: "linear-gradient(90deg, #ff9800, #f44336)",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(244,67,54,0.2)"
  },
  todayJoinBtn: {
    display: "block",
    width: "100%",
    padding: "12px",
    margin: "12px 0",
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    textAlign: "left",
    fontSize: "15px",
    cursor: "pointer",
    fontWeight: "500"
  },
  smallTableAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e2e8f0"
  },
  smallTableInitialBackup: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#475569",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px"
  }
};
