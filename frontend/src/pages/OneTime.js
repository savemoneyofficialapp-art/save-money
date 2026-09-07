import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API } from "../config";

export default function OneTime() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  // ----------------- SIDEBAR & PLAN STATES -----------------
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);

  // ----------------- DASHBOARD STATES -----------------
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [oneTimerNotifications, setOneTimerNotifications] = useState([]);
  const [history, setHistory] = useState([]);

  // Dynamic Dashboard Stats
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    availableBalance: 0
  });

  // Active Investment Tracking
  const [activeInvestment, setActiveInvestment] = useState(null);

  // Investment Form State
  const [tenure, setTenure] = useState(15);
  const [rate, setRate] = useState(0.6);
  const [frequency, setFrequency] = useState("daily");
  const [amount, setAmount] = useState(5000);
  const [investing, setInvesting] = useState(false);

  // Modals State
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Deposit Form State
  const [txnId, setTxnId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [depositing, setDepositing] = useState(false);

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    ifsc: "",
    bankName: "",
    holderName: ""
  });

  // Selected Withdraw Amount
  const [selectedWithdrawAmount, setSelectedWithdrawAmount] = useState(100);
  const [withdrawing, setWithdrawing] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });

  const triggerToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "info" }), 3500);
  };

  const COMPANY_WALLET_ADDRESS = "0x53D944eDA838748A92F2c361d2F71cD7EcFc8643";

  // Safe wallet balance calculation
  const currentWalletBalance = Number(
    stats.availableBalance || user?.otbalance || user?.otBalance || user?.availableBalance || 0
  );

  const tenurePlans = [
    { days: 15, rate: 0.6, label: "15 Days (0.6%)" },
    { days: 30, rate: 0.8, label: "30 Days (0.8%)" },
    { days: 40, rate: 1.0, label: "40 Days (1.0%)" },
    { days: 60, rate: 1.5, label: "60 Days (1.5%)" },
    { days: 100, rate: 2.0, label: "100 Days (2.0%)" }
  ];

  const presetAmounts = [
    { label: "5k", value: 5000, desc: "Starter", color: "linear-gradient(135deg, #22c55e, #16a34a)" },
    { label: "7.5k", value: 7500, desc: "Basic", color: "linear-gradient(135deg, #0ea5e9, #0284c7)" },
    { label: "10k", value: 10000, desc: "Popular", color: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
    { label: "50k", value: 50000, desc: "Pro", color: "linear-gradient(135deg, #f59e0b, #d97706)" },
    { label: "100k", value: 100000, desc: "VIP", color: "linear-gradient(135deg, #ec4899, #db2777)" },
    { label: "500k", value: 500000, desc: "Master", color: "linear-gradient(135deg, #6366f1, #4f46e5)" }
  ];

  const withdrawPresets = [100, 300, 500, 1000, 10000];

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ----------------- PLAN PDF DOWNLOAD -----------------
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

  // ----------------- LOGOUT HANDLER -----------------
  const handleLogout = async () => {
    try {
      if (email) {
        await fetch(`${API}/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  // ----------------- AUTO-SYNC ACTIVE INVESTMENT TO FORM FIELDS -----------------
  useEffect(() => {
    if (activeInvestment) {
      if (activeInvestment.amount) {
        setAmount(Number(activeInvestment.amount));
      }

      let days = 15;
      if (typeof activeInvestment.duration === "number") {
        days = activeInvestment.duration;
      } else if (typeof activeInvestment.duration === "string") {
        const match = activeInvestment.duration.match(/\d+/);
        if (match) days = parseInt(match[0], 10);
      } else if (activeInvestment.durationDays) {
        days = Number(activeInvestment.durationDays);
      }

      const matchedPlan = tenurePlans.find((p) => p.days === days);
      if (matchedPlan) {
        setTenure(matchedPlan.days);
        setRate(matchedPlan.rate);
      } else {
        setTenure(days);
        if (activeInvestment.dailyReturn && activeInvestment.amount) {
          const calcRate = (Number(activeInvestment.dailyReturn) / Number(activeInvestment.amount)) * 100;
          setRate(calcRate);
        }
      }

      if (activeInvestment.frequency) {
        setFrequency(activeInvestment.frequency.toLowerCase());
      }
    } else {
      setTenure(15);
      setRate(0.6);
      setFrequency("daily");
      setAmount(5000);
    }
  }, [activeInvestment]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/onetime/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user || {});
        setOneTimerNotifications(data.oneTimerNotifications || []);

        const rawHistory = Array.isArray(data.history)
          ? data.history
          : Array.isArray(data.onetimeHistory)
          ? data.onetimeHistory
          : Array.isArray(data.user?.onetimeHistory)
          ? data.user.onetimeHistory
          : [];

        const rawDeposits = Array.isArray(data.deposits)
          ? data.deposits.map((d) => ({ ...d, type: "Add Fund" }))
          : [];
        const rawWithdrawals = Array.isArray(data.withdrawals)
          ? data.withdrawals.map((w) => ({ ...w, type: "Withdrawal" }))
          : [];
        const rawInvestments = Array.isArray(data.investments)
          ? data.investments.map((i) => ({ ...i, type: "OneTimeInvestment" }))
          : [];

        const combined = [...rawHistory, ...rawDeposits, ...rawWithdrawals, ...rawInvestments];

        const uniqueMap = new Map();
        combined.forEach((item) => {
          const key = item._id || `${item.type}-${item.createdAt || item.startDate}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          }
        });

        const sortedHistory = Array.from(uniqueMap.values()).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.startDate || 0);
          const dateB = new Date(b.createdAt || b.startDate || 0);
          return dateB - dateA;
        });

        setHistory(sortedHistory);

        const exactOneTimeEarnings = Number(
          data.stats?.totalEarnings ?? data.user?.oneTimeTotalEarnings ?? data.user?.totalEarnings ?? 0
        );

        let calculatedInv = 0;
        let calculatedWd = 0;

        sortedHistory.forEach((item) => {
          const t = (item.type || "").toLowerCase();
          if (t.includes("investment") || t === "onetimeinvestment") {
            if (item.status === "Active" || item.status === "Completed") {
              calculatedInv += Number(item.amount || 0);
            }
          }
          if (t === "withdrawal" && (item.status === "Approved" || item.status === "Accepted" || item.status === "Success")) {
            calculatedWd += Number(item.amount || 0);
          }
        });

        setStats({
          totalInvested: data.stats?.totalInvested ?? calculatedInv,
          totalEarnings: exactOneTimeEarnings,
          totalWithdrawn: data.stats?.totalWithdrawn || calculatedWd,
          availableBalance: Number(data.user?.otbalance || data.user?.otBalance || 0)
        });

        const active = data.activeInvestment || sortedHistory.find(
          (item) => (item.type === "OneTimeInvestment" || item.type === "Investment" || !item.type) && item.status === "Active"
        );
        setActiveInvestment(active || null);

        if (data.user?.bankDetails) {
          setBankForm(data.user.bankDetails);
        }
      } else {
        triggerToast(data.message || "Failed to load dashboard", "error");
      }
    } catch (err) {
      triggerToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Return Calculations
  const dailyReturn = useMemo(() => {
    if (activeInvestment && activeInvestment.dailyReturn) {
      return Number(activeInvestment.dailyReturn);
    }
    return (Number(amount) * Number(rate)) / 100;
  }, [amount, rate, activeInvestment]);

  const weeklyReturn = useMemo(() => dailyReturn * 7, [dailyReturn]);
  const totalReturn = useMemo(() => dailyReturn * tenure, [dailyReturn, tenure]);
  const totalPayout = useMemo(() => Number(amount) + totalReturn, [amount, totalReturn]);

  const handleTenureChange = (e) => {
    if (activeInvestment) return;
    const selectedDays = Number(e.target.value);
    const plan = tenurePlans.find((p) => p.days === selectedDays);
    if (plan) {
      setTenure(plan.days);
      setRate(plan.rate);
    }
  };

  // ----------------- START NEW INVESTMENT -----------------
  const handleStartInvestment = async () => {
    if (activeInvestment) {
      triggerToast("আপনার একটি ইনভেস্টমেন্ট বর্তমানে চলমান আছে। সেটি শেষ না হওয়া পর্যন্ত নতুন ইনভেস্ট করা যাবে না।", "error");
      return;
    }

    if (currentWalletBalance < amount) {
      triggerToast(`Insufficient balance! Your wallet balance is ₹${currentWalletBalance}. Please Add Fund first.`, "error");
      return;
    }

    try {
      setInvesting(true);
      const res = await fetch(`${API}/api/onetime/create-investment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          email,
          amount: Number(amount),
          duration: `${tenure} Days`,
          frequency,
          dailyReturn,
          status: "Active"
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("🚀 Investment Started Successfully!", "success");
        await loadDashboardData();
      } else {
        triggerToast(data.message || data.msg || "Failed to create investment", "error");
      }
    } catch (err) {
      triggerToast("Network error creating investment", "error");
    } finally {
      setInvesting(false);
    }
  };

  // ----------------- SUBMIT ADD FUND DEPOSIT -----------------
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!txnId) {
      triggerToast("Please enter Transaction ID / UTR No.", "error");
      return;
    }
    if (!screenshot) {
      triggerToast("Please select payment screenshot", "error");
      return;
    }

    try {
      setDepositing(true);
      const formData = new FormData();
      formData.append("email", email);
      formData.append("amount", amount);
      formData.append("transactionId", txnId);
      formData.append("screenshot", screenshot);

      const res = await fetch(`${API}/api/onetime/deposit-request`, {
        method: "POST",
        headers: { authorization: token },
        body: formData
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("Deposit request submitted! Status: Pending", "success");
        setShowAddFundModal(false);

        const newPendingDeposit = {
          _id: data.deposit?._id || Date.now().toString(),
          type: "Add Fund",
          amount: Number(amount),
          transactionId: txnId,
          status: "Pending",
          createdAt: new Date().toISOString()
        };

        setHistory((prev) => [newPendingDeposit, ...prev]);
        setTxnId("");
        setScreenshot(null);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Failed to submit deposit", "error");
      }
    } catch (err) {
      triggerToast("Error uploading deposit screenshot", "error");
    } finally {
      setDepositing(false);
    }
  };

  // ----------------- SAVE BANK DETAILS -----------------
  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (!bankForm.accountNumber || !bankForm.ifsc || !bankForm.bankName || !bankForm.holderName) {
      triggerToast("Please fill all bank details", "error");
      return;
    }

    try {
      const res = await fetch(`${API}/api/onetime/add-bank-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email, bankDetails: bankForm })
      });

      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, bankDetails: bankForm }));
        setShowBankModal(false);
        triggerToast("Bank Details Saved!", "success");
        setShowWithdrawModal(true);
      } else {
        triggerToast(data.message || "Failed to save bank details", "error");
      }
    } catch (err) {
      triggerToast("Failed to save bank details", "error");
    }
  };

  // ----------------- WITHDRAWAL -----------------
  const handleWithdrawClick = () => {
    if (!user.bankDetails || !user.bankDetails.accountNumber) {
      setShowBankModal(true);
    } else {
      setShowWithdrawModal(true);
    }
  };

  const handleWithdrawSubmit = async () => {
    if (currentWalletBalance < selectedWithdrawAmount) {
      triggerToast(`Insufficient Wallet Balance! Your balance is ₹${currentWalletBalance}`, "error");
      return;
    }

    try {
      setWithdrawing(true);
      const res = await fetch(`${API}/api/onetime/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ 
          email, 
          amount: selectedWithdrawAmount,
          bankDetails: user.bankDetails 
        })
      });

      const data = await res.json();
      if (res.ok || data.success) {
        triggerToast("Withdrawal Request Submitted!", "success");
        setShowWithdrawModal(false);
        await loadDashboardData();
      } else {
        triggerToast(data.message || "Withdrawal Failed", "error");
      }
    } catch (err) {
      triggerToast("Network error during withdrawal", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(COMPANY_WALLET_ADDRESS);
    triggerToast("Wallet Address Copied!", "success");
  };

  const fileUrl = (file) => {
    if (!file) return "";
    return file.startsWith("http") ? file : `${API}/uploads/${file}`;
  };

  const profilePhoto = fileUrl(user?.photo || user?.profilePhoto || "");

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <h3>Loading OneTime Investment...</h3>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* 👇 SIDEBAR DRAWER (FROM HOME.JS) */}
      <div 
        style={{
          ...styles.drawerOverlay,
          opacity: isDrawerOpen ? 1 : 0,
          visibility: isDrawerOpen ? "visible" : "hidden"
        }} 
        onClick={() => setIsDrawerOpen(false)}
      >
        <div 
          style={{
            ...styles.drawerContainer,
            transform: isDrawerOpen ? "translateX(0)" : "translateX(-100%)"
          }} 
          onClick={(e) => e.stopPropagation()}
        >
          {/* LOGO & BRANDING */}
          <div style={styles.drawerHeader}>
            <div style={styles.drawerBrand}>
              <div style={styles.drawerLogoWrapper}>
                <img 
                  src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"} 
                  alt="SM Logo" 
                  style={styles.drawerLogoImg} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={styles.drawerLogoText}>SAVE MONEY</h3>
                <span style={styles.drawerLogoSubtext}>Invest Small, Earn Big</span>
              </div>
            </div>
          </div>

          {/* SIDEBAR NAV BUTTONS */}
          <div style={styles.drawerNavList}>
            {/* 1. Dashboard */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavDashboard,
                ...(location.pathname === "/home" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { navigate("/home"); setIsDrawerOpen(false); }}
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
              onClick={() => { navigate("/my-investment"); setIsDrawerOpen(false); }}
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
              onClick={() => { navigate("/save-money"); setIsDrawerOpen(false); }}
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
              onClick={() => { navigate("/one-time"); setIsDrawerOpen(false); }}
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
              onClick={() => { navigate("/wallet"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>🌐</span>
              <span style={styles.drawerNavText}>Add Fund</span>
            </button>

            {/* Refer */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavRefer,
                ...(location.pathname === "/refer" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { navigate("/refer"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>👥</span>
              <span style={styles.drawerNavText}>Refer & Earn</span>
            </button>

            {/* Withdraw */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavWithdraw,
                ...(location.pathname === "/withdraw" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { navigate("/withdraw"); setIsDrawerOpen(false); }}
            >
              <span style={styles.drawerNavIcon}>➔</span>
              <span style={styles.drawerNavText}>Withdraw</span>
            </button>

            {/* Daily Reward */}
            <button 
              style={{
                ...styles.drawerNavItem,
                ...styles.drawerNavDailyReward,
                ...(location.pathname === "/daily-reward" ? styles.drawerNavItemActive : {})
              }} 
              onClick={() => { navigate("/daily-reward"); setIsDrawerOpen(false); }}
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
              onClick={() => { navigate("/investment-assistant"); setIsDrawerOpen(false); }}
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
              onClick={() => { navigate("/support"); setIsDrawerOpen(false); }}
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
              onClick={() => { navigate("/kyc"); setIsDrawerOpen(false); }}
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

          {/* PLANT IMAGE AT BOTTOM OF DRAWER */}
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

      <div style={styles.container}>
        {/* Toast Alert */}
        {toast.show && (
          <div style={{ ...styles.toast, background: toast.type === "error" ? "#ef4444" : "#16a34a" }}>
            {toast.msg}
          </div>
        )}

        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.brand}>
            {/* Hamburger Menu Button */}
            <button 
              style={styles.menuButton}
              onClick={() => setIsDrawerOpen(true)}
            >
              ☰
            </button>

            <img
              src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"}
              alt="Logo"
              style={styles.logoImg}
              onError={(e) => (e.target.style.display = "none")}
            />
            <div>
              <h1 style={styles.brandTitle}>
                SAVE <span style={{ color: "#22c55e" }}>MONEY</span>
              </h1>
              <p style={styles.brandSubtitle}>Invest Small, Earn Big</p>
            </div>
          </div>

          <div style={styles.welcomeBox}>
            <strong style={styles.welcomeTitle}>Welcome Back! 👋</strong>
            <span style={styles.welcomeSub}>Invest smartly & secure your future</span>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.notifIconContainer} title="Notifications">
              <span style={{ fontSize: "22px" }}>🔔</span>
              {oneTimerNotifications.length > 0 && (
                <span style={styles.notifBadge}>{oneTimerNotifications.length}</span>
              )}
            </div>

            <div style={styles.profileCircle}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="User Profile" style={styles.profileImg} />
              ) : (
                <span style={{ fontSize: "22px", color: "#16a34a" }}>👤</span>
              )}
            </div>
          </div>
        </header>

        {/* TOP IMAGE BANNER (chhote nivesh.png) */}
        <div style={styles.bannerWrapper}>
          <img 
            src="/chhote nivesh.png" 
            alt="Chhote Nivesh" 
            style={styles.bannerImage}
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>

        {/* TOP STATS CARD */}
        <section style={styles.summaryCard}>
          <div style={styles.statBox}>
            <span style={styles.statIcon}>👛</span>
            <span style={styles.statTitle}>Total Invested</span>
            <strong style={styles.statValue}>
              ₹ {Number(stats.totalInvested || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statIcon}>💵</span>
            <span style={styles.statTitle}>Total Earnings</span>
            <strong style={{ ...styles.statValue, color: "#86efac" }}>
              ₹ {Number(stats.totalEarnings || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statIcon}>💸</span>
            <span style={styles.statTitle}>Total Withdraw</span>
            <strong style={styles.statValue}>
              ₹ {Number(stats.totalWithdrawn || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div style={{ ...styles.statBox, borderRight: "none" }}>
            <span style={styles.statIcon}>🪙</span>
            <span style={styles.statTitle}>Available Balance</span>
            <strong style={{ ...styles.statValue, color: "#fef08a" }}>
              ₹ {currentWalletBalance.toLocaleString("en-IN")}
            </strong>
          </div>
        </section>

        {/* MAKE NEW INVESTMENT PANEL */}
        <section style={styles.mainCard}>
          <h2 style={styles.cardTitle}>
            Make a New Investment
            <div style={styles.titleLine}></div>
          </h2>

          {/* RUNNING ACTIVE INVESTMENT CARD */}
          {activeInvestment && (
            <div style={styles.activeInvestCard}>
              <div style={styles.activeHeader}>
                <div style={styles.activeBadgeGroup}>
                  <span style={styles.activePulse}></span>
                  <strong style={styles.activeTitle}>ACTIVE INVESTMENT RUNNING</strong>
                </div>
                <span style={styles.activeStatusTag}>🟢 Live & Earning</span>
              </div>

              <div style={styles.activeStatsGrid}>
                <div style={styles.activeStatItem}>
                  <span style={styles.activeLabel}>Invested Amount</span>
                  <strong style={styles.activeValue}>₹{Number(activeInvestment.amount || 0).toLocaleString("en-IN")}</strong>
                </div>
                <div style={styles.activeStatItem}>
                  <span style={styles.activeLabel}>Plan Duration</span>
                  <strong style={styles.activeValue}>{activeInvestment.duration || `${activeInvestment.durationDays || tenure} Days`}</strong>
                </div>
                <div style={styles.activeStatItem}>
                  <span style={styles.activeLabel}>Daily Earnings</span>
                  <strong style={{ ...styles.activeValue, color: "#22c55e" }}>+₹{Number(dailyReturn).toFixed(2)} / day</strong>
                </div>
                <div style={styles.activeStatItem}>
                  <span style={styles.activeLabel}>Maturity Date</span>
                  <strong style={{ ...styles.activeValue, color: "#38bdf8" }}>
                    {activeInvestment.maturityDate ? new Date(activeInvestment.maturityDate).toLocaleDateString("en-GB") : "In Progress"}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* FORM FIELDS - AUTO LOCKED WHEN INVESTMENT IS ACTIVE */}
          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                📅 Select Duration {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒 Active)</span>}
              </label>
              <select
                style={{
                  ...styles.select,
                  ...(activeInvestment ? styles.lockedInput : {})
                }}
                value={tenure}
                onChange={handleTenureChange}
                disabled={!!activeInvestment}
              >
                {tenurePlans.map((p) => (
                  <option key={p.days} value={p.days}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                🔄 Return Frequency {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒 Active)</span>}
              </label>
              <div style={styles.frequencyToggle}>
                <button
                  type="button"
                  style={{
                    ...styles.freqBtn,
                    ...(frequency === "daily" ? styles.freqBtnActive : {}),
                    ...(activeInvestment ? styles.lockedBtn : {})
                  }}
                  onClick={() => !activeInvestment && setFrequency("daily")}
                  disabled={!!activeInvestment}
                >
                  Daily
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.freqBtn,
                    ...(frequency === "weekly" ? styles.freqBtnActive : {}),
                    ...(activeInvestment ? styles.lockedBtn : {})
                  }}
                  onClick={() => !activeInvestment && setFrequency("weekly")}
                  disabled={!!activeInvestment}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                💵 Select / Enter Amount {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒 Active)</span>}
              </label>
              <div 
                style={{
                  ...styles.amountInputWrap,
                  ...(activeInvestment ? styles.lockedInputWrap : {})
                }} 
                onClick={() => !activeInvestment && setShowAmountModal(true)}
              >
                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#16a34a" }}>₹</span>
                <input style={styles.amountInput} type="text" readOnly value={amount.toLocaleString("en-IN")} />
                <span style={activeInvestment ? styles.lockedBadge : styles.changeBadge}>
                  {activeInvestment ? "🔒 Locked" : "Change ⚙️"}
                </span>
              </div>
              <small style={styles.helpText}>
                {activeInvestment ? "Investment running - fields locked until maturity" : "Click to choose quick amount presets"}
              </small>
            </div>
          </div>

          <div style={styles.returnGrid}>
            {frequency === "daily" ? (
              <div style={styles.dailyReturnCard}>
                <div style={styles.returnCardTitle}>You Will Get Daily Return</div>
                <strong style={styles.returnCardValue}>₹ {dailyReturn.toFixed(2)}</strong>
                <span style={styles.returnCardNote}>(Approx. Return Per Day)</span>
              </div>
            ) : (
              <div style={styles.weeklyReturnCard}>
                <div style={{ ...styles.returnCardTitle, color: "#1557d6" }}>You Will Get Weekly Return</div>
                <strong style={{ ...styles.returnCardValue, color: "#1557d6" }}>₹ {weeklyReturn.toFixed(2)}</strong>
                <span style={styles.returnCardNote}>(Approx. Return Per Week)</span>
              </div>
            )}
          </div>

          <div style={styles.breakdownGrid}>
            <div style={styles.breakBox}>
              <span style={styles.breakLabel}>Investment Amount</span>
              <strong style={styles.breakValue}>₹ {Number(amount).toLocaleString("en-IN")}</strong>
            </div>
            <div style={styles.breakBox}>
              <span style={styles.breakLabel}>Duration</span>
              <strong style={styles.breakValue}>{tenure} Days ({rate}%)</strong>
            </div>
            <div style={styles.breakBox}>
              <span style={styles.breakLabel}>Total Return</span>
              <strong style={{ ...styles.breakValue, color: "#16a34a" }}>₹ {totalReturn.toLocaleString("en-IN")}</strong>
            </div>
            <div style={{ ...styles.breakBox, borderRight: "none" }}>
              <span style={styles.breakLabel}>Total Payout</span>
              <strong style={{ ...styles.breakValue, color: "#1d4ed8" }}>₹ {totalPayout.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <div style={styles.actionGridTriple}>
            <button 
              style={{
                ...styles.startInvestBtn,
                ...(activeInvestment ? styles.disabledBtn : {})
              }} 
              onClick={handleStartInvestment} 
              disabled={investing || !!activeInvestment}
            >
              {investing ? "Processing..." : activeInvestment ? "🔒 Active Running" : "🚀 Start Investment"}
            </button>

            <button style={styles.addInvestBtn} onClick={() => setShowAddFundModal(true)}>
              ➕ Add Fund
            </button>

            <button style={styles.withdrawBtn} onClick={handleWithdrawClick}>
              ➔ Withdraw
            </button>
          </div>
        </section>

        {/* HISTORY TABLE WITH PENDING, SUCCESS, REJECTED + REASON */}
        <section style={styles.historyCard}>
          <div style={styles.historyHeader}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Investment & Transaction History</h2>
            <span style={styles.viewAllBtn} onClick={loadDashboardData}>🔄 Refresh</span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Type / Description</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Frequency / Txn</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Maturity</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyTd}>No history found</td>
                  </tr>
                ) : (
                  history.map((item, idx) => {
                    const itemType = (item.type || "").toLowerCase();
                    const isDeposit = itemType.includes("add fund") || itemType.includes("deposit") || !!item.transactionId;
                    const isWithdraw = itemType.includes("withdraw");

                    const rawStatus = item.status || "Pending";
                    const isSuccess = ["approved", "accepted", "success", "active", "completed"].includes(rawStatus.toLowerCase());
                    const isRejected = ["rejected", "cancelled", "failed"].includes(rawStatus.toLowerCase());
                    const displayStatus = rawStatus.toLowerCase() === "active" ? "Active" : (isSuccess ? "Success" : isRejected ? "Rejected" : "Pending");

                    return (
                      <tr key={item._id || idx}>
                        <td style={styles.td}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB") : (item.startDate ? new Date(item.startDate).toLocaleDateString("en-GB") : "-")}
                        </td>
                        <td style={styles.td}>
                          {isDeposit ? "💳 Add Fund Deposit" : isWithdraw ? "💸 Withdrawal" : `🚀 ${item.duration || `${item.durationDays || tenure} Days Plan`}`}
                        </td>
                        <td style={styles.td}>₹ {Number(item.amount || 0).toLocaleString("en-IN")}</td>
                        <td style={styles.td}>
                          {isDeposit ? (
                            <span style={{ fontSize: "11px", color: "#64748b" }}>UTR: {item.transactionId || "N/A"}</span>
                          ) : isWithdraw ? (
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Bank Request</span>
                          ) : (
                            <span style={(item.frequency || "daily").toLowerCase() === "daily" ? styles.badgeDaily : styles.badgeWeekly}>
                              {item.frequency || "Daily"}
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusBadge, ...getStatusStyle(displayStatus) }}>
                            {displayStatus}
                          </span>
                          {isRejected && (item.rejectReason || item.reason) && (
                            <div style={{ fontSize: "10px", color: "#ef4444", marginTop: "3px", fontWeight: "bold" }}>
                              Reason: {item.rejectReason || item.reason}
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          {item.maturityDate ? new Date(item.maturityDate).toLocaleDateString("en-GB") : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* BOTTOM IMAGE BANNER (small invest.png) */}
        <div style={styles.bannerWrapper}>
          <img 
            src="/small invest.png" 
            alt="Small Invest" 
            style={styles.bannerImage}
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>

        {/* TRUST BANNER */}
        <section style={styles.trustBanner}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>Invest Small, Earn Big Returns Together</h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: "12px", color: "#64748b" }}>
              Start investing today and secure your future.
            </p>
          </div>
          <div style={{ textAlign: "right", color: "#16a34a", fontWeight: "bold", fontSize: "13px" }}>
            🛡 100% Secure
            <br />
            <small style={{ color: "#64748b" }}>Safe & Trusted Platform</small>
          </div>
        </section>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. AMOUNT PRESETS MODAL */}
      {showAmountModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Select Investment Amount</h3>
              <button style={styles.closeBtn} onClick={() => setShowAmountModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: 0, marginBottom: "16px" }}>
              Choose one of the plan presets below:
            </p>

            <div style={styles.presetGrid}>
              {presetAmounts.map((p) => (
                <div
                  key={p.value}
                  style={{
                    ...styles.presetCard,
                    background: p.color,
                    border: amount === p.value ? "3px solid #ffffff" : "none"
                  }}
                  onClick={() => {
                    setAmount(p.value);
                    setShowAmountModal(false);
                  }}
                >
                  <span style={styles.presetBadge}>{p.desc}</span>
                  <div style={styles.presetVal}>₹{p.value.toLocaleString("en-IN")}</div>
                  <span style={styles.presetLabel}>({p.label})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ADD FUND MODAL */}
      {showAddFundModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Add Investment Fund</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddFundModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 12px 0" }}>
              Send <strong style={{ color: "#16a34a" }}>₹{amount.toLocaleString("en-IN")}</strong> to company wallet & upload payment proof:
            </p>

            <div style={styles.walletBox}>
              <small style={{ color: "#64748b", fontWeight: "bold" }}>Company Wallet Address:</small>
              <div style={styles.walletAddrRow}>
                <span style={styles.walletText}>{COMPANY_WALLET_ADDRESS}</span>
                <button style={styles.copyBtn} onClick={handleCopyWallet}>Copy</button>
              </div>
            </div>

            <form onSubmit={handleDepositSubmit} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={styles.label}>Transaction ID / UTR No.*</label>
                <input
                  style={styles.inputModal}
                  placeholder="Enter 12-digit UTR or Txn Hash"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Payment Screenshot Proof*</label>
                <input
                  type="file"
                  accept="image/*"
                  style={styles.fileInput}
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  required
                />
              </div>

              <button type="submit" style={styles.submitBtn} disabled={depositing}>
                {depositing ? "Uploading Proof..." : "Submit Deposit Proof"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD BANK ACCOUNT MODAL */}
      {showBankModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Add Bank Details</h3>
              <button style={styles.closeBtn} onClick={() => setShowBankModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveBankDetails} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                style={styles.inputModal}
                placeholder="Account Holder Name"
                value={bankForm.holderName}
                onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                required
              />
              <input
                style={styles.inputModal}
                placeholder="Bank Name"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                required
              />
              <input
                style={styles.inputModal}
                placeholder="Account Number"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                required
              />
              <input
                style={styles.inputModal}
                placeholder="IFSC Code"
                value={bankForm.ifsc}
                onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })}
                required
              />
              <button type="submit" style={styles.submitBtn}>
                Save Bank Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Withdraw Funds</h3>
              <button style={styles.closeBtn} onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>

            <div
              style={{
                ...styles.withdrawBalanceInfo,
                background: currentWalletBalance < selectedWithdrawAmount ? "#fee2e2" : "#e0f2fe",
                color: currentWalletBalance < selectedWithdrawAmount ? "#991b1b" : "#0369a1"
              }}
            >
              <span>Available Wallet Balance:</span>
              <strong>₹ {currentWalletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>

            {currentWalletBalance < selectedWithdrawAmount && (
              <div style={styles.balanceAlertBox}>
                ⚠️ You don't have enough balance to withdraw ₹{selectedWithdrawAmount.toLocaleString("en-IN")}.
              </div>
            )}

            <p style={{ fontSize: "13px", color: "#64748b", margin: "12px 0 6px" }}>
              Select Pre-filled Withdrawal Amount:
            </p>

            <div style={styles.withdrawPresetGrid}>
              {withdrawPresets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  style={{
                    ...styles.withdrawPresetBtn,
                    ...(selectedWithdrawAmount === amt ? styles.withdrawPresetActive : {})
                  }}
                  onClick={() => setSelectedWithdrawAmount(amt)}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <button
              style={{
                ...styles.submitBtn,
                marginTop: "18px",
                background: currentWalletBalance < selectedWithdrawAmount ? "#94a3b8" : "#16a34a"
              }}
              onClick={handleWithdrawSubmit}
              disabled={withdrawing || currentWalletBalance < selectedWithdrawAmount}
            >
              {withdrawing ? "Processing..." : "Confirm Withdrawal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const getStatusStyle = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "success" || s === "active" || s === "approved" || s === "accepted") {
    return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
  }
  if (s === "pending") {
    return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
  }
  if (s === "rejected" || s === "cancelled" || s === "failed") {
    return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
  }
  return { background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" };
};

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(180deg, #061b3a 0%, #030e21 100%)",
    padding: "16px",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#0f172a",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center"
  },
  container: {
    width: "100%",
    maxWidth: "1100px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#061b3a",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    color: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
    zIndex: 99999,
    fontWeight: "bold",
    fontSize: "14px"
  },

  // SIDEBAR DRAWER STYLES
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
    objectFit: "cover",
    borderRadius: "16px"
  },

  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "26px",
    cursor: "pointer",
    marginRight: "6px",
    display: "flex",
    alignItems: "center"
  },

  // BANNERS STYLES
  bannerWrapper: {
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
  },
  bannerImage: {
    width: "100%",
    height: "auto",
    maxHeight: "180px",
    objectFit: "cover",
    display: "block"
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "white"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  logoImg: {
    width: "42px",
    height: "42px",
    borderRadius: "10px"
  },
  brandTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "900"
  },
  brandSubtitle: {
    margin: 0,
    fontSize: "11px",
    opacity: 0.8
  },
  welcomeBox: {
    textAlign: "center"
  },
  welcomeTitle: {
    fontSize: "16px",
    display: "block"
  },
  welcomeSub: {
    fontSize: "11px",
    opacity: 0.75
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  notifIconContainer: {
    position: "relative",
    cursor: "pointer"
  },
  notifBadge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    background: "#ef4444",
    color: "white",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  profileCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "2px solid #22c55e"
  },
  profileImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  summaryCard: {
    background: "linear-gradient(100deg, #1d4ed8, #16a34a)",
    borderRadius: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    padding: "16px",
    color: "white",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
  },
  statBox: {
    textAlign: "center",
    borderRight: "1px solid rgba(255,255,255,0.2)",
    padding: "6px"
  },
  statIcon: {
    fontSize: "20px",
    display: "block"
  },
  statTitle: {
    fontSize: "11px",
    opacity: 0.9
  },
  statValue: {
    display: "block",
    fontSize: "18px",
    fontWeight: "800",
    marginTop: "2px"
  },
  mainCard: {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
  },
  activeInvestCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "20px",
    border: "1px solid #22c55e",
    boxShadow: "0 0 15px rgba(34, 197, 94, 0.2)",
    color: "white"
  },
  activeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "10px"
  },
  activeBadgeGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  activePulse: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px #22c55e"
  },
  activeTitle: {
    fontSize: "13px",
    letterSpacing: "0.5px",
    color: "#22c55e"
  },
  activeStatusTag: {
    fontSize: "11px",
    background: "rgba(34, 197, 94, 0.15)",
    color: "#4ade80",
    padding: "4px 10px",
    borderRadius: "20px",
    fontWeight: "bold",
    border: "1px solid rgba(34, 197, 94, 0.3)"
  },
  activeStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px"
  },
  activeStatItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  activeLabel: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  activeValue: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#f8fafc"
  },
  cardTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "800"
  },
  titleLine: {
    width: "35px",
    height: "3px",
    background: "#16a34a",
    marginTop: "4px",
    borderRadius: "2px"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "16px"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "6px",
    color: "#334155"
  },
  select: {
    height: "46px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "14px"
  },
  lockedInput: {
    background: "#f1f5f9",
    color: "#64748b",
    cursor: "not-allowed"
  },
  frequencyToggle: {
    display: "flex",
    gap: "8px",
    height: "46px"
  },
  freqBtn: {
    flex: 1,
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  freqBtnActive: {
    background: "#16a34a",
    color: "white",
    borderColor: "#16a34a"
  },
  lockedBtn: {
    opacity: 0.65,
    cursor: "not-allowed"
  },
  amountInputWrap: {
    height: "46px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    background: "#f8fafc"
  },
  lockedInputWrap: {
    background: "#f1f5f9",
    cursor: "not-allowed",
    borderColor: "#cbd5e1"
  },
  amountInput: {
    border: "none",
    background: "transparent",
    fontSize: "15px",
    fontWeight: "bold",
    outline: "none",
    width: "60%",
    cursor: "inherit"
  },
  changeBadge: {
    fontSize: "11px",
    color: "#1d4ed8",
    fontWeight: "bold",
    background: "#eff6ff",
    padding: "4px 8px",
    borderRadius: "6px"
  },
  lockedBadge: {
    fontSize: "11px",
    color: "#ef4444",
    fontWeight: "bold",
    background: "#fee2e2",
    padding: "4px 8px",
    borderRadius: "6px"
  },
  helpText: {
    color: "#64748b",
    fontSize: "10px",
    marginTop: "4px"
  },
  returnGrid: {
    margin: "12px 0"
  },
  dailyReturnCard: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center"
  },
  weeklyReturnCard: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center"
  },
  returnCardTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#16a34a",
    marginBottom: "4px"
  },
  returnCardValue: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#16a34a"
  },
  returnCardNote: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px"
  },
  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
    margin: "16px 0"
  },
  breakBox: {
    padding: "12px",
    textAlign: "center",
    borderRight: "1px solid #e2e8f0"
  },
  breakLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "2px"
  },
  breakValue: {
    fontSize: "14px",
    fontWeight: "bold"
  },
  actionGridTriple: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "12px"
  },
  startInvestBtn: {
    height: "50px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  disabledBtn: {
    background: "#94a3b8",
    cursor: "not-allowed",
    opacity: 0.7
  },
  addInvestBtn: {
    height: "50px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  withdrawBtn: {
    height: "50px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  historyCard: {
    background: "white",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  viewAllBtn: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "12px"
  },
  th: {
    background: "#f8fafc",
    padding: "10px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569"
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #f1f5f9"
  },
  emptyTd: {
    textAlign: "center",
    padding: "24px",
    color: "#94a3b8"
  },
  badgeDaily: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "bold"
  },
  badgeWeekly: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "bold"
  },
  statusBadge: {
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "bold",
    display: "inline-block"
  },
  trustBanner: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "16px"
  },
  modalCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  closeBtn: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  presetGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  presetCard: {
    borderRadius: "14px",
    padding: "14px",
    color: "white",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 15px rgba(0,0,0,0.15)"
  },
  presetBadge: {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    opacity: 0.9,
    fontWeight: "bold"
  },
  presetVal: {
    fontSize: "18px",
    fontWeight: "900",
    margin: "4px 0"
  },
  presetLabel: {
    fontSize: "11px",
    opacity: 0.85
  },
  walletBox: {
    background: "#f1f5f9",
    padding: "12px",
    borderRadius: "10px"
  },
  walletAddrRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "4px"
  },
  walletText: {
    fontSize: "11px",
    wordBreak: "break-all",
    fontWeight: "bold"
  },
  copyBtn: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "bold"
  },
  inputModal: {
    width: "100%",
    height: "44px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "13px",
    boxSizing: "border-box"
  },
  fileInput: {
    width: "100%",
    fontSize: "12px"
  },
  submitBtn: {
    height: "46px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "white",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
    width: "100%"
  },
  withdrawBalanceInfo: {
    padding: "10px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px"
  },
  balanceAlertBox: {
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "12px",
    padding: "8px 10px",
    borderRadius: "8px",
    marginTop: "8px",
    fontWeight: "bold"
  },
  withdrawPresetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px"
  },
  withdrawPresetBtn: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "13px"
  },
  withdrawPresetActive: {
    background: "#1d4ed8",
    color: "white",
    borderColor: "#1d4ed8"
  }
};
