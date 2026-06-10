import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";
  const localName = localStorage.getItem("name") || "User";

  const [user, setUser] = useState({});
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestUpdate, setLatestUpdate] = useState("No new announcement");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHome();
    loadNotifications();
  }, []);

  const loadHome = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data?.msg === "Token expired or invalid") {
        localStorage.clear();
        navigate("/login");
        return;
      }

      setUser(data || {});
    } catch (err) {
      console.log("HOME LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API}/get-notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        const unread = data.filter((n) => !n.read).length;
        setNotificationCount(unread);
      }
    } catch (err) {
      console.log("Notification count error:", err);
    }
  };

  const fileUrl = (file) => {
    if (!file) return "";
    if (file.startsWith("http")) return file;
    return `${API}/uploads/${file}`;
  };

  const name = user?.name || localName || "User";

  const profilePhoto = useMemo(() => {
    return fileUrl(
      user?.photo ||
      user?.profilePhoto ||
      user?.selfiePhoto ||
      ""
    );
  }, [user]);

  const wallet = Number(user?.wallet || user?.totalWallet || 0);
  const totalInvestment = Number(user?.totalInvestment || 0);
  const totalReturn = Number(user?.totalReturn || 0);
  const totalReferral = Number(user?.totalReferral || user?.referralCount || 0);
  const totalWithdraw = Number(user?.totalWithdraw || 0);

  const kycApproved =
    user?.kycStatus === "approved" ||
    user?.kycStatus === "Approved";

  const go = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingLogo}>💚</div>
          <h2>Save Money</h2>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* TOP HEADER */}
      <div style={styles.topHeader}>
        <button style={styles.menuButton}>
          ☰
        </button>

        <h2 style={styles.headerTitle}>
          Welcome, {name}
        </h2>

           <button
          style={styles.notificationButton}
          onClick={() => go("/notifications")}
        >
          <span>🔔</span>

          {notificationCount > 0 && (
            <small style={styles.notificationBadge}>
              {notificationCount}
            </small>
          )}
        </button>

 <button
    style={styles.logoutBtn}
    onClick={() => {

      localStorage.clear();

      navigate("/login");

    }}
  >
    Logout
  </button>

      </div>

      {/* HERO PROFILE + WALLET */}
      <section style={styles.heroWrapper}>
        <div style={styles.heroGlow}></div>

        <div style={styles.profilePhotoCircle}>
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="User"
              style={styles.profilePhoto}
            />
          ) : (
            <span style={styles.defaultProfileIcon}>👤</span>
          )}
        </div>

        <div style={styles.heroUserInfo}>
          <p style={styles.heroWelcome}>
            Welcome Back 👋
          </p>

          <div style={styles.heroNameRow}>
            <h1 style={styles.heroName}>
              {name}
            </h1>

            {kycApproved && (
              <span style={styles.verifiedBadge}>
                ✔
              </span>
            )}
          </div>

          <p style={styles.heroSubtitle}>
            Save Money, Secure Future 💚
          </p>
        </div>

        <div style={styles.heroWalletCard}>
          <p>Total Wallet</p>

          <h2>
            ₹{wallet.toFixed(2)}
          </h2>

          <span>
            👛
          </span>
        </div>
      </section>

      {/* LATEST UPDATE */}
      <section style={styles.latestCard}>
        <div style={styles.latestLeft}>
          <div style={styles.latestIcon}>
            📢
          </div>

          <div>
            <h3>Latest Update</h3>
            <p>{latestUpdate}</p>
          </div>
        </div>

        <button style={styles.latestArrow}>
          ›
        </button>
      </section>

      {/* STATS CARDS */}
      <section style={styles.statsGrid}>
        <DashboardStatCard
          icon="📈"
          title="Total Investment"
          value={`₹${totalInvestment.toFixed(2)}`}
          gradient="blue"
        />

        <DashboardStatCard
          icon="📊"
          title="Total Return"
          value={`₹${totalReturn.toFixed(2)}`}
          gradient="green"
        />

        <DashboardStatCard
          icon="👥"
          title="Total Referral"
          value={totalReferral}
          gradient="purple"
        />

        <DashboardStatCard
          icon="⬇️"
          title="Total Withdraw"
          value={`₹${totalWithdraw.toFixed(2)}`}
          gradient="orange"
        />
      </section>

      {/* MAIN ACTIONS */}
      <PremiumSectionTitle
        title="MAIN ACTIONS"
        color="#38d9ff"
      />

      <section style={styles.actionPanel}>
        <PremiumActionButton
          icon="💰"
          title="INVEST NOW"
          subtitle="Start Investing"
          gradient="invest"
          onClick={() => go("/invest-now")}
        />

        <PremiumActionButton
          icon="📈"
          title="My Investment"
          subtitle="View Details"
          gradient="myInvestment"
          onClick={() => go("/my-investment")}
        />

        <PremiumActionButton
          icon="👛"
          title="Wallet"
          subtitle="Add & Manage"
          gradient="wallet"
          onClick={() => go("/wallet")}
        />

        <PremiumActionButton
          icon="💸"
          title="Withdraw"
          subtitle="Request Payout"
          gradient="withdraw"
          onClick={() => navigate("/withdraw")}
        />

        <PremiumActionButton
          icon="👥"
          title="Refer & Earn"
          subtitle="Invite & Earn"
          gradient="refer"
          onClick={() => go("/refer")}
        />

        <PremiumActionButton
          icon="🧾"
          title="Leaderboard"
          subtitle="Top Referer"
          gradient="transaction"
          onClick={() => go("/Leaderboard")}
        />
      </section>

      {/* MORE FEATURES */}
      <PremiumSectionTitle
        title="MORE FEATURES"
        color="#ffd84d"
      />

      <section style={styles.actionPanel}>
        <PremiumActionButton
          icon="✅"
          title="KYC Verification"
          subtitle="Verify Your Account"
          gradient="kyc"
          onClick={() => go("/kyc")}
        />

        <PremiumActionButton
          icon="🎁"
          title="Daily Reward"
          subtitle="Claim Reward"
          gradient="reward"
          onClick={() => go("/daily-reward")}
        />

        <PremiumActionButton
          icon="🏦"
          title="Bank Details"
          subtitle="Manage Bank Info"
          gradient="bank"
          onClick={() => navigate("/bank-details")}
        />

        <PremiumActionButton
          icon="📊"
          title="Investment Assistant"
          subtitle="Need You Help"
          gradient="plan"
          onClick={() => go("/investment-assistant")}
        />

        <PremiumActionButton
          icon="🕸️"
          title="Analytics"
          subtitle="User Analytics"
          gradient="notification"
          onClick={() => go("/user-analytics")}
        />

        <PremiumActionButton
          icon="🎧"
          title="Support"
          subtitle="Need Help?"
          gradient="support"
          onClick={() => go("/support")}
        />
      </section>

      {/* PURPLE PROMO BANNER */}
      <section style={styles.promoBanner}>
        <div style={styles.promoContent}>
          <h1>
            Grow Your Money
            <br />
            Build Your Future
          </h1>

          <p>
            Invest Smart, Earn More
          </p>

          <button
            style={styles.promoButton}
            onClick={() => go("/save-money")}
          >
            Invest Now →
          </button>
        </div>

        <div style={styles.promoIcon}>
          💰📈
        </div>
      </section>

      {/* TRUST CARDS */}
      <section style={styles.trustPanel}>
        <TrustMiniCard
          icon="🔒"
          title="100% Secure"
          subtitle="Your money is safe"
        />

        <TrustMiniCard
          icon="⚡"
          title="Fast Payout"
          subtitle="Quick withdrawals"
        />

        <TrustMiniCard
          icon="🛡️"
          title="Trusted Platform"
          subtitle="Trusted by users"
        />

        <TrustMiniCard
          icon="💬"
          title="24/7 Support"
          subtitle="We are here"
        />
      </section>

      {/* ABOUT STRIP */}
      <button
        style={styles.aboutStrip}
        onClick={() => go("/about")}
      >
        🏢 About Save Money
      </button>

      {/* HELP TEXT */}
      <h1 style={styles.helpText}>
        HELP OTHER FOR EARN MORE 💸
      </h1>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <h2>
          Save Money
        </h2>

        <div style={styles.footerLinks}>
          <button style={styles.footerLinkBtn} onClick={() => go("/legal/privacy")}>
            Privacy Policy
          </button>

          <button style={styles.footerLinkBtn} onClick={() => go("/legal/terms")}>
            Terms
          </button>

          <button style={styles.footerLinkBtn} onClick={() => go("/legal/refund")}>
            Refund
          </button>

          <button style={styles.footerLinkBtn} onClick={() => go("/legal/risk")}>
            Risk Disclosure
          </button>

          <button style={styles.footerLinkBtn} onClick={() => go("/legal/aml")}>
            AML & KYC
          </button>

          <button style={styles.footerLinkBtn} onClick={() => go("/legal/disclaimer")}>
            Disclaimer
          </button>
        </div>

        <p>
          © 2026 Save Money. All Rights Reserved.
        </p>
      </footer>

    

      {/* BOTTOM NAVIGATION */}
      <nav style={styles.bottomNav}>
        <BottomNavItem
          icon="🏠"
          title="Home"
          active={location.pathname === "/home"}
          onClick={() => go("/home")}
        />

       

        <BottomNavItem
          icon="👛"
          title="Wallet"
          active={location.pathname === "/wallet"}
          onClick={() => go("/wallet")}
        />

        <BottomNavItem
          icon="👥"
          title="Refer"
          active={location.pathname === "/refer"}
          onClick={() => go("/refer")}
        />

        <BottomNavItem
          icon="🌲"
          title="tree"
          active={location.pathname === "/profile"}
          onClick={() => go("/setTreeOpen")}
        />
      </nav>

    </div>
  );
}

