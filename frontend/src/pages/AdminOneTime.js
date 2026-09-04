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

export default function AdminOneTime() {
  const token = localStorage.getItem("token");

  // Analytics & Stats
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [cash, setCash] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [investments, setInvestments] = useState([]);

  // Popups & Filter States
  const [openWithdrawId, setOpenWithdrawId] = useState(null);
  const [transactionPopup, setTransactionPopup] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [transactionFrom, setTransactionFrom] = useState("");
  const [transactionTo, setTransactionTo] = useState("");

  // Wallet Adjust State (using otbalance)
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState("add"); // "add" or "subtract"
  const [adjustReason, setAdjustReason] = useState("");

  // Manual User Investment Control State
  const [investEmail, setInvestEmail] = useState("");
  const [investAmount, setInvestAmount] = useState("");
  const [investDuration, setInvestDuration] = useState("15 Days (0.6%)");
  const [investDailyReturn, setInvestDailyReturn] = useState("");

  // Broadcast & News
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [latestUpdateText, setLatestUpdateText] = useState("");
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

      const ad = await apiGet("/admin/onetime-analytics");
      if (!ad) return;
      setData(ad);

      const cData = await apiGet("/admin/onetime-cash-requests");
      setCash(Array.isArray(cData) ? cData : (cData?.requests || []));

      const wData = await apiGet("/admin/onetime-withdraw-requests");
      setWithdraws(
        wData?.success && Array.isArray(wData.requests)
          ? wData.requests
          : Array.isArray(wData) ? wData : []
      );

      const iData = await apiGet("/admin/onetime-investments");
      setInvestments(
        iData?.success && Array.isArray(iData.investments)
          ? iData.investments
          : Array.isArray(iData) ? iData : []
      );

      const uData = await apiGet("/all-users");
      setUsers(Array.isArray(uData) ? uData : []);

    } catch (err) {
      console.log("ADMIN ONETIME LOAD ERROR:", err);
      setError("Backend API connection failed.");
      setData({});
    }
  };

  // 1. Add Fund Requests (Accept / Reject)
  const approveCash = async (id) => {
    const d = await apiPost("/admin/onetime-approve-cash", { requestId: id });
    if (!d) return;
    toast.success(d?.msg || "Fund Request Approved and added to otbalance!");
    load();
  };

  const rejectCash = async (id) => {
    const reason = prompt("Enter rejection reason for this fund request:");
    if (!reason) return alert("Rejection reason is required");

    const d = await apiPost("/admin/onetime-reject-cash", { requestId: id, reason });
    if (!d) return;
    toast.info(d?.msg || "Fund request rejected");
    load();
  };

  // 2. Withdraw Requests (Accept / Reject)
  const withdrawAction = async (id, status) => {
    let rejectReason = "";
    if (status === "Rejected") {
      rejectReason = prompt("Enter rejection reason") || "Rejected by admin";
    }

    const d = await apiPost("/admin/onetime-withdraw-action", {
      id,
      status,
      rejectReason
    });

    if (d?.success || d?.msg) {
      toast.success(d.msg || `OneTime Withdraw ${status}`);
      await load();
    } else {
      toast.error(d?.msg || "Withdraw action failed");
    }
  };

  // 3. Wallet Adjustment Action (otbalance)
  const handleWalletAdjust = async () => {
    if (!adjustEmail || !adjustAmount) {
      toast.info("User Email and Amount are required");
      return;
    }

    const d = await apiPost("/admin/onetime-adjust-wallet", {
      email: adjustEmail,
      amount: Number(adjustAmount),
      type: adjustType,
      reason: adjustReason || "Administrative Adjustment"
    });

    if (!d) return;

    if (d.success || d.msg) {
      toast.success(d.msg || `otbalance ${adjustType === "add" ? "credited" : "debited"} successfully!`);
      setAdjustEmail("");
      setAdjustAmount("");
      setAdjustReason("");
      load();
    } else {
      toast.error(d.msg || "Wallet adjustment failed");
    }
  };

  // 4. User Investment Control Actions
  const handleAssignInvestment = async () => {
    if (!investEmail || !investAmount) {
      toast.info("User Email and Investment Amount are required");
      return;
    }

    const d = await apiPost("/admin/onetime-create-investment", {
      email: investEmail,
      amount: Number(investAmount),
      duration: investDuration,
      dailyReturn: Number(investDailyReturn || 0)
    });

    if (!d) return;

    if (d.success || d.msg) {
      toast.success(d.msg || "OneTime Investment plan assigned to user!");
      setInvestEmail("");
      setInvestAmount("");
      setInvestDailyReturn("");
      load();
    } else {
      toast.error(d.msg || "Failed to create investment plan");
    }
  };

  const cancelInvestment = async (investId) => {
    if (!window.confirm("Are you sure you want to cancel this user investment?")) return;

    const d = await apiPost("/admin/onetime-cancel-investment", { id: investId });
    if (!d) return;

    toast.info(d.msg || "Investment cancelled");
    load();
  };

  // Broadcast & Updates
  const broadcast = async () => {
    if (!title || !message) {
      toast.info("Title and message required");
      return;
    }
    const d = await apiPost("/broadcast", { title: `[OneTime] ${title}`, message });
    if (!d) return;
    toast.success(d.msg || "Broadcast Sent");
    setTitle("");
    setMessage("");
  };

  const handleSendLatestUpdate = async () => {
    if (!latestUpdateText.trim()) {
      toast.info("Please enter latest update text");
      return;
    }
    const d = await apiPost("/update-latest-news", { message: latestUpdateText });
    if (!d) return;
    toast.success("Latest update saved successfully!");
    setLatestUpdateText("");
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
          <h2>Loading Admin OneTime Dashboard</h2>
        </div>
      </div>
    );
  }

  const pendingWithdraws = withdraws.filter((w) => w.status === "Pending");
  const pendingCashRequests = cash.filter((c) => c.status === "pending" || c.status === "Pending" || !c.status);
  const activeInvestments = investments.filter((i) => i.status === "Active" || !i.status);

  const pendingWithdrawAmount = pendingWithdraws.reduce(
    (sum, w) => sum + Number(w.amount || 0),
    0
  );

  const totalWithdrawAmount = withdraws
    .filter((w) => w.status === "Success")
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const chartData = [
    { name: "Total Users", value: users.length || data.totalUsers || 0 },
    { name: "Active Plans", value: activeInvestments.length },
    { name: "Pending Topups", value: pendingCashRequests.length },
    { name: "Pending Withdraws", value: pendingWithdraws.length }
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚡ Admin OneTime Command Center</h1>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      <div style={styles.quick}>
        <button style={styles.navBtn} onClick={() => (window.location.href = "/admin-dashboard")}>
          ⚙️ Main Dashboard
        </button>
        <button style={styles.navBtn} onClick={() => (window.location.href = "/admin-analytics")}>
          📊 Advanced Analytics
        </button>
        <button style={styles.navBtn} onClick={() => (window.location.href = "/admin-user-control")}>
          👥 User Control
        </button>
      </div>

      {/* METRICS STATS */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Total OneTime Users</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8" }}>{users.length || data.totalUsers || 0}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Active OneTime Plans</p>
          <h2 style={{ ...styles.cardVal, color: "#a855f7" }}>{activeInvestments.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Total Invested Volume</p>
          <h2 style={{ ...styles.cardVal, color: "#22c55e" }}>{money(data.totalInvested || 0)}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Pending Topups</p>
          <h2 style={{ ...styles.cardVal, color: "#eab308" }}>{pendingCashRequests.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Pending Withdraws</p>
          <h2 style={{ ...styles.cardVal, color: "#f43f5e" }}>{pendingWithdraws.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Disbursed Withdrawals</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8" }}>{money(totalWithdrawAmount)}</h2>
        </div>
      </div>

      {/* CHART */}
      <div style={styles.chartBox}>
        <h3 style={{ margin: "0 0 15px 0", color: "#f1f5f9", fontSize: "16px" }}>
          📈 ONETIME STATISTICAL OVERVIEW
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff' }} />
            <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 1: WALLET ADJUSTMENT (otbalance) */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💳 OneTime Wallet (otbalance) Adjustment</h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "-10px 0 15px 0" }}>
          Directly credit or debit a user's <b>otbalance</b>.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input
            style={styles.input}
            placeholder="User Email Address..."
            value={adjustEmail}
            onChange={(e) => setAdjustEmail(e.target.value)}
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Amount (₹)..."
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "12px", marginTop: "12px" }}>
          <select
            style={{ ...styles.input, marginTop: 0 }}
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value)}
          >
            <option value="add">➕ Add Balance (Credit otbalance)</option>
            <option value="subtract">➖ Deduct Balance (Debit otbalance)</option>
          </select>
          <input
            style={{ ...styles.input, marginTop: 0 }}
            placeholder="Reason (e.g. Bonus, Adjustment)..."
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />
        </div>

        <button style={styles.greenFull} onClick={handleWalletAdjust}>
          ⚡ Execute otbalance Adjustment
        </button>
      </div>

      {/* SECTION 2: USER STATUS OVERVIEW */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>👥 User All Status & Live otbalance</h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Live otbalance</th>
                <th style={styles.th}>Total Invested</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="4" style={styles.emptyText}>No user records found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} style={styles.tr}>
                    <td style={styles.td}>{u.name || "N/A"}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={{ ...styles.td, color: "#fbbf24", fontWeight: "bold" }}>{money(u.otbalance)}</td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>{money(u.oneTimeTotalInvested)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: USER INVEST CONTROL */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 OneTime Investment Control</h2>

        {/* Manual Plan Assignment Box */}
        <div style={{ background: "#020617", padding: "18px", borderRadius: "16px", border: "1px solid #334155", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#38bdf8" }}>➕ Assign Manual OneTime Investment</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input
              style={styles.input}
              placeholder="Target User Email..."
              value={investEmail}
              onChange={(e) => setInvestEmail(e.target.value)}
            />
            <input
              style={styles.input}
              type="number"
              placeholder="Investment Amount (₹)..."
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <input
              style={{ ...styles.input, marginTop: 0 }}
              placeholder="Duration (e.g., 15 Days)"
              value={investDuration}
              onChange={(e) => setInvestDuration(e.target.value)}
            />
            <input
              style={{ ...styles.input, marginTop: 0 }}
              type="number"
              placeholder="Daily Return Amount (₹)..."
              value={investDailyReturn}
              onChange={(e) => setInvestDailyReturn(e.target.value)}
            />
          </div>
          <button style={styles.greenFull} onClick={handleAssignInvestment}>
            🚀 Force Assign Investment Plan
          </button>
        </div>

        {/* Active Investments List */}
        <h3 style={{ color: "#ffffff", fontSize: "18px", margin: "15px 0 10px 0" }}>📜 Live Investments Registry</h3>
        {investments.length === 0 ? (
          <p style={styles.emptyText}>No active investments found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Email</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv._id} style={styles.tr}>
                    <td style={styles.td}>{inv.email}</td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>{money(inv.amount)}</td>
                    <td style={styles.td}>{inv.duration || "15 Days"}</td>
                    <td style={styles.td}>{inv.status || "Active"}</td>
                    <td style={styles.td}>
                      {inv.status !== "Cancelled" ? (
                        <button style={styles.smallRed} onClick={() => cancelInvestment(inv._id)}>
                          Cancel Plan
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: ADD FUND REQUESTS (ACCEPT / REJECT) */}
<div style={styles.section}>
  <h2 style={styles.sectionTitle}>📥 OneTime Add Fund Requests</h2>
  {cash.length === 0 ? (
    <p style={styles.emptyText}>No pending fund requests in queue.</p>
  ) : (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>User Email</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>UTR / Txn ID</th>
            <th style={styles.th}>Proof Screenshot</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {cash.map((r) => {
            const currentStatus = (r.status || "").toLowerCase();
            const isPending = currentStatus === "pending" || !r.status;

            return (
              <tr key={r._id} style={styles.tr}>
                <td style={styles.td}>{r.email}</td>
                <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>{money(r.amount)}</td>
                <td style={styles.td}>{r.transactionId || r.txnId || "N/A"}</td>
                <td style={styles.td}>
                  {r.screenshot ? (
                    <a href={r.screenshot} target="_blank" rel="noreferrer" style={{ color: "#38bdf8" }}>
                      View Image
                    </a>
                  ) : (
                    "No Screenshot"
                  )}
                </td>
                <td style={styles.td}>
                  <span style={{
                    padding: "4px 8px", borderRadius: "6px", fontWeight: "bold",
                    background: currentStatus === "approved" ? "rgba(34,197,94,0.2)" : currentStatus === "rejected" ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)",
                    color: currentStatus === "approved" ? "#22c55e" : currentStatus === "rejected" ? "#f87171" : "#facc15"
                  }}>
                    {r.status || "Pending"}
                  </span>
                </td>
                <td style={styles.td}>
                  {isPending ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={styles.smallGreen} onClick={() => approveCash(r._id)}>Accept</button>
                      <button style={styles.smallRed} onClick={() => rejectCash(r._id)}>Reject</button>
                    </div>
                  ) : (
                    <span style={{ color: "#cbd5e1" }}>Processed</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>


      {/* SECTION 5: WITHDRAW REQUESTS (ACCEPT / REJECT) */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💰 OneTime Pending Withdrawals</h2>
        {pendingWithdraws.length === 0 ? (
          <p style={styles.emptyText}>No pending withdrawal requests.</p>
        ) : (
          pendingWithdraws.map((w) => (
            <div key={w._id} style={styles.withdrawMiniCard}>
              <div style={styles.withdrawMiniTop}>
                <div>
                  <h3 style={{ margin: 0, color: "#ffffff" }}>{w.name || "User"}</h3>
                  <p style={{ margin: "4px 0", color: "#cbd5e1" }}>{w.email}</p>
                  <p style={styles.amountText}>{money(w.amount)}</p>
                </div>
                <div>
                  <button
                    style={styles.viewDetailsBtn}
                    onClick={() => setOpenWithdrawId(openWithdrawId === w._id ? null : w._id)}
                  >
                    {openWithdrawId === w._id ? "Hide Info" : "Inspect Bank Details"}
                  </button>
                </div>
              </div>

              {openWithdrawId === w._id && (
                <div style={styles.withdrawDetailsBox}>
                  <p><b>Holder:</b> {w.bankDetails?.holderName || w.bankDetails?.accountHolderName || "N/A"}</p>
                  <p><b>Bank:</b> {w.bankDetails?.bankName || "N/A"}</p>
                  <p><b>Account No:</b> {w.bankDetails?.accountNumber || "N/A"}</p>
                  <p><b>IFSC:</b> {w.bankDetails?.ifsc || w.bankDetails?.ifscCode || "N/A"}</p>

                  <div style={styles.actionRow}>
                    <button style={styles.approveBtn} onClick={() => withdrawAction(w._id, "Success")}>
                      ✅ Accept & Approve
                    </button>
                    <button style={styles.rejectBtn} onClick={() => withdrawAction(w._id, "Rejected")}>
                      ❌ Reject & Refund otbalance
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#020617", padding: "20px", color: "#f8fafc", fontFamily: "sans-serif" },
  loadingPage: { minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", color: "white" },
  loaderCard: { background: "#0f172a", padding: "40px", borderRadius: "20px", textAlign: "center", border: "1px solid #334155" },
  loaderLogo: { color: "#22c55e", fontSize: "32px", margin: "0 0 15px 0" },
  title: { textAlign: "center", fontSize: "28px", fontWeight: "bold", color: "#ffffff", margin: "0 0 25px 0" },
  error: { background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", color: "#fee2e2", padding: "12px", borderRadius: "12px", marginBottom: "20px" },
  quick: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "25px" },
  navBtn: { background: "#0f172a", border: "1px solid #334155", padding: "14px", borderRadius: "12px", color: "#fff", fontWeight: "bold", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "25px" },
  card: { background: "#0f172a", padding: "18px", borderRadius: "16px", textAlign: "center", border: "1px solid #334155" },
  cardLabel: { margin: "0 0 8px 0", color: "#cbd5e1", fontSize: "13px" },
  cardVal: { margin: 0, fontSize: "24px", fontWeight: "bold" },
  chartBox: { background: "#0f172a", padding: "20px", borderRadius: "16px", border: "1px solid #334155", marginBottom: "25px" },
  section: { background: "#0f172a", padding: "22px", borderRadius: "18px", border: "1px solid #334155", marginBottom: "25px" },
  sectionTitle: { margin: "0 0 15px 0", fontSize: "20px", color: "#ffffff", borderBottom: "1px solid #1e293b", paddingBottom: "8px" },
  input: { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#020617", color: "white", boxSizing: "border-box" },
  greenFull: { width: "100%", background: "#22c55e", border: "none", padding: "14px", borderRadius: "12px", color: "#020617", fontWeight: "bold", marginTop: "15px", cursor: "pointer" },
  withdrawMiniCard: { background: "#020617", border: "1px solid #334155", borderRadius: "14px", padding: "15px", marginTop: "12px" },
  withdrawMiniTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  amountText: { fontSize: "20px", fontWeight: "bold", color: "#22c55e", margin: "4px 0 0 0" },
  viewDetailsBtn: { background: "rgba(59,130,246,0.15)", border: "1px solid #3b82f6", color: "#60a5fa", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" },
  withdrawDetailsBox: { marginTop: "12px", padding: "12px", borderRadius: "10px", background: "#0f172a", border: "1px solid #1e3a8a" },
  actionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" },
  approveBtn: { background: "#22c55e", border: "none", borderRadius: "8px", padding: "10px", color: "#020617", fontWeight: "bold", cursor: "pointer" },
  rejectBtn: { background: "#ef4444", border: "none", borderRadius: "8px", padding: "10px", color: "white", fontWeight: "bold", cursor: "pointer" },
  tableWrap: { overflowX: "auto", marginTop: "10px", background: "#020617", borderRadius: "12px", border: "1px solid #334155" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0f172a", padding: "12px", color: "#ffffff", textAlign: "left", fontSize: "13px" },
  tr: { borderBottom: "1px solid #1e293b" },
  td: { padding: "12px", fontSize: "14px", color: "#f1f5f9" },
  smallGreen: { background: "#22c55e", border: "none", color: "#020617", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  smallRed: { background: "#ef4444", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  emptyText: { color: "#cbd5e1", textAlign: "center", fontSize: "14px", padding: "15px" }
};
