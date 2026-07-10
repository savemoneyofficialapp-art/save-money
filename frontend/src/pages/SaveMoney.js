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

  // ১. পেজ লোড হলে একদম ওপর থেকে শুরু হওয়ার ফিক্স (Scroll Fix)
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
      <div style={styles.mobileFrame}>

        {/* BACKGROUND GLOWS FOR PREMIUM FEEL */}
        <div style={styles.glowTopLeft}></div>
        <div style={styles.glowBottomRight}></div>

        {/* ২. সেন্টারড সুন্দর ইনফো মেসেজ ওভারলে UI */}
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
            ←
          </button>
          <span style={styles.headerTitleMain}>Investment Plan</span>
          <button style={styles.helpBtn} onClick={() => setHelpOpen(true)}>
            ?
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
          <div style={styles.brandSub}>
            <b>PREMIUM SIP PLATFORM</b>
          </div>
        </header>

        {/* WALLET BALANCE CARD */}
        <section style={styles.balanceCard}>
          <div style={styles.walletIconBox}>
            <span>👛</span>
          </div>
          <div style={styles.balanceInfo}>
            <p style={styles.balanceLabel}>WALLET BALANCE</p>
            <h2 style={styles.balanceAmount}>{money(balance)}</h2>
            <small style={styles.balanceSubtext}>Available for Investment</small>
          </div>
          <button style={styles.addMoneyBtn} onClick={() => (window.location.href = "/wallet")}>
            <span>＋</span> Add Funds
          </button>
        </section>

        {/* SIP DETAILS MAIN CARD */}
        <section style={styles.mainCard}>
          <div style={styles.sectionHead}>
            <div style={styles.sectionIcon}>🌱</div>
            <h2 style={styles.sectionTitle}>Configure SIP Plan</h2>
          </div>

          <label style={styles.inputLabel}>Monthly SIP Amount</label>
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
            <p style={styles.errorText}>⚠️ Minimum investment amount is ₹2000</p>
          )}

          <label style={styles.inputLabel}>SIP Duration</label>
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
              <b>Expert Advice:</b> 5 Years or higher is recommended for maximum compounding returns.
            </p>
          </div>
        </section>

        {/* ESTIMATED RETURNS */}
        <section style={styles.returnCard}>
          <h3 style={styles.returnTitle}>Estimated Compounding Projection</h3>
          <div style={styles.returnGrid}>
            <ReturnItem icon="📈" title="Estimated Return" value={money(calc.estimatedReturn)} color="#10b981" bg="rgba(16,185,129,0.1)" />
            <ReturnItem icon="👛" title="Total Investment" value={money(calc.totalInvestment)} color="#3b82f6" bg="rgba(59,130,246,0.1)" />
            <ReturnItem icon="🪙" title="Total Interest" value={money(calc.totalInterest)} color="#f59e0b" bg="rgba(245,158,11,0.1)" />
            <ReturnItem icon="📊" title="Maturity Value" value={money(calc.totalReturn)} color="#a855f7" bg="rgba(168,85,247,0.1)" />
          </div>
          <div style={styles.infoNote}>
            <span>ℹ</span> Market calculations are compounding estimations.
          </div>
        </section>

        {/* TERMS AGREEMENT */}
        <section style={styles.termsBox} onClick={openTerms}>
          <div style={{ ...styles.checkbox, ...(accepted ? styles.checkboxActive : {}) }}>
            {accepted ? "✓" : ""}
          </div>
          <p style={styles.termsText}>
            I have read and agree to the <b style={styles.termsBold}>Terms & Conditions</b>
          </p>
          <div style={styles.termsDoc}>📄</div>
        </section>

        {/* MAIN PRO CONFIRM BUTTON */}
        <button style={styles.confirmBtn} onClick={confirmSip} disabled={loading}>
          <span>🛡️</span> {loading ? "Locking Deal..." : "Confirm & Launch SIP"}
        </button>

        {/* FOOTER FEATURES */}
        <section style={styles.bottomFeatures}>
          <FeatureItem icon="🔒" title="Secure Core" sub="End-to-End Vaulted" color="#3b82f6" />
          <FeatureItem icon="📈" title="High Yield" sub="Compounding Growth" color="#10b981" />
          <FeatureItem icon="⚡" title="Fluid Asset" sub="Easy Auto-Payouts" color="#a855f7" />
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