function DashboardStatCard({ icon, title, value, gradient }) {
  const gradientStyle = {
    blue: styles.statBlue,
    green: styles.statGreen,
    purple: styles.statPurple,
    orange: styles.statOrange
  };

  return (
    <div style={{ ...styles.statCard, ...gradientStyle[gradient] }}>
      <div style={styles.statIconWrap}>
        <span style={styles.statIcon}>{icon}</span>
      </div>

      <p style={styles.statTitle}>
        {title}
      </p>

      <h2 style={styles.statValue}>
        {value}
      </h2>

      <div style={styles.statGlow}></div>
    </div>
  );
}

function PremiumActionButton({
  icon,
  title,
  subtitle,
  gradient,
  onClick
}) {
  const gradientStyle = {
    invest: styles.actionInvest,
    myInvestment: styles.actionMyInvestment,
    wallet: styles.actionWallet,
    withdraw: styles.actionWithdraw,
    refer: styles.actionRefer,
    transaction: styles.actionTransaction,
    kyc: styles.actionKyc,
    reward: styles.actionReward,
    bank: styles.actionBank,
    plan: styles.actionPlan,
    notification: styles.actionNotification,
    support: styles.actionSupport
  };

  return (
    <button
      style={{
        ...styles.actionButton,
        ...gradientStyle[gradient]
      }}
      onClick={onClick}
    >
      <div style={styles.actionIconCircle}>
        {icon}
      </div>

      <div style={styles.actionTextBox}>
        <h3 style={styles.actionTitle}>
          {title}
        </h3>

        <p style={styles.actionSubtitle}>
          {subtitle}
        </p>
      </div>

      <div style={styles.actionShine}></div>
    </button>
  );
}

