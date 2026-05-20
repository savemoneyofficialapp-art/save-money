import { useEffect, useState } from "react";
import { fetchWithAuth }
from "../utils/fetchWithAuth";
import axios from "axios";

"https://save-money-yyv1.onrender.com";


export default function Admin() {

  const [data, setData] = useState([]);

  const load = async () => {
    const res = await fetchWithAuth(`${API}/admin/transactions`);
    const d = await res.json();

if (
  data.msg === "Token expired or invalid"
) {

  localStorage.clear();

  alert("Session expired. Please login again.");

  window.location.href = "/login";

  return;
}

    setData(d);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    await fetchWithAuth(`${API}/admin/approve`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id })
    });

    load();
  };

  return (
    <div style={{padding:20}}>

      <h2>Admin Panel</h2>

      {data.map((t) => (
        <div key={t._id} style={{
          background:"#1e293b",
          marginTop:10,
          padding:10,
          color:"white"
        }}>
          <p>Email: {t.email}</p>
          <p>Amount: ₹{t.amount}</p>
          <p>Status: {t.status}</p>
          <p>Type: {t.type}</p>

{t.screenshot && (
  <img
    src={`${API}/uploads/${t.screenshot}`}
    alt="payment"
    style={{ width: "200px", marginTop: "10px" }}
  />
)}

{t.status === "Pending" && (
  <button onClick={() => approve(t._id)}>
    Approve
  </button>
)}
        </div>
      ))}

    </div>
  );
}