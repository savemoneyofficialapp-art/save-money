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
  
  // 🔴 লজিক: একই পেজে সম্পূর্ণ হিস্ট্রি দেখানোর জন্য স্টেট
  const [showAllHistory, setShowAllHistory] = useState(false);

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
      console.log("ERROR:", err);
    }
  };

  const submitWithdraw = async () => {
    if (Number(amount) < 100) {
      toast.info("Minimum withdrawal limit is ₹100");
      return;
    }
    if (Number(amount) > withdrawableBalance) {
      toast.info("Amount exceeds your withdrawable limit");
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

  const handleBankClick = () => {
    navigate("/bank-details"); 
  };

  // 🔴 ৫টি রেকর্ড ফিল্টার করার লজিক
  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <div style={styles.page}>
      
      {/* Top Header */}
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div style={styles.topCenterTitle}>
          <div style={styles.titleFlex}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h1 style={styles.mainHeading}>Withdraw Funds</h1>
          </div>
          <p style={styles.subHeading}>Transfer your earnings directly to your bank account</p>
        </div>
        <div style={styles.secureBadge}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span style={{ fontSize: "14px", fontWeight: "700" }}>100% Secure</span>
        </div>
      </div>

      {/* Balance Grid */}
      <section style={styles.balanceGrid}>
        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #1c1437 0%, #090e1a 100%)", borderColor: "#4c2899" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #5b4bf5 0%, #9333ea 100%)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
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

        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #09284b 0%, #090e1a 100%)", borderColor: "#0f6aa3" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #0284c7 0%, #0891b2 100%)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
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

      {/* Payout Form */}
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
              <span style={{ ...styles.calcLabel, color: "#4ade80", fontWeight: "700" }}>Net Bank Credit</span>
              <span style={{ ...styles.calcValue, color: "#4ade80", fontWeight: "800" }}>{money(finalBankCredit)}</span>
            </div>
          </div>
        )}

        <p style={styles.minNotice}>Minimum withdrawal limit is ₹100</p>
        <button style={styles.submitBtn} onClick={submitWithdraw} disabled={loading}>
          {loading ? "Processing..." : (
            <span style={styles.btnContent}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ transform: "rotate(-45deg)" }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
              Confirm & Withdraw Funds
            </span>
          )}
        </button>
      </section>

      {/* Settlement Account */}
      <section style={styles.glassContainer}>
        <div style={styles.sectionHeaderTitle}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M3 22v-4h18v4H3zM12 2L2 7h20L12 2zM4 9v7h3V9H4zm5 0v7h3V9H9zm5 0v7h3V9h-3zm5 0v7h3V9h-3z"/></svg>
          <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Settlement Account</h3>
        </div>

        <div style={styles.bankGrid} onClick={handleBankClick}>
          <div style={styles.bankFieldsGroup}>
            <div style={styles.bankMeta}>
              <span style={styles.metaLabel}>HOLDER NAME</span>
              <span style={styles.metaValue}>{bank?.accountHolderName || "Rama basu"}</span>
            </div>
            <div style={styles.bankMeta}>
              <span style={styles.metaLabel}>BANK NAME</span>
              <span style={styles.metaValue}>{bank?.bankName || "Sbi"}</span>
            </div>
            <div style={styles.bankMeta}>
              <span style={styles.metaLabel}>ACCOUNT NUMBER</span>
              <span style={styles.metaValue}>{bank?.accountNumber || "6347223058"}</span>
            </div>
            <div style={styles.bankMeta}>
              <span style={styles.metaLabel}>IFSC CODE</span>
              <span style={styles.metaValue}>{bank?.ifscCode || "KKBK0007451"}</span>
            </div>
          </div>
          <div style={styles.bankArrowContainer}>
            <button style={styles.bankActionCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Audit Statement (Fix: One-Page View All Toggle) */}
      <section style={styles.glassContainer}>
        <div style={styles.historySectionHeader}>
          <div style={styles.sectionHeaderTitle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <h3 style={{ ...styles.sectionTitle, margin: 0 }}>
              Audit Statement {showAllHistory && "(All Records)"}
            </h3>
          </div>
          
          {/* 🔴 লজিক: ক্লিক করলে ১ পেজেই পুরো হিস্ট্রি অন/অফ হবে */}
          {history.length > 5 && (
            <button style={styles.viewAllBtn} onClick={() => setShowAllHistory(!showAllHistory)}>
              {showAllHistory ? "Show Less ❮" : "View All ❯"}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={styles.emptyStateContainer}>
            <p style={styles.emptyMainText}>No past settlement records found.</p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {visibleHistory.map((x) => (
              <div key={x._id} style={styles.historyRow}>
                <div>
                  <div style={styles.historyAmt}>{money(x.amount)}</div>
                  <div style={styles.historyDate}>{new Date(x.createdAt).toLocaleString()}</div>
                </div>
                <span style={{ 
                  color: x.status === "Success" || x.status === "Approved" ? "#22c55e" : "#eab308", 
                  fontWeight: "800",
                  fontSize: "16px" 
                }}>
                  {x.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4 Pillars Section */}
      <section style={styles.singleLineTrustContainer}>
        <div style={styles.trustItemSingle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <h4 style={styles.trustTitleSingle}>Secure & Trusted</h4>
        </div>
        <div style={styles.dividerLine} />
        <div style={styles.trustItemSingle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <h4 style={styles.trustTitleSingle}>Quick Pay</h4>
        </div>
        <div style={styles.dividerLine} />
        <div style={styles.trustItemSingle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path></svg>
          <h4 style={styles.trustTitleSingle}>24/7 Support</h4>
        </div>
        <div style={styles.dividerLine} />
        <div style={styles.trustItemSingle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path></svg>
          <h4 style={styles.trustTitleSingle}>Top Platform</h4>
        </div>
      </section>

    </div>
  );
}

// 🎨 100% ডার্ক গ্লোয়িং ব্যাংকিং ব্যাকগ্রাউন্ড এবং বিগ ফন্টস সিএসএস শিট
const styles = {
  page: {
    minHeight: "100vh", 
    width: "100%",
    background: "radial-gradient(circle at 50% 10%, #0d1527 0%, #03060f 80%)", 
    color: "#ffffff",
    padding: "24px 16px 48px 16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "26px",
    overflowY: "auto"
  },
  topNav: { display: "flex", alignItems: "center", justifycontent: "space-between" },
  backBtn: { width: "52px", height: "52px", borderRadius: "14px", border: "1px solid #1e293b", background: "#0c1324", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" },
  topCenterTitle: { textAlign: "center", flex: 1 },
  titleFlex: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  mainHeading: { fontSize: "27px", fontWeight: "800", margin: 0 }, 
  subHeading: { margin: "6px 0 0 0", fontSize: "15px", color: "#a4b5cf" }, 
  secureBadge: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(34, 197, 94, 0.15)", border: "1.5px solid #22c55e", padding: "10px 16px", borderRadius: "12px", color: "#4ade80" },
  balanceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  balanceCard: { position: "relative", padding: "28px 24px", borderRadius: "18px", border: "1.5px solid", display: "flex", flexDirection: "column", minHeight: "165px", boxSizing: "border-box" },
  cardHeaderFlex: { display: "flex", alignItems: "center", gap: "14px" },
  walletIconBox: { width: "54px", height: "54px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  cardMeta: { display: "flex", flexDirection: "column" },
  amountEyeRow: { display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" },
  eyeIcon: { fontSize: "18px", color: "#cbd5e1" },
  cardTag: { fontSize: "16px", fontWeight: "700", color: "#94a3b8" }, 
  cardAmount: { fontSize: "29px", fontWeight: "800", margin: 0 }, 
  cardDesc: { margin: "20px 0 0 0", fontSize: "14px", color: "#94a3b8" },
  percentageBadge: { position: "absolute", top: "20px", right: "20px", width: "42px", height: "42px", borderRadius: "50%", background: "rgba(14, 165, 233, 0.15)", border: "1.5px solid #0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", color: "#38bdf8" },
  glassContainer: { width: "100%", padding: "34px 28px", borderRadius: "22px", background: "#090f1d", border: "1px solid #1e2942", boxSizing: "border-box" },
  sectionTitle: { margin: "0 0 22px 0", fontSize: "22px", fontWeight: "800" }, 
  inputWrapper: { display: "flex", alignItems: "center", background: "#020613", border: "1.5px solid #475569", borderRadius: "16px", padding: "0 24px" },
  currencyPrefix: { fontSize: "32px", fontWeight: "700", marginRight: "14px" },
  input: { width: "100%", height: "70px", border: "none", background: "transparent", color: "#ffffff", fontSize: "32px", fontWeight: "800", outline: "none" },
  calculationBox: { marginTop: "22px", padding: "18px 0", display: "flex", flexDirection: "column", gap: "16px", borderBottom: "1px dashed #475569" },
  calcRow: { display: "flex", justifycontent: "space-between", alignItems: "center" },
  calcTotalRow: { marginTop: "10px", paddingTop: "18px", borderTop: "1.5px solid #334155" },
  calcLabel: { fontSize: "17px", fontWeight: "600", color: "#e2e8f0" }, 
  calcValue: { fontSize: "17px", fontWeight: "700" },
  minNotice: { fontSize: "15px", color: "#94a3b8", margin: "18px 0 26px 2px" },
  submitBtn: { width: "100%", height: "64px", border: "none", borderRadius: "16px", background: "linear-gradient(90deg, #4f46e5 0%, #2563eb 100%)", color: "#ffffff", fontWeight: "800", fontSize: "20px", cursor: "pointer" },
  btnContent: { display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" },
  sectionHeaderTitle: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "22px" },
  bankGrid: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#020613", padding: "28px", borderRadius: "18px", border: "1.5px solid #1e2942", cursor: "pointer" },
  bankFieldsGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "26px 20px", flex: 1 },
  bankMeta: { display: "flex", flexDirection: "column", gap: "6px" },
  metaLabel: { fontSize: "14px", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.5px" }, 
  metaValue: { fontSize: "18px", fontWeight: "800" }, 
  bankArrowContainer: { paddingLeft: "18px" },
  bankActionCircle: { width: "50px", height: "50px", borderRadius: "50%", border: "none", background: "#1e2942", display: "flex", alignItems: "center", justifyContent: "center" },
  historySectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  viewAllBtn: { background: "none", border: "none", color: "#818cf8", fontSize: "17px", fontWeight: "800", cursor: "pointer", padding: "6px 12px" },
  emptyStateContainer: { textAlign: "center", padding: "34px" },
  emptyMainText: { fontSize: "18px", color: "#94a3b8", fontWeight: "600" },
  historyList: { display: "flex", flexDirection: "column", gap: "14px" },
  historyRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #1e2942" },
  historyAmt: { fontSize: "19px", fontWeight: "800" }, 
  historyDate: { fontSize: "14px", color: "#94a3b8", marginTop: "4px" },
  singleLineTrustContainer: { width: "100%", background: "#090f1d", border: "1px solid #1e2942", borderRadius: "22px", padding: "28px 16px", display: "flex", alignItems: "stretch", justifyContent: "space-between", boxSizing: "border-box", gap: "8px" },
  trustItemSingle: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  dividerLine: { width: "1.5px", backgroundColor: "#1e2942", alignSelf: "stretch" },
  trustTitleSingle: { fontSize: "14px", fontWeight: "800", margin: "12px 0 0 0", whiteSpace: "nowrap" }
};