function PremiumSectionTitle({ title, color }) {
  return (
    <div style={styles.sectionTitleWrap}>
      <div style={styles.sectionLine}></div>

      <h2
        style={{
          ...styles.sectionTitleText,
          color
        }}
      >
        {title}
      </h2>

      <div style={styles.sectionLine}></div>
    </div>
  );
}

function TrustMiniCard({ icon, title, subtitle }) {
  return (
    <div style={styles.trustMiniCard}>
      <div style={styles.trustIconCircle}>
        {icon}
      </div>

      <div>
        <h3 style={styles.trustTitle}>
          {title}
        </h3>

        <p style={styles.trustSubtitle}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function BottomNavItem({ icon, title, active, onClick }) {
  return (
    <button
      style={{
        ...styles.bottomNavItem,
        ...(active ? styles.bottomNavItemActive : {})
      }}
      onClick={onClick}
    >
      <span style={styles.bottomNavIcon}>
        {icon}
      </span>

      <small style={styles.bottomNavText}>
        {title}
      </small>
    </button>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#020617 0%,#031026 45%,#020617 100%)",
    color: "white",
    padding: "0 16px 160px",
    fontFamily: "Arial, sans-serif"
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  loadingCard: {
    background: "#0f172a",
    padding: "30px",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px solid #1e40af",
    boxShadow: "0 0 35px rgba(34,197,94,0.25)"
  },

  loadingLogo: {
    fontSize: "48px"
  },

  topHeader: {
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },

  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "30px",
    cursor: "pointer"
  },

  headerTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "800"
  },

  logoutBtn: {
  height: "42px",
  padding: "0 18px",
  border: "none",
  borderRadius: "14px",
  background: "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "white",
  fontWeight: "800",
  fontSize: "14px",
  boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
  cursor: "pointer"
},

  notificationButton: {
    position: "relative",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "25px",
    cursor: "pointer"
  },

  notificationBadge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#ff1744",
    color: "white",
    width: "21px",
    height: "21px",
    borderRadius: "50%",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },

  heroWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    borderRadius: "24px",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 90% 0%,#22ff88 0%,transparent 34%),linear-gradient(135deg,#06152d,#043858,#08c96b)",
    border: "1px solid rgba(34,255,136,0.55)",
    boxShadow: "0 0 38px rgba(34,255,136,0.23)"
  },

  heroGlow: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg,rgba(255,255,255,0.08),transparent,rgba(255,255,255,0.08))",
    pointerEvents: "none"
  },

  profilePhotoCircle: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    background: "#334155",
    border: "3px solid #e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 2,
    boxShadow: "0 0 16px rgba(255,255,255,0.35)"
  },

  profilePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  defaultProfileIcon: {
    fontSize: "43px"
  },

  heroUserInfo: {
    flex: 1,
    zIndex: 2
  },

  heroWelcome: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800"
  },

  heroNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px"
  },

  heroName: {
    margin: "4px 0",
    fontSize: "25px",
    fontWeight: "900",
    lineHeight: "30px"
  },

  verifiedBadge: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold"
  },

  heroSubtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#dcfce7",
    fontWeight: "700"
  },

  heroWalletCard: {
    minWidth: "105px",
    borderRadius: "18px",
    padding: "12px",
    background: "linear-gradient(135deg,#16ff75,#00b96b)",
    boxShadow: "0 12px 25px rgba(0,0,0,0.35)",
    zIndex: 2
  },

  latestCard: {
  marginTop: "14px",
  borderRadius: "20px",
  padding: "16px",
  background: "linear-gradient(135deg,#ffb703,#fb8500,#ff006e)",
  border: "2px solid #ffd166",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 0 25px rgba(255,183,3,0.45)"
},


  latestLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  latestIcon: {
    fontSize: "30px"
  },

  latestArrow: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "40px"
  },

  statsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: "12px",
  marginTop: "16px"
},

  statCard: {
  position: "relative",
  minHeight: "120px",
  borderRadius: "20px",
  padding: "14px",
  overflow: "hidden",
  boxShadow: "0 10px 25px rgba(0,0,0,0.45)"
},

  statBlue: {
    background: "linear-gradient(135deg,#2f63ff,#061b91)"
  },

  statGreen: {
    background: "linear-gradient(135deg,#00f58a,#006b45)"
  },

  statPurple: {
    background: "linear-gradient(135deg,#9b35ff,#4c057a)"
  },

  statOrange: {
    background: "linear-gradient(135deg,#ff8a00,#c2410c)"
  },

  statIconWrap: {
    fontSize: "29px"
  },

  statIcon: {
    fontSize: "29px"
  },

  statTitle: {
    margin: "10px 0 4px",
    color: "rgba(255,255,255,0.9)",
    fontSize: "13px",
    fontWeight: "700"
  },

  statValue: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "900"
  },

  statGlow: {
    position: "absolute",
    right: "-20px",
    top: "-20px",
    width: "75px",
    height: "75px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)"
  },

  sectionTitleWrap: {
    margin: "25px 0 13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },

 sectionLine: {
  width: "70px",
  height: "3px",
  borderRadius: "10px",
  background: "linear-gradient(90deg,transparent,#38bdf8,#facc15,transparent)"
},

  sectionTitleText: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "900",
    letterSpacing: "1px"
  },

  actionPanel: {
  background: "linear-gradient(180deg,#061936,#07101e)",
  border: "2px solid #1d4ed8",
  borderRadius: "26px",
  padding: "14px",
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: "14px",
  boxShadow: "inset 0 0 35px rgba(59,130,246,0.25)"
},

  actionButton: {
  position: "relative",
  border: "none",
  borderRadius: "20px",
  minHeight: "120px",
  color: "white",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  overflow: "hidden",
  boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
  cursor: "pointer"
},

