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
  const [treeOpen, setTreeOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [referBonus,setReferBonus] = useState({});
  const [performanceFilter, setPerformanceFilter] = useState("thisMonth");

const filteredPerformanceHistory = (
  performance.history || []
).filter((item) => {

  const d = new Date(item.date);
  const now = new Date();

  if (performanceFilter === "thisMonth") {
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (performanceFilter === "lastMonth") {

    const last = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    return (
      d.getMonth() === last.getMonth() &&
      d.getFullYear() === last.getFullYear()
    );
  }

  return true;
});

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

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const referCode =
    user.referCode || user.referralCode || user.walletId || "SMREF0001";

  const referLink = `${window.location.origin}/register?ref=${referCode}`;

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied Successfully");
    } catch {
      toast.info("Copy failed");
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

  const visibleHistory =
    statusFilter === "All"
      ? safeHistory
      : safeHistory.filter((x) => x.status === statusFilter);

  const finalHistory = showAllHistory
    ? visibleHistory
    : visibleHistory.slice(0, 3);

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
key:"refer",
title:"Refer Bonus",
amount: referBonus.balance || user.referIncome || 0,

icon:"🎁",

color:"#16a34a",

bg:"#ecfdf5"
},
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
      <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>

      <button style={styles.bellBtn} onClick={() => navigate("/notifications")}>
        🔔
      </button>

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
          <h1>{money(user.referralIncome || user.referWallet || 0)}</h1>
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
        <div style={styles.historyTop}>
          <div>
            <h2>🕘 Refer History</h2>
            <p>Only your direct referred users will show here.</p>
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
                  <td colSpan="5" style={styles.emptyTd}>No refer history found</td>
                </tr>
              ) : (
                finalHistory.map((x, i) => (
                  <tr key={i}>
                    <td>
                      <b>{x.name}</b>
                      <br />
                      <small>{x.mobile || x.email}</small>
                    </td>
                    <td>{x.referId || "N/A"}</td>
                    <td>{x.joinDate ? new Date(x.joinDate).toLocaleString("en-IN") : "N/A"}</td>
                    <td>
                      <span
                        style={{
                          ...styles.statusPill,
                          background: x.status === "Active" ? "#dcfce7" : "#ffe4e6",
                          color: x.status === "Active" ? "#16a34a" : "#e11d48"
                        }}
                      >
                        {x.status}
                      </span>
                    </td>
                    <td>{money(x.earning || 0)}</td>
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
            {showAllHistory ? "Show Less ⌃" : "View More ⌄"}
          </button>
        )}
      </section>

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

      
&&

!performance.enabled

&& (

<p style={styles.dangerText}>You did not complete your task.

Please contact your upline.

</p>)

}

