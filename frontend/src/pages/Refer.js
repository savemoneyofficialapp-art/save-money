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

const [bonusModal, setBonusModal] = useState(null);
const [treeOpen, setTreeOpen] = useState(false);
const [showAllHistory, setShowAllHistory] = useState(false);
const [statusFilter, setStatusFilter] = useState("All");

const visibleHistory = (statusFilter === "All"
  ? referHistory
  : referHistory.filter(x => x.status === statusFilter)
);

const finalHistory = showAllHistory ? visibleHistory : visibleHistory.slice(0, 3);

const openBonus = (type) => {
  setBonusModal(type);
};

const closeBonus = () => {
  setBonusModal(null);
};

const goInvest = () => {
  window.location.href = "/save-money";
};

  useEffect(() => {
    loadReferData();
  }, []);

  const loadReferData = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/refer-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      setReferHistory(Array.isArray(data.history) ? data.history : []);

      if (data?.success) {
        setUser(data.user || {});
        setHistory(Array.isArray(data.history) ? data.history : []);
      } else {
        setUser({});
        setHistory([]);
      }
    } catch (err) {
      console.log("REFER DATA ERROR:", err);
      setUser({});
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const referCode =
    user.referCode ||
    user.referralCode ||
    user.walletId ||
    "SMREF0001";

  const referLink = `${window.location.origin}/register?ref=${referCode}`;

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied Successfully");
    } catch {
      alert("Copy failed");
    }
  };

 const shareWhatsapp = () => {
  const text = `Join SAVE MONEY using my refer link: ${referLink}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
};

const shareTelegram = () => {
  const text = `Join SAVE MONEY using my refer link: ${referLink}`;
  window.open(`https://t.me/share/url?url=${encodeURIComponent(referLink)}&text=${encodeURIComponent(text)}`, "_blank");
};

  const bonusCards = [
    {
      key: "performance",
      title: "Performance Bonus",
      amount: user.performanceBonus || user.performanceIncome || 0,
      icon: "📈",
      color: "#c026d3",
      bg: "#fff0ff"
    },
    {
      key: "team",
      title: "Team Bonus",
      amount: user.teamBonus || user.teamIncome || 0,
      icon: "👥",
      color: "#2563eb",
      bg: "#eff6ff"
    },
    {
      key: "royalty",
      title: "Royalty Bonus",
      amount: user.royaltyBonus || user.royaltyIncome || 0,
      icon: "👑",
      color: "#f97316",
      bg: "#fff7ed"
    }
  ];

  const demoHistory = [
    {
      name: "Priya Sharma",
      mobile: "+91 98765 43210",
      referId: "REF445566",
      date: "20 May 2024",
      time: "10:30 AM",
      package: "Silver",
      status: "Active",
      earning: 520
    },
    {
      name: "Amit Verma",
      mobile: "+91 91234 56789",
      referId: "REF445567",
      date: "19 May 2024",
      time: "09:20 AM",
      package: "Gold",
      status: "Active",
      earning: 780
    },
    {
      name: "Vikash Singh",
      mobile: "+91 93456 78901",
      referId: "REF445569",
      date: "17 May 2024",
      time: "12:40 PM",
      package: "Bronze",
      status: "Inactive",
      earning: 0
    }
  ];

  const finalHistory = referHistory;

 

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
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ←
      </button>

      <button
  style={styles.bellBtn}
  onClick={() => (window.location.href = "/notifications")}
>
  🔔
  <span style={styles.bellCount}></span>
</button>

      <div style={styles.bgGift}>🎁</div>
      <div style={styles.bgPeople}>👥</div>

      <header style={styles.header}>
        <p style={styles.welcome}>Welcome to</p>

        <h1 style={styles.mainTitle}>
  <span style={styles.walletLogo}>🎁</span>
     SAVE MONEY
</h1>

<h2 style={styles.referWorld}>
  <span style={styles.titleLine}></span>
  Refer World
  <span style={styles.titleLine}></span>
</h2>

        <p style={styles.tagline}>
          Refer More, Earn More, Grow Together!
        </p>
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
                "https://i.pravatar.cc/160?img=12"
              }
              alt="user"
            />
            <div style={styles.crown}>♛</div>
          </div>

          <div style={styles.userInfo}>
            <h2>{user.name || "Save Money User"}</h2>

<span style={styles.activeMember}>
  <span
  style={{
    ...styles.greenDot,
background:
  String(user?.status || "Active").toLowerCase() === "active"
    ? "#22c55e"
    : "#ef4444"  }}
