import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function SaveMoney() {
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(5);
  const [accepted, setAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

      setBalance(
        Number(
          data.balance ||
          data.wallet ||
          0
        )
      );
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

  const calc = useMemo(()=>{

const monthly =
Number(amount||0);

const annualRate =
Number(rate||0);

const totalYears =
Number(years||1);

const r =
annualRate/100/12;

const n =
totalYears*12;


let maturityAmount=0;
let totalInterest=0;


if(r>0){

maturityAmount=

monthly*

(

(

Math.pow(

1+r,

n

)

-1

)

/

r

)

*

(

1+r

);



totalInterest=

maturityAmount-

(

monthly*n

);

}else{

maturityAmount=
monthly*n;

totalInterest=0;

}



return{

monthly,

totalInvestment:
monthly*n,

estimatedReturn:
totalInterest,

totalInterest,

totalReturn:
maturityAmount

};


},[
amount,
years,
rate
]);
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
  };

  const confirmSip = async () => {
    if (Number(amount) < 2000) {
      return toast.info("Minimum SIP amount ₹2000 required");
    }

    if (!accepted) {
      setTermsOpen(true);
      return;
    }

    if (Number(balance) < Number(amount)) {
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
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      toast.success(data.msg || "SIP started successfully");

      if (data.success) {
        setAmount("");
        setAccepted(false);
        loadBalance();
      }
    } catch (err) {
      console.log("START SIP ERROR:", err);
      toast.info("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.mobileFrame}>

        <div style={styles.leftBgArt}>
          <div style={styles.leftArrow}>↗</div>
          <div style={styles.leftCoins}>🪙</div>
        </div>

        <div style={styles.rightBgArt}>
          <div style={styles.rupeeCircle}>₹</div>
          <div style={styles.plantStem}>🌱</div>
        </div>

        <div style={styles.topBar}>
          <button
            style={styles.backBtn}
            onClick={() => window.history.back()}
          >
            ←
          </button>

         <button
  style={styles.helpBtn}
  onClick={() => setHelpOpen(true)}
>
  ?
</button>
        </div>

        <header style={styles.brandHeader}>
          <div style={styles.walletLogo}>
            <div style={styles.logoMoneyOne}></div>
            <div style={styles.logoMoneyTwo}></div>
            <div style={styles.logoCoin}>₹</div>
          </div>

          <h1 style={styles.brandTitle}>
            SAVE <span>MONEY</span>
          </h1>

          <div style={styles.brandSub}>
            <span></span>
            <b>START SIP INVESTMENT</b>
            <span></span>
          </div>
        </header>

        <section style={styles.balanceCard}>
          <div style={styles.walletIconBox}>
            <span>👛</span>
          </div>

          <div style={styles.balanceInfo}>
            <p>WALLET BALANCE</p>
            <h2>{money(balance)}</h2>
            <small>Available Balance</small>
          </div>

          <div style={styles.balanceDivider}></div>

          <button
            style={styles.addMoneyBtn}
            onClick={() => (window.location.href = "/wallet")}
          >
            <span>＋</span>
            Add Money
          </button>
        </section>
        <section style={styles.mainCard}>
          <div style={styles.sectionHead}>
            <div style={styles.sectionIcon}>🌱</div>
            <h2>SIP DETAILS</h2>
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

            <b style={styles.minBadge}>Min ₹2000</b>
          </div>

          {Number(amount || 0) > 0 && Number(amount) < 2000 && (
            <p style={styles.errorText}>Minimum investment amount is ₹2000</p>
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

                {years === y && (
                  <span style={styles.tickMark}>✓</span>
                )}
              </button>
            ))}
          </div>

          <div style={styles.recommendBox}>
            <div style={styles.starIcon}>⭐</div>

            <p>
              <b>Recommended:</b> 5 Years is ideal for better returns & wealth growth.
            </p>
          </div>
        </section>

        <section style={styles.returnCard}>
          <h3 style={styles.returnTitle}>ESTIMATED RETURNS</h3>

          <div style={styles.returnGrid}>
            <ReturnItem
              icon="📈"
              title="Estimated Return"
              value={money(calc.estimatedReturn)}
              color="#14b86f"
              bg="#dcfce7"
            />

            <ReturnItem
              icon="👛"
              title="Total Investment"
              value={money(calc.totalInvestment)}
              color="#2563eb"
              bg="#dbeafe"
            />

            <ReturnItem
              icon="🪙"
              title="Total Interest"
              value={money(calc.totalInterest)}
              color="#f59e0b"
              bg="#fff1c2"
            />

            <ReturnItem
              icon="📊"
              title="Total Return"
              value={money(calc.totalReturn)}
              color="#7c3aed"
              bg="#ede9fe"
            />
          </div>

          <div style={styles.infoNote}>
            <span>ℹ</span>
            The above values are estimated and may vary based on market performance.
          </div>
        </section>

        <section style={styles.termsBox} onClick={openTerms}>
          <div
            style={{
              ...styles.checkbox,
              ...(accepted ? styles.checkboxActive : {})
            }}
          >
            {accepted ? "✓" : ""}
          </div>

          <p>
            I have read and agree to the <b>Terms & Conditions</b>
          </p>

          <div style={styles.termsDoc}>📄</div>
        </section>

        <button
          style={styles.confirmBtn}
          onClick={confirmSip}
          disabled={loading}
        >
          <span>🛡</span>
          {loading ? "Starting SIP..." : "Confirm & Start SIP"}
        </button>

        <section style={styles.bottomFeatures}>
          <FeatureItem
            icon="🛡"
            title="Secure & Trusted"
            sub="100% Safe Investment"
            color="#7c3aed"
          />

          <FeatureItem
            icon="🌱"
            title="Grow Your Wealth"
            sub="Start Small, Grow Big"
            color="#6d28d9"
          />

          <FeatureItem
            icon="⏱"
            title="Flexible & Easy"
            sub="Choose & Invest Easily"
            color="#7c3aed"
          />
        </section>

        {termsOpen && (
          <div style={styles.overlay}>
            <div style={styles.termsModal}>
              <h2>Terms & Conditions</h2>

              <div style={styles.termsScroll}>
                <p>
                  Save Money SIP is a disciplined monthly saving and investment plan.
                  The minimum monthly SIP investment amount is ₹2000.
                </p>

                <p>
                  User must select SIP duration and understand all estimated return
                  values before confirming the investment from wallet balance.
                </p>

                <p>
                  This SIP plan requires timely monthly renewal. If renewal is missed,
                  investment benefits, bonuses, rewards or auto-withdrawal eligibility
                  may be affected.
                </p>

                <p>
                  Returns shown inside the application are estimated values only.
                  Actual return may increase or decrease depending on company
                  performance, market condition, operational cost and policy updates.
                </p>

                <p>
                  Investment always involves financial risk. User confirms that they
                  are investing voluntarily after understanding risk, reward and
                  possible variation in ROI.
                </p>

                <p>
                  If any investor wants to close the investment before completing the
                  selected tenure, early closing charge may apply and interest or bonus
                  may not be paid.
                </p>

                <p>
                  KYC verification is mandatory for investment, referral bonus, wallet
                  transfer, reward claim, withdrawal and account security features.
                </p>

                <p>
                  Fake account creation, wrong KYC, payment fraud, referral misuse,
                  suspicious activity or policy violation may lead to account
                  suspension, wallet freeze or permanent termination.
                </p>

                <p>
                  Wallet balance, SIP records, renewal records, bonus income, transfer
                  history and withdrawal records shown inside the app will be treated
                  as official Save Money records.
                </p>

                <p>
                  Auto withdrawal will be processed every month on the 5th date only
                  if your Save Money investment is renewed on time.
                </p>

                <p>
                  The company may update SIP rules, ROI structure, renewal policy,
                  bonus policy, KYC policy or wallet rules when required for security,
                  business, technical or legal reasons.
                </p>

                <p>
                  By clicking Accept & Continue, user confirms that they have read,
                  understood and accepted all current terms, risks, policies and future
                  updates of Save Money platform.
                </p>
              </div>

              <button style={styles.acceptBtn} onClick={acceptTerms}>
                Accept & Continue
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );

{helpOpen && (
  <div style={styles.overlay}>
    <div style={styles.helpModal}>
      <h2>Investment Assistant</h2>

      <p>
        Save Money SIP plan আপনাকে প্রতি মাসে নিয়মিত saving করতে সাহায্য করবে।
      </p>

      <p>
        Minimum monthly SIP amount হলো ₹2000। Amount লিখে duration select করলে নিচে estimated return দেখতে পাবেন।
      </p>

      <p>
        1 Year = 11%, 3 Years = 14%, 5+ Years = 20% থেকে 30% পর্যন্ত estimated return দেখানো হবে।
      </p>

      <p>
        SIP start করার আগে wallet balance থাকতে হবে এবং Terms & Conditions accept করতে হবে।
      </p>

      <button
        style={styles.acceptBtn}
        onClick={() => setHelpOpen(false)}
      >
        Okay, I Understand
      </button>
    </div>
  </div>
)}

}



function ReturnItem({ icon, title, value, color, bg }) {
  return (
    <div style={styles.returnItem}>
      <div
        style={{
          ...styles.returnIcon,
          background: bg,
          color
        }}
      >
        {icon}
      </div>

      <p>{title}</p>

      <h2 style={{ color }}>
        {value}
      </h2>
    </div>
  );
}

function FeatureItem({ icon, title, sub, color }) {
  return (
    <div style={styles.featureItem}>
      <div style={{ ...styles.featureIcon, color }}>
        {icon}
      </div>

      <div>
        <b>{title}</b>
        <p>{sub}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef3f8",
    display: "flex",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    color: "#071747"
  },

 mobileFrame: {
  width: "100%",
  maxWidth: "100%",
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#ffffff 0%,#faf5ff 100%)",
  position: "relative",
  overflow: "hidden",
  padding: "16px",
  boxSizing: "border-box"
},

  leftBgArt: {
    position: "absolute",
    left: "-28px",
    top: "172px",
    fontSize: "46px",
    opacity: 0.13,
    color: "#7c3aed",
    transform: "rotate(-12deg)"
  },

  leftArrow: {
    fontSize: "64px",
    fontWeight: "900"
  },

  leftCoins: {
    fontSize: "44px",
    marginTop: "-10px"
  },

  rightBgArt: {
    position: "absolute",
    right: "-14px",
    top: "172px",
    fontSize: "56px",
    opacity: 0.17,
    color: "#7c3aed",
    textAlign: "center"
  },

  rupeeCircle: {
    width: "78px",
    height: "78px",
    borderRadius: "50%",
    background: "rgba(124,58,237,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  plantStem: {
    marginTop: "-8px"
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 5
  },

  backBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    border: "none",
    background: "white",
    color: "#071747",
    fontSize: "28px",
    fontWeight: "900",
    boxShadow: "0 10px 22px rgba(15,23,42,.08)",
    cursor: "pointer"
  },

  helpBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "none",
    background: "white",
    color: "#071747",
    fontSize: "24px",
    fontWeight: "900",
    boxShadow: "0 10px 22px rgba(15,23,42,.08)",
    cursor: "pointer"
  },

  brandHeader: {
    textAlign: "center",
    marginTop: "-2px",
    marginBottom: "22px",
    position: "relative",
    zIndex: 4
  },

  walletLogo: {
    width: "78px",
    height: "64px",
    borderRadius: "16px",
    margin: "0 auto 7px",
    background: "linear-gradient(145deg,#5b21ff,#a21caf)",
    position: "relative",
    boxShadow: "0 14px 25px rgba(124,58,237,.27)"
  },

  logoMoneyOne: {
    position: "absolute",
    top: "-12px",
    left: "18px",
    width: "40px",
    height: "28px",
    borderRadius: "7px",
    background: "linear-gradient(135deg,#35e07a,#11b866)",
    transform: "rotate(-10deg)",
    boxShadow: "0 6px 10px rgba(0,0,0,.12)"
  },

  logoMoneyTwo: {
    position: "absolute",
    top: "-5px",
    left: "28px",
    width: "40px",
    height: "28px",
    borderRadius: "7px",
    background: "linear-gradient(135deg,#35e4c5,#0ca59e)",
    transform: "rotate(12deg)"
  },

  logoCoin: {
    position: "absolute",
    right: "-9px",
    bottom: "6px",
    width: "31px",
    height: "31px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f59e0b)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    boxShadow: "0 7px 12px rgba(245,158,11,.28)"
  },

  brandTitle: {
    margin: "4px 0 4px",
    fontSize: "31px",
    fontWeight: "900",
    letterSpacing: "1px"
  },

  brandSub: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    letterSpacing: "3.2px",
    fontSize: "12px",
    fontWeight: "900",
    color: "#111827"
  },

  balanceCard: {
    position: "relative",
    zIndex: 4,
    minHeight: "118px",
    background: "linear-gradient(135deg,#1422c9,#6827e9,#bf1fda)",
    borderRadius: "19px",
    color: "white",
    display: "grid",
    gridTemplateColumns: "58px 1fr",
    gap: "12px",
    alignItems: "center",
    padding: "16px",
    boxShadow: "0 16px 30px rgba(82,45,220,.25)",
    marginBottom: "16px",
    overflow: "hidden"
  },

  walletIconBox: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "rgba(255,255,255,.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "31px",
    boxShadow: "inset 0 0 15px rgba(255,255,255,.1)"
  },

  balanceInfo: {
    textAlign: "left"
  },

  balanceDivider: {
    display: "none"
  },

  addMoneyBtn: {
    gridColumn: "1 / 3",
    height: "50px",
    borderRadius: "15px",
    border: "none",
    background: "white",
    color: "#6d28d9",
    fontSize: "16px",
    fontWeight: "900",
    boxShadow: "0 12px 22px rgba(0,0,0,.12)",
    cursor: "pointer"
  },

  mainCard: {
    background: "rgba(255,255,255,.95)",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "16px",
    boxShadow: "0 14px 28px rgba(15,23,42,.08)",
    position: "relative",
    zIndex: 4
  },

  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px"
  },

  sectionIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#ffe4f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  inputLabel: {
    display: "block",
    fontWeight: "900",
    fontSize: "16px",
    margin: "15px 0 10px"
  },

  amountInputBox: {
    minHeight: "58px",
    borderRadius: "15px",
    border: "1px solid #d9ddea",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    gap: "8px",
    background: "#fff"
  },

  rupeeSymbol: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#071747"
  },

  amountInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "16px",
    fontWeight: "800",
    color: "#071747",
    background: "transparent",
    minWidth: 0
  },

  minBadge: {
    background: "#f3f4f6",
    padding: "7px 8px",
    borderRadius: "10px",
    fontSize: "11px",
    whiteSpace: "nowrap",
    color: "#6b7280"
  },

  errorText: {
    color: "#ef4444",
    fontWeight: "800",
    fontSize: "12px",
    marginTop: "8px"
  },

  durationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "12px"
  },

  durationBtn: {
    height: "52px",
    borderRadius: "15px",
    border: "1px solid #d9ddea",
    background: "white",
    fontSize: "15px",
    fontWeight: "900",
    color: "#071747",
    position: "relative",
    cursor: "pointer"
  },

  durationActive: {
    background: "linear-gradient(135deg,#5b21ff,#a21caf)",
    color: "white",
    border: "none",
    boxShadow: "0 10px 22px rgba(124,58,237,.25)"
  },

  tickMark: {
    position: "absolute",
    top: "6px",
    right: "8px",
    fontSize: "12px",
    background: "rgba(255,255,255,.22)",
    borderRadius: "50%",
    width: "18px",
    height: "18px"
  },

  recommendBox: {
    marginTop: "16px",
    background: "#fff0f8",
    borderRadius: "15px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#5b21ff",
    fontSize: "13px"
  },

  starIcon: {
    fontSize: "34px",
    filter: "drop-shadow(0 8px 10px rgba(245,158,11,.25))"
  },

  returnCard: {
    background: "rgba(255,255,255,.95)",
    borderRadius: "22px",
    padding: "18px",
    marginBottom: "16px",
    boxShadow: "0 14px 28px rgba(15,23,42,.08)",
    position: "relative",
    zIndex: 4
  },

  returnTitle: {
    margin: "0 0 14px",
    color: "#6d28d9",
    letterSpacing: "1px",
    fontSize: "16px",
    fontWeight: "900"
  },

  returnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "10px"
  },

  returnItem: {
    textAlign: "center",
    border: "1px solid #eef2ff",
    borderRadius: "16px",
    padding: "12px 7px",
    background: "#fff",
    minHeight: "135px",
    boxShadow: "0 7px 14px rgba(15,23,42,.035)"
  },

  returnIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    margin: "0 auto 9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px"
  },

  infoNote: {
    marginTop: "16px",
    background: "#eee8ff",
    color: "#6d28d9",
    padding: "11px",
    borderRadius: "11px",
    textAlign: "center",
    fontSize: "13px",
    lineHeight: "19px"
  },

  termsBox: {
    background: "white",
    borderRadius: "17px",
    padding: "16px",
    border: "1px dashed #f0b6d4",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    boxShadow: "0 12px 24px rgba(15,23,42,.06)",
    position: "relative",
    zIndex: 4,
    cursor: "pointer"
  },

  checkbox: {
    minWidth: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "2px solid #7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "900"
  },

  checkboxActive: {
    background: "#7c3aed"
  },

  termsDoc: {
    marginLeft: "auto",
    fontSize: "28px"
  },

  confirmBtn: {
    width: "100%",
    height: "62px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(90deg,#5b21ff,#ec168e)",
    color: "white",
    fontSize: "19px",
    fontWeight: "900",
    boxShadow: "0 16px 30px rgba(236,22,142,.22)",
    position: "relative",
    zIndex: 4,
    cursor: "pointer"
  },

 bottomFeatures: {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: "8px",
  marginTop: "15px"
},

 featureItem: {
  background: "#fff",
  borderRadius: "18px",
  padding: "10px",
  textAlign: "center",
  boxShadow: "0 8px 20px rgba(0,0,0,.05)"
},

  featureIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px"
  },

  termsModal: {
    width: "100%",
    maxWidth: "390px",
    background: "linear-gradient(145deg,#111827,#020617)",
    color: "white",
    border: "2px solid #22c55e",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 0 30px rgba(34,197,94,.35)"
  },

  termsScroll: {
    maxHeight: "360px",
    overflowY: "auto",
    lineHeight: "24px",
    fontSize: "14px",
    paddingRight: "8px",
    color: "#e5e7eb"
  },

  acceptBtn: {
    width: "100%",
    height: "52px",
    marginTop: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#22c55e",
    color: "#020617",
    fontWeight: "900",
    fontSize: "16px",
    cursor: "pointer"
  },

