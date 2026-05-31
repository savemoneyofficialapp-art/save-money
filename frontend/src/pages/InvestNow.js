import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function InvestNow() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [showInvestment, setShowInvestment] = useState(true);

  const [summary, setSummary] = useState({
    totalInvestment: 0,
    monthlyInvestment: 0,
    totalReturn: 0,
    returnRate: 0,
    activePlan: 0
  });

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/investment-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          email
        })
      });

      const data = await res.json();

      if (data?.success) {
        setSummary({
          totalInvestment: Number(data.totalInvestment || 0),
          monthlyInvestment: Number(data.monthlyInvestment || 0),
          totalReturn: Number(data.totalReturn || 0),
          returnRate: Number(data.returnRate || 0),
          activePlan: Number(data.activePlan || 0)
        });
      }
    } catch (err) {
      console.log("INVESTMENT SUMMARY ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const money = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN")}.00`;
  
  };

  const showMoney = (amount) => {
  return showInvestment ? money(amount) : "₹ ••••••••";
};

  const comingSoon = () => {
    alert("Temporary Unavailable - Coming Soon");
  };

  const plans = useMemo(() => {
    return [
      {
        type: "save",
        title: "SAVE MONEY",
        subtitle: "SIP Invest Plan",
        heading: "Start small, grow big",
        description:
          "Build your wealth step by step with our smart SIP saving plan.",
        icon: "plant",
        button: "Invest Now",
        onClick: () => navigate("/save-money")
      },
      {
        type: "one",
        title: "ONE TIME",
        subtitle: "Upgrade Money",
        heading: "Upgrade your future",
        description:
          "Make a smart move and unlock upgraded growth opportunities.",
        icon: "rocket",
        button: "Upgrade Now",
        onClick: comingSoon
      }
    ];
  }, []);

  const comingCards = [
    {
      title: "Invest GOLD",
      text: "Secure your future with the power of gold value.",
      icon: "gold",
      theme: "gold"
    },
    {
      title: "Invest SILVER",
      text: "Invest in silver and build a stable tomorrow.",
      icon: "silver",
      theme: "silver"
    },
    {
      title: "RECURRING DEPOSIT",
      text: "Save regularly and grow with disciplined returns.",
      icon: "piggy",
      theme: "rd"
    }
  ];

  const statCards = [
    {
      title: "Total Invested",
      value: money(summary.totalInvestment),
      icon: "trend",
      color: "#18c98b"
    },
    {
      title: "Total Return",
      value: money(summary.totalReturn),
      icon: "return",
      color: "#2f80ed"
    },
    {
      title: "Return Rate",
      value: `${summary.returnRate}%`,
      icon: "percent",
      color: "#8b5cf6"
    },
    {
      title: "Active Plan",
      value: summary.activePlan,
      icon: "calendar",
      color: "#ff9f1c"
    }
  ];

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingPiggy}>
            <PiggyArt small />
          </div>

          <h2>Loading Investment</h2>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      <div style={styles.appWrap}>

        {/* HERO */}
        <section style={styles.heroCard}>

          <HeroNetwork />

          <div style={styles.heroLeft}>
            <div style={styles.heroLabelRow}>
              <p style={styles.heroLabel}>
                Total Investment Value
              </p>

              <button
  style={styles.eyeBtn}
  onClick={() => setShowInvestment(!showInvestment)}
>
  {showInvestment ? "👁" : "🙈"}
</button>
            </div>

            <h1 style={styles.heroAmount}>
              {showMoney(summary.totalInvestment)}
            </h1>

            <p style={styles.heroGain}>
              +{showInvestment ? money(summary.monthlyInvestment) : "₹ •••••"}    
                        {" "}
              <span>
                (▲ {summary.returnRate}%)
              </span>
            </p>

            <p style={styles.heroSub}>
              This Month Added
            </p>
          </div>

          <div style={styles.heroRight}>
            <HeroGraph />
            <PiggyArt />
          </div>

        </section>

        {/* QUICK ACTIONS */}
        <section style={styles.quickPanel}>

          <QuickAction
            icon="wallet"
            title="Add Money"
            subtitle="Top up balance"
            color="purple"
            onClick={() => navigate("/wallet")}
          />

          <div style={styles.quickDivider}></div>

          <QuickAction
            icon="paper"
            title="My Investments"
            subtitle="View all plans"
            color="green"
            onClick={() => navigate("/my-investment")}
          />

        </section>

        <SectionTitle title="Active Investment" />

        {/* ACTIVE INVESTMENT */}
        <section style={styles.activeGrid}>

          {plans.map((plan) => (
            <PlanCard
              key={plan.title}
              plan={plan}
            />
          ))}

        </section>

        <SectionTitle title="Coming Soon 🕒" />

        {/* COMING SOON */}
        <section style={styles.comingGrid}>

          {comingCards.map((item) => (
            <ComingCard
              key={item.title}
              item={item}
              onClick={comingSoon}
            />
          ))}

        </section>

        {/* MOTIVATION */}
        <section style={styles.motivationCard}>

          <div style={styles.trophyIcon}>
            🏆
          </div>

          <div style={styles.motivationText}>
            <h2>
              Discipline Today, Wealth Tomorrow.
            </h2>

            <p>
              Small steps now, big freedom later.
            </p>
          </div>

          <div style={styles.motiveChart}>
            ▂▃▅▇
          </div>

        </section>

        {/* STATS */}
        <section style={styles.statsPanel}>

          {statCards.map((stat) => (
            <MiniStat
              key={stat.title}
              stat={stat}
            />
          ))}

        </section>

      </div>

    </div>
  );
}

function HeroNetwork() {
  return (
    <div style={styles.networkLayer}>
      <span style={styles.netDotA}></span>
      <span style={styles.netDotB}></span>
      <span style={styles.netDotC}></span>
      <span style={styles.netDotD}></span>
      <span style={styles.netLineA}></span>
      <span style={styles.netLineB}></span>
      <span style={styles.netLineC}></span>
      <span style={styles.netCircleA}></span>
      <span style={styles.netCircleB}></span>
    </div>
  );
}

function HeroGraph() {
  return (
    <div style={styles.heroGraph}>
      <span style={styles.graphArrow}>↗</span>
      <span style={styles.graphBar1}></span>
      <span style={styles.graphBar2}></span>
      <span style={styles.graphBar3}></span>
      <span style={styles.graphBar4}></span>
      <span style={styles.graphBar5}></span>
    </div>
  );
}

function PiggyArt({ small }) {
  return (
    <div style={small ? styles.piggySmallStage : styles.piggyStage}>
      <div style={styles.pigCoin}>₹</div>

      <div style={small ? styles.pigBodySmall : styles.pigBody}>
        <span style={styles.pigEarLeft}></span>
        <span style={styles.pigEarRight}></span>
        <span style={styles.pigEyeLeft}></span>
        <span style={styles.pigEyeRight}></span>
        <span style={styles.pigNose}>••</span>
        <span style={styles.pigLegLeft}></span>
        <span style={styles.pigLegRight}></span>
        <span style={styles.pigTail}>↺</span>
      </div>

      {!small && (
        <>
          <span style={styles.floatCoinA}>●</span>
          <span style={styles.floatCoinB}>◆</span>
          <span style={styles.floatCoinC}>✦</span>
        </>
      )}
    </div>
  );
}

function QuickAction({ icon, title, subtitle, color, onClick }) {
  const iconStyle =
    color === "purple"
      ? styles.quickIconPurple
      : styles.quickIconGreen;

  return (
    <button style={styles.quickAction} onClick={onClick}>
      <div style={iconStyle}>
        {icon === "wallet" ? "💳" : "📋"}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </button>
  );
}

function SectionTitle({ title }) {
  return (
    <div style={styles.sectionTitle}>
      <div style={styles.sectionLineLeft}></div>

      <h2>{title}</h2>

      <div style={styles.sectionLineRight}></div>
    </div>
  );
}

function PlanCard({ plan }) {
  const isSave = plan.type === "save";

  return (
    <div style={isSave ? styles.savePlanCard : styles.onePlanCard}>
      <div style={styles.planGlow}></div>
      <div style={styles.planPattern}></div>

      <div style={styles.planTop}>
        <div style={styles.planImageCircle}>
          {plan.icon === "plant" ? (
            <div style={styles.plantArt}>
              <span style={styles.plantStem}></span>
              <span style={styles.plantLeafLeft}></span>
              <span style={styles.plantLeafRight}></span>
              <span style={styles.plantPot}></span>
              <span style={styles.plantCoin}>₹</span>
            </div>
          ) : (
            <div style={styles.rocketArt}>
              <span style={styles.rocketBody}></span>
              <span style={styles.rocketWindow}></span>
              <span style={styles.rocketFinLeft}></span>
              <span style={styles.rocketFinRight}></span>
              <span style={styles.rocketFire}></span>
            </div>
          )}
        </div>

        <div style={styles.planHeadingBox}>
          <h1>{plan.title}</h1>
<span style={styles.planSubtitleYellow}>
  {plan.subtitle}
</span>        </div>
      </div>

      <div style={styles.planContent}>
        <h2>{plan.heading}</h2>
        <p>{plan.description}</p>
      </div>

      <button
        style={{
          ...styles.planButton,
          color: isSave ? "#12a866" : "#0877ec"
        }}
        onClick={plan.onClick}
      >
        <span>{plan.button}</span>

        <b style={{
          background: isSave
            ? "linear-gradient(135deg,#22c55e,#00a86b)"
            : "linear-gradient(135deg,#1d9bf0,#0866d9)"
        }}>
          ›
        </b>
      </button>
    </div>
  );
}

function ComingCard({ item, onClick }) {
  const cardStyle =
    item.theme === "gold"
      ? styles.comingGold
      : item.theme === "silver"
      ? styles.comingSilver
      : styles.comingRd;

  return (
    <button style={{ ...styles.comingCard, ...cardStyle }} onClick={onClick}>
      <div style={styles.comingRibbon}>
        Coming Soon
      </div>

      <div style={styles.comingIconCircle}>
        {item.icon === "gold" && <GoldIcon />}
        {item.icon === "silver" && <SilverIcon />}
        {item.icon === "piggy" && <MiniPiggy />}
      </div>

      <h3>{item.title}</h3>
      <p>{item.text}</p>

      <div style={styles.comingButton}>
        🕒 Coming Soon
      </div>
    </button>
  );
}

function GoldIcon() {
  return (
    <div style={styles.goldIcon}>
      <span>₹</span>
    </div>
  );
}

function SilverIcon() {
  return (
    <div style={styles.silverIcon}>
      <span>₹</span>
    </div>
  );
}

function MiniPiggy() {
  return (
    <div style={styles.miniPiggy}>
      <div style={styles.miniPigBody}>
        <span style={styles.miniPigEye}></span>
        <span style={styles.miniPigNose}>•</span>
      </div>
    </div>
  );
}

function MiniStat({ stat }) {
  return (
    <div style={styles.miniStat}>
      <div
        style={{
          ...styles.miniIcon,
          background: stat.color
        }}
      >
        {stat.icon === "trend" && "↗"}
        {stat.icon === "return" && "₹"}
        {stat.icon === "percent" && "%"}
        {stat.icon === "calendar" && "▣"}
      </div>

      <div>
        <p>{stat.title}</p>
        <h3>{stat.value}</h3>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#f8f9ff,#eef3ff)",
    padding: "18px",
    fontFamily: "Arial, sans-serif",
    color: "#101a3a"
  },

  appWrap: {
    width: "100%",
    maxWidth: "940px",
    margin: "0 auto"
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#f7f8ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loadingCard: {
    background: "white",
    padding: "28px",
    borderRadius: "28px",
    textAlign: "center",
    boxShadow: "0 18px 45px rgba(124,58,237,.18)"
  },

  loadingPiggy: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px"
  },

  heroCard: {
    height: "230px",
    borderRadius: "32px",
    background: "linear-gradient(135deg,#4d2df4,#7c3aed,#ec4899)",
    position: "relative",
    overflow: "hidden",
    padding: "36px 44px",
    color: "white",
    boxShadow: "0 20px 42px rgba(124,58,237,.32)"
  },

  networkLayer: {
    position: "absolute",
    inset: 0,
    opacity: 0.35
  },

  netDotA: {
    position: "absolute",
    top: "35px",
    right: "300px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "white"
  },

  netDotB: {
    position: "absolute",
    top: "85px",
    right: "165px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "#facc15"
  },

  netDotC: {
    position: "absolute",
    bottom: "48px",
    right: "245px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#bbf7d0"
  },

  netDotD: {
    position: "absolute",
    bottom: "95px",
    right: "390px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "white"
  },

  netLineA: {
    position: "absolute",
    top: "48px",
    right: "170px",
    width: "140px",
    height: "2px",
    background: "white",
    transform: "rotate(20deg)"
  },

  netLineB: {
    position: "absolute",
    top: "105px",
    right: "225px",
    width: "160px",
    height: "2px",
    background: "white",
    transform: "rotate(-28deg)"
  },

  netLineC: {
    position: "absolute",
    bottom: "72px",
    right: "235px",
    width: "170px",
    height: "2px",
    background: "white",
    transform: "rotate(16deg)"
  },

  netCircleA: {
    position: "absolute",
    right: "70px",
    top: "25px",
    width: "150px",
    height: "150px",
    border: "1px solid white",
    borderRadius: "50%"
  },

  netCircleB: {
    position: "absolute",
    right: "280px",
    bottom: "-35px",
    width: "170px",
    height: "170px",
    border: "1px solid white",
    borderRadius: "50%"
  },

  heroLeft: {
    position: "relative",
    zIndex: 5
  },

  heroLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  heroLabel: {
    margin: 0,
    fontSize: "19px",
    opacity: 0.95,
    fontWeight: "600"
  },

  eyeIcon: {
    fontSize: "18px"
  },

  heroAmount: {
    margin: "18px 0 8px",
    fontSize: "50px",
    fontWeight: "900",
    letterSpacing: "1px"
  },

  heroGain: {
    margin: 0,
    color: "#4ade80",
    fontSize: "22px",
    fontWeight: "900"
  },

  heroSub: {
    marginTop: "12px",
    fontSize: "18px",
    opacity: 0.9
  },

  heroRight: {
    position: "absolute",
    right: "70px",
    top: "20px",
    width: "310px",
    height: "190px",
    zIndex: 3
  },

  heroGraph: {
    position: "absolute",
    right: "0",
    bottom: "0",
    width: "280px",
    height: "160px",
    opacity: 0.22
  },

  graphArrow: {
    position: "absolute",
    right: "15px",
    top: "-5px",
    fontSize: "115px",
    color: "white",
    fontWeight: "900"
  },

  graphBar1: {
    position: "absolute",
    bottom: 0,
    left: 8,
    width: 24,
    height: 48,
    background: "white",
    borderRadius: 8
  },

  graphBar2: {
    position: "absolute",
    bottom: 0,
    left: 48,
    width: 24,
    height: 70,
    background: "white",
    borderRadius: 8
  },

  graphBar3: {
    position: "absolute",
    bottom: 0,
    left: 88,
    width: 24,
    height: 98,
    background: "white",
    borderRadius: 8
  },

  graphBar4: {
    position: "absolute",
    bottom: 0,
    left: 128,
    width: 24,
    height: 125,
    background: "white",
    borderRadius: 8
  },

  graphBar5: {
    position: "absolute",
    bottom: 0,
    left: 168,
    width: 24,
    height: 150,
    background: "white",
    borderRadius: 8
  },

  piggyStage: {
    position: "absolute",
    right: "95px",
    top: "35px",
    width: "150px",
    height: "125px",
    zIndex: 6
  },

  piggySmallStage: {
    position: "relative",
    width: "110px",
    height: "90px",
    margin: "0 auto"
  },

  pigCoin: {
    position: "absolute",
    top: "-8px",
    left: "55px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fde047,#f59e0b)",
    color: "#92400e",
    border: "4px solid #fef3c7",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
    fontSize: "22px",
    zIndex: 8,
    boxShadow: "0 8px 16px rgba(0,0,0,.2)"
  },

  pigBody: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "135px",
    height: "88px",
    background: "linear-gradient(135deg,#ffc2d1,#fb7185)",
    borderRadius: "58px 62px 46px 46px",
    boxShadow: "inset -10px -8px 0 rgba(244,63,94,.16),0 18px 22px rgba(0,0,0,.22)"
  },

  pigBodySmall: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "105px",
    height: "68px",
    background: "linear-gradient(135deg,#ffc2d1,#fb7185)",
    borderRadius: "45px 48px 35px 35px",
    boxShadow: "inset -8px -6px 0 rgba(244,63,94,.16)"
  },

  pigEarLeft: {
    position: "absolute",
    top: "-16px",
    left: "25px",
    width: "30px",
    height: "30px",
    background: "#ff8fab",
    borderRadius: "10px 22px 10px 22px",
    transform: "rotate(28deg)"
  },

  pigEarRight: {
    position: "absolute",
    top: "-12px",
    right: "22px",
    width: "25px",
    height: "25px",
    background: "#ff8fab",
    borderRadius: "10px 20px 10px 20px",
    transform: "rotate(45deg)"
  },

  pigEyeLeft: {
    position: "absolute",
    top: "28px",
    left: "76px",
    width: "7px",
    height: "7px",
    background: "#111827",
    borderRadius: "50%"
  },

  pigEyeRight: {
    position: "absolute",
    top: "28px",
    left: "98px",
    width: "7px",
    height: "7px",
    background: "#111827",
    borderRadius: "50%"
  },

  pigNose: {
    position: "absolute",
    right: "-8px",
    top: "36px",
    width: "36px",
    height: "26px",
    background: "#fb7185",
    borderRadius: "50%",
    color: "#7f1d1d",
    fontSize: "9px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  pigLegLeft: {
    position: "absolute",
    bottom: "-7px",
    left: "35px",
    width: "20px",
    height: "16px",
    background: "#fb7185",
    borderRadius: "0 0 8px 8px"
  },

  pigLegRight: {
    position: "absolute",
    bottom: "-7px",
    right: "34px",
    width: "20px",
    height: "16px",
    background: "#fb7185",
    borderRadius: "0 0 8px 8px"
  },

  pigTail: {
    position: "absolute",
    left: "-14px",
    top: "35px",
    color: "#fb7185",
    fontSize: "20px",
    fontWeight: "900"
  },

  floatCoinA: {
    position: "absolute",
    top: "18px",
    left: "-18px",
    color: "#fde047",
    fontSize: "22px"
  },

  floatCoinB: {
    position: "absolute",
    right: "-12px",
    bottom: "22px",
    color: "#bfdbfe",
    fontSize: "20px"
  },

  floatCoinC: {
    position: "absolute",
    top: "45px",
    right: "-25px",
    color: "#f0abfc",
    fontSize: "18px"
  },

  quickPanel: {
    height: "92px",
    background: "white",
    borderRadius: "28px",
    margin: "18px 4px 0",
    display: "grid",
    gridTemplateColumns: "1fr 1px 1fr",
    alignItems: "center",
    padding: "0 26px",
    boxShadow: "0 12px 30px rgba(16,24,40,.08)"
  },

  quickDivider: {
    height: "46px",
    background: "#d9deea"
  },

  quickAction: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    color: "#101a3a",
    textAlign: "left",
    cursor: "pointer"
  },

  quickIconPurple: {
    width: 52,
    height: 52,
    borderRadius: "18px",
    background: "linear-gradient(135deg,#7537f4,#9b4dff)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    boxShadow: "0 8px 18px rgba(124,58,237,.28)"
  },

  quickIconGreen: {
    width: 52,
    height: 52,
    borderRadius: "18px",
    background: "linear-gradient(135deg,#18d78b,#0bbf78)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    boxShadow: "0 8px 18px rgba(34,197,94,.28)"
  },

  sectionTitle: {
    margin: "34px 0 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px"
  },

  sectionLineLeft: {
    width: "82px",
    height: "4px",
    borderRadius: "20px",
    background: "linear-gradient(90deg,transparent,#8b5cf6,#ec4899)"
  },

  sectionLineRight: {
    width: "82px",
    height: "4px",
    borderRadius: "20px",
    background: "linear-gradient(90deg,#ec4899,#8b5cf6,transparent)"
  },

  activeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px"
  },

  savePlanCard: {
    background: "linear-gradient(135deg,#22d686,#00b972)",
    borderRadius: "28px",
    minHeight: "260px",
    padding: "22px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 15px 32px rgba(0,185,114,.28)"
  },

  onePlanCard: {
    background: "linear-gradient(135deg,#27a7ff,#0877ec)",
    borderRadius: "28px",
    minHeight: "260px",
    padding: "22px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 15px 32px rgba(8,119,236,.28)"
  },

  planGlow: {
    position: "absolute",
    right: "-45px",
    top: "-45px",
    width: "150px",
    height: "150px",
    background: "rgba(255,255,255,.18)",
    borderRadius: "50%"
  },

  planPattern: {
    position: "absolute",
    left: "-30px",
    bottom: "-30px",
    width: "120px",
    height: "120px",
    border: "18px solid rgba(255,255,255,.08)",
    borderRadius: "50%"
  },

  planTop: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },

  planImageCircle: {
    width: "118px",
    height: "118px",
    borderRadius: "50%",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 26px rgba(0,0,0,.18)"
  },

  planHeadingBox: {
    textAlign: "right",
    color: "white",
    maxWidth: "210px"
  },

  planHeadingBox_h1: {},

  plantArt: {
    position: "relative",
    width: "78px",
    height: "78px"
  },

  plantStem: {
    position: "absolute",
    left: "37px",
    top: "22px",
    width: "6px",
    height: "35px",
    background: "#16a34a",
    borderRadius: "8px"
  },

  plantLeafLeft: {
    position: "absolute",
    left: "15px",
    top: "23px",
    width: "28px",
    height: "18px",
    background: "#22c55e",
    borderRadius: "100% 0 100% 0",
    transform: "rotate(-20deg)"
  },

  plantLeafRight: {
    position: "absolute",
    right: "10px",
    top: "15px",
    width: "30px",
    height: "20px",
    background: "#4ade80",
    borderRadius: "0 100% 0 100%",
    transform: "rotate(20deg)"
  },

  plantPot: {
    position: "absolute",
    bottom: "7px",
    left: "22px",
    width: "38px",
    height: "24px",
    background: "#f97316",
    borderRadius: "0 0 12px 12px"
  },

  plantCoin: {
    position: "absolute",
    right: "0px",
    bottom: "6px",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "#facc15",
    color: "#92400e",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900"
  },

  rocketArt: {
    position: "relative",
    width: "82px",
    height: "82px"
  },

  rocketBody: {
    position: "absolute",
    left: "30px",
    top: "8px",
    width: "28px",
    height: "55px",
    background: "linear-gradient(180deg,#e0f2fe,#38bdf8)",
    borderRadius: "50% 50% 18px 18px",
    transform: "rotate(25deg)"
  },

  rocketWindow: {
    position: "absolute",
    left: "43px",
    top: "27px",
    width: "12px",
    height: "12px",
    background: "#2563eb",
    borderRadius: "50%"
  },

  rocketFinLeft: {
    position: "absolute",
    left: "24px",
    bottom: "20px",
    width: "18px",
    height: "18px",
    background: "#ef4444",
    clipPath: "polygon(100% 0,0 100%,100% 100%)"
  },

  rocketFinRight: {
    position: "absolute",
    right: "16px",
    bottom: "14px",
    width: "18px",
    height: "18px",
    background: "#ef4444",
    clipPath: "polygon(0 0,0 100%,100% 100%)"
  },

  rocketFire: {
    position: "absolute",
    left: "18px",
    bottom: "4px",
    width: "28px",
    height: "28px",
    background: "linear-gradient(180deg,#facc15,#f97316)",
    borderRadius: "50% 50% 50% 0",
    transform: "rotate(30deg)"
  },

  planContent: {
    position: "relative",
    zIndex: 2,
    color: "white",
    marginTop: "28px",
    maxWidth: "320px"
  },

 planButton: {
  position: "absolute",
  left: "22px",
  right: "22px",
  bottom: "18px",
  height: "54px",
  border: "none",
  borderRadius: "17px",
  background: "white",
  fontSize: "20px",
  fontWeight: "900",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px",
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(0,0,0,.18)",
  lineHeight: "normal"
},

  comingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "18px"
  },

  comingCard: {
    minHeight: "226px",
    border: "none",
    borderRadius: "26px",
    padding: "20px",
    position: "relative",
    textAlign: "left",
    boxShadow: "0 12px 30px rgba(16,24,40,.08)",
    overflow: "hidden",
    cursor: "pointer"
  },

  comingGold: {
    background: "linear-gradient(135deg,#fff6d6,#fffaf0)"
  },

  comingSilver: {
    background: "linear-gradient(135deg,#f6f8ff,#ffffff)"
  },

  comingRd: {
    background: "linear-gradient(135deg,#fff0ec,#fff9f6)"
  },

  comingRibbon: {
    position: "absolute",
    top: 0,
    left: 22,
    background: "linear-gradient(135deg,#9b5cf7,#b65cff)",
    color: "white",
    padding: "8px 17px",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    fontSize: 13,
    fontWeight: "900"
  },

  comingIconCircle: {
    marginTop: "40px",
    width: "70px",
    height: "70px",
    borderRadius: "22px",
    background: "rgba(255,255,255,.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 18px rgba(0,0,0,.08)"
  },

  goldIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f59e0b)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "22px"
  },

  silverIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#e5e7eb,#94a3b8)",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "22px"
  },

  miniPiggy: {
    position: "relative",
    width: "50px",
    height: "40px"
  },

  miniPigBody: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "48px",
    height: "32px",
    borderRadius: "20px",
    background: "#fb7185"
  },

  miniPigEye: {
    position: "absolute",
    top: "9px",
    right: "14px",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#111827"
  },

  miniPigNose: {
    position: "absolute",
    right: "-5px",
    top: "12px",
    width: "18px",
    height: "14px",
    borderRadius: "50%",
    background: "#fda4af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "8px"
  },

  comingButton: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
    background: "rgba(155,92,247,.10)",
    borderRadius: 15,
    padding: "11px",
    color: "#7c3aed",
    textAlign: "center",
    fontWeight: "900"
  },

  motivationCard: {
    marginTop: "24px",
    minHeight: "130px",
    borderRadius: "28px",
    background: "linear-gradient(135deg,#2500a8,#4300d8,#120082)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    boxShadow: "0 15px 30px rgba(37,0,168,.22)",
    padding: "18px"
  },

  trophyIcon: {
    fontSize: "72px"
  },

  motivationText: {
    textAlign: "center"
  },

  motiveChart: {
    fontSize: "70px",
    color: "#b467ff"
  },

  statsPanel: {
    minHeight: "86px",
    background: "white",
    marginTop: "20px",
    borderRadius: "26px",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    boxShadow: "0 12px 30px rgba(16,24,40,.08)",
    overflow: "hidden"
  },

  miniStat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRight: "1px solid #e3e7f0",
    padding: "12px"
  },

  miniIcon: {
    width: 42,
    height: 42,
    borderRadius: "14px",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "18px"
  },

  eyeBtn: {
  border: "2px solid rgba(255,255,255,.7)",
  background: "rgba(255,255,255,.12)",
  color: "white",
  width: "42px",
  height: "30px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
},

planSubtitleYellow: {
  display: "inline-block",
  marginTop: "8px",
  background: "#facc15",
  color: "#111827",
  padding: "6px 14px",
  borderRadius: "14px",
  fontWeight: "900",
  fontSize: "14px",
  boxShadow: "0 6px 12px rgba(0,0,0,.12)"
},

  "@media": {}
};