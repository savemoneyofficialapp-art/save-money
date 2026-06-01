import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../config";



export default function SaveMoney() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(2000);
  const [years, setYears] = useState(1);
  const [showTerms, setShowTerms] = useState(true);
  const [riskAccepted, setRiskAccepted] =
  useState(false);

  const getRate = (y) => {
    if (Number(y) === 1) return 11;
    if (Number(y) === 3) return 14;
    return 20;
  };

  const rate = getRate(years);
  const totalInvest = Number(amount) * 12 * Number(years);
  const interest = Math.floor((totalInvest * rate) / 100);
  const totalReturn = totalInvest + interest;

  const load = async () => {
   

    const dashRes = await fetch(`${API}/dashboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({ email })
    });

    const dashData = await dashRes.json();
    setBalance(dashData.balance || dashData.wallet || 0);
  };

  useEffect(() => {
    load();
  }, []);

  const startInvestment = async () => {

if (!riskAccepted) {

  return alert(
    "Please accept investment risk disclosure first"
  );
}

    if (Number(amount) < 2000) {
      alert("Minimum ₹2000 required");
      return;
    }

    const res = await fetch(`${API}/start-invest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({
        email,
        amount: Number(amount),
        years: Number(years)
      })
    });

    const data = await res.json();

if (
  data.msg === "Token expired or invalid"
) {

  localStorage.clear();

  alert("Session expired. Please login again.");

  window.location.href = "/login";

  return;
}

    alert(data.msg);
    load();
  };

  const renewInvestment = async () => {
    const today = new Date();
    const renewStart = new Date(myPlan.nextRenewDate);
    const renewEnd = new Date(myPlan.nextRenewDate);
    renewEnd.setDate(renewEnd.getDate() + 5);

    const renewAllowed = today >= renewStart && today <= renewEnd;

    if (!renewAllowed) {
      alert("Renew is available only during your 5 days renew window");
      return;
    }

    const ok = window.confirm(
      `Wallet Balance: ₹${balance}\nRenew Amount: ₹${myPlan.monthlyAmount}\n\nConfirm Renew Payment?`
    );

    if (!ok) return;

    const res = await fetch(`${API}/renew-invest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

if (
  data.msg === "Token expired or invalid"
) {

  localStorage.clear();

  alert("Session expired. Please login again.");

  window.location.href = "/login";

  return;
}

    alert(data.msg);
    load();
  };

 

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Start Save Money Plan</h2>

      <div style={styles.balance}>Wallet Balance: ₹{balance}</div>

      <div style={styles.card}>
        <input
          style={styles.input}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monthly Amount Min ₹2000"
        />

        {Number(amount) < 2000 && (
          <p style={{ color: "red" }}>Minimum ₹2000 required</p>
        )}

        <select
          style={styles.input}
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
        >
          <option value="1">1 Year</option>
          <option value="3">3 Year</option>
          <option value="5">5 Year</option>
          <option value="10">10 Year</option>
          <option value="20">20 Year</option>
          <option value="25">25 Year</option>
        </select>

        <div style={styles.result}>
          <p>Rate: {rate}%</p>
          <p>Total Investment: ₹{totalInvest}</p>
          <p>Total Interest: ₹{interest}</p>
          <h3>Total Return: ₹{totalReturn}</h3>
        </div>

        <div style={styles.riskBox}>

  <input
    type="checkbox"
    checked={riskAccepted}
    onChange={(e)=>
      setRiskAccepted(e.target.checked)
    }
  />

  <p style={styles.riskText}>

    I understand that investments involve
    financial risks and ROI may increase
    or decrease depending on company
    performance and market conditions.

  </p>

</div>

        <button style={styles.confirm} onClick={startInvestment}>
          Confirm Payment
        </button>
      </div>

      {showTerms && (
        <div style={styles.termsOverlay}>
          <div style={styles.termsModal}>
            <h2 style={styles.termsTitle}>Terms & Conditions</h2>

            <div style={styles.termsScroll}>
              <p style={styles.term}>
                This platform operates as a private investment and systematic
                saving application designed to help users build disciplined
                monthly investment habits through the Save Money Plan.
              </p>

              <p style={styles.term}>
                The minimum monthly investment amount for the Save Money Plan is
                ₹2000. Users are required to select their preferred investment
                tenure and understand the projected return before confirming
                payment from their wallet balance.
              </p>

              <p style={styles.term}>
                This investment plan works similarly to a Systematic Investment
                Plan. The user must renew the investment after every thirty-day
                cycle within the available five-day renewal window.
              </p>

              <p style={styles.term}>
                If any investor wants to close the investment before completing
                the selected tenure, twenty percent of the total invested amount
                will be deducted as an early closing charge. The remaining
                invested amount may be returned without any interest or profit.
              </p>

              <p style={styles.term}>
                Return on investment may increase if the company performs
                profitably, and it may decrease if the company faces losses,
                operational issues, market risk, or unfavorable business
                conditions.
              </p>

              <p style={styles.term}>
                All projected returns shown inside the application are estimated
                values and may be updated depending on company performance,
                operational costs, policy changes, and future business
                conditions.
              </p>

              <p style={styles.term}>
                This is currently a private investment initiative. The long-term
                vision of the company is to expand this platform in a bigger and
                more organized way under proper legal and government-compliant
                structure in the future.
              </p>

              <p style={styles.term}>
                The company aims to fulfill all commitments with sincerity and
                transparency. However, every user understands that all
                investments are voluntary and made with full awareness of the
                associated risks.
              </p>

              <p style={styles.term}>
                KYC verification is mandatory before accessing investment,
                referral, bonus, wallet transfer, or withdrawal-related features.
                Users must provide correct and valid information during
                registration and KYC submission.
              </p>

              <p style={styles.term}>
                Any fake account creation, fraudulent activity, wrong document
                upload, referral manipulation, payment fraud, or misuse of the
                platform may lead to account suspension, wallet freeze, or
                permanent termination.
              </p>

              <p style={styles.term}>
                Wallet balances, investment records, bonus income, referral
                rewards, renewal history, and withdrawal records shown inside the
                application will be treated as official platform records.
              </p>

              <p style={styles.term}>
                The company reserves the right to update investment rules,
                renewal systems, bonus policies, payout schedules, ROI
                structure, KYC process, or platform terms whenever required for
                security, business, technical, or legal reasons.
              </p>

              <p style={styles.term}>
                By continuing with the Save Money Plan, the user confirms that
                they have read, understood, and accepted all current terms,
                conditions, policies, and future updates of the platform.
              </p>
            </div>

            <button
              style={styles.acceptBtn}
              onClick={() => setShowTerms(false)}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "white",
    padding: "20px"
  },

  title: {
    textAlign: "center",
    color: "#22c55e"
  },

  balance: {
    background: "#0f172a",
    padding: "12px",
    borderRadius: "10px",
    textAlign: "center",
    marginTop: "15px"
  },

  card: {
    background: "#1e293b",
    padding: "18px",
    borderRadius: "15px",
    marginTop: "15px"
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "none"
  },

  result: {
    background: "#020617",
    padding: "15px",
    borderRadius: "12px",
    marginTop: "15px"
  },

  riskBox:{
  display:"flex",
  gap:"10px",
  marginTop:"15px",
  alignItems:"flex-start",
  background:"#0f172a",
  padding:"12px",
  borderRadius:"12px"
},

riskText:{
  color:"#cbd5e1",
  fontSize:"12px",
  lineHeight:"20px"
},

  confirm: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "#22c55e",
    color: "white",
    fontWeight: "bold",
    marginTop: "15px"
  },

  certificate: {
    background: "linear-gradient(145deg,#1e293b,#020617)",
    padding: "22px",
    borderRadius: "22px",
    marginTop: "15px",
    border: "2px solid #22c55e",
    boxShadow: "0 0 25px rgba(34,197,94,0.25)"
  },

  line: {
    height: "2px",
    background: "#22c55e",
    margin: "12px 0"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "15px"
  },

  renewBox: {
    background: "#0f172a",
    padding: "15px",
    borderRadius: "12px",
    marginTop: "15px",
    border: "1px solid #334155"
  },

  renewBtn: {
    marginTop: "12px",
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontWeight: "bold"
  },

  downloadBtn: {
    marginTop: "15px",
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "#22c55e",
    color: "white",
    fontWeight: "bold"
  },

  historyTitle: {
    marginTop: "20px"
  },

  history: {
    background: "#1e293b",
    padding: "12px",
    borderRadius: "10px",
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  smallSlipBtn: {
    padding: "8px 10px",
    border: "none",
    borderRadius: "8px",
    background: "#f59e0b",
    color: "white",
    fontWeight: "bold"
  },

  termsOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100vh",
    background: "rgba(0,0,0,0.18)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },

  termsModal: {
    width: "90%",
    maxWidth: "430px",
    background: "linear-gradient(145deg,#1e293b,#020617)",
    borderRadius: "22px",
    padding: "22px",
    border: "2px solid #22c55e",
    boxShadow: "0 0 30px rgba(34,197,94,0.35)"
  },

  termsTitle: {
    textAlign: "center",
    color: "#22c55e",
    marginBottom: "15px"
  },

  termsScroll: {
    maxHeight: "340px",
    overflowY: "auto",
    paddingRight: "8px"
  },

  term: {
    color: "#e2e8f0",
    fontSize: "14px",
    lineHeight: "24px",
    marginBottom: "14px",
    textAlign: "left"
  },

  acceptBtn: {
    width: "100%",
    padding: "14px",
    marginTop: "18px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#020617",
    fontWeight: "bold",
    fontSize: "15px"
  }
};