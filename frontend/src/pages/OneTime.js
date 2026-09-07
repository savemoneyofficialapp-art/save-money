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
  const [showAllHistory, setShowAllHistory] = useState(false); // New state for viewing all history

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

  const profilePhoto = fileUrl(user?.photo || user?.profilePhoto || user?.avatar || "");

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: "center" }}>
          <div style={styles.spinner}></div>
          <h3 style={{ color: "#22c55e", marginTop: "12px", fontSize: "16px" }}>Loading Dashboard...</h3>
        </div>
      </div>
    );
  }

  // Determine history display limit (5 items unless View All is clicked)
  const displayedHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <div style={styles.page}>

      {/* 👇 SIDEBAR DRAWER */}
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
          <div style={styles.headerLeft}>
            <button 
              style={styles.menuButton}
              onClick={() => setIsDrawerOpen(true)}
            >
              ☰
            </button>
            <div>
              <h1 style={styles.welcomeTitle}>
                Welcome Back! 👏
              </h1>
              <p style={styles.welcomeSub}>Invest smartly & secure your future</p>
            </div>
          </div>

          {/* PROFILE PHOTO UPDATE */}
          <div style={styles.profileCircle} onClick={() => navigate("/kyc")}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="User Profile" style={styles.profileImg} />
            ) : (
              <div style={styles.profileAvatarPlaceholder}>
                <span style={{ fontSize: "14px", color: "#fff", fontWeight: "bold" }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* TOP HERO BANNER USING chhote nivesh.png */}
        <div style={styles.topHeroBanner}>
          <div style={styles.heroTextContent}>
            <h2 style={styles.heroTitle}>
              Chhote nivesh se <br />
              <span style={{ color: "#facc15" }}>badi kamai ka safar,</span> <br />
              <span style={{ fontSize: "15px", fontWeight: "700", color: "#f1f5f9" }}>har mahine ka plan, hamesha</span>
            </h2>
            <p style={styles.heroDesc}>
              Invest small amounts monthly to get big returns together
            </p>
          </div>
          <div style={styles.heroImgWrapper}>
            <img 
              src="/chhote nivesh.png" 
              alt="Chhote Nivesh" 
              style={styles.heroBannerImage}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* 4 STAT CARDS GRID */}
        <section style={styles.statsGridContainer}>
          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(34, 197, 94, 0.15)" }}>
                <span style={{ color: "#22c55e", fontSize: "16px" }}>💼</span>
              </div>
              <span style={styles.statCardTitle}>Total Invested</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {Number(stats.totalInvested || 0).toLocaleString("en-IN")}
            </strong>
            <svg style={styles.sparkline} viewBox="0 0 100 25">
              <path d="M0,20 Q25,5 50,15 T100,5" fill="none" stroke="#22c55e" strokeWidth="2" />
            </svg>
          </div>

          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(56, 189, 248, 0.15)" }}>
                <span style={{ color: "#38bdf8", fontSize: "16px" }}>💵</span>
              </div>
              <span style={styles.statCardTitle}>Total Earnings</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {Number(stats.totalEarnings || 0).toLocaleString("en-IN")}
            </strong>
            <svg style={styles.sparkline} viewBox="0 0 100 25">
              <path d="M0,18 Q30,22 60,8 T100,12" fill="none" stroke="#38bdf8" strokeWidth="2" />
            </svg>
          </div>

          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(168, 85, 247, 0.15)" }}>
                <span style={{ color: "#a855f7", fontSize: "16px" }}>💸</span>
              </div>
              <span style={styles.statCardTitle}>Total Withdraw</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {Number(stats.totalWithdrawn || 0).toLocaleString("en-IN")}
            </strong>
            <svg style={styles.sparkline} viewBox="0 0 100 25">
              <path d="M0,10 Q20,20 50,12 T100,18" fill="none" stroke="#a855f7" strokeWidth="2" />
            </svg>
          </div>

          <div style={styles.darkStatCard}>
            <div style={styles.statCardHeader}>
              <div style={{ ...styles.iconBox, background: "rgba(234, 179, 8, 0.15)" }}>
                <span style={{ color: "#eab308", fontSize: "16px" }}>🪙</span>
              </div>
              <span style={styles.statCardTitle}>Available Balance</span>
            </div>
            <strong style={styles.statCardValue}>
              ₹ {currentWalletBalance.toLocaleString("en-IN")}
            </strong>
            <svg style={styles.sparkline} viewBox="0 0 100 25">
              <path d="M0,22 Q35,8 65,18 T100,2" fill="none" stroke="#eab308" strokeWidth="2" />
            </svg>
          </div>
        </section>

        {/* MAKE NEW INVESTMENT PANEL */}
        <section style={styles.darkMainCard}>
          <h2 style={styles.darkCardTitle}>Make a New Investment</h2>

          {activeInvestment && (
            <div style={styles.activeInvestCardDark}>
              <div style={styles.activeHeader}>
                <div style={styles.activeBadgeGroup}>
                  <span style={styles.activePulse}></span>
                  <strong style={styles.activeTitle}>ACTIVE INVESTMENT RUNNING</strong>
                </div>
                <span style={styles.activeStatusTagDark}>🟢 Live Earning</span>
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
                  <strong style={{ ...styles.activeValue, color: "#22c55e" }}>₹{Number(dailyReturn).toFixed(2)} / day</strong>
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

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>
                📌 Select Duration {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <select
                style={{
                  ...styles.selectDark,
                  ...(activeInvestment ? styles.lockedInputDark : {})
                }}
                value={tenure}
                onChange={handleTenureChange}
                disabled={!!activeInvestment}
              >
                {tenurePlans.map((p) => (
                  <option key={p.days} value={p.days} style={{ background: "#0c1829", color: "#fff" }}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>
                🔄 Return Frequency {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <div style={styles.frequencyToggleDark}>
                <button
                  type="button"
                  style={{
                    ...styles.freqBtnDark,
                    ...(frequency === "daily" ? styles.freqBtnActiveDark : {})
                  }}
                  onClick={() => !activeInvestment && setFrequency("daily")}
                  disabled={!!activeInvestment}
                >
                  Daily
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.freqBtnDark,
                    ...(frequency === "weekly" ? styles.freqBtnActiveDark : {})
                  }}
                  onClick={() => !activeInvestment && setFrequency("weekly")}
                  disabled={!!activeInvestment}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.labelDark}>
                💵 Select / Enter Amount {activeInvestment && <span style={{ color: "#ef4444" }}>(🔒Active)</span>}
              </label>
              <div 
                style={styles.amountInputWrapDark} 
                onClick={() => !activeInvestment && setShowAmountModal(true)}
              >
                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#22c55e" }}>₹</span>
                <input style={styles.amountInputDark} type="text" readOnly value={amount.toLocaleString("en-IN")} />
                <span style={activeInvestment ? styles.lockedBadgeDark : styles.changeBadgeDark}>
                  {activeInvestment ? "🔒 Locked" : "Change ⚙️"}
                </span>
              </div>
              <small style={styles.helpTextDark}>
                {activeInvestment ? "Investment running - fields locked until maturity" : "Click to choose quick amount presets"}
              </small>
            </div>
          </div>

          {/* RETURN HIGHLIGHT BOX WITH COIN IMAGE / ICON ON THE LEFT */}
          <div style={styles.returnContainerDark}>
            <div style={styles.returnCardContent}>
              <span style={styles.returnBoxBagIcon}>🪙</span>
              <div>
                <div style={styles.returnCardTitleDark}>
                  You Will Get {frequency === "daily" ? "Daily" : "Weekly"} Return
                </div>
                <strong style={styles.returnCardValueDark}>
                  ₹ {frequency === "daily" ? dailyReturn.toFixed(2) : weeklyReturn.toFixed(2)}
                </strong>
                <span style={styles.returnCardNoteDark}>
                  (Approx. Return Per {frequency === "daily" ? "Day" : "Week"})
                </span>
              </div>
            </div>
          </div>

          <div style={styles.breakdownGridDark}>
            <div style={styles.breakBoxDark}>
              <span style={styles.breakLabelDark}>Investment Amount</span>
              <strong style={styles.breakValueDark}>₹ {Number(amount).toLocaleString("en-IN")}</strong>
            </div>
            <div style={styles.breakBoxDark}>
              <span style={styles.breakLabelDark}>Duration</span>
              <strong style={styles.breakValueDark}>{tenure} Days ({rate}%)</strong>
            </div>
            <div style={styles.breakBoxDark}>
              <span style={styles.breakLabelDark}>Total Return</span>
              <strong style={{ ...styles.breakValueDark, color: "#22c55e" }}>₹ {totalReturn.toLocaleString("en-IN")}</strong>
            </div>
            <div style={{ ...styles.breakBoxDark, borderRight: "none" }}>
              <span style={styles.breakLabelDark}>Total Payout</span>
              <strong style={{ ...styles.breakValueDark, color: "#38bdf8" }}>₹ {totalPayout.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <div style={styles.actionGridTriple}>
            <button 
              style={{
                ...styles.startInvestBtnDark,
                ...(activeInvestment ? styles.disabledBtnDark : {})
              }} 
              onClick={handleStartInvestment} 
              disabled={investing || !!activeInvestment}
            >
              {investing ? "Processing..." : activeInvestment ? "🚀 Active Running" : "🚀 Start Investment"}
            </button>

            <button style={styles.addInvestBtnDark} onClick={() => setShowAddFundModal(true)}>
              + Add Fund
            </button>

            <button style={styles.withdrawBtnDark} onClick={handleWithdrawClick}>
              ➔ Withdraw
            </button>
          </div>
        </section>

        {/* HISTORY TABLE LIMITED TO 5 ITEMS */}
        <section style={styles.darkHistoryCard}>
          <div style={styles.historyHeader}>
            <h2 style={{ margin: 0, fontSize: "17px", color: "#f8fafc", fontWeight: "700" }}>Investment & Transaction History</h2>
            <span style={styles.refreshBtnDark} onClick={loadDashboardData}>🔄 Refresh</span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.tableDark}>
              <thead>
                <tr>
                  <th style={styles.thDark}>Date</th>
                  <th style={styles.thDark}>Type / Description</th>
                  <th style={styles.thDark}>Amount</th>
                  <th style={styles.thDark}>Frequency / Txn</th>
                  <th style={styles.thDark}>Status</th>
                  <th style={styles.thDark}>Maturity</th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyTdDark}>No history found</td>
                  </tr>
                ) : (
                  displayedHistory.map((item, idx) => {
                    const itemType = (item.type || "").toLowerCase();
                    const isDeposit = itemType.includes("add fund") || itemType.includes("deposit") || !!item.transactionId;
                    const isWithdraw = itemType.includes("withdraw");

                    const rawStatus = item.status || "Pending";
                    const isSuccess = ["approved", "accepted", "success", "active", "completed"].includes(rawStatus.toLowerCase());
                    const isRejected = ["rejected", "cancelled", "failed"].includes(rawStatus.toLowerCase());
                    const displayStatus = rawStatus.toLowerCase() === "active" ? "Active" : (isSuccess ? "Success" : isRejected ? "Rejected" : "Pending");

                    return (
                      <tr key={item._id || idx} style={styles.trDark}>
                        <td style={styles.tdDark}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB") : (item.startDate ? new Date(item.startDate).toLocaleDateString("en-GB") : "-")}
                        </td>
                        <td style={styles.tdDark}>
                          {isDeposit ? "💳 Add Fund" : isWithdraw ? "💸 Withdrawal" : `🚀 ${item.duration || `${item.durationDays || tenure} Days`}`}
                        </td>
                        <td style={styles.tdDark}>₹ {Number(item.amount || 0).toLocaleString("en-IN")}</td>
                        <td style={styles.tdDark}>
                          {isDeposit ? (
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>UTR: {item.transactionId || "N/A"}</span>
                          ) : isWithdraw ? (
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Bank Request</span>
                          ) : (
                            <span style={styles.badgeDailyDark}>
                              {item.frequency || "Daily"}
                            </span>
                          )}
                        </td>
                        <td style={styles.tdDark}>
                          <span style={{ ...styles.statusBadgeDark, ...getStatusStyleDark(displayStatus) }}>
                            {displayStatus}
                          </span>
                          {isRejected && (item.rejectReason || item.reason) && (
                            <div style={{ fontSize: "11px", color: "#f87171", marginTop: "3px" }}>
                              Reason: {item.rejectReason || item.reason}
                            </div>
                          )}
                        </td>
                        <td style={styles.tdDark}>
                          {item.maturityDate ? new Date(item.maturityDate).toLocaleDateString("en-GB") : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.viewAllFooter}>
            <span style={styles.viewAllLink} onClick={() => setShowAllHistory(!showAllHistory)}>
              {showAllHistory ? "Show Less 🔼" : "View All Transactions ➔"}
            </span>
          </div>
        </section>

        {/* TRUST BANNER USING small invest.png */}
        <section style={styles.trustBannerDark}>
          <div style={styles.trustLeftContent}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#ffffff", fontWeight: "800" }}>
              Invest Small, <br />
              <span style={{ color: "#4ade80" }}>Earn Big Returns Together</span>
            </h3>
            <p style={{ margin: "0 0 14px 0", opacity: 0.9, fontSize: "13px", color: "#cbd5e1" }}>
              Start investing today and secure your future.
            </p>
            <div style={styles.trustIllustrations}>
              <img 
                src="/small invest.png" 
                alt="Small Invest" 
                style={styles.trustImg}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          <div style={styles.trustRightList}>
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>🛡</span>
              <div>
                <strong style={styles.trustTitle}>100% Secure</strong>
                <span style={styles.trustSub}>Safe & Trusted Platform</span>
              </div>
            </div>

            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>📈</span>
              <div>
                <strong style={styles.trustTitle}>High Returns</strong>
                <span style={styles.trustSub}>Better returns on your investments</span>
              </div>
            </div>

            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>🕒</span>
              <div>
                <strong style={styles.trustTitle}>Smart & Simple</strong>
                <span style={styles.trustSub}>Easy invest, easy grow</span>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER FEATURES GRID */}
        <div style={styles.footerFeaturesGrid}>
          <div style={styles.featureBoxDark}>
            <span style={{ fontSize: "24px" }}>📈</span>
            <div>
              <strong style={{ fontSize: "14px", color: "#fff", display: "block" }}>High Returns</strong>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Better returns on your investments</span>
            </div>
          </div>

          <div style={styles.featureBoxDark}>
            <span style={{ fontSize: "24px" }}>🎧</span>
            <div>
              <strong style={{ fontSize: "14px", color: "#fff", display: "block" }}>24/7 Support</strong>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>We are here to help you</span>
            </div>
          </div>

          <div style={styles.featureBoxDark}>
            <span style={{ fontSize: "24px" }}>👥</span>
            <div>
              <strong style={{ fontSize: "14px", color: "#fff", display: "block" }}>Trusted Platform</strong>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Thousands of users trust us</span>
            </div>
          </div>
        </div>

        {/* FOOTER BRAND BAR */}
        <footer style={styles.footerBar}>
          <p style={styles.footerTagline}>
            Chhote nivesh, badi kamai ka sapna, ab hoga sach! <strong style={{ color: "#22c55e" }}>SAVE MONEY</strong> ke saath! 💚
          </p>
          <div style={styles.footerCopyRow}>
            <span>© 2026 SAVE MONEY. All Rights Reserved.</span>
            <span>Made with ❤️ for your better future</span>
          </div>
        </footer>
      </div>

      {/* ----------------- MODALS (DARK THEMED) ----------------- */}

      {showAmountModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#fff" }}>Select Investment Amount</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowAmountModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: 0, marginBottom: "16px" }}>
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

      {showAddFundModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#fff" }}>Add Investment Fund</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowAddFundModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: "14px", color: "#cbd5e1", margin: "0 0 12px 0" }}>
              Send <strong style={{ color: "#22c55e" }}>₹{amount.toLocaleString("en-IN")}</strong> to company wallet & upload payment proof:
            </p>

            <div style={styles.walletBoxDark}>
              <small style={{ color: "#94a3b8", fontWeight: "bold", fontSize: "12px" }}>Company Wallet Address:</small>
              <div style={styles.walletAddrRow}>
                <span style={styles.walletText}>{COMPANY_WALLET_ADDRESS}</span>
                <button style={styles.copyBtn} onClick={handleCopyWallet}>Copy</button>
              </div>
            </div>

            <form onSubmit={handleDepositSubmit} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={styles.labelDark}>Transaction ID / UTR No.*</label>
                <input
                  style={styles.inputModalDark}
                  placeholder="Enter 12-digit UTR or Txn Hash"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={styles.labelDark}>Payment Screenshot Proof*</label>
                <input
                  type="file"
                  accept="image/*"
                  style={styles.fileInputDark}
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  required
                />
              </div>

              <button type="submit" style={styles.submitBtnDark} disabled={depositing}>
                {depositing ? "Uploading Proof..." : "Submit Deposit Proof"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showBankModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#fff" }}>Add Bank Details</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowBankModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveBankDetails} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                style={styles.inputModalDark}
                placeholder="Account Holder Name"
                value={bankForm.holderName}
                onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                required
              />
              <input
                style={styles.inputModalDark}
                placeholder="Bank Name"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                required
              />
              <input
                style={styles.inputModalDark}
                placeholder="Account Number"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                required
              />
              <input
                style={styles.inputModalDark}
                placeholder="IFSC Code"
                value={bankForm.ifsc}
                onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })}
                required
              />
              <button type="submit" style={styles.submitBtnDark}>
                Save Bank Account
              </button>
            </form>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardDark}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#fff" }}>Withdraw Funds</h3>
              <button style={styles.closeBtnDark} onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>

            <div
              style={{
                ...styles.withdrawBalanceInfoDark,
                background: currentWalletBalance < selectedWithdrawAmount ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                color: currentWalletBalance < selectedWithdrawAmount ? "#f87171" : "#4ade80",
                border: currentWalletBalance < selectedWithdrawAmount ? "1px solid #991b1b" : "1px solid #166534"
              }}
            >
              <span>Available Wallet Balance:</span>
              <strong>₹ {currentWalletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>

            {currentWalletBalance < selectedWithdrawAmount && (
              <div style={styles.balanceAlertBoxDark}>
                ⚠️ You don't have enough balance to withdraw ₹{selectedWithdrawAmount.toLocaleString("en-IN")}.
              </div>
            )}

            <p style={{ fontSize: "14px", color: "#94a3b8", margin: "12px 0 6px" }}>
              Select Pre-filled Withdrawal Amount:
            </p>

            <div style={styles.withdrawPresetGrid}>
              {withdrawPresets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  style={{
                    ...styles.withdrawPresetBtnDark,
                    ...(selectedWithdrawAmount === amt ? styles.withdrawPresetActiveDark : {})
                  }}
                  onClick={() => setSelectedWithdrawAmount(amt)}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <button
              style={{
                ...styles.submitBtnDark,
                marginTop: "18px",
                background: currentWalletBalance < selectedWithdrawAmount ? "#475569" : "#16a34a"
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

const getStatusStyleDark = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "success" || s === "active" || s === "approved" || s === "accepted") {
    return { background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.4)" };
  }
  if (s === "pending") {
    return { background: "rgba(234, 179, 8, 0.2)", color: "#facc15", border: "1px solid rgba(234, 179, 8, 0.4)" };
  }
  if (s === "rejected" || s === "cancelled" || s === "failed") {
    return { background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)" };
  }
  return { background: "rgba(148, 163, 184, 0.2)", color: "#cbd5e1", border: "1px solid rgba(148, 163, 184, 0.4)" };
};

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#030a16",
    padding: "16px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#f8fafc",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center"
  },
  container: {
    width: "100%",
    maxWidth: "1000px",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#030a16",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(34, 197, 94, 0.2)",
    borderTop: "3px solid #22c55e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    color: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
    zIndex: 99999,
    fontWeight: "bold",
    fontSize: "14px"
  },

  // HEADER
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 0"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  menuButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "26px",
    cursor: "pointer",
    padding: "0"
  },
  welcomeTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "800",
    color: "#ffffff"
  },
  welcomeSub: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8"
  },
  profileCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#0c1f38",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "2px solid #10b981",
    cursor: "pointer"
  },
  profileImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  profileAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  // TOP HERO BANNER
  topHeroBanner: {
    background: "linear-gradient(135deg, #062319 0%, #06182e 100%)",
    borderRadius: "16px",
    padding: "22px 26px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    minHeight: "140px",
    gap: "20px"
  },
  heroTextContent: {
    flex: 1,
    zIndex: 2
  },
  heroTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.35"
  },
  heroDesc: {
    margin: "10px 0 0 0",
    fontSize: "13px",
    color: "#cbd5e1"
  },
  heroImgWrapper: {
    width: "180px",
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  heroBannerImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain"
  },

  // 4 STAT CARDS GRID
  statsGridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px"
  },
  darkStatCard: {
    background: "#081628",
    borderRadius: "14px",
    padding: "14px 16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    minHeight: "90px"
  },
  statCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  iconBox: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statCardTitle: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  statCardValue: {
    fontSize: "21px",
    fontWeight: "900",
    color: "#ffffff",
    marginTop: "8px",
    zIndex: 2
  },
  sparkline: {
    width: "100%",
    height: "25px",
    marginTop: "4px"
  },

  // MAIN INVESTMENT CARD
  darkMainCard: {
    background: "#081628",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)"
  },
  darkCardTitle: {
    margin: "0 0 18px 0",
    fontSize: "17px",
    fontWeight: "800",
    color: "#ffffff"
  },

  // ACTIVE RUNNING CARD
  activeInvestCardDark: {
    background: "#040d1a",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "18px",
    border: "1px solid #16a34a"
  },
  activeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
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
    boxShadow: "0 0 10px #22c55e"
  },
  activeTitle: {
    fontSize: "13px",
    letterSpacing: "0.5px",
    color: "#22c55e"
  },
  activeStatusTagDark: {
    fontSize: "12px",
    background: "rgba(34, 197, 94, 0.2)",
    color: "#4ade80",
    padding: "4px 10px",
    borderRadius: "12px",
    fontWeight: "bold"
  },
  activeStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px"
  },
  activeStatItem: {
    display: "flex",
    flexDirection: "column"
  },
  activeLabel: {
    fontSize: "12px",
    color: "#94a3b8"
  },
  activeValue: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#f8fafc",
    marginTop: "4px"
  },

  // FORM FIELDS
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
    marginBottom: "16px"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column"
  },
  labelDark: {
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#cbd5e1"
  },
  selectDark: {
    height: "46px",
    borderRadius: "10px",
    border: "1px solid #1e293b",
    background: "#0f2138",
    color: "#ffffff",
    padding: "0 12px",
    fontSize: "14px",
    fontWeight: "600"
  },
  lockedInputDark: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  frequencyToggleDark: {
    display: "flex",
    gap: "8px",
    height: "46px"
  },
  freqBtnDark: {
    flex: 1,
    borderRadius: "10px",
    border: "1px solid #1e293b",
    background: "#0f2138",
    color: "#cbd5e1",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  freqBtnActiveDark: {
    background: "#16a34a",
    color: "#ffffff",
    borderColor: "#16a34a"
  },
  amountInputWrapDark: {
    height: "46px",
    borderRadius: "10px",
    border: "1px solid #1e293b",
    background: "#0f2138",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer"
  },
  amountInputDark: {
    border: "none",
    background: "transparent",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#ffffff",
    outline: "none",
    width: "60%"
  },
  changeBadgeDark: {
    fontSize: "12px",
    color: "#38bdf8",
    fontWeight: "bold"
  },
  lockedBadgeDark: {
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: "bold"
  },
  helpTextDark: {
    color: "#94a3b8",
    fontSize: "11px",
    marginTop: "6px"
  },

  // RETURN BOX
  returnContainerDark: {
    background: "#dcfce7",
    borderRadius: "14px",
    padding: "18px",
    textAlign: "center",
    margin: "16px 0",
    color: "#166534"
  },
  returnCardContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px"
  },
  returnBoxBagIcon: {
    fontSize: "32px"
  },
  returnCardTitleDark: {
    fontSize: "14px",
    fontWeight: "700"
  },
  returnCardValueDark: {
    fontSize: "28px",
    fontWeight: "900",
    display: "block"
  },
  returnCardNoteDark: {
    fontSize: "12px",
    opacity: 0.9
  },

  // BREAKDOWN GRID
  breakdownGridDark: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    background: "#040d1a",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    margin: "16px 0",
    overflow: "hidden"
  },
  breakBoxDark: {
    padding: "12px",
    textAlign: "center",
    borderRight: "1px solid rgba(255, 255, 255, 0.08)"
  },
  breakLabelDark: {
    display: "block",
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "4px"
  },
  breakValueDark: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#ffffff"
  },

  // ACTION BUTTONS
  actionGridTriple: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "12px"
  },
  startInvestBtnDark: {
    height: "48px",
    borderRadius: "10px",
    border: "none",
    background: "#86efac",
    color: "#052e16",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  disabledBtnDark: {
    background: "#dcfce7",
    color: "#166534",
    opacity: 0.8,
    cursor: "not-allowed"
  },
  addInvestBtnDark: {
    height: "48px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  withdrawBtnDark: {
    height: "48px",
    borderRadius: "10px",
    background: "#0f172a",
    border: "1px solid #334155",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  // HISTORY SECTION
  darkHistoryCard: {
    background: "#081628",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid rgba(255, 255, 255, 0.08)"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px"
  },
  refreshBtnDark: {
    color: "#22c55e",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  tableDark: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  },
  thDark: {
    background: "#040d1a",
    padding: "12px 14px",
    color: "#94a3b8",
    textAlign: "left",
    fontWeight: "700"
  },
  trDark: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
  },
  tdDark: {
    padding: "12px 14px",
    color: "#f8fafc"
  },
  emptyTdDark: {
    textAlign: "center",
    padding: "24px",
    color: "#94a3b8"
  },
  badgeDailyDark: {
    background: "rgba(34, 197, 94, 0.15)",
    color: "#4ade80",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold"
  },
  statusBadgeDark: {
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "inline-block"
  },
  viewAllFooter: {
    textAlign: "center",
    marginTop: "14px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,255,255,0.06)"
  },
  viewAllLink: {
    color: "#22c55e",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  // TRUST BANNER
  trustBannerDark: {
    background: "linear-gradient(135deg, #051a13 0%, #081728 100%)",
    borderRadius: "16px",
    padding: "22px 26px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    alignItems: "center"
  },
  trustLeftContent: {
    display: "flex",
    flexDirection: "column"
  },
  trustIllustrations: {
    width: "100%",
    height: "120px",
    marginTop: "10px"
  },
  trustImg: {
    maxHeight: "100%",
    maxWidth: "100%",
    objectFit: "contain"
  },
  trustRightList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  trustIcon: {
    fontSize: "22px",
    color: "#22c55e"
  },
  trustTitle: {
    fontSize: "14px",
    color: "#ffffff",
    display: "block",
    fontWeight: "700"
  },
  trustSub: {
    fontSize: "12px",
    color: "#94a3b8"
  },

  // FOOTER FEATURES GRID
  footerFeaturesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px"
  },
  featureBoxDark: {
    background: "#081628",
    borderRadius: "12px",
    padding: "14px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  // FOOTER BAR
  footerBar: {
    textAlign: "center",
    padding: "18px 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    marginTop: "10px"
  },
  footerTagline: {
    fontSize: "14px",
    color: "#cbd5e1",
    margin: "0 0 8px 0"
  },
  footerCopyRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#64748b"
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
    padding: "14px 12px",
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
    marginBottom: "10px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    flexShrink: 0
  },
  drawerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
  },
  drawerLogoWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #03251a 0%, #064e3b 100%)",
    border: "2px solid #22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 12px rgba(34, 197, 94, 0.35)"
  },
  drawerLogoImg: {
    width: "30px",
    height: "30px",
    objectFit: "contain"
  },
  drawerLogoText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: "0.8px",
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
    gap: "8px",
    flexShrink: 0,
    overflowY: "auto",
    maxHeight: "calc(100vh - 210px)"
  },
  drawerNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    background: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
    color: "#ffffff",
    fontSize: "14px",
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
    fontSize: "20px",
    width: "24px",
    display: "inline-block",
    textAlign: "center"
  },
  drawerNavText: {
    flex: 1,
    fontSize: "14px",
    letterSpacing: "0.3px"
  },
  drawerNavDashboard: { background: "rgba(59, 130, 246, 0.2)", border: "1px solid rgba(59, 130, 246, 0.4)" },
  drawerNavMyInvestment: { background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)" },
  drawerNavSaveMoney: { background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)" },
  drawerNavOneTime: { background: "rgba(168, 85, 247, 0.2)", border: "1px solid rgba(168, 85, 247, 0.4)" },
  drawerNavPlan: { background: "rgba(6, 182, 212, 0.2)", border: "1px solid rgba(6, 182, 212, 0.4)" },
  drawerNavAddFund: { background: "rgba(20, 184, 166, 0.2)", border: "1px solid rgba(20, 184, 166, 0.4)" },
  drawerNavRefer: { background: "rgba(236, 72, 153, 0.2)", border: "1px solid rgba(236, 72, 153, 0.4)" },
  drawerNavWithdraw: { background: "rgba(249, 115, 22, 0.2)", border: "1px solid rgba(249, 115, 22, 0.4)" },
  drawerNavDailyReward: { background: "rgba(244, 63, 94, 0.2)", border: "1px solid rgba(244, 63, 94, 0.4)" },
  drawerNavInvestmentAssistant: { background: "rgba(2, 132, 199, 0.2)", border: "1px solid rgba(2, 132, 199, 0.4)" },
  drawerNavSupport: { background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.4)" },
  drawerNavProfile: { background: "rgba(236, 72, 153, 0.2)", border: "1px solid rgba(236, 72, 153, 0.4)" },
  drawerNavLogout: { background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)" },

  treePlantOnlyWrapper: {
    flex: 1,
    minHeight: 0,
    marginTop: "12px",
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
    height: "70%",
    objectFit: "95%",
    borderRadius: "16px"
  },

  // MODAL STYLES
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "16px"
  },
  modalCardDark: {
    background: "#081628",
    borderRadius: "18px",
    padding: "22px",
    width: "100%",
    maxWidth: "420px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.6)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px"
  },
  closeBtnDark: {
    border: "none",
    background: "#0f2138",
    color: "#fff",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    fontSize: "14px"
  },
  presetGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  presetCard: {
    borderRadius: "12px",
    padding: "14px",
    color: "white",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  presetBadge: { fontSize: "11px", textTransform: "uppercase", fontWeight: "bold" },
  presetVal: { fontSize: "18px", fontWeight: "900", margin: "4px 0" },
  presetLabel: { fontSize: "12px", opacity: 0.85 },

  walletBoxDark: {
    background: "#040d1a",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #1e293b"
  },
  walletAddrRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "6px"
  },
  walletText: { fontSize: "12px", wordBreak: "break-all", color: "#fff" },
  copyBtn: {
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold"
  },
  inputModalDark: {
    width: "100%",
    height: "46px",
    borderRadius: "10px",
    border: "1px solid #1e293b",
    background: "#0f2138",
    color: "#fff",
    padding: "0 12px",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  fileInputDark: { width: "100%", fontSize: "13px", color: "#cbd5e1" },
  submitBtnDark: {
    height: "46px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "white",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    width: "100%"
  },
  withdrawBalanceInfoDark: {
    padding: "12px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px"
  },
  balanceAlertBoxDark: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    fontSize: "12px",
    padding: "10px",
    borderRadius: "8px",
    marginTop: "8px"
  },
  withdrawPresetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px"
  },
  withdrawPresetBtnDark: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #1e293b",
    background: "#0f2138",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "13px"
  },
  withdrawPresetActiveDark: {
    background: "#2563eb",
    borderColor: "#2563eb"
  }
};
