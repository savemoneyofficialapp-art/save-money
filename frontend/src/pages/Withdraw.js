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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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
        setWalletBalance(data.walletBalance || 0);
        setWithdrawableBalance(data.withdrawableBalance || 0);
        setBank(data.bank || null);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.log("WITHDRAW INFO ERROR:", err);
    }
  };

  const submitWithdraw = async () => {
    if (Number(amount) < 100) {
      toast.info("Minimum withdraw amount is ₹100");
      return;
    }

    if (Number(amount) > withdrawableBalance) {
      toast.info("You can withdraw only 80% of wallet balance");
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

      alert(data.msg);

      if (data.success) {
        setAmount("");
        loadInfo();
      }
    } catch (err) {
      toast.warning("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>

      <div style={styles.header}>
        <h1>Withdraw Money</h1>
        <p>Withdraw up to 80% of your wallet balance</p>
      </div>

      <section style={styles.balanceGrid}>
        <div style={styles.balanceCard}>
          <span>💰</span>
          <p>Wallet Balance</p>
          <h2>{money(walletBalance)}</h2>
        </div>

        <div style={styles.balanceCard2}>
          <span>⚡</span>
          <p>Withdrawable Balance</p>
          <h2>{money(withdrawableBalance)}</h2>
          <small>80% of wallet balance</small>
        </div>
      </section>

      <section style={styles.formCard}>
        <h2>Request Withdraw</h2>

        <input
          style={styles.input}
          type="number"
          placeholder="Enter withdraw amount minimum ₹100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button style={styles.submitBtn} onClick={submitWithdraw} disabled={loading}>
          {loading ? "Submitting..." : "Submit Withdraw Request"}
        </button>

        <div style={styles.note}>
          ⓘ After request, status will be Pending. Admin will approve or reject your withdraw.
        </div>
      </section>

      <section style={styles.bankCard}>
        <h2>🏦 Your Bank Details</h2>

        {!bank ? (
          <div>
            <p>No bank details found.</p>
            <button style={styles.bankBtn} onClick={() => navigate("/bank-details")}>
              Add Bank Details
            </button>
          </div>
        ) : (
          <div style={styles.bankInfo}>
            <p><b>Name:</b> {bank.accountHolderName}</p>
            <p><b>Mobile:</b> {bank.mobile}</p>
            <p><b>Bank:</b> {bank.bankName}</p>
            <p><b>Account:</b> {bank.accountNumber}</p>
            <p><b>IFSC:</b> {bank.ifscCode}</p>
            <p><b>UPI:</b> {bank.upiId || "N/A"}</p>
          </div>
        )}
      </section>

      <section style={styles.historyCard}>
        <h2>Withdraw History</h2>

        {history.length === 0 ? (
          <p style={styles.empty}>No withdraw history found</p>
        ) : (
          history.map((x) => (
            <div key={x._id} style={styles.historyItem}>
              <div>
                <b>{money(x.amount)}</b>
                <p>{new Date(x.createdAt).toLocaleString("en-IN")}</p>
                {x.rejectReason && <small>{x.rejectReason}</small>}
              </div>

              <span
                style={{
                  ...styles.status,
                  background:
                    x.status === "Success"
                      ? "#dcfce7"
                      : x.status === "Rejected"
                      ? "#ffe4e6"
                      : "#fef9c3",
                  color:
                    x.status === "Success"
                      ? "#16a34a"
                      : x.status === "Rejected"
                      ? "#e11d48"
                      : "#ca8a04"
                }}
              >
                {x.status}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 24,
    color: "#fff",
    fontFamily: "Arial",
    background:
      "radial-gradient(circle at top left,#7c3aed55,transparent 30%),radial-gradient(circle at top right,#06b6d455,transparent 30%),linear-gradient(180deg,#020617,#07112d)"
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    border: "1px solid #8b5cf6",
    background: "rgba(15,23,42,.8)",
    color: "#fff",
    fontSize: 34
  },
  header: {
    textAlign: "center",
    marginBottom: 25
  },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
    maxWidth: 900,
    margin: "0 auto 22px"
  },
  balanceCard: {
    padding: 26,
    borderRadius: 24,
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    boxShadow: "0 20px 35px rgba(124,58,237,.28)"
  },
  balanceCard2: {
    padding: 26,
    borderRadius: 24,
    background: "linear-gradient(135deg,#06b6d4,#2563eb)",
    boxShadow: "0 20px 35px rgba(6,182,212,.25)"
  },
  formCard: {
    maxWidth: 900,
    margin: "0 auto 22px",
    padding: 26,
    borderRadius: 24,
    background: "rgba(15,23,42,.85)",
    border: "1px solid rgba(148,163,184,.22)"
  },
  input: {
    width: "100%",
    height: 62,
    borderRadius: 16,
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff",
    fontSize: 18,
    padding: "0 18px",
    boxSizing: "border-box"
  },
  submitBtn: {
    marginTop: 16,
    width: "100%",
    height: 62,
    border: "none",
    borderRadius: 16,
    background: "linear-gradient(90deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 18
  },
  note: {
    marginTop: 14,
    color: "#cbd5e1"
  },
  bankCard: {
    maxWidth: 900,
    margin: "0 auto 22px",
    padding: 26,
    borderRadius: 24,
    background: "linear-gradient(135deg,rgba(124,58,237,.25),rgba(236,72,153,.18))",
    border: "1px solid rgba(168,85,247,.45)"
  },
  bankInfo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10
  },
  bankBtn: {
    padding: "14px 24px",
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
    color: "#fff",
    fontWeight: 900
  },
  historyCard: {
    maxWidth: 900,
    margin: "0 auto",
    padding: 26,
    borderRadius: 24,
    background: "rgba(15,23,42,.85)",
    border: "1px solid rgba(148,163,184,.22)"
  },
  historyItem: {
    padding: 16,
    borderRadius: 16,
    background: "#020617",
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  status: {
    padding: "9px 16px",
    borderRadius: 20,
    fontWeight: 900
  },
  empty: {
    color: "#94a3b8"
  }
};