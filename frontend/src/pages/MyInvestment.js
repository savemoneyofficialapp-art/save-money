import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function MyInvestment() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/my-investments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data?.success) {
        setInvestments(Array.isArray(data.investments) ? data.investments : []);
      } else {
        setInvestments([]);
      }
    } catch (err) {
      console.log("MY INVESTMENT ERROR:", err);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  const money = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN")}.00`;
  };

  const date = (d) => {
    if (!d) return "N/A";

    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const summary = useMemo(() => {
    const totalInvestment = investments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalReturn = investments.reduce(
      (sum, item) => sum + Number(item.totalReturn || 0),
      0
    );

    const activeInvestments = investments.filter(
      (item) => String(item.status || "").toLowerCase() === "active"
    ).length;

    const averageReturnRate =
      investments.length > 0
        ? investments.reduce(
            (sum, item) => sum + Number(item.returnRate || item.interestRate || 0),
            0
          ) / investments.length
        : 0;

    return {
      totalInvestment,
      totalReturn,
      activeInvestments,
      averageReturnRate
    };
  }, [investments]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      alert("Investment ID copied");
    } catch {
      alert("Copy failed");
    }
  };

  const viewDetails = (inv) => {
    alert(
      `Plan: ${inv.planName || inv.plan || "Investment"}\nAmount: ${money(
        inv.amount
      )}\nStatus: ${inv.status || "Active"}`
    );
  };

  const certificate = (inv) => {
    alert("Investment Certificate feature coming soon");
  };

  const downloadStatement = (inv) => {
    alert("Download Statement feature coming soon");
  };

  const renewNow = (inv) => {
    alert("Renew request submitted / coming soon");
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingBox}>
          <h2>Loading My Investment...</h2>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>

        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/home")}>
            ←
          </button>

          <div style={styles.headerTitle}>
            <h1>My Investment</h1>
            <p>Track, manage & grow your wealth</p>
          </div>

          <div style={styles.rightTop}>
            <div style={styles.secureBadge}>🛡 100% Secure</div>
            <button style={styles.bellBtn} onClick={() => navigate("/notifications")}>
              🔔
              <span>3</span>
            </button>
          </div>
        </div>

        {investments.length === 0 ? (
          <EmptyInvestment navigate={navigate} />
        ) : (
          <>
            <SummaryHero summary={summary} money={money} />

            {investments.map((inv, index) => (
              <InvestmentCard
                key={inv._id || inv.investmentId || index}
                inv={inv}
                money={money}
                date={date}
                copyId={copyId}
                viewDetails={viewDetails}
                certificate={certificate}
                downloadStatement={downloadStatement}
                renewNow={renewNow}
              />
            ))}

            <BottomBanner />
          </>
        )}

      </div>
    </div>
  );
}
function EmptyInvestment({ navigate }) {
  return (
    <div style={styles.emptyBox}>
      <div style={styles.emptyIcon}>📭</div>
      <h1>No any investment start</h1>
      <p>You have not started any investment yet.</p>

      <button style={styles.emptyBtn} onClick={() => navigate("/invest-now")}>
        Start Investment
      </button>
    </div>
  );
}

function SummaryHero({ summary, money }) {
  return (
    <section style={styles.hero}>
      <div style={styles.heroLeft}>
        <HeroItem icon="💼" title="Total Investment" value={money(summary.totalInvestment)} />
        <HeroItem icon="🌱" title="Total Return (All Time)" value={money(summary.totalReturn)} green />
      </div>

      <div style={styles.safeArt}>
        <div style={styles.safeBox}>▣</div>
        <div style={styles.coin1}>₹</div>
        <div style={styles.coin2}>₹</div>
        <div style={styles.shield}>✓</div>
      </div>

      <div style={styles.heroRight}>
        <HeroItem icon="📊" title="Average Return Rate" value={`${summary.averageReturnRate.toFixed(2)}%`} green />
        <HeroItem icon="💼" title="Active Investments" value={summary.activeInvestments} />
      </div>

      <div style={styles.heroBottom}>
        🚀 Invest Today, <b>Secure Tomorrow</b>, Enjoy Freedom Forever.
      </div>
    </section>
  );
}

function HeroItem({ icon, title, value, green }) {
  return (
    <div style={styles.heroItem}>
      <span>{icon}</span>
      <div>
        <p>{title}</p>
        <h2 style={{ color: green ? "#20e58d" : "white" }}>{value}</h2>
      </div>
    </div>
  );
}

