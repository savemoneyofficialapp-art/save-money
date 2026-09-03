import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function OneTime() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  // ----------------- STATES -----------------
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [oneTimerNotifications, setOneTimerNotifications] = useState([]);
  const [history, setHistory] = useState([]);

  // Investment Form State
  const [tenure, setTenure] = useState(15); // Default 15 days
  const [rate, setRate] = useState(0.6); // Default 0.6%
  const [frequency, setFrequency] = useState("daily"); // 'daily' or 'weekly'
  const [amount, setAmount] = useState(10000); // Pre-filled amount

  // Modals / Popups State
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    ifsc: "",
    bankName: "",
    holderName: ""
  });

  // Selected Withdraw Amount (100, 300, 500, 1000, 10000)
  const [selectedWithdrawAmount, setSelectedWithdrawAmount] = useState(100);

  // Toast / Status Message State
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });

  const triggerToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "info" }), 3000);
  };

  // Telegram Link (Change with your real Telegram Username/Link)
  const TELEGRAM_LINK = "https://t.me/your_telegram_username";
  const COMPANY_WALLET_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"; // Replace with your real address

  // Tenure Plans Map
  const tenurePlans = [
    { days: 15, rate: 0.6, label: "15 Days (0.6%)" },
    { days: 30, rate: 0.8, label: "30 Days (0.8%)" },
    { days: 40, rate: 1.0, label: "40 Days (1.0%)" },
    { days: 60, rate: 1.5, label: "60 Days (1.5%)" },
    { days: 100, rate: 2.0, label: "100 Days (2.0%)" }
  ];

  // Pre-filled Amount Options for Investment Modal
  const presetAmounts = [
    { label: "5k", value: 5000 },
    { label: "7.5k", value: 7500 },
    { label: "10k", value: 10000 },
    { label: "50k", value: 50000 },
    { label: "100k", value: 100000 },
    { label: "500k", value: 500000 }
  ];

  // Withdraw Allowed Pre-filled Amounts ONLY
  const withdrawPresets = [100, 300, 500, 1000, 10000];

  // ----------------- LOAD DATA FROM BACKEND -----------------
  useEffect(() => {
    loadDashboardData();
  }, []);

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
        setHistory(data.history || []);
        if (data.user?.bankDetails) {
          setBankForm(data.user.bankDetails);
        }
      } else {
        triggerToast(data.message || "Failed to load dashboard", "error");
      }
    } catch (err) {
      console.error("Error loading OneTime data:", err);
      triggerToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- CALCULATIONS -----------------
  const dailyReturn = useMemo(() => {
    return (Number(amount) * Number(rate)) / 100;
  }, [amount, rate]);

  const weeklyReturn = useMemo(() => {
    return dailyReturn * 7;
  }, [dailyReturn]);

  const totalReturn = useMemo(() => {
    return dailyReturn * tenure;
  }, [dailyReturn, tenure]);

  const totalPayout = useMemo(() => {
    return Number(amount) + totalReturn;
  }, [amount, totalReturn]);

  // Handle Tenure Select
  const handleTenureChange = (e) => {
    const selectedDays = Number(e.target.value);
    const plan = tenurePlans.find((p) => p.days === selectedDays);
    if (plan) {
      setTenure(plan.days);
      setRate(plan.rate);
    }
  };

  // Handle Bank Form Save
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
        triggerToast("Bank Details Saved Successfully!", "success");
        // Open withdraw modal right after saving bank details
        setShowWithdrawModal(true);
      } else {
        triggerToast(data.message || "Failed to save bank details", "error");
      }
    } catch (err) {
      triggerToast("Failed to save bank details", "error");
    }
  };

  // Handle Withdraw Button Click
  const handleWithdrawClick = () => {
    if (!user.bankDetails || !user.bankDetails.accountNumber) {
      setShowBankModal(true);
    } else {
      setShowWithdrawModal(true);
    }
  };

  // Submit Withdrawal Request
  const handleWithdrawSubmit = async () => {
    try {
      const res = await fetch(`${API}/api/onetime/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          email,
          amount: selectedWithdrawAmount
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast("Withdrawal Request Submitted!", "success");
        setShowWithdrawModal(false);
        loadDashboardData(); // Refresh history & balance
      } else {
        triggerToast(data.message || "Withdrawal failed", "error");
      }
    } catch (err) {
      triggerToast("Error processing withdrawal", "error");
    }
  };

  // Copy Wallet Address
  const handleCopyWallet = () => {
    navigator.clipboard.writeText(COMPANY_WALLET_ADDRESS);
    triggerToast("Wallet Address Copied!", "success");
  };

  // Helper for Profile Photo
  const fileUrl = (file) => {
    if (!file) return "";
    if (file.startsWith("http")) return file;
    return `${API}/uploads/${file}`;
  };

  const profilePhoto = fileUrl(user?.photo || user?.profilePhoto || user?.selfiePhoto || "");

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <h3>Loading OneTime Investment...</h3>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#ef4444" : "#22c55e" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER SECTION */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <img
            src={process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/logo512.png` : "/logo512.png"}
            alt="Logo"
            style={styles.logoImg}
            onError={(e) => (e.target.style.display = "none")}
          />
          <div>
            <h1 style={styles.brandTitle}>
              SAVE <span style={{ color: "#20cf72" }}>MONEY</span>
            </h1>
            <p style={styles.brandSubtitle}>Invest Small, Earn Big</p>
          </div>
        </div>

        <div style={styles.welcomeBox}>
          <strong style={styles.welcomeTitle}>Welcome Back! 👋</strong>
          <span style={styles.welcomeSub}>Invest smartly and secure your future with us</span>
        </div>

        <div style={styles.headerRight}>
          {/* Notification Icon (Only One Timer Notifications) */}
          <div style={styles.notifIconContainer} title="One Timer Notifications">
            <span style={{ fontSize: "22px" }}>🔔</span>
            {oneTimerNotifications.length > 0 && (
              <span style={styles.notifBadge}>{oneTimerNotifications.length}</span>
            )}
          </div>

          {/* User Profile Photo */}
          <div style={styles.profileCircle}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="User Profile" style={styles.profileImg} />
            ) : (
              <span style={{ fontSize: "24px", color: "#08a95b" }}>👤</span>
            )}
          </div>
        </div>
      </header>

      {/* TOP SUMMARY STATS CARD */}
      <section style={styles.summaryCard}>
        <div style={styles.statBox}>
          <span style={styles.statIcon}>👛</span>
          <span style={styles.statTitle}>Total Invested</span>
          <strong style={styles.statValue}>₹ {(user?.totalInvested || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statIcon}>📈</span>
          <span style={styles.statTitle}>Total Returns</span>
          <strong style={styles.statValue}>₹ {(user?.totalReturns || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statIcon}>💵</span>
          <span style={styles.statTitle}>Total Earnings</span>
          <strong style={styles.statValue}>₹ {(user?.totalEarnings || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statIcon}>🪙</span>
          <span style={styles.statTitle}>Available Balance</span>
          <strong style={styles.statValue}>₹ {(user?.availableBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </div>
      </section>

      {/* MAKE A NEW INVESTMENT PANEL */}
      <section style={styles.mainCard}>
        <h2 style={styles.cardTitle}>
          Make a New Investment
          <div style={styles.titleLine}></div>
        </h2>

        <div style={styles.formGrid}>
          {/* Select Investment Duration */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>📅 Select Investment Duration</label>
            <select style={styles.select} value={tenure} onChange={handleTenureChange}>
              {tenurePlans.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Choose Return Frequency */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>🔄 Choose Return Frequency</label>
            <div style={styles.frequencyToggle}>
              <button
                type="button"
                style={{ ...styles.freqBtn, ...(frequency === "daily" ? styles.freqBtnActive : {}) }}
                onClick={() => setFrequency("daily")}
              >
                Daily
              </button>
              <button
                type="button"
                style={{ ...styles.freqBtn, ...(frequency === "weekly" ? styles.freqBtnActive : {}) }}
                onClick={() => setFrequency("weekly")}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Enter Investment Amount (Opens Modal on Click) */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>💵 Enter Investment Amount</label>
            <div style={styles.amountInputWrap} onClick={() => setShowAmountModal(true)}>
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>₹</span>
              <input style={styles.amountInput} type="text" readOnly value={amount} />
            </div>
            <small style={styles.helpText}>Click to select quick amount presets</small>
          </div>
        </div>

        {/* RETURN FREQUENCY CARDS (CONDITIONAL SHOW) */}
        <div style={styles.returnGrid}>
          {frequency === "daily" && (
            <div style={styles.dailyReturnCard}>
              <div style={styles.returnCardTitle}>You Will Get Daily Return</div>
              <strong style={styles.returnCardValue}>₹ {dailyReturn.toFixed(2)}</strong>
              <span style={styles.returnCardNote}>(Approx.)</span>
            </div>
          )}

          {frequency === "weekly" && (
            <div style={styles.weeklyReturnCard}>
              <div style={{ ...styles.returnCardTitle, color: "#1557d6" }}>You Will Get Weekly Return</div>
              <strong style={{ ...styles.returnCardValue, color: "#1557d6" }}>₹ {weeklyReturn.toFixed(2)}</strong>
              <span style={styles.returnCardNote}>(Approx.)</span>
            </div>
          )}
        </div>

        {/* BREAKDOWN STRIP */}
        <div style={styles.breakdownGrid}>
          <div style={styles.breakBox}>
            <span style={styles.breakLabel}>Investment Amount</span>
            <strong style={styles.breakValue}>₹ {Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={styles.breakBox}>
            <span style={styles.breakLabel}>Duration</span>
            <strong style={styles.breakValue}>{tenure} Days ({rate}%)</strong>
          </div>
          <div style={styles.breakBox}>
            <span style={styles.breakLabel}>Total Return (Approx.)</span>
            <strong style={styles.breakValue}>₹ {totalReturn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={styles.breakBox}>
            <span style={styles.breakLabel}>Total Payout (Principal + Return)</span>
            <strong style={styles.breakValue}>₹ {totalPayout.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* MAIN ACTION BUTTONS */}
        <div style={styles.actionGrid}>
          <button style={styles.addInvestBtn} onClick={() => setShowAddFundModal(true)}>
            <span style={{ fontSize: "20px" }}>➕</span> Add Invest
            <br />
            <small style={{ fontSize: "12px", opacity: 0.8 }}>Invest More</small>
          </button>

          <button style={styles.withdrawBtn} onClick={handleWithdrawClick}>
            <span style={{ fontSize: "20px" }}>➔</span> Withdraw
            <br />
            <small style={{ fontSize: "12px", opacity: 0.8 }}>Withdraw Funds</small>
          </button>
        </div>
      </section>

      {/* INVESTMENT & TRANSACTION HISTORY SECTION */}
      <section style={styles.historyCard}>
        <div style={styles.historyHeader}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Investment History</h2>
          <span style={styles.viewAllBtn}>View All</span>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Duration</th>
                <th style={styles.th}>Invested Amount</th>
                <th style={styles.th}>Return Frequency</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Maturity Date</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTd}>
                    No history available
                  </td>
                </tr>
              ) : (
                history.map((item, idx) => (
                  <tr key={idx}>
                    <td style={styles.td}>{item.date || new Date(item.createdAt).toLocaleDateString("en-GB")}</td>
                    <td style={styles.td}>{item.duration || `${item.durationDays || tenure} Days`}</td>
                    <td style={styles.td}>₹ {Number(item.amount).toLocaleString("en-IN")}</td>
                    <td style={styles.td}>
                      <span style={item.frequency === "daily" ? styles.badgeDaily : styles.badgeWeekly}>
                        {item.frequency || "Daily"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, ...getStatusStyle(item.status) }}>
                        {item.status || "Active"}
                      </span>
                    </td>
                    <td style={styles.td}>{item.maturityDate || item.maturity || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TRUST BANNER FOOTER */}
      <section style={styles.trustBanner}>
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>Invest Small, Earn Big Returns Together</h3>
          <p style={{ margin: 0, opacity: 0.8, fontSize: "13px" }}>Start investing today and secure your future.</p>
        </div>
        <div style={{ textAlign: "right", color: "#16a34a", fontWeight: "bold" }}>
          🛡 100% Secure
          <br />
          <small style={{ color: "#64748b" }}>Safe & Trusted Platform</small>
        </div>
      </section>

      {/* ----------------- MODALS / POPUPS ----------------- */}

      {/* 1. AMOUNT SELECT POPUP */}
      {showAmountModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3>Select Investment Amount</h3>
              <button style={styles.closeBtn} onClick={() => setShowAmountModal(false)}>✕</button>
            </div>
            <div style={styles.presetGrid}>
              {presetAmounts.map((p) => (
                <button
                  key={p.value}
                  style={styles.presetBtn}
                  onClick={() => {
                    setAmount(p.value);
                    setShowAmountModal(false);
                  }}
                >
                  {p.label} (₹{p.value.toLocaleString("en-IN")})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ADD FUND / DEPOSIT POPUP */}
      {showAddFundModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3>Add Investment Fund</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddFundModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: "14px", color: "#475569" }}>
              Copy the wallet address below, make the payment, and click the button to send the payment screenshot along with your Wallet ID directly via Telegram.
            </p>

            <div style={styles.walletBox}>
              <small style={{ color: "#64748b", fontWeight: "bold" }}>Company Wallet Address:</small>
              <div style={styles.walletAddrRow}>
                <span style={styles.walletText}>{COMPANY_WALLET_ADDRESS}</span>
                <button style={styles.copyBtn} onClick={handleCopyWallet}>Copy</button>
              </div>
            </div>

            <div style={{ marginTop: "15px" }}>
              <p style={{ fontSize: "12px", color: "#0f172a", fontWeight: "bold", marginBottom: "8px" }}>
                Your Wallet / User ID: <span style={{ color: "#1557d6" }}>{user?._id || email}</span>
              </p>
              
              <a
                href={`${TELEGRAM_LINK}?text=${encodeURIComponent(
                  `Hello Admin, I have made a OneTime Investment deposit.\nMy Email/Wallet ID: ${user?._id || email}\nAmount: ₹${amount}`
                )}`}
                target="_blank"
                rel="noreferrer"
                style={styles.telegramBtn}
              >
                ✈️ Send Screenshot on Telegram
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD BANK ACCOUNT POPUP */}
      {showBankModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3>Add Bank Details</h3>
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

      {/* 4. WITHDRAWAL POPUP */}
      {showWithdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3>Withdraw Funds</h3>
              <button style={styles.closeBtn} onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>

            <div style={styles.withdrawBalanceInfo}>
              <span>Available Wallet Balance:</span>
              <strong>₹ {(user?.availableBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", margin: "10px 0 6px" }}>
              Select Pre-filled Withdrawal Amount (Cannot enter manual amount):
            </p>

            <div style={styles.withdrawPresetGrid}>
              {withdrawPresets.map((amt) => (
                <button
                  key={amt}
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

            <small style={{ color: "#ef4444", display: "block", marginTop: "10px" }}>
              * You can withdraw only ONCE per day. If rejected, you can request again.
            </small>

            <button style={{ ...styles.submitBtn, marginTop: "15px" }} onClick={handleWithdrawSubmit}>
              Confirm Withdrawal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for status colors
const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
    case "approved":
      return { background: "#dcfce7", color: "#166534" };
    case "pending":
      return { background: "#fef3c7", color: "#92400e" };
    case "rejected":
      return { background: "#fee2e2", color: "#991b1b" };
    default:
      return { background: "#f1f5f9", color: "#475569" };
  }
};

// CSS-IN-JS STYLES matching design 1000%
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #061b3a 0%, #0a2851 100%)",
    padding: "20px",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#0f172a",
    boxSizing: "border-box"
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
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    zIndex: 99999,
    fontWeight: "bold"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "white",
    marginBottom: "20px"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  logoImg: {
    width: "48px",
    height: "48px",
    borderRadius: "12px"
  },
  brandTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },
  brandSubtitle: {
    margin: 0,
    fontSize: "12px",
    opacity: 0.8
  },
  welcomeBox: {
    textAlign: "center"
  },
  welcomeTitle: {
    fontSize: "18px",
    display: "block"
  },
  welcomeSub: {
    fontSize: "12px",
    opacity: 0.75
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "15px"
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
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  profileCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "2px solid #20cf72"
  },
  profileImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  summaryCard: {
    background: "linear-gradient(100deg, #1557d6, #08a95b)",
    borderRadius: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    padding: "20px",
    color: "white",
    boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
    marginBottom: "20px"
  },
  statBox: {
    textAlign: "center",
    borderRight: "1px solid rgba(255,255,255,0.2)",
    padding: "10px"
  },
  statIcon: {
    fontSize: "24px",
    display: "block",
    marginBottom: "4px"
  },
  statTitle: {
    fontSize: "13px",
    opacity: 0.9
  },
  statValue: {
    display: "block",
    fontSize: "22px",
    fontWeight: "800",
    marginTop: "4px"
  },
  mainCard: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    marginBottom: "20px"
  },
  cardTitle: {
    margin: "0 0 20px 0",
    fontSize: "20px",
    fontWeight: "800"
  },
  titleLine: {
    width: "40px",
    height: "3px",
    background: "#08a95b",
    marginTop: "6px",
    borderRadius: "2px"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "20px"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#334155"
  },
  select: {
    height: "50px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "15px",
    outline: "none"
  },
  frequencyToggle: {
    display: "flex",
    gap: "8px",
    height: "50px"
  },
  freqBtn: {
    flex: 1,
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  freqBtnActive: {
    background: "#08a95b",
    color: "white",
    borderColor: "#08a95b"
  },
  amountInputWrap: {
    height: "50px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    background: "#f8fafc"
  },
  amountInput: {
    border: "none",
    background: "transparent",
    fontSize: "16px",
    fontWeight: "bold",
    outline: "none",
    width: "100%",
    cursor: "pointer"
  },
  helpText: {
    color: "#64748b",
    fontSize: "11px",
    marginTop: "4px"
  },
  returnGrid: {
    margin: "15px 0"
  },
  dailyReturnCard: {
    background: "#eaf9ef",
    border: "1px solid #d1f1dc",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center"
  },
  weeklyReturnCard: {
    background: "#eef5ff",
    border: "1px solid #d7e5ff",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center"
  },
  returnCardTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#07894b",
    marginBottom: "6px"
  },
  returnCardValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#07894b"
  },
  returnCardNote: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px"
  },
  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    overflow: "hidden",
    margin: "20px 0"
  },
  breakBox: {
    padding: "15px",
    textAlign: "center",
    borderRight: "1px solid #e2e8f0"
  },
  breakLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px"
  },
  breakValue: {
    fontSize: "15px",
    color: "#0f172a"
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },
  addInvestBtn: {
    height: "60px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #08a95b, #068044)",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  withdrawBtn: {
    height: "60px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #061b3a, #0a2851)",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  historyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    marginBottom: "20px"
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  viewAllBtn: {
    color: "#08a95b",
    fontWeight: "bold",
    cursor: "pointer"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "13px"
  },
  th: {
    background: "#f8fafc",
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9"
  },
  emptyTd: {
    textAlign: "center",
    padding: "30px",
    color: "#94a3b8"
  },
  badgeDaily: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold"
  },
  badgeWeekly: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold"
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold"
  },
  trustBanner: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
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
    padding: "24px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.25)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  closeBtn: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  presetGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  presetBtn: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontWeight: "bold",
    cursor: "pointer"
  },
  walletBox: {
    background: "#f1f5f9",
    padding: "12px",
    borderRadius: "12px",
    marginTop: "12px"
  },
  walletAddrRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "4px"
  },
  walletText: {
    fontSize: "12px",
    wordBreak: "break-all",
    fontWeight: "bold",
    color: "#0f172a"
  },
  copyBtn: {
    background: "#08a95b",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold"
  },
  telegramBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px",
    background: "#0088cc",
    color: "white",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "14px",
    marginTop: "10px"
  },
  inputModal: {
    height: "46px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "14px",
    outline: "none"
  },
  submitBtn: {
    height: "48px",
    borderRadius: "12px",
    border: "none",
    background: "#08a95b",
    color: "white",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    width: "100%"
  },
  withdrawBalanceInfo: {
    background: "#e0f2fe",
    padding: "12px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    color: "#0369a1",
    fontSize: "14px"
  },
  withdrawPresetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px"
  },
  withdrawPresetBtn: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },
  withdrawPresetActive: {
    background: "#1557d6",
    color: "white",
    borderColor: "#1557d6"
  }
};
