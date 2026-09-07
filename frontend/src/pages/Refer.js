import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { API } from "../config";

export default function Refer() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showTodayJoinModal, setShowTodayJoinModal] = useState(false);

  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  // =========================
  // SIDEBAR NAVIGATION
  // =========================

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
          headers: {
            "Content-Type": "application/json"
          },
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

  // =========================
  // FILE URL
  // =========================

  const fileUrl = (path) => {
    if (!path) return "";

    if (
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      return path;
    }

    return `${API}/uploads/${path}`;
  };

  const profilePhoto = useMemo(() => {
    return fileUrl(
      user?.photo ||
      user?.profilePhoto ||
      user?.selfiePhoto ||
      ""
    );
  }, [user]);

  const getDynamicUserPhoto = (item) => {
    const rawPath =
      item?.fromPhoto ||
      item?.photo ||
      item?.profilePhoto ||
      item?.selfiePhoto ||
      "";

    return fileUrl(rawPath);
  };

  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({
      show: true,
      type,
      message
    });

    setTimeout(() => {
      setStatusOverlay({
        show: false,
        type: "info",
        message: ""
      });
    }, 2200);
  };

  // =========================
  // YOUR EXISTING REFER.JS CODE
  // =========================

  // এখান থেকে তোমার আগের Refer.js-এর
  // সমস্ত API / useEffect / referral logic
  // একইভাবে থাকবে।
{/* SIDEBAR DRAWER */}
{isDrawerOpen && (
  <div style={styles.drawerOverlay}>
    <div style={styles.drawerContainer}>

      <div style={styles.drawerHeader}>
        <div style={styles.drawerBrand}>

          <div style={styles.drawerLogoWrapper}>
            <img
              src="/logo512.png"
              alt="SAVE MONEY"
              style={styles.drawerLogoImg}
            />
          </div>

          <div>
            <div style={styles.drawerLogoText}>
              SAVE MONEY
            </div>

            <div style={styles.drawerLogoSubtext}>
              Invest Small, Earn Big
            </div>
          </div>

        </div>

        <button
          onClick={() => setIsDrawerOpen(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 24,
            cursor: "pointer"
          }}
        >
          ×
        </button>
      </div>

      <div style={styles.drawerNavList}>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavDashboard
          }}
          onClick={() => go("/home")}
        >
          <span style={styles.drawerNavIcon}>⌂</span>
          <span style={styles.drawerNavText}>Dashboard</span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavMyInvestment
          }}
          onClick={() => go("/my-investment")}
        >
          <span style={styles.drawerNavIcon}>💼</span>
          <span style={styles.drawerNavText}>
            My Investment
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavSaveMoney
          }}
          onClick={() => go("/save-money")}
        >
          <span style={styles.drawerNavIcon}>💰</span>
          <span style={styles.drawerNavText}>
            Save Money
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavOneTime
          }}
          onClick={() => go("/one-time")}
        >
          <span style={styles.drawerNavIcon}>💵</span>
          <span style={styles.drawerNavText}>
            One Time
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavPlan
          }}
          onClick={handleDownloadPlan}
        >
          <span style={styles.drawerNavIcon}>📄</span>
          <span style={styles.drawerNavText}>
            {isDownloadingPlan
              ? "Downloading..."
              : "Plan PDF"}
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavAddFund
          }}
          onClick={() => go("/wallet")}
        >
          <span style={styles.drawerNavIcon}>➕</span>
          <span style={styles.drawerNavText}>
            Add Fund
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavRefer,
            ...(location.pathname === "/refer"
              ? styles.drawerNavItemActive
              : {})
          }}
          onClick={() => go("/refer")}
        >
          <span style={styles.drawerNavIcon}>🤝</span>
          <span style={styles.drawerNavText}>
            Refer & Earn
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavWithdraw
          }}
          onClick={() => go("/withdraw")}
        >
          <span style={styles.drawerNavIcon}>🏦</span>
          <span style={styles.drawerNavText}>
            Withdraw
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavDailyReward
          }}
          onClick={() => go("/daily-reward")}
        >
          <span style={styles.drawerNavIcon}>🎁</span>
          <span style={styles.drawerNavText}>
            Daily Reward
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavInvestmentAssistant
          }}
          onClick={() => go("/investment-assistant")}
        >
          <span style={styles.drawerNavIcon}>🤖</span>
          <span style={styles.drawerNavText}>
            Investment Assistance
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavSupport
          }}
          onClick={() => go("/support")}
        >
          <span style={styles.drawerNavIcon}>🎧</span>
          <span style={styles.drawerNavText}>
            Support
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavProfile
          }}
          onClick={() => go("/kyc")}
        >
          <span style={styles.drawerNavIcon}>👤</span>
          <span style={styles.drawerNavText}>
            Profile
          </span>
        </button>

        <button
          style={{
            ...styles.drawerNavItem,
            ...styles.drawerNavLogout
          }}
          onClick={handleLogout}
        >
          <span style={styles.drawerNavIcon}>🚪</span>
          <span style={styles.drawerNavText}>
            Logout
          </span>
        </button>

      </div>

      <div style={styles.treePlantOnlyWrapper}>
        <img
          src="/tree plant.png"
          alt="Tree Plant"
          style={styles.treePlantOnlyImg}
          onError={(e) => {
            e.currentTarget.src = "/tree plant.jpg";
          }}
        />
      </div>

    </div>
  </div>
)}
                      {new Date(item.date || item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div style={styles.txRightSection}>
                    <div
                      style={{
                        ...styles.txAmount,
                        color: isReceived ? "#16a34a" : "#dc2626"
                      }}
                    >
                      {isReceived ? "+" : "-"} ₹{money(item.amount)}
                    </div>

                    <span
                      style={{
                        ...styles.txStatusBadge,
                        background:
                          item.status === "Paid" ||
                          item.status === "Success" ||
                          item.status === "Active"
                            ? "#dcfce7"
                            : "#fef3c7",
                        color:
                          item.status === "Paid" ||
                          item.status === "Success" ||
                          item.status === "Active"
                            ? "#15803d"
                            : "#a16207"
                      }}
                    >
                      {item.status || "Paid"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredBonusHistory.length > 5 && (
          <button
            style={styles.viewAllBtn}
            onClick={() =>
              setShowAllBonusHistory(!showAllBonusHistory)
            }
          >
            {showAllBonusHistory ? "Show Less" : "View All History"}
          </button>
        )}
      </section>

      {/* =========================
          REFERRAL MEMBERS
      ========================= */}

      <section style={styles.historyCard}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>
              👥 My Referral Members
            </h2>
            <p style={styles.sectionSubText}>
              People joined using your referral
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div style={styles.memberList}>
          {safeHistory.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: 40 }}>👥</div>
              <p>No referral members found</p>
            </div>
          ) : (
            safeHistory
              .filter((item) => {
                if (statusFilter === "All") return true;

                if (statusFilter === "Active") {
                  return (
                    String(item.status || "")
                      .toLowerCase() === "active"
                  );
                }

                return (
                  String(item.status || "")
                    .toLowerCase() !== "active"
                );
              })
              .slice(
                0,
                showAllHistory ? safeHistory.length : 5
              )
              .map((item, index) => {
                const memberPhoto = getDynamicUserPhoto(item);

                return (
                  <div
                    key={item._id || index}
                    style={styles.memberRow}
                  >
                    <div style={styles.memberLeft}>
                      {memberPhoto ? (
                        <img
                          src={memberPhoto}
                          alt={item.name || "Member"}
                          style={styles.memberAvatar}
                        />
                      ) : (
                        <div style={styles.memberAvatarFallback}>
                          {getInitials(
                            item.name ||
                              item.fromName ||
                              item.userName
                          )}
                        </div>
                      )}

                      <div>
                        <h4 style={styles.memberName}>
                          {item.name ||
                            item.fromName ||
                            item.userName ||
                            "SAVE MONEY Member"}
                        </h4>

                        <p style={styles.memberDate}>
                          {item.date
                            ? new Date(
                                item.date
                              ).toLocaleDateString()
                            : "Recently joined"}
                        </p>
                      </div>
                    </div>

                    <div style={styles.memberRight}>
                      <span
                        style={{
                          ...styles.memberStatus,
                          background:
                            String(
                              item.status || ""
                            ).toLowerCase() === "active"
                              ? "#dcfce7"
                              : "#fef3c7",
                          color:
                            String(
                              item.status || ""
                            ).toLowerCase() === "active"
                              ? "#15803d"
                              : "#a16207"
                        }}
                      >
                        {item.status || "Pending"}
                      </span>

                      <span style={styles.memberAmount}>
                        ₹{money(item.amount || 0)}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {safeHistory.length > 5 && (
          <button
            style={styles.viewAllBtn}
            onClick={() =>
              setShowAllHistory(!showAllHistory)
            }
          >
            {showAllHistory ? "Show Less" : "View All Members"}
          </button>
        )}
      </section>

      {/* =========================
          PERFORMANCE BONUS
      ========================= */}

      <section style={styles.performanceSection}>
        <div style={styles.performanceHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              📈 Performance Bonus
            </h2>
            <p style={styles.sectionSubText}>
              Your recurring performance income
            </p>
          </div>

          <select
            value={performanceFilter}
            onChange={(e) =>
              setPerformanceFilter(e.target.value)
            }
            style={styles.filterSelect}
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="allTime">All Time</option>
          </select>
        </div>

        <div style={styles.performanceGrid}>
          <div style={styles.performanceMainCard}>
            <div style={styles.performanceIcon}>📈</div>

            <div>
              <p style={styles.cardLabel}>
                Performance Income
              </p>

              <h2 style={styles.performanceAmount}>
                ₹{money(perfAmt)}
              </h2>

              <span style={styles.cardSmallText}>
                Recurring monthly income
              </span>
            </div>
          </div>

          <div style={styles.performanceInfoCard}>
            <span style={styles.infoEmoji}>🔄</span>

            <div>
              <h4>Keep Your Team Active</h4>
              <p>
                Performance income continues while
                your referred members keep their SIP active.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          TEAM BONUS
      ========================= */}

      <section style={styles.teamSection}>
        <div style={styles.teamHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              👥 Team Bonus
            </h2>

            <p style={styles.sectionSubText}>
              Build your team and grow together
            </p>
          </div>

          <select
            value={teamTimeFilter}
            onChange={(e) =>
              setTeamTimeFilter(e.target.value)
            }
            style={styles.filterSelect}
          >
            <option value="allTime">All Time</option>
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {teamTimeFilter === "custom" && (
          <div style={styles.dateFilterBox}>
            <div>
              <label style={styles.dateLabel}>
                Start Date
              </label>

              <input
                type="date"
                value={teamStartDate}
                onChange={(e) =>
                  setTeamStartDate(e.target.value)
                }
                style={styles.dateInput}
              />
            </div>

            <div>
              <label style={styles.dateLabel}>
                End Date
              </label>

              <input
                type="date"
                value={teamEndDate}
                onChange={(e) =>
                  setTeamEndDate(e.target.value)
                }
                style={styles.dateInput}
              />
            </div>
          </div>
        )}

        <div style={styles.teamStatsGrid}>
          <div style={styles.teamStatCard}>
            <div style={styles.teamStatIcon}>👥</div>
            <p>Total Team</p>
            <h2>
              {team.totalMembers ||
                team.totalTeam ||
                0}
            </h2>
          </div>

          <div style={styles.teamStatCard}>
            <div style={styles.teamStatIcon}>💰</div>
            <p>Team Income</p>
            <h2>
              ₹{money(
                selectedFilteredTotalIncome ||
                  teamAmt ||
                  0
              )}
            </h2>
          </div>

          <div style={styles.teamStatCard}>
            <div style={styles.teamStatIcon}>🔥</div>
            <p>Today's Join</p>
            <h2>
              {todayJoinMembers.length}
            </h2>
          </div>
        </div>

        <div style={styles.levelGrid}>
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              style={styles.levelCard}
            >
              <div style={styles.levelNumber}>
                L{level}
              </div>

              <div style={styles.levelContent}>
                <span>
                  Level {level}
                </span>

                <strong>
                  {dynamicCounts[level] || 0}
                </strong>
              </div>

              <div style={styles.levelIncome}>
                ₹{money(
                  dynamicIncomes[level] || 0
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.teamHistoryBox}>
          <div style={styles.teamHistoryHeader}>
            <h3>Team Income History</h3>

            <button
              style={styles.smallActionBtn}
              onClick={() =>
                setShowTodayJoinModal(true)
              }
            >
              Today's Join
            </button>
          </div>

          {selectedFilteredHistory.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: 38 }}>
                👥
              </div>
              <p>No team income history found.</p>
            </div>
          ) : (
            <div style={styles.teamHistoryList}>
              {selectedFilteredHistory
                .slice(0, 10)
                .map((item, index) => (
                  <div
                    key={item._id || index}
                    style={styles.teamHistoryRow}
                  >
                    <div>
                      <strong>
                        {item.name ||
                          item.fromName ||
                          "Team Member"}
                      </strong>

                      <small>
                        Level {item.level || 1}
                      </small>
                    </div>

                    <div style={styles.teamHistoryRight}>
                      <strong>
                        +₹{money(item.amount || 0)}
                      </strong>

                      <small>
                        {item.date
                          ? new Date(
                              item.date
                            ).toLocaleDateString()
                          : ""}
                      </small>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================
          ROYALTY BONUS
      ========================= */}

      <section style={styles.royaltySection}>
        <div style={styles.royaltyHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              👑 Royalty Income
            </h2>

            <p style={styles.sectionSubText}>
              Special rewards for growing leaders
            </p>
          </div>
        </div>

        <div style={styles.royaltyCard}>
          <div style={styles.royaltyIcon}>👑</div>

          <div style={styles.royaltyContent}>
            <p>Total Royalty Income</p>

            <h2>
              ₹{money(royAmt)}
            </h2>

            <span>
              Your royalty earnings from the team
            </span>
          </div>

          <button
            style={styles.royaltyDetailsBtn}
            onClick={() =>
              setBonusModal("royalty")
            }
          >
            View Details
          </button>
        </div>
      </section>

      {/* =========================
          TREE VIEW
      ========================= */}

      <section style={styles.treeSection}>
        <div style={styles.treeHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              🌳 My Network Tree
            </h2>

            <p style={styles.sectionSubText}>
              See your referral network
            </p>
          </div>

          <button
            style={styles.treeToggleBtn}
            onClick={() =>
              setTreeOpen(!treeOpen)
            }
          >
            {treeOpen ? "Close Tree" : "Open Tree"}
          </button>
        </div>

        {treeOpen && (
          <div style={styles.treeContainer}>
            {treeData &&
            Object.keys(treeData).length > 0 ? (
              <pre style={styles.treePre}>
                {JSON.stringify(
                  treeData,
                  null,
                  2
                )}
              </pre>
            ) : (
              <div style={styles.emptyBox}>
                <div style={{ fontSize: 42 }}>
                  🌳
                </div>
                <p>
                  Your network tree will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
                          ? `Received Today, ${new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                          : `${new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                        }
                      </p>
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


      {/* 📸 রসিদ ইমেজ মোডাল পপআপ (ডাইনামিক অ্যামাউন্ট ওয়ার্ডস এবং ক্লিয়ার সোর্স সহ) */}
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

            <div ref={shareAreaRef} style={styles.txDetailsInnerBox}>
              <div style={{ textAlign: "center", paddingBottom: "20px", borderBottom: "1px dashed #e2e8f0" }}>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Amount</p>
                <h1 style={styles.txDetailMainAmount}>
                  {money(selectedTx.amount)} <span style={styles.verifiedCheck}>✓</span>
                </h1>

                <p style={{ margin: "4px 0", color: "#666", textTransform: "capitalize", fontSize: "13px" }}>
                  {numberToWords(selectedTx.amount)}
                </p>

                <div style={styles.moneyReceivedTag}>
                  💵 {selectedTx.bonusType || "Money Received"} {selectedTx.level ? `(Level ${selectedTx.level})` : ""}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <div>
                  <p style={styles.sectionLabel}>Income Source</p>
                  <h4 style={styles.sectionValueName}>{selectedTx.bonusType || "Referral Bonus"}</h4>
                  <p style={styles.sectionSubValue}>Credited successfully to your wallet</p>
                </div>

                <div style={{ ...styles.detailAvatarCircle, background: "#fef3c7", color: "#d97706" }}>
                  🎁
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <div>
                  <p style={styles.sectionLabel}>From</p>
                  <h4 style={styles.sectionValueName}>
                    {selectedTx.fromName || "Sender User"} <span style={styles.blueTick}>✓</span>
                  </h4>
                  <p style={styles.sectionSubValue}>{selectedTx.fromEmail || "user@axl"}</p>
                </div>

                {getDynamicUserPhoto(selectedTx) ? (
                  <img
                    style={styles.detailUserImage}
                    src={getDynamicUserPhoto(selectedTx)}
                    alt="Sender"
                  />
                ) : (
                  <div style={{ ...styles.detailAvatarCircle, background: "#e0f2fe", color: "#0369a1" }}>
                    {getInitials(selectedTx.fromName)}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0" }}>
                <div>
                  <p style={styles.sectionLabel}>To</p>
                  <h4 style={styles.sectionValueName}>
                    {user.name || "Save Money User"}
                  </h4>
                  <p style={styles.sectionSubValue}>
                    {user.email || "wallet@id"}
                  </p>
                  <p style={styles.bankNameFooter}>
                    Save Money Wallet - {referCode}
                  </p>
                </div>

                <img
                  style={styles.detailUserImage}
                  src={profilePhoto || "https://i.pravatar.cc/160?img=12"}
                  alt="Receiver"
                />
              </div>

              <div style={styles.txFooterMetaDetails}>
                <p>
                  Received at{" "}
                  {new Date(selectedTx.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                  ,{" "}
                  {new Date(selectedTx.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </p>

                <p style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    Ref No: TXN{Math.floor(100000000 + Math.random() * 900000000)}
                  </span>

                  <span
                    style={{
                      color: "#2563eb",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                    onClick={() => copyText("TXN123456")}
                  >
                    Copy
                  </span>
                </p>
              </div>
            </div>

            <button
              style={styles.imgCloseBtn}
              onClick={() => setSelectedTx(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}


      {/* ==========================================================
          IMAGE 1: PERFORMANCE BONUS MODAL
          ========================================================== */}
      {bonusModal === "performance" && (
        <NewModal onClose={() => setBonusModal(null)}>

          <div style={styles.modalHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={styles.perfHeaderIconBox}>📊</div>

              <h2 style={styles.modalMainTitle}>
                Performance Bonus
              </h2>
            </div>

            <button
              style={styles.modalRoundCloseBtn}
              onClick={() => setBonusModal(null)}
            >
              ✕
            </button>
          </div>

          {!performance?.enabled ? (
            <div style={{ padding: "10px 0" }}>

              {performance?.expired ? (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "20px",
                    padding: "25px",
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>
                    ❌
                  </div>

                  <h3
                    style={{
                      color: "#dc2626",
                      margin: "0 0 8px 0",
                      fontSize: "20px"
                    }}
                  >
                    Performance Bonus Expired
                  </h3>

                  <p
                    style={{
                      color: "#991b1b",
                      margin: 0,
                      fontSize: "14px",
                      lineHeight: "1.5"
                    }}
                  >
                    You failed to complete 3 active referrals within 30 days of registration.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #ffedd5",
                    borderRadius: "20px",
                    padding: "20px"
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "15px"
                    }}
                  >
                    <span
                      style={{
                        background: "#ffedd5",
                        color: "#c2410c",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        fontSize: "12px"
                      }}
                    >
                      Status: Inactive
                    </span>

                    <span
                      style={{
                        color: "#ea580c",
                        fontWeight: "bold",
                        fontSize: "13px"
                      }}
                    >
                      ⏳ {performance?.daysLeft || 0} Days Left
                    </span>
                  </div>

                  <h3
                    style={{
                      color: "#9a3412",
                      fontSize: "18px",
                      margin: "0 0 6px 0"
                    }}
                  >
                    Unlock Performance Bonus
                  </h3>

                  <p
                    style={{
                      color: "#c2410c",
                      fontSize: "13px",
                      margin: "0 0 20px 0",
                      lineHeight: "1.4"
                    }}
                  >
                    Complete 3 active referrals within 30 days of account creation to unlock your performance bonus.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      background: "#ffffff",
                      padding: "15px",
                      borderRadius: "14px",
                      border: "1px solid #fed7aa",
                      textAlign: "center",
                      marginBottom: "15px"
                    }}
                  >
                    <div>
                      <small
                        style={{
                          color: "#9a3412",
                          fontSize: "11px",
                          display: "block"
                        }}
                      >
                        Completed Active Refers
                      </small>

                      <h2
                        style={{
                          margin: "4px 0 0",
                          color: "#ea580c",
                          fontSize: "22px"
                        }}
                      >
                        {performance?.directActiveCount || 0} / 3
                      </h2>
                    </div>

                    <div
                      style={{
                        borderLeft: "1px solid #fed7aa"
                      }}
                    >
                      <small
                        style={{
                          color: "#9a3412",
                          fontSize: "11px",
                          display: "block"
                        }}
                      >
                        Remaining Needed
                      </small>

                      <h2
                        style={{
                          margin: "4px 0 0",
                          color: "#dc2626",
                          fontSize: "22px"
                        }}
                      >
                        {Math.max(
                          0,
                          3 - Number(performance?.directActiveCount || 0)
                        )}
                      </h2>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#9a3412"
                        }}
                      >
                        Progress
                      </span>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          color: "#ea580c"
                        }}
                      >
                        {Math.min(
                          100,
                          (Number(performance?.directActiveCount || 0) / 3) * 100
                        ).toFixed(0)}%
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "#fed7aa",
                        borderRadius: "10px",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            (Number(performance?.directActiveCount || 0) / 3) * 100
                          )}%`,
                          height: "100%",
                          background: "#ea580c",
                          borderRadius: "10px",
                          transition: "width 0.3s ease"
                        }}
                      />
                    </div>
                  </div>

                  <button
                    style={{
                      width: "100%",
                      marginTop: "15px",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px",
                      background: "#ea580c",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      setBonusModal(null);
                      shareWhatsapp();
                    }}
                  >
                    🔗 Refer Now
                  </button>

                </div>
              )}
            </div>
          ) : (
            <>
              <div style={styles.performanceActiveSummaryCard}>
                <div>
                  <p style={styles.performanceActiveLabel}>
                    Total Performance Income
                  </p>

                  <h1 style={styles.performanceActiveAmount}>
                    {money(performance?.totalBonus || 0)}
                  </h1>
                </div>

                <div style={styles.performanceActiveBadge}>
                  ● Active
                </div>
              </div>

              <div style={styles.performanceStatsGrid}>
                <div style={styles.performanceStatCard}>
                  <span>👥</span>
                  <small>Active Referrals</small>
                  <strong>
                    {performance?.directActiveCount || 0}
                  </strong>
                </div>

                <div style={styles.performanceStatCard}>
                  <span>💰</span>
                  <small>Today's Bonus</small>
                  <strong>
                    {money(performance?.todayBonus || 0)}
                  </strong>
                </div>

                <div style={styles.performanceStatCard}>
                  <span>📅</span>
                  <small>This Month</small>
                  <strong>
                    {money(performance?.thisMonthBonus || 0)}
                  </strong>
                </div>

                <div style={styles.performanceStatCard}>
                  <span>📈</span>
                  <small>Total Earned</small>
                  <strong>
                    {money(performance?.totalBonus || 0)}
                  </strong>
                </div>
              </div>

              <div style={styles.sectionHeadingRowFlex}>
                <span>📄</span>
                <h3 style={styles.sectionTitleBlockHeader}>
                  Performance Bonus History
                </h3>
              </div>

              <div style={styles.modalDataLogsContainer}>
                {performanceHistory.length === 0 ? (
                  <div style={styles.emptyHistoryStateBox}>
                    <div style={styles.emptyStateIconBlue}>📄</div>

                    <h4 style={styles.emptyStateMainTitle}>
                      No Performance Bonus History Found
                    </h4>
                  </div>
                ) : (
                  performanceHistory.map((item, index) => (
                    <div
                      key={index}
                      style={styles.historyItemRowCard}
                    >
                      <div>
                        <h4 style={styles.logUserNameText}>
                          {item.fromName || "User Name"}
                        </h4>

                        <p style={styles.logDateSubText}>
                          {new Date(item.date).toLocaleDateString("en-IN")}
                        </p>
                      </div>

                      <h3 style={styles.logIncomeValueGreen}>
                        +{money(item.amount)}
                      </h3>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          <button
            style={styles.modalFooterPrimaryBtn}
            onClick={() => setBonusModal(null)}
          >
            Close
          </button>

        </NewModal>
      )}


      {/* ==========================================================
          IMAGE 2: TEAM BONUS MODAL
          ========================================================== */}
      {bonusModal === "team" && (
        <NewModal onClose={() => setBonusModal(null)}>

          <div style={styles.modalHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              <button style={styles.referOrangePendingArrowActionBtn} onClick={() => setShowPendingModal(true)}>
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

function NewModal({ children, onClose }) {
  return (
    <div style={styles.newModalOverlayOverlay} onClick={onClose}>
      <div style={styles.newModalContentWindowBox} onClick={(e) => e.stopPropagation()}>
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
    referPendingActionFlexCenterBlock: { flex: 0.9, minWidth: "260px", backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "20px", padding: "20px", display: "flex", alignItems: "center" },
  referOrangePendingArrowActionBtn: { width: "100%", border: "1px solid #fed7aa", backgroundColor: "#ffffff", color: "#c2410c", borderRadius: "14px", padding: "14px 16px", fontSize: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center" },
  verticalMetricsFlexListColumn: { display: "flex", flexDirection: "column", gap: "0px" },
  metricListingInlineRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" },
  metricIconCircleOrange: { width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#ffedd5", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" },
  metricIconCircleGreen: { width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" },
  metricIconCircleBlue: { width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" },
  metricIconCirclePurp: { width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" },
  metricLabelNameText: { fontSize: "13px", color: "#475569", fontWeight: "500" },
  metricBoldValueNumberText: { fontSize: "14px", color: "#1e293b", fontWeight: "800" },
  tripleSquareBadgesFlexRowTrack: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" },
  squareStatusBadgeMetricsItemBox: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "14px 8px", textAlign: "center" },
  squareIconTrackBlue: { width: "34px", height: "34px", margin: "0 auto 7px", borderRadius: "10px", backgroundColor: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" },
  squareIconTrackGreen: { width: "34px", height: "34px", margin: "0 auto 7px", borderRadius: "10px", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" },
  squareIconTrackRed: { width: "34px", height: "34px", margin: "0 auto 7px", borderRadius: "10px", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" },
  squareBadgeLabelCaption: { margin: 0, fontSize: "11px", color: "#64748b" },
  squareBadgeValueNumberHeading: { margin: "3px 0 0", fontSize: "18px", fontWeight: "800", color: "#1e293b" },
  tableAvatarIconRoundPhoto: { width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover" },
  tableInitialPlaceholderBadgeCircle: { width: "34px", height: "34px", borderRadius: "50%", background: "#f1f5f9", color: "#475569", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: "700" },
  referModalFooterCloseButton: { width: "100%", padding: "14px", background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", borderRadius: "14px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  historyCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "15px", flexWrap: "wrap" },
  historyTitle: { margin: 0, fontSize: "22px", color: "#1e293b" },
  historySubtitle: { margin: "4px 0 0", fontSize: "13px", color: "#64748b" },
  historyEmpty: { textAlign: "center", padding: "35px", color: "#94a3b8" },
  historyRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 0", borderBottom: "1px solid #f1f5f9" },
  historyUser: { display: "flex", alignItems: "center", gap: "12px" },
  historyAvatar: { width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" },
  historyAvatarFallback: { width: "42px", height: "42px", borderRadius: "50%", background: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" },
  historyUserName: { margin: 0, fontSize: "14px", fontWeight: "700", color: "#1e293b" },
  historyUserEmail: { margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" },
  historyAmount: { fontSize: "15px", fontWeight: "800", color: "#16a34a" },
  historyDate: { fontSize: "12px", color: "#94a3b8", marginTop: "3px" },
  txHistorySection: { width: "min(1120px, 94vw)", margin: "26px auto", background: "white", borderRadius: 26, padding: 28, boxShadow: "0 16px 36px rgba(156,105,255,.16)" },
  txHistoryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
  txHistoryTitle: { margin: 0, fontSize: "22px", fontWeight: "800", color: "#1e293b" },
  txHistoryList: { display: "flex", flexDirection: "column" },
  txHistoryItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" },
  txLeftSection: { display: "flex", alignItems: "center", gap: "14px" },
  txUserAvatarImage: { width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" },
  txAvatarCircle: { width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" },
  txMetaDetails: { display: "flex", flexDirection: "column", gap: "2px" },
  txSenderName: { margin: 0, fontSize: "16px", fontWeight: "600", color: "#1e293b" },
  txTimeStamp: { margin: 0, fontSize: "13px", color: "#64748b" },
  txTagBadge: { display: "inline-flex", alignItems: "center", background: "#e8f5e9", color: "#2e7d32", fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px", marginTop: "4px", width: "fit-content" },
  txRightSection: { textAlign: "right" },
  txAmountText: { margin: 0, fontSize: "16px", fontWeight: "700" },
  txFromBankText: { margin: 0, fontSize: "12px", color: "#64748b", marginTop: "2px" },
  upiIconSmall: { fontSize: "12px" },
  paytmBrandFooter: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "20px", paddingTop: "10px", fontSize: "14px" },
  txDetailsCard: { width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "24px", padding: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.15)", fontFamily: "sans-serif" },
  txDetailsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "15px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" },
  txBackArrow: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#1e293b" },
  txHeaderLink: { color: "#2563eb", fontWeight: "600", fontSize: "14px", cursor: "pointer" },
  txDetailsInnerBox: { border: "1px solid #e2e8f0", borderRadius: "20px", padding: "16px", marginTop: "16px", background: "#fff" },
  txDetailMainAmount: { fontSize: "32px", fontWeight: "800", margin: "5px 0", color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  verifiedCheck: { color: "#10b981", fontSize: "24px" },
  moneyReceivedTag: { background: "#e8f5e9", color: "#2e7d32", padding: "6px 14px", borderRadius: "20px", fontWeight: "bold", fontSize: "13px", display: "inline-block", marginTop: "10px" },
  sectionLabel: { margin: 0, fontSize: "13px", color: "#666", fontWeight: "500" },
  sectionValueName: { margin: "2px 0 0 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" },
  blueTick: { color: "#00baf2" },
  sectionSubValue: { margin: 0, fontSize: "13px", color: "#64748b" },
  bankNameFooter: { margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" },
  detailAvatarCircle: { width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  detailUserImage: { width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" },
  txFooterMetaDetails: { background: "#f8fafc", padding: "12px", borderRadius: "12px", marginTop: "12px", fontSize: "12px", color: "#64748b", lineHeight: "1.6" },
  statusOverlayBg: { position: "fixed", inset: 0, background: "rgba(10, 15, 30, 0.45)", backdropFilter: "blur(8px)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center" },
  statusOverlayCard: { background: "rgba(255, 255, 255, 0.95)", padding: "30px 40px", borderRadius: "20px", textAlign: "center", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.15)", maxWidth: "360px", width: "85%", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  statusOverlayIcon: { width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "bold" },
  statusOverlayText: { fontSize: "17px", color: "#1e293b", margin: 0, fontWeight: "700", lineHeight: "1.5" },
  loadingPage: { minHeight: "100vh", background: "#fff7ff", display: "flex", alignItems: "center", justifyContent: "center" },
  loadingBox: { background: "white", padding: 35, borderRadius: 30, textAlign: "center", boxShadow: "0 20px 45px rgba(124,58,237,.18)" },
  loadingIcon: { fontSize: 70 },
  page: { minHeight: "100vh", padding: 28, background: "linear-gradient(135deg,#fffaff,#f8f3ff,#ffffff)", fontFamily: "Arial, sans-serif", color: "#111542", position: "relative" },
  referMenuButton: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 54,
    height: 54,
    border: "none",
    borderRadius: 16,
    background: "#08101e",
    color: "#ffffff",
    boxShadow: "0 12px 30px rgba(0,0,0,.28)",
    fontSize: 30,
    cursor: "pointer",
    zIndex: 10
  },
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
  table: { width: "100%", borderCollapse: "collapse", minWidth: 650, textAlign: "left" },
  viewMoreBtn: { display: "block", margin: "22px auto 0", border: "none", background: "white", color: "#7b20e8", fontSize: 18, fontWeight: 900, cursor: "pointer" },
  bottomBanner: { width: "min(1120px, 94vw)", margin: "26px auto 10px", padding: "26px 34px", borderRadius: 24, background: "linear-gradient(90deg,#fff2ff,#f5eaff)", display: "flex", alignItems: "center", gap: 24 },
  bottomGift: { fontSize: 70 },
  referNowBtn: { border: "none", borderRadius: 16, padding: "18px 48px", color: "white", background: "linear-gradient(90deg,#7b20ff,#c515e9)", fontSize: 20, fontWeight: 900, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { width: "min(760px, 96vw)", maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: 28, padding: 28, boxShadow: "0 30px 90px rgba(0,0,0,.25)" },
  closeBtn: { marginTop: 20, width: "100%", border: "none", borderRadius: 14, padding: 14, background: "#ebe9fe", color: "#4f46e5", fontWeight: 900, cursor: "pointer" },
  infoBox: { background: "#f8fafc", padding: 14, borderRadius: 14, lineHeight: 1.6 }
};
