import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const [latestUpdateText, setLatestUpdateText] = useState("");
  const [loading, setLoading] = useState(true);

  // 👇 ড্রয়ার ওপেন/ক্লোজ স্টেট ও ডাউনলোডিং অ্যানিমেশন স্টেট
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // 👇 পপআপ মোডালের স্টেট
  const [showOfferPopup, setShowOfferPopup] = useState(false);

  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  const triggerStatusOverlay = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 2500);
  };

  // 👇 ব্রাউজার পুশ নোটিফিকেশন সাবস্ক্রাইব করার ফাংশন (আপডেটকৃত ও নিরাপদ)
  const registerPushNotification = async () => {
    if (!("serviceWorker" in navigator) && !("PushManager" in window)) {
      console.log("Push notifications not supported by this browser.");
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== "granted") {
        console.log("Notification permission not granted.");
        return;
      }

      const keyRes = await fetch(`${API}/get-vapid-key`);
      const keyData = await keyRes.json();
      const publicVapidKey = keyData.publicKey;

      if (!publicVapidKey) {
        console.log("VAPID public key not found from server.");
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      const currentEmail = localStorage.getItem("email");
      if (!currentEmail) return;

      const subscriptionData = JSON.parse(JSON.stringify(subscription));

      const subRes = await fetch(`${API}/save-push-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email: currentEmail, subscription: subscriptionData })
      });

      const subData = await subRes.json();
      if (subRes.ok) {
        console.log("Push Notification Subscribed Successfully!", subData);
      } else {
        console.error("Failed to save push subscription on server:", subData);
      }
    } catch (error) {
      console.error("Push subscription error:", error);
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 👇 PLAN PDF ডাউনলোডের জন্য হ্যান্ডলার (এনিমেশন সহ)
  const handleDownloadPlan = () => {
    if (isDownloadingPlan) return;
    setIsDownloadingPlan(true);

    setTimeout(() => {
      const link = document.createElement("a");
      link.href = "/SAVE_MONEY_PRIVATE_LIMITED.pdf";
      link.download = "SAVE_MONEY_PRIVATE_LIMITED.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloadingPlan(false);
    }, 1500);
  };

  const handleDownloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "INDEPENDENCE_OFFER.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log("Image download error:", error);
      window.open(imageUrl, "_blank");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    loadHome();
    loadNotifications();
    loadLatestUpdate();
    registerPushNotification();

    const interval = setInterval(() => {
      loadLatestUpdate();
    }, 10000);

    const flag = localStorage.getItem("showLoginPopup");
    if (flag === "true") {
      setShowOfferPopup(true);
      localStorage.removeItem("showLoginPopup");
    }

    return () => clearInterval(interval);
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
        triggerStatusOverlay("error", "You are logout please login again");

        setTimeout(() => {
          localStorage.clear();
          navigate("/login");
          window.location.reload();
        }, 2500);
        return;
      }

      setUser(data || {});
      
      if (data?.latestUpdate || data?.announcement) {
        setLatestUpdate(data.latestUpdate || data.announcement);
      }

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

  const loadLatestUpdate = async () => {
    try {
      const res = await fetch(`${API}/latest-news`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache"
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      
      if (data) {
        const msg = data.message || data.latestUpdate || data.announcement || (typeof data === 'string' ? data : "");

        if (msg && msg.trim() !== "") {
          setLatestUpdateText(msg);
          setLatestUpdate(msg);
        }
      }
    } catch (err) {
      console.error("Failed to fetch latest news:", err);
    }
  };

  const handleLogout = async () => {
    try {
      if (email) {
        await fetch(`${API}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email })
        });
      }
    } catch (err) {
      console.log("Logout backend error:", err);
    } finally {
      localStorage.clear();
      navigate("/login");
      window.location.reload();
    }
  };

  useEffect(() => {
    const timeoutLimit = 420000;

    const resetTimer = () => {
      localStorage.setItem("last_activity_time", Date.now().toString());
    };

    if (!localStorage.getItem("last_activity_time")) {
      resetTimer();
    }

    const intervalId = setInterval(async () => {
      const currentToken = localStorage.getItem("token");
      const currentEmail = localStorage.getItem("email");
      
      if (!currentToken || !currentEmail) {
        clearInterval(intervalId);
        return;
      }

      const lastActivityStr = localStorage.getItem("last_activity_time");
      const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
      const currentTime = Date.now();

      if (currentTime - lastActivity >= timeoutLimit) {
        clearInterval(intervalId);

        triggerStatusOverlay("error", "You are logout please login again");

        try {
          await fetch(`${API}/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: currentEmail })
          });
        } catch (err) {
          console.log("Auto logout backend error:", err);
        }

        setTimeout(() => {
          localStorage.clear();
          navigate("/login");
          window.location.reload(); 
        }, 2500); 
      }
    }, 1000); 

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastActivityStr = localStorage.getItem("last_activity_time");
        const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
        
        if (Date.now() - lastActivity >= timeoutLimit) {
          localStorage.clear();
          navigate("/login");
          window.location.reload();
        }
      }
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate]);

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
          <img 
            src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"} 
            alt="Logo" 
            style={styles.loadingLogoImg} 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h2 style={{ display: 'none', margin: '10px 0' }}>Save Money</h2>
          <h2 style={{ marginTop: "15px", fontSize: "20px", fontWeight: "800" }}>Save Money</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* 👇 ANIMATED SIDEBAR / DRAWER */}
      <div style={{
        ...styles.drawerOverlay,
        opacity: isDrawerOpen ? 1 : 0,
        visibility: isDrawerOpen ? "visible" : "hidden"
      }} onClick={() => setIsDrawerOpen(false)}>
        <div style={{
          ...styles.drawerContainer,
          transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
        }} onClick={(e) => e.stopPropagation()}>
          
          <div style={styles.drawerHeader}>
            <div style={styles.drawerBrand}>
              <img 
                src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"} 
                alt="Logo" 
                style={styles.drawerLogoImg} 
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <h3 style={styles.drawerLogoText}>Save Money</h3>
            </div>
            <button style={styles.drawerCloseBtn} onClick={() => setIsDrawerOpen(false)}>✕</button>
          </div>

          <div style={styles.drawerBody}>
            <button 
              style={{
                ...styles.drawerPlanBtn,
                ...(isDownloadingPlan ? styles.drawerPlanBtnLoading : {})
              }}
              onClick={handleDownloadPlan}
              disabled={isDownloadingPlan}
            >
              <span style={styles.drawerPlanIcon}>{isDownloadingPlan ? "⏳" : "📥"}</span>
              <span style={styles.drawerPlanText}>PLAN</span>
              {isDownloadingPlan && <div style={styles.progressShutter}></div>}
            </button>
          </div>

        </div>
      </div>

      {/* 👇 PHOTO POPUP MODAL */}
      {showOfferPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupCard}>
            <button
              style={styles.popupCloseBtn}
              onClick={() => setShowOfferPopup(false)}
            >
              ✕
            </button>

            <img
              src="/INDEPENDENCE OFFER.png"
              alt="INDEPENDENCE OFFER"
              style={styles.popupImage}
            />

            <button
              style={styles.popupDownloadBtn}
              onClick={() => handleDownloadImage("/INDEPENDENCE OFFER.png")}
            >
              📥 Download Offer Image
            </button>
          </div>
        </div>
      )}

      {statusOverlay.show && (
        <div style={styles.statusOverlayBg}>
          <div style={{
            ...styles.statusOverlayCard,
            borderTop: statusOverlay.type === "success" ? "6px solid #22c55e" : statusOverlay.type === "error" ? "6px solid #ef4444" : "6px solid #38bdf8"
          }}>
            <div style={{
              ...styles.statusOverlayIcon,
              background: statusOverlay.type === "success" ? "#dcfce7" : statusOverlay.type === "error" ? "#fee2e2" : "#e0f2fe",
              color: statusOverlay.type === "success" ? "#22c55e" : statusOverlay.type === "error" ? "#ef4444" : "#38bdf8"
            }}>
              {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "error" ? "✕" : "ℹ"}
            </div>
            <h3 style={styles.statusOverlayText}>{statusOverlay.message}</h3>
          </div>
        </div>
      )}

      {/* TOP HEADER WITH RAKSHA BANDHAN BANNER (Exact screen recording style) */}
      <div style={styles.topHeader}>
        <div style={styles.headerLeftGroup}>
          <button 
            style={styles.menuButton}
            onClick={() => setIsDrawerOpen(true)}
          >
            ☰
          </button>

          {/* 👇 RAKSHA BANDHAN FESTIVE BADGE / LOGO */}
          <div style={styles.rakshaBandhanBadge}>
            <div style={styles.rakhiGraphic}>
              <span style={styles.rakhiIcon}>🏮</span>
              <span style={styles.rakhiThread}>🏵️</span>
            </div>
            <div style={styles.rakhiTextGroup}>
              <span style={styles.rakhiTagline}>HAPPY</span>
              <span style={styles.rakhiTitle}>Raksha Bandhan</span>
            </div>
          </div>
        </div>

        <div style={styles.headerRightGroup}>
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
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
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
            Scale: ₹{wallet.toFixed(2)}
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

          <div style={styles.latestTextBox}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "900", color: "#fff" }}>Latest Update</h3>
            
            <div style={styles.marqueeWrapper}>
              <p style={styles.marqueeText}>
                {latestUpdateText ? latestUpdateText : "No new announcement"}
              </p>
            </div>
          </div>
        </div>
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
          onClick={() => go("/leaderboard")}
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
          onClick={() => go("/analytics")}
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
          onClick={() => go("/referral-tree")}
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
      <span style={styles.bottomNavIcon}>{icon}</span>
      <span style={styles.bottomNavText}>{title}</span>
    </button>
  );
}

const styles = {
  drawerOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(2, 6, 23, 0.75)",
    backdropFilter: "blur(6px)",
    zIndex: 100002,
    display: "flex",
    justifyContent: "flex-start",
    transition: "opacity 0.3s ease, visibility 0.3s ease"
  },
  drawerContainer: {
    background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
    width: "280px",
    height: "100%",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "5px 0 30px rgba(0,0,0,0.6)",
    borderRight: "1px solid #1e293b",
    transform: "translateX(-100%)",
    transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "15px"
  },
  drawerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  drawerLogoImg: {
    width: "36px",
    height: "36px",
    objectFit: "contain",
    borderRadius: "8px"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "900",
    color: "#38bdf8"
  },
  drawerCloseBtn: {
    background: "#1e293b",
    border: "none",
    color: "#ffffff",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  drawerBody: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  drawerPlanBtn: {
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    borderRadius: "14px",
    border: "none",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)",
    transition: "transform 0.2s ease"
  },
  drawerPlanBtnLoading: {
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    cursor: "wait"
  },
  progressShutter: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    background: "rgba(255, 255, 255, 0.25)",
    animation: "shutterProgress 1.5s linear infinite",
    pointerEvents: "none"
  },
  drawerPlanIcon: {
    fontSize: "18px",
    zIndex: 2
  },
  drawerPlanText: {
    zIndex: 2,
    letterSpacing: "1px"
  },

  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(2, 6, 23, 0.75)",
    backdropFilter: "blur(6px)",
    zIndex: 100001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px"
  },
  popupCard: {
    background: "#0f172a",
    borderRadius: "24px",
    padding: "20px",
    maxWidth: "420px",
    width: "100%",
    position: "relative",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
    border: "1px solid #1e293b",
    textAlign: "center"
  },
  popupCloseBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: "#1e293b",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },
  popupImage: {
    width: "100%",
    maxHeight: "260px",
    objectFit: "cover",
    borderRadius: "16px",
    marginBottom: "14px"
  },
  popupDownloadBtn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 4px 14px rgba(34, 197, 94, 0.35)"
  },

  statusOverlayBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.65)",
    backdropFilter: "blur(8px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statusOverlayCard: {
    background: "#0f172a",
    padding: "24px 34px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
    border: "1px solid #1e293b",
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
    color: "#ffffff",
    margin: 0,
    fontWeight: "800",
    lineHeight: "1.4"
  },

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

  topHeader: {
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "6px"
  },

  headerLeftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  headerRightGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "28px",
    cursor: "pointer"
  },

  /* 👇 Raksha Bandhan Festive Top Left Styling */
  rakshaBandhanBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.25))",
    padding: "4px 10px 4px 6px",
    borderRadius: "25px",
    border: "1px solid rgba(251, 191, 36, 0.5)",
    boxShadow: "0 0 12px rgba(245, 158, 11, 0.3)"
  },

  rakhiGraphic: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    border: "1.5px solid #fde047",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
  },

  rakhiIcon: {
    fontSize: "14px"
  },

  rakhiThread: {
    position: "absolute",
    fontSize: "10px",
    top: "-3px",
    right: "-3px"
  },

  rakhiTextGroup: {
    display: "flex",
    flexDirection: "column"
  },

  rakhiTagline: {
    fontSize: "9px",
    fontWeight: "900",
    color: "#fde047",
    letterSpacing: "0.8px",
    lineHeight: "10px"
  },

  rakhiTitle: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: "14px"
  },

  logoutBtn: {
    height: "38px",
    padding: "0 14px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "white",
    fontWeight: "800",
    fontSize: "13px",
    boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
    cursor: "pointer"
  },

  notificationButton: {
    position: "relative",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "24px",
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
    gap: "12px",
    flex: 1,
    minWidth: 0
  },

  latestIcon: {
    fontSize: "30px",
    flexShrink: 0
  },

  latestTextBox: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden"
  },

  marqueeWrapper: {
    width: "100%",
    overflow: "hidden",
    whiteSpace: "nowrap",
    boxSizing: "border-box"
  },

  marqueeText: {
    display: "inline-block",
    paddingLeft: "100%",
    animation: "marquee 15s linear infinite",
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff"
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
    fontWeight: "900",
    cursor: "pointer"
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
    fontSize: "15px",
    cursor: "pointer"
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
    color: "#87CEEB"
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

  loadingLogoImg: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    borderRadius: "16px"
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
    fontSize: "12px",
    cursor: "pointer"
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

const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes marquee {
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-100%, 0, 0); }
}
`;
try {
  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
} catch (e) {}
