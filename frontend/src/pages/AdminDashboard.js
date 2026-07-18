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
  const [autoWithdraws, setAutoWithdraws] = useState([]);

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

      const aw = await apiGet("/admin/auto-withdraws");

      if (aw?.success) {
        setAutoWithdraws(aw.requests || []);
      } else {
        setAutoWithdraws([]);
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

  const autoWithdrawAction = async (id, status) => {
    const d = await apiPost("/admin/auto-withdraw-action", { id, status });
    if (!d) return;
    toast.success(d.msg || "Updated");
    await load();
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

    const clean = String(file).replace(/\\/g, "/");

    if (clean.startsWith("uploads/")) {
      return `${API}/${clean}`;
    }

    return `${API}/uploads/${clean}`;
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
      <h1 style={styles.title}>⚙️ Admin Command Center</h1>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {/* 🧭 কুইক নেভিগেশন লিংক রো */}
      <div style={styles.quick}>
        <button style={styles.navBtn} onClick={() => (window.location.href = "/admin-analytics")}>
          📊 Advanced Analytics
        </button>
        <button style={styles.navBtn} onClick={() => (window.location.href = "/admin-user-control")}>
          👥 User Control
        </button>
        <button style={styles.navBtn} onClick={() => (window.location.href = "/admin-support")}>
          🎫 Support Tickets
        </button>
      </div>

      {/* 📊 প্রিমিয়াম মেট্রিক্স গ্রিড */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Total Network Users</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8" }}>{data.totalUsers || 0}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Registrations Today</p>
          <h2 style={{ ...styles.cardVal, color: "#a855f7" }}>{data.todayUsers || 0}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Total Investment</p>
          <h2 style={{ ...styles.cardVal, color: "#22c55e" }}>{money(data.totalInvestment || 0)}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Liquidity In Wallet</p>
          <h2 style={{ ...styles.cardVal, color: "#eab308" }}>{money(data.totalWallet || 0)}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Verified KYC</p>
          <h2 style={{ ...styles.cardVal, color: "#10b981" }}>{data.kycApproved || 0}</h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Pending Payouts</p>
          <h2 style={{ ...styles.cardVal, color: "#f43f5e" }}>{pendingWithdraws.length}</h2>
        </div>

        <div style={{ ...styles.card, gridColumn: "span 2" }}>
          <p style={styles.cardLabel}>Total Disbursed Withdrawals</p>
          <h2 style={{ ...styles.cardVal, color: "#38bdf8", fontSize: "32px" }}>{money(totalWithdrawAmount)}</h2>
        </div>
      </div>

      {/* 📈 রিয়েল-тайম চার্টবক্স */}
      <div style={styles.chartBox}>
        <h3 style={{ margin: "0 0 15px 0", color: "#f1f5f9", fontSize: "16px", fontWeight: "bold" }}>📈 PLATFORM STATISTICAL CHART</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: '600' }} />
            <YAxis stroke="#cbd5e1" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: '600' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '10px', color: '#fff', fontSize: '15px' }} />
            <Bar dataKey="value" fill="url(#colorGrad)" radius={[6, 6, 0, 0]}>
              <defs>
                <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 📣 ব্রডকাস্ট মেসেজ সেকশন */}
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
          placeholder="Compose notification body or system alert details here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button style={styles.greenFull} onClick={broadcast}>
          🚀 Send Broadcast To All Nodes
        </button>
      </div>

      {/* 💸 ম্যানুয়াল উইথড্র রিকোয়েস্ট সেকশন */}
      <div style={styles.section}>
        <div style={styles.sectionTop}>
          <div>
            <h2 style={styles.sectionTitle}>💰 Pending Manual Settlements</h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "4px 0 0 0", fontWeight: "600" }}>Requires administrative wallet dispatch validation.</p>
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
          <p style={styles.emptyText}>🎉 No pending manual withdraw requests in queue.</p>
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
                    <div><b>Max Eligible:</b> <p style={styles.boxP}>{money(w.withdrawableBalance)}</p></div>
                    <div><b>Timestamp:</b> <p style={styles.boxP}>{w.createdAt ? new Date(w.createdAt).toLocaleString("en-IN") : "N/A"}</p></div>
                  </div>

                  <div style={styles.bankBox}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#38bdf8", fontSize: "18px" }}>🏦 Target Beneficiary Remittance Parameters</h4>
                    <p style={styles.bankP}><b>Holder:</b> {w.bankDetails?.accountHolderName || "N/A"}</p>
                    <p style={styles.bankP}><b>Contact:</b> {w.bankDetails?.mobile || "N/A"}</p>
                    <p style={styles.bankP}><b>Institution:</b> {w.bankDetails?.bankName || "N/A"}</p>
                    <p style={styles.bankP}><b>Account No:</b> <span style={{ color: "#fbbf24", fontFamily: "monospace", fontSize: "18px", fontWeight: "bold" }}>{w.bankDetails?.accountNumber || "N/A"}</span></p>
                    <p style={styles.bankP}><b>IFSC Routing:</b> <span style={{ fontFamily: "monospace", fontSize: "17px", fontWeight: "bold", color: "#fff" }}>{w.bankDetails?.ifscCode || "N/A"}</span></p>
                    <p style={styles.bankP}><b>UPI Virtual Address:</b> {w.bankDetails?.upiId || "N/A"}</p>
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

      {/* ⚡ অটো উইথড্র সেকশন */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>⚡ Automated Webhook Gateways</h2>
        {autoWithdraws.length === 0 ? (
          <p style={styles.emptyText}>💤 Autonomous pipeline is completely clear.</p>
        ) : (
          autoWithdraws.map((item) => (
            <div key={item._id} style={styles.withdrawMiniCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>{item.name}</h3>
                  <p style={{ margin: "4px 0", fontSize: "15px", color: "#cbd5e1" }}>{item.email}</p>
                  <b style={{ color: "#22c55e", fontSize: "20px" }}>₹{item.amount}</b>
                </div>
                <span style={{ ...styles.statusPill, background: "rgba(56,189,248,0.2)", color: "#38bdf8", fontSize: "14px" }}>
                  Status: {item.status}
                </span>
              </div>
              <div style={{ ...styles.bankBox, padding: "14px", marginTop: "10px", fontSize: "15px" }}>
                <p style={styles.bankP}><b>Bank:</b> {item.bankDetails?.bankName} | <b>Acc:</b> {item.bankDetails?.accountNumber}</p>
                <p style={styles.bankP}><b>IFSC:</b> {item.bankDetails?.ifscCode}</p>
              </div>
              <div style={{ ...styles.actionRow, marginTop: "10px" }}>
                <button style={{ ...styles.approveBtn, padding: "12px" }} onClick={() => autoWithdrawAction(item._id, "Success")}>
                  Authorize Clear
                </button>
                <button style={{ ...styles.rejectBtn, padding: "12px" }} onClick={() => autoWithdrawAction(item._id, "Rejected")}>
                  Void Request
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🆔 পেন্ডিং কেওয়াইসি ভেরিফিকেশন সেকশন */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🆔 Identity Auditing (KYC Queue)</h2>
        {kyc.length === 0 && <p style={styles.emptyText}>😎 Universal user identities are verified. No pending audits.</p>}
        {kyc.map((u) => (
          <div key={u._id} style={styles.kycCard}>
            <h3 style={{ margin: 0, fontSize: "22px", color: "#ffffff", fontWeight: "bold" }}>{u.name}</h3>
            <p style={{ margin: "5px 0", color: "#cbd5e1", fontSize: "16px", fontWeight: "500" }}>{u.email} | Contact: {u.mobile}</p>
            <div style={{ margin: "14px 0", fontSize: "17px", background: "#020617", padding: "16px", borderRadius: "12px", border: "1px solid #334155" }}>
              <p style={{ margin: "6px 0", color: "#ffffff" }}>💳 <b>Aadhaar Hash:</b> <span style={{ color: "#fbbf24", fontWeight: "bold" }}>{u.aadhaarNumber || u.aadhaar || "[Protected Identifier]"}</span></p>
              <p style={{ margin: "6px 0", color: "#ffffff" }}>📄 <b>PAN Code:</b> <span style={{ color: "#38bdf8", fontWeight: "bold", fontFamily: "monospace", fontSize: "18px" }}>{u.panNumber || u.pan || "Not Submitted"}</span></p>
            </div>

            <div style={styles.docGrid}>
              {u.aadhaarFile && (
                <a href={fileUrl(u.aadhaarFile)} target="_blank" rel="noreferrer" style={styles.docBtn}>
                  📂 Inspect Aadhaar Document
                </a>
              )}
              {u.panFile && (
                <a href={fileUrl(u.panFile)} target="_blank" rel="noreferrer" style={styles.docBtn}>
                  📂 Inspect PAN Document
                </a>
              )}
              {u.photo && (
                <a href={fileUrl(u.photo)} target="_blank" rel="noreferrer" style={styles.docBtn}>
                  🖼️ View User Biometric Photo
                </a>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
              <button style={styles.greenFull} onClick={() => approveKYC(u._id)}>
                🪪 Grant Verification Passing
              </button>
              <button style={styles.redFull} onClick={() => rejectKYC(u._id)}>
                🚨 Deny Identity Assets
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 📥 ক্যাশ ডিপোজিট রিকোয়েস্ট টেবিল */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📥 Automated Peer UPI Top-up Requests</h2>
        {cash.length === 0 ? (
          <p style={styles.emptyText}>📥 No cash ledger additions requires intervention.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Account Node</th>
                  <th style={styles.th}>Credit Value</th>
                  <th style={styles.th}>Core Payment UTR / Txn Hash</th>
                  <th style={styles.th}>Network Timestamp</th>
                  <th style={styles.th}>State</th>
                  <th style={styles.th}>Administrative Action</th>
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
                      {r.createdAt || r.date ? new Date(r.createdAt || r.date).toLocaleString("en-IN") : "N/A"}
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
                        <span style={{ color: "#cbd5e1", fontSize: "14px", fontWeight: "600" }}>📦 Locked Legacy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 👥 ইউজার ব্লক/লিস্ট সেকশন */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>👥 Core Network Directory Matrix</h2>
        {users.length === 0 && <p style={styles.emptyText}>No register assets found.</p>}
        {users.map((u) => (
          <div key={u._id} style={styles.row}>
            <div>
              <b style={{ fontSize: "18px", color: "#fff" }}>{u.name}</b>
              <p style={{ margin: "4px 0 0 0", color: "#cbd5e1", fontSize: "15px", fontWeight: "500" }}>{u.email} | Tier: <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{u.role}</span></p>
            </div>
            <button style={styles.red} onClick={() => banUser(u._id)}>
              🚫 Terminate Account
            </button>
          </div>
        ))}
      </div>

      {/* 📑 পপআপ মডাল লেজার খাতা */}
      {transactionPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupBox}>
            <div style={styles.popupTop}>
              <h2 style={{ margin: 0, fontSize: "24px" }}>📜 Comprehensive Remittance Ledger</h2>
              <button style={styles.closePopup} onClick={() => setTransactionPopup(false)}>✕ Close</button>
            </div>

            <div style={styles.transactionFilterBox}>
              <select style={styles.filterInput} value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)}>
                <option value="all">All Channels</option>
                <option value="pending">State: Pending Queue</option>
                <option value="success">State: Success Disbursed</option>
                <option value="rejected">State: Rejected / Revoked</option>
                <option value="thisMonth">Interval: This Month</option>
                <option value="lastMonth">Interval: Last Month</option>
              </select>

              <input style={styles.filterInput} type="date" value={transactionFrom} onChange={(e) => setTransactionFrom(e.target.value)} />
              <input style={styles.filterInput} type="date" value={transactionTo} onChange={(e) => setTransactionTo(e.target.value)} />

              <button style={styles.resetBtn} onClick={() => { setTransactionFilter("all"); setTransactionFrom(""); setTransactionTo(""); }}>
                🔄 Clear Filter
              </button>
            </div>

            <div style={styles.popupSummary}>
              <div style={styles.summaryMini}>
                <span style={{ color: "#cbd5e1", fontSize: "15px" }}>Matched Records</span>
                <h3 style={{ margin: "5px 0 0 0", fontSize: "20px" }}>{transactionWithdraws.length} Units</h3>
              </div>
              <div style={styles.summaryMini}>
                <span style={{ color: "#cbd5e1", fontSize: "15px" }}>Aggregated Disbursed</span>
                <h3 style={{ margin: "5px 0 0 0", color: "#22c55e", fontSize: "20px" }}>{money(transactionTotalAmount)}</h3>
              </div>
            </div>

            <div style={{ marginTop: 20, maxHeight: "45vh", overflowY: "auto", paddingRight: "5px" }}>
              {transactionWithdraws.length === 0 ? (
                <p style={styles.emptyText}>No chronological matching hashes inside database records.</p>
              ) : (
                transactionWithdraws.map((w) => (
                  <div key={w._id} style={styles.transactionItem}>
                    <div>
                      <b style={{ fontSize: "16px", color: "#fff" }}>{w.name || "User Node"}</b>
                      <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "14px" }}>{w.email}</p>
                      <b style={{ color: "#22c55e", fontSize: "18px" }}>{money(w.amount)}</b>
                      <br />
                      <small style={{ color: "#94a3b8", fontSize: "12px" }}>{w.createdAt ? new Date(w.createdAt).toLocaleString("en-IN") : "N/A"}</small>
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

// 💎 আল্ট্রা-প্রিমিয়াম গ্লোয়িং নিওন ডার্ক থিম স্টাইলশিট (বড় ফন্ট ও হাই-কন্ট্রাস্ট ক্লিয়ার ভিউ সহ)
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
  redFull: {
    width: "100%",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    border: "none",
    padding: "16px",
    borderRadius: "16px",
    color: "white",
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
  kycCard: {
    background: "#111827",
    marginTop: "15px",
    padding: "20px",
    borderRadius: "22px",
    border: "1.5px solid #334155"
  },
  docGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "16px"
  },
  docBtn: {
    background: "rgba(59,130,246,0.15)",
    border: "1.5px solid #2563eb",
    color: "#60a5fa",
    padding: "14px",
    borderRadius: "14px",
    textAlign: "center",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: "700"
  },
  tableWrap: {
    overflowX: "auto",
    marginTop: "20px",
    background: "#020617",
    borderRadius: "16px",
    border: "1.5px solid #334155"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px"
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
  row: {
    background: "#111827",
    marginTop: "12px",
    padding: "18px",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1.5px solid #334155"
  },
  red: {
    background: "rgba(239,68,68,0.15)",
    border: "1.5px solid #ef4444",
    padding: "10px 16px",
    borderRadius: "12px",
    color: "#fee2e2",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer"
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
  popupSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginTop: "20px"
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
