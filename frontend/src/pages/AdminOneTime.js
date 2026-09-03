import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API } from "../config";

export default function AdminOneTime() {
  const token = localStorage.getItem("token");

  // Core Data States
  const [users, setUsers] = useState([]);
  const [cash, setCash] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI Popups & Filters
  const [openWithdrawId, setOpenWithdrawId] = useState(null);
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  // OneTime Wallet Adjust State
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState("add");
  const [adjustReason, setAdjustReason] = useState("");

  // Assign OneTime Investment State
  const [investEmail, setInvestEmail] = useState("");
  const [investAmount, setInvestAmount] = useState("");
  const [investDuration, setInvestDuration] = useState("15 Days");
  const [investDailyReturn, setInvestDailyReturn] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const safeJson = async (res) => {
    const text = await res.text();
    if (text.trim().startsWith("<")) {
      return { success: false, msg: "Invalid API Endpoint" };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, msg: "JSON Parse Error" };
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
      toast.error(d.msg);
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  const apiGet = async (path) => {
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { authorization: token || "" }
      });
      const d = await safeJson(res);
      if (checkAuthError(d)) return null;
      return d;
    } catch {
      return null;
    }
  };

  const apiPost = async (path, body) => {
    try {
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
    } catch {
      return { success: false, msg: "Network connection failed" };
    }
  };

  const loadData = async () => {
    setLoading(true);

    // 1. Fetch Users
    const uData = await apiGet("/all-users");
    setUsers(Array.isArray(uData) ? uData : uData?.users || []);

    // 2. Fetch OneTime Deposit / Add Fund Requests
    const cData = await apiGet("/admin/onetime-cash-requests");
    setCash(Array.isArray(cData) ? cData : cData?.requests || []);

    // 3. Fetch OneTime Withdraw Requests
    const wData = await apiGet("/admin/onetime-withdraw-requests");
    setWithdraws(
      wData?.success && Array.isArray(wData.requests)
        ? wData.requests
        : Array.isArray(wData)
        ? wData
        : []
    );

    // 4. Fetch OneTime Investments
    const iData = await apiGet("/admin/onetime-investments");
    setInvestments(
      iData?.success && Array.isArray(iData.investments)
        ? iData.investments
        : Array.isArray(iData)
        ? iData
        : []
    );

    setLoading(false);
  };

  // ACTIONS

  // Approve / Reject Cash Requests
  const approveCash = async (id) => {
    const d = await apiPost("/admin/onetime-approve-cash", { requestId: id });
    if (d?.success || d?.msg) {
      toast.success(d.msg || "OneTime Fund Approved!");
      loadData();
    } else {
      toast.error(d?.msg || "Failed to approve");
    }
  };

  const rejectCash = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    const d = await apiPost("/admin/onetime-reject-cash", { requestId: id, reason });
    if (d?.success || d?.msg) {
      toast.info(d.msg || "Fund Request Rejected");
      loadData();
    }
  };

  // Approve / Reject Withdraw Requests
  const withdrawAction = async (id, status) => {
    let rejectReason = "";
    if (status === "Rejected") {
      rejectReason = prompt("Enter rejection reason:") || "Rejected by admin";
    }

    const d = await apiPost("/admin/onetime-withdraw-action", {
      id,
      status,
      rejectReason
    });

    if (d?.success || d?.msg) {
      toast.success(d.msg || `Withdrawal ${status}`);
      loadData();
    } else {
      toast.error(d?.msg || "Action failed");
    }
  };

  // OneTime Wallet Adjustment Action
  const handleWalletAdjust = async () => {
    if (!adjustEmail || !adjustAmount) {
      toast.info("User Email and Amount are required");
      return;
    }

    const d = await apiPost("/admin/onetime-adjust-wallet", {
      email: adjustEmail,
      amount: Number(adjustAmount),
      type: adjustType,
      reason: adjustReason || "OneTime Manual Adjustment"
    });

    if (d?.success || d?.msg) {
      toast.success(d.msg || "OneTime Wallet Updated!");
      setAdjustEmail("");
      setAdjustAmount("");
      setAdjustReason("");
      loadData();
    } else {
      toast.error(d?.msg || "Wallet adjustment failed");
    }
  };

  // Assign OneTime Investment Action
  const handleAssignInvestment = async () => {
    if (!investEmail || !investAmount) {
      toast.info("User Email and Amount are required");
      return;
    }

    const d = await apiPost("/admin/onetime-create-investment", {
      email: investEmail,
      amount: Number(investAmount),
      duration: investDuration,
      dailyReturn: Number(investDailyReturn || 0)
    });

    if (d?.success || d?.msg) {
      toast.success(d.msg || "OneTime Plan Assigned!");
      setInvestEmail("");
      setInvestAmount("");
      setInvestDailyReturn("");
      loadData();
    } else {
      toast.error(d?.msg || "Assignment failed");
    }
  };

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const formatImage = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${API}/uploads/${path}`;
  };

  // Filter Computations
  const pendingWithdraws = withdraws.filter((w) => w.status === "Pending");
  const pendingCashRequests = cash.filter((c) => c.status === "pending" || c.status === "Pending" || !c.status);
  const activeInvestments = investments.filter((i) => i.status === "Active" || !i.status);

  const totalInvestedAmount = investments
    .filter((i) => i.status !== "Cancelled")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const totalDisbursedWithdraw = withdraws
    .filter((w) => w.status === "Success" || w.status === "Approved")
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const filteredUsers = users.filter((u) =>
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loaderCard}>
          <div style={styles.spinner}></div>
          <h2>Loading OneTime Admin Data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚡ OneTime Management Admin</h1>

      {/* STATS METRICS GRID */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Network Users</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8" }}>{users.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Active OneTime Plans</p>
          <h2 style={{ ...styles.cardVal, color: "#a855f7" }}>{activeInvestments.length}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Total OneTime Invested</p>
          <h2 style={{ ...styles.cardVal, color: "#22c55e" }}>{money(totalInvestedAmount)}</h2>
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
          <p style={styles.cardLabel}>Total OneTime Disbursed</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8" }}>{money(totalDisbursedWithdraw)}</h2>
        </div>
      </div>

      {/* SECTION 1: ONETIME USER DIRECTORY & WALLET STATUS */}
      <div style={styles.section}>
        <div style={styles.sectionTop}>
          <h2 style={styles.sectionTitle}>👥 OneTime User Accounts Directory</h2>
          <input
            style={{ ...styles.input, marginTop: 0, width: "260px" }}
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
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ ...styles.td, textAlign: "center" }}>No users found</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  // STRIKT ONETIME WALLET BALANCE SELECTION
                  const oneTimeBal = u.onetimeWallet ?? u.oneTimeBalance ?? u.onetimeBalance ?? 0;
                  const oneTimeInv = u.onetimeTotalInvested ?? u.oneTimeTotalInvested ?? 0;

                  return (
                    <tr key={u._id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{u.name || "User"}</strong>
                        <div style={{ color: "#94a3b8", fontSize: "12px" }}>{u.email}</div>
                      </td>
                      <td style={{ ...styles.td, color: "#38bdf8", fontWeight: "bold" }}>
                        {money(oneTimeBal)}
                      </td>
                      <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>
                        {money(oneTimeInv)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: ONETIME CASH DEPOSIT REQUESTS */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📥 OneTime Add Fund Requests</h2>
        {pendingCashRequests.length === 0 ? (
          <p style={styles.emptyText}>No pending deposit requests.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Email</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Txn / UTR ID</th>
                  <th style={styles.th}>Proof</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCashRequests.map((r) => (
                  <tr key={r._id} style={styles.tr}>
                    <td style={styles.td}>{r.email}</td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>{money(r.amount)}</td>
                    <td style={styles.td}>
                      <span style={styles.utrBadge}>{r.transactionId || r.txnId || "N/A"}</span>
                    </td>
                    <td style={styles.td}>
                      {r.screenshot ? (
                        <button
                          style={styles.smallBlue}
                          onClick={() => setScreenshotModal(formatImage(r.screenshot))}
                        >
                          🖼 Screenshot
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>None</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button style={{ ...styles.smallGreen, marginRight: "6px" }} onClick={() => approveCash(r._id)}>
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

      {/* SECTION 3: ONETIME WITHDRAW REQUESTS */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💰 OneTime Withdrawal Requests</h2>
        {pendingWithdraws.length === 0 ? (
          <p style={styles.emptyText}>No pending payout requests.</p>
        ) : (
          pendingWithdraws.map((w) => (
            <div key={w._id} style={styles.withdrawMiniCard}>
              <div style={styles.withdrawMiniTop}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>{w.email}</h3>
                  <p style={styles.amountText}>{money(w.amount)}</p>
                </div>
                <button
                  style={styles.viewDetailsBtn}
                  onClick={() => setOpenWithdrawId(openWithdrawId === w._id ? null : w._id)}
                >
                  {openWithdrawId === w._id ? "Hide Details" : "Inspect Bank Details"}
                </button>
              </div>

              {openWithdrawId === w._id && (
                <div style={styles.withdrawDetailsBox}>
                  <p style={styles.bankP}><b>Holder Name:</b> {w.bankDetails?.holderName || w.bankDetails?.accountHolderName || "N/A"}</p>
                  <p style={styles.bankP}><b>Bank Name:</b> {w.bankDetails?.bankName || "N/A"}</p>
                  <p style={styles.bankP}><b>Account No:</b> <span style={{ color: "#fbbf24", fontFamily: "monospace" }}>{w.bankDetails?.accountNumber || "N/A"}</span></p>
                  <p style={styles.bankP}><b>IFSC:</b> {w.bankDetails?.ifsc || w.bankDetails?.ifscCode || "N/A"}</p>
                  <p style={styles.bankP}><b>UPI ID:</b> {w.bankDetails?.upiId || "N/A"}</p>

                  <div style={styles.actionRow}>
                    <button style={styles.approveBtn} onClick={() => withdrawAction(w._id, "Success")}>
                      ✅ Approve Settlement
                    </button>
                    <button style={styles.rejectBtn} onClick={() => withdrawAction(w._id, "Rejected")}>
                      ❌ Reject & Refund
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SECTION 4: ADJUST ONETIME WALLET */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>💳 OneTime Wallet Balance Control</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "10px", marginTop: "10px" }}>
          <select
            style={{ ...styles.input, marginTop: 0 }}
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value)}
          >
            <option value="add">➕ Add to OneTime Wallet</option>
            <option value="subtract">➖ Subtract from OneTime Wallet</option>
          </select>
          <input
            style={{ ...styles.input, marginTop: 0 }}
            placeholder="Adjustment Reason..."
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />
        </div>

        <button style={styles.greenFull} onClick={handleWalletAdjust}>
          Update OneTime Wallet
        </button>
      </div>

      {/* SECTION 5: ASSIGN ONETIME INVESTMENT */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 Assign Manual OneTime Investment Plan</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
          <input
            style={{ ...styles.input, marginTop: 0 }}
            placeholder="Duration (e.g. 15 Days)"
            value={investDuration}
            onChange={(e) => setInvestDuration(e.target.value)}
          />
          <input
            style={{ ...styles.input, marginTop: 0 }}
            type="number"
            placeholder="Daily Return (₹)..."
            value={investDailyReturn}
            onChange={(e) => setInvestDailyReturn(e.target.value)}
          />
        </div>
        <button style={styles.greenFull} onClick={handleAssignInvestment}>
          Create OneTime Plan
        </button>
      </div>

      {/* SCREENSHOT PROOF MODAL */}
      {screenshotModal && (
        <div style={styles.popupOverlay} onClick={() => setScreenshotModal(null)}>
          <div style={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.popupTop}>
              <h3 style={{ margin: 0 }}>Payment Proof</h3>
              <button style={styles.closePopup} onClick={() => setScreenshotModal(null)}>✕ Close</button>
            </div>
            <img
              src={screenshotModal}
              alt="Deposit Screenshot"
              style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", marginTop: "15px", borderRadius: "10px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// COMPACT STYLING
const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    padding: "20px 14px",
    color: "#f8fafc",
    fontFamily: "system-ui, -apple-system, sans-serif"
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
    padding: "30px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px solid #334155"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #1e293b",
    borderTop: "3px solid #22c55e",
    borderRadius: "50%",
    margin: "0 auto 14px"
  },
  title: {
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 20px 0"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "20px"
  },
  card: {
    background: "#0f172a",
    padding: "14px 12px",
    borderRadius: "14px",
    textAlign: "center",
    border: "1px solid #334155"
  },
  cardLabel: {
    margin: "0 0 6px 0",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase"
  },
  cardVal: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800"
  },
  section: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #334155",
    marginBottom: "20px"
  },
  sectionTitle: {
    margin: "0 0 14px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff"
  },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
    boxSizing: "border-box",
    fontSize: "13px"
  },
  greenFull: {
    width: "100%",
    background: "#22c55e",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    color: "#020617",
    fontWeight: "800",
    marginTop: "12px",
    cursor: "pointer",
    fontSize: "14px"
  },
  withdrawMiniCard: {
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "12px",
    marginTop: "10px"
  },
  withdrawMiniTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  amountText: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#22c55e",
    margin: "4px 0 0 0"
  },
  viewDetailsBtn: {
    background: "#1e293b",
    border: "1px solid #475569",
    color: "#38bdf8",
    padding: "6px 10px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer"
  },
  withdrawDetailsBox: {
    marginTop: "12px",
    padding: "12px",
    borderRadius: "10px",
    background: "#0f172a",
    border: "1px solid #334155"
  },
  bankP: {
    margin: "4px 0",
    fontSize: "13px",
    color: "#cbd5e1"
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "12px"
  },
  approveBtn: {
    background: "#22c55e",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    color: "#020617",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  },
  rejectBtn: {
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  },
  tableWrap: {
    overflowX: "auto",
    background: "#020617",
    borderRadius: "10px",
    border: "1px solid #334155"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "500px"
  },
  th: {
    background: "#0f172a",
    padding: "10px",
    color: "#94a3b8",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "700",
    borderBottom: "1px solid #334155"
  },
  tr: {
    borderBottom: "1px solid #1e293b"
  },
  td: {
    padding: "10px",
    fontSize: "13px",
    color: "#f1f5f9"
  },
  utrBadge: {
    background: "#0f172a",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #334155",
    color: "#fbbf24",
    fontFamily: "monospace",
    fontSize: "12px"
  },
  smallGreen: {
    background: "#22c55e",
    border: "none",
    color: "#020617",
    padding: "5px 10px",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  },
  smallBlue: {
    background: "#3b82f6",
    border: "none",
    color: "white",
    padding: "5px 10px",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  },
  smallRed: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "5px 10px",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    fontSize: "13px",
    margin: "10px 0"
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
    padding: "16px"
  },
  popupBox: {
    width: "min(500px, 100%)",
    background: "#0f172a",
    color: "white",
    borderRadius: "16px",
    padding: "20px",
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
    borderRadius: "8px",
    padding: "6px 12px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px"
  }
};
