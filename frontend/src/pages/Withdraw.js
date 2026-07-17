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
    `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

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
      
      {/* Header Section */}
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div style={styles.topCenterTitle}>
          <div style={styles.titleFlex}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h1 style={styles.mainHeading}>Withdraw Funds</h1>
          </div>
          <p style={styles.subHeading}>Transfer your earnings directly to your bank account</p>
        </div>
        <div style={styles.secureBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span style={{ fontSize: "11px", fontWeight: "700" }}>100% Secure</span>
        </div>
      </div>

      {/* Twin Wallet Info Grid (Full Width) */}
      <section style={styles.balanceGrid}>
        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #1c1437 0%, #090e1a 100%)", borderColor: "#3c2275" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #5b4bf5 0%, #9333ea 100%)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
            </div>
            <div style={styles.cardMeta}>
              <span style={styles.cardTag}>Today Wallet</span>
              <div style={styles.amountEyeRow}>
                <h2 style={styles.cardAmount}>{money(walletBalance)}</h2>
                <span style={styles.eyeIcon}>👁</span>
              </div>
            </div>
          </div>
          <p style={styles.cardDesc}>Available in wallet today</p>
        </div>

        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #09284b 0%, #090e1a 100%)", borderColor: "#0e5a87" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #0284c7 0%, #0891b2 100%)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
            </div>
            <div style={styles.cardMeta}>
              <span style={styles.cardTag}>Withdrawable Wallet</span>
              <div style={styles.amountEyeRow}>
                <h2 style={styles.cardAmount}>{money(withdrawableBalance)}</h2>
                <span style={styles.eyeIcon}>👁</span>
              </div>
            </div>
          </div>
          <p style={styles.cardDesc}>80% limit configuration applied</p>
          <div style={styles.percentageBadge}>80%</div>
        </div>
      </section>

      {/* Payout Card Container */}
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
        
        {inputAmount > 0 && (
          <div style={styles.calculationBox}>
            <div style={styles.calcRow}>
              <span style={styles.calcLabel}>Gross Amount</span>
              <span style={styles.calcValue}>{money(inputAmount)}</span>
            </div>
            <div style={styles.calcRow}>
              <span style={{ ...styles.calcLabel, color: "#f87171" }}>TDS Deduction (5%)</span>
              <span style={{ ...styles.calcValue, color: "#f87171" }}>- {money(tdsDeduction)}</span>
            </div>
            <div style={{ ...styles.calcRow, ...styles.calcTotalRow }}>
              <span style={{ ...styles.calcLabel, color: "#4ade80", fontWeight: "600" }}>Net Bank Credit</span>
              <span style={{ ...styles.calcValue, color: "#4ade80", fontWeight: "700" }}>{money(finalBankCredit)}</span>
            </div>
          </div>
        )}

        <p style={styles.minNotice}>Minimum withdrawal limit is ₹100</p>

        <button style={styles.submitBtn} onClick={submitWithdraw} disabled={loading}>
          {loading ? (
            <span style={styles.loaderFlex}>
              <span style={styles.spinner}></span> Processing...
            </span>
          ) : (
            <span style={styles.btnContent}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ transform: "rotate(-45deg)" }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
              Confirm & Withdraw Funds
            </span>
          )}
        </button>

        <div style={styles.noteBox}>
          <span style={styles.noteIcon}>ⓘ</span>
          <p style={styles.noteText}>
            Payouts are verified via secure layer. Once submitted, requests usually approve within a few hours.
          </p>
        </div>
      </section>

      {/* Settlement Account Container */}
      <section style={styles.glassContainer}>
        <div style={styles.sectionHeaderTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M3 22v-4h18v4H3zM12 2L2 7h20L12 2zM4 9v7h3V9H4zm5 0v7h3V9H9zm5 0v7h3V9h-3zm5 0v7h3V9h-3z"/></svg>
          <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Settlement Account</h3>
        </div>

        {!bank ? (
          <div style={styles.noBankView}>
            <p style={styles.noBankText}>No linked bank account detected for settlements.</p>
            <button style={styles.bankSetupBtn} onClick={() => navigate("/bank-details")}>
              + Add Bank Details
            </button>
          </div>
        ) : (
          <div style={styles.bankGrid}>
            <div style={styles.bankFieldsGroup}>
              <div style={styles.bankMeta}>
                <span style={styles.metaLabel}>HOLDER NAME</span>
                <span style={styles.metaValue}>{bank.accountHolderName || "Rama basu"}</span>
              </div>
              <div style={styles.bankMeta}>
                <span style={styles.metaLabel}>BANK NAME</span>
                <span style={styles.metaValue}>{bank.bankName || "Sbi"}</span>
              </div>
              <div style={styles.bankMeta}>
                <span style={styles.metaLabel}>ACCOUNT NUMBER</span>
                <span style={styles.metaValue}>{bank.accountNumber || "6347223058"}</span>
              </div>
              <div style={styles.bankMeta}>
                <span style={styles.metaLabel}>IFSC CODE</span>
                <span style={styles.metaValue}>{bank.ifscCode || "KKBK0007451"}</span>
              </div>
            </div>
            <div style={styles.bankArrowContainer}>
              <button style={styles.bankActionCircle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Audit Statement Container */}
      <section style={styles.glassContainer}>
        <div style={styles.historySectionHeader}>
          <div style={styles.sectionHeaderTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Audit Statement</h3>
          </div>
          <button style={styles.viewAllBtn}>View All ❯</button>
        </div>

        {history.length === 0 ? (
          <div style={styles.emptyStateContainer}>
            <div style={styles.emptyIconPlaceholder}>
              <svg width="90" height="90" viewBox="0 0 64 64" fill="none">
                <path d="M8 14a4 4 0 0 1 4-4h14l4 6h24a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V14z" fill="#17143a" stroke="#4f46e5" strokeWidth="2"/>
                <path d="M12 18h40v24H12z" fill="#1e194f" opacity="0.8"/>
                <line x1="18" y1="24" x2="46" y2="24" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="18" y1="32" x2="38" y2="32" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="42" cy="44" r="8" fill="#080c14" stroke="#e026d9" strokeWidth="2.5"/>
                <line x1="48" y1="50" x2="54" y2="56" stroke="#e026d9" strokeWidth="3.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={styles.emptyMainText}>No past settlement records found.</p>
            <p style={styles.emptySubText}>Your settlement history will appear here.</p>
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
                    </div>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    background: isSuccess ? "rgba(34,197,94,0.1)" : isRejected ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                    color: isSuccess ? "#4ade80" : isRejected ? "#f87171" : "#facc15"
                  }}>{x.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4 Bottom Pillars (Full Screen Width Grid Layout) */}
      <section style={styles.trustGrid}>
        <div style={styles.trustItem}>
          <div style={styles.trustIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h4 style={styles.trustTitle}>Secure & Trusted</h4>
          <p style={styles.trustDesc}>100% safe and secure transactions</p>
        </div>
        <div style={styles.trustItem}>
          <div style={styles.trustIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <h4 style={styles.trustTitle}>Quick Processing</h4>
          <p style={styles.trustDesc}>Withdrawals processed within few hours</p>
        </div>
        <div style={styles.trustItem}>
          <div style={styles.trustIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
          </div>
          <h4 style={styles.trustTitle}>24/7 Support</h4>
          <p style={styles.trustDesc}>We are here to help you anytime</p>
        </div>
        <div style={styles.trustItem}>
          <div style={styles.trustIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h4 style={styles.trustTitle}>Trusted Platform</h4>
          <p style={styles.trustDesc}>Thousands of users trust us</p>
        </div>
      </section>

    </div>
  );
}

// 🎨 FIXING STYLES: 100% SCREEN FILL WITH VIBRANT FINTECH GLOW
const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",             // ইঞ্চিতে বা পিক্সেলে লক না করে ফুল স্ক্রিন ভিউপোর্ট করা হলো
    backgroundColor: "#030714",
    color: "#ffffff",
    fontFamily: "'Inter', -apple-system, sans-serif",
    padding: "16px 16px 36px", // প্রফেশনাল স্পেসিং
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowX: "hidden"
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: "10px"
  },
  backBtn: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    border: "1px solid #1e293b",
    background: "#0b1329",
    color: "#f1f5f9",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  topCenterTitle: {
    textAlign: "center",
    flex: 1
  },
  titleFlex: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  mainHeading: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    color: "#ffffff",
    letterSpacing: "-0.3px"
  },
  subHeading: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#64748b"
  },
  secureBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    padding: "8px 12px",
    borderRadius: "10px",
    color: "#4ade80"
  },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    width: "100%"
  },
  balanceCard: {
    position: "relative",
    padding: "18px 16px",
    borderRadius: "16px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "125px",
    boxSizing: "border-box"
  },
  cardHeaderFlex: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  walletIconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cardMeta: {
    display: "flex",
    flexDirection: "column"
  },
  amountEyeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px"
  },
  eyeIcon: {
    fontSize: "15px",
    color: "#94a3b8",
    cursor: "pointer"
  },
  cardTag: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#94a3b8"
  },
  cardAmount: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    color: "#ffffff"
  },
  cardDesc: {
    margin: "14px 0 0 0",
    fontSize: "11.5px",
    color: "#64748b"
  },
  percentageBadge: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "rgba(14, 165, 233, 0.1)",
    border: "1.5px solid #0ea5e9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: "#38bdf8"
  },
  glassContainer: {
    width: "100%",
    padding: "22px 20px",
    borderRadius: "20px",
    background: "#090e1a",
    border: "1px solid #16223f",
    boxSizing: "border-box"
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#94a3b8"
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#03060f",
    border: "1px solid #1e2e56",
    borderRadius: "14px",
    padding: "0 16px"
  },
  currencyPrefix: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#94a3b8",
    marginRight: "10px"
  },
  input: {
    width: "100%",
    height: "58px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "600",
    outline: "none"
  },
  calculationBox: {
    marginTop: "16px",
    padding: "12px 0",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderBottom: "1px dashed #1e2e56"
  },
  calcRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calcTotalRow: {
    marginTop: "6px",
    paddingTop: "12px",
    borderTop: "1px solid #1e2e56"
  },
  calcLabel: {
    fontSize: "14px",
    color: "#94a3b8"
  },
  calcValue: {
    fontSize: "14px",
    color: "#ffffff"
  },
  minNotice: {
    fontSize: "13px",
    color: "#64748b",
    margin: "12px 0 20px 2px"
  },
  submitBtn: {
    width: "100%",
    height: "56px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)"
  },
  btnContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
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
    marginTop: "16px"
  },
  noteIcon: {
    color: "#3b82f6",
    fontSize: "15px"
  },
  noteText: {
    margin: 0,
    fontSize: "12.5px",
    color: "#64748b",
    lineHeight: "1.5"
  },
  sectionHeaderTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px"
  },
  bankGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#03060f",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #162444"
  },
  bankFieldsGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    flex: 1
  },
  bankMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  metaLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#475569",
    letterSpacing: "0.5px"
  },
  metaValue: {
    fontSize: "14.5px",
    fontWeight: "600",
    color: "#cbd5e1"
  },
  bankArrowContainer: {
    paddingLeft: "12px"
  },
  bankActionCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "none",
    background: "#16223f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  historySectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    color: "#818cf8",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer"
  },
  emptyStateContainer: {
    textAlign: "center",
    padding: "36px 16px 28px"
  },
  emptyIconPlaceholder: {
    marginBottom: "16px",
    display: "flex",
    justifyContent: "center"
  },
  emptyMainText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#f8fafc",
    margin: "0 0 6px 0"
  },
  emptySubText: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0
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
    padding: "14px",
    background: "#03060f",
    borderRadius: "12px"
  },
  historyLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%"
  },
  historyAmt: {
    display: "block",
    fontSize: "15px",
    fontWeight: "600"
  },
  historyDate: {
    display: "block",
    fontSize: "12px",
    color: "#64748b"
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "600"
  },
  trustGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    width: "100%",
    marginTop: "8px"
  },
  trustItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "20px 12px",
    background: "linear-gradient(135deg, #070c18 0%, #03060f 100%)",
    border: "1px solid #16223f",
    borderRadius: "16px",
    boxSizing: "border-box"
  },
  trustIconWrapper: {
    marginBottom: "10px"
  },
  trustTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#f8fafc",
    margin: "0 0 6px 0"
  },
  trustDesc: {
    fontSize: "11px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.5"
  }
};
