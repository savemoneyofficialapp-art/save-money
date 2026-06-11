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

  const [openWithdrawId, setOpenWithdrawId] = useState(null);
  const [transactionPopup, setTransactionPopup] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [transactionFrom, setTransactionFrom] = useState("");
  const [transactionTo, setTransactionTo] = useState("");

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
      setWithdraws(
        wData?.success && Array.isArray(wData.requests)
          ? wData.requests
          : []
      );
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

    if (d?.success) {
      setWithdraws((prev) =>
        prev.map((w) =>
          w._id === id
            ? {
                ...w,
                status,
                rejectReason:
                  status === "Rejected" ? rejectReason : w.rejectReason,
                actionDate: new Date().toISOString()
              }
            : w
        )
      );

      setOpenWithdrawId(null);
      toast.success(d.msg || `Withdraw ${status}`);
      await load();
    } else {
      toast.error(d?.msg || "Withdraw action failed");
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

  const pendingWithdraws = withdraws.filter((w) => w.status === "Pending");

  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  );

  const transactionWithdraws = withdraws.filter((w) => {
    const d = new Date(w.createdAt || w.date);

    if (transactionFilter === "pending" && w.status !== "Pending") return false;
    if (transactionFilter === "success" && w.status !== "Success") return false;
    if (transactionFilter === "rejected" && w.status !== "Rejected") return false;
    if (transactionFilter === "thisMonth" && d < startThisMonth) return false;
    if (
      transactionFilter === "lastMonth" &&
      (d < startLastMonth || d > endLastMonth)
    )
      return false;

    if (transactionFrom) {
      const from = new Date(transactionFrom);
      if (d < from) return false;
    }

    if (transactionTo) {
      const to = new Date(transactionTo);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }

    return true;
  });

  const pendingWithdrawAmount = pendingWithdraws.reduce(
    (sum, w) => sum + Number(w.amount || 0),
    0
  );

  const totalWithdrawAmount = withdraws
    .filter((w) => w.status === "Success")
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const transactionTotalAmount = transactionWithdraws
    .filter((w) => w.status === "Success")
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const chartData = [
    { name: "Users", value: data.totalUsers || 0 },
    { name: "KYC", value: data.kycApproved || 0 },
    { name: "Plans", value: data.activePlans || 0 },
    { name: "Pending Withdraw", value: pendingWithdraws.length || 0 }
  ];

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
          <h2>{pendingWithdraws.length}</h2>
          <p>Pending Withdraw</p>
        </div>

        <div style={styles.card}>
          <h2>{money(totalWithdrawAmount)}</h2>
          <p>Total Withdraw</p>
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
        <div style={styles.sectionTop}>
          <div>
            <h2>Pending Withdraw Requests</h2>
            <p style={{ color: "#94a3b8" }}>
              Only pending requests will show here.
            </p>
          </div>

          <button
            style={styles.viewTransactionBtn}
            onClick={() => setTransactionPopup(true)}
          >
            View Transactions
          </button>
        </div>

        <div style={styles.withdrawSummary}>
          <div style={styles.summaryMini}>
            <b>Pending Requests</b>
            <h3>{pendingWithdraws.length}</h3>
          </div>

          <div style={styles.summaryMini}>
            <b>Pending Amount</b>
            <h3>{money(pendingWithdrawAmount)}</h3>
          </div>
        </div>

        {pendingWithdraws.length === 0 ? (
          <p>No pending withdraw request found</p>
        ) : (
          pendingWithdraws.map((w) => (
            <div key={w._id} style={styles.withdrawMiniCard}>
              <div style={styles.withdrawMiniTop}>
                <div>
                  <h3>{w.name || "User"}</h3>
                  <p>{w.email}</p>
                  <p style={styles.amountText}>{money(w.amount)}</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      ...styles.statusPill,
                      background: "#fef9c3",
                      color: "#ca8a04"
                    }}
                  >
                    Pending
                  </span>

                  <br />

                  <button
                    style={styles.viewDetailsBtn}
                    onClick={() =>
                      setOpenWithdrawId(openWithdrawId === w._id ? null : w._id)
                    }
                  >
                    {openWithdrawId === w._id ? "Hide Details" : "View Details"}
                  </button>
                </div>
              </div>

              {openWithdrawId === w._id && (
                <div style={styles.withdrawDetailsBox}>
                  <div style={styles.withdrawGrid}>
                    <div>
                      <b>Wallet ID</b>
                      <p>{w.walletId || "N/A"}</p>
                    </div>

                    <div>
                      <b>Wallet Balance</b>
                      <p>{money(w.walletBalance)}</p>
                    </div>

                    <div>
                      <b>Withdrawable</b>
                      <p>{money(w.withdrawableBalance)}</p>
                    </div>

                    <div>
                      <b>Date</b>
                      <p>
                        {w.createdAt
                          ? new Date(w.createdAt).toLocaleString("en-IN")
                          : "N/A"}
                      </p>
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

      {transactionPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupBox}>
            <div style={styles.popupTop}>
              <h2>Withdraw Transactions</h2>

              <button
                style={styles.closePopup}
                onClick={() => setTransactionPopup(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.transactionFilterBox}>
              <select
                style={styles.filterInput}
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="rejected">Rejected</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
              </select>

              <input
                style={styles.filterInput}
                type="date"
                value={transactionFrom}
                onChange={(e) => setTransactionFrom(e.target.value)}
              />

              <input
                style={styles.filterInput}
                type="date"
                value={transactionTo}
                onChange={(e) => setTransactionTo(e.target.value)}
              />

              <button
                style={styles.resetBtn}
                onClick={() => {
                  setTransactionFilter("all");
                  setTransactionFrom("");
                  setTransactionTo("");
                }}
              >
                Reset
              </button>
            </div>

            <div style={styles.popupSummary}>
              <div>
                <b>Total Transactions</b>
                <h3>{transactionWithdraws.length}</h3>
              </div>
              <div>
                <b>Success Amount</b>
                <h3>{money(transactionTotalAmount)}</h3>
              </div>
            </div>

            <div style={{ marginTop: 15 }}>
              {transactionWithdraws.length === 0 ? (
                <p>No transaction found</p>
              ) : (
                transactionWithdraws.map((w) => (
                  <div key={w._id} style={styles.transactionItem}>
                    <div>
                      <b>{w.name || "User"}</b>
                      <p>{w.email}</p>
                      <p>{money(w.amount)}</p>
                      <small>
                        {w.createdAt
                          ? new Date(w.createdAt).toLocaleString("en-IN")
                          : "N/A"}
                      </small>
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
                ))
              )}
            </div>
          </div>
        </div>
      )}
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

  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
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

  viewTransactionBtn: {
    background: "linear-gradient(90deg,#2563eb,#7c3aed)",
    border: "none",
    color: "white",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: 900
  },

  withdrawSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "14px"
  },

  summaryMini: {
    background: "#020617",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #334155"
  },

  withdrawMiniCard: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "14px",
    marginTop: "12px"
  },

  withdrawMiniTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px"
  },

  amountText: {
    fontSize: "20px",
    fontWeight: 900,
    color: "#22c55e"
  },

  statusPill: {
    padding: "9px 16px",
    borderRadius: "999px",
    fontWeight: 900,
    whiteSpace: "nowrap"
  },

  viewDetailsBtn: {
    marginTop: "14px",
    background: "#2563eb",
    border: "none",
    color: "white",
    padding: "9px 14px",
    borderRadius: "10px",
    fontWeight: "bold"
  },

  withdrawDetailsBox: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "14px",
    background: "#020617",
    border: "1px solid #1e40af"
  },

  withdrawGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "10px"
  },

  bankBox: {
    background: "#020617",
    padding: "14px",
    borderRadius: "14px",
    marginTop: "15px",
    border: "1px solid #334155"
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
    padding: "9px 12px",
    borderRadius: "8px",
    fontWeight: 900
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
  },

  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.65)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },

  popupBox: {
    width: "min(860px,96vw)",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#0f172a",
    color: "white",
    borderRadius: "20px",
    padding: 20,
    border: "1px solid #334155"
  },

  popupTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  closePopup: {
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: 900
  },

  transactionFilterBox: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr auto",
    gap: "10px",
    marginTop: "15px"
  },

  filterInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
    boxSizing: "border-box"
  },

  resetBtn: {
    background: "#2563eb",
    border: "none",
    color: "white",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: 900
  },

  popupSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "14px"
  },

  transactionItem: {
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "14px",
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center"
  }
};