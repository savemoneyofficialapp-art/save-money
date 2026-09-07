import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { API } from "../config";

export default function DailyReward() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");
  const localName = localStorage.getItem("name") || "User";

  const [user, setUser] = useState({});
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestUpdate, setLatestUpdate] = useState("No new announcement");
  const [latestUpdateText, setLatestUpdateText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);
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

  const go = (path) => {
    navigate(path);
  };

  const [result, setResult] = useState("");
  const [amount, setAmount] = useState(null);
  const [special, setSpecial] = useState(false);
  const [history, setHistory] = useState([]);
  const [walletId, setWalletId] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(false);

  // Transaction Popup and Ref
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);

  // 🔄 All Total History Fetch Function
  const fetchHistory = async () => {
    const currentEmail = localStorage.getItem("email");
    const currentToken = localStorage.getItem("token");

    if (!currentEmail) {
      console.error("Email not found in localStorage");
      return;
    }

    try {
      const res = await fetch(`${API}/daily-reward/${currentEmail}`, {
        method: "GET",
        headers: {
          authorization: currentToken || "",
        },
      });
      const data = await res.json();
      
      if (res.ok && data) {
        let rawHistory = [];
        
        if (data.reward && Array.isArray(data.reward.history)) {
          rawHistory = data.reward.history;
        } else if (data.history && Array.isArray(data.history)) {
          rawHistory = data.history;
        } else if (Array.isArray(data.reward)) {
          rawHistory = data.reward;
        } else if (Array.isArray(data)) {
          rawHistory = data;
        }

        const finalHistory = Array.isArray(rawHistory) ? [...rawHistory].reverse() : [];
        const parsedWalletId = data.walletId || `WL-${currentEmail.split('@')[0].toUpperCase()}`;

        setHistory(finalHistory);
        setWalletId(parsedWalletId);
      }
    } catch (err) {
      console.error("Fetch history internal track error:", err);
    }
  };

  // 🚀 পেজ লোড হলে হিস্ট্রি রেন্ডার
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    fetchHistory();
    loadNotifications();
    loadLatestUpdate();
    registerPushNotification();
  }, []); 

  // 🎁 Reward Claim Function
  const claim = async () => {
    try {
      setLoading(true);
      setResult("");
      setAmount(null);

      const res = await fetch(`${API}/daily-reward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        setResult(data.msg || data.error || "Reward claim failed");
        fetchHistory();
        return;
      }

      setResult(data.msg || "Reward Claimed Successfully");
      setAmount(data.amount || 0);
      setSpecial(data.special || false);
      setPopup(true);
      
      fetchHistory(); 
      setTimeout(() => setPopup(false), 4000);
    } catch (err) {
      console.log("Daily reward fetch error:", err);
      toast.error("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!receiptRef.current) return;
    try {
      toast.info("Preparing receipt...");
      
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 2, 
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const txRef = selectedTx.date ? new Date(selectedTx.date).getTime() : "Daily";
        const file = new File([blob], `Receipt-${txRef}.png`, { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Daily Reward Receipt",
            text: `Hey! I just earned ₹${selectedTx.rewardAmt} from Daily Loot Box! 🎉`,
          });
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `Receipt_Earned_₹${selectedTx.rewardAmt}.png`;
          link.click();
          
          const textMessage = encodeURIComponent(`I just claimed my Daily Reward! Earned: ₹${selectedTx.rewardAmt}. Receipt downloaded!`);
          window.open(`https://api.whatsapp.com/send?text=${textMessage}`, "_blank");
          toast.success("Receipt downloaded!");
        }
      }, "image/png");
    } catch (error) {
      console.error("WhatsApp share error:", error);
      toast.error("Sharing failed.");
    }
  };

  const inWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return '';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[5] != 0) ? (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + ' ' : '';
    return str ? str + 'Rupees Only' : 'Rupees Only';
  };

  return (
    <div style={styles.container}>

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

          {/* SIDEBAR NAV BUTTONS - DIAMOND CUT & WATER TRANSPARENT */}
          <div style={styles.drawerNavList}>
            {/* 1. Dashboard */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavDashboard,
                ...(location.pathname === "/home" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/home"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>🏠</span>
              <span style={styles.drawerNavText}>Dashboard</span>
            </button>

            {/* 2. My Investment */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavMyInvestment,
                ...(location.pathname === "/my-investment" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/my-investment"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>📈</span>
              <span style={styles.drawerNavText}>My Investment</span>
            </button>

            {/* 3. Save Money */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavSaveMoney,
                ...(location.pathname === "/save-money" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/save-money"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>💰</span>
              <span style={styles.drawerNavText}>Save Money</span>
            </button>

            {/* 4. One Time */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavOneTime,
                ...(location.pathname === "/one-time" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/one-time"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>⚡</span>
              <span style={styles.drawerNavText}>One Time</span>
            </button>

            {/* 5. PLAN (PDF Download) */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavPlan
              }} 
              onClick={() => { handleDownloadPlan(); setIsDrawerOpen(false); }}
              disabled={isDownloadingPlan}
            >
              <span style={styles.drawerNavIcon}>{isDownloadingPlan ? "⏳" : "📋"}</span>
              <span style={styles.drawerNavText}>{isDownloadingPlan ? "Downloading..." : "Plan PDF"}</span>
            </button>

            {/* Add Fund */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavAddFund,
                ...(location.pathname === "/wallet" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/wallet"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>🌐</span>
              <span style={styles.drawerNavText}>Add Fund</span>
            </button>

            {/* Refer (refer.js) */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavRefer,
                ...(location.pathname === "/refer" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/refer"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>👥</span>
              <span style={styles.drawerNavText}>Refer & Earn</span>
            </button>

            {/* Withdraw (withdraw.js) */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavWithdraw,
                ...(location.pathname === "/withdraw" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/withdraw"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>➔</span>
              <span style={styles.drawerNavText}>Withdraw</span>
            </button>

            {/* Daily Reward (dailyreward.js) */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavDailyReward,
                ...(location.pathname === "/daily-reward" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/daily-reward"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>🎁</span>
              <span style={styles.drawerNavText}>Daily Reward</span>
            </button>

            {/* Investment Assistance */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavInvestmentAssistant,
                ...(location.pathname === "/investment-assistant" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/investment-assistant"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>📊</span>
              <span style={styles.drawerNavText}>Investment Assistance</span>
            </button>

            {/* Support */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavSupport,
                ...(location.pathname === "/support" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/support"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>🎧</span>
              <span style={styles.drawerNavText}>Support</span>
            </button>

            {/* Profile */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavProfile,
                ...(location.pathname === "/kyc" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { go("/kyc"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>👤</span>
              <span style={styles.drawerNavText}>Profile</span>
            </button>

            {/* Logout */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavLogout
              }} 
              onClick={() => { setIsDrawerOpen(false); handleLogout(); }}
            >
              <span style={styles.drawerNavIcon}>🚪</span>
              <span style={styles.drawerNavText}>Logout</span>
            </button>
          </div>

          {/* 👇 PLANT IMAGE CONTAINER AT THE BOTTOM */}
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

      {/* TOP HEADER */}
      <div style={styles.topHeader}>
        <button 
          style={styles.menuButton}
          onClick={() => setIsDrawerOpen(true)}
        >
          ☰
        </button>

        <h2 style={styles.headerTitle}>
          Daily Reward
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

      {popup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupCard}>
            <div style={styles.popupIcon}>{special ? "🎉" : "🎁"}</div>
            <h2 style={styles.popupTitle}>
              {special ? "Special Bonus Unlocked!" : "Claimed Successfully!"}
            </h2>
            <h1 style={styles.popupAmount}>₹{amount}</h1>
            <p style={styles.popupText}>Successfully added to your wallet balance</p>
            <button style={styles.popupCloseBtn} onClick={() => setPopup(false)}>Awesome</button>
          </div>
        </div>
      )}
      
      <div style={styles.heroCard}>
        <div style={styles.cardGlow}></div>
        <div style={styles.badgeContainer}>
          <span style={styles.badgeText}>✨ STREAK BONUS AVAILABLE</span>
        </div>
        <h1 style={styles.mainTitle}>Daily Loot Box</h1>
        <p style={styles.subtitle}>
          Claim your free mystery credits every 24 hours. Get huge multipliers on every <span style={{color: "#ffd700", fontWeight: "bold"}}>10th streak</span> claim!
        </p>
        <div style={styles.giftWrapper}>
          <div style={styles.giftPulse}></div>
          <div style={styles.giftBoxInner}>
            <span style={styles.giftEmoji}>🎁</span>
          </div>
        </div>
        <button
          style={{ 
            ...styles.claimBtn, 
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer" 
          }}
          onClick={claim}
          disabled={loading}
        >
          {loading ? "Opening Box..." : "Unlock Daily Reward"}
        </button>
        {result && (
          <div style={{
            ...styles.resultMessage,
            borderColor: amount ? "#22c55e" : "#ef4444",
            background: amount ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            color: amount ? "#4ade80" : "#f87171"
          }}>
            <p style={{ margin: 0, fontWeight: "600" }}>{result}</p>
            {amount !== null && <p style={styles.resultAmountText}>Earned: +₹{amount}</p>}
          </div>
        )}
      </div>

      {/* 📜 Reward Logs Section */}
      <div style={styles.historySection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.historyTitle}>📜 Claim Logs</h3>
          <span style={styles.historyCounter}>{history.length} Total Logs</span>
        </div>

        {history.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={{ margin: 0 }}>No transactions found.</p>
          </div>
        ) : (
          <div style={styles.logsContainer}>
            {history.map((h, i) => {
              const isSpecial = h.special;
              const rewardAmt = h.amount || 0;
              const logDate = h.date;
              
              return (
                <div key={i} style={styles.logRow} onClick={() => setSelectedTx({ ...h, rewardAmt })}>
                  <div style={styles.logLeft}>
                    <div style={{
                      ...styles.logIconCircle,
                      background: isSpecial ? "#ede9fe" : "#e0f2fe",
                      color: isSpecial ? "#7c3aed" : "#0284c7"
                    }}>
                      {isSpecial ? "⭐" : "🎁"}
                    </div>
                    <div>
                      <b style={styles.logType}>
                        {isSpecial ? "Special Multiplier Box" : "Daily Reward Loot"}
                      </b>
                      <span style={styles.logDate}>
                        Received: {logDate ? new Date(logDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} at {logDate ? new Date(logDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                      <div style={styles.moneyBadge}>
                        💵 Money Received
                      </div>
                    </div>
                  </div>
                  <div style={styles.logRight}>
                    <span style={styles.logAmount}>
                      + ₹{rewardAmt}
                    </span>
                    <span style={styles.inText}>In Wallet ➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedTx && (
        <div style={styles.receiptOverlay}>
          <div style={styles.popupModalCard}>
            <div style={styles.receiptHeaderBar}>
              <button style={styles.backBtn} onClick={() => setSelectedTx(null)}>✕ Close</button>
              <button style={styles.whatsappBtn} onClick={handleWhatsAppShare}>
                🟢 Share WhatsApp
              </button>
            </div>

            <div style={styles.receiptScrollContainer}>
              <div ref={receiptRef} style={styles.receiptCard}>
                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>Amount Received</span>
                  <div style={styles.receiptAmountRow}>
                    <h1 style={styles.receiptAmount}>₹{selectedTx.rewardAmt}</h1>
                    <span style={styles.verifiedCheck}>✓</span>
                  </div>
                  <p style={styles.amountInWords}>{inWords(selectedTx.rewardAmt)}</p>
                  <div style={styles.moneyReceivedTag}>
                    💰 Money Received
                  </div>
                </div>

                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>From</span>
                  <div style={styles.profileRow}>
                    <div style={styles.receiptAvatar}>
                      {selectedTx.special ? "🎁" : "⚙️"}
                    </div>
                    <div style={styles.profileDetails}>
                      <h4 style={styles.profileName}>
                        {selectedTx.special ? "Special Multiplier Reward" : "Daily Check-in System"} <span style={styles.blueTick}>✓</span>
                      </h4>
                      <p style={styles.upiId}>REF ID: REF{selectedTx.date ? new Date(selectedTx.date).getTime() : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div style={styles.receiptSectionBox}>
                  <span style={styles.fieldLabel}>To (Wallet Account)</span>
                  <div style={styles.profileRow}>
                    <div style={{...styles.receiptAvatar, backgroundColor: '#f0fdf4', color: '#166534'}}>
                      👤
                    </div>
                    <div style={styles.profileDetails}>
                      <h4 style={styles.profileName}>User Account</h4>
                      <p style={styles.upiId}><b>Wallet ID:</b> {walletId}</p>
                      <p style={styles.bankName}>Status: Credited Successfully</p>
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  <p style={styles.timeText}>
                    <b>Date:</b> {selectedTx.date ? new Date(selectedTx.date).toLocaleDateString([], {day:'numeric', month:'long', year:'numeric'}) : 'N/A'}
                  </p>
                  <p style={styles.timeText}>
                    <b>Time:</b> {selectedTx.date ? new Date(selectedTx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : 'N/A'}
                  </p>
                  <p style={styles.refText}>
                    <b>Ref No:</b> REF{selectedTx.date ? new Date(selectedTx.date).getTime() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
  // 👇 SLIDE BAR / DRAWER STYLES
  drawerOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(6px)",
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
    background: "#08101e",
    width: "240px",
    height: "100vh",
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "10px 0 30px rgba(0,0,0,0.85)",
    borderRight: "1px solid #1e293b",
    transform: "translateX(-100%)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
    zIndex: 100003
  },
  drawerHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    flexShrink: 0
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px"
  },
  drawerLogoWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #03251a 0%, #064e3b 100%)",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 12px rgba(34, 197, 94, 0.35)"
  },
  drawerLogoImg: {
    width: "28px",
    height: "28px",
    objectFit: "contain"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "0.8px",
    textAlign: "center"
  },
  drawerLogoSubtext: {
    fontSize: "10px",
    color: "#a7f3d0",
    fontWeight: "600",
    marginTop: "1px",
    textAlign: "center"
  },
  drawerNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexShrink: 0,
    overflowY: "auto",
    maxHeight: "calc(100vh - 200px)"
  },
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 14px",
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.25s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
  },
  drawerNavItemActive: {
    background: "rgba(255, 255, 255, 0.25)",
    border: "1px solid #ffffff",
    boxShadow: "0 0 16px rgba(255, 255, 255, 0.4)",
    fontWeight: "800"
  },
  drawerNavIcon: {
    fontSize: "18px",
    width: "22px",
    display: "inline-block",
    textAlign: "center"
  },
  drawerNavText: {
    flex: 1,
    fontSize: "13px",
    letterSpacing: "0.3px"
  },
  drawerNavDashboard: {
    background: "rgba(59, 130, 246, 0.2)",
    border: "1px solid rgba(59, 130, 246, 0.4)"
  },
  drawerNavMyInvestment: {
    background: "rgba(16, 185, 129, 0.2)",
    border: "1px solid rgba(16, 185, 129, 0.4)"
  },
  drawerNavSaveMoney: {
    background: "rgba(245, 158, 11, 0.2)",
    border: "1px solid rgba(245, 158, 11, 0.4)"
  },
  drawerNavOneTime: {
    background: "rgba(168, 85, 247, 0.2)",
    border: "1px solid rgba(168, 85, 247, 0.4)"
  },
  drawerNavPlan: {
    background: "rgba(6, 182, 212, 0.2)",
    border: "1px solid rgba(6, 182, 212, 0.4)"
  },
  drawerNavAddFund: {
    background: "rgba(20, 184, 166, 0.2)",
    border: "1px solid rgba(20, 184, 166, 0.4)"
  },
  drawerNavRefer: {
    background: "rgba(236, 72, 153, 0.2)",
    border: "1px solid rgba(236, 72, 153, 0.4)"
  },
  drawerNavWithdraw: {
    background: "rgba(249, 115, 22, 0.2)",
    border: "1px solid rgba(249, 115, 22, 0.4)"
  },
  drawerNavDailyReward: {
    background: "rgba(244, 63, 94, 0.2)",
    border: "1px solid rgba(244, 63, 94, 0.4)"
  },
  drawerNavInvestmentAssistant: {
    background: "rgba(2, 132, 199, 0.2)",
    border: "1px solid rgba(2, 132, 199, 0.4)"
  },
  drawerNavSupport: {
    background: "rgba(99, 102, 241, 0.2)",
    border: "1px solid rgba(99, 102, 241, 0.4)"
  },
  drawerNavProfile: {
    background: "rgba(236, 72, 153, 0.2)",
    border: "1px solid rgba(236, 72, 153, 0.4)"
  },
  drawerNavLogout: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid rgba(239, 68, 68, 0.4)"
  },
  treePlantOnlyWrapper: {
    flex: 1,
    minHeight: 0,
    marginTop: "10px",
    marginBottom: "4px",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.4)"
  },
  treePlantOnlyImg: {
    width: "90%",
    height: "65%",
    objectFit: "95%",
    borderRadius: "16px"
  },
  topHeader: {
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px"
  },
  menuButton: {
    background: "transparent",
    border: "none",
    color: "#0f172a",
    fontSize: "30px",
    cursor: "pointer"
  },
  headerTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "800",
    color: "#0f172a"
  },
  logoutBtn: {
    height: "42px",
    padding: "0 18px",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    background: "rgba(239, 68, 68, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)",
    color: "#0f172a",
    fontWeight: "800",
    fontSize: "14px",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
    cursor: "pointer"
  },
  notificationButton: {
    position: "relative",
    background: "transparent",
    border: "none",
    color: "#0f172a",
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
  container: { minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: "10px 14px 80px", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "20px" },
  heroCard: { position: "relative", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "24px", padding: "24px 16px", textAlign: "center", color: "#ffffff", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
  cardGlow: { position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)", width: "160px", height: "160px", background: "rgba(250, 204, 21, 0.12)", filter: "blur(50px)", borderRadius: "50%" },
  badgeContainer: { display: "inline-flex", background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.2)", padding: "4px 12px", borderRadius: "20px", marginBottom: "12px" },
  badgeText: { color: "#facc15", fontSize: "10px", fontWeight: "800" },
  mainTitle: { fontSize: "26px", fontWeight: "800", margin: "0 0 6px 0" },
  subtitle: { fontSize: "12px", color: "#94a3b8", margin: "0 auto 20px", maxWidth: "280px" },
  giftWrapper: { position: "relative", width: "100px", height: "100px", margin: "0 auto 20px" },
  giftPulse: { position: "absolute", inset: "0px", borderRadius: "50%", background: "radial-gradient(circle, rgba(234, 179, 8, 0.25) 0%, transparent 70%)" },
  giftBoxInner: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #facc15 0%, #ca8a04 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "10px auto" },
  giftEmoji: { fontSize: "40px" },
  claimBtn: { width: "100%", padding: "14px", border: "none", borderRadius: "14px", background: "linear-gradient(135deg, #facc15 0%, #eab308 100%)", color: "#0f172a", fontWeight: "700", fontSize: "15px", cursor: "pointer" },
  resultMessage: { marginTop: "16px", padding: "10px", borderRadius: "12px", border: "1px solid", fontSize: "12px" },
  resultAmountText: { margin: "2px 0 0", fontWeight: "700" },
  historySection: { display: "flex", flexDirection: "column", gap: "10px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  historyTitle: { margin: 0, fontSize: "15px", color: "#334155", fontWeight: "700" },
  historyCounter: { fontSize: "11px", color: "#64748b" },
  emptyCard: { background: "#ffffff", padding: "20px", borderRadius: "16px", color: "#64748b", textAlign: "center", border: "1px solid #e2e8f0" },
  logsContainer: { display: "flex", flexDirection: "column", background: "#ffffff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" },
  logRow: { padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: "#ffffff" },
  logLeft: { display: "flex", alignItems: "center", gap: "10px" },
  logIconCircle: { width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
  logType: { display: "block", fontSize: "13px", color: "#0f172a" },
  logDate: { display: "block", fontSize: "11px", color: "#64748b" },
  moneyBadge: { display: "inline-block", background: "#dcfce7", color: "#15803d", fontSize: "10px", padding: "2px 6px", borderRadius: "8px", marginTop: "4px", fontWeight: "600" },
  logRight: { textAlign: "right" },
  logAmount: { fontSize: "15px", fontWeight: "700", color: "#16a34a", display: "block" },
  inText: { fontSize: "10px", color: "#94a3b8" },
  popupOverlay: { position: "fixed", inset: "0", background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999 },
  popupCard: { background: "#0f172a", border: "2px solid #eab308", borderRadius: "24px", padding: "24px", textAlign: "center", width: "280px", color: "#ffffff" },
  popupIcon: { fontSize: "48px" },
  popupTitle: { fontSize: "16px", margin: "6px 0" },
  popupAmount: { color: "#22c55e", fontSize: "36px", margin: "10px 0" },
  popupText: { color: "#94a3b8", fontSize: "12px" },
  popupCloseBtn: { width: "100%", padding: "10px", background: "#1e293b", color: "#fff", border: "none", borderRadius: "8px", marginTop: "12px", cursor: "pointer" },
  receiptOverlay: { position: "fixed", inset: "0px", background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", justifyContent: "center", alignItems: "center", padding: "12px" },
  popupModalCard: { background: "#f8fafc", width: "100%", maxWidth: "400px", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", maxHeight: "90vh" },
  receiptHeaderBar: { background: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" },
  backBtn: { background: "none", border: "none", fontSize: "15px", fontWeight: "600", color: "#ef4444", cursor: "pointer" },
  whatsappBtn: { background: "#25D366", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "12px", fontWeight: "700", fontSize: "13px", cursor: "pointer" },
  receiptScrollContainer: { flex: 1, overflowY: "auto", padding: "12px" },
  receiptCard: { background: "#f8fafc", display: "flex", flexDirection: "column", gap: "10px", padding: "4px" },
  receiptSectionBox: { background: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #e2e8f0" },
  fieldLabel: { fontSize: "11px", color: "#64748b", fontWeight: "600" },
  receiptAmountRow: { display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" },
  receiptAmount: { fontSize: "30px", fontWeight: "800", color: "#0f172a", margin: 0 },
  verifiedCheck: { width: "20px", height: "20px", background: "#22c55e", color: "#ffffff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold" },
  amountInWords: { fontSize: "12px", color: "#475569", margin: "4px 0 10px" },
  moneyReceivedTag: { display: "inline-block", background: "#dcfce7", color: "#16a34a", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  profileRow: { display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" },
  receiptAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" },
  profileDetails: { flex: 1 },
  profileName: { margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  blueTick: { color: "#38bdf8", fontSize: "12px" },
  upiId: { margin: "2px 0 0", fontSize: "11px", color: "#64748b", wordBreak: "break-all" },
  bankName: { margin: "2px 0 0", fontSize: "11px", color: "#16a34a", fontWeight: "600" },
  divider: { height: "1px", background: "#e2e8f0", margin: "12px 0" },
  timeText: { fontSize: "12px", color: "#334155", margin: "0 0 4px" },
  refText: { fontSize: "12px", color: "#334155", margin: 0 },
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
