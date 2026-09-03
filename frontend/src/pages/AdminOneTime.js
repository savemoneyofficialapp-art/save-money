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

  // Wallet Adjust State
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

      // OneTime specific Analytics (falls back to generic endpoint if needed)
      const ad = await apiGet("/admin/onetime-analytics");
      if (!ad) return;

      if (ad.msg && !ad.totalInvested) {
        setError(ad.msg);
        setData({});
      } else {
        setData(ad);
      }

      // Load OneTime Cash / Topup requests
      const cData = await apiGet("/admin/onetime-cash-requests");
      setCash(Array.isArray(cData) ? cData : (cData?.requests || []));

      // Load OneTime Withdraw requests
      const wData = await apiGet("/admin/onetime-withdraw-requests");
      setWithdraws(
        wData?.success && Array.isArray(wData.requests)
          ? wData.requests
          : Array.isArray(wData) ? wData : []
      );

      // Load All OneTime Investments
      const iData = await apiGet("/admin/onetime-investments");
      setInvestments(
        iData?.success && Array.isArray(iData.investments)
          ? iData.investments
          : Array.isArray(iData) ? iData : []
      );

      // Load Users List
      const uData = await apiGet("/all-users");
      setUsers(Array.isArray(uData) ? uData : []);

    } catch (err) {
      console.log("ADMIN ONETIME LOAD ERROR:", err);
      setError("Backend API connection failed. Please verify OneTime server endpoints.");
      setData({});
    }
  };

  // 1. Add Fund (Cash Request) Actions
  const approveCash = async (id) => {
    const d = await apiPost("/admin/onetime-approve-cash", { requestId: id });
    if (!d) return;
    toast.success(d?.msg || "OneTime Fund Request Approved");
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

  // 2. Withdraw Actions
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

  // 3. Wallet Adjustment Action
  const handleWalletAdjust = async () => {
    if (!adjustEmail || !adjustAmount) {
      toast.info("User Email and Amount are required");
      return;
    }

    const d = await apiPost("/admin/onetime-adjust-wallet", {
      email: adjustEmail,
      amount: Number(adjustAmount),
      type: adjustType, // "add" or "subtract"
      reason: adjustReason || "Administrative Adjustment"
    });

    if (!d) return;

    if (d.success || d.msg) {
      toast.success(d.msg || `Wallet balance ${adjustType === "add" ? "credited" : "debited"} successfully!`);
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
          <p>Please wait, fetching live OneTime system data...</p>
        </div>
      </div>
    );
  }

  const pendingWithdraws = withdraws.filter((w) => w.status === "Pending");
  const pendingCashRequests = cash.filter((c) => c.status === "pending" || !c.status);
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
    { name: "Active Investments", value: activeInvestments.length },
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

      {/* STATS METRICS GRID */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>OneTime Network Users</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8" }}>{users.length || data.totalUsers || 0}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Active OneTime Plans</p>
          <h2 style={{ ...styles.cardVal, color: "#a855f7" }}>{activeInvestments.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Total OneTime Invested</p>
          <h2 style={{ ...styles.cardVal, color: "#22c55e" }}>{money(data.totalInvested || data.totalInvestment || 0)}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Pending Fund Topups</p>
          <h2 style={{ ...styles.cardVal, color: "#eab308" }}>{pendingCashRequests.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Pending Payout Requests</p>
          <h2 style={{ ...styles.cardVal, color: "#f43f5e" }}>{pendingWithdraws.length}</h2>
        </div>

        <div style={{ ...styles.card, gridColumn: "span 2" }}>
          <p style={styles.cardLabel}>Total Disbursed OneTime Withdrawals</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8", fontSize: "32px" }}>{money(totalWithdrawAmount)}</h2>
        </div>
      </div>

      {/* CHART SECTION */}
      <div style={styles.chartBox}>
        <h3 style={{ margin: "0 0 15px 0", color: "#f1f5f9", fontSize: "16px", fontWeight: "bold" }}>
          📈 ONETIME PLATFORM STATISTICAL OVERVIEW
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: '600' }} />
            <YAxis stroke="#cbd5e1" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: '600' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '10px', color: '#fff', fontSize: '15px' }} />
            <Bar dataKey="value" fill="url(#colorGradOne)" radius={[6, 6, 0, 0]}>
              <defs>
                <linearGradient id="colorGradOne" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 1: WALLET ADJUSTMENT CONTROL */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💳 OneTime Wallet Adjustment</h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "-10px 0 15px 0", fontWeight: "600" }}>
          Manually add or deduct funds directly from any user's OneTime Wallet balance.
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
            <option value="add">➕ Add Balance (Credit)</option>
            <option value="subtract">➖ Deduct Balance (Debit)</option>
          </select>
          <input
            style={{ ...styles.input, marginTop: 0 }}
            placeholder="Reason (e.g. Bonus, Adjustment, Refund)..."
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />
        </div>

        <button style={styles.greenFull} onClick={handleWalletAdjust}>
          ⚡ Execute Wallet Adjustment
        </button>
      </div>

      {/* SECTION 2: USER INVEST CONTROL */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 OneTime Investment Control</h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "-10px 0 15px 0", fontWeight: "600" }}>
          Manually assign an investment plan or monitor active user portfolios.
        </p>

        {/* Manual Plan Assignment Box */}
        <div style={{ background: "#020617", padding: "18px", borderRadius: "16px", border: "1px solid #334155", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#38bdf8", fontSize: "18px" }}>➕ Assign Manual OneTime Investment</h3>
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
          <p style={styles.emptyText}>No OneTime active investments found in database.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Account</th>
                  <th style={styles.th}>Capital Amount</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Daily Profit</th>
                  <th style={styles.th}>State</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv._id} style={styles.tr}>
                    <td style={styles.td}>{inv.email}</td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>{money(inv.amount)}</td>
                    <td style={styles.td}>{inv.duration || "Standard"}</td>
                    <td style={styles.td}>{money(inv.dailyReturn)}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold",
                        background: inv.status === "Cancelled" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
                        color: inv.status === "Cancelled" ? "#f87171" : "#22c55e"
                      }}>
                        {inv.status || "Active"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {inv.status !== "Cancelled" ? (
                        <button style={styles.smallRed} onClick={() => cancelInvestment(inv._id)}>
                          Cancel Plan
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>Terminated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: ADD FUND REQUESTS (ONE-TIME TOPUP LEDGER) */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📥 OneTime Add Fund Requests</h2>
        {cash.length === 0 ? (
          <p style={styles.emptyText}>📥 No pending OneTime fund requests in queue.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Account Node</th>
                  <th style={styles.th}>Requested Amount</th>
                  <th style={styles.th}>UTR / Txn Hash</th>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>State</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cash.map((r) => (
                  <tr key={r._id} style={styles.tr}>
                    <td style={styles.td}>{r.email}</td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold", fontSize: "16px" }}>{money(r.amount)}</td>
                    <td style={styles.td}>
                      <span style={styles.utrBadge}>
                        {r.txnId || r.transactionId || "N/A"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "N/A"}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "5px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold",
                        background: r.status === "approved" ? "rgba(34,197,94,0.2)" : r.status === "rejected" ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)",
                        color: r.status === "approved" ? "#22c55e" : r.status === "rejected" ? "#f87171" : "#facc15",
                      }}>
                        {r.status || "pending"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {r.status === "pending" || !r.status ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={styles.smallGreen} onClick={() => approveCash(r._id)}>Approve</button>
                          <button style={styles.smallRed} onClick={() => rejectCash(r._id)}>Reject</button>
                        </div>
                      ) : (
                        <span style={{ color: "#cbd5e1", fontSize: "14px", fontWeight: "600" }}>📦 Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: WITHDRAW REQUESTS */}
      <div style={styles.section}>
        <div style={styles.sectionTop}>
          <div>
            <h2 style={styles.sectionTitle}>💰 OneTime Pending Withdrawals</h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "4px 0 0 0", fontWeight: "600" }}>
              Approve or decline OneTime payout requests.
            </p>
          </div>
          <button style={styles.viewTransactionBtn} onClick={() => setTransactionPopup(true)}>
            🧾 Transaction Ledger
          </button>
        </div>

        <div style={styles.withdrawSummary}>
          <div style={styles.summaryMini}>
            <span style={{ color: "#cbd5e1", fontSize: "14px", fontWeight: "600" }}>Queue Count</span>
            <h3 style={{ margin: "5px 0 0 0", color: "#f43f5e", fontSize: "22px" }}>{pendingWithdraws.length} Req</h3>
          </div>
          <div style={styles.summaryMini}>
            <span style={{ color: "#cbd5e1", fontSize: "14px", fontWeight: "600" }}>Escrow Volume</span>
            <h3 style={{ margin: "5px 0 0 0", color: "#22c55e", fontSize: "22px" }}>{money(pendingWithdrawAmount)}</h3>
          </div>
        </div>

        {pendingWithdraws.length === 0 ? (
          <p style={styles.emptyText}>🎉 No pending OneTime withdraw requests in queue.</p>
        ) : (
          pendingWithdraws.map((w) => (
            <div key={w._id} style={styles.withdrawMiniCard}>
              <div style={styles.withdrawMiniTop}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "20px", color: "#ffffff" }}>{w.name || "User"}</h3>
                  <p style={{ margin: "5px 0", color: "#cbd5e1", fontSize: "16px", fontWeight: "500" }}>{w.email}</p>
                  <p style={styles.amountText}>{money(w.amount)}</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ ...styles.statusPill, background: "rgba(234,179,8,0.25)", color: "#facc15", fontSize: "14px" }}>
                    Pending Action
                  </span>
                  <br />
                  <button
                    style={styles.viewDetailsBtn}
                    onClick={() => setOpenWithdrawId(openWithdrawId === w._id ? null : w._id)}
                  >
                    {openWithdrawId === w._id ? "🔼 Collapse Info" : "👀 Inspect Account"}
                  </button>
                </div>
              </div>

              {openWithdrawId === w._id && (
                <div style={styles.withdrawDetailsBox}>
                  <div style={styles.withdrawGrid}>
                    <div><b>Wallet ID:</b> <p style={styles.boxP}>{w.walletId || "N/A"}</p></div>
                    <div><b>Live Balance:</b> <p style={styles.boxP}>{money(w.walletBalance)}</p></div>
                    <div><b>Timestamp:</b> <p style={styles.boxP}>{w.createdAt ? new Date(w.createdAt).toLocaleString("en-IN") : "N/A"}</p></div>
                  </div>

                  <div style={styles.bankBox}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#38bdf8", fontSize: "18px" }}>🏦 Target Remittance Account</h4>
                    <p style={styles.bankP}><b>Holder:</b> {w.bankDetails?.accountHolderName || "N/A"}</p>
                    <p style={styles.bankP}><b>Institution:</b> {w.bankDetails?.bankName || "N/A"}</p>
                    <p style={styles.bankP}><b>Account No:</b> <span style={{ color: "#fbbf24", fontFamily: "monospace", fontSize: "18px", fontWeight: "bold" }}>{w.bankDetails?.accountNumber || "N/A"}</span></p>
                    <p style={styles.bankP}><b>IFSC:</b> <span style={{ fontFamily: "monospace", fontSize: "17px", fontWeight: "bold", color: "#fff" }}>{w.bankDetails?.ifscCode || "N/A"}</span></p>
                    <p style={styles.bankP}><b>UPI ID:</b> {w.bankDetails?.upiId || "N/A"}</p>
                  </div>

                  <div style={styles.actionRow}>
                    <button style={styles.approveBtn} onClick={() => withdrawAction(w._id, "Success")}>
                      ✅ Approve Settlement
                    </button>
                    <button style={styles.rejectBtn} onClick={() => withdrawAction(w._id, "Rejected")}>
                      ❌ Decline & Void
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SECTION 5: SYSTEM NOTIFICATIONS & ANNOUNCEMENTS */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📢 App Latest Update Control</h2>
        <textarea
          style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
          placeholder="Type update banner text for OneTime users..."
          value={latestUpdateText}
          onChange={(e) => setLatestUpdateText(e.target.value)}
        />
        <button style={styles.greenFull} onClick={handleSendLatestUpdate}>
          🚀 Send App Update Banner
        </button>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📣 OneTime Global Push Broadcast</h2>
        <input
          style={styles.input}
          placeholder="Notification Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          style={{ ...styles.input, minHeight: "100px", resize: "vertical" }}
          placeholder="Compose notification message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button style={styles.greenFull} onClick={broadcast}>
          🚀 Broadcast Push Message
        </button>
      </div>

      {/* TRANSACTION LEDGER POPUP */}
      {transactionPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupBox}>
            <div style={styles.popupTop}>
              <h2 style={{ margin: 0, fontSize: "24px" }}>📜 OneTime Withdrawal Ledger</h2>
              <button style={styles.closePopup} onClick={() => setTransactionPopup(false)}>✕ Close</button>
            </div>

            <div style={styles.transactionFilterBox}>
              <select style={styles.filterInput} value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)}>
                <option value="all">All Channels</option>
                <option value="pending">State: Pending</option>
                <option value="success">State: Success</option>
                <option value="rejected">State: Rejected</option>
              </select>

              <input style={styles.filterInput} type="date" value={transactionFrom} onChange={(e) => setTransactionFrom(e.target.value)} />
              <input style={styles.filterInput} type="date" value={transactionTo} onChange={(e) => setTransactionTo(e.target.value)} />

              <button style={styles.resetBtn} onClick={() => { setTransactionFilter("all"); setTransactionFrom(""); setTransactionTo(""); }}>
                🔄 Reset
              </button>
            </div>

            <div style={{ marginTop: 20, maxHeight: "45vh", overflowY: "auto" }}>
              {withdraws.length === 0 ? (
                <p style={styles.emptyText}>No matching transaction records.</p>
              ) : (
                withdraws.map((w) => (
                  <div key={w._id} style={styles.transactionItem}>
                    <div>
                      <b style={{ fontSize: "16px", color: "#fff" }}>{w.name || w.email}</b>
                      <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "14px" }}>{w.email}</p>
                      <b style={{ color: "#22c55e", fontSize: "18px" }}>{money(w.amount)}</b>
                    </div>
                    <span style={{
                      ...styles.statusPill, fontSize: "13px", padding: "6px 12px",
                      background: w.status === "Success" ? "rgba(22,163,74,0.2)" : w.status === "Rejected" ? "rgba(225,29,72,0.2)" : "rgba(234,179,8,0.2)",
                      color: w.status === "Success" ? "#22c55e" : w.status === "Rejected" ? "#f87171" : "#facc15"
                    }}>
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

// 100% IDENTICAL STYLING DICTIONARY MATCHING ADMIN DASHBOARD
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0b1329 100%)",
    padding: "30px 20px 100px",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    letterSpacing: "0.3px"
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white"
  },
  loaderCard: {
    background: "#0f172a",
    padding: "50px 40px",
    borderRadius: "28px",
    textAlign: "center",
    border: "1px solid #334155",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
  },
  loaderLogo: {
    color: "#22c55e",
    fontSize: "38px",
    margin: "0 0 25px 0",
    fontWeight: "800"
  },
  spinner: {
    width: "55px",
    height: "55px",
    border: "5px solid #1e293b",
    borderTop: "5px solid #22c55e",
    borderRadius: "50%",
    margin: "0 auto 25px",
    animation: "spin 1s linear infinite"
  },
  title: {
    textAlign: "center",
    fontSize: "34px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 35px 0",
    textShadow: "0 2px 10px rgba(255,255,255,0.1)"
  },
  error: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1.5px solid #ef4444",
    color: "#fee2e2",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "25px",
    fontSize: "16px",
    fontWeight: "700"
  },
  quick: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
    marginBottom: "35px"
  },
  navBtn: {
    background: "#0f172a",
    border: "1.5px solid #334155",
    padding: "18px 14px",
    borderRadius: "16px",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "35px"
  },
  card: {
    background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
    padding: "24px 20px",
    borderRadius: "24px",
    textAlign: "center",
    border: "1.5px solid #334155",
    boxShadow: "0 12px 20px -3px rgba(0, 0, 0, 0.4)"
  },
  cardLabel: {
    margin: "0 0 10px 0",
    color: "#cbd5e1",
    fontSize: "15px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
  },
  cardVal: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800"
  },
  chartBox: {
    background: "#0f172a",
    padding: "24px",
    borderRadius: "24px",
    border: "1.5px solid #334155",
    marginBottom: "35px"
  },
  section: {
    background: "#0f172a",
    padding: "26px",
    borderRadius: "26px",
    border: "1.5px solid #334155",
    marginBottom: "35px",
    boxShadow: "0 18px 30px -5px rgba(0, 0, 0, 0.3)"
  },
  sectionTitle: {
    margin: "0 0 20px 0",
    fontSize: "24px",
    fontWeight: "800",
    color: "#ffffff",
    borderBottom: "2px solid #1e293b",
    paddingBottom: "10px"
  },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "1.5px solid #334155",
    background: "#020617",
    color: "white",
    marginTop: "14px",
    boxSizing: "border-box",
    fontSize: "16px"
  },
  greenFull: {
    width: "100%",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    padding: "16px",
    borderRadius: "16px",
    color: "#020617",
    fontWeight: "800",
    marginTop: "18px",
    cursor: "pointer",
    fontSize: "16px"
  },
  viewTransactionBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
    border: "none",
    color: "white",
    padding: "12px 20px",
    borderRadius: "14px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer"
  },
  withdrawSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "20px"
  },
  summaryMini: {
    background: "#020617",
    padding: "16px",
    borderRadius: "16px",
    border: "1.5px solid #334155"
  },
  withdrawMiniCard: {
    background: "linear-gradient(180deg, #111827 0%, #0f172a 100%)",
    border: "1.5px solid #334155",
    borderRadius: "22px",
    padding: "20px",
    marginTop: "15px"
  },
  withdrawMiniTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  amountText: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#22c55e",
    margin: "6px 0 0 0"
  },
  statusPill: {
    padding: "6px 14px",
    borderRadius: "12px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  viewDetailsBtn: {
    marginTop: "14px",
    background: "rgba(59,130,246,0.15)",
    border: "1.5px solid rgba(59,130,246,0.4)",
    color: "#60a5fa",
    padding: "10px 16px",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer"
  },
  withdrawDetailsBox: {
    marginTop: "20px",
    padding: "20px",
    borderRadius: "20px",
    background: "#020617",
    border: "1.5px solid #1e3a8a"
  },
  withdrawGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    fontSize: "15px"
  },
  boxP: {
    margin: "6px 0 0 0",
    color: "#f1f5f9",
    fontWeight: "600",
    fontSize: "16px"
  },
  bankBox: {
    background: "rgba(15,23,42,0.8)",
    padding: "18px",
    borderRadius: "18px",
    marginTop: "20px",
    border: "1.5px solid #334155"
  },
  bankP: {
    margin: "8px 0",
    fontSize: "16px",
    color: "#e2e8f0"
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "20px"
  },
  approveBtn: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    color: "#020617",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "15px"
  },
  rejectBtn: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "15px"
  },
  tableWrap: {
    overflowX: "auto",
    marginTop: "15px",
    background: "#020617",
    borderRadius: "16px",
    border: "1.5px solid #334155"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px"
  },
  th: {
    background: "#0f172a",
    padding: "16px",
    color: "#ffffff",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "700",
    textTransform: "uppercase",
    borderBottom: "2px solid #334155"
  },
  tr: {
    borderBottom: "1px solid #1e293b"
  },
  td: {
    padding: "16px",
    fontSize: "15px",
    color: "#f1f5f9"
  },
  utrBadge: {
    background: "#020617",
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1.5px solid #475569",
    color: "#fbbf24",
    fontFamily: "monospace",
    fontWeight: "bold",
    fontSize: "15px"
  },
  smallGreen: {
    background: "#22c55e",
    border: "none",
    color: "#020617",
    padding: "8px 14px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px"
  },
  smallRed: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "8px 14px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px"
  },
  emptyText: {
    color: "#cbd5e1",
    textAlign: "center",
    fontSize: "16px",
    margin: "20px 0",
    fontWeight: "500"
  },
  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.9)",
    backdropFilter: "blur(5px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  popupBox: {
    width: "min(900px,100%)",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#0f172a",
    color: "white",
    borderRadius: "28px",
    padding: "30px",
    border: "1.5px solid #334155",
    boxShadow: "0 25px 50px -12 rgba(0,0,0,0.6)"
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
    borderRadius: "12px",
    padding: "10px 18px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px"
  },
  transactionFilterBox: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr auto",
    gap: "10px",
    marginTop: "25px"
  },
  filterInput: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1.5px solid #334155",
    background: "#020617",
    color: "white",
    boxSizing: "border-box",
    fontSize: "14px"
  },
  resetBtn: {
    background: "#2563eb",
    border: "none",
    color: "white",
    padding: "14px 18px",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px"
  },
  transactionItem: {
    background: "#020617",
    border: "1.5px solid #334155",
    borderRadius: "16px",
    padding: "18px",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center"
  }
};
