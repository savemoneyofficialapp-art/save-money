import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { API } from "../config";



export default function AdminDashboard() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState(null);
  const [kyc, setKyc] = useState([]);
  const [cash, setCash] = useState([]);
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { msg: text || "Invalid server response" };
    }
  };

  const checkAuthError = (d) => {
    if (
      d?.msg === "Token expired or invalid" ||
      d?.msg === "No token" ||
      d?.msg === "Invalid token" ||
      d?.msg === "Admin access only" ||
      d?.msg === "Admin only"
    ) {
      localStorage.clear();
      toast.alert(d.msg + ". Please login again.");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  const apiGet = async (path) => {
    const res = await fetch(`${API}${path}`, {
      headers: {
        authorization: token || ""
      }
    });

    const d = await safeJson(res);
    if (checkAuthError(d)) return null;
    return d;
  };

  const apiPost = async (path, body) => {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token || ""
      },
      body: JSON.stringify(body)
    });

    const d = await safeJson(res);
    if (checkAuthError(d)) return null;
    return d;
  };

  const load = async () => {
    try {
      setError("");

      const ad = await apiGet("/admin-analytics");
      if (!ad) return;

      if (ad.msg) {
        setError(ad.msg);
        setData({});
        return;
      }

      setData(ad);

      const kData = await apiGet("/pending-kyc");
      setKyc(Array.isArray(kData) ? kData : []);

const cData = await apiGet("/cash-requests");
setCash(Array.isArray(cData) ? cData : []);

      const uData = await apiGet("/all-users");
      setUsers(Array.isArray(uData) ? uData : []);
    } catch (err) {
      console.log("ADMIN LOAD ERROR:", err);
      setError("Backend API not connected. Check Render URL / CORS / token.");
      setData({});
    }
  };

  const approveDeposit = async (id) => {
  const d = await apiPost("/admin/approve-deposit", { id });

  alert(d?.msg || "Approved");
  load();
};

const rejectDeposit = async (id) => {
  const reason = prompt("Reject reason লিখুন");

  const d = await apiPost("/admin/reject-deposit", {
    id,
    reason: reason || "Rejected by admin"
  });

  alert(d?.msg || "Rejected");
  load();
};

  const approveKYC = async (id) => {
  const d = await apiPost("/approve-kyc", { userId: id });

  if (!d) return;

  toast.success(d.msg || "KYC Approved");

  setKyc((prev) => prev.filter((u) => u._id !== id));

  load();
};