{

performance.enabled

&& (

<>

<p>This Month Bonus

</p><h3>{

money(

performance.thisMonthBonus

)

}

</h3><p>Last Month Bonus

</p><h3>{

money(

performance.lastMonthBonus

)

}

</h3><div
style={{marginTop:20

}}

«»

<select

value={

performance.selectedMonth ||

"thisMonth"

}

onChange={e=>{

setPerformance(

prev=>({

...prev,

selectedMonth:

e.target.value

})

);

}}

style={styles.filterSelect}



        {bonusModal === "performance" && (

<Modal onClose={() => setBonusModal(null)}>

<h2>📈 Performance Bonus</h2>

<h1>{money(performance.balance)}</h1>

<p>

Status :

<b
style={{
color:
performance.enabled
?
"#16a34a"
:
"#ef4444"
}}
>

{performance.enabled
?
"Active"
:
"Inactive"}

</b>

</p>

{
!performance.enabled
&&
!performance.adminOverride
&&
!performance.expired
&&(

<div style={styles.infoBox}>

<h3>Task Progress</h3>

<p>

Completed :

<b>

{performance.directActiveCount}

</b>

/10

</p>

<p>

Remaining :

<b>

{performance.remaining}

</b>

</p>

<p>

Days Left :

<b>

{performance.daysLeft}

</b>

Days

</p>

</div>

)
}

{
performance.expired
&&
!performance.enabled
&&(

<p style={styles.dangerText}>

You did not complete your task.

Please contact your upline.

</p>

)
}

{
performance.enabled
&&(

<>

<p>

This Month Bonus

</p>

<h3>

{money(performance.thisMonthBonus)}

</h3>

<p>

Last Month Bonus

</p>

<h3>

{money(performance.lastMonthBonus)}

</h3>

<select

value={performanceFilter}

onChange={(e)=>

setPerformanceFilter(
e.target.value
)

}

style={styles.filterSelect}

>

<option value="thisMonth">

This Month

</option>

<option value="lastMonth">

Last Month

</option>

<option value="all">

All

</option>

</select>

<div style={{marginTop:20}}>

<h3>

Performance History

</h3>

{

filteredPerformanceHistory.length===0

?

<p>No History</p>

:

filteredPerformanceHistory.map((item,index)=>(

<div
key={index}
style={styles.historyItem}
>

<b>

{item.fromName}

</b>

<p>

Bonus :

{money(item.amount)}

</p>

<p>

Date :

{

new Date(item.date)

.toLocaleDateString("en-IN")

}

</p>

</div>

))

}

</div>

</>

)

}

<button

style={styles.closeBtn}

onClick={()=>setBonusModal(null)}

>

Close

</button>

</Modal>

)}

      {bonusModal === "team" && (
        <Modal onClose={() => setBonusModal(null)}>
          <h2>👥 Team Bonus</h2>
          <p style={styles.successText}>
            Congratulations! Your Team Bonus is Active and Growing.
          </p>

          <h1>{money(team.balance)}</h1>
          <p>This Month Bonus: <b>{money(team.thisMonthBonus)}</b></p>
          <p>Last Month Bonus: <b>{money(team.lastMonthBonus)}</b></p>

          <div style={styles.levelGrid}>
            <div>Level 1 Members: <b>{team.level1Count || 0}</b><br />Income: {money(team.level1Income)}</div>
            <div>Level 2 Members: <b>{team.level2Count || 0}</b><br />Income: {money(team.level2Income)}</div>
            <div>Level 3 Members: <b>{team.level3Count || 0}</b><br />Income: {money(team.level3Income)}</div>
          </div>

          <BonusHistory type="team" data={bonusHistory} />
          <button style={styles.closeBtn} onClick={() => setBonusModal(null)}>Close</button>
        </Modal>
      )}

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

      {
bonusModal==="refer" && (

<Modal
onClose={()=>
setBonusModal(null)
}
>

<h2>

🎁 Refer Bonus

</h2>


<h1>

{
money(
referBonus.balance
)
}

</h1>



<p>

Status :

<b>

{
user.activeStatus==="Active"

?

"Active"

:

"Inactive"

}

</b>

</p>



<p>

Total Bonus :

<b>

{
money(

referBonus.totalBonus

)

}

</b>

</p>



<p>

Eligible Refers :

<b>

{
referBonus.count||0
}

</b>

</p>



<div
style={styles.infoBox}
>

<p>

1 Year Investment = ₹499

</p>


<p>

3 Year Investment = ₹599

</p>


<p>

5 Year Investment = ₹699

</p>


<p>

10 Year Investment = ₹799

</p>

</div>



<h3>

Refer List

</h3>



<table
style={styles.table}
>

<thead>

<tr>

<th>Name</th>

<th>Status</th>

<th>First Invest</th>

<th>Bonus</th>

</tr>

</thead>



<tbody>

{

(referBonus.list||[])

.map(

(item,i)=>(


<tr key={i}>


<td>

{item.name}

</td>



<td>

{item.status}

</td>



<td>

{

item.firstInvestment

?

"✅ Yes"

:

"❌ No"

}

</td>



<td>

₹{

item.bonus||0

}

</td>


</tr>


)

)

}


</tbody>

</table>



<button

style={styles.closeBtn}

onClick={()=>

setBonusModal(null)

}

>

Close

</button>

</Modal>

)

}
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
                <th>Name</th>
                <th>Date</th>
                <th>Level</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((x, i) => (
                <tr key={i}>
                  <td>{x.fromName || x.fromEmail || "User"}</td>
                  <td>{x.date ? new Date(x.date).toLocaleString("en-IN") : "N/A"}</td>
                  <td>{x.level || "-"}</td>
                  <td>₹ {Number(x.amount || 0).toLocaleString("en-IN")}</td>
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
  historyItem:{

padding:15,

marginTop:10,

background:"#f8fafc",

borderRadius:12,

border:"1px solid #e5e7eb"

},

dangerText:{

color:"#dc2626",

fontWeight:"bold",

marginTop:20

},
  successText: {
    color: "#16a34a",
    fontWeight: 900
  }
};
