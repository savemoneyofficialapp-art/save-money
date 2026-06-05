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
  if (!selectedUser) return;

  const res = await fetch(`${API}/admin/update-bonus-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: localStorage.getItem("token") || ""
    },
    body: JSON.stringify({
      userId: u._id,
      ...bonus
    })
  });

  const data = await res.json();

  alert(data.msg || "Bonus Updated");

  setBonusOpen(false);
};

const walletAdjust = async (type, targetUser) => {
  const currentUser = targetUser || selectedUser;

  console.log("WALLET CLICK:", type, currentUser);

  if (!currentUser?._id) {
    return alert("User ID not found");
  }

  if (!adjustAmount || Number(adjustAmount) <= 0) {
    return alert("Enter valid amount");
  }

  if (!adjustReason) {
    return alert("Reason required");
  }

  try {
    const res = await fetch(`${API}/admin/wallet-adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("token") || ""
      },
      body: JSON.stringify({
        userId: u._id,
        amount: Number(adjustAmount),
        reason: adjustReason,
        type
      })
    });

    const data = await res.json();
    console.log("WALLET RESPONSE:", data);

    alert(data.msg || "Wallet updated successfully");

    setAdjustAmount("");
    setAdjustReason("");

    searchUser();
  } catch (err) {
    console.log("WALLET ADJUST ERROR:", err);
    alert("Wallet update failed");
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
      <h2 style={styles.title}>Admin User Control</h2>

      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Search by name, email, mobile, wallet ID, refer code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button style={styles.searchBtn} onClick={searchUsers}>
          {loading ? "Searching..." : "Search User"}
        </button>

        {msg && <p style={styles.msg}>{msg}</p>}
      </div>

      {users.map((u) => (
        <div key={u._id} style={styles.userCard}>
          <div style={styles.userTop}>
            <div>
              <h3>{u.name || "No Name"}</h3>
              <p>{u.email}</p>
              <p>Mobile: {u.mobile || "N/A"}</p>
              <p>Wallet ID: {u.walletId || "N/A"}</p>
              <p>Wallet: ₹{u.wallet || 0}</p>
              <p>KYC: {u.kycStatus || "not submitted"}</p>
              <p>Status: {u.activeStatus || "Inactive"}</p>
              <p>Investment Disabled: {u.disableInvestment ? "Yes" : "No"}</p>
              <p>Withdrawal Disabled: {u.disableWithdrawal ? "Yes" : "No"}</p>
              <p>Bonus Disabled: {u.disableBonus ? "Yes" : "No"}</p>
            </div>

            <div style={styles.badges}>
              <span style={u.banned ? styles.redBadge : styles.greenBadge}>
                {u.banned ? "Banned" : "Active"}
              </span>

              <span style={u.freezeWallet ? styles.redBadge : styles.blueBadge}>
                {u.freezeWallet ? "Wallet Frozen" : "Wallet OK"}
              </span>
            </div>
          </div>

          <div style={styles.walletManageBox}>
  <h3>Wallet Management</h3>

  <input
    style={styles.input}
    type="number"
    placeholder="Amount"
    value={adjustAmount}
    onChange={(e) => setAdjustAmount(e.target.value)}
  />

  <input
    style={styles.input}
    placeholder="Reason / Note"
    value={adjustReason}
    onChange={(e) => setAdjustReason(e.target.value)}
  />

  <div style={styles.rowBtns}>
   <button
  style={styles.addBtn}
  onClick={() => walletAdjust("add", u)}
>
  Add Money
</button>

<button
  style={styles.deductBtn}
  onClick={() => walletAdjust("deduct", u)}
>
  Deduct Money
</button>
  </div>
</div>

          <input
            style={styles.input}
            placeholder="Ban reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div style={styles.grid}>
            <button
              style={styles.redBtn}
              onClick={() =>
                action("admin-ban-user", {
                  email: u.email,
                  reason: reason || "Violation detected"
                })
              }
            >
              Ban User
            </button>

            <button
              style={styles.greenBtn}
              onClick={() =>
                action("admin-unban-user", {
                  email: u.email
                })
              }
            >
              Unban User
            </button>

            <button
              style={styles.orangeBtn}
              onClick={() =>
                action("admin-freeze-wallet", {
                  email: u.email,
                  freeze: !u.freezeWallet
                })
              }
            >
              {u.freezeWallet ? "Unfreeze Wallet" : "Freeze Wallet"}
            </button>

            <button
              style={styles.blueBtn}
              onClick={() =>
                action("admin-disable-investment", {
                  email: u.email,
                  disable: !u.disableInvestment
                })
              }
            >
              {u.disableInvestment ? "Enable Investment" : "Disable Investment"}
            </button>

            <button
              style={styles.purpleBtn}
              onClick={() =>
                action("admin-disable-withdrawal", {
                  email: u.email,
                  disable: !u.disableWithdrawal
                })
              }
            >
              {u.disableWithdrawal ? "Enable Withdrawal" : "Disable Withdrawal"}
            </button>

          <button
  style={styles.yellowBtn}
  onClick={() => {
    setSelectedUser(u);

    setBonus({
      performanceBonusEnabled: !!u.performanceBonusEnabled,
      teamBonusEnabled: !!u.teamBonusEnabled,
      royaltyBonusEnabled: !!u.royaltyBonusEnabled
    });

    setBonusOpen(true);
  }}
>
  Bonus Management
</button>

          </div>
        </div>
      ))}
      {bonusOpen && selectedUser && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalBox}>
      <h2>Bonus Management</h2>

      {[
        ["performanceBonusEnabled", "Performance Bonus"],
        ["teamBonusEnabled", "Team Bonus"],
        ["royaltyBonusEnabled", "Royalty Bonus"]
      ].map(([key, label]) => (
        <div key={key} style={styles.bonusRow}>
          <b>{label}</b>

          <button
            style={{
              ...styles.toggleBtn,
              background: bonus[key] ? "#22c55e" : "#ef4444"
            }}
            onClick={() =>
              setBonus({
                ...bonus,
                [key]: !bonus[key]
              })
            }
          >
            {bonus[key] ? "Active" : "Inactive"}
          </button>
        </div>
      ))}

      <button style={styles.addBtn} onClick={saveBonus}>
        Save Bonus Settings
      </button>

      <button
        style={styles.closeBtn}
        onClick={() => setBonusOpen(false)}
      >
        Close
      </button>
    </div>
  </div>
)}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "white",
    padding: "20px"
  },

  title: {
    textAlign: "center",
    color: "#22c55e"
  },

  card: {
    background: "#1e293b",
    padding: "16px",
    borderRadius: "18px",
    marginTop: "15px"
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginTop: "10px"
  },

  searchBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#22c55e",
    color: "#020617",
    fontWeight: "bold",
    marginTop: "12px"
  },

  msg: {
    color: "#facc15",
    textAlign: "center",
    marginTop: "12px"
  },

  userCard: {
    background: "#1e293b",
    padding: "16px",
    borderRadius: "18px",
    marginTop: "18px",
    border: "1px solid #334155"
  },

  userTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px"
  },

  badges: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  greenBadge: {
    background: "#22c55e",
    color: "#020617",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold"
  },

  redBadge: {
    background: "#ef4444",
    color: "white",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold"
  },

  blueBadge: {
    background: "#3b82f6",
    color: "white",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "15px"
  },

  walletManageBox: {
  marginTop: "20px",
  padding: "15px",
  borderRadius: "14px",
  background: "#0f172a",
  border: "1px solid #334155"
},

