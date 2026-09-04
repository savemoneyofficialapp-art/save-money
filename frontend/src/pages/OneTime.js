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

  // Wallet balance safely retrieved
  const currentWalletBalance = Number(
    user?.otbalance ?? user?.otBalance ?? user?.availableBalance ?? 0
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
        setHistory(Array.isArray(data.history) ? data.history : (data.investments || []));
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

  // Calculations
  const dailyReturn = useMemo(() => (Number(amount) * Number(rate)) / 100, [amount, rate]);
  const weeklyReturn = useMemo(() => dailyReturn * 7, [dailyReturn]);
  const totalReturn = useMemo(() => dailyReturn * tenure, [dailyReturn, tenure]);
  const totalPayout = useMemo(() => Number(amount) + totalReturn, [amount, totalReturn]);

  const handleTenureChange = (e) => {
    const selectedDays = Number(e.target.value);
    const plan = tenurePlans.find((p) => p.days === selectedDays);
    if (plan) {
      setTenure(plan.days);
      setRate(plan.rate);
    }
  };

  // ----------------- START NEW INVESTMENT FROM BALANCE -----------------
  const handleStartInvestment = async () => {
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
          dailyReturn
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

  // ----------------- SUBMIT DEPOSIT (SCREENSHOT) -----------------
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
      if (res.ok) {
        triggerToast("Deposit proof submitted! Pending review.", "success");
        setShowAddFundModal(false);
        setTxnId("");
        setScreenshot(null);
        loadDashboardData();
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

  // ----------------- WITHDRAWAL SUBMIT -----------------
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
        loadDashboardData();
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

        {/* TOP STATS CARD */}
        <section style={styles.summaryCard}>
          <div style={styles.statBox}>
            <span style={styles.statIcon}>👛</span>
            <span style={styles.statTitle}>Total Invested</span>
            <strong style={styles.statValue}>
              ₹ {Number(user?.oneTimeTotalInvested || user?.totalInvested || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statIcon}>📈</span>
            <span style={styles.statTitle}>Total Returns</span>
            <strong style={styles.statValue}>
              ₹ {Number(user?.oneTimeTotalReturns || user?.totalReturns || 0).toLocaleString("en-IN")}
            </strong>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statIcon}>💵</span>
            <span style={styles.statTitle}>Total Earnings</span>
            <strong style={styles.statValue}>
              ₹ {Number(user?.oneTimeTotalEarnings || user?.totalEarnings || 0).toLocaleString("en-IN")}
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

          <div style={styles.formGrid}>
            {/* Select Investment Duration */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>📅 Select Duration</label>
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
              <label style={styles.label}>🔄 Return Frequency</label>
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

            {/* Enter Investment Amount */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>💵 Select / Enter Amount</label>
              <div style={styles.amountInputWrap} onClick={() => setShowAmountModal(true)}>
                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#16a34a" }}>₹</span>
                <input style={styles.amountInput} type="text" readOnly value={amount.toLocaleString("en-IN")} />
                <span style={styles.changeBadge}>Change ⚙️</span>
              </div>
              <small style={styles.helpText}>Click to choose quick amount presets</small>
            </div>
          </div>

          {/* RETURN FREQUENCY CARDS */}
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

          {/* BREAKDOWN STRIP */}
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

          {/* MAIN BUTTONS */}
          <div style={styles.actionGridTriple}>
            <button style={styles.startInvestBtn} onClick={handleStartInvestment} disabled={investing}>
              {investing ? "Processing..." : "🚀 Start Investment"}
            </button>

            <button style={styles.addInvestBtn} onClick={() => setShowAddFundModal(true)}>
              ➕ Add Fund
            </button>

            <button style={styles.withdrawBtn} onClick={handleWithdrawClick}>
              ➔ Withdraw
            </button>
          </div>
        </section>

        {/* INVESTMENT HISTORY */}
        <section style={styles.historyCard}>
          <div style={styles.historyHeader}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Investment History</h2>
            <span style={styles.viewAllBtn}>View All</span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Frequency</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Maturity</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyTd}>No investment history found</td>
                  </tr>
                ) : (
                  history.map((item, idx) => (
                    <tr key={item._id || idx}>
                      <td style={styles.td}>
                        {item.startDate ? new Date(item.startDate).toLocaleDateString("en-GB") : (item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB") : "-")}
                      </td>
                      <td style={styles.td}>{item.duration || `${item.durationDays || tenure} Days`}</td>
                      <td style={styles.td}>₹ {Number(item.amount || 0).toLocaleString("en-IN")}</td>
                      <td style={styles.td}>
                        <span style={(item.frequency || "").toLowerCase() === "daily" ? styles.badgeDaily : styles.badgeWeekly}>
                          {item.frequency || "Daily"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, ...getStatusStyle(item.status) }}>
                          {item.status || "Active"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {item.maturityDate ? new Date(item.maturityDate).toLocaleDateString("en-GB") : "-"}
                      </td>
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

      {/* 1. INVESTMENT AMOUNT PRESETS MODAL */}
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

      {/* 2. ADD FUND WITH SCREENSHOT UPLOAD */}
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
  switch (status?.toLowerCase()) {
    case "active":
    case "approved":
      return { background: "#dcfce7", color: "#166534" };
    case "pending":
      return { background: "#fef3c7", color: "#92400e" };
    case "rejected":
    case "cancelled":
      return { background: "#fee2e2", color: "#991b1b" };
    default:
      return { background: "#f1f5f9", color: "#475569" };
  }
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
  amountInput: {
    border: "none",
    background: "transparent",
    fontSize: "15px",
    fontWeight: "bold",
    outline: "none",
    width: "60%",
    cursor: "pointer"
  },
  changeBadge: {
    fontSize: "11px",
    color: "#1d4ed8",
    fontWeight: "bold",
    background: "#eff6ff",
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
    fontWeight: "bold"
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
    boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
    transition: "transform 0.2s ease"
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
