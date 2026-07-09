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

// 💎 HIGH-END FINTECH GLASSMORPHISM UX STYLESHEET
const styles = {
  page: {
    minHeight: "100vh",
    color: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    background: "linear-gradient(180deg, #030712 0%, #0b1530 50%, #030712 100%)",
    padding: "16px 16px 60px",
    boxSizing: "border-box"
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    maxWidth: "680px",
    margin: "0 auto 20px"
  },
  backBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(255, 255, 255, 0.03)",
    color: "#94a3b8",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  topNavTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
  },
  mainWrapper: {
    maxWidth: "680px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  header: {
    textAlign: "left",
    padding: "0 4px"
  },
  mainHeading: {
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    margin: "0 0 6px 0",
    background: "linear-gradient(to right, #ffffff, #94a3b8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subHeading: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b"
  },
  /* 💰 GRID OVERVIEWS */
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },
  balanceCard: {
    padding: "20px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  },
  balanceCardSpecial: {
    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)",
    border: "1px solid rgba(6, 182, 212, 0.15)"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px"
  },
  cardIcon: {
    fontSize: "16px"
  },
  cardTag: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8"
  },
  cardAmount: {
    fontSize: "22px",
    fontWeight: "800",
    margin: "0 0 4px 0",
    color: "#ffffff"
  },
  cardDesc: {
    margin: 0,
    fontSize: "11px",
    color: "#475569"
  },
  /* 📦 GLASS CONTAINERS */
  glassContainer: {
    padding: "24px",
    borderRadius: "28px",
    background: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "15px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.3px"
  },
  /* 💵 PAYOUT FORM COMPONENTS */
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "rgba(2, 6, 23, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "4px 20px"
  },
  currencyPrefix: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#475569",
    marginRight: "8px"
  },
  input: {
    width: "100%",
    height: "56px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "26px",
    fontWeight: "700",
    outline: "none"
  },
  minNotice: {
    fontSize: "12px",
    color: "#64748b",
    margin: "8px 0 20px 4px"
  },
  submitBtn: {
    width: "100%",
    height: "54px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)"
  },
  loaderFlex: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%"
  },
  noteBox: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    background: "rgba(255,255,255,0.02)",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.04)"
  },
  noteIcon: {
    color: "#3b82f6",
    fontWeight: "bold",
    fontSize: "14px"
  },
  noteText: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b",
    lineHeight: "1.5"
  },
  /* 🏦 BANK COMPONENT GRID */
  noBankView: {
    textAlign: "center",
    padding: "20px 0"
  },
  noBankText: {
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "16px"
  },
  bankSetupBtn: {
    padding: "10px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer"
  },
  bankGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    background: "rgba(2, 6, 23, 0.3)",
    padding: "16px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.03)"
  },
  bankMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  metaLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#475569",
    letterSpacing: "0.5px"
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#cbd5e1"
  },
  /* 📜 STATEMENT / AUDIT VIEW LOGS */
  emptyState: {
    textAlign: "center",
    color: "#475569",
    fontSize: "13px",
    padding: "20px 0"
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    background: "rgba(2, 6, 23, 0.2)",
    border: "1px solid rgba(255,255,255,0.03)",
    borderRadius: "16px"
  },
  historyLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginTop: "6px",
    flexShrink: 0
  },
  historyAmt: {
    display: "block",
    fontSize: "15px",
    fontWeight: "700",
    color: "#ffffff"
  },
  historyDate: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px"
  },
  reasonText: {
    display: "block",
    fontSize: "11px",
    color: "#ef4444",
    marginTop: "4px",
    fontStyle: "italic"
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.3px"
  }
};
