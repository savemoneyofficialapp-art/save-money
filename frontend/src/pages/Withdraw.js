import React, { useEffect, useState, useRef } from "react";
import { API } from "../config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";

export default function Withdraw() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [amount, setAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [bank, setBank] = useState(null);
  const [history, setHistory] = useState([]); 
  
  const [filterType, setFilterType] = useState("All"); 
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const inputAmount = Number(amount) || 0;
  const tdsDeduction = inputAmount * 0.05;
  const finalBankCredit = inputAmount - tdsDeduction;

  useEffect(() => {
    loadInfo();
  }, []);

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", {
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
        setWalletBalance(data.todayBalance || 0);
        const historyList = data.history || [];
        setHistory(historyList);

        const today = new Date().toDateString();
        const hasActiveRequest = historyList.some((req) => {
          const reqDate = new Date(req.createdAt).toDateString();
          return reqDate === today && (req.status === "Pending" || req.status === "Success") && req.type !== "Credit";
        });

        if (hasActiveRequest) {
          setWithdrawableBalance(0);
        } else {
          setWithdrawableBalance((data.todayBalance || 0) * 0.8);
        }
        setBank(data.bank || null);
      }
    } catch (err) {
      console.log("ERROR:", err);
    }
  };

  const submitWithdraw = async () => {
    if (!bank || !bank.accountNumber) {
      toast.error("Please add your bank details first before withdrawing.");
      navigate("/bank-details");
      return;
    }

    if (Number(amount) < 100) {
      toast.info("Minimum withdrawal limit is ₹100");
      return;
    }
    if (Number(amount) > withdrawableBalance) {
      toast.info("Amount exceeds your withdrawable limit (80% of earnings)");
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
        loadInfo();
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

  const handleShareToWhatsApp = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 2 
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Receipt_${selectedTx._id || "tx"}.png`, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "Transaction Receipt",
              text: `Transaction Receipt of ${money(selectedTx.amount)} via SafeMoney Secure.`
            });
            return;
          } catch (e) {
            console.log("Web Share failed");
          }
        }

        const imageURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageURL;
        link.download = `Receipt_${selectedTx._id || "tx"}.png`;
        link.click();
      }, "image/png");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate receipt share");
    }
  };

  const getStatusDetails = (status, type) => {
    if (type === "Credit") {
      return { text: "CREDITED", color: "#059669", bgColor: "#ecfdf5" };
    }
    if (status === "Rejected" || status === "Reject") {
      return { text: "REFUNDED", color: "#dc2626", bgColor: "#fef2f2" };
    }
    if (status === "Success" || status === "Approved") {
      return { text: "COMPLETED", color: "#059669", bgColor: "#ecfdf5" };
    }
    return { text: "PENDING", color: "#d97706", bgColor: "#fffbeb" };
  };

  const filteredHistory = history.filter((item) => {
    const isCredit = item.type === "Credit";
    if (filterType === "Credit" && !isCredit) return false;
    if (filterType === "Debit" && isCredit) return false;

    if (startDate || endDate) {
      const txDate = new Date(item.createdAt);
      txDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
    }
    return true;
  });

  const visibleHistory = filteredHistory.slice(0, visibleCount);

  return (
    <div style={styles.page}>
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div style={styles.topCenterTitle}>
          <div style={styles.titleFlex}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h1 style={styles.mainHeading}>Withdraw Funds</h1>
          </div>
          <p style={styles.subHeading}>Transfer your earnings directly to your bank account</p>
        </div>
        <div style={styles.secureBadge}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span style={{ fontSize: "14px", fontWeight: "700" }}>100% Secure</span>
        </div>
      </div>

      <section style={styles.balanceGrid}>
        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "#334155" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
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

        <div style={{ ...styles.balanceCard, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "#334155" }}>
          <div style={styles.cardHeaderFlex}>
            <div style={{ ...styles.walletIconBox, background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" }}>
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
              <span style={{ ...styles.calcLabel, color: "#34d399", fontWeight: "700" }}>Net Bank Credit</span>
              <span style={{ ...styles.calcValue, color: "#34d399", fontWeight: "800" }}>{money(finalBankCredit)}</span>
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

      <section style={styles.glassContainer}>
        <div style={styles.sectionHeaderTitle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M3 22v-4h18v4H3zM12 2L2 7h20L12 2zM4 9v7h3V9H4zm5 0v7h3V9H9zm5 0v7h3V9h-3zm5 0v7h3V9h-3z"/></svg>
          <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Settlement Account</h3>
        </div>

        <div style={styles.bankGrid} onClick={handleBankClick}>
          {bank && bank.accountNumber ? (
            <>
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </>
          ) : (
            <div style={styles.noBankContainer}>
              <div style={styles.noBankContent}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                  <h4 style={styles.noBankTitle}>No Bank Account Added</h4>
                  <p style={styles.noBankDesc}>Click here to add your bank details to enable secure withdrawals.</p>
                </div>
              </div>
              <button style={styles.addBankBtn}>Add Bank Details →</button>
            </div>
          )}
        </div>
      </section>

      <section style={styles.superGlassContainer}>
        <div style={styles.historySectionHeader}>
          <div style={styles.sectionHeaderTitle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <h3 style={styles.superSectionTitle}>Audit Statement</h3>
          </div>
        </div>

        <div style={styles.filterWrapper}>
          <div style={styles.typeFilterGroup}>
            {["All", "Credit", "Debit"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  ...styles.filterTabBtn,
                  backgroundColor: filterType === type ? "#2563eb" : "#0f172a",
                  color: "#ffffff",
                  borderColor: filterType === type ? "#3b82f6" : "#334155"
                }}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div style={styles.dateFilterGroup}>
            <div style={styles.dateInputBox}>
              <label style={styles.dateLabel}>From:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.dateInput} />
            </div>
            <div style={styles.dateInputBox}>
              <label style={styles.dateLabel}>To:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.dateInput} />
            </div>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={styles.superEmptyStateContainer}>
            <p style={styles.superEmptyMainText}>No matching statement records found.</p>
          </div>
        ) : (
          <div style={styles.historyListContainer}>
            {visibleHistory.map((x) => {
              const isCredit = x.type === "Credit";
              const statusInfo = getStatusDetails(x.status, x.type);
              const holderName = bank?.accountHolderName || "Account Holder";
              const firstLetter = holderName.charAt(0).toUpperCase();
              const isRejected = x.status === "Rejected" || x.status === "Reject";

              // ডাইনামিক টাইটেল: বোনাস হলে বোনাসের নাম (যেমন Referral Bonus), নতুবা ডিফল্ট লেবেল
              const displayTitle = isCredit 
                ? (x.bonusType || x.note || "Bonus Credited") 
                : holderName;

              return (
                <div key={x._id || x.createdAt} style={styles.historyRowItem} onClick={() => setSelectedTx(x)}>
                  <div style={styles.historyLeftSection}>
                    <div style={{
                      ...styles.avatarCircle, 
                      backgroundColor: isCredit ? "#d1fae5" : (isRejected ? "#fee2e2" : "#e0e7ff"),
                      color: isCredit ? "#065f46" : (isRejected ? "#b91c1c" : "#3730a3")
                    }}>
                      {firstLetter}
                    </div>
                    <div>
                      <div style={styles.historyHolderName}>{displayTitle}</div>
                      <div style={styles.historyDateText}>
                        {new Date(x.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}, {new Date(x.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <span style={{...styles.tagBadge, backgroundColor: statusInfo.bgColor, color: statusInfo.color}}>
                        {isCredit ? `💰 ${x.bonusType || "Credited"}` : (statusInfo.text === "COMPLETED" ? "💸 Withdrawal Sent" : statusInfo.text === "REFUNDED" ? "🔄 Refunded" : "⏳ Pending")}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.historyRightSection}>
                    <div style={{
                      ...styles.historyAmtText, 
                      color: isCredit ? "#10b981" : (statusInfo.text === "REFUNDED" ? "#ef4444" : "#f87171")
                    }}>
                      {isCredit ? "+" : "-"} {money(x.amount)}
                    </div>
                    <div style={styles.fromBankText}>{isCredit ? "In 💳" : (isRejected ? "Returned 🔄" : "Out 🏦")}</div>
                  </div>
                </div>
              );
            })}
            
            {filteredHistory.length > visibleCount && (
              <button style={styles.viewMoreBtn} onClick={() => setVisibleCount(prev => prev + 5)}>
                View More ↓
              </button>
            )}
          </div>
        )}
      </section>

      {selectedTx && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentWrapper}>
            <div ref={receiptRef} style={styles.newReceiptCard}>
              <div style={styles.tickAreaContainer}>
                <div style={styles.greenTickCircle}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 style={styles.txSuccessTitle}>{selectedTx.type === "Credit" ? "Bonus Credited Successfully" : "Transaction Record"}</h4>
                <h2 style={styles.txMainAmountText}>{selectedTx.type === "Credit" ? "+" : "-"} {money(selectedTx.amount)}</h2>
                <div style={styles.badgeRewardLabel}>{selectedTx.type === "Credit" ? (selectedTx.bonusType || "WALLET BONUS") : "WITHDRAWAL SETTLED"}</div>
              </div>

              <div style={styles.dottedDividerLine} />

              <div style={styles.receiptDataGrid}>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Type</span>
                  <span style={styles.gridValueBold}>{selectedTx.type === "Credit" ? "Credit" : "Debit"}</span>
                </div>
                {selectedTx.bonusType && (
                  <div style={styles.gridRow}>
                    <span style={styles.gridLabel}>Bonus Type</span>
                    <span style={styles.gridValueBold}>{selectedTx.bonusType}</span>
                  </div>
                )}
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Date & Time</span>
                  <span style={styles.gridValueBold}>{new Date(selectedTx.createdAt).toLocaleString("en-IN", {hour12: true})}</span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Status</span>
                  <span style={styles.statusCapsuleStyle}>{selectedTx.status || "Completed"}</span>
                </div>
              </div>

              <div style={styles.brandingSec}>
                <span>Powered by SafeMoney Secure</span>
              </div>
            </div>

            <div style={styles.actionButtonGroupContainer}>
              <button style={styles.purpleShareBtn} onClick={handleShareToWhatsApp}>📸 Share / Save Receipt Image</button>
              <button style={styles.whiteCloseBtn} onClick={() => setSelectedTx(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", width: "100%", background: "linear-gradient(180deg, #090d16 0%, #0f172a 50%, #0b1325 100%)", color: "#f8fafc", padding: "24px 16px 48px 16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" },
  topNav: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" },
  backBtn: { width: "48px", height: "48px", borderRadius: "12px", border: "1px solid #334155", background: "#1e293b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  topCenterTitle: { textAlign: "center", flex: 1 },
  titleFlex: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  mainHeading: { fontSize: "24px", fontWeight: "800", margin: 0 }, 
  subHeading: { margin: "6px 0 0 0", fontSize: "14px", color: "#94a3b8" }, 
  secureBadge: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(16, 185, 129, 0.12)", border: "1.5px solid #10b981", padding: "8px 14px", borderRadius: "10px", color: "#34d399" },
  balanceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  balanceCard: { position: "relative", padding: "22px 18px", borderRadius: "18px", border: "1px solid", display: "flex", flexDirection: "column", minHeight: "150px", boxSizing: "border-box" },
  cardHeaderFlex: { display: "flex", alignItems: "center", gap: "12px" },
  walletIconBox: { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  cardMeta: { display: "flex", flexDirection: "column", gap: "2px" },
  amountEyeRow: { display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" },
  eyeIcon: { fontSize: "18px", color: "#cbd5e1" },
  cardTag: { fontSize: "14px", fontWeight: "700", color: "#94a3b8" }, 
  cardAmount: { fontSize: "24px", fontWeight: "800", margin: 0 }, 
  cardDesc: { margin: "16px 0 0 0", fontSize: "13px", color: "#94a3b8", fontWeight: "500" },
  percentageBadge: { position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(14, 165, 233, 0.15)", border: "1.5px solid #0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", color: "#38bdf8" },
  glassContainer: { width: "100%", padding: "24px 20px", borderRadius: "20px", background: "#111c30", border: "1px solid #1e293b", boxSizing: "border-box" },
  sectionTitle: { margin: "0 0 18px 0", fontSize: "18px", fontWeight: "800" }, 
  inputWrapper: { display: "flex", alignItems: "center", background: "#0b1325", border: "1.5px solid #334155", borderRadius: "14px", padding: "0 20px" },
  currencyPrefix: { fontSize: "28px", fontWeight: "800", marginRight: "12px", color: "#3b82f6" },
  input: { width: "100%", height: "60px", border: "none", background: "transparent", color: "#ffffff", fontSize: "28px", fontWeight: "800", outline: "none" },
  calculationBox: { marginTop: "18px", padding: "14px 0", display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1.5px dashed #1e293b" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" },
  calcTotalRow: { marginTop: "8px", paddingTop: "14px", borderTop: "1px solid #1e293b" },
  calcLabel: { fontSize: "15px", fontWeight: "600", color: "#94a3b8" }, 
  calcValue: { fontSize: "16px", fontWeight: "700" },
  minNotice: { fontSize: "14px", color: "#94a3b8", margin: "14px 0 20px 2px", fontWeight: "500" },
  submitBtn: { width: "100%", height: "56px", border: "none", borderRadius: "14px", background: "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)", color: "#ffffff", fontWeight: "800", fontSize: "17px", cursor: "pointer" },
  btnContent: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  sectionHeaderTitle: { display: "flex", alignItems: "center", gap: "12px" },
  bankGrid: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0b1325", padding: "20px", borderRadius: "16px", border: "1px solid #1e293b", cursor: "pointer" },
  bankFieldsGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flex: 1 },
  bankMeta: { display: "flex", flexDirection: "column", gap: "4px" },
  metaLabel: { fontSize: "12px", fontWeight: "700", color: "#64748b" }, 
  metaValue: { fontSize: "16px", fontWeight: "800" }, 
  bankArrowContainer: { paddingLeft: "14px" },
  bankActionCircle: { width: "42px", height: "42px", borderRadius: "50%", border: "none", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" },
  noBankContainer: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" },
  noBankContent: { display: "flex", alignItems: "center", gap: "14px", flex: 1 },
  noBankTitle: { fontSize: "16px", fontWeight: "800", color: "#f59e0b", margin: "0 0 2px 0" },
  noBankDesc: { fontSize: "13px", color: "#94a3b8", margin: 0 },
  addBankBtn: { background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)", color: "#000000", border: "none", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: "800", cursor: "pointer" },
  historySectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", width: "100%" },
  superGlassContainer: { width: "100%", padding: "24px 20px", borderRadius: "20px", background: "#111c30", border: "1px solid #1e293b", boxSizing: "border-box" },
  superSectionTitle: { margin: 0, fontSize: "20px", fontWeight: "800" },
  superEmptyStateContainer: { textAlign: "center", padding: "40px 16px" },
  superEmptyMainText: { fontSize: "16px", color: "#94a3b8", fontWeight: "600" },
  filterWrapper: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px", background: "#0b1325", padding: "14px", borderRadius: "14px", border: "1px solid #1e293b" },
  typeFilterGroup: { display: "flex", gap: "8px" },
  filterTabBtn: { flex: 1, padding: "10px", border: "1px solid", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "700" },
  dateFilterGroup: { display: "flex", gap: "12px", flexWrap: "wrap" },
  dateInputBox: { flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", gap: "4px" },
  dateLabel: { fontSize: "12px", fontWeight: "700", color: "#94a3b8" },
  dateInput: { background: "#111c30", border: "1px solid #1e293b", color: "#ffffff", padding: "8px", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" },
  historyListContainer: { display: "flex", flexDirection: "column", gap: "2px" },
  historyRowItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 10px", borderBottom: "1px solid #1e293b", cursor: "pointer", borderRadius: "10px" },
  historyLeftSection: { display: "flex", alignItems: "center", gap: "14px" },
  avatarCircle: { width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800" },
  historyHolderName: { fontSize: "16px", fontWeight: "700", color: "#ffffff" },
  historyDateText: { fontSize: "13px", color: "#94a3b8", marginTop: "2px" },
  tagBadge: { display: "inline-block", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", marginTop: "6px" },
  historyRightSection: { textAlign: "right" },
  historyAmtText: { fontSize: "18px", fontWeight: "800" },
  fromBankText: { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  viewMoreBtn: { width: "100%", background: "#1e293b", color: "#ffffff", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: "700", marginTop: "14px", textAlign: "center" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px", overflowY: "auto" },
  modalContentWrapper: { width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "14px" },
  newReceiptCard: { width: "100%", backgroundColor: "#ffffff", borderRadius: "24px", padding: "24px 20px", boxSizing: "border-box", color: "#000000", position: "relative" },
  tickAreaContainer: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "6px" },
  greenTickCircle: { width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" },
  txSuccessTitle: { fontSize: "16px", color: "#64748b", fontWeight: "600", margin: "14px 0 0 0" },
  txMainAmountText: { fontSize: "32px", fontWeight: "900", margin: "6px 0" },
  badgeRewardLabel: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", letterSpacing: "0.5px", background: "#f1f5f9", color: "#334155" },
  dottedDividerLine: { borderTop: "2px dashed #cbd5e1", margin: "20px 0 16px 0", width: "100%", height: "1px" },
  receiptDataGrid: { display: "flex", flexDirection: "column", gap: "14px", padding: "0 4px" },
  gridRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  gridLabel: { fontSize: "15px", color: "#64748b", fontWeight: "500" },
  gridValueBold: { fontSize: "15px", color: "#000000", fontWeight: "700", textAlign: "right", maxWidth: "60%", wordBreak: "break-all" },
  statusCapsuleStyle: { padding: "2px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", background: "#ecfdf5", color: "#059669" },
  brandingSec: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "#94a3b8", margin: "24px 0 0 0", fontWeight: "600" },
  actionButtonGroupContainer: { display: "flex", flexDirection: "column", gap: "10px", width: "100%" },
  purpleShareBtn: { width: "100%", height: "50px", backgroundColor: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: "700", cursor: "pointer" },
  whiteCloseBtn: { width: "100%", height: "50px", backgroundColor: "#ffffff", color: "#334155", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }
};
