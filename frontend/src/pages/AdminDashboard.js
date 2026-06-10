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
  const [withdraws, setWithdraws] = useState([]);

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
      headers: { authorization: token || "" }
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

      const wData = await apiGet("/admin/withdraw-requests");
      if (wData?.success) {
        setWithdraws(Array.isArray(wData.requests) ? wData.requests : []);
      } else {
        setWithdraws([]);
      }
    } catch (err) {
      console.log("ADMIN LOAD ERROR:", err);
      setError("Backend API not connected. Check Render URL / CORS / token.");
      setData({});
    }
  };

  const approveKYC = async (id) => {
    const d = await apiPost("/approve-kyc", { userId: id });
    if (!d) return;
    toast.success(d.msg || "KYC Approved");
    load();
  };

  const rejectKYC = async (id) => {
    const reason = prompt("Why are you rejecting this KYC?");
    if (!reason) return alert("Reject reason required");

    const d = await apiPost("/reject-kyc", { userId: id, reason });
    alert(d?.msg || "KYC Rejected");
    load();
  };

  const approveCash = async (id) => {
    const d = await apiPost("/approve-cash", { requestId: id });
    alert(d?.msg || "Cash request approved");
    load();
  };

  const rejectCash = async (id) => {
    const d = await apiPost("/reject-cash", { requestId: id });
    alert(d?.msg || "Cash request rejected");
    load();
  };

  const withdrawAction = async (id, status) => {
    let rejectReason = "";

    if (status === "Rejected") {
      rejectReason = prompt("Reject reason লিখুন") || "Rejected by admin";
    }

    const d = await apiPost("/admin/withdraw-action", {
      id,
      status,
      rejectReason
    });

    alert(d?.msg || `Withdraw ${status}`);
    load();
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

  const fileUrl = (file) => {
    if (!file) return "#";
    if (file.startsWith("http")) return file;
    return `${API}/uploads/${file}`;
  };

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

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
    { name: "Plans", value: data.activePlans || 0 },
    { name: "Withdraw", value: withdraws.length || 0 }
  ];

  const pendingWithdraw = withdraws.filter((x) => x.status === "Pending").length;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.quick}>
        <button style={styles.green} onClick={() => (window.location.href = "/admin-analytics")}>
          Advanced Analytics
        </button>

        <button style={styles.green} onClick={() => (window.location.href = "/admin-user-control")}>
          User Control
        </button>

        <button style={styles.green} onClick={() => (window.location.href = "/admin-support")}>
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
          <h2>{money(data.totalInvestment || 0)}</h2>
          <p>Total Investment</p>
        </div>

        <div style={styles.card}>
          <h2>{money(data.totalWallet || 0)}</h2>
          <p>Total Wallet</p>
        </div>

        <div style={styles.card}>
          <h2>{data.kycApproved || 0}</h2>
          <p>KYC Approved</p>
        </div>

        <div style={styles.card}>
          <h2>{pendingWithdraw}</h2>
          <p>Pending Withdraw</p>
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
        <h2>Withdraw Requests</h2>

        {withdraws.length === 0 ? (
          <p>No withdraw requests</p>
        ) : (
          withdraws.map((w) => (
            <div key={w._id} style={styles.withdrawCard}>
              <div style={styles.withdrawTop}>
                <div>
                  <h3>{w.name || "User"}</h3>
                  <p>{w.email}</p>
                  <p>Wallet ID: {w.walletId || "N/A"}</p>
                </div>

                <span
                  style={{
                    ...styles.statusPill,
                    background:
                      w.status === "Success"
                        ? "#dcfce7"
                        : w.status === "Rejected"
                        ? "#ffe4e6"
                        : "#fef9c3",
                    color:
                      w.status === "Success"
                        ? "#16a34a"
                        : w.status === "Rejected"
                        ? "#e11d48"
                        : "#ca8a04"
                  }}
                >
                  {w.status}
                </span>
              </div>

              <div style={styles.withdrawGrid}>
                <div>
                  <b>Withdraw Amount</b>
                  <h2>{money(w.amount)}</h2>
                </div>

                <div>
                  <b>Wallet Balance</b>
                  <p>{money(w.walletBalance)}</p>
                </div>

                <div>
                  <b>Withdrawable Balance</b>
                  <p>{money(w.withdrawableBalance)}</p>
                </div>

                <div>
                  <b>Date</b>
                  <p>{w.createdAt ? new Date(w.createdAt).toLocaleString("en-IN") : "N/A"}</p>
                </div>
              </div>

              <div style={styles.bankBox}>
                <h4>Bank Details</h4>
                <p><b>Name:</b> {w.bankDetails?.accountHolderName || "N/A"}</p>
                <p><b>Mobile:</b> {w.bankDetails?.mobile || "N/A"}</p>
                <p><b>Bank:</b> {w.bankDetails?.bankName || "N/A"}</p>
                <p><b>Account:</b> {w.bankDetails?.accountNumber || "N/A"}</p>
                <p><b>IFSC:</b> {w.bankDetails?.ifscCode || "N/A"}</p>
                <p><b>UPI:</b> {w.bankDetails?.upiId || "N/A"}</p>
              </div>

              {w.rejectReason && (
                <p style={styles.rejectReason}>Reject Reason: {w.rejectReason}</p>
              )}

              {w.status === "Pending" && (
                <div style={styles.actionRow}>
                  <button
                    style={styles.approveBtn}
                    onClick={() => withdrawAction(w._id, "Success")}
                  >
                    Approve Success
                  </button>

                  <button
                    style={styles.rejectBtn}
                    onClick={() => withdrawAction(w._id, "Rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.section}>
        <h2>Pending KYC</h2>

        {kyc.length === 0 && <p>No pending KYC</p>}

        {kyc.map((u) => (
          <div key={u._id} style={styles.kycCard}>
            <h3>{u.name}</h3>
            <p>{u.email}</p>
            <p>Mobile: {u.mobile}</p>

            <div style={styles.docGrid}>
              {u.aadhaarFile && (
                <a href={fileUrl(u.aadhaarFile)} target="_blank" rel="noreferrer" style={styles.docBtn}>
                  View Aadhaar
                </a>
              )}

              {u.panFile && (
                <a href={fileUrl(u.panFile)} target="_blank" rel="noreferrer" style={styles.docBtn}>
                  View PAN
                </a>
              )}

              {u.photo && (
                <a href={fileUrl(u.photo)} target="_blank" rel="noreferrer" style={styles.docBtn}>
                  View Photo
                </a>
              )}
            </div>

            <button style={styles.greenFull} onClick={() => approveKYC(u._id)}>
              Approve KYC
            </button>

            <button style={styles.redFull} onClick={() => rejectKYC(u._id)}>
              Reject KYC
            </button>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2>Cash Requests</h2>

        {cash.length === 0 ? (
          <p>No cash requests</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
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
                    <td>{money(r.amount)}</td>
                    <td>{r.txnId || r.transactionId || "N/A"}</td>
                    <td>
                      <button
                        style={styles.smallBlue}
                        onClick={() =>
                          window.open(r.screenshot || r.screenshotUrl || r.image || r.photo, "_blank")
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
                    <td>{r.status || "pending"}</td>
                    <td>
                      <button style={styles.smallGreen} onClick={() => approveCash(r._id)}>
                        Approve
                      </button>
                      <button style={styles.smallRed} onClick={() => rejectCash(r._id)}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

  loaderLogo: {
    color: "#22c55e"
  },

  spinner: {
    width: "55px",
    height: "55px",
    border: "5px solid #334155",
    borderTop: "5px solid #22c55e",
    borderRadius: "50%",
    margin: "0 auto 18px"
  },

  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left,#16a34a33,transparent 28%),linear-gradient(180deg,#020617,#07111f)",
    padding: "20px",
    color: "white",
    fontFamily: "Arial"
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
    textAlign: "center",
    border: "1px solid #334155"
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginTop: "10px",
    boxSizing: "border-box"
  },

  chartBox: {
    background: "#1e293b",
    marginTop: "20px",
    padding: "15px",
    borderRadius: "15px",
    border: "1px solid #334155"
  },

  section: {
    background: "#1e293b",
    marginTop: "20px",
    padding: "15px",
    borderRadius: "15px",
    border: "1px solid #334155"
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
    background: "#dc2626",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    color: "white",
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

  withdrawCard: {
    background:
      "linear-gradient(135deg,rgba(15,23,42,.95),rgba(30,41,59,.95))",
    marginTop: "15px",
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid rgba(34,197,94,.35)",
    boxShadow: "0 0 20px rgba(34,197,94,.12)"
  },

  withdrawTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start"
  },

  statusPill: {
    padding: "9px 16px",
    borderRadius: "999px",
    fontWeight: 900,
    whiteSpace: "nowrap"
  },

  withdrawGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "15px"
  },

  bankBox: {
    background: "#020617",
    padding: "14px",
    borderRadius: "14px",
    marginTop: "15px",
    border: "1px solid #334155"
  },

  rejectReason: {
    color: "#fca5a5",
    fontWeight: 800
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "14px"
  },

  approveBtn: {
    background: "linear-gradient(90deg,#22c55e,#16a34a)",
    border: "none",
    borderRadius: "12px",
    padding: "13px",
    color: "#020617",
    fontWeight: 900
  },

  rejectBtn: {
    background: "linear-gradient(90deg,#ef4444,#dc2626)",
    border: "none",
    borderRadius: "12px",
    padding: "13px",
    color: "white",
    fontWeight: 900
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

  tableWrap: {
    overflowX: "auto"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px"
  },

  smallBlue: {
    background: "#2563eb",
    border: "none",
    color: "white",
    padding: "7px 12px",
    borderRadius: "8px"
  },

  smallGreen: {
    background: "#22c55e",
    border: "none",
    color: "#020617",
    padding: "7px 12px",
    borderRadius: "8px",
    marginRight: "6px",
    fontWeight: 900
  },

  smallRed: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "7px 12px",
    borderRadius: "8px",
    fontWeight: 900
  }
};