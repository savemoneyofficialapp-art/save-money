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
          <div style={styles.spinner}></div>
          <h2 style={{ color: "#22c55e", margin: "15px 0 5px" }}>Save Money</h2>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Loading secure wallet node...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* TOP HEADER */}
      <div style={styles.topHeader}>
        <button style={styles.menuButton}>☰</button>

        <h2 style={styles.headerTitle}>Dashboard Engine</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
      </div>

      {/* HERO PROFILE & CAPITAL OVERVIEW */}
      <section style={styles.heroWrapper}>
        <div style={styles.heroMainRow}>
          <div style={styles.profilePhotoCircle}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="User" style={styles.profilePhoto} />
            ) : (
              <span style={styles.defaultProfileIcon}>👤</span>
            )}
          </div>

          <div style={styles.heroUserInfo}>
            <p style={styles.heroWelcome}>Welcome Back 👋</p>
            <div style={styles.heroNameRow}>
              <h1 style={styles.heroName}>{name}</h1>
              {kycApproved && <span style={styles.verifiedBadge}>✔ Verified</span>}
            </div>
            <p style={styles.heroSubtitle}>Save Money, Secure Future 💚</p>
          </div>
        </div>

        {/* Core Balance Card inside Hero */}
        <div style={styles.heroWalletCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#020617" }}>⚡ TOTAL LIQUID WALLET</p>
            <span style={{ fontSize: "20px" }}>👛</span>
          </div>
          <h2 style={styles.walletValueText}>₹{wallet.toFixed(2)}</h2>
        </div>
      </section>

      {/* LATEST UPDATE STRIP */}
      <section style={styles.latestCard} onClick={() => go("/notifications")}>
        <div style={styles.latestLeft}>
          <div style={styles.latestIcon}>📢</div>
          <div>
            <h4 style={{ margin: 0, fontSize: "13px", color: "#ffd166" }}>System Announcement</h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#f1f5f9" }}>{latestUpdate}</p>
          </div>
        </div>
        <button style={styles.latestArrow}>›</button>
      </section>

      {/* FINANCIAL LEDGER MATRIX GRID */}
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
      <PremiumSectionTitle title="CORE ACCELERATORS" color="#38bdf8" />
      <section style={styles.actionPanel}>
        <PremiumActionButton icon="💰" title="INVEST NOW" subtitle="Capital Allocation" gradient="invest" onClick={() => go("/invest-now")} />
        <PremiumActionButton icon="📈" title="My Asset Ledger" subtitle="Portfolio Analytics" gradient="myInvestment" onClick={() => go("/my-investment")} />
        <PremiumActionButton icon="👛" title="Funding Vault" subtitle="Deposit Protocol" gradient="wallet" onClick={() => go("/wallet")} />
        <PremiumActionButton icon="💸" title="Secure Payout" subtitle="Instant Withdraw" gradient="withdraw" onClick={() => navigate("/withdraw")} />
        <PremiumActionButton icon="👥" title="Affiliate Matrix" subtitle="Invite Node & Earn" gradient="refer" onClick={() => go("/refer")} />
        <PremiumActionButton icon="🧾" title="Leaderboard" subtitle="Top Networkers" gradient="transaction" onClick={() => go("/Leaderboard")} />
      </section>

      {/* MORE FEATURES */}
      <PremiumSectionTitle title="NODE SERVICES" color="#fbbf24" />
      <section style={styles.actionPanel}>
        <PremiumActionButton icon="✅" title="KYC Verification" subtitle="Identity Pipeline" gradient="kyc" onClick={() => go("/kyc")} />
        <PremiumActionButton icon="🎁" title="Daily Matrix Reward" subtitle="Claim Dividends" gradient="reward" onClick={() => go("/daily-reward")} />
        <PremiumActionButton icon="🏦" title="Bank Linkage" subtitle="Settlement Details" gradient="bank" onClick={() => navigate("/bank-details")} />
        <PremiumActionButton icon="📊" title="AI Assistant" subtitle="Smart Helper" gradient="plan" onClick={() => go("/investment-assistant")} />
        <PremiumActionButton icon="🕸️" title="Network Analytics" subtitle="Data Deep-dive" gradient="notification" onClick={() => go("/user-analytics")} />
        <PremiumActionButton icon="🎧" title="Core Support Core" subtitle="24/7 Encryption Tech" gradient="support" onClick={() => go("/support")} />
      </section>

      {/* CRYPTO-STYLE PROMO BANNER */}
      <section style={styles.promoBanner}>
        <div style={styles.promoContent}>
          <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: "800", color: "#f8fafc" }}>
            Grow Your Idle Capital.<br />Build Generational Wealth.
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#cbd5e1" }}>Invest Smart via Automated Execution Networks.</p>
          <button style={styles.promoButton} onClick={() => go("/save-money")}>
            Initialize Protocol →
          </button>
        </div>
        <div style={styles.promoIcon}>⚡💰</div>
      </section>

      {/* ECOSYSTEM TRUST SIGNALS */}
      <section style={styles.trustPanel}>
        <TrustMiniCard icon="🔒" title="End-to-End Vault Security" subtitle="Military-Grade Safeguards" />
        <TrustMiniCard icon="⚡" title="Automated Liquid Settlement" subtitle="Rapid Disbursal Channels" />
        <TrustMiniCard icon="🛡️" title="Fully Regulated Node Audits" subtitle="Verified By Decentralized Pools" />
        <TrustMiniCard icon="💬" title="Human-in-the-loop Help" subtitle="Real-time Admin Uplink" />
      </section>

      {/* ABOUT SYSTEM SHORTCUT */}
      <button style={styles.aboutStrip} onClick={() => go("/about")}>
        🏢 Corporate Structure & Transparency Reports
      </button>

      {/* HELP INSPIRATION TEXT */}
      <h2 style={styles.helpText}>HELP OTHERS EXPAND THE NETWORK FOR HIGHER APY 💸</h2>

      {/* ENTERPRISE FOOTER */}
      <footer style={styles.footer}>
        <h2 style={{ margin: "0 0 10px 0", color: "#22c55e", fontSize: "20px", fontWeight: "800" }}>Save Money</h2>
        <div style={styles.footerLinks}>
          {["privacy", "terms", "refund", "risk", "aml", "disclaimer"].map((type) => (
            <button key={type} style={styles.footerLinkBtn} onClick={() => go(`/legal/${type}`)}>
              {type.toUpperCase()} Policy
            </button>
          ))}
        </div>
        <p style={{ margin: "20px 0 0", color: "#475569", fontSize: "11px" }}>
          © 2026 Save Money Autonomous Systems. All Capital Matrix Systems Protected.
        </p>
      </footer>

      {/* TACTICAL BOTTOM DOCK NAVIGATION */}
      <nav style={styles.bottomNav}>
        <BottomNavItem icon="🏠" title="Core" active={location.pathname === "/home" || location.pathname === "/"} onClick={() => go("/home")} />
        <BottomNavItem icon="👛" title="Vault" active={location.pathname === "/wallet"} onClick={() => go("/wallet")} />
        <BottomNavItem icon="👥" title="Affiliate" active={location.pathname === "/refer"} onClick={() => go("/refer")} />
        <BottomNavItem icon="🌲" title="Network Tree" active={location.pathname === "/referral-tree"} onClick={() => go("/referral-tree")} />
      </nav>

    </div>
  );
}

