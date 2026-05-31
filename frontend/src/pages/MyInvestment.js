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
        setInvestments(data.investments || []);
      }
    } catch (err) {
      console.log("MY INVESTMENTS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const demoInvestments = [
    {
      planName: "Save Money",
      planSub: "SIP Invest Plan",
      planType: "save",
      investmentId: "SM20240516001",
      amount: 20000,
      monthlyReturn: 1250,
      years: 5,
      startDate: "2024-05-16",
      endDate: "2029-05-15",
      renewDate: "2029-05-15",
      returnRate: 12,
      status: "Active",
      totalReturn: 7500,
      maturityAmount: 27500,
      progress: 62
    },
    {
      planName: "One Time Investment",
      planSub: "Upgrade Money",
      planType: "one",
      investmentId: "OT20240516002",
      amount: 28500,
      monthlyReturn: 0,
      years: 3,
      startDate: "2024-05-16",
      endDate: "2027-05-15",
      renewDate: "2027-05-15",
      returnRate: 10.5,
      status: "Active",
      totalReturn: 5250,
      maturityAmount: 33750,
      progress: 48
    }
  ];

  const list = investments.length > 0 ? investments : demoInvestments;

  const summary = useMemo(() => {
    const totalInvestment = list.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalReturn = list.reduce(
      (sum, item) => sum + Number(item.totalReturn || 0),
      0
    );

    const activeInvestments = list.filter(
      (item) => String(item.status || "Active").toLowerCase() === "active"
    ).length;

    const averageReturnRate =
      list.length > 0
        ? list.reduce((sum, item) => sum + Number(item.returnRate || 0), 0) /
          list.length
        : 0;

    return {
      totalInvestment,
      totalReturn,
      activeInvestments,
      averageReturnRate
    };
  }, [list]);

  const money = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN")}.00`;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Investment ID copied");
    } catch {
      alert("Copy failed");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingSafe}>
            <PremiumSafe small />
          </div>

          <h2>Loading My Investment</h2>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.app}>

        <header style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/home")}>
            ←
          </button>

          <div style={styles.headerTitle}>
            <h1>My Investment</h1>
            <p>Track, manage & grow your wealth</p>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.secureBadge}>
              <span>🛡</span>
              <b>100% Secure</b>
            </div>

            <button style={styles.bellBtn}>
              🔔
              <span>3</span>
            </button>
          </div>
        </header>

        <section style={styles.heroCard}>
          <HeroLines />

          <div style={styles.heroLeft}>
            <HeroStat
              icon="portfolio"
              title="Total Investment"
              value={money(summary.totalInvestment)}
              color="#ffffff"
            />

            <HeroDivider />

            <HeroStat
              icon="growth"
              title="Total Return (All Time)"
              value={money(summary.totalReturn)}
              color="#20e08a"
            />
          </div>

          <div style={styles.heroCenter}>
            <PremiumSafe />
          </div>

          <div style={styles.heroRight}>
            <HeroStat
              icon="chart"
              title="Average Return Rate"
              value={`${summary.averageReturnRate.toFixed(2)}%`}
              color="#20e08a"
            />

            <HeroDivider />

            <HeroStat
              icon="bag"
              title="Active Investments"
              value={summary.activeInvestments}
              color="#ffffff"
            />
          </div>

          <div style={styles.heroBottom}>
            🚀 Invest Today, <b>Secure Tomorrow</b>, Enjoy Freedom Forever.
          </div>
        </section>

        <main style={styles.investmentList}>
          {list.map((investment, index) => (
            <InvestmentCard
              key={investment.investmentId || index}
              investment={investment}
              money={money}
              formatDate={formatDate}
              copyText={copyText}
            />
          ))}
        </main>

        <section style={styles.bottomChoice}>
          <div style={styles.trophyBox}>
            <PremiumTrophy />
          </div>

          <div style={styles.choiceText}>
            <h2>Great Choice!</h2>
            <p>
              You are building a secure future for you and your family.
            </p>
          </div>

          <div style={styles.choiceBenefits}>
            <Benefit icon="🎯" title="Disciplined" sub="Investing" />
            <Benefit icon="📊" title="Better" sub="Returns" />
            <Benefit icon="💎" title="Financial" sub="Freedom" />
          </div>
        </section>

      </div>
    </div>
  );
}

