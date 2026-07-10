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

  // কাস্টম প্রিমিয়াম স্ট্যাটাস বক্স স্টেট
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

  // স্ক্রল পজিশন ফিক্স
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
    showStatusMsg("success", "Terms & Conditions Accepted!");
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
        showStatusMsg("error", "Session expired. Logging out.");
        setTimeout(() => { window.location.href = "/login"; }, 2000);
        return;
      }

      if (data.success) {
        showStatusMsg("success", data.msg || "SIP Plan Started Successfully! 🌱");
        setAmount("");
        setAccepted(false);
        loadBalance();
      } else {
        showStatusMsg("info", data.msg || "Could not complete transaction");
      }
    } catch (err) {
      console.log("START SIP ERROR:", err);
      showStatusMsg("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.mainContainer}>

        {/* BACKGROUND LUSH GLOWS */}
        <div style={styles.glowTopLeft}></div>
        <div style={styles.glowBottomRight}></div>

        {/* কাস্টম প্রিমিয়াম স্ট্যাটাস বক্স ওভারলে */}
        {statusOverlay.show && (
          <div style={styles.statusOverlayBg}>
            <div style={{
              ...styles.statusOverlayCard,
              borderTop: statusOverlay.type === "success" ? "5px solid #10b981" : statusOverlay.type === "error" ? "5px solid #ef4444" : "5px solid #3b82f6"
            }}>
              <div style={{
                ...styles.statusOverlayIcon,
                background: statusOverlay.type === "success" ? "rgba(16,185,129,0.15)" : statusOverlay.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
                color: statusOverlay.type === "success" ? "#10b981" : statusOverlay.type === "error" ? "#ef4444" : "#3b82f6"
              }}>
                {statusOverlay.type === "success" ? "✓" : statusOverlay.type === "error" ? "✕" : "ℹ"}
              </div>
              <h3 style={styles.statusOverlayText}>{statusOverlay.message}</h3>
            </div>
          </div>
        )}

        {/* TOP BAR */}
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => window.history.back()}>
            ← Back
          </button>
          <span style={styles.headerTitleMain}>Premium Investment Desk</span>
          <button style={styles.helpBtn} onClick={() => setHelpOpen(true)}>
            Need Help?
          </button>
        </div>

        {/* BRAND HEADER */}
        <header style={styles.brandHeader}>
          <div style={styles.walletLogo}>
            <div style={styles.logoMoneyOne}></div>
            <div style={styles.logoMoneyTwo}></div>
            <div style={styles.logoCoin}>₹</div>
          </div>
          <h1 style={styles.brandTitle}>
            SAVE <span style={styles.brandSpan}>MONEY</span>
          </h1>
          <p style={styles.brandSub}>SECURE COMPREHENSIVE COMPOUNDING PLATFORM</p>
        </header>

        {/* GRID LAYOUT FOR WIDE SCREENS */}
        <div style={styles.dashboardGrid}>
          
          {/* LEFT COLUMN: WALLET & CONFIGURATION */}
          <div style={styles.gridColumn}>
            {/* WALLET BALANCE CARD */}
            <section style={styles.balanceCard}>
              <div style={styles.walletIconBox}>
                <span>👛</span>
              </div>
              <div style={styles.balanceInfo}>
                <p style={styles.balanceLabel}>TOTAL WALLET BALANCE</p>
                <h2 style={styles.balanceAmount}>{money(balance)}</h2>
                <small style={styles.balanceSubtext}>Available for instant deployment</small>
              </div>
              <button style={styles.addMoneyBtn} onClick={() => (window.location.href = "/wallet")}>
                <span>＋</span> Add Funds
              </button>
            </section>

            {/* SIP DETAILS MAIN CARD */}
            <section style={styles.mainCard}>
              <div style={styles.sectionHead}>
                <div style={styles.sectionIcon}>🌱</div>
                <h2 style={styles.sectionTitle}>Configure Your SIP Plan</h2>
              </div>

              <label style={styles.inputLabel}>Monthly SIP Investment Amount</label>
              <div style={styles.amountInputBox}>
                <span style={styles.rupeeSymbol}>₹</span>
                <input
                  style={styles.amountInput}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter Amount"
                />
                <b style={styles.minBadge}>Min ₹2,000</b>
              </div>

              {Number(amount || 0) > 0 && Number(amount) < 2000 && (
                <p style={styles.errorText}>⚠️ Minimum investment amount required is ₹2000</p>
              )}

              <label style={styles.inputLabel}>SIP Tenure / Duration</label>
              <div style={styles.durationGrid}>
                {[1, 3, 5, 10, 15, 20].map((y) => (
                  <button
                    key={y}
                    style={{
                      ...styles.durationBtn,
                      ...(years === y ? styles.durationActive : {})
                    }}
                    onClick={() => setYears(y)}
                  >
                    {y} {y === 1 ? "Year" : "Years"}
                    {years === y && <span style={styles.tickMark}>✓</span>}
                  </button>
                ))}
              </div>

              <div style={styles.recommendBox}>
                <div style={styles.starIcon}>⭐</div>
                <p style={styles.recommendText}>
                  <b>Strategic Advice:</b> 5 Years or higher lock-in periods generally trigger optimal asset compounding curves.
                </p>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: RETURNS & VALIDATION */}
          <div style={styles.gridColumn}>
            {/* ESTIMATED RETURNS */}
            <section style={styles.returnCard}>
              <h3 style={styles.returnTitle}>Compounding Growth Projections</h3>
              <div style={styles.returnGrid}>
                <ReturnItem icon="📈" title="Estimated Return" value={money(calc.estimatedReturn)} color="#10b981" bg="rgba(16,185,129,0.08)" />
                <ReturnItem icon="👛" title="Total Principal Investment" value={money(calc.totalInvestment)} color="#3b82f6" bg="rgba(59,130,246,0.08)" />
                <ReturnItem icon="🪙" title="Accumulated Interest" value={money(calc.totalInterest)} color="#f59e0b" bg="rgba(245,158,11,0.08)" />
                <ReturnItem icon="📊" title="Expected Maturity Value" value={money(calc.totalReturn)} color="#a855f7" bg="rgba(168,85,247,0.08)" />
              </div>
              <div style={styles.infoNote}>
                <span>ℹ</span> Analytics generated on statistical standard interest rates.
              </div>
            </section>

            {/* TERMS AGREEMENT */}
            <section style={styles.termsBox} onClick={openTerms}>
              <div style={{ ...styles.checkbox, ...(accepted ? styles.checkboxActive : {}) }}>
                {accepted ? "✓" : ""}
              </div>
              <p style={styles.termsText}>
                I declare that I have read, verified and accepted the <b style={styles.termsBold}>Terms, Conditions & Asset Disclosures</b>
              </p>
              <div style={styles.termsDoc}>📄</div>
            </section>

            {/* MAIN ACTION CONFIRM BUTTON */}
            <button style={styles.confirmBtn} onClick={confirmSip} disabled={loading}>
              <span>🛡️</span> {loading ? "Authorizing Safe Deposit..." : "Confirm & Establish SIP Asset"}
            </button>
          </div>

        </div>

        {/* FOOTER CORE FEATURES */}
        <section style={styles.bottomFeatures}>
          <FeatureItem icon="🔒" title="Vault-grade Security" sub="End-to-End Encrypted Protocols" color="#3b82f6" />
          <FeatureItem icon="📈" title="Optimized Yield" sub="Compounding Asset Calibration" color="#10b981" />
          <FeatureItem icon="⚡" title="Liquid Interfacing" sub="Automated Regular Payouts" color="#a855f7" />
        </section>

        {/* TERMS MODAL */}
        {termsOpen && (
          <div style={styles.overlay}>
            <div style={styles.termsModal}>
              <h2 style={styles.modalTitle}>Terms & Conditions</h2>
              <div style={styles.termsScroll}>
                <p>Save Money SIP is a disciplined monthly saving and investment plan. The minimum monthly SIP investment amount is ₹2000.</p>
                <p>User must select SIP duration and understand all estimated return values before confirming the investment from wallet balance.</p>
                <p>This SIP plan requires timely monthly renewal. If renewal is missed, investment benefits, bonuses, rewards or auto-withdrawal eligibility may be affected.</p>
                <p>Returns shown inside the application are estimated values only. Actual return may increase or decrease depending on company performance.</p>
                <p>Investment always involves financial risk. User confirms that they are investing voluntarily after understanding risk, reward and possible variation in ROI.</p>
              </div>
              <button style={styles.acceptBtn} onClick={acceptTerms}>
                Accept & Continue
              </button>
            </div>
          </div>
        )}

        {/* HELP ASSISTANT MODAL */}
        {helpOpen && (
          <div style={styles.overlay}>
            <div style={styles.helpModal}>
              <h2 style={styles.modalTitleDark}>Investment Assistant</h2>
              <p style={styles.helpContentText}>Save Money SIP plan আপনাকে প্রতি মাসে নিয়মিত saving করতে সাহায্য করবে।</p>
              <p style={styles.helpContentText}>Minimum monthly SIP amount হলো ₹2000। Amount লিখে duration select করলে নিচে estimated return দেখতে পাবেন।</p>
              <p style={styles.helpContentText}>1 Year = 11%, 3 Years = 14%, 5+ Years = 20% থেকে 30% পর্যন্ত estimated return দেখানো হবে।</p>
              <button style={styles.acceptBtnDark} onClick={() => setHelpOpen(false)}>
                Okay, I Understand
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// REUSABLE PRESENTATIONAL SUB-COMPONENTS
function ReturnItem({ icon, title, value, color, bg }) {
  return (
    <div style={styles.returnItem}>
      <div style={{ ...styles.returnIcon, background: bg, color }}>
        {icon}
      </div>
      <p style={styles.returnItemTitle}>{title}</p>
      <h2 style={{ ...styles.returnItemValue, color }}>{value}</h2>
    </div>
  );
}

function FeatureItem({ icon, title, sub, color }) {
  return (
    <div style={styles.featureItem}>
      <div style={{ ...styles.featureIcon, color, background: `${color}12` }}>
        {icon}
      </div>
      <b style={styles.featureTitle}>{title}</b>
      <p style={styles.featureSub}>{sub}</p>
    </div>
  );
}

// PREMIUM EXPANSIVE DESIGN SYSTEM
const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    background: "#020617",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
    color: "#f8fafc",
    overflowX: "hidden"
  },
  mainContainer: {
    width: "100%",
    maxWidth: "1280px", // ডেস্কটপের জন্য স্ট্যান্ডার্ড ওয়াইড কন্টেইনার ম্যাক্স-উইডথ
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070c1e 0%, #030712 100%)",
    position: "relative",
    padding: "30px 24px 60px",
    boxSizing: "border-box"
  },
  glowTopLeft: {
    position: "absolute",
    top: "-150px",
    left: "-150px",
    width: "500px",
    height: "500px",
    background: "rgba(99, 102, 241, 0.12)",
    filter: "blur(120px)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  glowBottomRight: {
    position: "absolute",
    bottom: "50px",
    right: "-150px",
    width: "450px",
    height: "450px",
    background: "rgba(236, 72, 153, 0.08)",
    filter: "blur(100px)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  statusOverlayBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.8)",
    backdropFilter: "blur(8px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statusOverlayCard: {
    background: "#0f172a",
    padding: "30px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 30px 70px rgba(0,0,0,0.7)",
    border: "1px solid #1e293b",
    maxWidth: "400px",
    width: "90%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px"
  },
  statusOverlayIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "bold"
  },
  statusOverlayText: {
    fontSize: "16px",
    color: "#ffffff",
    margin: 0,
    fontWeight: "700",
    lineHeight: "1.5"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 5,
    marginBottom: "30px"
  },
  headerTitleMain: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.5px"
  },
  backBtn: {
    padding: "10px 18px",
    borderRadius: "14px",
    border: "1px solid #1e293b",
    background: "#0f172a",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  helpBtn: {
    padding: "10px 18px",
    borderRadius: "14px",
    border: "1px solid #1e293b",
    background: "#0f172a",
    color: "#3b82f6",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer"
  },
  brandHeader: {
    textAlign: "center",
    marginBottom: "40px"
  },
  walletLogo: {
    width: "76px",
    height: "60px",
    borderRadius: "18px",
    margin: "0 auto 14px",
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    position: "relative",
    boxShadow: "0 12px 28px rgba(99,102,241,0.3)"
  },
  logoMoneyOne: {
    position: "absolute",
    top: "-10px",
    left: "16px",
    width: "40px",
    height: "26px",
    borderRadius: "6px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    transform: "rotate(-12deg)"
  },
  logoMoneyTwo: {
    position: "absolute",
    top: "-4px",
    left: "24px",
    width: "40px",
    height: "26px",
    borderRadius: "6px",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    transform: "rotate(10deg)"
  },
  logoCoin: {
    position: "absolute",
    right: "-8px",
    bottom: "4px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #eab308, #ca8a04)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "15px"
  },
  brandTitle: {
    margin: "0px",
    fontSize: "36px",
    fontWeight: "900",
    letterSpacing: "1.5px",
    color: "#fff"
  },
  brandSpan: {
    color: "#10b981"
  },
  brandSub: {
    fontSize: "12px",
    letterSpacing: "3px",
    color: "#475569",
    marginTop: "8px",
    fontWeight: "700"
  },
  
  // ড্যাশবোর্ড গ্রিড (যা ফুল স্ক্রিন করতে সাহায্য করবে)
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", // স্ক্রিন বড় হলে পাশাপাশি ২টি কলাম হয়ে যাবে
    gap: "24px",
    alignItems: "start",
    marginBottom: "30px"
  },
  gridColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },

  balanceCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    borderRadius: "24px",
    border: "1px solid #2e2a85",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
  },
  walletIconBox: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },
  balanceInfo: {
    flex: 1
  },
  balanceLabel: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  balanceAmount: {
    margin: "4px 0",
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff"
  },
  balanceSubtext: {
    fontSize: "12px",
    color: "#10b981"
  },
  addMoneyBtn: {
    padding: "12px 20px",
    borderRadius: "14px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(79,70,229,0.3)"
  },
  mainCard: {
    background: "#0f172a",
    borderRadius: "24px",
    border: "1px solid #1e293b",
    padding: "24px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.25)"
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px"
  },
  sectionIcon: {
    fontSize: "24px"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff"
  },
  inputLabel: {
    display: "block",
    fontWeight: "600",
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "10px"
  },
  amountInputBox: {
    height: "60px",
    borderRadius: "16px",
    border: "1px solid #1e293b",
    background: "#020617",
    display: "flex",
    alignItems: "center",
    padding: "0 18px",
    gap: "12px",
    marginBottom: "8px"
  },
  rupeeSymbol: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#10b981"
  },
  amountInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
    background: "transparent"
  },
  minBadge: {
    background: "rgba(245,158,11,0.1)",
    color: "#f59e0b",
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "12px"
  },
  errorText: {
    color: "#ef4444",
    fontSize: "12px",
    margin: "0 0 16px",
    fontWeight: "500"
  },
  durationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "14px"
  },
  durationBtn: {
    height: "50px",
    borderRadius: "14px",
    border: "1px solid #1e293b",
    background: "#020617",
    fontSize: "14px",
    fontWeight: "600",
    color: "#94a3b8",
    position: "relative",
    cursor: "pointer"
  },
  durationActive: {
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "white",
    border: "none",
    boxShadow: "0 10px 25px rgba(99,102,241,0.35)"
  },
  tickMark: {
    position: "absolute",
    top: "5px",
    right: "8px",
    fontSize: "10px",
    color: "#10b981",
    background: "#fff",
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  recommendBox: {
    marginTop: "24px",
    background: "rgba(99,102,241,0.05)",
    border: "1px dashed rgba(99,102,241,0.25)",
    borderRadius: "16px",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  starIcon: {
    fontSize: "22px"
  },
  recommendText: {
    margin: 0,
    fontSize: "12px",
    color: "#cbd5e1",
    lineHeight: "1.6"
  },
  returnCard: {
    background: "#0f172a",
    borderRadius: "24px",
    border: "1px solid #1e293b",
    padding: "24px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.25)"
  },
  returnTitle: {
    margin: "0 0 20px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  returnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "14px"
  },
  returnItem: {
    border: "1px solid #1e293b",
    borderRadius: "18px",
    padding: "20px 16px",
    background: "#020617",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  },
  returnIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    marginBottom: "14px"
  },
  returnItemTitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600"
  },
  returnItemValue: {
    margin: "8px 0 0",
    fontSize: "18px",
    fontWeight: "800"
  },
  infoNote: {
    marginTop: "20px",
    color: "#64748b",
    fontSize: "12px",
    textAlign: "center"
  },
  termsBox: {
    background: "#0f172a",
    borderRadius: "18px",
    padding: "16px 20px",
    border: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    cursor: "pointer"
  },
  checkbox: {
    width: "22px",
    height: "22px",
    borderRadius: "7px",
    border: "2px solid #6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "13px",
    fontWeight: "bold"
  },
  checkboxActive: {
    background: "#6366f1"
  },
  termsText: {
    margin: 0,
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "1.4"
  },
  termsBold: {
    color: "#6366f1"
  },
  termsDoc: {
    marginLeft: "auto",
    fontSize: "20px",
    color: "#475569"
  },
  confirmBtn: {
    width: "100%",
    height: "60px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(90deg, #6366f1, #e11d48)",
    color: "white",
    fontSize: "16px",
    fontWeight: "700",
    boxShadow: "0 12px 30px rgba(99,102,241,0.4)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },
  bottomFeatures: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", // রেসপন্সিভ ফিচার গ্রিড
    gap: "16px",
    marginTop: "40px"
  },
  featureItem: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textAlign: "left"
  },
  featureIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0
  },
  featureTitle: {
    fontSize: "14px",
    color: "#fff",
    display: "block"
  },
  featureSub: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "12px"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.85)",
    backdropFilter: "blur(8px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  termsModal: {
    width: "100%",
    maxWidth: "450px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "28px",
    padding: "30px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
  },
  modalTitle: {
    margin: "0 0 20px",
    fontSize: "22px",
    color: "#fff",
    fontWeight: "700"
  },
  termsScroll: {
    maxHeight: "300px",
    overflowY: "auto",
    lineHeight: "1.7",
    fontSize: "14px",
    color: "#94a3b8",
    paddingRight: "8px"
  },
  acceptBtn: {
    width: "100%",
    height: "52px",
    marginTop: "24px",
    border: "none",
    borderRadius: "14px",
    background: "#10b981",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 6px 22px rgba(16,185,129,0.3)"
  },
  helpModal: {
    width: "100%",
    maxWidth: "400px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "28px",
    padding: "30px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)"
  },
  modalTitleDark: {
    margin: "0 0 18px",
    fontSize: "20px",
    color: "#3b82f6",
    fontWeight: "700"
  },
  helpContentText: {
    fontSize: "14px",
    color: "#cbd5e1",
    lineHeight: "1.6",
    margin: "0 0 14px"
  },
  acceptBtnDark: {
    width: "100%",
    height: "50px",
    border: "none",
    borderRadius: "14px",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "10px"
  }
};
