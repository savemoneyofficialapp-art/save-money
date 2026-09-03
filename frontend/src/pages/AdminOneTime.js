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

  // Analytics & Core Data States
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [cash, setCash] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [investments, setInvestments] = useState([]);

  // UI Modals & Popups
  const [openWithdrawId, setOpenWithdrawId] = useState(null);
  const [transactionPopup, setTransactionPopup] = useState(false);
  const [screenshotModal, setScreenshotModal] = useState(null);

  // Filters & Search
  const [userSearch, setUserSearch] = useState("");
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

  // Broadcast & News States
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

      // 1. OneTime Analytics Data
      const ad = await apiGet("/admin/onetime-analytics");
      if (ad) {
        if (ad.msg && !ad.totalInvested) {
          setError(ad.msg);
          setData({});
        } else {
          setData(ad);
        }
      }

      // 2. OneTime Deposit / Add Fund Requests
      const cData = await apiGet("/admin/onetime-cash-requests");
      setCash(Array.isArray(cData) ? cData : (cData?.requests || []));

      // 3. OneTime Withdraw Requests
      const wData = await apiGet("/admin/onetime-withdraw-requests");
      setWithdraws(
        wData?.success && Array.isArray(wData.requests)
          ? wData.requests
          : Array.isArray(wData) ? wData : []
      );

      // 4. All OneTime Investments
      const iData = await apiGet("/admin/onetime-investments");
      setInvestments(
        iData?.success && Array.isArray(iData.investments)
          ? iData.investments
          : Array.isArray(iData) ? iData : []
      );

      // 5. Users List
      const uData = await apiGet("/all-users");
      setUsers(Array.isArray(uData) ? uData : (uData?.users || []));

    } catch (err) {
      console.log("ADMIN ONETIME LOAD ERROR:", err);
      setError("Backend API connection failed. Please check endpoints.");
      setData({});
    }
  };

  // ---------------- ACTION HANDLERS ----------------

  // 1. Add Fund (Cash/Deposit Request) Actions
  const approveCash = async (id) => {
    const d = await apiPost("/admin/onetime-approve-cash", { requestId: id });
    if (!d) return;
    toast.success(d?.msg || "OneTime Fund Request Approved!");
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
      type: adjustType,
      reason: adjustReason || "Administrative Adjustment"
    });

    if (!d) return;

    if (d.success || d.msg) {
      toast.success(d.msg || `Wallet ${adjustType === "add" ? "credited" : "debited"} successfully!`);
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
      toast.success(d.msg || "Investment plan assigned to user!");
      setInvestEmail("");
      setInvestAmount("");
      setInvestDailyReturn("");
      load();
    } else {
      toast.error(d.msg || "Failed to assign investment plan");
    }
  };

  const cancelInvestment = async (investId) => {
    if (!window.confirm("Are you sure you want to cancel this user investment?")) return;

    const d = await apiPost("/admin/onetime-cancel-investment", { id: investId });
    if (!d) return;

    toast.info(d.msg || "Investment cancelled");
    load();
  };

  // 5. Broadcast & News Updates
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

  // Helpers
  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const formatImage = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${API}/uploads/${path}`;
  };

  if (!data) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loaderCard}>
          <h1 style={styles.loaderLogo}>Save Money</h1>
          <div style={styles.spinner}></div>
          <h2>Loading Admin OneTime Dashboard</h2>
          <p>Please wait, fetching live system data...</p>
        </div>
      </div>
    );
  }

  // Filter Computations
  const pendingWithdraws = withdraws.filter((w) => w.status === "Pending");
  const pendingCashRequests = cash.filter((c) => c.status === "pending" || c.status === "Pending" || !c.status);
  const activeInvestments = investments.filter((i) => i.status === "Active" || !i.status);

  const pendingWithdrawAmount = pendingWithdraws.reduce((sum, w) => sum + Number(w.amount || 0), 0);
  const totalWithdrawAmount = withdraws
    .filter((w) => w.status === "Success" || w.status === "approved")
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const filteredUsers = users.filter((u) =>
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const chartData = [
    { name: "Total Users", value: users.length || data.totalUsers || 0 },
    { name: "Active Investments", value: activeInvestments.length },
    { name: "Pending Topups", value: pendingCashRequests.length },
    { name: "Pending Withdraws", value: pendingWithdraws.length }
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚡ Admin OneTime Management Hub</h1>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {/* QUICK NAVIGATION */}
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
          <p style={styles.cardLabel}>Network Users</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8" }}>{users.length || data.totalUsers || 0}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Active OneTime Plans</p>
          <h2 style={{ ...styles.cardVal, color: "#a855f7" }}>{activeInvestments.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Total OneTime Invested</p>
          <h2 style={{ ...styles.cardVal, color: "#22c55e" }}>
            {money(data.totalInvested || data.totalInvestment || 0)}
          </h2>
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
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: '600' }} />
            <YAxis stroke="#cbd5e1" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: '600' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '10px', color: '#fff' }} />
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

      {/* SECTION 1: USER STATUS & DIRECTORY */}
      <div style={styles.section}>
        <div style={styles.sectionTop}>
          <h2 style={styles.sectionTitle}>👥 User Accounts Status Overview</h2>
          <input
            style={{ ...styles.input, marginTop: 0, width: "300px" }}
            placeholder="🔍 Search User Email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <p style={styles.emptyText}>No matching users found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Account</th>
                  <th style={styles.th}>Wallet Balance</th>
                  <th style={styles.th}>Total Invested</th>
                  <th style={styles.th}>Account Status</th>
                  <th style={styles.th}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{u.name || "User"}</strong>
                      <div style={{ color: "#94a3b8", fontSize: "13px" }}>{u.email}</div>
                    </td>
                    <td style={{ ...styles.td, color: "#38bdf8", fontWeight: "bold" }}>
                      {money(u.availableBalance ?? u.wallet ?? 0)}
                    </td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>
                      {money(u.onetimeTotalInvested ?? u.totalInvested ?? 0)}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold",
                        background: u.isBlocked ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                        color: u.isBlocked ? "#f87171" : "#22c55e"
                      }}>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{ ...styles.smallGreen, marginRight: "6px" }}
                        onClick={() => setAdjustEmail(u.email)}
                      >
                        Adjust Wallet
                      </button>
                      <button
                        style={styles.smallBlue}
                        onClick={() => setInvestEmail(u.email)}
                      >
                        Assign Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: ADD FUND REQUESTS (DEPOSIT PROOFS) */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📥 Add Fund Requests (Deposit Ledger)</h2>
        {cash.length === 0 ? (
          <p style={styles.emptyText}>📥 No pending fund requests in queue.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Account</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>UTR / Txn ID</th>
                  <th style={styles.th}>Screenshot Proof</th>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cash.map((r) => (
                  <tr key={r._id} style={styles.tr}>
                    <td style={styles.td}>{r.email}</td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold", fontSize: "16px" }}>
                      {money(r.amount)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.utrBadge}>
                        {r.transactionId || r.txnId || "N/A"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {r.screenshot ? (
                        <button
                          style={styles.smallBlue}
                          onClick={() => setScreenshotModal(formatImage(r.screenshot))}
                        >
                          🖼 View Proof
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>No Image</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "N/A"}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "5px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold",
                        background: r.status === "approved" || r.status === "Success" ? "rgba(34,197,94,0.2)" : r.status === "rejected" || r.status === "Rejected" ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)",
                        color: r.status === "approved" || r.status === "Success" ? "#22c55e" : r.status === "rejected" || r.status === "Rejected" ? "#f87171" : "#facc15",
                      }}>
                        {r.status || "Pending"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {(r.status === "pending" || r.status === "Pending" || !r.status) ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={styles.smallGreen} onClick={() => approveCash(r._id)}>Approve</button>
                          <button style={styles.smallRed} onClick={() => rejectCash(r._id)}>Reject</button>
                        </div>
                      ) : (
                        <span style={{ color: "#cbd5e1", fontSize: "13px" }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: WITHDRAW REQUESTS */}
      <div style={styles.section}>
        <div style={styles.sectionTop}>
          <div>
            <h2 style={styles.sectionTitle}>💰 Pending Withdrawal Requests</h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "4px 0 0 0" }}>
              Approve or decline payout requests with bank verification.
            </p>
          </div>
          <button style={styles.viewTransactionBtn} onClick={() => setTransactionPopup(true)}>
            📜 Withdrawal Ledger
          </button>
        </div>

        <div style={styles.withdrawSummary}>
          <div style={styles.summaryMini}>
            <span style={{ color: "#cbd5e1", fontSize: "13px" }}>Queue Count</span>
            <h3 style={{ margin: "4px 0 0 0", color: "#f43f5e", fontSize: "20px" }}>{pendingWithdraws.length} Req</h3>
          </div>
          <div style={styles.summaryMini}>
            <span style={{ color: "#cbd5e1", fontSize: "13px" }}>Pending Amount</span>
            <h3 style={{ margin: "4px 0 0 0", color: "#22c55e", fontSize: "20px" }}>{money(pendingWithdrawAmount)}</h3>
          </div>
        </div>

        {pendingWithdraws.length === 0 ? (
          <p style={styles.emptyText}>🎉 No pending withdraw requests in queue.</p>
        ) : (
          pendingWithdraws.map((w) => (
            <div key={w._id} style={styles.withdrawMiniCard}>
              <div style={styles.withdrawMiniTop}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff" }}>{w.name || "User Account"}</h3>
                  <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "14px" }}>{w.email}</p>
                  <p style={styles.amountText}>{money(w.amount)}</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ ...styles.statusPill, background: "rgba(234,179,8,0.25)", color: "#facc15", fontSize: "13px" }}>
                    Pending Action
                  </span>
                  <br />
                  <button
                    style={styles.viewDetailsBtn}
                    onClick={() => setOpenWithdrawId(openWithdrawId === w._id ? null : w._id)}
                  >
                    {openWithdrawId === w._id ? "🔼 Hide Bank Details" : "👀 Inspect Bank Account"}
                  </button>
                </div>
              </div>

              {openWithdrawId === w._id && (
                <div style={styles.withdrawDetailsBox}>
                  <div style={styles.withdrawGrid}>
                    <div><b>Wallet Balance:</b> <p style={styles.boxP}>{money(w.walletBalance)}</p></div>
                    <div><b>Timestamp:</b> <p style={styles.boxP}>{w.createdAt ? new Date(w.createdAt).toLocaleString("en-IN") : "N/A"}</p></div>
                  </div>

                  <div style={styles.bankBox}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#38bdf8", fontSize: "16px" }}>🏦 Remittance Bank Details</h4>
                    <p style={styles.bankP}><b>Account Holder:</b> {w.bankDetails?.holderName || w.bankDetails?.accountHolderName || "N/A"}</p>
                    <p style={styles.bankP}><b>Bank Name:</b> {w.bankDetails?.bankName || "N/A"}</p>
                    <p style={styles.bankP}><b>Account Number:</b> <span style={{ color: "#fbbf24", fontFamily: "monospace", fontSize: "16px", fontWeight: "bold" }}>{w.bankDetails?.accountNumber || "N/A"}</span></p>
                    <p style={styles.bankP}><b>IFSC Code:</b> <span style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: "bold", color: "#fff" }}>{w.bankDetails?.ifsc || w.bankDetails?.ifscCode || "N/A"}</span></p>
                    <p style={styles.bankP}><b>UPI ID:</b> {w.bankDetails?.upiId || "N/A"}</p>
                  </div>

                  <div style={styles.actionRow}>
                    <button style={styles.approveBtn} onClick={() => withdrawAction(w._id, "Success")}>
                      ✅ Approve Settlement
                    </button>
                    <button style={styles.rejectBtn} onClick={() => withdrawAction(w._id, "Rejected")}>
                      ❌ Reject & Refund Balance
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SECTION 4: WALLET ADJUSTMENT CONTROL */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💳 OneTime Wallet Balance Adjustment</h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "-10px 0 15px 0" }}>
          Manually credit or debit wallet balance for any target user.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input
            style={styles.input}
            placeholder="Target User Email..."
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
            placeholder="Reason (e.g. Refund, Bonus, Adjustment)..."
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />
        </div>

        <button style={styles.greenFull} onClick={handleWalletAdjust}>
          ⚡ Execute Wallet Adjustment
        </button>
      </div>

      {/* SECTION 5: USER INVESTMENT CONTROL */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 OneTime Investment Control</h2>

        {/* Manual Plan Assignment */}
        <div style={{ background: "#020617", padding: "18px", borderRadius: "16px", border: "1px solid #334155", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#38bdf8", fontSize: "16px" }}>➕ Assign Manual Investment Plan</h3>
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
            🚀 Force Assign Investment
          </button>
        </div>

        {/* Investments Registry Table */}
        <h3 style={{ color: "#ffffff", fontSize: "16px", margin: "15px 0 10px 0" }}>📜 Live Investments Registry</h3>
        {investments.length === 0 ? (
          <p style={styles.emptyText}>No active investments found in database.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Account</th>
                  <th style={styles.th}>Capital Amount</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Daily Profit</th>
                  <th style={styles.th}>Status</th>
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
                        padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold",
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
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>Terminated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 6: SYSTEM UPDATES & BROADCAST */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📢 Latest Update News Control</h2>
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
        <h2 style={styles.sectionTitle}>📣 Global Push Broadcast</h2>
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

      {/* SCREENSHOT PROOF MODAL */}
      {screenshotModal && (
        <div style={styles.popupOverlay} onClick={() => setScreenshotModal(null)}>
          <div style={{ ...styles.popupBox, maxWidth: "600px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.popupTop}>
              <h3 style={{ margin: 0 }}>🖼 Payment Screenshot Proof</h3>
              <button style={styles.closePopup} onClick={() => setScreenshotModal(null)}>✕ Close</button>
            </div>
            <img
              src={screenshotModal}
              alt="Deposit Proof"
              style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", marginTop: "15px", borderRadius: "12px" }}
            />
          </div>
        </div>
      )}

      {/* TRANSACTION LEDGER POPUP */}
      {transactionPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupBox}>
            <div style={styles.popupTop}>
              <h2 style={{ margin: 0, fontSize: "22px" }}>📜 Withdrawal Ledger</h2>
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
                      <b style={{ fontSize: "15px", color: "#fff" }}>{w.name || w.email}</b>
                      <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "13px" }}>{w.email}</p>
                      <b style={{ color: "#22c55e", fontSize: "16px" }}>{money(w.amount)}</b>
                    </div>
                    <span style={{
                      ...styles.statusPill, fontSize: "12px", padding: "6px 12px",
                      background: w.status === "Success" || w.status === "Approved" ? "rgba(22,163,74,0.2)" : w.status === "Rejected" ? "rgba(225,29,72,0.2)" : "rgba(234,179,8,0.2)",
                      color: w.status === "Success" || w.status === "Approved" ? "#22c55e" : w.status === "Rejected" ? "#f87171" : "#facc15"
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

// COMPLETE STYLING DICTIONARY
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0b1329 100%)",
    padding: "24px 16px 80px",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
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
    padding: "40px 30px",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px solid #334155"
  },
  loaderLogo: {
    color: "#22c55e",
    fontSize: "34px",
    margin: "0 0 20px 0",
    fontWeight: "800"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #1e293b",
    borderTop: "4px solid #22c55e",
    borderRadius: "50%",
    margin: "0 auto 20px"
  },
  title: {
    textAlign: "center",
    fontSize: "28px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 25px 0"
  },
  error: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1.5px solid #ef4444",
    color: "#fee2e2",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "20px",
    fontSize: "15px",
    fontWeight: "600"
  },
  quick: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "25px"
  },
  navBtn: {
    background: "#0f172a",
    border: "1.5px solid #334155",
    padding: "14px 10px",
    borderRadius: "14px",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "25px"
  },
  card: {
    background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
    padding: "20px 16px",
    borderRadius: "20px",
    textAlign: "center",
    border: "1.5px solid #334155"
  },
  cardLabel: {
    margin: "0 0 8px 0",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "700",
    textTransform: "uppercase"
  },
  cardVal: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "800"
  },
  chartBox: {
    background: "#0f172a",
    padding: "20px",
    borderRadius: "20px",
    border: "1.5px solid #334155",
    marginBottom: "25px"
  },
  section: {
    background: "#0f172a",
    padding: "22px",
    borderRadius: "22px",
    border: "1.5px solid #334155",
    marginBottom: "25px"
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "20px",
    fontWeight: "800",
    color: "#ffffff"
  },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1.5px solid #334155",
    background: "#020617",
    color: "white",
    marginTop: "10px",
    boxSizing: "border-box",
    fontSize: "14px"
  },
  greenFull: {
    width: "100%",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    color: "#020617",
    fontWeight: "800",
    marginTop: "16px",
    cursor: "pointer",
    fontSize: "15px"
  },
  viewTransactionBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
    border: "none",
    color: "white",
    padding: "10px 16px",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer"
  },
  withdrawSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px"
  },
  summaryMini: {
    background: "#020617",
    padding: "14px",
    borderRadius: "14px",
    border: "1.5px solid #334155"
  },
  withdrawMiniCard: {
    background: "linear-gradient(180deg, #111827 0%, #0f172a 100%)",
    border: "1.5px solid #334155",
    borderRadius: "18px",
    padding: "16px",
    marginTop: "12px"
  },
  withdrawMiniTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  amountText: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#22c55e",
    margin: "4px 0 0 0"
  },
  statusPill: {
    padding: "4px 10px",
    borderRadius: "10px",
    fontWeight: "700"
  },
  viewDetailsBtn: {
    marginTop: "10px",
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.4)",
    color: "#60a5fa",
    padding: "8px 12px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer"
  },
  withdrawDetailsBox: {
    marginTop: "16px",
    padding: "16px",
    borderRadius: "16px",
    background: "#020617",
    border: "1px solid #1e3a8a"
  },
  withdrawGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    fontSize: "14px"
  },
  boxP: {
    margin: "4px 0 0 0",
    color: "#f1f5f9",
    fontWeight: "600"
  },
  bankBox: {
    background: "rgba(15,23,42,0.8)",
    padding: "14px",
    borderRadius: "14px",
    marginTop: "14px",
    border: "1px solid #334155"
  },
  bankP: {
    margin: "6px 0",
    fontSize: "14px",
    color: "#e2e8f0"
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "16px"
  },
  approveBtn: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    borderRadius: "12px",
    padding: "12px",
    color: "#020617",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "14px"
  },
  rejectBtn: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    border: "none",
    borderRadius: "12px",
    padding: "12px",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "14px"
  },
  tableWrap: {
    overflowX: "auto",
    marginTop: "12px",
    background: "#020617",
    borderRadius: "14px",
    border: "1.5px solid #334155"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px"
  },
  th: {
    background: "#0f172a",
    padding: "14px",
    color: "#ffffff",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "700",
    textTransform: "uppercase",
    borderBottom: "1.5px solid #334155"
  },
  tr: {
    borderBottom: "1px solid #1e293b"
  },
  td: {
    padding: "12px 14px",
    fontSize: "14px",
    color: "#f1f5f9"
  },
  utrBadge: {
    background: "#020617",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #475569",
    color: "#fbbf24",
    fontFamily: "monospace",
    fontWeight: "bold",
    fontSize: "13px"
  },
  smallGreen: {
    background: "#22c55e",
    border: "none",
    color: "#020617",
    padding: "6px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  },
  smallBlue: {
    background: "#3b82f6",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  },
  smallRed: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  },
  emptyText: {
    color: "#cbd5e1",
    textAlign: "center",
    fontSize: "15px",
    margin: "16px 0"
  },
  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.85)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  popupBox: {
    width: "min(800px,100%)",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#0f172a",
    color: "white",
    borderRadius: "24px",
    padding: "24px",
    border: "1.5px solid #334155"
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
    padding: "8px 14px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px"
  },
  transactionFilterBox: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr auto",
    gap: "10px",
    marginTop: "20px"
  },
  filterInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "1.5px solid #334155",
    background: "#020617",
    color: "white",
    boxSizing: "border-box",
    fontSize: "13px"
  },
  resetBtn: {
    background: "#2563eb",
    border: "none",
    color: "white",
    padding: "10px 14px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px"
  },
  transactionItem: {
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "14px",
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  }
};