input: {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  borderRadius: "10px",
  border: "none"
},

rowBtns: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginTop: "10px"
},

addBtn: {
  padding: "12px",
  border: "none",
  borderRadius: "10px",
  background: "#22c55e",
  color: "white",
  fontWeight: "bold"
},

deductBtn: {
  padding: "12px",
  border: "none",
  borderRadius: "10px",
  background: "#ef4444",
  color: "white",
  fontWeight: "bold"
},

yellowBtn: {
  padding: "12px",
  border: "none",
  borderRadius: "10px",
  background: "#facc15",
  color: "#111827",
  fontWeight: "bold"
},

modalOverlay: {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.65)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
},

modalBox: {
  width: "90%",
  maxWidth: "420px",
  background: "#0f172a",
  padding: "22px",
  borderRadius: "18px",
  color: "white"
},

bonusRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #334155"
},

toggleBtn: {
  border: "none",
  borderRadius: "10px",
  padding: "9px 14px",
  color: "white",
  fontWeight: "bold"
},

closeBtn: {
  width: "100%",
  marginTop: "12px",
  padding: "12px",
  border: "none",
  borderRadius: "10px",
  background: "#64748b",
  color: "white",
  fontWeight: "bold"
},

  redBtn: btn("#ef4444"),
  greenBtn: btn("#22c55e", "#020617"),
  orangeBtn: btn("#f59e0b", "#020617"),
  blueBtn: btn("#3b82f6"),
  purpleBtn: btn("#8b5cf6"),
  yellowBtn: btn("#facc15", "#020617")
};

function btn(bg, color = "white") {
  return {
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: bg,
    color,
    fontWeight: "bold"
  };
}