></span>
  Active Member
</span>
            <p style={styles.smallText}>Refer ID</p>

            <div style={styles.referIdBox}>
              <span>{referCode}</span>

              <button onClick={() => copyText(referCode)}>🗊</button>
            </div>
          </div>
        </div>

        <div style={styles.heroLine}></div>

        <div style={styles.heroRight}>
          <div style={styles.walletRound}>💸</div>

          <p>Refer Wallet Balance</p>

          <h1>{money(user.referWallet || user.referralIncome || 0)}</h1>

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

          <button style={styles.whatsapp} onClick={shareWhatsapp}>
            🌍
          </button>

          <button style={styles.telegram} onClick={shareTelegram}>
            ⌲
          </button>
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
              onClick={() => setBonusModal(b)}
            >
              View Details
            </button>
          </div>
        ))}

        <div style={{ ...styles.bonusCard, background: "#ecfdf5" }}>
          <div style={{ ...styles.bonusIcon, background: "#10b981" }}>
            🌳
          </div>

          <h3>Tree View</h3>
          <p style={styles.treeText}>View your whole team structure</p>

          <button
            style={{ ...styles.detailBtn, color: "#10b981" }}
            onClick={() => setTreeOpen(true)}
          >
            View Tree
          </button>
        </div>
      </section>

<div style={styles.historyCard}>
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
      {finalHistory.map((x, i) => (
        <tr key={i}>
          <td>
            <b>{x.name}</b>
            <br />
            <small>{x.mobile || x.email}</small>
          </td>
          <td>{x.referId || "N/A"}</td>
          <td>{x.joinDate ? new Date(x.joinDate).toLocaleString("en-IN") : "N/A"}</td>
          <td>
            <span style={{
              ...styles.statusPill,
              background: x.status === "Active" ? "#dcfce7" : "#ffe4e6",
              color: x.status === "Active" ? "#16a34a" : "#e11d48"
            }}>
              {x.status}
            </span>
          </td>
          <td>₹ {Number(x.earning || 0).toLocaleString("en-IN")}</td>
        </tr>
      ))}
    </tbody>
  </table>

  {visibleHistory.length > 3 && (
    <button style={styles.viewMoreBtn} onClick={() => setShowAllHistory(!showAllHistory)}>
      {showAllHistory ? "Show Less⌃" : "View More⌄"}
    </button>
  )}
</div>     

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

     {bonusModal && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalBox}>
      {bonusModal === "performance" && (
        <>
          <h2>📈 Performance Bonus</h2>
          <h1>₹ {Number(performance?.balance || 0).toLocaleString("en-IN")}</h1>

          <p>
            Status: <b>{performance?.enabled ? "Active" : "Inactive"}</b>
          </p>

          {!performance?.completed && !performance?.expired && (
            <>
              <p>
                Your Active Refer: <b>{performance?.directActiveCount || 0}</b> / 10
              </p>
              <p>
                Remaining: <b>{performance?.remaining || 0}</b>
              </p>
              <button style={styles.greenBtn} onClick={goInvest}>
                Go to Save Money Invest
              </button>
            </>
          )}

          {performance?.expired && (
            <p style={{ color: "#ef4444", fontWeight: 900 }}>
              তুমি task complete করতে পারোনি। Please upline এর সঙ্গে contact করো।
            </p>
          )}

          {performance?.completed && (
            <p style={{ color: "#16a34a", fontWeight: 900 }}>
              তুমি task complete করেছো। এখন থেকে তুমি Performance Bonus পাবে।
            </p>
          )}

          <BonusHistory type="performance" data={bonusHistory} />
        </>
      )}

      {bonusModal === "team" && (
        <>
          <h2>👥 Team Bonus</h2>
          <p style={{ color: "#16a34a", fontWeight: 900 }}>
            Your team network is growing. You will earn bonus from 3 levels.
          </p>

          <h1>₹ {Number(team?.balance || 0).toLocaleString("en-IN")}</h1>

          <div style={styles.levelGrid}>
            <div>Level 1: ₹70</div>
            <div>Level 2: ₹50</div>
            <div>Level 3: ₹35</div>
          </div>

          <BonusHistory type="team" data={bonusHistory} />
        </>
      )}

      {bonusModal === "royalty" && (
        <>
          <h2>👑 Royalty Bonus</h2>
          <h1>₹ {Number(royalty?.balance || 0).toLocaleString("en-IN")}</h1>

          <p>
            Direct Refer: <b>{royalty?.directCount || 0}</b> / 50
          </p>

          <p>
            Remaining: <b>{royalty?.remaining || 0}</b>
          </p>

          <p>
            Status: <b>{royalty?.enabled ? "Active" : "Inactive"}</b>
          </p>

          <p>
            Royalty active হলে next business থেকে 3% bonus পাবেন।
          </p>

          <BonusHistory type="royalty" data={bonusHistory} />
        </>
      )}

      <button style={styles.closeBtn} onClick={closeBonus}>Close</button>
    </div>
  </div>
)}

