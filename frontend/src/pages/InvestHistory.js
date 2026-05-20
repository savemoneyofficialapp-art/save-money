import { useEffect, useState } from "react";
import axios from "axios";
const API = "https://save-money-yyv1.onrender.com";
export default function InvestHistory() {

  const email = localStorage.getItem("email");
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${API}/my-investments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    })
    .then(res => res.json())
    // eslint-disable-next-line.then(setData);
  }, []);

  return (
    <div style={{ padding: 20, color: "white" }}>

      <h2>My Investments</h2>

      {data.map((d, i) => (
        <div key={i}>
          <p>Amount: ₹ {d.amount}</p>
          <p>Years: {d.years}</p>
          <p>Total: ₹ {d.total}</p>
          <hr />
        </div>
      ))}

    </div>
  );
}