// SUB COMPONENTS
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
      <div style={{ ...styles.featureIcon, color, background: `${color}15` }}>
        {icon}
      </div>
      <b style={styles.featureTitle}>{title}</b>
      <p style={styles.featureSub}>{sub}</p>
    </div>
  );
}

// ALL HIGH QUALITY STYLES
const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
    color: "#f8fafc",
    overflowX: "hidden"
  },
  mobileFrame: {
    width: "100%",
    maxWidth: "460px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #090f24 0%, #030712 100%)",
    position: "relative",
    padding: "20px 16px 40px",
    boxSizing: "border-box",
    borderLeft: "1px solid #1e293b",
    borderRight: "1px solid #1e293b"
  },
  glowTopLeft: {
    position: "absolute",
    top: "-100px",
    left: "-100px",
    width: "300px",
    height: "300px",
    background: "rgba(99, 102, 241, 0.15)",
    filter: "blur(80px)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  glowBottomRight: {
    position: "absolute",
    bottom: "100px",
    right: "-100px",
    width: "250px",
    height: "250px",
    background: "rgba(236, 72, 153, 0.12)",
    filter: "blur(70px)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  statusOverlayBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.75)",
    backdropFilter: "blur(8px)",
    zIndex: 100000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statusOverlayCard: {
    background: "#0f172a",
    padding: "24px 30px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
    border: "1px solid #1e293b",
    maxWidth: "350px",
    width: "85%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px"
  },
  statusOverlayIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "bold"
  },
  statusOverlayText: {
    fontSize: "16px",
    color: "#ffffff",
    margin: 0,
    fontWeight: "700",
    lineHeight: "1.4"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 5,
    marginBottom: "20px"
  },
  headerTitleMain: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#94a3b8"
  },
  backBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    border: "1px solid #1e293b",
    background: "#0f172a",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  helpBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "1px solid #1e293b",
    background: "#0f172a",
    color: "#3b82f6",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer"
  },
  brandHeader: {
    textAlign: "center",
    marginBottom: "24px"
  },
  walletLogo: {
    width: "70px",
    height: "56px",
    borderRadius: "16px",
    margin: "0 auto 10px",
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    position: "relative",
    boxShadow: "0 12px 24px rgba(99,102,241,0.3)"
  },
  logoMoneyOne: {
    position: "absolute",
    top: "-10px",
    left: "14px",
    width: "36px",
    height: "24px",
    borderRadius: "6px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    transform: "rotate(-12deg)"
  },
  logoMoneyTwo: {
    position: "absolute",
    top: "-4px",
    left: "22px",
    width: "36px",
    height: "24px",
    borderRadius: "6px",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    transform: "rotate(10deg)"
  },
  logoCoin: {
    position: "absolute",
    right: "-6px",
    bottom: "4px",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #eab308, #ca8a04)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "14px"
  },
  brandTitle: {
    margin: "0px",
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "1px",
    color: "#fff"
  },
  brandSpan: {
    color: "#10b981"
  },
  brandSub: {
    fontSize: "11px",
    letterSpacing: "2px",
    color: "#64748b",
    marginTop: "4px"
  },
  balanceCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    borderRadius: "24px",
    border: "1px solid #312e81",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)"
  },
  walletIconBox: {
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px"
  },
  balanceInfo: {
    flex: 1
  },
  balanceLabel: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  balanceAmount: {
    margin: "2px 0",
    fontSize: "24px",
    fontWeight: "800",
    color: "#fff"
  },
  balanceSubtext: {
    fontSize: "11px",
    color: "#10b981"
  },
  addMoneyBtn: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#6366f1",
    color: "white",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 16px rgba(99,102,241,0.25)"
  },
  mainCard: {
    background: "#0f172a",
    borderRadius: "24px",
    border: "1px solid #1e293b",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px"
  },
  sectionIcon: {
    fontSize: "22px"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff"
  },
  inputLabel: {
    display: "block",
    fontWeight: "600",
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "8px"
  },
  amountInputBox: {
    height: "56px",
    borderRadius: "16px",
    border: "1px solid #1e293b",
    background: "#020617",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: "10px",
    marginBottom: "8px"
  },
  rupeeSymbol: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#10b981"
  },
  amountInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    background: "transparent"
  },
  minBadge: {
    background: "rgba(245,158,11,0.1)",
    color: "#f59e0b",
    padding: "6px 10px",
    borderRadius: "10px",
    fontSize: "11px"
  },
  errorText: {
    color: "#ef4444",
    fontSize: "12px",
    margin: "0 0 14px",
    fontWeight: "500"
  },
  durationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "12px"
  },
  durationBtn: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    background: "#020617",
    fontSize: "13px",
    fontWeight: "600",
    color: "#94a3b8",
    position: "relative",
    cursor: "pointer"
  },
  durationActive: {
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "white",
    border: "none",
    boxShadow: "0 8px 20px rgba(99,102,241,0.3)"
  },
  tickMark: {
    position: "absolute",
    top: "4px",
    right: "6px",
    fontSize: "10px",
    color: "#10b981",
    background: "#fff",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },
  recommendBox: {
    marginTop: "20px",
    background: "rgba(99,102,241,0.06)",
    border: "1px dashed rgba(99,102,241,0.3)",
    borderRadius: "16px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  starIcon: {
    fontSize: "20px"
  },
  recommendText: {
    margin: 0,
    fontSize: "12px",
    color: "#cbd5e1",
    lineHeight: "1.5"
  },
  returnCard: {
    background: "#0f172a",
    borderRadius: "24px",
    border: "1px solid #1e293b",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  },
  returnTitle: {
    margin: "0 0 16px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  returnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px"
  },
  returnItem: {
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "16px 12px",
    background: "#020617",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  },
  returnIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    marginBottom: "12px"
  },
  returnItemTitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600"
  },
  returnItemValue: {
    margin: "6px 0 0",
    fontSize: "16px",
    fontWeight: "800"
  },
  infoNote: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "11px",
    textAlign: "center"
  },
  termsBox: {
    background: "#0f172a",
    borderRadius: "16px",
    padding: "14px 16px",
    border: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    cursor: "pointer"
  },
  checkbox: {
    width: "20px",
    height: "20px",
    borderRadius: "6px",
    border: "2px solid #6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "12px",
    fontWeight: "bold"
  },
  checkboxActive: {
    background: "#6366f1"
  },
  termsText: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8"
  },
  termsBold: {
    color: "#6366f1"
  },
  termsDoc: {
    marginLeft: "auto",
    fontSize: "18px",
    color: "#64748b"
  },
  confirmBtn: {
    width: "100%",
    height: "56px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(90deg, #6366f1, #e11d48)",
    color: "white",
    fontSize: "16px",
    fontWeight: "700",
    boxShadow: "0 10px 25px rgba(99,102,241,0.35)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  bottomFeatures: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "24px"
  },
  featureItem: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  featureIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    marginBottom: "8px"
  },
  featureTitle: {
    fontSize: "11px",
    color: "#fff",
    display: "block"
  },
  featureSub: {
    margin: "2px 0 0",
    color: "#64748b",
    fontSize: "9px"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.8)",
    backdropFilter: "blur(6px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  termsModal: {
    width: "100%",
    maxWidth: "380px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
  },
  modalTitle: {
    margin: "0 0 16px",
    fontSize: "20px",
    color: "#fff",
    fontWeight: "700"
  },
  termsScroll: {
    maxHeight: "280px",
    overflowY: "auto",
    lineHeight: "1.6",
    fontSize: "13px",
    color: "#94a3b8",
    paddingRight: "6px"
  },
  acceptBtn: {
    width: "100%",
    height: "48px",
    marginTop: "20px",
    border: "none",
    borderRadius: "12px",
    background: "#10b981",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(16,185,129,0.25)"
  },
  helpModal: {
    width: "100%",
    maxWidth: "360px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
  },
  modalTitleDark: {
    margin: "0 0 16px",
    fontSize: "18px",
    color: "#3b82f6",
    fontWeight: "700"
  },
  helpContentText: {
    fontSize: "13px",
    color: "#cbd5e1",
    lineHeight: "1.6",
    margin: "0 0 12px"
  },
  acceptBtnDark: {
    width: "100%",
    height: "46px",
    border: "none",
    borderRadius: "12px",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "8px"
  }
};