actionIconCircle: {
  width: "46px",
  height: "46px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.28)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  boxShadow: "inset 0 0 12px rgba(255,255,255,0.25)"
},

actionTextBox: {
  textAlign: "center",
  zIndex: 2
},

actionTitle: {
  margin: 0,
  fontSize: "14px",
  fontWeight: "900"
},

actionSubtitle: {
  margin: "4px 0 0",
  fontSize: "11px",
  color: "rgba(255,255,255,0.92)",
  fontWeight: "700"
},

  actionShine: {
    position: "absolute",
    right: "-22px",
    top: "-22px",
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.17)"
  },

 actionInvest: {
  background: "linear-gradient(135deg,#00ff75,#00c853,#008f45)"
},
actionMyInvestment: {
  background: "linear-gradient(135deg,#00b4ff,#2563eb,#003cff)"
},
actionWallet: {
  background: "linear-gradient(135deg,#a855f7,#d946ef,#ff00d4)"
},
actionWithdraw: {
  background: "linear-gradient(135deg,#ff6b00,#ff9f00,#ffd000)"
},
actionRefer: {
  background: "linear-gradient(135deg,#ff007a,#ff2bd6,#b000ff)"
},
actionTransaction: {
  background: "linear-gradient(135deg,#00e5ff,#00c8ff,#00ffd5)"
},
actionKyc: {
  background: "linear-gradient(135deg,#00f5ff,#0284c7,#005eff)"
},
actionReward: {
  background: "linear-gradient(135deg,#7c3aed,#a855f7,#e879f9)"
},
actionBank: {
  background: "linear-gradient(135deg,#ff8c00,#ffb703,#ffdd00)"
},
actionPlan: {
  background: "linear-gradient(135deg,#2979ff,#00b0ff,#00e5ff)"
},
actionNotification: {
  background: "linear-gradient(135deg,#ff1744,#ff006e,#ff5c8d)"
},
actionSupport: {
  background: "linear-gradient(135deg,#00ff75,#00e676,#00c853)"
},


  promoBanner: {
    marginTop: "18px",
    borderRadius: "23px",
    padding: "20px",
    background:
      "linear-gradient(135deg,#4c1d95,#8b00ff,#9d00ff)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 28px rgba(126,34,206,0.35)"
  },

  promoContent: {
    flex: 1
  },

  promoButton: {
    marginTop: "12px",
    border: "none",
    borderRadius: "12px",
    padding: "10px 16px",
    background: "#facc15",
    color: "#020617",
    fontWeight: "900"
  },

  promoIcon: {
    fontSize: "55px"
  },

 trustPanel: {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: "10px",
  marginTop: "14px",
  background: "#071831",
  borderRadius: "22px",
  padding: "12px",
  border: "2px solid #1e40af"
},

  trustMiniCard: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "12px",
    background: "rgba(15,23,42,0.65)",
    borderRadius: "15px",
    padding: "10px"
  },

  trustIconCircle: {
    fontSize: "24px"
  },

  trustTitle: {
    margin: 0,
    fontSize: "13px"
  },

  trustSubtitle: {
    margin: "3px 0 0",
    color: "#94a3b8",
    fontSize: "11px"
  },

  aboutStrip: {
    width: "calc(100% + 32px)",
    marginLeft: "-16px",
    marginTop: "20px",
    padding: "15px",
    border: "none",
    background: "linear-gradient(90deg,#06b6d4,#14f1c4)",
    color: "white",
    fontWeight: "900",
    fontSize: "15px"
  },

  helpText: {
    textAlign: "center",
    color: "#22ff73",
    fontSize: "22px",
    fontWeight: "900",
    marginTop: "22px"
  },

  footer: {
    textAlign: "center",
    padding: "24px 4px",
     color: " #87CEEB"
  },

  footerLinks: {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  justifyContent: "center",
  marginBottom: "12px"
},

footerLinkBtn: {
  background: "transparent",
  border: "none",
  color: "#38bdf8",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer"
},

  quickBar: {
    position: "fixed",
    bottom: "64px",
    left: "8px",
    right: "8px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    zIndex: 999
  },

  quickContact: {
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 4px",
    fontWeight: "900"
  },

  quickWallet: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 4px",
    fontWeight: "900"
  },

  quickTeam: {
    background: "#facc15",
    color: "#020617",
    border: "none",
    borderRadius: "12px",
    padding: "12px 4px",
    fontWeight: "900"
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "62px",
    background: "#020817",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    borderTop: "1px solid #1e40af",
    zIndex: 999
  },

  bottomNavItem: {
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  },

  bottomNavItemActive: {
    background: "#0f2a5c",
    color: "white"
  },

  bottomNavIcon: {
    fontSize: "21px"
  },

  bottomNavText: {
    fontSize: "10px",
    marginTop: "3px"
  }
};