function InvestmentCard({
  investment,
  money,
  formatDate,
  copyText
}) {
  const isSave = investment.planType === "save";

  const theme = isSave
    ? {
        primary: "#18c57a",
        soft: "#effdf6",
        badge: "#e8fff3",
        progress: "#18c57a"
      }
    : {
        primary: "#1f6fff",
        soft: "#f1f6ff",
        badge: "#edf4ff",
        progress: "#1f6fff"
      };

  return (
    <section style={styles.investmentCard}>
      <div style={styles.cardTop}>

        <div style={styles.cardLeft}>
          <div style={styles.planCircle}>
            {isSave ? (
              <PlantLogo />
            ) : (
              <RocketLogo />
            )}
          </div>

          <div>
            <h2
              style={{
                ...styles.planTitle,
                color: theme.primary
              }}
            >
              {investment.planName}
            </h2>

            <h4
              style={{
                color: theme.primary,
                marginTop: 6
              }}
            >
              ({investment.planSub})
            </h4>

            <div
              style={{
                ...styles.activeBadge,
                borderColor: theme.primary,
                color: theme.primary,
                background: theme.badge
              }}
            >
              ✓ Active Investment
            </div>
          </div>
        </div>

        <div style={styles.idCard}>
          <p>Investment ID</p>

          <div style={styles.idRow}>
            <b>{investment.investmentId}</b>

            <button
              style={styles.copyBtn}
              onClick={() =>
                copyText(investment.investmentId)
              }
            >
              📋
            </button>
          </div>
        </div>
      </div>

      <div style={styles.detailsGrid}>
        <InfoBox
          icon="💰"
          title="Amount"
          value={money(investment.amount)}
          color={theme.primary}
        />

        <InfoBox
          icon="📅"
          title="EMI / Monthly Return"
          value={money(investment.monthlyReturn)}
          color={theme.primary}
        />

        <InfoBox
          icon="⌛"
          title="Years / Tenure"
          value={`${investment.years} Years`}
          color={theme.primary}
        />

        <InfoBox
          icon="📆"
          title="Start Date"
          value={formatDate(
            investment.startDate
          )}
          color="#8b5cf6"
        />

        <InfoBox
          icon="📆"
          title="End Date"
          value={formatDate(
            investment.endDate
          )}
          color="#ff5ca8"
        />

        <InfoBox
          icon="🔄"
          title="Renew Date"
          value={formatDate(
            investment.renewDate
          )}
          color="#f59e0b"
        />

        <InfoBox
          icon="%"
          title="Return Rate"
          value={`${investment.returnRate}%`}
          color={theme.primary}
        />

        <InfoBox
          icon="🛡"
          title="Status"
          value={investment.status}
          color={theme.primary}
        />

        <InfoBox
          icon="💵"
          title="Total Return"
          value={money(
            investment.totalReturn
          )}
          color={theme.primary}
        />
      </div>

      <div style={styles.progressSection}>
        <div style={styles.progressHeader}>
          <span>
            📈 Your Investment is Growing
            Steadily
          </span>

          <div
            style={{
              ...styles.progressPercent,
              background:
                theme.primary
            }}
          >
            {investment.progress}%
          </div>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${investment.progress}%`,
              background:
                theme.progress
            }}
          />
        </div>

        <div style={styles.expectedBox}>
          <div />

          <div>
            <p
              style={{
                color: "#64748b",
                fontSize: 13
              }}
            >
              Expected Maturity Amount
            </p>

            <h2
              style={{
                color: theme.primary
              }}
            >
              {money(
                investment.maturityAmount
              )}
            </h2>
          </div>
        </div>
      </div>

      <div style={styles.actionRow}>
        <button style={styles.actionBtn}>
          👁 View Details
        </button>

        <button style={styles.actionBtn}>
          🏅 Investment Certificate
        </button>

        <button style={styles.actionBtn}>
          ⬇ Download Statement
        </button>

        <button
          style={{
            ...styles.renewBtn,
            background:
              theme.primary
          }}
        >
          🔄 Renew Now
        </button>
      </div>
    </section>
  );
}

function InfoBox({
  icon,
  title,
  value,
  color
}) {
  return (
    <div style={styles.infoBox}>
      <div
        style={{
          ...styles.infoIcon,
          color
        }}
      >
        {icon}
      </div>

      <div>
        <p style={styles.infoTitle}>
          {title}
        </p>

        <h3
          style={{
            color
          }}
        >
          {value}
        </h3>
      </div>
    </div>
  );
}

function Benefit({
  icon,
  title,
  sub
}) {
  return (
    <div style={styles.benefit}>
      <div style={styles.benefitIcon}>
        {icon}
      </div>

      <div>
        <b>{title}</b>
        <p>{sub}</p>
      </div>
    </div>
  );
}

function HeroDivider() {
  return (
    <div
      style={{
        height: 1,
        background:
          "rgba(255,255,255,.15)",
        margin: "14px 0"
      }}
    />
  );
}

function HeroStat({
  title,
  value,
  color
}) {
  return (
    <div>
      <p
        style={{
          color:
            "rgba(255,255,255,.8)",
          marginBottom: 8
        }}
      >
        {title}
      </p>

      <h2
        style={{
          color,
          fontSize: 34,
          fontWeight: 800
        }}
      >
        {value}
      </h2>
    </div>
  );
}
function PremiumSafe({ small }) {
  return (
    <div style={small ? styles.safeSmall : styles.safeWrap}>
      <div style={styles.safeBox3d}>
        <div style={styles.safeDoor}>
          <div style={styles.safeCircle}></div>
          <div style={styles.safeHandle}></div>
        </div>
      </div>

      {!small && (
        <>
          <div style={styles.coinStack1}>₹</div>
          <div style={styles.coinStack2}>₹</div>
          <div style={styles.shield3d}>✓</div>
        </>
      )}
    </div>
  );
}

function PlantLogo() {
  return (
    <div style={styles.plantLogo}>
      <div style={styles.leaf1}></div>
      <div style={styles.leaf2}></div>
      <div style={styles.stem}></div>
      <div style={styles.pot}>₹</div>
    </div>
  );
}

function RocketLogo() {
  return (
    <div style={styles.rocketLogo}>
      <div style={styles.rocketBody}></div>
      <div style={styles.rocketWindow}></div>
      <div style={styles.rocketFire}></div>
    </div>
  );
}

function PremiumTrophy() {
  return <div style={styles.trophy3d}>🏆</div>;
}

function HeroLines() {
  return (
    <div style={styles.heroLines}>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#050b4f 0%,#102c9b 35%,#e9f3ff 100%)",
    padding: "14px",
    fontFamily: "Arial, sans-serif",
    color: "#101a3a"
  },

  app: {
    maxWidth: "1000px",
    margin: "0 auto"
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#061463",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white"
  },

  loadingCard: {
    background: "rgba(255,255,255,.12)",
    padding: "30px",
    borderRadius: "28px",
    textAlign: "center",
    boxShadow: "0 18px 40px rgba(0,0,0,.25)"
  },

  loadingSafe: {
    display: "flex",
    justifyContent: "center"
  },

  header: {
    height: "82px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    color: "white"
  },

  backBtn: {
    width: "55px",
    height: "55px",
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

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  secureBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,.12)",
    padding: "12px 18px",
    borderRadius: "16px"
  },

  bellBtn: {
    position: "relative",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "28px"
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "28px",
    minHeight: "230px",
    background: "linear-gradient(135deg,#32106f,#4e18a7,#24085e)",
    boxShadow: "0 18px 35px rgba(0,0,0,.28)",
    border: "1px solid rgba(255,255,255,.16)",
    color: "white",
    display: "grid",
    gridTemplateColumns: "1fr 260px 1fr",
    gap: "10px",
    padding: "26px"
  },

  heroLines: {
    position: "absolute",
    inset: 0,
    opacity: 0.18
  },

  heroLeft: {
    zIndex: 2
  },

  heroCenter: {
    zIndex: 2,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  heroRight: {
    zIndex: 2
  },

  heroBottom: {
    gridColumn: "1 / 4",
    textAlign: "center",
    borderTop: "1px solid rgba(255,255,255,.16)",
    paddingTop: "14px",
    fontSize: "18px",
    zIndex: 2
  },

  safeWrap: {
    position: "relative",
    width: "220px",
    height: "150px"
  },

  safeSmall: {
    position: "relative",
    width: "120px",
    height: "90px"
  },

  safeBox3d: {
    width: "145px",
    height: "120px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#a855f7,#5b21b6)",
    boxShadow: "inset -12px -12px 0 rgba(0,0,0,.18),0 18px 25px rgba(0,0,0,.28)"
  },

  safeDoor: {
    width: "100px",
    height: "90px",
    borderRadius: "14px",
    border: "5px solid rgba(255,255,255,.24)",
    position: "absolute",
    left: "22px",
    top: "15px"
  },

  safeCircle: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "5px solid #ddd6fe",
    position: "absolute",
    left: "27px",
    top: "22px"
  },

  safeHandle: {
    width: "54px",
    height: "5px",
    background: "#ddd6fe",
    position: "absolute",
    left: "20px",
    top: "40px"
  },

  coinStack1: {
    position: "absolute",
    left: "0",
    bottom: "5px",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f59e0b)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "22px"
  },

  coinStack2: {
    position: "absolute",
    left: "42px",
    bottom: "18px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fde047,#f97316)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  shield3d: {
    position: "absolute",
    right: "0",
    bottom: "18px",
    width: "72px",
    height: "85px",
    borderRadius: "28px 28px 34px 34px",
    background: "linear-gradient(135deg,#bbf7d0,#10b981)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "45px",
    fontWeight: "900",
    border: "5px solid #dcfce7"
  },

  investmentList: {
    marginTop: "14px"
  },

  investmentCard: {
    background: "linear-gradient(180deg,#ffffff,#f8fbff)",
    borderRadius: "28px",
    padding: "24px",
    marginBottom: "14px",
    boxShadow: "0 15px 32px rgba(15,23,42,.14)",
    border: "1px solid rgba(255,255,255,.85)"
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "18px"
  },

  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px"
  },

  planCircle: {
    width: "98px",
    height: "98px",
    borderRadius: "50%",
    background: "radial-gradient(circle,#ffffff,#eefdf6)",
    boxShadow: "0 10px 24px rgba(0,0,0,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  planTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "900"
  },

  activeBadge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "8px 14px",
    borderRadius: "12px",
    border: "1px solid",
    fontWeight: "900"
  },

  idCard: {
    minWidth: "210px",
    border: "1px solid #dbe3ef",
    borderRadius: "16px",
    padding: "14px 16px",
    background: "#f9fbff"
  },

  idRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  copyBtn: {
    border: "none",
    background: "transparent",
    fontSize: "18px"
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    border: "1px solid #e5eaf3",
    borderRadius: "20px",
    overflow: "hidden",
    background: "#ffffff"
  },

  infoBox: {
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

  infoTitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px"
  },

  progressSection: {
    marginTop: "14px",
    background: "#eefaf3",
    borderRadius: "16px",
    padding: "14px"
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "900",
    color: "#16a34a"
  },

  progressPercent: {
    color: "white",
    borderRadius: "12px",
    padding: "5px 10px"
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

  expectedBox: {
    display: "grid",
    gridTemplateColumns: "1fr 230px",
    alignItems: "center",
    marginTop: "8px"
  },

  actionRow: {
    marginTop: "14px",
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr 1.4fr 1fr",
    gap: "8px"
  },

  actionBtn: {
    height: "46px",
    border: "none",
    borderRadius: "14px",
    background: "#f8fbff",
    color: "#16a34a",
    fontWeight: "900"
  },

  renewBtn: {
    height: "46px",
    border: "none",
    borderRadius: "14px",
    color: "white",
    fontWeight: "900"
  },

  plantLogo: {
    position: "relative",
    width: "70px",
    height: "70px"
  },

  leaf1: {
    position: "absolute",
    width: "32px",
    height: "22px",
    background: "#22c55e",
    borderRadius: "100% 0 100% 0",
    top: "8px",
    left: "10px"
  },

  leaf2: {
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

  rocketLogo: {
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
  },

  bottomChoice: {
    background: "linear-gradient(135deg,#fff7df,#ffffff)",
    borderRadius: "24px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "25px",
    boxShadow: "0 12px 28px rgba(15,23,42,.10)"
  },

  trophyBox: {
    width: "110px"
  },

  trophy3d: {
    fontSize: "78px",
    filter: "drop-shadow(0 10px 12px rgba(245,158,11,.28))"
  },

  choiceText: {
    flex: 1
  },

  choiceBenefits: {
    display: "flex",
    gap: "28px"
  },

  benefit: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  benefitIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#fef3c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  }
};