function InvestmentCard({
  inv,
  money,
  date,
  copyId,
  viewDetails,
  certificate,
  downloadStatement,
  renewNow
}) {
  const isSave =
    String(inv.planType || inv.type || inv.planName || "")
      .toLowerCase()
      .includes("save");

  const theme = isSave
    ? {
        color: "#16c784",
        soft: "#effdf6",
        title: inv.planName || "Save Money",
        sub: inv.planSub || "SIP Invest Plan",
        icon: "plant"
      }
    : {
        color: "#0969ff",
        soft: "#f1f6ff",
        title: inv.planName || "One Time Investment",
        sub: inv.planSub || "Upgrade Money",
        icon: "rocket"
      };

  const investmentId =
    inv.investmentId || inv._id || `${isSave ? "SM" : "OT"}000000`;

  const amount = inv.amount || inv.totalAmount || inv.investAmount || 0;
  const monthlyReturn = inv.monthlyReturn || inv.monthlyEmi || inv.emi || 0;
  const years = inv.years || inv.tenure || inv.duration || 0;
  const returnRate = inv.returnRate || inv.interestRate || inv.rate || 0;
  const status = inv.status || "Active";
  const totalReturn = inv.totalReturn || inv.returnAmount || 0;
  const maturityAmount = inv.maturityAmount || Number(amount) + Number(totalReturn);
  const progress = inv.progress || 0;

  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.planLogo}>
          {theme.icon === "plant" ? <PlantIcon /> : <RocketIcon />}
        </div>

        <div style={styles.planTitleArea}>
          <h2 style={{ color: theme.color }}>
            {theme.title} <span>({theme.sub})</span>
          </h2>

          <div style={{ ...styles.activeBadge, color: theme.color, borderColor: theme.color }}>
            ✅ Active Investment
          </div>
        </div>

        <button style={styles.idBox} onClick={() => copyId(investmentId)}>
          <p>Investment ID</p>
          <b>{String(investmentId).slice(0, 14)}</b>
          <span>📋 ›</span>
        </button>
      </div>

      <div style={styles.detailsGrid}>
        <Info icon="💰" title="Amount" value={money(amount)} color={theme.color} />
        <Info icon="📅" title={isSave ? "EMI / Monthly Return" : "Monthly Return"} value={money(monthlyReturn)} color={theme.color} />
        <Info icon="⌛" title="Years / Tenure" value={`${years} Years`} color={theme.color} />

        <Info icon="🗓" title="Start Date" value={date(inv.startDate || inv.createdAt)} color="#8b5cf6" />
        <Info icon="📅" title="End Date" value={date(inv.endDate || inv.maturityDate)} color="#ec4899" />
        <Info icon="🔄" title="Renew Date" value={date(inv.renewDate || inv.endDate || inv.maturityDate)} color="#f59e0b" />

        <Info icon="%" title="Return Rate" value={`${returnRate}%`} color={theme.color} />
        <Info icon="🛡" title="Status" value={status} color={theme.color} />
        <Info icon="💵" title="Total Return" value={money(totalReturn)} color={theme.color} />
      </div>

      <div style={{ ...styles.progressBox, background: theme.soft }}>
        <div style={styles.progressTop}>
          <span style={{ color: theme.color }}>📈 Your Investment is Growing Steadily</span>
          <b style={{ background: theme.color }}>{progress}%</b>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress}%`, background: theme.color }} />
        </div>

        <div style={styles.maturityBox}>
          <p>Expected Maturity Amount</p>
          <h2 style={{ color: theme.color }}>{money(maturityAmount)}</h2>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={() => viewDetails(inv)}>👁 View Details</button>
        <button onClick={() => certificate(inv)}>🏅 Investment Certificate</button>
        <button onClick={() => downloadStatement(inv)}>⬇ Download Statement</button>
        <button style={{ background: theme.color, color: "white" }} onClick={() => renewNow(inv)}>
          🔄 Renew Now
        </button>
      </div>
    </section>
  );
}

function Info({ icon, title, value, color }) {
  return (
    <div style={styles.info}>
      <div style={{ ...styles.infoIcon, color }}>{icon}</div>
      <div>
        <p>{title}</p>
        <h3 style={{ color }}>{value}</h3>
      </div>
    </div>
  );
}

function PlantIcon() {
  return (
    <div style={styles.plantIcon}>
      <span style={styles.leafA}></span>
      <span style={styles.leafB}></span>
      <span style={styles.stem}></span>
      <span style={styles.pot}>₹</span>
    </div>
  );
}

function RocketIcon() {
  return (
    <div style={styles.rocketIcon}>
      <span style={styles.rocketBody}></span>
      <span style={styles.rocketWindow}></span>
      <span style={styles.rocketFire}></span>
    </div>
  );
}

function BottomBanner() {
  return (
    <section style={styles.bottomBanner}>
      <div style={styles.trophy}>🏆</div>

      <div style={styles.bottomText}>
        <h2>Great Choice!</h2>
        <p>You are building a secure future for you and your family.</p>
      </div>

      <div style={styles.bottomBenefits}>
        <div>🎯 <b>Disciplined<br />Investing</b></div>
        <div>📊 <b>Better<br />Returns</b></div>
        <div>💎 <b>Financial<br />Freedom</b></div>
      </div>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#050842 0%,#082a93 38%,#dbeafe 100%)",
    padding: "16px",
    fontFamily: "Arial, sans-serif",
    color: "#101a3a"
  },

  wrap: {
    maxWidth: "980px",
    margin: "0 auto"
  },

  loading: {
    minHeight: "100vh",
    background: "#050842",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loadingBox: {
    background: "rgba(255,255,255,.12)",
    padding: "28px",
    borderRadius: "28px",
    textAlign: "center"
  },

  header: {
    height: "78px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    color: "white"
  },

  backBtn: {
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,.45)",
    background: "rgba(255,255,255,.08)",
    color: "white",
    fontSize: "34px",
    cursor: "pointer"
  },

  headerTitle: {
    flex: 1,
    textAlign: "center"
  },

  headerTitle_h1: {
    margin: 0
  },

  rightTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  secureBadge: {
    background: "rgba(255,255,255,.12)",
    borderRadius: "16px",
    padding: "12px 18px",
    fontWeight: "900"
  },

  bellBtn: {
    position: "relative",
    border: "none",
    background: "transparent",
    color: "white",
    fontSize: "28px",
    cursor: "pointer"
  },

  emptyBox: {
    marginTop: "40px",
    background: "white",
    borderRadius: "30px",
    padding: "45px 25px",
    textAlign: "center",
    boxShadow: "0 18px 35px rgba(15,23,42,.18)"
  },

  emptyIcon: {
    fontSize: "80px"
  },

  emptyBtn: {
    marginTop: "18px",
    border: "none",
    borderRadius: "18px",
    padding: "15px 26px",
    background: "linear-gradient(135deg,#16c784,#059669)",
    color: "white",
    fontWeight: "900",
    fontSize: "17px",
    cursor: "pointer"
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg,#2e1065,#4615a8,#1e0b58)",
    borderRadius: "28px",
    padding: "24px",
    minHeight: "225px",
    color: "white",
    display: "grid",
    gridTemplateColumns: "1fr 240px 1fr",
    gap: "12px",
    border: "1px solid rgba(255,255,255,.16)",
    boxShadow: "0 18px 35px rgba(0,0,0,.28)"
  },

  heroLeft: {
    zIndex: 2
  },

  heroRight: {
    zIndex: 2
  },

  heroItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px"
  },

  heroBottom: {
    gridColumn: "1 / 4",
    textAlign: "center",
    borderTop: "1px solid rgba(255,255,255,.15)",
    paddingTop: "14px",
    fontSize: "18px",
    zIndex: 2
  },

  safeArt: {
    position: "relative",
    width: "230px",
    height: "145px",
    margin: "0 auto"
  },

  safeBox: {
    position: "absolute",
    left: "62px",
    top: "5px",
    width: "110px",
    height: "105px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#a855f7,#5b21b6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ddd6fe",
    fontSize: "60px",
    boxShadow: "inset -12px -12px 0 rgba(0,0,0,.18),0 16px 22px rgba(0,0,0,.25)"
  },

  coin1: {
    position: "absolute",
    left: "20px",
    bottom: "18px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fde047,#f59e0b)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    boxShadow: "0 8px 16px rgba(0,0,0,.25)"
  },

  coin2: {
    position: "absolute",
    left: "58px",
    bottom: "4px",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f97316)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  shield: {
    position: "absolute",
    right: "20px",
    bottom: "10px",
    width: "65px",
    height: "78px",
    borderRadius: "26px 26px 35px 35px",
    background: "linear-gradient(135deg,#bbf7d0,#10b981)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px",
    fontWeight: "900",
    border: "5px solid #dcfce7",
    boxShadow: "0 10px 20px rgba(0,0,0,.22)"
  },

  card: {
    background: "linear-gradient(180deg,#ffffff,#f8fbff)",
    borderRadius: "28px",
    padding: "24px",
    marginTop: "14px",
    boxShadow: "0 15px 32px rgba(15,23,42,.14)",
    border: "1px solid rgba(255,255,255,.85)"
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "18px"
  },

  planLogo: {
    width: "98px",
    height: "98px",
    borderRadius: "50%",
    background: "radial-gradient(circle,#ffffff,#eefdf6)",
    boxShadow: "0 10px 24px rgba(0,0,0,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  planTitleArea: {
    flex: 1
  },

  activeBadge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "8px 14px",
    borderRadius: "12px",
    border: "1px solid",
    fontWeight: "900",
    background: "#f8fffb"
  },

  idBox: {
    width: "245px",
    minHeight: "68px",
    border: "1px solid #dbe3ef",
    borderRadius: "16px",
    background: "#f9fbff",
    textAlign: "left",
    padding: "12px 14px",
    cursor: "pointer",
    position: "relative"
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    border: "1px solid #e5eaf3",
    borderRadius: "20px",
    overflow: "hidden",
    background: "#ffffff"
  },

  info: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "18px",
    borderRight: "1px solid #e5eaf3",
    borderBottom: "1px solid #e5eaf3"
  },

  infoIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  progressBox: {
    marginTop: "14px",
    borderRadius: "16px",
    padding: "14px"
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "900"
  },

  progressTrack: {
    marginTop: "10px",
    height: "10px",
    borderRadius: "20px",
    background: "#dbeafe",
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    borderRadius: "20px"
  },

  maturityBox: {
    textAlign: "right",
    marginTop: "8px"
  },

  actions: {
    marginTop: "14px",
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr 1.4fr 1fr",
    gap: "8px"
  },

  bottomBanner: {
    marginTop: "14px",
    background: "linear-gradient(135deg,#fff7df,#ffffff)",
    borderRadius: "24px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 12px 28px rgba(15,23,42,.10)"
  },

  trophy: {
    fontSize: "74px"
  },

  bottomText: {
    flex: 1
  },

  bottomBenefits: {
    display: "flex",
    gap: "26px"
  },

  plantIcon: {
    position: "relative",
    width: "70px",
    height: "70px"
  },

  leafA: {
    position: "absolute",
    width: "32px",
    height: "22px",
    background: "#22c55e",
    borderRadius: "100% 0 100% 0",
    top: "8px",
    left: "10px"
  },

  leafB: {
    position: "absolute",
    width: "34px",
    height: "23px",
    background: "#16a34a",
    borderRadius: "0 100% 0 100%",
    top: "8px",
    right: "8px"
  },

  stem: {
    position: "absolute",
    width: "6px",
    height: "34px",
    background: "#15803d",
    left: "34px",
    top: "24px",
    borderRadius: "10px"
  },

  pot: {
    position: "absolute",
    bottom: "0",
    left: "18px",
    width: "40px",
    height: "26px",
    borderRadius: "0 0 14px 14px",
    background: "#f59e0b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  rocketIcon: {
    position: "relative",
    width: "70px",
    height: "70px"
  },

  rocketBody: {
    position: "absolute",
    width: "30px",
    height: "58px",
    borderRadius: "50% 50% 18px 18px",
    background: "linear-gradient(180deg,#bae6fd,#0284c7)",
    left: "22px",
    top: "0",
    transform: "rotate(28deg)"
  },

  rocketWindow: {
    position: "absolute",
    width: "13px",
    height: "13px",
    borderRadius: "50%",
    background: "#1d4ed8",
    left: "37px",
    top: "19px"
  },

  rocketFire: {
    position: "absolute",
    width: "30px",
    height: "30px",
    background: "linear-gradient(180deg,#facc15,#f97316)",
    borderRadius: "50% 50% 50% 0",
    left: "6px",
    bottom: "5px",
    transform: "rotate(25deg)"
  }
};