// Subcomponents with Styled System Props
function DashboardStatCard({ icon, title, value, gradient }) {
  const themes = {
    blue: { bg: "linear-gradient(135deg, #1e40af 0%, #0f172a 100%)", border: "#3b82f6" },
    green: { bg: "linear-gradient(135deg, #065f46 0%, #0f172a 100%)", border: "#22c55e" },
    purple: { bg: "linear-gradient(135deg, #6b21a8 0%, #0f172a 100%)", border: "#a855f7" },
    orange: { bg: "linear-gradient(135deg, #9a3412 0%, #0f172a 100%)", border: "#f97316" }
  };

  return (
    <div style={{ ...styles.statCard, background: themes[gradient].bg, border: `1px solid ${themes[gradient].border}` }}>
      <div style={styles.statIcon}>{icon}</div>
      <p style={styles.statTitle}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
    </div>
  );
}

function PremiumActionButton({ icon, title, subtitle, onClick }) {
  return (
    <button style={styles.actionButton} onClick={onClick}>
      <div style={styles.actionIconCircle}>{icon}</div>
      <div style={styles.actionTextBox}>
        <h3 style={styles.actionTitle}>{title}</h3>
        <p style={styles.actionSubtitle}>{subtitle}</p>
      </div>
    </button>
  );
}

function PremiumSectionTitle({ title, color }) {
  return (
    <div style={styles.sectionTitleWrap}>
      <div style={{ ...styles.sectionLine, background: `linear-gradient(90deg, transparent, ${color})` }}></div>
      <h2 style={{ ...styles.sectionTitleText, color }}>{title}</h2>
      <div style={{ ...styles.sectionLine, background: `linear-gradient(90deg, ${color}, transparent)` }}></div>
    </div>
  );
}

