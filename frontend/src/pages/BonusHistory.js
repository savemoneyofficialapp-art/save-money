import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../config";


export default function BonusHistory() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [data, setData] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await fetch(`${API}/my-bonus-ledger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({ email })
    });

    setData(await res.json());
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Bonus History</h2>

      {data.length === 0 && <p>No bonus history</p>}

      {data.map((b, i) => (
        <div key={i} style={styles.card}>
          <div>
            <b>{b.type}</b>
            <p>{b.note}</p>
            <p>From: {b.fromName}</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h3>₹{b.amount}</h3>
            <p>{new Date(b.date).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
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
    padding: "15px",
    borderRadius: "15px",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between"
  }
};