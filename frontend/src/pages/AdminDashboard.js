import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const API =
  process.env.REACT_APP_API ||
  "https://save-money-yyv1.onrender.com";

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
      alert(d.msg + ". Please login again.");
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

  const approveKYC = async (id) => {
    const d = await apiPost("/approve-kyc", { userId: id });
    if (!d) return;
    alert(d.msg || "Done");
    load();
  };

  const approveCash = async (id) => {
    const d = await apiPost("/approve-cash", { requestId: id });
    if (!d) return;
    alert(d.msg || "Done");
    load();
  };

  const banUser = async (id) => {
    const d = await apiPost("/ban-user", { userId: id });
    if (!d) return;
    alert(d.msg || "Done");
    load();
  };

  const broadcast = async () => {
    if (!title || !message) {
      alert("Title and message required");
      return;
    }

    const d = await apiPost("/broadcast", { title, message });
    if (!d) return;

    alert(d.msg || "Broadcast Sent");
    setTitle("");
    setMessage("");
  };

  if (!data) {
    return <div style={styles.loading}>Loading Admin Dashboard...</div>;
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

        {kyc.length === 0 && <p>No pending KYC</p>}

        {kyc.map((u) => (
          <div key={u._id} style={styles.row}>
            <div>
              <b>{u.name}</b>
              <p>{u.email}</p>
            </div>

            <button style={styles.green} onClick={() => approveKYC(u._id)}>
              Approve
            </button>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2>Cash Requests</h2>

        {cash.length === 0 && <p>No cash requests</p>}

        {cash.map((c) => (
          <div key={c._id} style={styles.row}>
            <div>
              <b>{c.email}</b>
              <p>₹{c.amount}</p>
              <p>UTR: {c.utr}</p>
            </div>

            <button style={styles.green} onClick={() => approveCash(c._id)}>
              Approve
            </button>
          </div>
        ))}
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

  red: {
    background: "#ef4444",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    color: "white"
  }
};