function TrustMiniCard({ icon, title, subtitle }) {
  return (
    <div style={styles.trustMiniCard}>
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <div>
        <h4 style={{ margin: 0, fontSize: "13px", color: "#f1f5f9" }}>{title}</h4>
        <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function BottomNavItem({ icon, title, active, onClick }) {
  return (
    <button style={{ ...styles.bottomNavItem, opacity: active ? 1 : 0.45 }} onClick={onClick}>
      <span style={{ fontSize: "22px", filter: active ? "drop-shadow(0 0 8px #22c55e)" : "none" }}>{icon}</span>
      <small style={{ fontSize: "11px", color: active ? "#22c55e" : "#94a3b8", fontWeight: active ? "800" : "500", marginTop: "3px" }}>{title}</small>
    </button>
  );
}

// 💎 PREMIUM STYLESHEET
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #070f24 50%, #020617 100%)",
    color: "#f1f5f9",
    padding: "0 16px 120px",
    fontFamily: "'Segoe UI', system-ui, sans-serif"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  loadingCard: {
    background: "#0f172a",
    padding: "32px",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px solid #1e293b",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #1e293b",
    borderTop: "4px solid #22c55e",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 1s linear infinite"
  },
  topHeader: {
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1e293b",
    marginBottom: "16px"
  },
  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "26px",
    cursor: "pointer"
  },
  headerTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    color: "#94a3b8"
  },
  logoutBtn: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "10px",
    background: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    border: "1px solid rgba(239,68,68,0.3)"
  },
  notificationButton: {
    position: "relative",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #1e293b",
    color: "white",
    fontSize: "20px",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  notificationBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#ef4444",
    color: "white",
    minWidth: "18px",
    height: "18px",
    borderRadius: "50%",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    padding: "0 2px"
  },
  heroWrapper: {
    background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
    border: "1px solid #334155",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.35)"
  },
  heroMainRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  profilePhotoCircle: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    border: "2px solid #22c55e",
    overflow: "hidden",
    boxShadow: "0 0 15px rgba(34,197,94,0.2)"
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  defaultProfileIcon: {
    fontSize: "36px",
    lineHeight: "64px",
    textAlign: "center",
    display: "block",
    background: "#1e293b"
  },
  heroUserInfo: {
    flex: 1
  },
  heroWelcome: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600"
  },
  heroNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  heroName: {
    margin: "2px 0",
    fontSize: "20px",
    fontWeight: "800",
    color: "#f8fafc"
  },
  verifiedBadge: {
    background: "rgba(34,197,94,0.15)",
    color: "#22c55e",
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "20px",
    fontWeight: "700"
  },
  heroSubtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8"
  },
  heroWalletCard: {
    marginTop: "20px",
    borderRadius: "16px",
    padding: "16px",
    background: "linear-gradient(135deg, #22c55e 0%, #4dd4ac 100%)",
    boxShadow: "0 10px 25px rgba(34,197,94,0.25)"
  },
  walletValueText: {
    margin: "8px 0 0 0",
    fontSize: "28px",
    fontWeight: "900",
    color: "#020617",
    letterSpacing: "-0.5px"
  },
  latestCard: {
    marginTop: "12px",
    borderRadius: "16px",
    padding: "14px",
    background: "#1e293b",
    border: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer"
  },
  latestLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  latestIcon: {
    fontSize: "22px"
  },
  latestArrow: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: "24px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "16px"
  },
  statCard: {
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    position: "relative"
  },
  statIcon: {
    fontSize: "24px"
  },
  statTitle: {
    margin: "12px 0 4px",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "600"
  },
  statValue: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#f8fafc"
  },
  sectionTitleWrap: {
    display: "flex",
    alignItems: "center",
    margin: "24px 0 14px",
    gap: "10px"
  },
  sectionLine: {
    flex: 1,
    height: "1px"
  },
  sectionTitleText: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1px"
  },
  actionPanel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  actionButton: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer",
    transition: "transform 0.2s"
  },
  actionIconCircle: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
  },
  actionTextBox: {
    flex: 1
  },
  actionTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
    color: "#f1f5f9"
  },
  actionSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "11px",
    color: "#64748b"
  },
  promoBanner: {
    marginTop: "24px",
    borderRadius: "20px",
    padding: "20px",
    background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #818cf8"
  },
  promoButton: {
    padding: "8px 16px",
    background: "white",
    color: "#2563eb",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer"
  },
  promoIcon: {
    fontSize: "36px",
    opacity: 0.3
  },
  trustPanel: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "20px"
  },
  trustMiniCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  aboutStrip: {
    width: "100%",
    marginTop: "16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  },
  helpText: {
    textAlign: "center",
    fontSize: "12px",
    color: "#22c55e",
    letterSpacing: "0.5px",
    margin: "30px 0 10px"
  },
  footer: {
    marginTop: "40px",
    borderTop: "1px solid #1e293b",
    paddingTop: "24px",
    textAlign: "center"
  },
  footerLinks: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "12px",
    marginTop: "10px"
  },
  footerLinkBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: "11px",
    cursor: "pointer",
    fontWeight: "600"
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "68px",
    background: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(12px)",
    borderTop: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 999
  },
  bottomNavItem: {
    background: "transparent",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer"
  }
};
