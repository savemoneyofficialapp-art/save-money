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
      <div style={styles.mainWrapper}>
        
        {/* 🔝 1:1 Top Bar Fix */}
        <div style={styles.topNav}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div style={styles.topCenterTitle}>
            <div style={styles.titleFlex}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <h1 style={styles.mainHeading}>Withdraw Funds</h1>
            </div>
            <p style={styles.subHeading}>Transfer your earnings directly to your bank account</p>
          </div>
          <div style={styles.secureBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span style={{ fontSize: "9px" }}>100% Secure</span>
          </div>
        </div>

        {/* 💳 Wallet Grid */}
        <section style={styles.balanceGrid}>
          <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #1e1b4b 0%, #090d16 100%)", borderColor: "#312e81" }}>
            <div style={styles.cardHeaderFlex}>
              <div style={{ ...styles.walletIconBox, background: "rgba(168, 85, 247, 0.15)", borderColor: "#a855f7" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
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

          <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #0c4a6e 0%, #090d16 100%)", borderColor: "#0369a1" }}>
            <div style={styles.cardHeaderFlex}>
              <div style={{ ...styles.walletIconBox, background: "rgba(6, 182, 212, 0.15)", borderColor: "#06b6d4" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
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

        {/* 💸 Amount Payout Card */}
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ transform: "rotate(-45deg)", marginRight: "4px" }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
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

        {/* 🏦 Settlement Account */}
        <section style={styles.glassContainer}>
          <div style={styles.sectionHeaderTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="21" x2="9" y2="9"></line><line x1="15" y1="21" x2="15" y2="9"></line><line x1="3" y1="9" x2="21" y2="9"></line></svg>
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

        {/* 📜 Audit Statement Card Fixed */}
        <section style={styles.glassContainer}>
          <div style={styles.historySectionHeader}>
            <div style={styles.sectionHeaderTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Audit Statement</h3>
            </div>
            <button style={styles.viewAllBtn}>View All ❯</button>
          </div>

          {history.length === 0 ? (
            <div style={styles.emptyStateContainer}>
              <div style={styles.emptyIconPlaceholder}>
                {/* 1:1 Matching Big 3D Glowing Folder Design */}
                <svg width="74" height="74" viewBox="0 0 64 64" fill="none">
                  <path d="M10 16a4 4 0 0 1 4-4h12l4 6h20a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V16z" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="2"/>
                  <path d="M14 20h36v24H14z" fill="#312e81" opacity="0.7"/>
                  <line x1="20" y1="28" x2="44" y2="28" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="20" y1="34" x2="36" y2="34" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="42" cy="42" r="7" fill="#0f172a" stroke="#d946ef" strokeWidth="2"/>
                  <line x1="47" y1="47" x2="53" y2="53" stroke="#d946ef" strokeWidth="3" strokeLinecap="round"/>
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

        {/* 🔒 Bottom Grid Layout Fix */}
        <section style={styles.trustGrid}>
          <div style={styles.trustItem}>
            <div style={styles.trustIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h4 style={styles.trustTitle}>Secure & Trusted</h4>
            <p style={styles.trustDesc}>100% safe and secure transactions</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h4 style={styles.trustTitle}>Quick Processing</h4>
            <p style={styles.trustDesc}>Withdrawals processed within few hours</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
            </div>
            <h4 style={styles.trustTitle}>24/7 Support</h4>
            <p style={styles.trustDesc}>We are here to help you anytime</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h4 style={styles.trustTitle}>Trusted Platform</h4>
            <p style={styles.trustDesc}>Thousands of users trust us</p>
          </div>
        </section>

      </div>
    </div>
  );
}

// 🎨 1:1 RE-CONFIGURED CSS STYLESHEET
const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#020614",
    color: "#ffffff",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "16px 12px 40px",
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
    gap: "10px",
    marginBottom: "20px"
  },
  backBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #132039",
    background: "#081024",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  topCenterTitle: {
    textAlign: "center",
    flex: 1
  },
  titleFlex: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  mainHeading: {
    fontSize: "17px",
    fontWeight: "700",
    margin: 0,
    color: "#ffffff"
  },
  subHeading: {
    margin: "2px 0 0 0",
    fontSize: "11px",
    color: "#475569"
  },
  secureBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    padding: "6px 8px",
    borderRadius: "8px",
    color: "#22c55e",
    fontWeight: "600",
    flexShrink: 0
  },
  mainWrapper: {
    width: "100%",
    maxWidth: "460px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  balanceCard: {
    position: "relative",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100px"
  },
  cardHeaderFlex: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px"
  },
  walletIconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  cardMeta: {
    display: "flex",
    flexDirection: "column"
  },
  amountEyeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "2px"
  },
  eyeIcon: {
    fontSize: "12px",
    color: "#475569",
    cursor: "pointer"
  },
  cardTag: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#94a3b8"
  },
  cardAmount: {
    fontSize: "17px",
    fontWeight: "700",
    margin: 0,
    color: "#ffffff"
  },
  cardDesc: {
    margin: "8px 0 0 0",
    fontSize: "10px",
    color: "#475569"
  },
  percentageBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "rgba(6, 182, 212, 0.1)",
    border: "1.5px solid #06b6d4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: "700",
    color: "#06b6d4"
  },
  glassContainer: {
    padding: "16px",
    borderRadius: "16px",
    background: "#080e1e",
    border: "1px solid #111c35"
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: "13px",
    fontWeight: "600",
    color: "#94a3b8"
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#030712",
    border: "1px solid #132247",
    borderRadius: "10px",
    padding: "0 12px"
  },
  currencyPrefix: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#64748b",
    marginRight: "6px"
  },
  input: {
    width: "100%",
    height: "48px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "600",
    outline: "none"
  },
  calculationBox: {
    marginTop: "12px",
    padding: "8px 0",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderBottom: "1px dashed #132247"
  },
  calcRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calcTotalRow: {
    marginTop: "2px",
    paddingTop: "6px",
    borderTop: "1px solid #132247"
  },
  calcLabel: {
    fontSize: "12px",
    color: "#64748b"
  },
  calcValue: {
    fontSize: "12px",
    color: "#ffffff"
  },
  minNotice: {
    fontSize: "11px",
    color: "#475569",
    margin: "8px 0 14px 2px"
  },
  submitBtn: {
    width: "100%",
    height: "48px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(90deg, #4f46e5 0%, #2563eb 100%)",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer"
  },
  btnContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  loaderFlex: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },
  spinner: {
    width: "12px",
    height: "12px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%"
  },
  noteBox: {
    display: "flex",
    gap: "6px",
    marginTop: "12px"
  },
  noteIcon: {
    color: "#3b82f6",
    fontSize: "12px"
  },
  noteText: {
    margin: 0,
    fontSize: "10px",
    color: "#475569",
    lineHeight: "1.4"
  },
  sectionHeaderTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px"
  },
  bankGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#040814",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #111c36"
  },
  bankFieldsGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    flex: 1
  },
  bankMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  metaLabel: {
    fontSize: "9px",
    fontWeight: "600",
    color: "#475569",
    letterSpacing: "0.3px"
  },
  metaValue: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#cbd5e1"
  },
  bankArrowContainer: {
    paddingLeft: "8px"
  },
  bankActionCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: "#111c36",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  historySectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px"
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    color: "#6366f1",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer"
  },
  emptyStateContainer: {
    textAlign: "center",
    padding: "24px 8px 16px"
  },
  emptyIconPlaceholder: {
    marginBottom: "12px",
    display: "flex",
    justifyContent: "center"
  },
  emptyMainText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#f8fafc",
    margin: "0 0 4px 0"
  },
  emptySubText: {
    fontSize: "11px",
    color: "#475569",
    margin: 0
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
    padding: "10px",
    background: "#040814",
    borderRadius: "8px"
  },
  historyLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  statusDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%"
  },
  historyAmt: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600"
  },
  historyDate: {
    display: "block",
    fontSize: "10px",
    color: "#475569"
  },
  statusBadge: {
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "600"
  },
  trustGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "6px",
    borderTop: "1px solid #111c35",
    paddingTop: "16px"
  },
  trustItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "10px 6px",
    background: "#060b17",
    border: "1px solid #111c35",
    borderRadius: "12px"
  },
  trustIconWrapper: {
    marginBottom: "6px"
  },
  trustTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#f8fafc",
    margin: "0 0 2px 0"
  },
  trustDesc: {
    fontSize: "9px",
    color: "#475569",
    margin: 0,
    lineHeight: "1.3"
  }
};
