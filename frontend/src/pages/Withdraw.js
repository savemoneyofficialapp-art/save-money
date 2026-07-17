import React, { useEffect, useState } from "react";
import { API } from "../config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Withdraw() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [amount, setAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [bank, setBank] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  // ৫% TDS এবং ফাইনাল ব্যাংক ক্রেডিট হিসাবের ক্যালকুলেশন
  const inputAmount = Number(amount) || 0;
  const tdsDeduction = inputAmount * 0.05;
  const finalBankCredit = inputAmount > 0 ? inputAmount - tdsDeduction : 0;

  const loadInfo = async () => {
    try {
      const res = await fetch(`${API}/withdraw-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        setWalletBalance(data.walletBalance || 0);
        setWithdrawableBalance(data.withdrawableBalance || 0);
        setBank(data.bank || null);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.log("WITHDRAW INFO ERROR:", err);
    }
  };

  const submitWithdraw = async () => {
    if (Number(amount) < 100) {
      toast.info("Minimum withdraw amount is ₹100");
      return;
    }

    if (Number(amount) > withdrawableBalance) {
      toast.info("You can withdraw only 80% of wallet balance");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/withdraw-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email, amount })
      });

      const data = await res.json();
      alert(data.msg);

      if (data.success) {
        setAmount("");
        loadInfo();
      }
    } catch (err) {
      toast.warning("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Top Navigation Wrapper */}
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ✕
        </button>
        <span style={styles.topNavTitle}>Secure Pay</span>
      </div>

      <div style={styles.mainWrapper}>
        {/* Header Section */}
        <div style={styles.header}>
          <h1 style={styles.mainHeading}>Withdraw Funds</h1>
          <p style={styles.subHeading}>Transfer your rewards directly to your bank account</p>
        </div>

        {/* 💳 Balance Overview Cards Grid */}
        <section style={styles.balanceGrid}>
          <div style={styles.balanceCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>💰</span>
              <span style={styles.cardTag}>Total Earnings</span>
            </div>
            <h2 style={styles.cardAmount}>{money(walletBalance)}</h2>
            <p style={styles.cardDesc}>Available in wallet today</p>
          </div>

          <div style={{ ...styles.balanceCard, ...styles.balanceCardSpecial }}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>⚡</span>
              <span style={{ ...styles.cardTag, color: "#67e8f9" }}>Withdrawable</span>
            </div>
            <h2 style={{ ...styles.cardAmount, color: "#22d3ee" }}>{money(withdrawableBalance)}</h2>
            <p style={styles.cardDesc}>80% limit configuration applied</p>
          </div>
        </section>

        {/* 💸 Request Withdraw Area */}
        <section style={styles.glassContainer}>
          <h3 style={styles.sectionTitle}>Amount to Payout</h3>
          
          <div style={styles.inputWrapper}>
            <span style={styles.currencyPrefix}>₹</span>
            <input
              style={styles.input}
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          {/* 📊 ৫% TDS এবং ব্যাংক ক্রেডিট এর লাইভ হিসাব */}
          {inputAmount > 0 && (
            <div style={styles.calculationBox}>
              <div style={styles.calcRow}>
                <span style={styles.calcLabel}>Gross Amount:</span>
                <span style={styles.calcValue}>{money(inputAmount)}</span>
              </div>
              <div style={styles.calcRow}>
                <span style={{ ...styles.calcLabel, color: "#f87171" }}>TDS Deduction (5%):</span>
                <span style={{ ...styles.calcValue, color: "#f87171" }}>- {money(tdsDeduction)}</span>
              </div>
              <div style={{ ...styles.calcRow, ...styles.calcTotalRow }}>
                <span style={{ ...styles.calcLabel, color: "#4ade80", fontWeight: "700" }}>Net Bank Credit:</span>
                <span style={{ ...styles.calcValue, color: "#4ade80", fontWeight: "700" }}>{money(finalBankCredit)}</span>
              </div>
            </div>
          )}

          <p style={styles.minNotice}>Minimum withdrawal limit is ₹100</p>

          <button style={styles.submitBtn} onClick={submitWithdraw} disabled={loading}>
            {loading ? (
              <span style={styles.loaderFlex}>
                <span style={styles.spinner}></span> Processing Request...
              </span>
            ) : "Confirm & Withdraw Funds"}
          </button>

          <div style={styles.noteBox}>
            <span style={styles.noteIcon}>ⓘ</span>
            <p style={styles.noteText}>
              Payouts are verified via secure layer. Once submitted, requests usually approve within a few hours.
            </p>
          </div>
        </section>

        {/* 🏦 Dynamic Bank Details Section */}
        <section style={styles.glassContainer}>
          <h3 style={styles.sectionTitle}>🏦 Settlement Account</h3>

          {!bank ? (
            <div style={styles.noBankView}>
              <p style={styles.noBankText}>No linked bank account detected for settlements.</p>
              <button style={styles.bankSetupBtn} onClick={() => navigate("/bank-details")}>
                + Add Bank Details
              </button>
            </div>
          ) : (
            <div style={styles.bankGrid}>
              <div style={styles.bankMeta}>
                <span style={styles.metaLabel}>HOLDER NAME</span>
                <span style={styles.metaValue}>{bank.accountHolderName}</span>
              </div>
              <div style={styles.bankMeta}>
                <span style={styles.metaLabel}>BANK NAME</span>
                <span style={styles.metaValue}>{bank.bankName}</span>
              </div>
              <div style={styles.bankMeta}>
                <span style={styles.metaLabel}>ACCOUNT NUMBER</span>
                <span style={styles.metaValue}>{bank.accountNumber}</span>
              </div>
              <div style={styles.bankMeta}>
                <span style={styles.metaLabel}>IFSC CODE</span>
                <span style={styles.metaValue}>{bank.ifscCode}</span>
              </div>
              {bank.upiId && (
                <div style={{ ...styles.bankMeta, gridColumn: "1 / -1" }}>
                  <span style={styles.metaLabel}>CONNECTED UPI ID</span>
                  <span style={{ ...styles.metaValue, color: "#a855f7" }}>{bank.upiId}</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 📜 Neat Transaction Audit Logs */}
        <section style={styles.glassContainer}>
          <h3 style={styles.sectionTitle}>Audit Statement</h3>

          {history.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ margin: 0 }}>No past settlement records found.</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((x) => {
                const isSuccess = x.status === "Success";
                const isRejected = x.status === "Rejected";
                
                return (
                  <div key={x._id} style={styles.historyRow}>
                    <div style={styles.historyLeft}>
                      <span style={{
                        ...styles.statusDot,
                        background: isSuccess ? "#22c55e" : isRejected ? "#ef4444" : "#eab308"
                      }}></span>
                      <div>
                        <span style={styles.historyAmt}>{money(x.amount)}</span>
                        <span style={styles.historyDate}>
                          {new Date(x.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        {x.rejectReason && <span style={styles.reasonText}>Reason: {x.rejectReason}</span>}
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background: isSuccess ? "rgba(34,197,94,0.1)" : isRejected ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                        color: isSuccess ? "#4ade80" : isRejected ? "#f87171" : "#facc15",
                        border: isSuccess ? "1px solid rgba(34,197,94,0.2)" : isRejected ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(234,179,8,0.2)"
                      }}
                    >
                      {x.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// 💎 HIGH-END FINTECH GLASSMORPHISM UX STYLESHEET (UPDATED FOR FULLSCREEN & PREMIUM BACKGROUND)
const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    color: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    // প্রিমিয়াম অ্যাবস্ট্রাক্ট ডার্ক ব্যাকগ্রাউন্ড ইমেজ লিনিয়ার গ্রেডিয়েন্ট ওভারলে সহ
    backgroundImage: "linear-gradient(180deg, rgba(3, 7, 18, 0.88) 0%, rgba(11, 21, 48, 0.93) 100%), url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    padding: "20px 14px 40px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    width: "100%",
    maxWidth: "100%", // মোবাইল স্ক্রিনে ফুল উইডথ পাওয়ার জন্য
    marginBottom: "16px"
  },
  backBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  topNavTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.8px",
    textTransform: "uppercase"
  },
  mainWrapper: {
    width: "100%", // মোবাইলে পুরো স্ক্রিন কভার করবে
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  header: {
    textAlign: "left",
    padding: "0 4px",
    marginBottom: "4px"
  },
  mainHeading: {
    fontSize: "26px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    margin: "0 0 6px 0",
    background: "linear-gradient(to right, #ffffff, #cbd5e1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subHeading: {
    margin: 0,
    fontSize: "13px",
    color: "#94a3b8"
  },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  balanceCard: {
    padding: "16px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 41, 59, 0.85) 100%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
  },
  balanceCardSpecial: {
    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)",
    border: "1px solid rgba(6, 182, 212, 0.25)"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px"
  },
  cardIcon: {
    fontSize: "14px"
  },
  cardTag: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#cbd5e1"
  },
  cardAmount: {
    fontSize: "20px",
    fontWeight: "800",
    margin: "0 0 4px 0",
    color: "#ffffff"
  },
  cardDesc: {
    margin: 0,
    fontSize: "11px",
    color: "#94a3b8"
  },
  glassContainer: {
    padding: "20px",
    borderRadius: "24px",
    background: "rgba(15, 23, 42, 0.65)", // গ্লাস ফিল ব্যাকগ্রাউন্ড ডার্ক করা হয়েছে
    border: "1px solid rgba(255, 255, 255, 0.09)",
    backdropFilter: "blur(25px)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)"
  },
  sectionTitle: {
    margin: "0 0 14px 0",
    fontSize: "14px",
    fontWeight: "700",
    color: "#cbd5e1",
    letterSpacing: "0.5px"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "rgba(2, 6, 23, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "16px",
    padding: "2px 16px"
  },
  currencyPrefix: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#94a3b8",
    marginRight: "6px"
  },
  input: {
    width: "100%",
    height: "50px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "700",
    outline: "none"
  },
  calculationBox: {
    marginTop: "12px",
    padding: "12px 16px",
    background: "rgba(2, 6, 23, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  calcRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calcTotalRow: {
    borderTop: "1px dashed rgba(255, 255, 255, 0.15)",
    paddingTop: "6px",
    marginTop: "2px"
  },
  calcLabel: {
    fontSize: "12px",
    color: "#cbd5e1",
    fontWeight: "500"
  },
  calcValue: {
    fontSize: "12px",
    color: "#ffffff",
    fontWeight: "600"
  },
  minNotice: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: "8px 0 16px 4px"
  },
  submitBtn: {
    width: "100%",
    height: "50px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)"
  },
  loaderFlex: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%"
  },
  noteBox: {
    display: "flex",
    gap: "8px",
    marginTop: "14px",
    background: "rgba(255,255,255,0.03)",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)"
  },
  noteIcon: {
    color: "#3b82f6",
    fontWeight: "bold",
    fontSize: "13px"
  },
  noteText: {
    margin: 0,
    fontSize: "11px",
    color: "#94a3b8",
    lineHeight: "1.4"
  },
  noBankView: {
    textAlign: "center",
    padding: "16px 0"
  },
  noBankText: {
    color: "#94a3b8",
    fontSize: "12px",
    marginBottom: "12px"
  },
  bankSetupBtn: {
    padding: "8px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer"
  },
  bankGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    background: "rgba(2, 6, 23, 0.4)",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.05)"
  },
  bankMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  metaLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.5px"
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#ffffff" // ব্যাংক ভ্যালুর টেক্সট কালার সাদা করা হয়েছে যাতে ভালোভাবে পড়া যায়
  },
  emptyState: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "12px",
    padding: "16px 0"
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    background: "rgba(2, 6, 23, 0.3)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "14px"
  },
  historyLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px"
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    marginTop: "5px",
    flexShrink: 0
  },
  historyAmt: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff"
  },
  historyDate: {
    display: "block",
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "2px"
  },
  reasonText: {
    display: "block",
    fontSize: "11px",
    color: "#ef4444",
    marginTop: "2px",
    fontStyle: "italic"
  },
  statusBadge: {
    padding: "3px 10px",
    borderRadius: "16px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.3px"
  }
};
