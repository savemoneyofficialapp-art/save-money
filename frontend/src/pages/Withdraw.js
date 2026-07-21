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
  const [history, setHistory] = useState([]); // এই পেজের নিজস্ব কালেকশন থেকে আসা হিস্টরি
  const [loading, setLoading] = useState(false);
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

  // ব্যাকএন্ড থেকে আজকের ব্যালেন্স এবং উইথড্রাল হিস্টরি লোড করা
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
        setWalletBalance(data.todayBalance || 0);
        
        const historyList = data.history || [];
        setHistory(historyList);

        // ⚡ আপডেট লজিক: আজকে কোনো Pending বা Success রিকোয়েস্ট থাকলে Withdrawable Balance ০ দেখাবে এবং লক থাকবে।
        const today = new Date().toDateString();
        const hasActiveRequest = historyList.some((req) => {
          const reqDate = new Date(req.createdAt).toDateString();
          return reqDate === today && (req.status === "Pending" || req.status === "Success");
        });

        if (hasActiveRequest) {
          // রিকোয়েস্ট পেন্ডিং বা সাকসেস থাকলে বাকি ২০% লক থাকবে, উইথড্র করা যাবে না
          setWithdrawableBalance(0);
        } else {
          // রিকোয়েস্ট রিজেক্ট হলে বা রিকোয়েস্ট না থাকলে স্বাভাবিক ৮০% ব্যালেন্স দেখাবে
          setWithdrawableBalance((data.todayBalance || 0) * 0.8);
        }

        setBank(data.bank || null);
      }
    } catch (err) {
      console.log("ERROR:", err);
    }
  };

  // উইথড্রাল রিকোয়েস্ট সাবমিট করার লজিক
  const submitWithdraw = async () => {
    if (Number(amount) < 100) {
      toast.info("Minimum withdrawal limit is ₹100");
      return;
    }
    if (Number(amount) > withdrawableBalance) {
      toast.info("Amount exceeds your withdrawable limit (80% of earnings)");
      return;
    }

    // ⚡ দিনে ১ বার উইথড্র লজিক: আজকে যদি কোনো Pending বা Success রিকোয়েস্ট থাকে তবে ব্লক করবে। 
    // যদি রিকোয়েস্ট Reject হয় তাহলে ইউজার আবার রিকোয়েস্ট করতে পারবে।
    const todayRequest = history.find((req) => {
      const reqDate = new Date(req.createdAt).toDateString();
      const today = new Date().toDateString();
      return reqDate === today && (req.status === "Pending" || req.status === "Success");
    });

    if (todayRequest) {
      toast.error("You can only make one successful or pending withdraw request per day. Please try again tomorrow.");
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
      
      if (data.success) {
        toast.success(data.msg || "Withdrawal request placed successfully");
        setAmount("");
        loadInfo(); // ব্যাকএন্ড থেকে নতুন ব্যালেন্স এবং হিস্টরি রি-সিঙ্ক করার জন্য
      } else {
        toast.error(data.msg || "Failed to process withdrawal");
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

  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <div style={styles.page}>
      
      {/* Top Header */}
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div style={styles.topCenterTitle}>
          <div style={styles.titleFlex}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h1 style={styles.mainHeading}>Withdraw Funds</h1>
          </div>
          <p style={styles.subHeading}>Transfer your earnings directly to your bank account</p>
        </div>
        <div style={styles.secureBadge}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span style={{ fontSize: "16px", fontWeight: "800" }}>100% Secure</span>
        </div>
      </div>

      {/* Balance Cards */}
      <section style={styles.balanceGrid}>
        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #1c1437 0%, #090e1a 100%)", borderColor: "#4c2899" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #5b4bf5 0%, #9333ea 100%)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h10v2H12z"></path></svg>
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
              <span style={{ ...styles.calcLabel, color: "#4ade80", fontWeight: "800" }}>Net Bank Credit</span>
              <span style={{ ...styles.calcValue, color: "#4ade80", fontWeight: "900" }}>{money(finalBankCredit)}</span>
            </div>
          </div>
        )}

        <p style={styles.minNotice}>Minimum withdrawal limit is ₹100</p>
        <button style={styles.submitBtn} onClick={submitWithdraw} disabled={loading}>
          {loading ? "Processing..." : (
            <span style={styles.btnContent}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ transform: "rotate(-45deg)" }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
              Confirm & Withdraw Funds
            </span>
          )}
        </button>
      </section>

      {/* Settlement Account */}
      <section style={styles.glassContainer}>
        <div style={styles.sectionHeaderTitle}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M3 22v-4h18v4H3zM12 2L2 7h20L12 2zM4 9v7h3V9H4zm5 0v7h3V9H9zm5 0v7h3V9h-3zm5 0v7h3V9h-3z"/></svg>
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Audit Statement (উইথড্রাল হিস্টরি) */}
      <section style={styles.superGlassContainer}>
        <div style={styles.historySectionHeader}>
          <div style={styles.sectionHeaderTitle}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <h3 style={styles.superSectionTitle}>
              Audit Statement {showAllHistory && "(All)"}
            </h3>
          </div>
          {history.length > 5 && (
            <button style={styles.superViewAllBtn} onClick={() => setShowAllHistory(!showAllHistory)}>
              {showAllHistory ? "Show Less ❮" : "View All ❯"}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={styles.superEmptyStateContainer}>
            <p style={styles.superEmptyMainText}>No past settlement records found.</p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {visibleHistory.map((x) => (
              <div key={x._id || x.createdAt} style={styles.superHistoryRow}>
                <div>
                  <div style={styles.superHistoryAmt}>{money(x.amount)}</div>
                  <div style={styles.superHistoryDate}>{new Date(x.createdAt).toLocaleString()}</div>
                </div>
                <span style={{ 
                  color: x.status === "Success" || x.status === "Approved" ? "#22c55e" : x.status === "Rejected" ? "#ef4444" : "#eab308", 
                  fontWeight: "900",
                  fontSize: "22px" 
                }}>
                  {x.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust Container */}
      <section style={styles.superTrustContainer}>
        <div style={styles.superTrustItem}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <h4 style={styles.superTrustTitle}>Secure & Trusted</h4>
        </div>
        <div style={styles.superDivider} />
        <div style={styles.superTrustItem}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <h4 style={styles.superTrustTitle}>Quick Pay</h4>
        </div>
        <div style={styles.superDivider} />
        <div style={styles.superTrustItem}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path></svg>
          <h4 style={styles.superTrustTitle}>24/7 Support</h4>
        </div>
        <div style={styles.superDivider} />
        <div style={styles.superTrustItem}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path></svg>
          <h4 style={styles.superTrustTitle}>Top Platform</h4>
        </div>
      </section>

    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", width: "100%", background: "radial-gradient(circle at 50% 12%, #0f1a36 0%, #030611 75%)", color: "#ffffff", padding: "28px 18px 52px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "30px", overflowY: "auto" },
  topNav: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" },
  backBtn: { width: "58px", height: "58px", borderRadius: "16px", border: "1.5px solid #233554", background: "#0c172e", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" },
  topCenterTitle: { textAlign: "center", flex: 1 },
  titleFlex: { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" },
  mainHeading: { fontSize: "30px", fontWeight: "900", margin: 0 }, 
  subHeading: { margin: "8px 0 0 0", fontSize: "17px", color: "#a8bccc" }, 
  secureBadge: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(34, 197, 94, 0.18)", border: "2px solid #22c55e", padding: "12px 20px", borderRadius: "14px", color: "#4ade80" },
  balanceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" },
  balanceCard: { position: "relative", padding: "32px 26px", borderRadius: "22px", border: "2px solid", display: "flex", flexDirection: "column", minHeight: "185px", boxSizing: "border-box" },
  cardHeaderFlex: { display: "flex", alignItems: "center", gap: "16px" },
  walletIconBox: { width: "62px", height: "62px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" },
  cardMeta: { display: "flex", flexDirection: "column", gap: "4px" },
  amountEyeRow: { display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" },
  eyeIcon: { fontSize: "22px", color: "#e2e8f0" },
  cardTag: { fontSize: "18px", fontWeight: "800", color: "#94a3b8" }, 
  cardAmount: { fontSize: "34px", fontWeight: "900", margin: 0 }, 
  cardDesc: { margin: "24px 0 0 0", fontSize: "16px", color: "#94a3b8", fontWeight: "500" },
  percentageBadge: { position: "absolute", top: "22px", right: "22px", width: "48px", height: "48px", borderRadius: "50%", background: "rgba(14, 165, 233, 0.2)", border: "2px solid #0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "900", color: "#38bdf8" },
  glassContainer: { width: "100%", padding: "38px 30px", borderRadius: "26px", background: "#0a1122", border: "1.5px solid #202f4e", boxSizing: "border-box" },
  sectionTitle: { margin: "0 0 26px 0", fontSize: "25px", fontWeight: "900" }, 
  inputWrapper: { display: "flex", alignItems: "center", background: "#020716", border: "2px solid #475d82", borderRadius: "18px", padding: "0 28px" },
  currencyPrefix: { fontSize: "38px", fontWeight: "800", marginRight: "16px", color: "#3b82f6" },
  input: { width: "100%", height: "80px", border: "none", background: "transparent", color: "#ffffff", fontSize: "38px", fontWeight: "900", outline: "none" },
  calculationBox: { marginTop: "26px", padding: "20px 0", display: "flex", flexDirection: "column", gap: "18px", borderBottom: "2.5px dashed #202f4e" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" },
  calcTotalRow: { marginTop: "12px", paddingTop: "22px", borderTop: "2px solid #202f4e" },
  calcLabel: { fontSize: "19px", fontWeight: "700", color: "#cbd5e1" }, 
  calcValue: { fontSize: "20px", fontWeight: "800" },
  minNotice: { fontSize: "17px", color: "#94a3b8", margin: "20px 0 28px 4px", fontWeight: "500" },
  submitBtn: { width: "100%", height: "72px", border: "none", borderRadius: "18px", background: "linear-gradient(90deg, #4f46e5 0%, #2563eb 100%)", color: "#ffffff", fontWeight: "900", fontSize: "23px", cursor: "pointer" },
  btnContent: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" },
  sectionHeaderTitle: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "0px" },
  bankGrid: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#020716", padding: "32px", borderRadius: "22px", border: "2px solid #202f4e", cursor: "pointer" },
  bankFieldsGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px 24px", flex: 1 },
  bankMeta: { display: "flex", flexDirection: "column", gap: "8px" },
  metaLabel: { fontSize: "16px", fontWeight: "800", color: "#64748b" }, 
  metaValue: { fontSize: "21px", fontWeight: "900" }, 
  bankArrowContainer: { paddingLeft: "22px" },
  bankActionCircle: { width: "56px", height: "56px", borderRadius: "50%", border: "none", background: "#202f4e", display: "flex", alignItems: "center", justifyContent: "center" },
  historySectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px", width: "100%" },
  superGlassContainer: { width: "100%", padding: "46px 36px", borderRadius: "28px", background: "#0a1122", border: "2px solid #22375e", boxSizing: "border-box", boxShadow: "0 15px 35px rgba(0,0,0,0.4)" },
  superSectionTitle: { margin: 0, fontSize: "29px", fontWeight: "950", letterSpacing: "0.5px" },
  superViewAllBtn: { background: "none", border: "none", color: "#818cf8", fontSize: "22px", fontWeight: "900", cursor: "pointer", padding: "8px 16px" },
  superEmptyStateContainer: { textAlign: "center", padding: "60px 20px" },
  superEmptyMainText: { fontSize: "24px", color: "#94a3b8", fontWeight: "700" },
  superHistoryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0", borderBottom: "2.5px solid #202f4e" },
  superHistoryAmt: { fontSize: "25px", fontWeight: "900" }, 
  superHistoryDate: { fontSize: "18px", color: "#94a3b8", marginTop: "8px" },
  superTrustContainer: { width: "100%", background: "#0a1122", border: "2px solid #202f4e", borderRadius: "26px", padding: "36px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" },
  superTrustItem: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center" },
  superDivider: { width: "2.5px", backgroundColor: "#202f4e", height: "45px", alignSelf: "center" },
  superTrustTitle: { fontSize: "17px", fontWeight: "950", margin: "16px 0 0 0", whiteSpace: "nowrap", letterSpacing: "0.3px" }
};
