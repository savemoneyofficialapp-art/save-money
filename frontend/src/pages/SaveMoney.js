import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function SaveMoney() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(5);
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [statusOverlay, setStatusOverlay] = useState({
    show: false,
    type: "info",
    message: ""
  });

  const showStatusMsg = (type, message) => {
    setStatusOverlay({ show: true, type, message });
    setTimeout(() => {
      setStatusOverlay({ show: false, type: "info", message: "" });
    }, 3000);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setBalance(Number(data.balance || data.wallet || 0));
    } catch (err) {
      console.log("BALANCE LOAD ERROR:", err);
    }
  };

  const getRate = (y) => {
    if (Number(y) === 1) return 11;
    if (Number(y) === 3) return 14;
    if (Number(y) === 5) return 20;
    if (Number(y) === 10) return 24;
    if (Number(y) === 15) return 27;
    return 30;
  };

  const rate = getRate(years);

  const calc = useMemo(() => {
    const monthly = Number(amount || 0);
    const annualRate = Number(rate || 0);
    const totalYears = Number(years || 1);
    const r = annualRate / 100 / 12;
    const n = totalYears * 12;

    let maturityAmount = 0;
    let totalInterest = 0;

    if (r > 0) {
      maturityAmount = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      totalInterest = maturityAmount - (monthly * n);
    } else {
      maturityAmount = monthly * n;
      totalInterest = 0;
    }

    return {
      monthly,
      totalInvestment: monthly * n,
      estimatedReturn: totalInterest,
      totalInterest,
      totalReturn: maturityAmount
    };
  }, [amount, years, rate]);

  const money = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const openTerms = () => {
    if (accepted) {
      setAccepted(false);
      return;
    }
    setTermsOpen(true);
  };

  const acceptTerms = () => {
    setAccepted(true);
    setTermsOpen(false);
    showStatusMsg("success", "Terms accepted successfully.");
  };

  const confirmSip = async () => {
    if (Number(amount) < 2000) {
      showStatusMsg("error", "Minimum SIP amount ₹2000 required");
      return toast.info("Minimum SIP amount ₹2000 required");
    }
    if (!accepted) {
      setTermsOpen(true);
      return;
    }
    if (Number(balance) < Number(amount)) {
      showStatusMsg("error", "Insufficient wallet balance");
      return toast.error("Insufficient wallet balance");
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/start-invest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          email,
          amount: Number(amount),
          years: Number(years),
          rate: Number(rate),
          totalPlanAmount: Number(calc.totalInvestment),
          totalInterest: Number(calc.totalInterest),
          maturityAmount: Number(calc.totalReturn)
        })
      });

      const data = await res.json();
      if (data.msg === "Token expired or invalid") {
        localStorage.clear();
        showStatusMsg("error", "Session expired.");
        setTimeout(() => { window.location.href = "/login"; }, 2000);
        return;
      }

      if (data.success) {
        showStatusMsg("success", data.msg || "SIP Confirmed 🌱");
        setAmount("");
        setAccepted(false);
        loadBalance();
      } else {
        showStatusMsg("info", data.msg || "Transaction failed");
      }
    } catch (err) {
      showStatusMsg("error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      
      {/* STATUS OVERLAY */}
      {statusOverlay.show && (
        <div style={styles.statusOverlayBg}>
          <div style={styles.statusOverlayCard}>
            <span style={styles.statusOverlayText}>{statusOverlay.message}</span>
          </div>
        </div>
      )}

      {/* TOP DECORATIVE GLOBAL LINING */}
      <div style={styles.topLining}></div>

      {/* FULL WIDTH WRAPPER */}
      <div style={styles.fluidContainer}>
        
        {/* ROW 1: HEADER SECTION */}
        <header style={styles.mainHeader}>
          <div style={styles.headerBrandBox}>
            <button style={styles.classicBackBtn} onClick={() => window.history.back()}>← Go Back</button>
            <h1 style={styles.brandTitle}>SAVE <span style={styles.brandSpan}>MONEY</span></h1>
            <span style={styles.badgePremium}>INSTITUTIONAL INVESTING</span>
          </div>
          
          {/* BALANCE BLOCK */}
          <div style={styles.headerBalanceContainer}>
            <div style={styles.balanceMiniMeta}>
              <span style={styles.lbl}>WALLET CLEARING BALANCE</span>
              <h2 style={styles.val}>{money(balance)}</h2>
            </div>
            <button style={styles.actionAddMoney} onClick={() => (window.location.href = "/wallet")}>Deposit Funds</button>
            <button style={styles.actionHelp} onClick={() => setHelpOpen(true)}>Guide</button>
          </div>
        </header>

        {/* ROW 2: INPUT CONFIGURATION (FULL SCREEN STRETCHED) */}
        <section style={styles.configFullPanel}>
          <div style={styles.panelRow}>
            <div style={{ flex: 2 }}>
              <label style={styles.fieldLabel}>Enter Monthly SIP Contribution Amount</label>
              <div style={styles.hugeInputWrapper}>
                <span style={styles.inputCurrency}>₹</span>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  style={styles.hugeInput} 
                  placeholder="0.00"
                />
                <span style={styles.inputNotice}>Min Limit ₹2,000</span>
              </div>
              {Number(amount) > 0 && Number(amount) < 2000 && (
                <span style={styles.inlineError}>⚠️ Requested threshold is beneath the minimum requirement of ₹2,000.</span>
              )}
            </div>

            <div style={{ flex: 3 }}>
              <label style={styles.fieldLabel}>Select Dynamic Tenure Matrix</label>
              <div style={styles.flexTenureGroup}>
                {[1, 3, 5, 10, 15, 20].map((y) => (
                  <button 
                    key={y} 
                    onClick={() => setYears(y)}
                    style={{ ...styles.tenureChip, ...(years === y ? styles.tenureChipActive : {}) }}
                  >
                    {y} {y === 1 ? "Year Plan" : "Years Plan"}
                    <span style={styles.percentageIndicator}>{getRate(y)}% ROI</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ROW 3: COMPOUNDING CALCULATION (নিচে পাশাপাশি দুটো সমান রেখায় বিস্তৃত হিসাব) */}
        <section style={styles.compoundingDataSection}>
          <h3 style={styles.sectionHeadingLine}>COMPOUNDING CALCULATION & MATRIX PROJECTIONS</h3>
          
          <div style={styles.twinGridRows}>
            {/* LINE 1 COMPONENT */}
            <div style={styles.gridRowBlock}>
              <div style={styles.metricBlock}>
                <span style={styles.metricLabel}>PRINCIPAL INVESTMENT VALUE</span>
                <h3 style={{ ...styles.metricValue, color: "#3b82f6" }}>{money(calc.totalInvestment)}</h3>
              </div>
              <div style={styles.metricBlock}>
                <span style={styles.metricLabel}>TOTAL YIELD INTEREST ACCRUED</span>
                <h3 style={{ ...styles.metricValue, color: "#f59e0b" }}>{money(calc.totalInterest)}</h3>
              </div>
            </div>

            {/* LINE 2 COMPONENT */}
            <div style={styles.gridRowBlock}>
              <div style={styles.metricBlock}>
                <span style={styles.metricLabel}>ESTIMATED COMPOUND RETURNS</span>
                <h3 style={{ ...styles.metricValue, color: "#10b981" }}>{money(calc.estimatedReturn)}</h3>
              </div>
              <div style={styles.metricBlock}>
                <span style={styles.metricLabel}>EXPECTED MATURITY LIQUID ASSET</span>
                <h3 style={{ ...styles.metricValue, color: "#a855f7" }}>{money(calc.totalReturn)}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* ROW 4: INTERACTION WORKFLOW TERMINAL */}
        <footer style={styles.actionTerminal}>
          <div style={styles.termsAgreementBar} onClick={openTerms}>
            <div style={{ ...styles.customCheck, ...(accepted ? styles.customCheckActive : {}) }}>
              {accepted && "✓"}
            </div>
            <p style={styles.agreementMessage}>
              I authorize the validation of the inputs and accept the corporate structural <span style={{ color: "#6366f1", textDecoration: "underline" }}>investment asset guidelines</span>.
            </p>
          </div>

          <button style={styles.masterSubmitBtn} onClick={confirmSip} disabled={loading}>
            {loading ? "COMMITTING ASSET PROTOCOL..." : "PROCEED & DEPLOY SIP TERM ASSET"}
          </button>
        </footer>

      </div>

      {/* TERMS MODAL */}
      {termsOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.cleanModal}>
            <h3 style={{ marginTop: 0, color: "#fff" }}>Investment Disclosure Policy</h3>
            <div style={styles.modalBodyText}>
              <p>1. Save Money SIP functions on strict monthly recurring asset allocation cycles.</p>
              <p>2. Failure to supply liquidity to the wallet pool on target deployment dates may affect compound estimations.</p>
              <p>3. Standard calculations are computed using uniform compound formulas based on institutional company performance indices.</p>
            </div>
            <button style={styles.modalActionBtn} onClick={acceptTerms}>Acknowledge Policy & Term</button>
          </div>
        </div>
      )}

      {/* HELP ASSISTANT MODAL */}
      {helpOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.cleanModal}>
            <h3 style={{ marginTop: 0, color: "#3b82f6" }}>Platform Guide</h3>
            <p style={styles.modalBodyText}>
              নির্ধারিত পরিমাণ ব্যালেন্স ইনপুট বক্সে সেট করুন (নূন্যতম ₹২,০০০) এবং ডানদিকের প্যানেল থেকে আপনার সুবিধাজনক মেয়াদী প্ল্যান নির্বাচন করুন। নিচে অটোমেটিক রিয়েল-টাইম হিসাব দেখতে পাবেন।
            </p>
            <button style={{ ...styles.modalActionBtn, background: "#3b82f6" }} onClick={() => setHelpOpen(false)}>Close Guide</button>
          </div>
        </div>
      )}

    </div>
  );
}

