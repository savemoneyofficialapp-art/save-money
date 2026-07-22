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
  const [loading, setLoading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  
  // ট্রানজ্যাকশন ডিটেইলস মোডাল স্টেট
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);

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
          return reqDate === today && (req.status === "Pending" || req.status === "Success");
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
    if (Number(amount) < 100) {
      toast.info("Minimum withdrawal limit is ₹100");
      return;
    }
    if (Number(amount) > withdrawableBalance) {
      toast.info("Amount exceeds your withdrawable limit (80% of earnings)");
      return;
    }

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

  // html2canvas দিয়ে ইমেজ তৈরি করে সরাসরি WhatsApp এ শেয়ার করার লজিক
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
              text: "Here is my transaction receipt from SaveMoney Secure."
            });
            return;
          } catch (e) {
            console.log("Web Share target closed or failed, falling back to direct link.");
          }
        }

        const imageURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageURL;
        link.download = `Receipt_${selectedTx._id || "tx"}.png`;
        link.click();

        const whatsappText = encodeURIComponent(`Hello, sharing my transaction receipt of ${money(selectedTx.amount)}. Please check image downloaded to your device.`);
        window.open(`https://api.whatsapp.com/send?text=${whatsappText}`, "_blank");
        
        toast.success("Receipt saved! Opening WhatsApp...");
      }, "image/png");

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate receipt share");
    }
  };

  const getStatusDetails = (status) => {
    if (status === "Rejected" || status === "Reject") {
      return { text: "REFUNDED", color: "#ef4444", bgColor: "#fef2f2" };
    }
    if (status === "Success" || status === "Approved") {
      return { text: "COMPLETED", color: "#00b074", bgColor: "#e6f7f1" };
    }
    return { text: "PENDING", color: "#eab308", bgColor: "#fef9c3" };
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
              <span style={styles.metaValue}>{bank?.accountHolderName || "Rama Basu Biswas"}</span>
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

      {/* Audit Statement */}
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
          <div style={styles.historyListContainer}>
            {visibleHistory.map((x) => {
              const statusInfo = getStatusDetails(x.status);
              const holderName = bank?.accountHolderName || "Rama Basu Biswas";
              const firstLetter = holderName.charAt(0).toUpperCase();

              return (
                <div 
                  key={x._id || x.createdAt} 
                  style={styles.historyRowItem} 
                  onClick={() => setSelectedTx(x)}
                >
                  <div style={styles.historyLeftSection}>
                    <div style={styles.avatarCircle}>
                      {firstLetter}
                    </div>
                    <div>
                      <div style={styles.historyHolderName}>{holderName}</div>
                      <div style={styles.historyDateText}>
                        {new Date(x.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}, {new Date(x.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <span style={{...styles.tagBadge, backgroundColor: statusInfo.bgColor, color: statusInfo.color}}>
                        {statusInfo.text === "COMPLETED" ? "💸 Money Received" : statusInfo.text === "REFUNDED" ? "🔄 Refunded" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.historyRightSection}>
                    <div style={{
                      ...styles.historyAmtText, 
                      color: statusInfo.text === "COMPLETED" ? "#00b074" : statusInfo.text === "REFUNDED" ? "#ef4444" : "#eab308"
                    }}>
                      {statusInfo.text === "COMPLETED" ? "+" : ""} {money(x.amount)}
                    </div>
                    <div style={styles.fromBankText}>In 🏦</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* রসিদ উইন্ডো মোডাল */}
      {selectedTx && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentWrapper}>
            
            <div ref={receiptRef} style={styles.newReceiptCard}>
              <div style={styles.tickAreaContainer}>
                <div style={styles.greenTickCircle}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#00b074" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 style={styles.txSuccessTitle}>Transaction Successful</h4>
                <h2 style={styles.txMainAmountText}>+ {money(selectedTx.amount)}</h2>
                <div style={styles.badgeRewardLabel}>DAILY REWARD ADDED</div>
              </div>

              <div style={styles.dottedDividerLine} />

              <div style={styles.receiptDataGrid}>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Wallet ID</span>
                  <span style={styles.gridValueBold}>{selectedTx.walletId || `WAL${selectedTx.userId?.slice(-6) || "327865"}`}</span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>User Name</span>
                  <span style={styles.gridValueBold}>{bank?.accountHolderName || "Rama Basu Biswas"}</span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Transaction ID</span>
                  <span style={{...styles.gridValueBold, color: "#7c3aed"}}>{selectedTx._id || "6a611c2c9590aef1e987525a"}</span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Date & Time</span>
                  <span style={styles.gridValueBold}>
                    {new Date(selectedTx.createdAt).toLocaleString("en-IN", {hour12: true})}
                  </span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Remarks</span>
                  <span style={styles.gridValueBold}>Withdraw</span>
                </div>
                <div style={styles.gridRow}>
                  <span style={styles.gridLabel}>Status</span>
                  <span style={{
                    ...styles.statusCapsuleStyle,
                    color: getStatusDetails(selectedTx.status).color,
                    backgroundColor: getStatusDetails(selectedTx.status).bgColor
                  }}>{getStatusDetails(selectedTx.status).text}</span>
                </div>
              </div>

              {(selectedTx.status === "Rejected" || selectedTx.status === "Reject") && (
                <div style={styles.adminRejectReasonBox}>
                  <strong>Refund Reason:</strong> {selectedTx.rejectReason || selectedTx.reason || "Cancelled by manager"}
                </div>
              )}

              <div style={styles.brandingSec}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>Powered by SaveMoney Secure</span>
              </div>
            </div>

            <div style={styles.actionButtonGroupContainer}>
              <button style={styles.purpleShareBtn} onClick={handleShareToWhatsApp}>
                📸 Share / Save Receipt Image
              </button>
              <button style={styles.whiteCloseBtn} onClick={() => setSelectedTx(null)}>
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

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
  superTrustContainer: { width: "100%", background: "#0a1122", border: "2px solid #202f4e", borderRadius: "26px", padding: "36px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" },
  superTrustItem: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center" },
  superDivider: { width: "2.5px", backgroundColor: "#202f4e", height: "45px", alignSelf: "center" },
  superTrustTitle: { fontSize: "17px", fontWeight: "950", margin: "16px 0 0 0", whiteSpace: "nowrap", letterSpacing: "0.3px" },

  // ইউআই লিস্ট স্টাইলস
  historyListContainer: { display: "flex", flexDirection: "column", gap: "2px" },
  historyRowItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 14px", borderBottom: "1.5px solid #202f4e", cursor: "pointer", borderRadius: "12px" },
  historyLeftSection: { display: "flex", alignItems: "center", gap: "18px" },
  avatarCircle: { width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#dbeafe", color: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800" },
  historyHolderName: { fontSize: "22px", fontWeight: "700", color: "#ffffff" },
  historyDateText: { fontSize: "15px", color: "#94a3b8", marginTop: "4px" },
  tagBadge: { display: "inline-block", padding: "4px 10px", borderRadius: "8px", fontSize: "14px", fontWeight: "700", marginTop: "8px" },
  historyRightSection: { textAlign: "right" },
  historyAmtText: { fontSize: "24px", fontWeight: "900" },
  fromBankText: { fontSize: "14px", color: "#64748b", marginTop: "4px" },
  
  // রসিদ মোডাল ডিজাইন 
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px", overflowY: "auto" },
  modalContentWrapper: { width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", gap: "16px" },
  newReceiptCard: { width: "100%", backgroundColor: "#ffffff", borderRadius: "32px", padding: "30px 24px", boxSizing: "border-box", color: "#000000", position: "relative" },
  tickAreaContainer: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "10px" },
  greenTickCircle: { width: "70px", height: "70px", borderRadius: "50%", backgroundColor: "#e6f7f1", display: "flex", alignItems: "center", justifyContent: "center" },
  txSuccessTitle: { fontSize: "20px", color: "#64748b", fontWeight: "600", margin: "18px 0 0 0" },
  txMainAmountText: { fontSize: "44px", fontWeight: "900", color: "#00b074", margin: "8px 0" },
  badgeRewardLabel: { backgroundColor: "#f1f5f9", padding: "6px 14px", borderRadius: "30px", fontSize: "13px", fontWeight: "800", color: "#334155", letterSpacing: "0.5px" },
  dottedDividerLine: { borderTop: "2.5px dashed #cbd5e1", margin: "30px 0 20px 0", width: "100%", height: "1px" },
  receiptDataGrid: { display: "flex", flexDirection: "column", gap: "18px", padding: "0 6px" },
  gridRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  gridLabel: { fontSize: "17px", color: "#64748b", fontWeight: "500" },
  gridValueBold: { fontSize: "17px", color: "#000000", fontWeight: "700", textAlign: "right", maxWidth: "60%", wordBreak: "break-all" },
  statusCapsuleStyle: { padding: "4px 12px", borderRadius: "6px", fontSize: "14px", fontWeight: "800", letterSpacing: "0.3px" },
  adminRejectReasonBox: { marginTop: "14px", padding: "10px", backgroundColor: "#fef2f2", borderRadius: "8px", borderLeft: "4px solid #ef4444", fontSize: "14px", color: "#991b1b" },
  brandingSec: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "14px", color: "#94a3b8", marginTop: "35px", fontWeight: "600" },
  actionButtonGroupContainer: { display: "flex", flexDirection: "column", gap: "12px", width: "100%" },
  purpleShareBtn: { width: "100%", height: "60px", backgroundColor: "#8b5cf6", color: "#ffffff", border: "none", borderRadius: "20px", fontSize: "19px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 14px rgba(139,92,246,0.4)" },
  whiteCloseBtn: { width: "100%", height: "60px", backgroundColor: "#ffffff", color: "#334155", border: "none", borderRadius: "20px", fontSize: "19px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }
};
