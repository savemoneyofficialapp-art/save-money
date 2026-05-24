import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { API } from "../config";



export default function Wallet() {
  const navigate = useNavigate();

const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [showCash, setShowCash] = useState(false);

  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");

  const [cashAmount, setCashAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const handleSession = (d) => {
    if (
      d?.msg === "Token expired or invalid" ||
      d?.msg === "No token" ||
      d?.msg === "Invalid token"
    ) {
      localStorage.clear();
      alert("Session expired. Please login again.");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  const loadWallet = async () => {
  try {
    const api = process.env.REACT_APP_API;

    if (!api) {
      throw new Error("REACT_APP_API missing");
    }

    const res = await fetch(`${api}/wallet-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.msg || "API failed");
    }

    if (data.msg) {
      throw new Error(data.msg);
    }

    setData(data);

  } catch (err) {
    console.log("Wallet load error:", err);
    alert("Wallet error: " + err.message);
  }
};


  const copyAddress = () => {
    navigator.clipboard.writeText("TRX89SHSHD7SHS7SHS7");
    toast.success("Wallet Address Copied");
  };

  const addCash = async () => {
    try {
      if (!cashAmount || !utr) {
        toast.error("Amount and UTR required");
        return;
      }

      const formData = new FormData();

      formData.append("email", email);
      formData.append("amount", cashAmount);
      formData.append("utr", utr);

      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const res = await fetchWithAuth(`${API}/add-cash`, {
        method: "POST",
        body: formData
      });

      if (!res) return;

      const d = await res.json();

      if (handleSession(d)) return;

      toast.info(d.msg);

      setShowCash(false);
      setCashAmount("");
      setUtr("");
      setScreenshot(null);

      load();
    } catch (err) {
      console.log(err);
      toast.error("Add cash failed");
    }
  };

  const transfer = async () => {
    try {
      if (!walletId || !amount) {
        toast.error("Wallet ID and amount required");
        return;
      }

      const res = await fetchWithAuth(`${API}/wallet-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          senderEmail: email,
          walletId,
          amount: Number(amount)
        })
      });

      if (!res) return;

      const d = await res.json();

      if (handleSession(d)) return;

      toast.info(d.msg);

      setWalletId("");
      setAmount("");

      load();
    } catch (err) {
      console.log(err);
      toast.error("Transfer failed");
    }
  };

  if (error) {
    return (
      <div style={styles.loading}>
        <div style={styles.errorBox}>
          <h3>{error}</h3>
          <button style={styles.mainBtn} onClick={load}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.loading}>
        Loading Wallet...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <div style={styles.topCard}>
        <p style={{ opacity: 0.8 }}>Wallet ID</p>
        <h3>{data.walletId || "Not Available"}</h3>
        <h1>₹ {data.wallet || 0}</h1>
      </div>

      <div style={styles.btnRow}>
        <button
          style={styles.addBtn}
          onClick={() => setShowCash(true)}
        >
          Add Cash
        </button>

        <button style={styles.transferBtn}>
          Withdraw
        </button>
      </div>

      <div style={styles.notice}>
        <h2 style={{ marginBottom: "10px" }}>
          Auto Withdrawal System
        </h2>

        <p>
          Every month auto withdrawal will be processed on the 5th date if your Save Money investment is renewed on time.
        </p>
      </div>

      <div style={styles.grid}>
        <div style={styles.incomeCard}>
          <p>Referral</p>
          <h3>₹{data.referralIncome || 0}</h3>
        </div>

        <div style={styles.incomeCard}>
          <p>Performance</p>
          <h3>₹{data.performanceIncome || 0}</h3>
        </div>

        <div style={styles.incomeCard}>
          <p>Team</p>
          <h3>₹{data.teamIncome || 0}</h3>
        </div>

        <div style={styles.incomeCard}>
          <p>Royalty</p>
          <h3>₹{data.royaltyIncome || 0}</h3>
        </div>
      </div>

      <div style={styles.card}>
        <h3>Wallet Transfer</h3>

        <input
          style={styles.input}
          placeholder="Receiver Wallet ID"
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button style={styles.mainBtn} onClick={transfer}>
          Transfer
        </button>

        <button
          style={styles.bonusBtn}
          onClick={() => navigate("/bonus-history")}
        >
          Bonus History
        </button>
      </div>

      <h3 style={{ marginTop: "20px" }}>
        Wallet History
      </h3>

      {(data.history || []).map((h, i) => (
        <div key={i} style={styles.history}>
          <div>
            <b>{h.type}</b>
            <p style={{ opacity: 0.7 }}>{h.note}</p>
          </div>

          <div>
            <b>₹{h.amount}</b>
            <p style={{ opacity: 0.7 }}>
              {new Date(h.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}

      {showCash && (
        <div style={styles.popupBg}>
          <div style={styles.popup}>
            <h2>Add Cash</h2>

            <div style={styles.addressBox}>
              <p>USDT Wallet Address</p>

              <h4>TRX89SHSHD7SHS7SHS7</h4>

              <button
                style={styles.copyBtn}
                onClick={copyAddress}
              >
                Copy Address
              </button>
            </div>

            <input
              style={styles.input}
              placeholder="Amount"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="UTR Number"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
            />

            <input
              type="file"
              style={styles.input}
              onChange={(e) => setScreenshot(e.target.files[0])}
            />

            <button
              style={styles.mainBtn}
              onClick={addCash}
            >
              Submit Request
            </button>

            <button
              style={styles.closeBtn}
              onClick={() => setShowCash(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  loading: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  errorBox: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "16px",
    textAlign: "center"
  },

  notice: {
    background: "linear-gradient(135deg,#3b82f6,#2563eb)",
    padding: "18px",
    borderRadius: "15px",
    marginTop: "15px",
    color: "white",
    boxShadow: "0 0 15px rgba(0,0,0,0.3)",
    textAlign: "center"
  },

  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    padding: "20px",
    color: "white"
  },

  topCard: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    borderRadius: "20px",
    padding: "25px",
    textAlign: "center",
    color: "#020617",
    boxShadow: "0 0 20px rgba(0,0,0,0.4)"
  },

  btnRow: {
    display: "flex",
    gap: "10px",
    marginTop: "15px"
  },

  addBtn: {
    flex: 1,
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold"
  },

  transferBtn: {
    flex: 1,
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "#f59e0b",
    color: "white",
    fontWeight: "bold"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "15px"
  },

  incomeCard: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "15px",
    textAlign: "center"
  },

  card: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "15px",
    marginTop: "15px"
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginTop: "10px"
  },

  mainBtn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    background: "#22c55e",
    color: "white",
    fontWeight: "bold",
    marginTop: "12px"
  },

  bonusBtn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    background: "#8b5cf6",
    color: "white",
    fontWeight: "bold",
    marginTop: "12px"
  },

  history: {
    background: "#1e293b",
    padding: "12px",
    borderRadius: "12px",
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between"
  },

  popupBg: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  popup: {
    background: "#0f172a",
    padding: "20px",
    borderRadius: "20px",
    width: "90%",
    maxWidth: "400px"
  },

  addressBox: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
    marginTop: "10px"
  },

  copyBtn: {
    marginTop: "10px",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    background: "#3b82f6",
    color: "white"
  },

  closeBtn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "white",
    marginTop: "10px"
  }
};