{treeOpen && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalBox}>
      <h2>🌳 7 Level Tree View</h2>
      <p>Your full 7 level network structure will show here.</p>

      <div style={styles.treeBox}>
        Level 1 → Level 2 → Level 3 → Level 4 → Level 5 → Level 6 → Level 7
      </div>

      <button style={styles.closeBtn} onClick={() => setTreeOpen(false)}>Close</button>
    </div>
  </div>
)}
    </div>
  );
}

function BonusHistory({ type, data }) {
  const rows = (data || []).filter(x => x.bonusType === type);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Bonus History</h3>

      {rows.length === 0 ? (
        <p>No history found</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Level</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={i}>
                <td>{x.fromName || x.fromEmail}</td>
                <td>{new Date(x.date).toLocaleString("en-IN")}</td>
                <td>{x.level || "-"}</td>
                <td>₹{Number(x.amount || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

  loadingIcon: {
    fontSize: 70
  },

  page: {
    minHeight: "100vh",
    padding: "28px",
    background:
      "radial-gradient(circle at top left,#fff0ff,transparent 28%),radial-gradient(circle at top right,#ffe8f5,transparent 30%),linear-gradient(135deg,#fffaff,#f8f3ff,#ffffff)",
    fontFamily: "Arial, sans-serif",
    color: "#111542",
    position: "relative",
    overflowX: "hidden"
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
    fontWeight: 900,
    cursor: "pointer",
    zIndex: 5
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
    cursor: "pointer",
    zIndex: 5
  },

  bellCount: {
    position: "absolute",
    top: 4,
    right: 5,
    background: "#f03092",
    color: "white",
    borderRadius: 99,
    padding: "3px 8px",
    fontSize: 13,
    fontWeight: 900
  },

  bgGift: {
    position: "absolute",
    left: 45,
    top: 150,
    fontSize: 72,
    opacity: 0.35
  },

  bgPeople: {
    position: "absolute",
    right: 70,
    top: 145,
    fontSize: 80,
    opacity: 0.25
  },

  header: {
    textAlign: "center",
    marginTop: 8
  },

  welcome: {
    margin: 0,
    fontSize: 22,
    fontWeight: 500
  },

  mainTitle: {
    margin: "2px 0 0",
    fontSize: 62,
    fontWeight: 900,
    letterSpacing: 1,
    background: "linear-gradient(90deg,#1463ff,#8b20ff,#ff1685)",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },

  referWorld: {
  margin: "-5px 0 0",
  fontSize: 38,
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 18
},

walletLogo: {
  display: "inline-block",
  fontSize: 58,
  marginRight: 16,
  verticalAlign: "middle",
  filter: "drop-shadow(0 10px 18px rgba(124,58,237,.3))"
},

  tagline: {
    color: "#62678c",
    fontSize: 18,
    marginTop: 10
  },

  heroCard: {
    width: "min(1050px, 94vw)",
    margin: "30px auto 18px",
    padding: 44,
    borderRadius: 34,
    background: "linear-gradient(135deg,#3a19d6 0%,#6b08d8 45%,#b616a1 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 30,
    boxShadow: "0 30px 55px rgba(102,38,190,.35)"
  },

  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: 28
  },

  avatarWrap: {
    position: "relative"
  },

  avatar: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    border: "8px solid white",
    objectFit: "cover"
  },

  crown: {
    position: "absolute",
    right: -4,
    bottom: 12,
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#e11dff,#9f18ff)",
    display: "grid",
    placeItems: "center",
    fontSize: 26,
    border: "4px solid white"
  },

  userInfo: {
    minWidth: 250
  },

  activeMember: {
    display: "inline-block",
    margin: "12px 0",
    padding: "10px 18px",
    borderRadius: 12,
    background: "rgba(255,255,255,.16)",
    fontWeight: 700
  },

  smallText: {
    margin: "8px 0",
    opacity: 0.9
  },

 referIdBox: {
  border: "1px dashed rgba(255,255,255,.85)",
  borderRadius: 14,
  padding: "12px 16px",
  fontSize: 22,
  fontWeight: 900,
  display: "flex",
  gap: 18,
  alignItems: "center",
  justifyContent: "space-between",
  background: "linear-gradient(90deg,#ffffff33,#ffffff18)",
  color: "#fff",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)"
},

copyLinkBtn: {
  border: "none",
  borderRadius: 12,
  padding: "12px 22px",
  background: "linear-gradient(90deg,#7c3aed,#d946ef)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap"
},

  copySmall: {},

  heroLine: {
    height: 145,
    width: 1,
    background: "rgba(255,255,255,.25)"
  },

  heroRight: {
    minWidth: 310
  },

  walletRound: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    background: "rgba(255,255,255,.18)",
    display: "grid",
    placeItems: "center",
    fontSize: 38
  },

  balance: {},

 

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

  linkMiddle: {
    flex: 1
  },

  copyBox: {
    border: "1px solid #ddd9ec",
    borderRadius: 14,
    padding: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
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
  fontSize: 30,
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
  minHeight: 45,
  lineHeight: "18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap"
},

  treeText: {
    minHeight: 58,
    color: "#5d6280"
  },

  historyCard: {
    width: "min(1120px, 94vw)",
    margin: "26px auto",
    background: "white",
    borderRadius: 26,
    padding: 28,
    boxShadow: "0 16px 36px rgba(156,105,255,.16)"
  },

  historyHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  select: {
    padding: "13px 18px",
    borderRadius: 14,
    border: "1px solid #ddd"
  },

  tableWrap: {
    overflowX: "auto",
    marginTop: 22
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 800
  },

  th: {
    background: "#f5efff",
    padding: "14px 12px",
    color: "#3d426a",
    textAlign: "left"
  },

  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #eee"
  },

  userCell: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },

  smallAvatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover"
  },

  mobileText: {
    display: "block",
    color: "#707695",
    marginTop: 4
  },

  active: {
    background: "#dcfce7",
    color: "#16a34a",
    padding: "8px 17px",
    borderRadius: 20,
    fontWeight: 900
  },

  inactive: {
    background: "#ffe4ec",
    color: "#ef3971",
    padding: "8px 17px",
    borderRadius: 20,
    fontWeight: 900
  },

  viewMore: {
    display: "block",
    margin: "22px auto 0",
    border: "none",
    background: "white",
    color: "#7b20e8",
    fontSize: 18,
    fontWeight: 900
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

  bottomGift: {
    fontSize: 70
  },

  referNowBtn: {
    border: "none",
    borderRadius: 16,
    padding: "18px 48px",
    color: "white",
    background: "linear-gradient(90deg,#7b20ff,#c515e9)",
    fontSize: 20,
    fontWeight: 900
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
  width: "min(720px, 96vw)",
  maxHeight: "88vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: 28,
  padding: 28,
  boxShadow: "0 30px 90px rgba(0,0,0,.25)"
},


  modalText: {
    fontSize: 16,
    lineHeight: 1.7,
    color: "#555b78"
  },

  modalBtn: {
    width: "100%",
    border: "none",
    borderRadius: 14,
    padding: 15,
    background: "linear-gradient(90deg,#7021ff,#d319cb)",
    color: "white",
    fontWeight: 900,
    fontSize: 16
  },

 treeBox: {
  padding: 22,
  background: "#f1f5f9",
  borderRadius: 18,
  fontWeight: 900
},

  treeNode: {
    display: "inline-block",
    background: "linear-gradient(135deg,#6c20ff,#14b87a)",
    color: "white",
    borderRadius: 14,
    padding: "14px 22px",
    fontWeight: 900,
    margin: 8
  },

  treeLine: {
    width: 3,
    height: 36,
    background: "#9c7cff",
    margin: "0 auto"
  },

  titleLine: {
  width: 70,
  height: 3,
  borderRadius: 10,
  background: "linear-gradient(90deg,#c084fc,#f0abfc)"
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
  fontWeight: 900
},


greenDot: {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#22c55e",
  display: "inline-block",
  marginRight: 8,
  boxShadow: "0 0 10px #22c55e"
},

  treeRow: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap"
  }
};