const rejectKYC = async (id) => {
  const reason = prompt("Why are you rejecting this KYC?");

  if (!reason) {
    alert("Reject reason required");
    return;
  }

  const res = await fetch(`${API}/reject-kyc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token
    },
    body: JSON.stringify({
      userId: id,
      reason
    })
  });

  const data = await res.json();

  alert(data.msg);

  setKyc((prev) => prev.filter((u) => u._id !== id));
  load();
};

const fileUrl = (file) => {

  if (!file) return "#";

  if (file.startsWith("http")) {
    return file;
  }

  return `${API}/uploads/${file}`;
};

 const approveCash = async (id) => {
  const res = await apiPost("/approve-cash", {
    requestId: id,
  });

  if (res?.success) {
    alert("Cash request approved");
    load(); 
  } else {
    alert(res?.msg || "Approve failed");
  }
};

const rejectCash = async (id) => {
  const res = await apiPost("/reject-cash", {
    requestId: id,
  });

  if (res?.success) {
    load(); 
  } else {
    alert(res?.msg || "Reject failed");
  }
};

  const banUser = async (id) => {
    const d = await apiPost("/ban-user", { userId: id });
    if (!d) return;
    toast.info(d.msg || "Done");
    load();
  };

  const broadcast = async () => {
    if (!title || !message) {
      toast.info("Title and message required");
      return;
    }

    const d = await apiPost("/broadcast", { title, message });
    if (!d) return;

    toast.success(d.msg || "Broadcast Sent");
    setTitle("");
    setMessage("");
  };

   if (!data) {
  return (
    <div style={styles.loadingPage}>
      <div style={styles.loaderCard}>
        <h1 style={styles.loaderLogo}>Save Money</h1>
        <div style={styles.spinner}></div>
        <h2>Loading Admin Dashboard</h2>
        <p>Please wait, fetching live admin data...</p>
      </div>
    </div>
  );
}

  const chartData = [
    { name: "Users", value: data.totalUsers || 0 },
    { name: "KYC", value: data.kycApproved || 0 },
    { name: "Plans", value: data.activePlans || 0 }
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.quick}>
        <button style={styles.green} onClick={() => window.location.href = "/admin-analytics"}>
          Advanced Analytics
        </button>

        <button style={styles.green} onClick={() => window.location.href = "/admin-user-control"}>
          User Control
        </button>

        <button style={styles.green} onClick={() => window.location.href = "/admin-support"}>
          Support Tickets
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2>{data.totalUsers || 0}</h2>
          <p>Total Users</p>
        </div>

        <div style={styles.card}>
          <h2>{data.todayUsers || 0}</h2>
          <p>Today Users</p>
        </div>

        <div style={styles.card}>
          <h2>₹{data.totalInvestment || 0}</h2>
          <p>Total Investment</p>
        </div>

        <div style={styles.card}>
          <h2>₹{data.totalWallet || 0}</h2>
          <p>Total Wallet</p>
        </div>

        <div style={styles.card}>
          <h2>{data.kycApproved || 0}</h2>
          <p>KYC Approved</p>
        </div>

        <div style={styles.card}>
          <h2>{data.pendingCash || 0}</h2>
          <p>Cash Requests</p>
        </div>
      </div>

      <div style={styles.chartBox}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.section}>
        <h2>Broadcast Message</h2>

        <input
          style={styles.input}
          placeholder="Notification Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          style={styles.input}
          placeholder="Write Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button style={styles.greenFull} onClick={broadcast}>
          Send To All Users
        </button>
      </div>

      <div style={styles.section}>
        <h2>Pending KYC</h2>

       {kyc.length === 0 && (
  <p style={{ color: "white" }}>No pending KYC</p>
)}

{kyc.map((u) => (
  <div key={u._id} style={styles.kycCard}>

    <div>
      <h3 style={{ color: "white" }}>{u.name}</h3>

      <p style={{ color: "#cbd5e1" }}>
        {u.email}
      </p>

      <p style={{ color: "#94a3b8" }}>
        Mobile: {u.mobile}
      </p>
    </div>

    <div style={styles.docGrid}>

      {u.aadhaarFile && (
  <a
    href={fileUrl(u.aadhaarFile)}
    target="_blank"
    rel="noreferrer"
    style={styles.docBtn}
  >
    View Aadhaar
  </a>
)}

{u.panFile && (
  <a
    href={fileUrl(u.panFile)}
    target="_blank"
    rel="noreferrer"
    style={styles.docBtn}
  >
    View PAN
  </a>
)}

{u.photo && (
  <a
    href={fileUrl(u.photo)}  
    target="_blank"
    rel="noreferrer"
    style={styles.docBtn}
  >
    View Photo
  </a>
)}

    </div>

    <button
      style={styles.greenFull}
      onClick={() => approveKYC(u._id)}
    >
      Approve KYC
    </button>

    <button
  style={styles.redFull}
  onClick={() => rejectKYC(u._id)}
>
  Reject KYC
</button>

  </div>
))}

<section className="admin-card">
  <h2>Cash Requests</h2>

  {cash.length === 0 ? (
    <p>No cash requests</p>
  ) : (
    <div className="cash-table-wrap">
      <table className="cash-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Amount</th>
            <th>Transaction ID</th>
            <th>Screenshot</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {cash.map((r) => (
            <tr key={r._id}>
              <td>{r.email}</td>
              <td>₹{Number(r.amount || 0).toLocaleString("en-IN")}</td>
              <td>{r.txnId || r.transactionId || "N/A"}</td>
              <td>
                <button
                  className="view-btn"
                  onClick={() =>
                    window.open(
                      r.screenshot || r.screenshotUrl || r.image || r.photo,
                      "_blank"
                    )
                  }
                >
                  View
                </button>
              </td>

              <td>
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleString("en-IN")
                  : "N/A"}
              </td>

              <td>
                <span className={`status ${r.status || "pending"}`}>
                  {r.status || "pending"}
                </span>
              </td>

              <td className="action-cell">
               
<button onClick={() => approveCash(r._id)}>Approve</button>
<button onClick={() => rejectCash(r._id)}>Reject</button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
     
        
      </div>

      <div style={styles.section}>
        <h2>All Users</h2>

        {users.length === 0 && <p>No users found</p>}

        {users.map((u) => (
          <div key={u._id} style={styles.row}>
            <div>
              <b>{u.name}</b>
              <p>{u.email}</p>
              <p>Role: {u.role}</p>
            </div>

            <button style={styles.red} onClick={() => banUser(u._id)}>
              Ban
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  loading: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "20px"
  },

  container: {
    minHeight: "100vh",
    background: "#020617",
    padding: "20px",
    color: "white"
  },

  title: {
    textAlign: "center",
    color: "#22c55e"
  },

  error: {
    background: "#7f1d1d",
    padding: "12px",
    borderRadius: "12px",
    marginTop: "12px"
  },

  quick: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "15px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "20px"
  },

  card: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "15px",
    textAlign: "center"
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginTop: "10px"
  },

  chartBox: {
    background: "#1e293b",
    marginTop: "20px",
    padding: "15px",
    borderRadius: "15px"
  },

  section: {
    background: "#1e293b",
    marginTop: "20px",
    padding: "15px",
    borderRadius: "15px"
  },

  row: {
    background: "#0f172a",
    marginTop: "10px",
    padding: "12px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  green: {
    background: "#22c55e",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    color: "#020617",
    fontWeight: "bold"
  },

  greenFull: {
    width: "100%",
    background: "#22c55e",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    color: "#020617",
    fontWeight: "bold",
    marginTop: "12px"
  },

redFull: {
    width: "100%",
    background: "#cb0d03",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    color: "#020617",
    fontWeight: "bold",
    marginTop: "12px"
  },

  red: {
    background: "#ef4444",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    color: "white"
  },

  kycCard: {
  background: "#0f172a",
  marginTop: "12px",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid #334155"
},

docGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "8px",
  marginTop: "12px"
},

docBtn: {
  background: "#2563eb",
  color: "white",
  padding: "10px",
  borderRadius: "10px",
  textAlign: "center",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: "bold"
},

loadingPage: {
  minHeight: "100vh",
  background: "linear-gradient(135deg,#020617,#0f172a)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white"
},

loaderCard: {
  background: "#1e293b",
  padding: "30px",
  borderRadius: "24px",
  textAlign: "center",
  border: "1px solid #334155",
  boxShadow: "0 0 30px rgba(34,197,94,0.25)"
},

spinner: {
  width: "55px",
  height: "55px",
  border: "5px solid #334155",
  borderTop: "5px solid #22c55e",
  borderRadius: "50%",
  margin: "0 auto 18px",
  animation: "spin 1s linear infinite"
},

 

};