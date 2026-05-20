import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import axios from "axios";

const API = "https://save-money-yyv1.onrender.com";

export default function AdvancedAdminAnalytics() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAnalytics();
    searchUsers();
  }, []);

  const loadAnalytics = async () => {
    const res = await fetch(`${API}/admin-advanced-analytics`, {
      headers: {
        authorization: token
      }
    });

    const result = await res.json();
    setData(result);
  };

  const searchUsers = async () => {
    const res = await fetch(`${API}/admin-search-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({
        search,
        filter
      })
    });

    const result = await res.json();
    setUsers(result);
  };

  const changeFilter = async (value) => {
    setFilter(value);

    const res = await fetch(`${API}/admin-search-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({
        search,
        filter: value
      })
    });

    const result = await res.json();
    setUsers(result);
  };

  if (!data) {
    return (
      <div style={styles.container}>
        Loading Advanced Analytics...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <h1 style={styles.title}>Advanced Admin Analytics</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2>{data.totalUsers}</h2>
          <p>Total Users</p>
        </div>

        <div style={styles.card}>
          <h2>{data.activeUsers}</h2>
          <p>Active Users</p>
        </div>

        <div style={styles.card}>
          <h2>{data.inactiveUsers}</h2>
          <p>Inactive Users</p>
        </div>

        <div style={styles.card}>
          <h2>{data.kycApproved}</h2>
          <p>KYC Approved</p>
        </div>

        <div style={styles.card}>
          <h2>{data.kycPending}</h2>
          <p>KYC Pending</p>
        </div>

        <div style={styles.card}>
          <h2>{data.bannedUsers}</h2>
          <p>Banned Users</p>
        </div>

        <div style={styles.card}>
          <h2>₹{data.totalWallet}</h2>
          <p>Total Wallet</p>
        </div>

        <div style={styles.card}>
          <h2>₹{data.totalInvestment}</h2>
          <p>Total Investment</p>
        </div>
      </div>

      <div style={styles.chartBox}>
        <h2>Last 7 Days User Growth</h2>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.chart}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartBox}>
        <h2>Last 7 Days Investment</h2>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.chart}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="investment" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartBox}>
        <h2>Wallet Transaction Volume</h2>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.chart}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="wallet" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.section}>
        <h2>Top Earners</h2>

        {data.topEarners.map((u, i) => (
          <div key={i} style={styles.row}>
            <div>
              <b>#{i + 1} {u.name}</b>
              <p>{u.email}</p>
            </div>

            <div style={{ textAlign: "right" }}>
              <b>₹{u.totalEarning || 0}</b>
              <p>{u.rank}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2>Top Referrers</h2>

        {data.topReferrers.map((u, i) => (
          <div key={i} style={styles.row}>
            <div>
              <b>#{i + 1} {u.name}</b>
              <p>{u.email}</p>
            </div>

            <div style={{ textAlign: "right" }}>
              <b>{u.totalDirect || 0} Direct</b>
              <p>{u.rank}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2>User Search & Filter</h2>

        <input
          style={styles.input}
          placeholder="Search name, email, mobile, wallet ID, refer code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.input}
          value={filter}
          onChange={(e) => changeFilter(e.target.value)}
        >
          <option value="all">All Users</option>
          <option value="kyc">KYC Approved</option>
          <option value="pending">KYC Pending</option>
          <option value="active">Active Users</option>
          <option value="inactive">Inactive Users</option>
          <option value="banned">Banned Users</option>
        </select>

        <button style={styles.searchBtn} onClick={searchUsers}>
          Search
        </button>

        {users.map((u, i) => (
          <div key={i} style={styles.userCard}>
            <div>
              <b>{u.name}</b>
              <p>{u.email}</p>
              <p>Mobile: {u.mobile}</p>
              <p>Wallet ID: {u.walletId}</p>
              <p>Rank: {u.rank}</p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p>KYC: {u.kycStatus}</p>
              <p>Status: {u.activeStatus}</p>
              <p>Wallet: ₹{u.wallet}</p>
            </div>
          </div>
        ))}
      </div>

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

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "20px"
  },

  card: {
    background: "#1e293b",
    padding: "18px",
    borderRadius: "18px",
    textAlign: "center",
    border: "1px solid #334155"
  },

  chartBox: {
    background: "#1e293b",
    padding: "18px",
    borderRadius: "18px",
    marginTop: "20px"
  },

  section: {
    background: "#1e293b",
    padding: "18px",
    borderRadius: "18px",
    marginTop: "20px"
  },

  row: {
    background: "#0f172a",
    padding: "12px",
    borderRadius: "12px",
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between"
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
    background: "#0f172a",
    padding: "14px",
    borderRadius: "14px",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px"
  }
};