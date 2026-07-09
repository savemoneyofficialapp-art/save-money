import { useState } from "react";
import { API } from "../config";

export default function AdminUserControl() {
  const token = localStorage.getItem("token");

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [bonusOpen, setBonusOpen] = useState(false);

  const [bonus, setBonus] = useState({
    performanceBonusEnabled: false,
    teamBonusEnabled: false,
    royaltyBonusEnabled: false
  });
  const [selectedUser, setSelectedUser] = useState(null);

  const handleAuthError = (data) => {
    if (
      data?.msg === "Token expired or invalid" ||
      data?.msg === "No token" ||
      data?.msg === "Invalid token" ||
      data?.msg === "Admin access only" ||
      data?.msg === "Admin only"
    ) {
      localStorage.clear();
      alert("Session expired or admin access missing. Please login again.");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  const saveBonus = async () => {
    if (!selectedUser?._id) return alert("User not selected");

    const res = await fetch(`${API}/admin/update-bonus-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("token") || ""
      },
      body: JSON.stringify({
        userId: selectedUser._id,
        ...bonus
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return alert(data.msg || "Bonus update failed");
    }

    alert(data.msg || "Bonus settings updated");
    setBonusOpen(false);

    try {
      await searchUsers();
    } catch (e) {
      console.log("search refresh failed", e);
    }
  };

  const walletAdjust = async (type, userData) => {
    if (!userData?._id) return alert("User ID not found");
    if (!adjustAmount || Number(adjustAmount) <= 0) return alert("Enter amount");
    if (!adjustReason) return alert("Reason required");

    const res = await fetch(`${API}/admin/wallet-adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("token") || ""
      },
      body: JSON.stringify({
        userId: userData._id,
        amount: Number(adjustAmount),
        reason: adjustReason,
        type
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return alert(data.msg || "Wallet update failed");
    }

    alert(data.msg || "Wallet updated");
    setAdjustAmount("");
    setAdjustReason("");

    try {
      await searchUsers();
    } catch (e) {
      console.log("search refresh failed", e);
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      setMsg("");

      const res = await fetch(`${API}/admin-search-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          search,
          filter: "all"
        })
      });

      const data = await res.json();

      if (handleAuthError(data)) return;

      if (!Array.isArray(data)) {
        setUsers([]);
        setMsg(data?.msg || "No users found");
        return;
      }

      setUsers(data);

      if (data.length === 0) {
        setMsg("No users found");
      }
    } catch (err) {
      console.log(err);
      setMsg("Backend API not connected or CORS error");
    } finally {
      setLoading(false);
    }
  };

  const action = async (url, body) => {
    try {
      setLoading(true);
      setMsg("");

      const res = await fetch(`${API}/${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (handleAuthError(data)) return;

      alert(data.msg || "Action completed");
      searchUsers();
    } catch (err) {
      console.log(err);
      setMsg("Action failed. Backend API not connected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👥 Admin User Control Panel</h2>

      {/* 🔍 সার্চ ফিল্টার বক্স */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Search by name, email, mobile, wallet ID, refer code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button style={styles.searchBtn} onClick={searchUsers}>
          {loading ? "⚡ Accessing Nodes..." : "🔍 Query User Directory"}
        </button>

        {msg && <p style={styles.msg}>⚠️ {msg}</p>}
      </div>

      {/* 👥 ইউজার কার্ড লিস্ট */}
      {users.map((u) => (
        <div key={u._id} style={styles.userCard}>
          <div style={styles.userTop}>
            <div>
              <h3 style={styles.userName}>{u.name || "Anonymous Node"}</h3>
              <p style={styles.userEmail}>{u.email}</p>
              
              <div style={styles.infoMetaGrid}>
                <p style={styles.metaText}><b>📞 Contact:</b> {u.mobile || "N/A"}</p>
                <p style={styles.metaText}><b>🆔 Wallet ID:</b> <span style={{ fontFamily: "monospace", color: "#fbbf24" }}>{u.walletId || "N/A"}</span></p>
                <p style={styles.metaText}><b>💰 Live Balance:</b> <span style={{ color: "#22c55e", fontWeight: "800" }}>₹{Number(u.wallet || 0).toLocaleString("en-IN")}</span></p>
                <p style={styles.metaText}><b>🪪 KYC Status:</b> <span style={{ color: u.kycStatus === "approved" ? "#22c55e" : "#fbbf24" }}>{u.kycStatus || "Not Submitted"}</span></p>
                <p style={styles.metaText}><b>⚡ Active State:</b> {u.activeStatus || "Inactive"}</p>
              </div>

              <div style={styles.permissionIndicators}>
                <span style={{ ...styles.permBadge, color: u.disableInvestment ? "#ef4444" : "#22c55e" }}>
                  ● Investment: {u.disableInvestment ? "Disabled" : "Allowed"}
                </span>
                <span style={{ ...styles.permBadge, color: u.disableWithdrawal ? "#ef4444" : "#22c55e" }}>
                  ● Payout Pipeline: {u.disableWithdrawal ? "Disabled" : "Allowed"}
                </span>
                <span style={{ ...styles.permBadge, color: u.disableBonus ? "#ef4444" : "#22c55e" }}>
                  ● System Bonus: {u.disableBonus ? "Disabled" : "Allowed"}
                </span>
              </div>
            </div>

            <div style={styles.badges}>
              <span style={u.banned ? styles.redBadge : styles.greenBadge}>
                {u.banned ? "🛑 Terminated" : "✅ Authorized"}
              </span>

              <span style={u.freezeWallet ? styles.redBadge : styles.blueBadge}>
                {u.freezeWallet ? "❄️ Wallet Frozen" : "🔒 Wallet Liquid"}
              </span>
            </div>
          </div>

          {/* 💳 ওয়ালেট ব্যালেন্স পরিবর্তন বক্স */}
          <div style={styles.walletManageBox}>
            <h4 style={{ margin: "0 0 10px 0", color: "#38bdf8", fontSize: "14px", fontWeight: "700" }}>💼 Ledger Credit/Debit Adjustment</h4>

            <div style={styles.adjustmentFieldsRow}>
              <input
                style={{ ...styles.input, marginTop: 0 }}
                type="number"
                placeholder="Amount (₹)"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
              <input
                style={{ ...styles.input, marginTop: 0 }}
                placeholder="Audit log / Reason description..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>

            <div style={styles.rowBtns}>
              <button style={styles.addBtn} onClick={() => walletAdjust("add", u)}>
                ➕ Inject Funds
              </button>
              <button style={styles.deductBtn} onClick={() => walletAdjust("deduct", u)}>
                ➖ Deduct Balance
              </button>
            </div>
          </div>

          {/* 🚫 অ্যাকাউন্ট রেস্ট্রিকশন ও অ্যাকশন বাটন সেকশন */}
          <div style={{ marginTop: "15px" }}>
            <input
              style={{ ...styles.input, border: "1px solid #dc2626", background: "rgba(220,38,38,0.05)" }}
              placeholder="State a specific reason if enforcing account suspension..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div style={styles.grid}>
            <button style={styles.redBtn} onClick={() => action("admin-ban-user", { email: u.email, reason: reason || "Violation detected" })}>
              🚫 Terminate Node
            </button>
            <button style={styles.greenBtn} onClick={() => action("admin-unban-user", { email: u.email })}>
              🤝 Restore Access
            </button>
            <button style={styles.orangeBtn} onClick={() => action("admin-freeze-wallet", { email: u.email, freeze: !u.freezeWallet })}>
              {u.freezeWallet ? "🔥 Unfreeze Wallet" : "❄️ Freeze Asset Wallet"}
            </button>
            <button style={styles.blueBtn} onClick={() => action("admin-disable-investment", { email: u.email, disable: !u.disableInvestment })}>
              {u.disableInvestment ? "🔓 Unlock Investment" : "🔒 Toggle Lock Invest"}
            </button>
            <button style={styles.purpleBtn} onClick={() => action("admin-disable-withdrawal", { email: u.email, disable: !u.disableWithdrawal })}>
              {u.disableWithdrawal ? "🔓 Unlock Withdrawals" : "🔒 Toggle Lock Payout"}
            </button>
            <button
              style={styles.yellowBtn}
              onClick={() => {
                setSelectedUser(u);
                setBonus({
                  performanceBonusEnabled: !!u.performanceEnabled,
                  teamBonusEnabled: !!u.teamBonusEnabled,
                  royaltyBonusEnabled: !!u.royaltyBonusEnabled
                });
                setBonusOpen(true);
              }}
            >
              🎁 Bonus Pipeline Setup
            </button>
          </div>
        </div>
      ))}

      {/* 🎁 মোডাল ওভারলে বক্স */}
      {bonusOpen && selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={{ margin: "0 0 5px 0", fontSize: "18px" }}>🎁 Allocation Pipelines</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748b" }}>Modifying nodes for: {selectedUser.email}</p>

            {[
              ["performanceBonusEnabled", "Performance Bonus Protocol"],
              ["teamBonusEnabled", "Team Level Bonus Protocol"],
              ["royaltyBonusEnabled", "Global Royalty Pool Matrix"]
            ].map(([key, label]) => (
              <div key={key} style={styles.bonusRow}>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{label}</span>
                <button
                  style={{
                    ...styles.toggleBtn,
                    background: bonus[key] ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: bonus[key] ? "#22c55e" : "#ef4444",
                    border: bonus[key] ? "1px solid #22c55e" : "1px solid #ef4444"
                  }}
                  onClick={() => setBonus({ ...bonus, [key]: !bonus[key] })}
                >
                  {bonus[key] ? "● ACTIVE" : "○ INACTIVE"}
                </button>
              </div>
            ))}

            <button style={{ ...styles.addBtn, width: "100%", marginTop: "20px", padding: "14px" }} onClick={saveBonus}>
              💾 Deploy Bonus Rules
            </button>
            <button style={styles.closeBtn} onClick={() => setBonusOpen(false)}>
              ✕ Abort & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 💎 আল্ট্রা-প্রিমিয়াম গ্লোয়িং নিওন ডার্ক থিম স্টাইলশিট 
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0b1329 100%)",
    padding: "24px 16px 80px",
    color: "#f1f5f9",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
  },
  title: {
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "800",
    color: "#f8fafc",
    margin: "0 0 25px 0"
  },
  card: {
    background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
    padding: "20px",
    borderRadius: "22px",
    border: "1px solid #1e293b",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
    marginBottom: "25px"
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #1e293b",
    background: "#020617",
    color: "white",
    boxSizing: "border-box",
    fontSize: "14px",
    transition: "all 0.2s ease"
  },
  searchBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#020617",
    fontWeight: "800",
    marginTop: "14px",
    cursor: "pointer",
    fontSize: "14px"
  },
  msg: {
    color: "#fbbf24",
    textAlign: "center",
    marginTop: "12px",
    fontWeight: "600",
    fontSize: "13px"
  },
  userCard: {
    background: "#0f172a",
    padding: "20px",
    borderRadius: "22px",
    marginTop: "18px",
    border: "1px solid #1e293b",
    boxShadow: "0 15px 30px rgba(0,0,0,0.25)"
  },
  userTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px"
  },
  userName: {
    margin: "0 0 4px 0",
    fontSize: "18px",
    fontWeight: "700"
  },
  userEmail: {
    margin: "0 0 15px 0",
    color: "#94a3b8",
    fontSize: "13px"
  },
  infoMetaGrid: {
    background: "#020617",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #1e293b",
    fontSize: "13px"
  },
  metaText: {
    margin: "5px 0",
    color: "#cbd5e1"
  },
  permissionIndicators: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginTop: "12px"
  },
  permBadge: {
    fontSize: "12px",
    fontWeight: "600"
  },
  badges: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "right"
  },
  greenBadge: {
    background: "rgba(34,197,94,0.15)",
    color: "#22c55e",
    padding: "5px 12px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "700"
  },
  redBadge: {
    background: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    padding: "5px 12px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "700"
  },
  blueBadge: {
    background: "rgba(59,130,246,0.15)",
    color: "#38bdf8",
    padding: "5px 12px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "700"
  },
  walletManageBox: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "16px",
    background: "linear-gradient(180deg, #111827 0%, #020617 100%)",
    border: "1px solid #1e293b"
  },
  adjustmentFieldsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "8px",
    marginTop: "8px"
  },
  rowBtns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "12px"
  },
  addBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#020617",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "13px"
  },
  deductBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "13px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "15px"
  },
  redBtn: btn("rgba(239,68,68,0.1)", "#fca5a5", "1px solid #ef4444"),
  greenBtn: btn("rgba(34,197,94,0.1)", "#86efac", "1px solid #22c55e"),
  orangeBtn: btn("rgba(245,158,11,0.1)", "#fde047", "1px solid #f59e0b"),
  blueBtn: btn("rgba(59,130,246,0.1)", "#93c5fd", "1px solid #3b82f6"),
  purpleBtn: btn("rgba(139,92,246,0.1)", "#c084fc", "1px solid #8b5cf6"),
  yellowBtn: btn("linear-gradient(135deg, #fbbf24 0%, #d97706 100%)", "#020617", "none"),
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.8)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: 16
  },
  modalBox: {
    width: "100%",
    maxWidth: "440px",
    background: "#0f172a",
    padding: "24px",
    borderRadius: "24px",
    color: "white",
    border: "1px solid #1e293b",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
  },
  bonusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid #1e293b"
  },
  toggleBtn: {
    borderRadius: "10px",
    padding: "8px 14px",
    fontWeight: "800",
    fontSize: "11px",
    cursor: "pointer",
    letterSpacing: "0.5px"
  },
  closeBtn: {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "rgba(100,116,139,0.15)",
    color: "#94a3b8",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px"
  }
};

function btn(bg, color, border) {
  return {
    padding: "12px 8px",
    border: border,
    borderRadius: "12px",
    background: bg,
    color: color,
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  };
}

```
