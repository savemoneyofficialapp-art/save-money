আপনার AdvancedAdminAnalytics ড্যাশবোর্ডটিকে একটি অসাধারণ, কমার্শিয়াল-গ্রেড এবং গ্লোয়িং ডার্ক সাইবারনেটিক থিমে (Premium Dark Cybernetic Theme) রূপান্তর করে দেওয়া হলো।
চার্টের ব্যাকগ্রাউন্ড গ্রিডলাইন, গ্লোয়িং স্ট্যাটাস কার্ড, এবং রেসপন্সিভ গ্রিড লেআউট যুক্ত করে ডিজাইনটিকে অনেক বেশি প্রিমিয়াম করা হয়েছে। আগের মতোই আপনার সমস্ত এপিআই লজিক ও ফাংশনালিটি সম্পূর্ণ অপরিবর্তিত রাখা হয়েছে।
### 🛠 আপগ্রেডকৃত সম্পূর্ণ কোড (AdvancedAdminAnalytics.jsx)
নিচের কোডটি দিয়ে আপনার সম্পূর্ণ ফাইলটি প্রতিস্থাপন (Replace) করে নিন:
```jsx
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import axios from "axios";
import { API } from "../config";

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

  // ⚡ প্রিমিয়াম গ্লোয়িং অ্যানিমেটেড লোডার 
  if (!data) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loaderCard}>
          <h1 style={styles.loaderLogo}>💰 Save Money</h1>
          <div style={styles.spinner}></div>
          <h2 style={{ fontSize: "18px", margin: "10px 0 5px 0" }}>Analyzing System Nodes</h2>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>Syncing ledger with core telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      {/* 🚀 ড্যাশবোর্ড হেডার */}
      <div style={styles.headerArea}>
        <h1 style={styles.title}>📊 Advanced Enterprise Analytics</h1>
        <p style={styles.subtitle}>Real-time system health, asset flow, and user node distribution.</p>
      </div>

      {/* 📈 গ্লোয়িং ম্যাট্রিক্স গ্রিড */}
      <div style={styles.grid}>
        <div style={{ ...styles.card, borderLeft: "4px solid #38bdf8" }}>
          <p style={styles.cardLabel}>👤 Total Users</p>
          <h2 style={styles.cardValue}>{data.totalUsers?.toLocaleString()}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid #22c55e" }}>
          <p style={styles.cardLabel}>⚡ Active Nodes</p>
          <h2 style={{ ...styles.cardValue, color: "#22c55e" }}>{data.activeUsers?.toLocaleString()}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid #64748b" }}>
          <p style={styles.cardLabel}>💤 Inactive Nodes</p>
          <h2 style={{ ...styles.cardValue, color: "#94a3b8" }}>{data.inactiveUsers?.toLocaleString()}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid #a855f7" }}>
          <p style={styles.cardLabel}>🪪 KYC Approved</p>
          <h2 style={{ ...styles.cardValue, color: "#c084fc" }}>{data.kycApproved?.toLocaleString()}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid #eab308" }}>
          <p style={styles.cardLabel}>⏳ KYC Pending</p>
          <h2 style={{ ...styles.cardValue, color: "#facc15" }}>{data.kycPending?.toLocaleString()}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid #ef4444" }}>
          <p style={styles.cardLabel}>🛑 Terminated Nodes</p>
          <h2 style={{ ...styles.cardValue, color: "#f87171" }}>{data.bannedUsers?.toLocaleString()}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid #ec4899", gridColumn: "span 2" }}>
          <p style={styles.cardLabel}>💼 Total Ecosystem Wallet Balance</p>
          <h2 style={{ ...styles.cardValue, color: "#f472b6" }}>₹{Number(data.totalWallet || 0).toLocaleString("en-IN")}</h2>
        </div>

        <div style={{ ...styles.card, borderLeft: "4px solid #06b6d4", gridColumn: "span 2" }}>
          <p style={styles.cardLabel}>💰 Total Active Capital Investment</p>
          <h2 style={{ ...styles.cardValue, color: "#22d3ee" }}>₹{Number(data.totalInvestment || 0).toLocaleString("en-IN")}</h2>
        </div>
      </div>

      {/* 📉 চার্ট সেকশন */}
      <div style={styles.chartBox}>
        <h3 style={styles.chartTitle}>📈 User Growth Velocity <span style={styles.chartTitleBadge}>Last 7 Days</span></h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#475569" style={{ fontSize: "11px" }} />
            <YAxis stroke="#475569" style={{ fontSize: "11px" }} />
            <Tooltip contentStyle={styles.tooltipStyle} />
            <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartBox}>
        <h3 style={styles.chartTitle}>💎 Capital Influx Pipeline <span style={styles.chartTitleBadge}>Last 7 Days</span></h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#475569" style={{ fontSize: "11px" }} />
            <YAxis stroke="#475569" style={{ fontSize: "11px" }} />
            <Tooltip contentStyle={styles.tooltipStyle} formatter={(value) => [`₹${value}`, "Investment"]} />
            <Bar dataKey="investment" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartBox}>
        <h3 style={styles.chartTitle}>🔄 Ledger Transaction Velocity <span style={styles.chartTitleBadge}>Last 7 Days</span></h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#475569" style={{ fontSize: "11px" }} />
            <YAxis stroke="#475569" style={{ fontSize: "11px" }} />
            <Tooltip contentStyle={styles.tooltipStyle} formatter={(value) => [`₹${value}`, "Wallet Volume"]} />
            <Bar dataKey="wallet" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🏆 টপ আর্নারস */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🏆 Ecosystem Top Earners</h3>
        {data.topEarners?.map((u, i) => (
          <div key={i} style={styles.row}>
            <div style={styles.rowLeft}>
              <span style={styles.rankBadge}>#{i + 1}</span>
              <div>
                <b style={styles.rowName}>{u.name || "Anonymous Node"}</b>
                <p style={styles.rowEmail}>{u.email}</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <b style={styles.earningText}>₹{(u.totalEarning || 0).toLocaleString("en-IN")}</b>
              <p style={styles.rankLabel}>{u.rank || "Tier 0"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 🔗 টপ রেফারারস */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🔗 Viral Network Referrers</h3>
        {data.topReferrers?.map((u, i) => (
          <div key={i} style={styles.row}>
            <div style={styles.rowLeft}>
              <span style={{ ...styles.rankBadge, background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>#{i + 1}</span>
              <div>
                <b style={styles.rowName}>{u.name || "Anonymous Recruiter"}</b>
                <p style={styles.rowEmail}>{u.email}</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <b style={{ color: "#3b82f6", fontSize: "14px", fontWeight: "800" }}>{u.totalDirect || 0} Directs</b>
              <p style={styles.rankLabel}>{u.rank || "Rank Unset"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 🔍 ইউজার সার্চ অ্যান্ড ইন্টেলিজেন্ট ফিল্টার */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🔍 Core Directory Query</h3>
        
        <input
          style={styles.input}
          placeholder="Filter by name, email, mobile, wallet ID, tracking hash..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.selectInput}
          value={filter}
          onChange={(e) => changeFilter(e.target.value)}
        >
          <option value="all">🌐 All Network Nodes</option>
          <option value="kyc">✅ KYC Verified Profile</option>
          <option value="pending">⏳ KYC Verification Queue</option>
          <option value="active">🟢 Active Pipeline Nodes</option>
          <option value="inactive">🔴 Dormant Account Nodes</option>
          <option value="banned">🛑 Suspended Network Nodes</option>
        </select>

        <button style={styles.searchBtn} onClick={searchUsers}>
          ⚡ Execute Directory Search
        </button>

        {/* 📋 সার্চড ইউজার কার্ডস */}
        {users.map((u, i) => (
          <div key={i} style={styles.userCard}>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: "15px", color: "#f8fafc" }}>{u.name || "Anonymous Node"}</b>
              <p style={styles.userCardSub}>{u.email}</p>
              <div style={styles.userMetaFlex}>
                <span><b>📞:</b> {u.mobile || "N/A"}</span>
                <span><b>🆔 ID:</b> <span style={{ fontFamily: "monospace", color: "#fbbf24" }}>{u.walletId || "N/A"}</span></span>
                <span><b>🎖️ Class:</b> {u.rank || "N/A"}</span>
              </div>
            </div>

            <div style={styles.userCardRight}>
              <span style={{ ...styles.miniStateBadge, color: u.kycStatus === "approved" ? "#22c55e" : "#fbbf24" }}>
                KYC: {u.kycStatus || "none"}
              </span>
              <span style={{ ...styles.miniStateBadge, color: u.activeStatus === "active" ? "#22c55e" : "#94a3b8" }}>
                Status: {u.activeStatus || "inactive"}
              </span>
              <b style={{ color: "#22c55e", fontSize: "14px", marginTop: "4px" }}>₹{Number(u.wallet || 0).toLocaleString("en-IN")}</b>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// 💎 আল্ট্রা-প্রিমিয়াম গ্লোয়িং নিওন সাইবার ড্যাশবোর্ড স্টাইলস
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0b1329 100%)",
    color: "#f1f5f9",
    padding: "24px 16px 80px",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
  },
  headerArea: {
    textAlign: "center",
    marginBottom: "25px"
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#f8fafc",
    margin: "0 0 6px 0"
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "15px"
  },
  card: {
    background: "#0f172a",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #1e293b",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
  },
  cardLabel: {
    margin: "0 0 6px 0",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600"
  },
  cardValue: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "#f1f5f9"
  },
  chartBox: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "20px",
    marginTop: "16px",
    border: "1px solid #1e293b",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
  },
  chartTitle: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    fontWeight: "700",
    color: "#cbd5e1",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  chartTitleBadge: {
    fontSize: "10px",
    background: "rgba(100,116,139,0.15)",
    padding: "3px 8px",
    borderRadius: "8px",
    color: "#94a3b8"
  },
  tooltipStyle: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    color: "white",
    fontSize: "12px"
  },
  section: {
    background: "#0f172a",
    padding: "18px",
    borderRadius: "20px",
    marginTop: "16px",
    border: "1px solid #1e293b"
  },
  sectionTitle: {
    margin: "0 0 14px 0",
    fontSize: "15px",
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: "0.3px"
  },
  row: {
    background: "#020617",
    padding: "12px",
    borderRadius: "14px",
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #1e293b"
  },
  rowLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  rankBadge: {
    background: "rgba(34,197,94,0.15)",
    color: "#22c55e",
    fontWeight: "800",
    fontSize: "12px",
    padding: "6px 10px",
    borderRadius: "10px"
  },
  rowName: {
    fontSize: "14px",
    color: "#f1f5f9",
    display: "block"
  },
  rowEmail: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  earningText: {
    color: "#22c55e",
    fontSize: "14px",
    fontWeight: "800"
  },
  rankLabel: {
    margin: "2px 0 0 0",
    fontSize: "11px",
    color: "#94a3b8"
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    background: "#020617",
    color: "white",
    boxSizing: "border-box",
    fontSize: "14px",
    outline: "none"
  },
  selectInput: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    background: "#020617",
    color: "white",
    boxSizing: "border-box",
    fontSize: "14px",
    marginTop: "10px",
    outline: "none"
  },
  searchBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#020617",
    fontWeight: "800",
    marginTop: "12px",
    cursor: "pointer",
    fontSize: "14px"
  },
  userCard: {
    background: "#020617",
    padding: "14px",
    borderRadius: "14px",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    border: "1px solid #1e293b"
  },
  userCardSub: {
    margin: "2px 0 8px 0",
    fontSize: "12px",
    color: "#64748b"
  },
  userMetaFlex: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    fontSize: "11px",
    color: "#94a3b8"
  },
  userCardRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  miniStateBadge: {
    fontSize: "11px",
    fontWeight: "600",
    margin: "1px 0"
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
    width: "90%",
    maxWidth: "360px",
    background: "#0f172a",
    padding: "30px",
    borderRadius: "24px",
    textAlign: "center",
    border: "1px solid #1e293b",
    boxShadow: "0px 10px 40px rgba(34,197,94,0.15)"
  },
  loaderLogo: {
    fontSize: "24px",
    margin: "0 0 20px 0"
  },
  spinner: {
    width: "45px",
    height: "45px",
    border: "4px solid #1e293b",
    borderTop: "4px solid #22c55e",
    borderRadius: "50%",
    margin: "0 auto 15px",
    animation: "spin 1s linear infinite"
  }
};

```
