import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [bonusModal, setBonusModal] = useState(null);
  const [treeOpen, setTreeOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadReferData();
  }, []);

  const loadReferData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/refer-dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.msg || "Refer data loading failed");
        return;
      }

      setUser(data.user || {});
      setHistory(Array.isArray(data.referHistory) ? data.referHistory : []);
      setBonusHistory(Array.isArray(data.bonusHistory) ? data.bonusHistory : []);
      setPerformance(data.performance || {});
      setTeam(data.team || {});
      setRoyalty(data.royalty || {});
    } catch (err) {
      console.log("REFER LOAD ERROR:", err);
      alert("Refer loading failed");
    } finally {
      setLoading(false);
    }
  };

  const referCode =
    user.referCode || user.referralCode || user.walletId || "SAVE-MONEY";

  const referLink = `${window.location.origin}/register?ref=${referCode}`;

  const safeHistory = Array.isArray(history) ? history : [];

  const visibleHistory =
    statusFilter === "All"
      ? safeHistory
      : safeHistory.filter(
          (x) => String(x.status).toLowerCase() === statusFilter.toLowerCase()
        );

  const finalHistory = showAllHistory
    ? visibleHistory
    : visibleHistory.slice(0, 3);

  const isActive =
    String(user.status || user.activeStatus || "Inactive").toLowerCase() ===
    "active";

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const copyText = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      alert("Copied");
    } catch {
      alert("Copy failed");
    }
  };

  const shareWhatsApp = () => {
    const text = `Join SAVE MONEY with my refer code ${referCode}\n${referLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareTelegram = () => {
    const text = `Join SAVE MONEY with my refer code ${referCode}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(
        referLink
      )}&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const bonusCards = [
    {
      key: "performance",
      icon: "📈",
      title: "Performance Bonus",
      amount: performance.balance || user.performanceIncome || 0,
      color: "#9b1de8",
      bg: "linear-gradient(145deg,#fff5ff,#f7edff)"
    },
    {
      key: "team",
      icon: "👥",
      title: "Team Bonus",
      amount: team.balance || user.teamIncome || 0,
      color: "#1976ff",
      bg: "linear-gradient(145deg,#f5fbff,#eef7ff)"
    },
    {
      key: "royalty",
      icon: "👑",
      title: "Royalty Bonus",
      amount: royalty.balance || user.royaltyIncome || 0,
      color: "#ff8a19",
      bg: "linear-gradient(145deg,#fffaf0,#fff2d9)"
    }
  ];

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loader}></div>
        <h3>Loading Refer World...</h3>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ←
      </button>

      <button
        style={styles.bellBtn}
        onClick={() => navigate("/notifications")}
      >
        🔔
        <span style={styles.bellCount}>3</span>
      </button>

      <header style={styles.header}>
        <p style={styles.welcome}>Welcome to</p>

        <h1 style={styles.title}>
          <span style={styles.walletLogo}>💵</span>
          SAVE MONEY
        </h1>

        <h2 style={styles.referWorld}>
          <span style={styles.line}></span>
          Refer World
          <span style={styles.line}></span>
        </h2>

        <p style={styles.tagline}>Refer More, Earn More, Grow Together!</p>
      </header>

      <section style={styles.heroCard}>
        <div style={styles.heroLeft}>
          <div style={styles.avatarWrap}>
            <img
              style={styles.avatar}
              src={
                user.photo ||
                user.photoImage ||
                user.avatar ||
                "https://i.pravatar.cc/180?img=12"
              }
              alt="user"
            />
            <div style={styles.crown}>♛</div>
          </div>

          <div style={styles.userInfo}>
            <h2>{user.name || "Save Money User"}</h2>

            <div style={styles.activePill}>
              <span
                style={{
                  ...styles.dot,
                  background: isActive ? "#22c55e" : "#ef4444"
                }}
              ></span>
              {isActive ? "Active Member" : "Inactive Member"}
            </div>

            <p style={styles.label}>Refer ID</p>

            <div style={styles.referIdBox}>
              <b>{referCode}</b>
              <button onClick={() => copyText(referCode)}>📋</button>
            </div>
          </div>
        </div>

        <div style={styles.heroLine}></div>

        <div style={styles.heroRight}>
          <div style={styles.walletRound}>👛</div>
          <p>Refer Wallet Balance</p>
          <h1>{money(user.referWallet || user.referralIncome || 0)}</h1>
          <button style={styles.withdrawBtn}>Withdraw</button>
        </div>
      </section>

      <section style={styles.linkCard}>
        <div style={styles.linkIcon}>🔗</div>

        <div style={styles.linkMiddle}>
          <h3>Your Refer Link</h3>
          <div style={styles.copyBox}>
            <span>{referLink}</span>
            <button style={styles.copyLinkBtn} onClick={() => copyText(referLink)}>
              📋 Copy Link
            </button>
          </div>
        </div>

        <div style={styles.shareBox}>
          <h3>Share via</h3>
          <button style={styles.whatsapp} onClick={shareWhatsApp}>
            🟢
          </button>
          <button style={styles.telegram} onClick={shareTelegram}>
            ✈️
          </button>
        </div>
      </section>

      <section style={styles.bonusGrid}>
        {bonusCards.map((b) => (
          <div key={b.key} style={{ ...styles.bonusCard, background: b.bg }}>
            <div
              style={{
                ...styles.bonusIcon,
                background: b.color
              }}
            >
              {b.icon}
            </div>

            <h3>{b.title}</h3>
            <h2>{money(b.amount)}</h2>

            <button
              style={{
                ...styles.detailBtn,
                color: b.color,
                borderColor: b.color
              }}
              onClick={() => setBonusModal(b.key)}
            >
              View Details
            </button>
          </div>
        ))}

        <div style={{ ...styles.bonusCard, background: "#ecfff4" }}>
          <div style={{ ...styles.bonusIcon, background: "#10b981" }}>🌳</div>
          <h3>Tree View</h3>
          <p style={{ minHeight: 38 }}>View your whole team structure</p>
          <button
            style={{
              ...styles.detailBtn,
              color: "#10b981",
              borderColor: "#10b981"
            }}
            onClick={() => setTreeOpen(true)}
          >
            View Tree
          </button>
        </div>
      </section>

      <section style={styles.historyCard}>
        <div style={styles.historyTop}>
          <div>
            <h2>🕘 Refer History</h2>
            <p>Check your referral activities</p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Refer ID</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Earning</th>
              </tr>
            </thead>

            <tbody>
              {finalHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.empty}>
                    No refer history found
                  </td>
                </tr>
              ) : (
                finalHistory.map((x, i) => (
                  <tr key={i}>
                    <td>
                      <b>{x.name || "User"}</b>
                      <br />
                      <small>{x.mobile || x.email}</small>
                    </td>

                    <td>{x.referId || "N/A"}</td>

                    <td>
                      {x.joinDate
                        ? new Date(x.joinDate).toLocaleString("en-IN")
                        : "N/A"}
                    </td>

                    <td>
                      <span
                        style={{
                          ...styles.statusPill,
                          background:
                            x.status === "Active" ? "#dcfce7" : "#ffe4e6",
                          color:
                            x.status === "Active" ? "#16a34a" : "#e11d48"
                        }}
                      >
                        {x.status || "Inactive"}
                      </span>
                    </td>

                    <td style={{ color: "#16a34a", fontWeight: 900 }}>
                      {money(x.earning || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {visibleHistory.length > 3 && (
          <button
            style={styles.viewMoreBtn}
            onClick={() => setShowAllHistory(!showAllHistory)}
          >
            {showAllHistory ? "Show Less ▲" : "View More ▼"}
          </button>
        )}
      </section>

      <section style={styles.bottomBanner}>
        <div style={styles.bottomGift}>🎁</div>

        <div style={{ flex: 1 }}>
          <h2>Keep Referring & Earning</h2>
          <p>Your network is your net worth.</p>
        </div>

        <button style={styles.referNowBtn} onClick={shareWhatsApp}>
          🔗 Refer Now
        </button>
      </section>

      {bonusModal && (
        <Modal onClose={() => setBonusModal(null)}>
          {bonusModal === "performance" && (
            <>
              <h2>📈 Performance Bonus</h2>
              <h1>{money(performance.balance || 0)}</h1>

              <p>
                Status:{" "}
                <b style={{ color: performance.enabled ? "#16a34a" : "#ef4444" }}>
                  {performance.enabled ? "Active" : "Inactive"}
                </b>
              </p>

              {!performance.completed && !performance.expired && (
                <>
                  <p>
                    Active Direct Refer:{" "}
                    <b>{performance.directActiveCount || 0}</b> / 10
                  </p>
                  <p>
                    Remaining: <b>{performance.remaining || 0}</b>
                  </p>
                  <p>
                    Days Left: <b>{performance.daysLeft || 0}</b>
                  </p>

                  <button style={styles.greenBtn} onClick={() => navigate("/save-money")}>
                    Go To Save Money Invest
                  </button>
                </>
              )}

              {performance.expired && (
                <p style={styles.dangerText}>
                  Task complete করতে পারোনি। Please upline এর সঙ্গে contact করো।
                </p>
              )}

              {performance.completed && (
                <p style={styles.successText}>
                  তুমি task complete করেছো। এখন থেকে তুমি Performance Bonus পাবে।
                </p>
              )}

              <BonusHistory type="Performance Bonus" data={bonusHistory} />
            </>
          )}

          {bonusModal === "team" && (
            <>
              <h2>👥 Team Bonus</h2>
              <h1>{money(team.balance || 0)}</h1>

              <p style={styles.successText}>
                Your network is growing. You will earn bonus from 3 levels.
              </p>

              <div style={styles.levelGrid}>
                <div>Level 1: ₹70</div>
                <div>Level 2: ₹50</div>
                <div>Level 3: ₹35</div>
              </div>

              <BonusHistory type="Team Bonus" data={bonusHistory} />
            </>
          )}

          {bonusModal === "royalty" && (
            <>
              <h2>👑 Royalty Bonus</h2>
              <h1>{money(royalty.balance || 0)}</h1>

              <p>
                Direct Refer: <b>{royalty.directCount || 0}</b> / 50
              </p>
              <p>
                Remaining: <b>{royalty.remaining || 0}</b>
              </p>

              <p>
                Status:{" "}
                <b style={{ color: royalty.enabled ? "#16a34a" : "#ef4444" }}>
                  {royalty.enabled ? "Active" : "Inactive"}
                </b>
              </p>

              <p>
                Royalty active হলে next business থেকে 3% bonus পাবে।
              </p>

              <BonusHistory type="Royalty Bonus" data={bonusHistory} />
            </>
          )}

          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>
            Close
          </button>
        </Modal>
      )}

      {treeOpen && (
        <Modal onClose={() => setTreeOpen(false)}>
          <h2>🌳 7 Level Tree View</h2>
          <p>Your full 7 level network structure will show here.</p>
          <div style={styles.treeBox}>
            Level 1 → Level 2 → Level 3 → Level 4 → Level 5 → Level 6 → Level 7
          </div>
          <button style={styles.closeBtn} onClick={() => setTreeOpen(false)}>
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}

function BonusHistory({ type, data }) {
  const rows = (data || []).filter(
    (x) => x.type === type || x.bonusType === type
  );

  return (
    <div style={{ marginTop: 18 }}>
      <h3>Bonus History</h3>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.modalTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Level</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="4">No bonus history</td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.fromName || r.name || "User"}</td>
                  <td>{r.date ? new Date(r.date).toLocaleString("en-IN") : "N/A"}</td>
                  <td>{r.level || 0}</td>
                  <td>₹{Number(r.amount || 0).toLocaleString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
  page: {
    minHeight: "100vh",
    padding: "28px 30px 45px",
    background:
      "radial-gradient(circle at top left,#f6edff,transparent 35%),radial-gradient(circle at top right,#ffeaf7,transparent 35%),#fbf8ff",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#10183a",
    position: "relative"
  },

  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#fbf8ff"
  },

  loader: {
    width: 46,
    height: 46,
    border: "5px solid #ddd",
    borderTop: "5px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  backBtn: {
    position: "absolute",
    left: 24,
    top: 24,
    width: 54,
    height: 54,
    border: 0,
    borderRadius: 16,
    background: "#fff",
    fontSize: 28,
    boxShadow: "0 12px 30px rgba(0,0,0,.08)",
    cursor: "pointer"
  },

  bellBtn: {
    position: "absolute",
    right: 24,
    top: 24,
    width: 54,
    height: 54,
    border: 0,
    borderRadius: 16,
    background: "#fff",
    fontSize: 24,
    boxShadow: "0 12px 30px rgba(0,0,0,.08)",
    cursor: "pointer"
  },

  bellCount: {
    position: "absolute",
    top: -7,
    right: -7,
    background: "#ec4899",
    color: "#fff",
    width: 24,
    height: 24,
    borderRadius: "50%",
    fontSize: 13,
    display: "grid",
    placeItems: "center"
  },

  header: {
    textAlign: "center",
    marginBottom: 28
  },

  welcome: {
    margin: 0,
    fontSize: 22,
    color: "#111827"
  },

  title: {
    margin: "4px 0",
    fontSize: "clamp(44px,7vw,72px)",
    fontWeight: 1000,
    letterSpacing: 2,
    background: "linear-gradient(90deg,#1d7cff,#8b2cff,#ff2e93)",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },

  walletLogo: {
    color: "#7c3aed",
    WebkitTextFillColor: "initial",
    marginRight: 12
  },

  referWorld: {
    margin: 0,
    fontSize: "clamp(30px,4vw,46px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 18
  },

  line: {
    width: 74,
    height: 3,
    borderRadius: 8,
    background: "linear-gradient(90deg,transparent,#b06cff,transparent)"
  },

  tagline: {
    fontSize: 18,
    color: "#58607d"
  },

  heroCard: {
    maxWidth: 1000,
    margin: "0 auto 22px",
    padding: 38,
    borderRadius: 36,
    background: "linear-gradient(135deg,#1066f5,#4a20cc,#9a0f86)",
    boxShadow: "0 25px 60px rgba(85,40,200,.28)",
    color: "#fff",
    display: "grid",
    gridTemplateColumns: "1.3fr 1px 1fr",
    gap: 36,
    alignItems: "center"
  },

  heroLeft: {
    display: "flex",
    gap: 28,
    alignItems: "center"
  },

  avatarWrap: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    border: "8px solid rgba(255,255,255,.85)",
    position: "relative",
    flexShrink: 0
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover"
  },

  crown: {
    position: "absolute",
    right: -8,
    bottom: 6,
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#a855f7,#7c3aed)",
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    border: "5px solid #fff"
  },

  userInfo: {
    minWidth: 220
  },

  activePill: {
    display: "inline-flex",
    gap: 10,
    alignItems: "center",
    padding: "11px 18px",
    borderRadius: 12,
    background: "rgba(255,255,255,.17)",
    fontWeight: 800
  },

  dot: {
    width: 13,
    height: 13,
    borderRadius: "50%"
  },

  label: {
    marginBottom: 8,
    opacity: 0.9
  },

  referIdBox: {
    border: "1px dashed rgba(255,255,255,.7)",
    borderRadius: 14,
    padding: "13px 16px",
    background: "linear-gradient(90deg,rgba(255,255,255,.18),rgba(255,255,255,.08))",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 24
  },

  heroLine: {
    height: "100%",
    background: "rgba(255,255,255,.25)"
  },

  heroRight: {
    textAlign: "center"
  },

  walletRound: {
    margin: "0 auto 14px",
    width: 82,
    height: 82,
    borderRadius: "50%",
    background: "rgba(255,255,255,.18)",
    display: "grid",
    placeItems: "center",
    fontSize: 40
  },

  withdrawBtn: {
    padding: "14px 48px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.55)",
    background: "transparent",
    color: "#fff",
    fontWeight: 900,
    fontSize: 18,
    cursor: "pointer"
  },

  linkCard: {
    maxWidth: 1120,
    margin: "0 auto 18px",
    padding: 26,
    background: "#fff",
    borderRadius: 24,
    display: "grid",
    gridTemplateColumns: "90px 1fr 210px",
    gap: 22,
    alignItems: "center",
    boxShadow: "0 20px 45px rgba(25,25,80,.08)"
  },

  linkIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    background: "#f1e8ff",
    display: "grid",
    placeItems: "center",
    fontSize: 42
  },

  copyBox: {
    display: "flex",
    gap: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 10,
    alignItems: "center"
  },

  copyLinkBtn: {
    padding: "12px 22px",
    border: 0,
    borderRadius: 12,
    background: "linear-gradient(90deg,#6d28d9,#ec4899)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  shareBox: {
    borderLeft: "1px solid #e5e7eb",
    paddingLeft: 24,
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap"
  },

  whatsapp: {
    width: 54,
    height: 54,
    border: 0,
    borderRadius: "50%",
    background: "#22c55e",
    fontSize: 24,
    cursor: "pointer"
  },

  telegram: {
    width: 54,
    height: 54,
    border: 0,
    borderRadius: "50%",
    background: "#0ea5e9",
    fontSize: 24,
    cursor: "pointer"
  },

  bonusGrid: {
    maxWidth: 1120,
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 20
  },

  bonusCard: {
    padding: 26,
    borderRadius: 24,
    textAlign: "center",
    boxShadow: "0 18px 40px rgba(0,0,0,.07)",
    minHeight: 240
  },

  bonusIcon: {
    width: 72,
    height: 72,
    margin: "0 auto 18px",
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    fontSize: 34,
    color: "#fff",
    boxShadow: "0 12px 28px rgba(0,0,0,.18)"
  },

  detailBtn: {
    padding: "11px 28px",
    borderRadius: 12,
    background: "#fff",
    border: "1px solid",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap"
  },

  historyCard: {
    maxWidth: 1120,
    margin: "0 auto 22px",
    padding: 28,
    borderRadius: 24,
    background: "#fff",
    boxShadow: "0 20px 45px rgba(25,25,80,.08)"
  },

  historyTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center"
  },

  filterSelect: {
    padding: "13px 20px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    fontWeight: 800
  },

  tableWrap: {
    overflowX: "auto",
    marginTop: 18
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  modalTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 10
  },

  statusPill: {
    padding: "9px 20px",
    borderRadius: 999,
    fontWeight: 900
  },

  empty: {
    textAlign: "center",
    padding: 25
  },

  viewMoreBtn: {
    display: "block",
    margin: "20px auto 0",
    border: 0,
    background: "transparent",
    color: "#4f46e5",
    fontSize: 18,
    fontWeight: 1000,
    cursor: "pointer"
  },

  bottomBanner: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: 28,
    borderRadius: 24,
    background: "linear-gradient(90deg,#fff5ff,#f1e8ff)",
    display: "flex",
    gap: 24,
    alignItems: "center"
  },

  bottomGift: {
    fontSize: 64
  },

  referNowBtn: {
    padding: "18px 46px",
    border: 0,
    borderRadius: 16,
    background: "linear-gradient(90deg,#2563eb,#9333ea)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 1000,
    cursor: "pointer"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.55)",
    backdropFilter: "blur(6px)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 18
  },

  modalBox: {
    width: "min(560px,94vw)",
    maxHeight: "86vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 26,
    padding: 30,
    boxShadow: "0 30px 80px rgba(0,0,0,.28)"
  },

  greenBtn: {
    width: "100%",
    padding: 15,
    border: 0,
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer"
  },

  closeBtn: {
    width: "100%",
    marginTop: 18,
    padding: 15,
    border: 0,
    borderRadius: 14,
    background: "#e5e7eb",
    fontWeight: 900,
    cursor: "pointer"
  },

  dangerText: {
    color: "#ef4444",
    fontWeight: 900
  },

  successText: {
    color: "#16a34a",
    fontWeight: 900
  },

  levelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 10,
    marginTop: 16
  },

  treeBox: {
    padding: 20,
    borderRadius: 18,
    background: "#f1f5f9",
    fontWeight: 900
  }
};