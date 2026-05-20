import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://save-money-yyv1.onrender.com";
export default function AdminKYC() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`${API}/all-users`);
    const data = await res.json();

if (
  data.msg === "Token expired or invalid"
) {

  localStorage.clear();

  alert("Session expired. Please login again.");

  window.location.href = "/login";

  return;
}

    setUsers(data);
  };

  const approveKYC = async (email) => {

    const res = await fetch(`${API}/approve-kyc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
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

    fetchUsers(); // refresh list
  };

  return (
    <div style={{padding:"20px", background:"#020617", minHeight:"100vh", color:"white"}}>

      <h2>Admin KYC Panel</h2>

      {users.map((u, i) => (
        <div key={i} style={{
          background:"#1e293b",
          padding:"15px",
          marginTop:"10px",
          borderRadius:"10px"
        }}>

          <p><b>{u.name}</b></p>
          <p>{u.email}</p>

          <p>
            Status:{" "}
            {u.kycStatus === "approved"
              ? <span style={{color:"green"}}>Approved</span>
              : <span style={{color:"orange"}}>Pending</span>}
          </p>

          {/* FILE PREVIEW */}
          {u.aadhaarFile && (
            <img src={`${API}/uploads/${u.aadhaarFile}`} width="80" />
          )}

          {u.panFile && (
            <img src={`${API}/uploads/${u.panFile}`} width="80" />
          )}

          {u.photo && (
            <img src={`${API}/uploads/${u.photo}`} width="80" />
          )}

          {/* APPROVE BUTTON */}
          {u.kycStatus !== "approved" && (
            <button
              onClick={()=>approveKYC(u.email)}
              style={{
                marginTop:"10px",
                padding:"10px",
                background:"#22c55e",
                border:"none",
                borderRadius:"8px"
              }}
            >
              Approve KYC
            </button>
          )}

        </div>
      ))}

    </div>
  );
}