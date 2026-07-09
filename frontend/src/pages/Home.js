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
        <div style={styles.loaderRing}></div>
        <h2 style={{ marginTop: "20px", color: "#22c55e", letterSpacing: "1px" }}>SAVE MONEY</h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Securing your financial dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* TOP NAVBAR */}
      <header style={styles.topHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button style={styles.menuButton}>☰</button>
          <span style={styles.brandLogo}>Save Money</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button style={styles.notificationButton} onClick={() => go("/notifications")}>
            <span>🔔</span>
            {notificationCount > 0 && (
              <span style={styles.notificationBadge}>{notificationCount}</span>
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
      </header>

      {/* PREMIUM HERO BANNER */}
      <section style={styles.heroWrapper}>
        <div style={styles.heroFlex}>
          <div style={styles.profileSection}>
            <div style={styles.profilePhotoCircle}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="User" style={styles.profilePhoto} />
              ) : (
                <span style={styles.defaultProfileIcon}>👤</span>
              )}
            </div>
            <div>
              <div style={styles.heroNameRow}>
                <h1 style={styles.heroName}>{name}</h1>
                {kycApproved && <span style={styles.verifiedBadge}>Verified ✓</span>}
              </div>
              <p style={styles.heroSubtitle}>Welcome Back • Premium Tier Node</p>
            </div>
          </div>

          {/* Wallet Inside Hero */}
          <div style={styles.heroWalletCard}>
            <p style={styles.walletLabel}>TOTAL BALANCE</p>
            <h2 style={styles.walletValue}>₹{wallet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </section>

      {/* LIVE ANNOUNCEMENT TICKER */}
      <section style={styles.latestCard} onClick={() => go("/notifications")}>
        <div style={styles.latestLeft}>
          <span style={styles.latestIcon}>📢</span>
          <div style={{ overflow: "hidden" }}>
            <h4 style={styles.latestTitle}>Latest Update</h4>
            <p style={styles.latestText}>{latestUpdate}</p>
          </div>
        </div>
        <span style={styles.latestArrow}>→</span>
      </section>

      {/* STATS MATRIX CARDS */}
      <section style={styles.statsGrid}>
        <DashboardStatCard icon="📈" title="Total Investment" value={`₹${totalInvestment.toFixed(2)}`} type="blue" />
        <DashboardStatCard icon="📊" title="Total Return" value={`₹${totalReturn.toFixed(2)}`} type="green" />
        <DashboardStatCard icon="👥" title="Total Referral" value={totalReferral} type="purple" />
        <DashboardStatCard icon="⬇️" title="Total Withdraw" value={`₹${totalWithdraw.toFixed(2)}`} type="orange" />
      </section>

      {/* MAIN ACTIONS */}
      <PremiumSectionTitle title="⚡ CORE OPERATIONS" color="#0ea5e9" />
      <section style={styles.actionPanel}>
        <PremiumActionButton icon="💰" title="INVEST NOW" subtitle="Maximize APY Growth" onClick={() => go("/invest-now")} />
        <PremiumActionButton icon="📈" title="My Investment" subtitle="Track Active Pools" onClick={() => go("/my-investment")} />
        <PremiumActionButton icon="👛" title="Wallet Hub" subtitle="Deposit & Balance" onClick={() => go("/wallet")} />
        <PremiumActionButton icon="💸" title="Withdraw Funds" subtitle="Instant Payout Mode" onClick={() => navigate("/withdraw")} />
        <PremiumActionButton icon="👥" title="Refer & Earn" subtitle="Grow Network Node" onClick={() => go("/refer")} />
        <PremiumActionButton icon="🧾" title="Leaderboard" subtitle="Top Direct Earners" onClick={() => go("/Leaderboard")} />
      </section>

      {/* MORE FEATURES */}
      <PremiumSectionTitle title="🛠️ ECOSYSTEM ADVANCED SERVICES" color="#f59e0b" />
      <section style={styles.actionPanel}>
        <PremiumActionButton icon="✅" title="KYC Verification" subtitle="Account Compliance" onClick={() => go("/kyc")} />
        <PremiumActionButton icon="🎁" title="Daily Reward" subtitle="Claim Active Bonus" onClick={() => go("/daily-reward")} />
        <PremiumActionButton icon="🏦" title="Bank Details" subtitle="Manage Wire Settles" onClick={() => navigate("/bank-details")} />
        <PremiumActionButton icon="📊" title="AI Assistant" subtitle="Smart Safe Advisor" onClick={() => go("/investment-assistant")} />
        <PremiumActionButton icon="🕸️" title="Analytics Portal" subtitle="Advanced Logs" onClick={() => go("/user-analytics")} />
        <PremiumActionButton icon="🎧" title="VIP Support" subtitle="Direct Admin Pipeline" onClick={() => go("/support")} />
      </section>

      {/* ELEVATED LUXURY PROMO BANNER */}
      <section style={styles.promoBanner}>
        <div style={styles.promoContent}>
          <h2 style={styles.promoHeading}>Multiply Capital.<br />Automate Future.</h2>
          <p style={styles.promoSub}>Secure your dynamic earnings with premium compounding pools.</p>
          <button style={styles.promoButton} onClick={() => go("/save-money")}>Explore Smart Portfolios →</button>
        </div>
        <div style={styles.promoGraphic}>💎</div>
      </section>

      {/* METRIC TRUST STREAKS */}
      <section style={styles.trustPanel}>
        <TrustMiniCard icon="🔒" title="Escrow Safeguards" subtitle="100% Cryptographic protection" />
        <TrustMiniCard icon="⚡" title="Rapid Settlement" subtitle="Auto-payout routing systems" />
        <TrustMiniCard icon="🛡️" title="Licensed Enterprise" subtitle="Regulated capital transparency" />
        <TrustMiniCard icon="💬" title="Human Live Support" subtitle="Direct ticketing chat access" />
      </section>

      {/* ABOUT SUB-STRIP */}
      <button style={styles.aboutStrip} onClick={() => go("/about")}>
        🏢 About Save Money Platform & Governance Report
      </button>

      {/* INSPIRATIONAL BANNER */}
      <h3 style={styles.helpText}>EMPOWER USERS • EXPAND NETWORKS • EARN COMMISSIONS 💸</h3>

      {/* CLEAN COMPLIANCE FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          {["privacy", "terms", "refund", "risk", "aml", "disclaimer"].map((link) => (
            <button key={link} style={styles.footerLinkBtn} onClick={() => go(`/legal/${link}`)}>
              {link.replace("-", " ").toUpperCase()}
            </button>
          ))}
        </div>
        <p style={styles.footerCopyright}>
          © 2026 Save Money Inc. Autonomous Financial Networks. All Rights Reserved.
        </p>
      </footer>

      {/* FLOATING GLASS BOTTOM NAVIGATION DOCK */}
      <nav style={styles.bottomNav}>
        <BottomNavItem icon="🏠" title="Home" active={location.pathname === "/home" || location.pathname === "/"} onClick={() => go("/home")} />
        <BottomNavItem icon="👛" title="Vault" active={location.pathname === "/wallet"} onClick={() => go("/wallet")} />
        <BottomNavItem icon="👥" title="Network" active={location.pathname === "/refer"} onClick={() => go("/refer")} />
        <BottomNavItem icon="🌲" title="Tree" active={location.pathname === "/referral-tree"} onClick={() => go("/referral-tree")} />
      </nav>

    </div>
  );
}

