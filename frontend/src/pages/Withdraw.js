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
      {/* 🔝 1:1 Top Navigation Header */}
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div style={styles.topCenterTitle}>
          <div style={styles.titleFlex}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h1 style={styles.mainHeading}>Withdraw Funds</h1>
          </div>
          <p style={styles.subHeading}>Transfer your earnings directly to your bank account</p>
        </div>
        <div style={styles.secureBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span>100% Secure</span>
        </div>
      </div>

      <div style={styles.mainWrapper}>
        {/* 💳 Twin Wallet Info Grid */}
        <section style={styles.balanceGrid}>
          <div style={styles.balanceCard}>
            <div style={styles.walletIconBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(147, 51, 234, 0.3)" stroke="#a855f7" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
            </div>
            <div>
              <span style={styles.cardTag}>Today Wallet</span>
              <div style={styles.amountEyeRow}>
                <h2 style={styles.cardAmount}>{money(walletBalance)}</h2>
                <span style={styles.eyeIcon}>👁</span>
              </div>
              <p style={styles.cardDesc}>Available in wallet today</p>
            </div>
          </div>

          <div style={{ ...styles.balanceCard, ...styles.balanceCardSpecial }}>
            <div style={styles.walletIconBoxBlue}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
            </div>
            <div>
              <span style={styles.cardTag}>Withdrawable Wallet</span>
              <div style={styles.amountEyeRow}>
                <h2 style={styles.cardAmount}>{money(withdrawableBalance)}</h2>
                <span style={styles.eyeIcon}>👁</span>
              </div>
              <p style={styles.cardDesc}>80% limit configuration applied</p>
            </div>
            <div style={styles.percentageBadge}>80%</div>
          </div>
        </section>

        {/* 💸 Dynamic Amount & Live Payout Display Section */}
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
                <span style={{ ...styles.calcLabel, color: "#22c55e", fontWeight: "600" }}>Net Bank Credit</span>
                <span style={{ ...styles.calcValue, color: "#22c55e", fontWeight: "700" }}>{money(finalBankCredit)}</span>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ transform: "rotate(-45deg)" }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
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

        {/* 🏦 Premium Dynamic Settlement Section */}
        <section style={styles.glassContainer}>
          <div style={styles.sectionHeaderTitle}>
            <span style={{ fontSize: "18px" }}>🏦</span>
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
              </div>
              <div style={styles.bankArrowContainer}>
                <button style={styles.bankActionCircle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 📜 Dynamic Transaction Audit Statement */}
        <section style={styles.glassContainer}>
          <div style={styles.historySectionHeader}>
            <div style={styles.sectionHeaderTitle}>
              <span style={{ fontSize: "16px" }}>📄</span>
              <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Audit Statement</h3>
            </div>
            <button style={styles.viewAllBtn}>View All ❯</button>
          </div>

          {history.length === 0 ? (
            <div style={styles.emptyStateContainer}>
              <div style={styles.emptyIconPlaceholder}>
                {/* 1:1 Matching Neon Folded Document Vector Graphic */}
                <svg width="68" height="68" viewBox="0 0 64 64" fill="none">
                  <rect x="14" y="8" width="36" height="46" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="2"/>
                  <path d="M36 8h14l-14 14V8z" fill="#3b82f6"/>
                  <line x1="22" y1="24" x2="42" y2="24" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="22" y1="32" x2="38" y2="32" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="40" cy="44" r="8" fill="#101b38" stroke="#a855f7" strokeWidth="2"/>
                  <line x1="46" y1="50" x2="52" y2="56" stroke="#a855f7" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={styles.emptyMainText}>No past settlement records found.</p>
              <p style={styles.emptySubText}>Your settlement history will appear here.</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((x) => {
                const isSuccess = x.status === "Success";
                const isOriginalRejected = x.status === "Rejected";
                
                return (
                  <div key={x._id} style={styles.historyRow}>
                    <div style={styles.historyLeft}>
                      <span style={{
                        ...styles.statusDot,
                        background: isSuccess ? "#22c55e" : isOriginalRejected ? "#ef4444" : "#eab308"
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
                        background: isSuccess ? "rgba(34,197,94,0.1)" : isOriginalRejected ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                        color: isSuccess ? "#4ade80" : isOriginalRejected ? "#f87171" : "#facc15",
                        border: isSuccess ? "1px solid rgba(34,197,94,0.2)" : isOriginalRejected ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(234,179,8,0.2)"
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

        {/* 🔒 Bottom Trust Pillars Grid */}
        <section style={styles.trustGrid}>
          <div style={styles.trustItem}>
            <div style={styles.trustIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h4 style={styles.trustTitle}>Secure & Trusted</h4>
            <p style={styles.trustDesc}>100% safe and secure transactions</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h4 style={styles.trustTitle}>Quick Processing</h4>
            <p style={styles.trustDesc}>Withdrawals processed within few hours</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
            </div>
            <h4 style={styles.trustTitle}>24/7 Support</h4>
            <p style={styles.trustDesc}>We are here to help you anytime</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h4 style={styles.trustTitle}>Trusted Platform</h4>
            <p style={styles.trustDesc}>Thousands of users trust us</p>
          </div>
        </section>
      </div>
    </div>
  );
}

// 🎨 ULTRA-PRECISE 1:1 CLONE FINTECH UX CSS-IN-JS STYLESHEET
const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#020613",
    color: "#ffffff",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "20px 16px 30px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "520px",
    marginBottom: "24px"
  },
  backBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    background: "#0b1329",
    color: "#94a3b8",
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
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    color: "#ffffff"
  },
  subHeading: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  secureBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.15)",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "10px",
    fontWeight: "700",
    color: "#22c55e",
    textTransform: "uppercase"
  },
  mainWrapper: {
    width: "100%",
    maxWidth: "520px",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },
  balanceCard: {
    position: "relative",
    padding: "16px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #0f172a 0%, #0d1527 100%)",
    border: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  balanceCardSpecial: {
    background: "linear-gradient(135deg, #0b2447 0%, #081b33 100%)",
    border: "1px solid #103467"
  },
  walletIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "rgba(168, 85, 247, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  walletIconBoxBlue: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "rgba(6, 182, 212, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  amountEyeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px"
  },
  eyeIcon: {
    fontSize: "14px",
    color: "#475569",
    cursor: "pointer"
  },
  cardTag: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#64748b"
  },
  cardAmount: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    color: "#ffffff"
  },
  cardDesc: {
    margin: 0,
    fontSize: "11px",
    color: "#475569"
  },
  percentageBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "2px solid #06b6d4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
    color: "#06b6d4"
  },
  glassContainer: {
    padding: "20px",
    borderRadius: "18px",
    background: "#090f21",
    border: "1px solid #121e36"
  },
  sectionTitle: {
    margin: "0 0 14px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#94a3b8"
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#040814",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "0 16px"
  },
  currencyPrefix: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#64748b",
    marginRight: "10px"
  },
  input: {
    width: "100%",
    height: "54px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "600",
    outline: "none"
  },
  calculationBox: {
    marginTop: "14px",
    padding: "12px 0",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    borderBottom: "1px dashed #1e293b"
  },
  calcRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calcTotalRow: {
    marginTop: "4px",
    paddingTop: "8px",
    borderTop: "1px solid #1e293b"
  },
  calcLabel: {
    fontSize: "13px",
    color: "#64748b"
  },
  calcValue: {
    fontSize: "13px",
    color: "#ffffff",
    fontWeight: "500"
  },
  minNotice: {
    fontSize: "12px",
    color: "#475569",
    margin: "10px 0 16px 2px"
  },
  submitBtn: {
    width: "100%",
    height: "52px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #6366f1 0%, #2563eb 100%)",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer"
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
    marginTop: "16px"
  },
  noteIcon: {
    color: "#2563eb",
    fontSize: "14px"
  },
  noteText: {
    margin: 0,
    fontSize: "11px",
    color: "#475569",
    lineHeight: "1.5"
  },
  sectionHeaderTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px"
  },
  bankGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#050a18",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #13213a"
  },
  bankFieldsGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    flex: 1
  },
  bankMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  metaLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#475569",
    letterSpacing: "0.5px"
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#e2e8f0"
  },
  bankArrowContainer: {
    paddingLeft: "12px"
  },
  bankActionCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "#121f3d",
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
    color: "#6366f1",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  },
  emptyStateContainer: {
    textAlign: "center",
    padding: "30px 10px 20px"
  },
  emptyIconPlaceholder: {
    marginBottom: "16px",
    display: "flex",
    justifyContent: "center"
  },
  emptyMainText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#f8fafc",
    margin: "0 0 6px 0"
  },
  emptySubText: {
    fontSize: "12px",
    color: "#475569",
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
    padding: "12px",
    background: "#050a18",
    borderRadius: "10px"
  },
  historyLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%"
  },
  historyAmt: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600"
  },
  historyDate: {
    display: "block",
    fontSize: "11px",
    color: "#475569"
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "600"
  },
  trustGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "8px",
    borderTop: "1px solid #13213a",
    paddingTop: "20px"
  },
  trustItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "12px 8px"
  },
  trustIconWrapper: {
    marginBottom: "8px"
  },
  trustTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#f8fafc",
    margin: "0 0 4px 0"
  },
  trustDesc: {
    fontSize: "10px",
    color: "#475569",
    margin: 0,
    lineHeight: "1.3"
  }
};
