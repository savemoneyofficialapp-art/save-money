import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API } from "../config";

export default function AdminOneTime() {
  const token = localStorage.getItem("token");

  // Data States
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [cash, setCash] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [investments, setInvestments] = useState([]);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState("");
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);

  // Popups & Detail View
  const [openWithdrawId, setOpenWithdrawId] = useState(null);

  // Wallet Adjust State (using otbalance)
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState("add");
  const [adjustReason, setAdjustReason] = useState("");

  // Manual User Investment Control State
  const [investEmail, setInvestEmail] = useState("");
  const [investAmount, setInvestAmount] = useState("");
  const [investDuration, setInvestDuration] = useState("15 Days");
  const [investDailyReturn, setInvestDailyReturn] = useState("");

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
      d?.msg === "Admin access only"
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

  // Quick Action Click Handlers (Auto Fill & Scroll)
  const handleQuickAdjust = (email) => {
    setAdjustEmail(email);
    const element = document.getElementById("wallet-control-box");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleQuickAssign = (email) => {
    setInvestEmail(email);
    const element = document.getElementById("assign-plan-box");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Actions
  const approveCash = async (id) => {
    const d = await apiPost("/admin/onetime-approve-cash", { requestId: id });
    if (!d) return;
    toast.success(d?.msg || "Fund Request Approved!");
    load();
  };

  const rejectCash = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    const d = await apiPost("/admin/onetime-reject-cash", { requestId: id, reason });
    if (!d) return;
    toast.info(d?.msg || "Fund request rejected");
    load();
  };

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
      toast.success(d.msg || `Withdrawal marked as ${status}`);
      await load();
    } else {
      toast.error(d?.msg || "Withdraw action failed");
    }
  };

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
      toast.success(d.msg || `otbalance updated!`);
      setAdjustEmail("");
      setAdjustAmount("");
      setAdjustReason("");
      load();
    } else {
      toast.error(d.msg || "Wallet adjustment failed");
    }
  };

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
      toast.success(d.msg || "Investment plan assigned!");
      setInvestEmail("");
      setInvestAmount("");
      setInvestDailyReturn("");
      load();
    } else {
      toast.error(d.msg || "Failed to assign plan");
    }
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
          <h2>Loading Admin Dashboard...</h2>
        </div>
      </div>
    );
  }

  // Filter Data
  const filteredUsers = users.filter((u) =>
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingCashRequests = cash.filter(
    (c) => (c.status || "").toLowerCase() === "pending" || !c.status
  );
  const historyCashRequests = cash.filter(
    (c) => (c.status || "").toLowerCase() !== "pending" && c.status
  );

  const pendingWithdraws = withdraws.filter((w) => w.status === "Pending");
  const historyWithdraws = withdraws.filter((w) => w.status !== "Pending");

  const totalInvestedAmt = investments
    .filter((i) => i.status === "Active" || !i.status)
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const totalDisbursedAmt = withdraws
    .filter((w) => w.status === "Success")
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>⚡ OneTime Management Admin</h1>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {/* TOP ANALYTICS GRID (Like Image 2) */}
      <div style={styles.topGrid}>
        <div style={styles.topCard}>
          <p style={styles.topLabel}>NETWORK USERS</p>
          <h2 style={styles.topVal}>{users.length}</h2>
        </div>
        <div style={styles.topCard}>
          <p style={styles.topLabel}>ACTIVE ONETIME PLANS</p>
          <h2 style={styles.topVal}>{investments.length}</h2>
        </div>
        <div style={styles.topCard}>
          <p style={styles.topLabel}>TOTAL ONETIME INVESTED</p>
          <h2 style={{ ...styles.topVal, color: "#22c55e" }}>{money(totalInvestedAmt)}</h2>
        </div>
        <div style={styles.topCard}>
          <p style={styles.topLabel}>PENDING TOPUPS</p>
          <h2 style={{ ...styles.topVal, color: "#eab308" }}>{pendingCashRequests.length}</h2>
        </div>
        <div style={styles.topCard}>
          <p style={styles.topLabel}>PENDING WITHDRAWS</p>
          <h2 style={{ ...styles.topVal, color: "#ef4444" }}>{pendingWithdraws.length}</h2>
        </div>
        <div style={styles.topCard}>
          <p style={styles.topLabel}>TOTAL ONETIME DISBURSED</p>
          <h2 style={{ ...styles.topVal, color: "#38bdf8" }}>{money(totalDisbursedAmt)}</h2>
        </div>
      </div>

      {/* 1. ONETIME USER ACCOUNTS DIRECTORY (With Adjust & Assign Buttons) */}
      <div style={styles.section}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.sectionTitle}>👥 OneTime User Accounts Directory</h2>
          <input
            style={styles.searchInput}
            placeholder="🔍 Search Email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>User Email</th>
                <th style={styles.th}>OneTime Wallet</th>
                <th style={styles.th}>OneTime Invested</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="4" style={styles.emptyText}>No users found</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: "600", color: "#f8fafc" }}>{u.name || "N/A"}</div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>{u.email}</div>
                    </td>
                    <td style={{ ...styles.td, color: "#38bdf8", fontWeight: "bold" }}>
                      {money(u.otbalance)}
                    </td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>
                      {money(u.oneTimeTotalInvested)}
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          style={styles.adjustBtn}
                          onClick={() => handleQuickAdjust(u.email)}
                        >
                          Adjust Wallet
                        </button>
                        <button
                          style={styles.assignBtn}
                          onClick={() => handleQuickAssign(u.email)}
                        >
                          Assign Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. ONETIME ADD FUND REQUESTS (LIVE PENDING & VIEW HISTORY) */}
      <div style={styles.section}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.sectionTitle}>📥 OneTime Add Fund Requests</h2>
          <button
            style={styles.historyToggleBtn}
            onClick={() => setShowDepositHistory(!showDepositHistory)}
          >
            {showDepositHistory ? "📋 Show Pending Requests" : "📜 View History"}
          </button>
        </div>

        {showDepositHistory ? (
          /* DEPOSIT HISTORY TABLE */
          <div style={styles.tableWrap}>
            <h4 style={styles.subText}>Historical Approved / Rejected Topups</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Email</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>UTR / Txn ID</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyCashRequests.length === 0 ? (
                  <tr><td colSpan="4" style={styles.emptyText}>No topup history found.</td></tr>
                ) : (
                  historyCashRequests.map((r) => (
                    <tr key={r._id} style={styles.tr}>
                      <td style={styles.td}>{r.email}</td>
                      <td style={{ ...styles.td, color: "#22c55e" }}>{money(r.amount)}</td>
                      <td style={styles.td}>{r.transactionId || r.txnId || "N/A"}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: "4px 8px", borderRadius: "6px", fontWeight: "bold", fontSize: "12px",
                          background: (r.status || "").toLowerCase() === "approved" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                          color: (r.status || "").toLowerCase() === "approved" ? "#22c55e" : "#f87171"
                        }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* LIVE PENDING DEPOSITS */
          pendingCashRequests.length === 0 ? (
            <p style={styles.emptyText}>No pending deposit requests.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>User Email</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>UTR / Txn ID</th>
                    <th style={styles.th}>Proof</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCashRequests.map((r) => (
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
                          "No Proof"
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={styles.smallGreen} onClick={() => approveCash(r._id)}>Accept</button>
                          <button style={styles.smallRed} onClick={() => rejectCash(r._id)}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* 3. ONETIME WITHDRAWAL REQUESTS (LIVE PENDING & VIEW HISTORY) */}
      <div style={styles.section}>
        <div style={styles.sectionHeaderRow}>
          <h2 style={styles.sectionTitle}>💰 OneTime Withdrawal Requests</h2>
          <button
            style={styles.historyToggleBtn}
            onClick={() => setShowWithdrawHistory(!showWithdrawHistory)}
          >
            {showWithdrawHistory ? "📋 Show Pending Requests" : "📜 View History"}
          </button>
        </div>

        {showWithdrawHistory ? (
          /* WITHDRAW HISTORY TABLE */
          <div style={styles.tableWrap}>
            <h4 style={styles.subText}>Historical Approved / Rejected Withdrawals</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Email</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyWithdraws.length === 0 ? (
                  <tr><td colSpan="3" style={styles.emptyText}>No withdrawal history found.</td></tr>
                ) : (
                  historyWithdraws.map((w) => (
                    <tr key={w._id} style={styles.tr}>
                      <td style={styles.td}>{w.email}</td>
                      <td style={{ ...styles.td, color: "#f87171" }}>{money(w.amount)}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: "4px 8px", borderRadius: "6px", fontWeight: "bold", fontSize: "12px",
                          background: w.status === "Success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                          color: w.status === "Success" ? "#22c55e" : "#f87171"
                        }}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* LIVE PENDING WITHDRAWALS */
          pendingWithdraws.length === 0 ? (
            <p style={styles.emptyText}>No pending payout requests.</p>
          ) : (
            pendingWithdraws.map((w) => (
              <div key={w._id} style={styles.withdrawCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, color: "#fff" }}>{w.name || "User"} ({w.email})</h4>
                    <p style={{ margin: "4px 0 0 0", color: "#22c55e", fontSize: "18px", fontWeight: "bold" }}>
                      {money(w.amount)}
                    </p>
                  </div>
                  <button
                    style={styles.inspectBtn}
                    onClick={() => setOpenWithdrawId(openWithdrawId === w._id ? null : w._id)}
                  >
                    {openWithdrawId === w._id ? "Hide Details" : "Inspect Bank Details"}
                  </button>
                </div>

                {openWithdrawId === w._id && (
                  <div style={styles.bankBox}>
                    <p><b>Account Holder:</b> {w.bankDetails?.holderName || "N/A"}</p>
                    <p><b>Bank Name:</b> {w.bankDetails?.bankName || "N/A"}</p>
                    <p><b>Account Number:</b> {w.bankDetails?.accountNumber || "N/A"}</p>
                    <p><b>IFSC:</b> {w.bankDetails?.ifsc || "N/A"}</p>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button style={styles.smallGreen} onClick={() => withdrawAction(w._id, "Success")}>
                        ✅ Accept & Pay
                      </button>
                      <button style={styles.smallRed} onClick={() => withdrawAction(w._id, "Rejected")}>
                        ❌ Reject & Refund
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* 4. WALLET CONTROL BOX (TARGET FOR ADJUST WALLET BUTTON) */}
      <div id="wallet-control-box" style={styles.section}>
        <h2 style={styles.sectionTitle}>💳 OneTime Wallet Balance Control</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
          <input
            style={styles.input}
            placeholder="User Email..."
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
            style={styles.input}
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value)}
          >
            <option value="add">➕ Add to OneTime Wallet</option>
            <option value="subtract">➖ Deduct from OneTime Wallet</option>
          </select>
          <input
            style={styles.input}
            placeholder="Adjustment Reason..."
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />
        </div>

        <button style={styles.fullGreenBtn} onClick={handleWalletAdjust}>
          Update OneTime Wallet
        </button>
      </div>

      {/* 5. ASSIGN MANUAL PLAN BOX (TARGET FOR ASSIGN PLAN BUTTON) */}
      <div id="assign-plan-box" style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 Assign Manual OneTime Investment Plan</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
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
            style={styles.input}
            placeholder="Duration (e.g. 15 Days)"
            value={investDuration}
            onChange={(e) => setInvestDuration(e.target.value)}
          />
          <input
            style={styles.input}
            type="number"
            placeholder="Daily Return (₹)..."
            value={investDailyReturn}
            onChange={(e) => setInvestDailyReturn(e.target.value)}
          />
        </div>

        <button style={styles.fullGreenBtn} onClick={handleAssignInvestment}>
          Create OneTime Plan
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#030712", padding: "20px", color: "#f8fafc", fontFamily: "sans-serif" },
  loadingPage: { minHeight: "100vh", background: "#030712", display: "flex", alignItems: "center", justifyContent: "center", color: "white" },
  loaderCard: { background: "#0f172a", padding: "40px", borderRadius: "16px", textAlign: "center" },
  loaderLogo: { color: "#22c55e", fontSize: "32px", margin: "0 0 10px 0" },
  headerTitle: { textAlign: "center", fontSize: "24px", fontWeight: "bold", color: "#ffffff", margin: "0 0 20px 0" },
  error: { background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "12px", borderRadius: "8px", marginBottom: "20px" },

  // Top Analytics Grid
  topGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" },
  topCard: { background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "10px", padding: "14px", textAlign: "center" },
  topLabel: { margin: "0 0 6px 0", color: "#64748b", fontSize: "11px", fontWeight: "bold", letterSpacing: "0.5px" },
  topVal: { margin: 0, fontSize: "20px", fontWeight: "bold", color: "#f8fafc" },

  // Sections
  section: { background: "#0b0f19", padding: "18px", borderRadius: "12px", border: "1px solid #1e293b", marginBottom: "20px" },
  sectionHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  sectionTitle: { margin: 0, fontSize: "16px", color: "#ffffff", fontWeight: "bold" },
  searchInput: { background: "#030712", border: "1px solid #1e293b", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "13px" },

  // Table
  tableWrap: { overflowX: "auto", background: "#030712", borderRadius: "8px", border: "1px solid #1e293b" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0f172a", padding: "10px 12px", color: "#94a3b8", textAlign: "left", fontSize: "12px", borderBottom: "1px solid #1e293b" },
  tr: { borderBottom: "1px solid #111827" },
  td: { padding: "10px 12px", fontSize: "13px", color: "#cbd5e1" },
  emptyText: { color: "#64748b", textAlign: "center", fontSize: "13px", padding: "15px" },
  subText: { color: "#94a3b8", fontSize: "13px", margin: "10px 12px" },

  // Buttons
  adjustBtn: { background: "#22c55e", color: "#030712", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" },
  assignBtn: { background: "#3b82f6", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" },
  historyToggleBtn: { background: "rgba(59,130,246,0.15)", border: "1px solid #3b82f6", color: "#60a5fa", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" },
  smallGreen: { background: "#22c55e", border: "none", color: "#030712", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" },
  smallRed: { background: "#ef4444", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" },
  inspectBtn: { background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" },
  fullGreenBtn: { width: "100%", background: "#22c55e", border: "none", padding: "12px", borderRadius: "8px", color: "#030712", fontWeight: "bold", fontSize: "14px", marginTop: "14px", cursor: "pointer" },

  // Forms & Cards
  input: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #1e293b", background: "#030712", color: "white", fontSize: "13px", boxSizing: "border-box" },
  withdrawCard: { background: "#030712", border: "1px solid #1e293b", borderRadius: "8px", padding: "12px", marginTop: "10px" },
  bankBox: { marginTop: "10px", padding: "10px", background: "#0f172a", borderRadius: "6px", fontSize: "13px" }
};