// 📌 SUB-COMPONENTS
function DashboardStatCard({ icon, title, value, type }) {
  const colors = {
    blue: { bg: "rgba(14, 165, 233, 0.04)", border: "rgba(14, 165, 233, 0.2)", glow: "#0ea5e9" },
    green: { bg: "rgba(34, 197, 94, 0.04)", border: "rgba(34, 197, 94, 0.2)", glow: "#22c55e" },
    purple: { bg: "rgba(168, 85, 247, 0.04)", border: "rgba(168, 85, 247, 0.2)", glow: "#a855f7" },
    orange: { bg: "rgba(249, 115, 22, 0.04)", border: "rgba(249, 115, 22, 0.2)", glow: "#f97316" }
  };

  return (
    <div style={{ ...styles.statCard, background: colors[type].bg, borderColor: colors[type].border }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={styles.statIcon}>{icon}</span>
        <div style={{ ...styles.statDot, background: colors[type].glow, boxShadow: `0 0 8px ${colors[type].glow}` }}></div>
      </div>
      <p style={styles.statTitle}>{title}</p>
      <h3 style={styles.statValue}>{value}</h3>
    </div>
  );
}

function PremiumActionButton({ icon, title, subtitle, onClick }) {
  return (
    <button style={styles.actionButton} onClick={onClick}>
      <div style={styles.actionIcon}>{icon}</div>
      <div style={{ overflow: "hidden" }}>
        <h4 style={styles.actionTitle}>{title}</h4>
        <p style={styles.actionSubtitle}>{subtitle}</p>
      </div>
    </button>
  );
}

function PremiumSectionTitle({ title, color }) {
  return (
    <div style={styles.sectionTitleWrap}>
      <div style={{ ...styles.sectionTitleDot, background: color }}></div>
      <h4 style={{ ...styles.sectionTitleText, color }}>{title}</h4>
    </div>
  );
}

function TrustMiniCard({ icon, title, subtitle }) {
  return (
    <div style={styles.trustCard}>
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <div>
        <h5 style={styles.trustTitle}>{title}</h5>
        <p style={styles.trustSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

function BottomNavItem({ icon, title, active, onClick }) {
  return (
    <button style={{ ...styles.bottomNavItem, opacity: active ? 1 : 0.5 }} onClick={onClick}>
      <span style={{ fontSize: "22px", color: active ? "#22c55e" : "#94a3b8" }}>{icon}</span>
      <span style={{ fontSize: "11px", color: active ? "#22c55e" : "#94a3b8", fontWeight: active ? "700" : "500" }}>{title}</span>
    </button>
  );
}

// 👑 ULTRA PREMIUM UI STYLESHEET
const styles = {
  page: {
    minHeight: "100vh",
    background: "#030712", // গভীর চমৎকার ব্ল্যাকশ-ডার্ক ব্যাকগ্রাউন্ড
    color: "#f3f4f6",
    padding: "0 16px 120px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif",
    boxSizing: "border-box"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#030712",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  loaderRing: {
    width: "45px",
    height: "45px",
    border: "3px solid #1f2937",
    borderTop: "3px solid #22c55e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  topHeader: {
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255,255,255,0.03)"
  },
  menuButton: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "24px",
    cursor: "pointer"
  },
  brandLogo: {
    fontSize: "18px",
    fontWeight: "800",
    background: "linear-gradient(to right, #ffffff, #94a3b8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  logoutBtn: {
    padding: "8px 14px",
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "12px",
    color: "#f87171",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },
  notificationButton: {
    position: "relative",
    width: "40px",
    height: "40px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
  },
  notificationBadge: {
    position: "absolute",
    top: "2px",
    right: "2px",
    background: "#ef4444",
    color: "white",
    fontSize: "10px",
    fontWeight: "700",
    minWidth: "16px",
    height: "16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  heroWrapper: {
    background: "linear-gradient(135deg, #0b1528 0%, #030712 100%)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "24px",
    padding: "20px",
    marginTop: "10px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
  },
  heroFlex: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  profileSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  profilePhotoCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.1)",
    overflow: "hidden"
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  defaultProfileIcon: {
    fontSize: "32px",
    lineHeight: "56px",
    textAlign: "center",
    display: "block",
    background: "#1f2937"
  },
  heroNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  heroName: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffffff"
  },
  verifiedBadge: {
    background: "rgba(34, 197, 94, 0.12)",
    color: "#4ade80",
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "20px",
    fontWeight: "600"
  },
  heroSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  heroWalletCard: {
    background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)"
  },
  walletLabel: {
    margin: 0,
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "700",
    letterSpacing: "1px"
  },
  walletValue: {
    margin: "6px 0 0 0",
    fontSize: "26px",
    fontWeight: "900",
    color: "#22c55e"
  },
  latestCard: {
    marginTop: "14px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    padding: "12px 16px",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer"
  },
  latestLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    maxWidth: "85%"
  },
  latestIcon: {
    fontSize: "18px"
  },
  latestTitle: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  latestText: {
    margin: 0,
    fontSize: "13px",
    color: "#e5e7eb",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  latestArrow: {
    color: "#64748b",
    fontSize: "16px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "16px"
  },
  statCard: {
    border: "1px solid",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  statIcon: {
    fontSize: "20px"
  },
  statDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%"
  },
  statTitle: {
    margin: "12px 0 2px 0",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600"
  },
  statValue: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffffff"
  },
  sectionTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "24px 0 12px 0"
  },
  sectionTitleDot: {
    width: "4px",
    height: "14px",
    borderRadius: "4px"
  },
  sectionTitleText: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.5px"
  },
  actionPanel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  actionButton: {
    background: "rgba(255,255,255,0.01)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    cursor: "pointer",
    outline: "none"
  },
  actionIcon: {
    fontSize: "20px",
    width: "36px",
    height: "36px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  actionTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
    color: "#f3f4f6"
  },
  actionSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "11px",
    color: "#64748b"
  },
  promoBanner: {
    marginTop: "24px",
    background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "24px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden"
  },
  promoContent: {
    maxWidth: "75%",
    zIndex: 2
  },
  promoHeading: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.3"
  },
  promoSub: {
    margin: "6px 0 14px 0",
    fontSize: "12px",
    color: "#94a3b8"
  },
  promoButton: {
    padding: "8px 16px",
    background: "#22c55e",
    color: "#030712",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)"
  },
  promoGraphic: {
    fontSize: "40px",
    opacity: 0.15,
    position: "absolute",
    right: "15px"
  },
  trustPanel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "20px"
  },
  trustCard: {
    background: "rgba(255,255,255,0.01)",
    border: "1px solid rgba(255,255,255,0.03)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  trustTitle: {
    margin: 0,
    fontSize: "12px",
    color: "#e5e7eb",
    fontWeight: "600"
  },
  trustSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "10px",
    color: "#64748b"
  },
  aboutStrip: {
    width: "100%",
    marginTop: "16px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.05)",
    color: "#64748b",
    padding: "12px",
    borderRadius: "14px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  },
  helpText: {
    textAlign: "center",
    fontSize: "11px",
    color: "#22c55e",
    margin: "35px 0 15px 0",
    letterSpacing: "0.5px",
    opacity: 0.8
  },
  footer: {
    marginTop: "30px",
    borderTop: "1px solid rgba(255,255,255,0.03)",
    paddingTop: "20px",
    textAlign: "center"
  },
  footerLinks: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "14px"
  },
  footerLinkBtn: {
    background: "transparent",
    border: "none",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer"
  },
  footerCopyright: {
    margin: "14px 0 0 0",
    fontSize: "11px",
    color: "#334155"
  },
  bottomNav: {
    position: "fixed",
    bottom: "16px",
    left: "16px",
    right: "16px",
    height: "64px",
    background: "rgba(17, 24, 39, 0.7)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    zIndex: 9999
  },
  bottomNavItem: {
    background: "transparent",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    cursor: "pointer"
  }
};