// ULTRA-CLEAN FULL SCREEN LUXURY STYLING SHEET
const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    background: "#030712",
    color: "#f1f5f9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: 0,
    padding: 0,
    overflowX: "hidden",
    position: "relative"
  },
  topLining: {
    height: "4px",
    width: "100%",
    background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)"
  },
  fluidContainer: {
    width: "100%",
    padding: "40px 60px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "35px"
  },
  mainHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "25px"
  },
  headerBrandBox: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  classicBackBtn: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#94a3b8",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500"
  },
  brandTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "1px"
  },
  brandSpan: {
    color: "#10b981"
  },
  badgePremium: {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    color: "#818cf8",
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "6px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  headerBalanceContainer: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  balanceMiniMeta: {
    textAlign: "right"
  },
  lbl: {
    display: "block",
    fontSize: "10px",
    color: "#64748b",
    fontWeight: "700"
  },
  val: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff"
  },
  actionAddMoney: {
    background: "#ffffff",
    color: "#030712",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer"
  },
  actionHelp: {
    background: "#1f2937",
    color: "#94a3b8",
    border: "1px solid #374151",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer"
  },
  configFullPanel: {
    background: "#0b1329",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "30px"
  },
  panelRow: {
    display: "flex",
    gap: "40px",
    alignItems: "center"
  },
  fieldLabel: {
    display: "block",
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  hugeInputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#030712",
    border: "1px solid #334155",
    borderRadius: "12px",
    height: "56px",
    padding: "0 16px",
    gap: "10px"
  },
  inputCurrency: {
    fontSize: "22px",
    color: "#10b981",
    fontWeight: "700"
  },
  hugeInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "700",
    flex: 1
  },
  inputNotice: {
    fontSize: "11px",
    color: "#f59e0b",
    background: "rgba(245,158,11,0.08)",
    padding: "4px 8px",
    borderRadius: "6px",
    fontWeight: "600"
  },
  inlineError: {
    color: "#f43f5e",
    fontSize: "12px",
    display: "block",
    marginTop: "6px"
  },
  flexTenureGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },
  tenureChip: {
    flex: "1 1 140px",
    background: "#111827",
    border: "1px solid #374151",
    borderRadius: "10px",
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "left",
    color: "#cbd5e1"
  },
  tenureChipActive: {
    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    border: "1px solid #3b82f6",
    color: "#ffffff"
  },
  percentageIndicator: {
    display: "block",
    fontSize: "11px",
    color: "#10b981",
    fontWeight: "700",
    marginTop: "2px"
  },

  // COMPOUNDING SECTION (স্ক্রিনের নিচে পাশাপাশি ২টি রেখায় বিস্তৃত হিসাব)
  compoundingDataSection: {
    marginTop: "10px"
  },
  sectionHeadingLine: {
    margin: "0 0 16px",
    fontSize: "12px",
    letterSpacing: "1px",
    color: "#64748b",
    fontWeight: "700"
  },
  twinGridRows: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  gridRowBlock: {
    display: "flex",
    gap: "14px",
    width: "100%"
  },
  metricBlock: {
    flex: 1,
    background: "#0b1329",
    border: "1px solid #1e293b",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  metricLabel: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  metricValue: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800"
  },

  actionTerminal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #1e293b",
    paddingTop: "25px",
    marginTop: "10px"
  },
  termsAgreementBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer"
  },
  customCheck: {
    width: "18px",
    height: "18px",
    border: "2px solid #475569",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "12px"
  },
  customCheckActive: {
    background: "#6366f1",
    borderColor: "#6366f1"
  },
  agreementMessage: {
    margin: 0,
    fontSize: "13px",
    color: "#94a3b8"
  },
  masterSubmitBtn: {
    background: "linear-gradient(90deg, #10b981, #059669)",
    color: "#ffffff",
    border: "none",
    padding: "16px 36px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.5px"
  },
  statusOverlayBg: {
    position: "fixed",
    top: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 99999
  },
  statusOverlayCard: {
    background: "#1e293b",
    border: "1px solid #475569",
    padding: "12px 24px",
    borderRadius: "30px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
  },
  statusOverlayText: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3,7,18,0.8)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  },
  cleanModal: {
    background: "#0b1329",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "30px",
    width: "450px"
  },
  modalBodyText: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "1.6"
  },
  modalActionBtn: {
    width: "100%",
    padding: "12px",
    background: "#10b981",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "15px"
  }
};
