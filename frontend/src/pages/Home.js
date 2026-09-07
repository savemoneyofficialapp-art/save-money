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

  // 👇 ব্রাউজার পুশ নোটিফিকেশন সাবস্ক্রাইব করার ফাংশন
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

  // 👇 PLAN PDF ডাউনলোডের জন্য হ্যান্ডলার
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
    }, 1200);
  };

  const handleDownloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "OFFER_BANNAR.png";
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
      window.removeEventListener("click", resetTimer);
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
            }}
          />
          <h2 style={{ marginTop: "15px", fontSize: "20px", fontWeight: "800" }}>Save Money</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* 👇 SIDEBAR DRAWER */}
      <div style={{
        ...styles.drawerOverlay,
        opacity: isDrawerOpen ? 1 : 0,
        visibility: isDrawerOpen ? "visible" : "hidden"
      }} onClick={() => setIsDrawerOpen(false)}>
        <div style={{
          ...styles.drawerContainer,
          transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
        }} onClick={(e) => e.stopPropagation()}>
          
          {/* LOGO & BRANDING */}
          <div style={styles.drawerHeader}>
            <div style={styles.drawerBrand}>
              <div style={styles.drawerLogoWrapper}>
                <img 
                  src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"} 
                  alt="SM Logo" 
                  style={styles.drawerLogoImg} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={styles.drawerLogoText}>SAVE MONEY</h3>
                <span style={styles.drawerLogoSubtext}>Invest Small, Earn Big</span>
              </div>
            </div>
          </div>

          {/* SIDEBAR GLOSSY COLORFUL LARGER NAV BUTTONS */}
          <div style={styles.drawerNavList}>
            {/* 1. Dashboard - Glossy Blue */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossyDashboard,
                ...(location.pathname === "/home" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/home"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>🏠</span>
              <span style={styles.drawerNavText}>Dashboard</span>
            </button>

            {/* 2. My Investment - Glossy Emerald */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossyInvestment,
                ...(location.pathname === "/my-investment" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/my-investment"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>📈</span>
              <span style={styles.drawerNavText}>My Investment</span>
            </button>

            {/* 3. Save Money - Glossy Amber */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossySaveMoney,
                ...(location.pathname === "/save-money" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/save-money"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>💰</span>
              <span style={styles.drawerNavText}>Save Money</span>
            </button>

            {/* 4. One Time - Glossy Purple */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossyOneTime,
                ...(location.pathname === "/onetime" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/onetime"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>⚡</span>
              <span style={styles.drawerNavText}>One Time</span>
            </button>

            {/* 5. PLAN (PDF Download) - Glossy Pink/Rose */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossyPlan
              }} 
              onClick={() => { handleDownloadPlan(); setIsDrawerOpen(false); }}
              disabled={isDownloadingPlan}
            >
              <span style={styles.drawerNavIcon}>{isDownloadingPlan ? "⏳" : "📋"}</span>
              <span style={styles.drawerNavText}>{isDownloadingPlan ? "Downloading..." : "Plan PDF"}</span>
            </button>

            {/* 6. Add Fund - Glossy Teal */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossyAddFund
              }} 
              onClick={() => { go("/wallet"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>🌐</span>
              <span style={styles.drawerNavText}>Add Fund</span>
            </button>

            {/* 7. Withdraw - Glossy Orange */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossyWithdraw
              }} 
              onClick={() => { go("/withdraw"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>➔</span>
              <span style={styles.drawerNavText}>Withdraw</span>
            </button>

            {/* 8. Support - Glossy Indigo */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossySupport
              }} 
              onClick={() => { go("/support"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>🎧</span>
              <span style={styles.drawerNavText}>Support</span>
            </button>

            {/* 9. Profile - Glossy Cyan */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossyProfile
              }} 
              onClick={() => { go("/kyc"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>👤</span>
              <span style={styles.drawerNavText}>Profile</span>
            </button>

            {/* 10. Logout - Glossy Red */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.glossyLogout
              }} 
              onClick={() => { setIsDrawerOpen(false); handleLogout(); }}
            >
              <span style={styles.drawerNavIcon}>🚪</span>
              <span style={styles.drawerNavText}>Logout</span>
            </button>
          </div>

          {/* 👇 ONLY TREE PLANT IMAGE AT THE BOTTOM */}
          <div style={styles.treePlantOnlyWrapper}>
            <img 
              src="/tree plant.png" 
              alt="Tree Plant" 
              style={styles.treePlantOnlyImg}
              onError={(e) => {
                if (e.target.src.includes('.png')) {
                  e.target.src = '/tree plant.jpg';
                }
              }}
            />
          </div>

        </div>
      </div>

      {/* PHOTO POPUP MODAL */}
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

      {/* TOP HEADER */}
      <div style={styles.topHeader}>
        <button 
          style={styles.menuButton}
          onClick={() => setIsDrawerOpen(true)}
        >
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
          onClick={handleLogout}
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
  page: {
    minHeight: "100vh",
    backgroundColor: "#030712",
    color: "#f8fafc",
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    paddingBottom: "80px",
    position: "relative"
  },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#030712",
    color: "#fff"
  },
  loadingCard: {
    textAlign: "center",
    padding: "30px",
    background: "#0f172a",
    borderRadius: "20px",
    border: "1px solid #1e293b",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
  },
  loadingLogoImg: {
    width: "60px",
    height: "60px",
    objectFit: "contain"
  },

  // 👇 SLIDE BAR / DRAWER STYLES
  drawerOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(8px)",
    zIndex: 100002,
    display: "flex",
    justifyContent: "flex-start",
    transition: "opacity 0.3s ease, visibility 0.3s ease"
  },
  drawerContainer: {
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    background: "#070d18",
    width: "280px",
    height: "100%",
    padding: "22px 16px 20px 16px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "12px 0 35px rgba(0,0,0,0.9)",
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    transform: "translateX(-100%)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflowY: "auto",
    zIndex: 100003
  },
  drawerHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    paddingBottom: "18px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  },
  drawerLogoWrapper: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #03251a 0%, #064e3b 100%)",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 20px rgba(34, 197, 94, 0.4)"
  },
  drawerLogoImg: {
    width: "36px",
    height: "36px",
    objectFit: "contain"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "1px",
    textAlign: "center"
  },
  drawerLogoSubtext: {
    fontSize: "11px",
    color: "#a7f3d0",
    fontWeight: "600",
    marginTop: "2px",
    textAlign: "center"
  },
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  // 👇 BASE BUTTON STYLE (LARGER SIZE & GLOSSY TOUCH)
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "14px 18px",
    minHeight: "52px",
    borderRadius: "16px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(10px)",
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)",
    letterSpacing: "0.3px"
  },
  drawerNavItemActive: {
    outline: "2px solid #ffffff",
    outlineOffset: "2px",
    transform: "scale(1.02)"
  },
  drawerNavIcon: {
    fontSize: "22px",
    width: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
  },
  drawerNavText: {
    flex: 1,
    fontSize: "15px",
    fontWeight: "700",
    letterSpacing: "0.4px"
  },

  // 👇 INDIVIDUAL GLOSSY COLORFUL STYLES
  glossyDashboard: {
    background: "linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)",
    border: "1px solid rgba(147, 197, 253, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(37, 99, 235, 0.4)"
  },
  glossyInvestment: {
    background: "linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(16, 185, 129, 0.95) 100%)",
    border: "1px solid rgba(110, 231, 183, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(16, 185, 129, 0.4)"
  },
  glossySaveMoney: {
    background: "linear-gradient(135deg, rgba(120, 53, 15, 0.95) 0%, rgba(245, 158, 11, 0.95) 100%)",
    border: "1px solid rgba(252, 211, 77, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(245, 158, 11, 0.4)"
  },
  glossyOneTime: {
    background: "linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(168, 85, 247, 0.95) 100%)",
    border: "1px solid rgba(216, 180, 254, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(168, 85, 247, 0.4)"
  },
  glossyPlan: {
    background: "linear-gradient(135deg, rgba(131, 24, 67, 0.95) 0%, rgba(236, 72, 153, 0.95) 100%)",
    border: "1px solid rgba(249, 168, 212, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(236, 72, 153, 0.4)"
  },
  glossyAddFund: {
    background: "linear-gradient(135deg, rgba(19, 78, 74, 0.95) 0%, rgba(20, 184, 166, 0.95) 100%)",
    border: "1px solid rgba(153, 246, 228, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(20, 184, 166, 0.4)"
  },
  glossyWithdraw: {
    background: "linear-gradient(135deg, rgba(124, 45, 18, 0.95) 0%, rgba(249, 115, 22, 0.95) 100%)",
    border: "1px solid rgba(253, 186, 116, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(249, 115, 22, 0.4)"
  },
  glossySupport: {
    background: "linear-gradient(135deg, rgba(67, 56, 202, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)",
    border: "1px solid rgba(199, 210, 254, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(99, 102, 241, 0.4)"
  },
  glossyProfile: {
    background: "linear-gradient(135deg, rgba(14, 116, 144, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)",
    border: "1px solid rgba(165, 243, 252, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(6, 182, 212, 0.4)"
  },
  glossyLogout: {
    background: "linear-gradient(135deg, rgba(153, 27, 27, 0.95) 0%, rgba(239, 68, 68, 0.95) 100%)",
    border: "1px solid rgba(254, 202, 202, 0.5)",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 6px 16px rgba(239, 68, 68, 0.4)"
  },

  treePlantOnlyWrapper: {
    marginTop: "auto",
    paddingTop: "20px",
    paddingBottom: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    background: "transparent"
  },
  treePlantOnlyImg: {
    width: "220px",
    maxHeight: "220px",
    objectFit: "contain",
    filter: "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.5))"
  },

  // POPUP MODAL
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(2, 6, 23, 0.8)",
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
    boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
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
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  popupImage: {
    width: "100%",
    height: "auto",
    borderRadius: "16px",
    marginBottom: "16px"
  },
  popupDownloadBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer"
  },

  statusOverlayBg: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    zIndex: 100005,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  statusOverlayCard: {
    background: "#0f172a",
    borderRadius: "16px",
    padding: "24px",
    maxWidth: "360px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
    border: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px"
  },
  statusOverlayIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold"
  },
  statusOverlayText: {
    margin: 0,
    fontSize: "15px",
    color: "#f8fafc",
    fontWeight: "600",
    lineHeight: "1.4"
  },

  topHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: "#0f172a",
    borderBottom: "1px solid #1e293b",
    position: "sticky",
    top: 0,
    zIndex: 1000
  },
  menuButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer"
  },
  headerTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#38bdf8"
  },
  notificationButton: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid #334155",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    position: "relative"
  },
  notificationBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: "bold"
  },
  logoutBtn: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer"
  },

  heroWrapper: {
    padding: "20px",
    position: "relative",
    background: "linear-gradient(180deg, #0f172a 0%, #030712 100%)",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  heroGlow: {
    position: "absolute",
    top: 0,
    width: "150px",
    height: "150px",
    background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
    pointerEvents: "none"
  },
  profilePhotoCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#1e293b",
    border: "3px solid #38bdf8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 0 20px rgba(56, 189, 248, 0.3)"
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  defaultProfileIcon: {
    fontSize: "36px"
  },
  heroUserInfo: {
    marginTop: "12px"
  },
  heroWelcome: {
    margin: 0,
    fontSize: "13px",
    color: "#94a3b8"
  },
  heroNameRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginTop: "4px"
  },
  heroName: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#fff"
  },
  verifiedBadge: {
    background: "#22c55e",
    color: "#fff",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold"
  },
  heroSubtitle: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#22c55e",
    fontWeight: "600"
  },
  heroWalletCard: {
    marginTop: "16px",
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    padding: "16px 24px",
    borderRadius: "16px",
    border: "1px solid #334155",
    width: "100%",
    maxWidth: "320px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    position: "relative"
  },

  latestCard: {
    margin: "16px 20px",
    padding: "12px 16px",
    background: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)",
    borderRadius: "14px",
    border: "1px solid #4c1d95"
  },
  latestLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  latestIcon: {
    fontSize: "20px"
  },
  latestTextBox: {
    flex: 1,
    overflow: "hidden"
  },
  marqueeWrapper: {
    overflow: "hidden",
    whiteSpace: "nowrap"
  },
  marqueeText: {
    display: "inline-block",
    margin: 0,
    fontSize: "13px",
    color: "#ddd6fe"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    padding: "0 20px 20px 20px"
  },
  statCard: {
    padding: "16px",
    borderRadius: "16px",
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  statBlue: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)"
  },
  statGreen: {
    background: "linear-gradient(135deg, #0f172a 0%, #065f46 100%)"
  },
  statPurple: {
    background: "linear-gradient(135deg, #0f172a 0%, #581c87 100%)"
  },
  statOrange: {
    background: "linear-gradient(135deg, #0f172a 0%, #7c2d12 100%)"
  },
  statIconWrap: {
    marginBottom: "8px"
  },
  statIcon: {
    fontSize: "20px"
  },
  statTitle: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8"
  },
  statValue: {
    margin: "4px 0 0 0",
    fontSize: "18px",
    fontWeight: "800",
    color: "#fff"
  },
  statGlow: {
    position: "absolute",
    right: "-10px",
    bottom: "-10px",
    width: "50px",
    height: "50px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "50%"
  },

  actionPanel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    padding: "0 20px 20px 20px"
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    textAlign: "left",
    position: "relative",
    overflow: "hidden"
  },
  actionIconCircle: {
    fontSize: "22px"
  },
  actionTextBox: {
    flex: 1
  },
  actionTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff"
  },
  actionSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "10px",
    color: "#94a3b8"
  },
  actionShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
  },

  actionInvest: { background: "#0f172a" },
  actionMyInvestment: { background: "#0f172a" },
  actionWallet: { background: "#0f172a" },
  actionWithdraw: { background: "#0f172a" },
  actionRefer: { background: "#0f172a" },
  actionTransaction: { background: "#0f172a" },
  actionKyc: { background: "#0f172a" },
  actionReward: { background: "#0f172a" },
  actionBank: { background: "#0f172a" },
  actionPlan: { background: "#0f172a" },
  actionNotification: { background: "#0f172a" },
  actionSupport: { background: "#0f172a" },

  sectionTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 20px"
  },
  sectionLine: {
    flex: 1,
    height: "1px",
    background: "#1e293b"
  },
  sectionTitleText: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1px"
  },

  promoBanner: {
    margin: "10px 20px 20px 20px",
    padding: "20px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid #6d28d9"
  },
  promoContent: {
    flex: 1
  },
  promoButton: {
    marginTop: "12px",
    background: "#38bdf8",
    color: "#0f172a",
    border: "none",
    padding: "8px 16px",
    borderRadius: "10px",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },
  promoIcon: {
    fontSize: "40px"
  },

  trustPanel: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    padding: "0 20px 20px 20px"
  },
  trustMiniCard: {
    background: "#0f172a",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  trustIconCircle: {
    fontSize: "18px"
  },
  trustTitle: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "700",
    color: "#fff"
  },
  trustSubtitle: {
    margin: 0,
    fontSize: "10px",
    color: "#64748b"
  },

  aboutStrip: {
    width: "calc(100% - 40px)",
    margin: "0 20px 20px 20px",
    padding: "14px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    color: "#38bdf8",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer"
  },

  helpText: {
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "800",
    color: "#22c55e",
    margin: "0 0 20px 0"
  },

  footer: {
    padding: "20px",
    textAlign: "center",
    background: "#0a0f1d",
    borderTop: "1px solid #1e293b"
  },
  footerLinks: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
    margin: "15px 0"
  },
  footerLinkBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: "12px",
    cursor: "pointer"
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65px",
    background: "#0f172a",
    borderTop: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    zIndex: 1000
  },
  bottomNavItem: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer"
  },
  bottomNavItemActive: {
    color: "#38bdf8"
  },
  bottomNavIcon: {
    fontSize: "20px"
  },
  bottomNavText: {
    fontSize: "11px",
    fontWeight: "600"
  }
};
