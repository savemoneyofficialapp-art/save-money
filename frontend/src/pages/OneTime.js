import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function OneTime() {
  const navigate = useNavigate();

  // 🔹 Telegram Link & Wallet Info Configuration
  const TELEGRAM_LINK = "https://t.me/your_telegram_channel"; // আপনার টেলিগ্রাম লিংক দিন
  const COMPANY_WALLET_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"; // আপনার ওয়ালেট অ্যাড্রেস

  // 🔹 Local Storage & Auth Data
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";
  const localName = localStorage.getItem("name") || "User";

  // 🔹 State Management
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  // 🔹 Tenure / Duration Options (15 দিন, 30 দিন, 40 দিন, 60 দিন, 100 দিন)
  const TENURE_OPTIONS = [
    { days: 15, rate: 0.6, label: "15 Days (0.6%)" },
    { days: 30, rate: 0.8, label: "30 Days (0.8%)" },
    { days: 40, rate: 1.0, label: "40 Days (1.0%)" },
    { days: 60, rate: 1.5, label: "60 Days (1.5%)" },
    { days: 100, rate: 2.0, label: "100 Days (2.0%)" }
  ];

  const [selectedTenure, setSelectedTenure] = useState(TENURE_OPTIONS[0]);
  const [returnFrequency, setReturnFrequency] = useState("daily"); // 'daily' or 'weekly'
  const [investmentAmount, setInvestmentAmount] = useState(10000); // Pre-filled amount

  // 🔹 Modals State
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // 🔹 Bank & Withdraw States
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    holderName: ""
  });
  const [hasBankAdded, setHasBankAdded] = useState(false);
  const [selectedWithdrawAmount, setSelectedWithdrawAmount] = useState(100);
  const [hasWithdrawnToday, setHasWithdrawnToday] = useState(false);

  // 🔹 History Data State
  const [historyList, setHistoryList] = useState([]);

  // 🔹 Toast Notification
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // 🔹 Profile Photo Generator (Home.js এর সাথে ১০০% মিল রেখে)
  const fileUrl = (file) => {
    if (!file) return "";
    if (file.startsWith("http")) return file;
    return `${API}/uploads/${file}`;
  };

  const profilePhoto = useMemo(() => {
    return fileUrl(
      user?.photo ||
      user?.profilePhoto ||
      user?.selfiePhoto ||
      ""
    );
  }, [user]);

  // 🔹 Page Load & Data Fetching
  useEffect(() => {
    window.scrollTo(0, 0);
    loadDashboardData();
    loadOneTimeNotifications();
    loadInvestmentHistory();
  }, []);

  // 1️⃣ ড্যাশবোর্ড ও ইউজার ডেটা লোড
  const loadDashboardData = async () => {
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
      if (data?.bankDetails?.accountNumber) {
        setHasBankAdded(true);
        setBankDetails(data.bankDetails);
      }
      if (data?.hasWithdrawnToday) {
        setHasWithdrawnToday(data.hasWithdrawnToday);
      }
    } catch (err) {
      console.error("Dashboard Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ শুধু 'One Timer' নোটিফিকেশন ফিল্টার
  const loadOneTimeNotifications = async () => {
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
        // শুধু One Time সংক্রান্ত নোটিফিকেশন ফিল্টার
        const oneTimeNotifs = data.filter(
          (n) => !n.read && (n.type === "onetime" || n.category === "onetime")
        );
        setNotificationCount(oneTimeNotifs.length);
      }
    } catch (err) {
      console.error("Notification Fetch Error:", err);
    }
  };

  // 3️⃣ বিনিয়োগ ও ট্রানজেকশন হিস্ট্রি লোড
  const loadInvestmentHistory = async () => {
    try {
      const res = await fetch(`${API}/one-time-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistoryList(data);
      }
    } catch (err) {
      console.error("History Fetch Error:", err);
    }
  };

  // 🔹 রিটার্ন ও পে-আউট ক্যালকুলেশন
  const calculations = useMemo(() => {
    const amount = Number(investmentAmount) || 0;
    const dailyRate = selectedTenure.rate / 100;

    const dailyReturn = amount * dailyRate;
    const weeklyReturn = dailyReturn * 7;
    const totalReturn = dailyReturn * selectedTenure.days;
    const totalPayout = amount + totalReturn;

    return {
      dailyReturn,
      weeklyReturn,
      totalReturn,
      totalPayout
    };
  }, [investmentAmount, selectedTenure]);

  // 🔹 ব্যাংক অ্যাকাউন্ট সেভ করা
  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.holderName) {
      showToast("সব ব্যাংক ডিটেইলস সঠিক ভাবে পূরণ করুন");
      return;
    }
    try {
      const res = await fetch(`${API}/save-bank-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email, ...bankDetails })
      });
      const data = await res.json();
      if (res.ok) {
        setHasBankAdded(true);
        setShowBankModal(false);
        setShowWithdrawModal(true);
        showToast("ব্যাংক অ্যাকাউন্ট সফলভাবে যুক্ত হয়েছে!");
      } else {
        showToast(data.message || "ব্যাংক অ্যাকাউন্ট যুক্ত করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      showToast("নেটওয়ার্ক সমস্যা! আবার চেষ্টা করুন");
    }
  };

  // 🔹 উইথড্র বাটনে ক্লিক হ্যান্ডলার
  const handleWithdrawClick = () => {
    if (!hasBankAdded) {
      setShowBankModal(true);
    } else {
      setShowWithdrawModal(true);
    }
  };

  // 🔹 উইথড্র রিকোয়েস্ট সাবমিট করা
  const handleWithdrawSubmit = async () => {
    const returnBalance = Number(user?.oneTimeReturnBalance || user?.wallet || 0);

    if (hasWithdrawnToday) {
      showToast("দিনে এক বারই উইথড্র করা সম্ভব। রিজেক্ট হলে পুনরায় চেষ্টা করতে পারবেন।");
      return;
    }

    if (selectedWithdrawAmount > returnBalance) {
      showToast("আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!");
      return;
    }

    try {
      const res = await fetch(`${API}/withdraw-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          email,
          amount: selectedWithdrawAmount,
          type: "onetime"
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("উইথড্র রিকোয়েস্ট সফল হয়েছে!");
        setHasWithdrawnToday(true);
        setShowWithdrawModal(false);
        loadDashboardData();
        loadInvestmentHistory();
      } else {
        showToast(data.message || "উইথড্র রিকোয়েস্ট ব্যর্থ হয়েছে");
      }
    } catch (err) {
      showToast("সার্ভার ত্রুটি! কিছুক্ষণ পর চেষ্টা করুন");
    }
  };

  // 🔹 এড ফান্ড - টেলিগ্রাম রিডাইরেক্ট
  const handleTelegramRedirect = () => {
    const walletId = user?.walletId || user?._id || email;
    const msg = `হ্যালো, আমি ফান্ড ডিপোজিট করেছি।\nআমার ওয়ালেট আইডি: ${walletId}`;
    const fullUrl = `${TELEGRAM_LINK}?text=${encodeURIComponent(msg)}`;
    window.open(fullUrl, "_blank");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={{ color: "#38bdf8", marginTop: "15px", fontWeight: "700" }}>
          One Time Investment Dashboard লোড হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      {/* 🔔 TOAST MESSAGE */}
      {toastMessage && <div style={styles.toast}>{toastMessage}</div>}

      {/* 🟢 TOP HEADER */}
      <header style={styles.topHeader}>
        <div style={styles.brandContainer}>
          <img
            src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"}
            alt="Logo"
            style={styles.logoImg}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div>
            <h1 style={styles.brandTitle}>SAVE MONEY</h1>
            <p style={styles.brandSub}>Invest Small, Earn Big</p>
          </div>
        </div>

        <div style={styles.headerWelcome}>
          <h2 style={styles.welcomeText}>Welcome Back! 👋</h2>
          <p style={styles.welcomeSub}>Invest smartly and secure your future with us</p>
        </div>

        <div style={styles.headerRight}>
          <button style={styles.notifBtn} onClick={() => navigate("/notifications")}>
            🔔
            {notificationCount > 0 && (
              <span style={styles.notifBadge}>{notificationCount}</span>
            )}
          </button>
          
          <div style={styles.profileCircle}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="User" style={styles.profileImg} />
            ) : (
              <span style={{ fontSize: "20px" }}>👤</span>
            )}
          </div>
        </div>
      </header>

      {/* 📊 SUMMARY CARDS (TOP 4 STATS) */}
      <section style={styles.summaryCard}>
        <div style={styles.statBox}>
          <span style={styles.statIcon}>👛</span>
          <span style={styles.statTitle}>Total Invested</span>
          <strong style={styles.statValue}>
            ₹ {(user?.totalOneTimeInvested || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statIcon}>📈</span>
          <span style={styles.statTitle}>Total Returns</span>
          <strong style={styles.statValue}>
            ₹ {(user?.totalOneTimeReturns || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statIcon}>💰</span>
          <span style={styles.statTitle}>Total Earnings</span>
          <strong style={styles.statValue}>
            ₹ {(user?.totalOneTimeEarnings || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statIcon}>💳</span>
          <span style={styles.statTitle}>Available Balance</span>
          <strong style={styles.statValue}>
            ₹ {(user?.oneTimeReturnBalance || user?.wallet || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </section>

      {/* 🛠 MAIN INVESTMENT FORM CARD */}
      <main style={styles.mainCard}>
        <h2 style={styles.cardHeaderTitle}>Make a New Investment</h2>

        <div style={styles.formGrid}>
          
          {/* 1. Select Investment Duration */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              📅 Select Investment Duration
            </label>
            <select
              style={styles.selectInput}
              value={selectedTenure.days}
              onChange={(e) => {
                const tenure = TENURE_OPTIONS.find((t) => t.days === Number(e.target.value));
                if (tenure) setSelectedTenure(tenure);
              }}
            >
              {TENURE_OPTIONS.map((opt) => (
                <option key={opt.days} value={opt.days}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Return Frequency */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              🔄 Choose Return Frequency
            </label>
            <div style={styles.freqToggleGroup}>
              <button
                type="button"
                style={{
                  ...styles.freqBtn,
                  ...(returnFrequency === "daily" ? styles.freqBtnActive : {})
                }}
                onClick={() => setReturnFrequency("daily")}
              >
                Daily
              </button>
              <button
                type="button"
                style={{
                  ...styles.freqBtn,
                  ...(returnFrequency === "weekly" ? styles.freqBtnActive : {})
                }}
                onClick={() => setReturnFrequency("weekly")}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* 3. Enter Investment Amount */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              💵 Enter Investment Amount
            </label>
            <div style={styles.amountInputWrap}>
              <span style={styles.currencyPrefix}>₹</span>
              <input
                type="number"
                style={styles.amountInput}
                value={investmentAmount}
                readOnly
                onClick={() => setShowAmountModal(true)}
              />
            </div>
            <small style={styles.inputHelp}>Click to select amount</small>
          </div>
        </div>

        {/* 🟩 RETURN CARDS (CONDITIONAL DISPLAY) */}
        <div style={styles.returnCardContainer}>
          {returnFrequency === "daily" ? (
            <div style={{ ...styles.returnBox, ...styles.returnBoxDaily }}>
              <span style={styles.returnBoxTitle}>You Will Get Daily Return</span>
              <h2 style={styles.returnBoxValue}>
                ₹ {calculations.dailyReturn.toFixed(2)}
              </h2>
              <span style={styles.returnBoxNote}>(Approx.)</span>
            </div>
          ) : (
            <div style={{ ...styles.returnBox, ...styles.returnBoxWeekly }}>
              <span style={styles.returnBoxTitle}>You Will Get Weekly Return</span>
              <h2 style={{ ...styles.returnBoxValue, color: "#2563eb" }}>
                ₹ {calculations.weeklyReturn.toFixed(2)}
              </h2>
              <span style={styles.returnBoxNote}>(Approx.)</span>
            </div>
          )}
        </div>

        {/* 📋 BREAKDOWN STRIP */}
        <div style={styles.breakdownGrid}>
          <div style={styles.breakItem}>
            <span style={styles.breakLabel}>Investment Amount</span>
            <strong style={styles.breakVal}>₹ {Number(investmentAmount).toLocaleString("en-IN")}</strong>
          </div>
          <div style={styles.breakItem}>
            <span style={styles.breakLabel}>Duration</span>
            <strong style={styles.breakVal}>{selectedTenure.days} Days</strong>
          </div>
          <div style={styles.breakItem}>
            <span style={styles.breakLabel}>Total Return (Approx.)</span>
            <strong style={styles.breakVal}>₹ {calculations.totalReturn.toFixed(2)}</strong>
          </div>
          <div style={styles.breakItem}>
            <span style={styles.breakLabel}>Total Payout (Principal + Return)</span>
            <strong style={styles.breakVal}>₹ {calculations.totalPayout.toFixed(2)}</strong>
          </div>
        </div>

        {/* 🔘 ACTION BUTTONS */}
        <div style={styles.actionBtnGrid}>
          <button
            style={styles.addFundBtn}
            onClick={() => setShowAddFundModal(true)}
          >
            <span style={{ fontSize: "20px" }}>➕</span> Add Invest
            <br />
            <small style={{ fontSize: "11px", fontWeight: "normal" }}>Invest More</small>
          </button>

          <button
            style={styles.withdrawBtn}
            onClick={handleWithdrawClick}
          >
            <span style={{ fontSize: "20px" }}>↗</span> Withdraw
            <br />
            <small style={{ fontSize: "11px", fontWeight: "normal" }}>Withdraw Funds</small>
          </button>
        </div>
      </main>

      {/* 📜 INVESTMENT HISTORY TABLE */}
      <section style={styles.historySection}>
        <div style={styles.historyHeader}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Investment History</h3>
          <span style={styles.viewAllText}>View All</span>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Duration</th>
                <th style={styles.th}>Invested Amount</th>
                <th style={styles.th}>Return Frequency</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Maturity Date</th>
              </tr>
            </thead>
            <tbody>
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTd}>
                    No investment history available
                  </td>
                </tr>
              ) : (
                historyList.map((item, idx) => (
                  <tr key={idx} style={styles.tableRow}>
                    <td style={styles.td}>{item.date || "-"}</td>
                    <td style={styles.td}>{item.duration || "-"}</td>
                    <td style={styles.td}>₹ {Number(item.amount || 0).toLocaleString()}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badgeFrequency,
                          background: item.frequency === "daily" ? "#dcfce7" : "#dbeafe",
                          color: item.frequency === "daily" ? "#15803d" : "#1d4ed8"
                        }}
                      >
                        {item.frequency || "Daily"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badgeStatus,
                          background: item.status === "Active" ? "#dcfce7" : "#fef3c7",
                          color: item.status === "Active" ? "#16a34a" : "#d97706"
                        }}
                      >
                        {item.status || "Active"}
                      </span>
                    </td>
                    <td style={styles.td}>{item.maturityDate || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 🛡️ TRUST BANNER */}
      <section style={styles.trustBanner}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
            Invest Small, Earn Big Returns Together
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
            Start investing today and secure your future.
          </p>
        </div>
        <div style={styles.trustBadge}>
          🛡️ 100% Secure
          <br />
          <small style={{ fontSize: "10px", color: "#16a34a" }}>Safe & Trusted Platform</small>
        </div>
      </section>

      {/* ------------------- MODALS ------------------- */}

      {/* 1️⃣ PRE-FILLED AMOUNT POPUP MODAL */}
      {showAmountModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCardSmall}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Select Investment Amount</h3>
              <button style={styles.closeBtn} onClick={() => setShowAmountModal(false)}>✕</button>
            </div>
            <div style={styles.presetGrid}>
              {[
                { label: "5k", val: 5000 },
                { label: "7.5k", val: 7500 },
                { label: "10k", val: 10000 },
                { label: "50k", val: 50000 },
                { label: "100k", val: 100000 },
                { label: "500k", val: 500000 }
              ].map((item) => (
                <button
                  key={item.val}
                  style={styles.presetBtn}
                  onClick={() => {
                    setInvestmentAmount(item.val);
                    setShowAmountModal(false);
                  }}
                >
                  ₹ {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ ADD FUND POPUP MODAL */}
      {showAddFundModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Add Investment Funds</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddFundModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              নিচের ওয়ালেট অ্যাড্রেসে পেমেন্ট করে স্ক্রিনশট এবং ওয়ালেট আইডি টেলিগ্রামে সেন্ড করুন:
            </p>

            <div style={styles.walletBox}>
              <span style={{ fontSize: "12px", wordBreak: "break-all", fontWeight: "bold" }}>
                {COMPANY_WALLET_ADDRESS}
              </span>
              <button
                style={styles.copyBtn}
                onClick={() => {
                  navigator.clipboard.writeText(COMPANY_WALLET_ADDRESS);
                  showToast("ওয়ালেট অ্যাড্রেস কপি করা হয়েছে!");
                }}
              >
                📋 Copy
              </button>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button style={styles.telegramSubmitBtn} onClick={handleTelegramRedirect}>
                ✈️ Send Screenshot on Telegram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ ADD BANK ACCOUNT POPUP MODAL */}
      {showBankModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Add Bank Account Details</h3>
              <button style={styles.closeBtn} onClick={() => setShowBankModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "12px", color: "#ef4444" }}>
              উইথড্র করার পূর্বে আপনার সঠিক ব্যাংক ডিটেইলস যুক্ত করতে হবে।
            </p>
            <form onSubmit={handleSaveBank} style={styles.bankForm}>
              <input
                type="text"
                placeholder="Account Holder Name"
                style={styles.formInput}
                value={bankDetails.holderName}
                onChange={(e) => setBankDetails({ ...bankDetails, holderName: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Bank Name"
                style={styles.formInput}
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Account Number"
                style={styles.formInput}
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="IFSC Code"
                style={styles.formInput}
                value={bankDetails.ifscCode}
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                required
              />
              <button type="submit" style={styles.saveBankBtn}>Save & Proceed to Withdraw</button>
            </form>
          </div>
        </div>
      )}

      {/* 4️⃣ WITHDRAW POPUP MODAL */}
      {showWithdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Withdraw Return Funds</h3>
              <button style={styles.closeBtn} onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>

            <div style={styles.balanceInfoBox}>
              <span>Return Wallet Balance:</span>
              <strong>
                ₹ {(user?.oneTimeReturnBalance || user?.wallet || 0).toFixed(2)}
              </strong>
            </div>

            <p style={{ fontSize: "13px", margin: "12px 0 6px", fontWeight: "bold" }}>
              Select Withdraw Amount:
            </p>
            <div style={styles.withdrawPresetGrid}>
              {[100, 300, 500, 1000, 10000].map((amt) => (
                <button
                  key={amt}
                  style={{
                    ...styles.withdrawPresetBtn,
                    ...(selectedWithdrawAmount === amt ? styles.withdrawPresetActive : {})
                  }}
                  onClick={() => setSelectedWithdrawAmount(amt)}
                >
                  ₹ {amt.toLocaleString()}
                </button>
              ))}
            </div>

            <button style={styles.confirmWithdrawBtn} onClick={handleWithdrawSubmit}>
              Confirm Withdraw
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// 🎨 EXACT STYLES MATCHING THE SCREENSHOT & THEME
const styles = {
  page: {
    minHeight: "100vh",
    background: "#030f26",
    color: "#ffffff",
    padding: "16px 16px 100px",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  loadingContainer: {
    minHeight: "100vh",
    background: "#030f26",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  loadingSpinner: {
    width: "45px",
    height: "45px",
    border: "4px solid #1e293b",
    borderTop: "4px solid #38bdf8",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  toast: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#0284c7",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "30px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    zIndex: 100005,
    fontWeight: "bold",
    fontSize: "14px",
    textAlign: "center"
  },

  // TOP HEADER
  topHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px"
  },
  brandContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  logoImg: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "2px solid #22c55e"
  },
  brandTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#22c55e",
    letterSpacing: "0.5px"
  },
  brandSub: {
    margin: 0,
    fontSize: "10px",
    color: "#94a3b8"
  },
  headerWelcome: {
    textAlign: "center"
  },
  welcomeText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800"
  },
  welcomeSub: {
    margin: 0,
    fontSize: "11px",
    color: "#94a3b8"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  notifBtn: {
    position: "relative",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "#fff",
    fontSize: "20px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer"
  },
  notifBadge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  profileCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#fff",
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

  // SUMMARY CARDS
  summaryCard: {
    background: "linear-gradient(90deg, #0284c7 0%, #16a34a 100%)",
    borderRadius: "16px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
  },
  statBox: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  statIcon: {
    fontSize: "22px"
  },
  statTitle: {
    fontSize: "11px",
    color: "#e0f2fe",
    marginTop: "4px"
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "900",
    color: "#ffffff",
    marginTop: "2px"
  },

  // MAIN CARD
  mainCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "20px",
    marginTop: "16px",
    color: "#0f172a",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  },
  cardHeaderTitle: {
    margin: "0 0 16px",
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "8px"
  },
  selectInput: {
    height: "45px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "14px",
    fontWeight: "600",
    outline: "none"
  },
  freqToggleGroup: {
    display: "flex",
    gap: "8px",
    height: "45px"
  },
  freqBtn: {
    flex: 1,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    color: "#475569"
  },
  freqBtnActive: {
    background: "#16a34a",
    color: "#ffffff",
    borderColor: "#16a34a"
  },
  amountInputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  currencyPrefix: {
    position: "absolute",
    left: "12px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#64748b"
  },
  amountInput: {
    width: "100%",
    height: "45px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    paddingLeft: "30px",
    paddingRight: "12px",
    fontSize: "15px",
    fontWeight: "800",
    outline: "none",
    cursor: "pointer",
    background: "#f8fafc"
  },
  inputHelp: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px"
  },

  // RETURN BOX
  returnCardContainer: {
    marginTop: "16px"
  },
  returnBox: {
    borderRadius: "14px",
    padding: "20px",
    textAlign: "center",
    border: "1px solid #bbf7d0"
  },
  returnBoxDaily: {
    background: "#f0fdf4"
  },
  returnBoxWeekly: {
    background: "#eff6ff",
    borderColor: "#bfdbfe"
  },
  returnBoxTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#166534"
  },
  returnBoxValue: {
    margin: "6px 0 0",
    fontSize: "28px",
    fontWeight: "900",
    color: "#16a34a"
  },
  returnBoxNote: {
    fontSize: "11px",
    color: "#64748b"
  },

  // BREAKDOWN
  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    marginTop: "16px",
    overflow: "hidden"
  },
  breakItem: {
    padding: "12px",
    textAlign: "center",
    borderRight: "1px solid #e2e8f0"
  },
  breakLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b"
  },
  breakVal: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a"
  },

  // ACTION BUTTONS
  actionBtnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "16px"
  },
  addFundBtn: {
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(22,163,74,0.3)"
  },
  withdrawBtn: {
    background: "#030f26",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer"
  },

  // HISTORY
  historySection: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "20px",
    marginTop: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  viewAllText: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#16a34a",
    cursor: "pointer"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  },
  tableHeaderRow: {
    background: "#f8fafc",
    textAlign: "left"
  },
  th: {
    padding: "12px",
    color: "#475569",
    fontWeight: "700"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a"
  },
  emptyTd: {
    padding: "30px",
    textAlign: "center",
    color: "#94a3b8"
  },
  badgeFrequency: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold"
  },
  badgeStatus: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold"
  },

  // TRUST BANNER
  trustBanner: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    marginTop: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  trustBadge: {
    textAlign: "right",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#0f172a"
  },

  // MODALS
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100000,
    padding: "16px"
  },
  modalCardSmall: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
    maxWidth: "360px",
    color: "#0f172a"
  },
  modalCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "20px",
    width: "100%",
    maxWidth: "420px",
    color: "#0f172a"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  closeBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  presetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "12px"
  },
  presetBtn: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
    color: "#0284c7"
  },
  walletBox: {
    background: "#f1f5f9",
    padding: "12px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px"
  },
  copyBtn: {
    background: "#0284c7",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  telegramSubmitBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "#0088cc",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer"
  },
  bankForm: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px"
  },
  formInput: {
    height: "42px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "13px",
    outline: "none"
  },
  saveBankBtn: {
    height: "45px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "8px"
  },
  balanceInfoBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "12px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#166534"
  },
  withdrawPresetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginBottom: "16px"
  },
  withdrawPresetBtn: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer"
  },
  withdrawPresetActive: {
    background: "#030f26",
    color: "#ffffff",
    borderColor: "#030f26"
  },
  confirmWithdrawBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer"
  }
};
