import { useState } from "react";

export default function InvestmentAssistant() {
  const [amount, setAmount] = useState(2000);
  const [years, setYears] = useState(1);
  const [answer, setAnswer] = useState("");

  const getRate = (y) => {
    if (Number(y) === 1) return 11;
    if (Number(y) === 3) return 14;
    return 20;
  };

  const calculate = () => {
    const rate = getRate(years);
    const totalInvest = Number(amount) * 12 * Number(years);
    const interest = Math.floor((totalInvest * rate) / 100);
    const maturity = totalInvest + interest;

    setAnswer(
      `If you invest ₹${amount} monthly for ${years} years, your total investment will be ₹${totalInvest}. Estimated interest will be ₹${interest}, and your expected maturity amount will be ₹${maturity}.`
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>AI Investment Assistant</h2>

      <div style={styles.card}>
        <p>Monthly Investment</p>
        <input
          style={styles.input}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <p>Tenure</p>
        <select
          style={styles.input}
          value={years}
          onChange={(e) => setYears(e.target.value)}
        >
          <option value="1">1 Year</option>
          <option value="3">3 Years</option>
          <option value="5">5 Years</option>
          <option value="10">10 Years</option>
          <option value="20">20 Years</option>
          <option value="25">25 Years</option>
        </select>

        <button style={styles.btn} onClick={calculate}>
          Ask Assistant
        </button>
      </div>

      {answer && (
        <div style={styles.answer}>
          <h3>Assistant Says</h3>
          <p>{answer}</p>
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
  card: {
    background: "#1e293b",
    padding: "18px",
    borderRadius: "18px",
    marginTop: "15px"
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginTop: "8px"
  },
  btn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold",
    marginTop: "15px"
  },
  answer: {
    background: "#1e293b",
    padding: "18px",
    borderRadius: "18px",
    marginTop: "20px",
    border: "1px solid #22c55e"
  }
};