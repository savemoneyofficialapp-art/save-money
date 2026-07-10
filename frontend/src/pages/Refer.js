import React, { useEffect, useState, useMemo } from "react";
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
  const [treeOpen, setTreeOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [referBonus, setReferBonus] = useState({});
  const [performanceFilter, setPerformanceFilter] = useState("thisMonth");
  const [teamMonthFilter, setTeamMonthFilter] = useState("thisMonth");
  const [bonusFilter, setBonusFilter] = useState("All");
  const [showAllBonusHistory, setShowAllBonusHistory] = useState(false);
  
  // ফিল্টার ফিক্স করার জন্য স্টেট
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- স্ক্রিনের মাঝখানে বড় মেসেজ দেখানোর জন্য নতুন স্টেট ---
  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info", // 'success' | 'info' | 'error'
    message: ""
  });

  // মাঝখানে মেসেজ শো করানোর হেল্পার ফাংশন
  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 2200);
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

  useEffect(() => {
    loadReferData(selectedMonth, selectedYear);
  }, []);

  const loadReferData = async (month = selectedMonth, year = selectedYear) => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/refer-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          email,
          month,
          year
        })
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

  const getTeamHistory = () => {
    if (!team.history) return [];

    const now = new Date();

    return team.history.filter((item) => {
      const d = new Date(item.date);

      if (teamMonthFilter === "thisMonth") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }

      if (teamMonthFilter === "lastMonth") {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
      }

      return d.getMonth() === Number(teamMonthFilter);
    });
  };

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const referCode = user.referCode || user.referralCode || user.walletId || "SMREF0001";

  const totalReferWallet =
    Number(user.referralIncome || 0) +
    Number(user.performanceIncome || 0) +
    Number(user.teamIncome || 0) +
    Number(user.royaltyIncome || 0);

  const referLink = `${window.location.origin}/register?ref=${referCode}`;

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerStatusOverlay("success", "Copied Successfully! 🎉");
    } catch {
      triggerStatusOverlay("error", "Copy failed. Please try manually.");
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

  const safeHistory = Array.isArray(history) ? history : [];
  const safeBonusHistory = Array.isArray(bonusHistory) ? bonusHistory : [];

  const filteredBonusHistory =
    bonusFilter === "All"
      ? safeBonusHistory
      : safeBonusHistory.filter((x) => x.bonusType === bonusFilter);

  const visibleBonusHistory = showAllBonusHistory
    ? filteredBonusHistory
    : filteredBonusHistory.slice(0, 5);

  const visibleHistory =
    statusFilter === "All" ? safeHistory : safeHistory.filter((x) => x.status === statusFilter);

  const finalHistory = showAllHistory ? visibleHistory : visibleHistory.slice(0, 3);

  const bonusCards = [
    {
      key: "performance",
      title: "Performance Bonus",
      amount: performance.balance || user.performanceIncome || 0,
      icon: "📈",
      color: "#c026d3",
      bg: "#fff0ff"
    },
    {
      key: "team",
      title: "Team Bonus",
      amount: team.balance || user.teamIncome || 0,
      icon: "👥",
      color: "#2563eb",
      bg: "#eff6ff"
    },
    {
      key: "royalty",
      title: "Royalty Bonus",
      amount: royalty.balance || user.royaltyIncome || 0,
      icon: "👑",
      color: "#f97316",
      bg: "#fff7ed"
    },
    {
      key: "refer",
      title: "Refer Bonus",
      amount: referBonus.balance || user.referIncome || 0,
      icon: "🎁",
      color: "#16a34a",
      bg: "#ecfdf5"
    }
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

  return (
    <div style={styles.page}>
      
      {/* --- স্ক্রিনের মাঝখানে বড় ইনফো মেসেজ দেখানোর কাস্টম ওভারলে UI --- */}
      {statusOverlay.show && (
        <div style={styles.statusOverlayBg}>
          <div style={{
            ...styles.statusOverlayCard,
            borderTop: statusOverlay.type === "success" ? "6px solid #10b981" : statusOverlay.type === "error" ? "6px solid #ef4444" : "6px solid #2563eb"
          }}>
            <div style={{
              ...styles.statusOverlayIcon,
              background: statusOverlay.type === "success" ? "#dcfce7" : statusOverlay.type === "error" ? "#fee2e2" : "#dbeafe",
              color: statusOverlay.type === "success" ? "#10b981" : statusOverlay.type === "error" ? "#ef4444" : "#2563eb"
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
              src={user.photo || "https://i.pravatar.cc/160?img=12"}
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
          <div style={styles.walletRound}>💸</div>
          <p>Refer Wallet Balance</p>
          <h1>{money(totalReferWallet)}</h1>
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
          <div>
            <h2>💰 All Bonus History</h2>
          </div>

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

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Bonus</th>
                <th>From User</th>
                <th>Level</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {safeBonusHistory.length === 0 ? (
                <tr>
                  <td colSpan="6">No Bonus History</td>
                </tr>
              ) : (
                visibleBonusHistory.map((item, index) => (
                  <tr key={index}>
                    <td>{item.bonusType}</td>
                    <td>
                      <b>{item.fromName || "-"}</b>
                      <br />
                      <small>{item.fromEmail}</small>
                    </td>
                    <td>{item.level || "-"}</td>
                    <td>{money(item.amount)}</td>
                    <td>{new Date(item.date).toLocaleString("en-IN")}</td>
                    <td>
                      <span style={{ padding: "6px 12px", borderRadius: 20, background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>
                        Paid
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
        <button style={styles.referNowBtn} onClick={shareWhatsapp}>
          🔗 Refer Now
        </button>
      </section>

      {/* --- Performance Modal --- */}
      {bonusModal === "performance" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>📈 Performance Bonus</h2>
          <h1>{money(performance.balance)}</h1>
          <p>
            Status : <b style={{ color: performance.enabled ? "#16a34a" : "#ef4444" }}>{performance.enabled ? "Active" : "Inactive"}</b>
          </p>

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
          <p>
            Status : <b style={{ color: team.enabled ? "#16a34a" : "#ef4444" }}>{team.enabled ? "Active" : "Inactive"}</b>
          </p>
          <hr />
          <h3>Today's Report</h3>
          <p>Today's Income : <b>{money(team.todayBonus)}</b></p>
          <p>Today's New Joining : <b>{team.todayJoin || 0}</b></p>

          <div style={styles.levelGrid}>
            <div><b>L1</b><br />Join : {team.todayJoinCount?.[1] || 0}</div>
            <div><b>L2</b><br />Join : {team.todayJoinCount?.[2] || 0}</div>
            <div><b>L3</b><br />Join : {team.todayJoinCount?.[3] || 0}</div>
            <div><b>L4</b><br />Join : {team.todayJoinCount?.[4] || 0}</div>
            <div><b>L5</b><br />Join : {team.todayJoinCount?.[5] || 0}</div>
          </div>
          <hr />

          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <select
              value={teamMonthFilter}
              onChange={(e) => setTeamMonthFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="0">January</option>
              <option value="1">February</option>
              <option value="2">March</option>
              <option value="3">April</option>
              <option value="4">May</option>
              <option value="5">June</option>
              <option value="6">July</option>
              <option value="7">August</option>
              <option value="8">September</option>
              <option value="9">October</option>
              <option value="10">November</option>
              <option value="11">December</option>
            </select>
          </div>

          <h3>Income Summary</h3>
          <p>This Month : <b>{money(team.thisMonthBonus)}</b></p>
          <p>Last Month : <b>{money(team.lastMonthBonus)}</b></p>
          <hr />

          <h3>Level Income</h3>
          <div style={styles.levelGrid}>
            <div>Level 1<br />{money(team.level1Income)}</div>
            <div>Level 2<br />{money(team.level2Income)}</div>
            <div>Level 3<br />{money(team.level3Income)}</div>
            <div>Level 4<br />{money(team.level4Income)}</div>
            <div>Level 5<br />{money(team.level5Income)}</div>
          </div>
          <hr />

          <h3>Team Bonus History</h3>
          <div style={{ maxHeight: 350, overflowY: "auto" }}>
            {getTeamHistory().length === 0 ? (
              <p>No Team Bonus History</p>
            ) : (
              getTeamHistory().map((item, index) => (
                <div key={index} style={{ padding: 12, marginBottom: 12, background: "#f8fafc", borderRadius: 12 }}>
                  <p><b>User :</b> {item.fromName}</p>
                  <p><b>Upline :</b> {item.uplineName || "-"}</p>
                  <p><b>Level :</b> {item.level}</p>
                  <p><b>Bonus :</b> Level {item.level} → {money(item.amount)}</p>
                  <p><b>You Earned :</b> {money(item.amount)}</p>
                  <p><b>Date :</b> {new Date(item.date).toLocaleDateString("en-IN")}</p>
                </div>
              ))
            )}
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

          <BonusHistory type="royalty" data={bonusHistory} />
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

      {/* --- Refer Modal (ফিল্টার ফিক্স সহ) --- */}
      {bonusModal === "refer" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>🎁 Refer Bonus</h2>
          <p style={styles.successText}>Congratulations! Every direct user's first investment gives you Refer Bonus.</p>
          <h1>{money(referBonus.balance || 0)}</h1>

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
            {/* ফিল্টার হ্যান্ডেলার যা পেজ রিলোড না করে ড্রপডাউন ভ্যালু ধরে রাখবে */}
            <select
              style={styles.filterSelect}
              value={selectedMonth}
              onChange={(e) => {
                const value = e.target.value;
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

                setSelectedMonth(value);
                setSelectedYear(targetYear);
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

          <BonusHistory type="Referral Bonus" data={referBonus.history || []} />
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}
    </div>
  );
}

function BonusHistory({ type, data }) {
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
              {rows.map((x, i) => (
                <tr key={i}>
                  <td>
                    <b>{x.fromName}</b><br /><small>{x.fromEmail}</small>
                  </td>
                  <td>{x.date ? new Date(x.date).toLocaleDateString("en-IN") : "-"}</td>
                  <td>L{x.level || 1}</td>
                  <td>₹{Number(x.amount || 0).toLocaleString("en-IN")}</td>
                  <td>{x.note || type}</td>
                </tr>
              ))}
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
  // --- নতুন মিডল ওভারলে নোটিফিকেশনের স্টাইলস সমূহ ---
  statusOverlayBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(6px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statusOverlayCard: {
    background: "#ffffff",
    padding: "24px 34px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 30px 70px rgba(0,0,0,0.25)",
    maxWidth: "380px",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px"
  },
  statusOverlayIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "bold"
  },
  statusOverlayText: {
    fontSize: "18px",
    color: "#0f172a",
    margin: 0,
    fontWeight: "800",
    lineHeight: "1.4"
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
  treeText: { minHeight: 58, color: "#5d6280" },
  historyCard: {
    width: "min(1120px, 94vw)",
    margin: "26px auto",
    background: "white",
    borderRadius: 26,
    padding: 28,
    boxShadow: "0 16px 36px rgba(156,105,255,.16)"
  },
  historyTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  filterSelect: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid #ddd"
  },
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 700
  },
  statusPill: {
    padding: "8px 16px",
    borderRadius: 20,
    fontWeight: 900
  },
  emptyTd: { textAlign: "center", padding: 25 },
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
  greenBtn: {
    border: "none",
    borderRadius: 14,
    padding: "13px 20px",
    background: "linear-gradient(90deg,#16a34a,#22c55e)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer"
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
  }
};
