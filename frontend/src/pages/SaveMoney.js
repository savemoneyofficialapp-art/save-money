import { useEffect, useMemo, useState } from "react";
import { API } from "../config";

export default function SaveMoney() {
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(5);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

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
      console.log("BALANCE ERROR:", err);
    }
  };

  const getRate = (y) => {
    if (Number(y) === 1) return 11;
    if (Number(y) === 3) return 14;
    return 20;
  };

  const rate = getRate(years);

  const calc = useMemo(() => {
    const monthly = Number(amount || 0);
    const totalInvestment = monthly * 12 * Number(years);
    const totalInterest = Math.floor((totalInvestment * rate) / 100);
    const totalReturn = totalInvestment + totalInterest;

    return {
      monthly,
      totalInvestment,
      totalInterest,
      totalReturn,
      estimatedReturn: totalInterest
    };
  }, [amount, years, rate]);

  const money = (n) =>
    `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const confirmSip = async () => {
    if (Number(amount) < 2000) return alert("Minimum SIP amount ₹2000 required");
    if (!accepted) return alert("Please accept Terms & Conditions");
    if (balance < Number(amount)) return alert("Insufficient wallet balance");

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
          years: Number(years)
        })
      });

      const data = await res.json();

      if (data.msg === "Token expired or invalid") {
        localStorage.clear();
        alert("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      alert(data.msg || "SIP started successfully");

      if (data.success) {
        setAmount("");
        setAccepted(false);
        loadBalance();
      }
    } catch (err) {
      console.log("START SIP ERROR:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const goWallet = () => {
    window.location.href = "/wallet";
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgLeft}>📈<br />🪙</div>
      <div style={styles.bgRight}>₹<br />🌱</div>

      <div style={styles.wrap}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => window.history.back()}>
            ←
          </button>

          <button style={styles.helpBtn}>?</button>
        </div>

        <div style={styles.brand}>
          <div style={styles.logoWallet}>
            <div style={styles.logoNotes}>💵</div>
            <div style={styles.logoCoin}>₹</div>
          </div>

          <h1>
            SAVE <span>MONEY</span>
          </h1>

          <div style={styles.subLine}>
            <span></span>
            <b>START SIP INVESTMENT</b>
            <span></span>
          </div>
        </div>

        <section style={styles.balanceCard}>
          <div style={styles.walletIcon}>👛</div>

          <div style={styles.balanceText}>
            <p>WALLET BALANCE</p>
            <h2>{money(balance)}</h2>
            <span>Available Balance</span>
          </div>

          <div style={styles.divider}></div>

          <button style={styles.addMoneyBtn} onClick={goWallet}>
            ＋ Add Money
          </button>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionTitle}>
            <div style={styles.roundIcon}>🌱</div>
            <h2>SIP DETAILS</h2>
          </div>

          <label style={styles.label}>Monthly SIP Amount</label>

          <div style={styles.amountBox}>
            <span>₹</span>
            <input
              value={amount}
              type="number"
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Amount"
            />
            <b>Min ₹2000</b>
          </div>

          {Number(amount || 0) > 0 && Number(amount) < 2000 && (
            <p style={styles.error}>Minimum investment amount is ₹2000</p>
          )}

          <label style={styles.label}>SIP Duration</label>

          <div style={styles.yearGrid}>
            {[1, 3, 5, 10, 15, 20].map((y) => (
              <button
                key={y}
                style={{
                  ...styles.yearBtn,
                  ...(years === y ? styles.yearActive : {})
                }}
                onClick={() => setYears(y)}
              >
                {y} {y === 1 ? "Year" : "Years"}
                {years === y && <span>✓</span>}
              </button>
            ))}
          </div>

          <div style={styles.recommendBox}>
            <div style={styles.star}>⭐</div>
            <p>
              <b>Recommended:</b> 5 Years is ideal for better returns & wealth growth.
            </p>
          </div>
        </section>

        <section style={styles.card}>
          <h3 style={styles.estimatedTitle}>ESTIMATED RETURNS</h3>

          <div style={styles.returnGrid}>
            <ReturnBox
              icon="📈"
              title="Estimated Return"
              value={money(calc.estimatedReturn)}
              color="#16a34a"
              bg="#dcfce7"
            />

            <ReturnBox
              icon="👛"
              title="Total Investment"
              value={money(calc.totalInvestment)}
              color="#1d4ed8"
              bg="#dbeafe"
            />

            <ReturnBox
              icon="🥧"
              title="Total Interest"
              value={money(calc.totalInterest)}
              color="#f59e0b"
              bg="#fef3c7"
            />

            <ReturnBox
              icon="📊"
              title="Total Return"
              value={money(calc.totalReturn)}
              color="#7c3aed"
              bg="#ede9fe"
            />
          </div>

          <div style={styles.note}>
            ℹ The above values are estimated and may vary based on market performance.
          </div>
        </section>

        <section style={styles.termsBox}>
          <label style={styles.checkBox}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span></span>
          </label>

          <p>
            I have read and agree to the <b>Terms & Conditions</b>
          </p>

          <div style={styles.docIcon}>📄</div>
        </section>

        <button style={styles.confirmBtn} onClick={confirmSip} disabled={loading}>
          🛡 {loading ? "Starting SIP..." : "Confirm & Start SIP"}
        </button>

        <section style={styles.bottom}>
          <Feature icon="🛡" title="Secure & Trusted" sub="100% Safe Investment" />
          <Feature icon="🌱" title="Grow Your Wealth" sub="Start Small, Grow Big" />
          <Feature icon="⏱" title="Flexible & Easy" sub="Choose & Invest Easily" />
        </section>
      </div>
    </div>
  );
}

function ReturnBox({ icon, title, value, color, bg }) {
  return (
    <div style={styles.returnBox}>
      <div style={{ ...styles.returnIcon, background: bg, color }}>{icon}</div>
      <p>{title}</p>
      <h2 style={{ color }}>{value}</h2>
    </div>
  );
}

function Feature({ icon, title, sub }) {
  return (
    <div style={styles.feature}>
      <div>{icon}</div>
      <span>
        <b>{title}</b>
        <p>{sub}</p>
      </span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#ffffff 0%,#f8f5ff 45%,#fff1f7 100%)",
    position: "relative",
    overflow: "hidden",
    padding: "26px",
    fontFamily: "Arial, sans-serif",
    color: "#070d3d"
  },

  wrap: {
    maxWidth: "1080px",
    margin: "0 auto",
    position: "relative",
    zIndex: 3
  },

  bgLeft: {
    position: "absolute",
    left: "-10px",
    top: "210px",
    fontSize: "80px",
    opacity: 0.12,
    color: "#7c3aed"
  },

  bgRight: {
    position: "absolute",
    right: "20px",
    top: "240px",
    fontSize: "85px",
    opacity: 0.16,
    color: "#7c3aed"
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  backBtn: {
    width: "58px",
    height: "58px",
    border: "none",
    borderRadius: "16px",
    background: "white",
    color: "#071747",
    fontSize: "34px",
    boxShadow: "0 12px 25px rgba(15,23,42,.08)",
    cursor: "pointer"
  },

  helpBtn: {
    width: "58px",
    height: "58px",
    border: "none",
    borderRadius: "50%",
    background: "white",
    color: "#071747",
    fontSize: "30px",
    fontWeight: "900",
    boxShadow: "0 12px 25px rgba(15,23,42,.08)"
  },

  brand: {
    textAlign: "center",
    marginTop: "-25px",
    marginBottom: "35px"
  },

  logoWallet: {
    width: "115px",
    height: "96px",
    borderRadius: "18px",
    background: "linear-gradient(145deg,#5b21ff,#b92cff)",
    margin: "0 auto -5px",
    position: "relative",
    boxShadow: "0 18px 30px rgba(124,58,237,.25)"
  },

  logoNotes: {
    position: "absolute",
    top: "-18px",
    left: "28px",
    fontSize: "38px"
  },

  logoCoin: {
    position: "absolute",
    right: "-12px",
    bottom: "8px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#f59e0b",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  subLine: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    letterSpacing: "5px",
    fontSize: "20px"
  },

  balanceCard: {
    width: "78%",
    margin: "0 auto 30px",
    minHeight: "170px",
    background: "linear-gradient(135deg,#1422c9,#6e23ea,#c221d9)",
    borderRadius: "24px",
    color: "white",
    display: "grid",
    gridTemplateColumns: "115px 1fr 2px 250px",
    alignItems: "center",
    gap: "26px",
    padding: "32px",
    boxShadow: "0 20px 40px rgba(82,45,220,.28)"
  },

  walletIcon: {
    width: "110px",
    height: "110px",
    borderRadius: "24px",
    background: "rgba(255,255,255,.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "55px"
  },

  balanceText: {
    textAlign: "left"
  },

  divider: {
    height: "115px",
    background: "rgba(255,255,255,.24)"
  },

  addMoneyBtn: {
    height: "70px",
    borderRadius: "18px",
    border: "none",
    background: "white",
    color: "#6d28d9",
    fontSize: "22px",
    fontWeight: "900",
    boxShadow: "0 14px 25px rgba(0,0,0,.12)"
  },

  card: {
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    marginBottom: "24px",
    boxShadow: "0 15px 35px rgba(15,23,42,.08)"
  },

  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "26px"
  },

  roundIcon: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    background: "#ffe4f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px"
  },

  label: {
    display: "block",
    fontWeight: "900",
    fontSize: "20px",
    margin: "20px 0 12px"
  },

  amountBox: {
    height: "78px",
    borderRadius: "16px",
    border: "1px solid #d9ddea",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: "18px"
  },

  error: {
    color: "#ef4444",
    fontWeight: "800"
  },

  yearGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6,1fr)",
    gap: "20px"
  },

  yearBtn: {
    height: "64px",
    borderRadius: "14px",
    border: "1px solid #d9ddea",
    background: "white",
    fontSize: "17px",
    fontWeight: "800",
    color: "#071747",
    position: "relative"
  },

  yearActive: {
    background: "linear-gradient(135deg,#5b21ff,#a21caf)",
    color: "white",
    border: "none",
    boxShadow: "0 10px 25px rgba(124,58,237,.25)"
  },

  recommendBox: {
    marginTop: "28px",
    background: "#fff0f8",
    borderRadius: "16px",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    color: "#5b21ff"
  },

  star: {
    fontSize: "48px",
    filter: "drop-shadow(0 8px 10px rgba(245,158,11,.25))"
  },

  estimatedTitle: {
    color: "#6d28d9",
    letterSpacing: "1px"
  },

  returnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    marginTop: "28px"
  },

  returnBox: {
    textAlign: "center",
    borderRight: "1px solid #e5e7eb",
    padding: "10px"
  },

  returnIcon: {
    width: "78px",
    height: "78px",
    borderRadius: "50%",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px"
  },

  note: {
    marginTop: "26px",
    background: "#eee8ff",
    color: "#6d28d9",
    padding: "14px",
    borderRadius: "12px",
    textAlign: "center",
    fontSize: "17px"
  },

  termsBox: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    border: "1px dashed #f0b6d4",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
    boxShadow: "0 12px 25px rgba(15,23,42,.06)"
  },

  checkBox: {
    width: "36px",
    height: "36px"
  },

  docIcon: {
    marginLeft: "auto",
    fontSize: "42px"
  },

  confirmBtn: {
    width: "100%",
    height: "78px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(90deg,#5b21ff,#ec168e)",
    color: "white",
    fontSize: "28px",
    fontWeight: "900",
    boxShadow: "0 18px 35px rgba(236,22,142,.22)"
  },

  bottom: {
    marginTop: "28px",
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "20px"
  },

  feature: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    justifyContent: "center"
  }
};