bottomFeatures: {
  marginTop: "14px",
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: "8px",
  position: "relative",
  zIndex: 4
},

featureItem: {
  background: "linear-gradient(135deg,#ffffff,#f7f2ff)",
  borderRadius: "14px",
  padding: "10px 6px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: "6px",
  boxShadow: "0 8px 16px rgba(15,23,42,.05)",
  border: "1px solid rgba(124,58,237,.08)",
  fontSize: "11px"
},

featureIcon: {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  background: "#ede9fe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px"
},

helpModal: {
  width: "100%",
  maxWidth: "390px",
  background: "linear-gradient(145deg,#ffffff,#f7f2ff)",
  color: "#071747",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 25px 50px rgba(0,0,0,.25)",
  lineHeight: "25px"
},

returnsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: "10px",
  marginTop: "15px"
},

sipCard: {
  width: "100%",
  background: "#fff",
  borderRadius: "24px",
  padding: "18px",
  boxSizing: "border-box",
  boxShadow: "0 10px 30px rgba(0,0,0,.05)"
},

walletCard: {
  width: "100%",
  borderRadius: "22px",
  padding: "18px",
  boxSizing: "border-box",
  background:
    "linear-gradient(135deg,#2156ff,#8b2cf5,#ff2fa8)",
  color: "#fff",
  marginBottom: "16px"
},

container: {
  width: "100%",
  minHeight: "100vh",
  background: "#f7f8fc",
  display: "flex",
  justifyContent: "center"
},

'@media (max-width: 480px)': {
  returnsGrid: {
    gridTemplateColumns: "repeat(4,1fr)"
  }
}

};
