import { useState } from "react";

export default function AdminUserControl() {
  const token = localStorage.getItem("token");

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [reason, setReason] = useState("");

  const searchUsers = async () => {
    const res = await fetch("http://localhost:5000/admin-search-users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({
        search,
        filter: "all"
      })
    });

    const data = await res.json();
    setUsers(data);
  };

  const action = async (url, body) => {
    const res = await fetch("http://localhost:5000/" + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    alert(data.msg);
    searchUsers();
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
          Search User
        </button>
      </div>

      {users.map((u) => (
        <div key={u._id} style={styles.userCard}>
          <div style={styles.userTop}>
            <div>
              <h3>{u.name}</h3>
              <p>{u.email}</p>
              <p>Mobile: {u.mobile}</p>
              <p>Wallet ID: {u.walletId}</p>
              <p>Wallet: ₹{u.wallet}</p>
              <p>KYC: {u.kycStatus}</p>
              <p>Status: {u.activeStatus}</p>
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
                  reason
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
              onClick={() =>
                action("admin-disable-bonus", {
                  email: u.email,
                  disable: !u.disableBonus
                })
              }
            >
              {u.disableBonus ? "Enable Bonus" : "Disable Bonus"}
            </button>
          </div>
        </div>
      ))}
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