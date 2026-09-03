import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API } from "../config";

export default function OneTimeInvestment() {
  const token = localStorage.getItem("token");

  // Independent One-Time Wallet & Investment States
  const [oneTimeWallet, setOneTimeWallet] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // Form States
  const [duration, setDuration] = useState("60 Days (1.5%)");
  const [frequency, setFrequency] = useState("Daily");
  const [amount, setAmount] = useState("5000");

  // Popups & Requests
  const [addFundModal, setAddFundModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);

  // Add Fund Form Inputs
  const [fundAmount, setFundAmount] = useState("");
  const [txnId, setTxnId] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  // Withdraw Form Inputs
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    upiId: ""
  });

  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchOneTimeData();
  }, []);

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return { msg: "Invalid server response" };
    }
  };

  const fetchOneTimeData = async () => {
    try {
      const res = await fetch(`${API}/one-time/user-data`, {
        headers: { authorization: token || "" }
      });
      const d = await safeJson(res);
      if (d.success) {
        setOneTimeWallet(d.oneTimeWalletBalance || 0);
        setTotalInvested(d.totalInvested || 0);
        setTotalEarnings(d.totalEarnings || 0);
        setHistory(d.history || []);
      }
    } catch (err) {
      console.error("Fetch One-Time Data Error:", err);
    }
  };

  // Submit Add Fund Request with Screenshot
  const handleAddFundSubmit = async (e) => {
    e.preventDefault();
    if (!fundAmount || !txnId || !screenshot) {
      toast.error("Please fill all fields and upload payment screenshot.");
      return;
    }

    const formData = new FormData();
    formData.append("amount", fundAmount);
    formData.append("txnId", txnId);
    formData.append("screenshot", screenshot);

    try {
      const res = await fetch(`${API}/one-time/add-fund-request`, {
        method: "POST",
        headers: { authorization: token || "" },
        body: formData
      });
      const d = await safeJson(res);
      if (d.success) {
        toast.success("Add fund request submitted! Pending admin approval.");
        setAddFundModal(false);
        setFundAmount("");
        setTxnId("");
        setScreenshot(null);
      } else {
        toast.error(d.msg || "Failed to submit add fund request.");
      }
    } catch (err) {
      toast.error("Network error submitting request.");
    }
  };

  // Submit Withdraw Request
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error("Enter a valid withdrawal amount.");
      return;
    }
    if (Number(withdrawAmount) > oneTimeWallet) {
      toast.error("Insufficient One-Time Wallet Balance.");
      return;
    }

    try {
      const res = await fetch(`${API}/one-time/withdraw-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ amount: withdrawAmount, bankDetails })
      });
      const d = await safeJson(res);
      if (d.success) {
        toast.success("Withdrawal request submitted successfully!");
        setWithdrawModal(false);
        setWithdrawAmount("");
        fetchOneTimeData();
      } else {
        toast.error(d.msg || "Withdrawal request failed.");
      }
    } catch (err) {
      toast.error("Network error submitting withdrawal.");
    }
  };

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  return (
    <div style={styles.pageContainer}>
      {/* Top Welcome Header */}
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.brandTitle}>SAVE MONEY</h2>
          <p style={styles.brandSubtitle}>One-Time High Yield Investment</p>
        </div>
        <div style={styles.welcomePill}>
          <span>Welcome Back! 👋</span>
        </div>
      </div>

      {/* Stats / Independent Wallet Banner */}
      <div style={styles.statsBanner}>
        <div style={styles.statBox}>
          <p style={styles.statLabel}>Total Invested</p>
          <h3 style={styles.statValue}>{money(totalInvested)}</h3>
        </div>
        <div style={styles.statBox}>
          <p style={styles.statLabel}>Total Earnings</p>
          <h3 style={styles.statValue}>{money(totalEarnings)}</h3>
        </div>
        <div style={{ ...styles.statBox, borderRight: "none" }}>
          <p style={{ ...styles.statLabel, color: "#38bdf8" }}>One-Time Wallet</p>
          <h3 style={{ ...styles.statValue, color: "#22c55e" }}>{money(oneTimeWallet)}</h3>
        </div>
      </div>

      {/* Make Investment Card */}
      <div style={styles.card}>
        <h3 style={styles.cardHeaderTitle}>Make a New Investment</h3>

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Select Investment Duration</label>
            <select
              style={styles.selectInput}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option>60 Days (1.5% Daily)</option>
              <option>90 Days (2.0% Daily)</option>
              <option>120 Days (2.5% Daily)</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Choose Return Frequency</label>
            <div style={styles.freqGroup}>
              <button
                style={frequency === "Daily" ? styles.freqBtnActive : styles.freqBtn}
                onClick={() => setFrequency("Daily")}
              >
                Daily
              </button>
              <button
                style={frequency === "Weekly" ? styles.freqBtnActive : styles.freqBtn}
                onClick={() => setFrequency("Weekly")}
              >
                Weekly
              </button>
            </div>
          </div>

          <div>
            <label style={styles.label}>Enter Investment Amount</label>
            <input
              type="number"
              style={styles.textInput}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Return Calculation Preview */}
        <div style={styles.returnPreviewBox}>
          <p style={{ margin: 0, color: "#15803d", fontWeight: "600", fontSize: "14px" }}>
            You Will Get Daily Return
          </p>
          <h2 style={{ margin: "5px 0", color: "#16a34a", fontSize: "28px" }}>
            ₹{((Number(amount) * 1.5) / 100).toFixed(2)}
          </h2>
          <small style={{ color: "#65a30d" }}>(Approximate Estimate)</small>
        </div>

        {/* Investment Breakdown Summary */}
        <div style={styles.breakdownGrid}>
          <div>
            <span>Investment Amount</span>
            <b>₹{amount || 0}</b>
          </div>
          <div>
            <span>Duration</span>
            <b>{duration}</b>
          </div>
          <div>
            <span>Total Returns (Approx)</span>
            <b>₹{(Number(amount) * 0.9).toFixed(2)}</b>
          </div>
          <div>
            <span>Total Payout</span>
            <b>₹{(Number(amount) * 1.9).toFixed(2)}</b>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionRow}>
          <button style={styles.addFundBtn} onClick={() => setAddFundModal(true)}>
            ➕ Add Fund
          </button>
          <button style={styles.withdrawBtn} onClick={() => setWithdrawModal(true)}>
            ↗ Withdraw
          </button>
        </div>
      </div>

      {/* Investment History Table */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={styles.cardHeaderTitle}>Investment History</h3>
          <span style={{ color: "#22c55e", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}>View All</span>
        </div>

        {history.length === 0 ? (
          <p style={styles.emptyText}>No investment history available.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.duration}</td>
                    <td>{money(item.amount)}</td>
                    <td>{item.frequency}</td>
                    <td style={{ color: "#22c55e", fontWeight: "bold" }}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Footer Banner */}
      <div style={styles.footerBanner}>
        <div>
          <b>Invest Small, Earn Big Returns Together</b>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
            Start investing today and secure your financial future.
          </p>
        </div>
        <span style={styles.secureBadge}>🛡️ 100% Secure</span>
      </div>

      {/* MODAL 1: ADD FUND (SCREENSHOT UPLOAD) */}
      {addFundModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Add Fund to One-Time Wallet</h3>
              <button style={styles.closeBtn} onClick={() => setAddFundModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddFundSubmit} style={{ marginTop: "15px" }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Deposit Amount (₹)</label>
                <input
                  type="number"
                  style={styles.textInput}
                  placeholder="e.g. 5000"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>UTR / Payment Transaction ID</label>
                <input
                  type="text"
                  style={styles.textInput}
                  placeholder="Enter 12-digit UTR/Txn Hash"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Upload Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  style={{ ...styles.textInput, padding: "8px" }}
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  required
                />
              </div>

              <button type="submit" style={styles.submitBtn}>
                Submit Request For Admin Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WITHDRAW FROM ONE-TIME WALLET */}
      {withdrawModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Withdraw One-Time Funds</h3>
              <button style={styles.closeBtn} onClick={() => setWithdrawModal(false)}>✕</button>
            </div>
            <form onSubmit={handleWithdrawSubmit} style={{ marginTop: "15px" }}>
              <p style={{ color: "#22c55e", fontSize: "14px", fontWeight: "bold" }}>
                Available Balance: {money(oneTimeWallet)}
              </p>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  style={styles.textInput}
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Holder Name</label>
                <input
                  type="text"
                  style={styles.textInput}
                  placeholder="Full Name"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Bank Account Number</label>
                <input
                  type="text"
                  style={styles.textInput}
                  placeholder="Account Number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>IFSC Code</label>
                <input
                  type="text"
                  style={styles.textInput}
                  placeholder="Bank IFSC Code"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                  required
                />
              </div>

              <button type="submit" style={{ ...styles.submitBtn, background: "#0ea5e9" }}>
                Submit Withdraw Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: "100vh", // Stretches across full display height
    width: "100%",
    background: "#020617",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "16px 16px 40px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  brandTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "#22c55e"
  },
  brandSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#94a3b8"
  },
  welcomePill: {
    background: "#0f172a",
    border: "1px solid #334155",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#e2e8f0"
  },
  statsBanner: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
    borderRadius: "16px",
    padding: "14px 10px",
    marginBottom: "20px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
  },
  statBox: {
    textAlign: "center",
    borderRight: "1px solid rgba(255,255,255,0.2)",
    padding: "0 4px"
  },
  statLabel: {
    margin: 0,
    fontSize: "11px",
    color: "#e0f2fe",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  statValue: {
    margin: "4px 0 0 0",
    fontSize: "15px",
    fontWeight: "800",
    color: "#ffffff"
  },
  card: {
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
  },
  cardHeaderTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a"
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "6px"
  },
  selectInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: "14px",
    color: "#0f172a",
    boxSizing: "border-box"
  },
  textInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    fontSize: "14px",
    color: "#0f172a",
    boxSizing: "border-box"
  },
  freqGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  freqBtn: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: "600",
    cursor: "pointer"
  },
  freqBtnActive: {
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "#22c55e",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer"
  },
  returnPreviewBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "16px",
    textAlign: "center",
    margin: "18px 0"
  },
  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "8px",
    padding: "12px 0",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "11px",
    textAlign: "center",
    color: "#64748b"
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "16px"
  },
  addFundBtn: {
    background: "#22c55e",
    border: "none",
    color: "#ffffff",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer"
  },
  withdrawBtn: {
    background: "#0f172a",
    border: "none",
    color: "#ffffff",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer"
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
    margin: "20px 0"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    marginTop: "10px"
  },
  footerBanner: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#0f172a",
    marginTop: "auto"
  },
  secureBadge: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.85)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 9999
  },
  modalBox: {
    background: "#ffffff",
    color: "#0f172a",
    width: "min(420px, 100%)",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "10px"
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer",
    color: "#64748b"
  },
  inputGroup: {
    marginBottom: "12px"
  },
  submitBtn: {
    width: "100%",
    background: "#22c55e",
    border: "none",
    color: "#ffffff",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "10px"
  }
};
