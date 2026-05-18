import { useEffect, useState } from "react";

export default function AdminKYC() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("http://localhost:5000/all-users");
    const data = await res.json();
    setUsers(data);
  };

  const approveKYC = async (email) => {

    const res = await fetch("http://localhost:5000/approve-kyc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
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
            <img src={`http://localhost:5000/uploads/${u.aadhaarFile}`} width="80" />
          )}

          {u.panFile && (
            <img src={`http://localhost:5000/uploads/${u.panFile}`} width="80" />
          )}

          {u.photo && (
            <img src={`http://localhost:5000/uploads/${u.photo}`} width="80" />
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