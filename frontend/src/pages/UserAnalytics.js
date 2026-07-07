import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // রিডাইরেক্ট করার জন্য যোগ করা হয়েছে
import { toast } from "react-toastify"; // ইউজারকে অ্যালার্ট দেখানোর জন্য
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { API } from "../config";

export default function UserAnalytics() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 💡 ট্রিক ১: পেজ লোড হওয়ার সাথে সাথেই আগে চেক হবে টোকেন আছে কি না
    if (!token || !email) {
      toast.warning("Please login first to view analytics");
      navigate("/login"); // আপনার প্রজেক্টের লগইন রাউটের পাথ (যেমন: /login)
      return;
    }
    load();
  }, [token, email]);

  const load = async () => {
    try {
      const res = await fetch(`${API}/user-dashboard-chart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token // টোকেন পাঠানো হচ্ছে
        },
        body: JSON.stringify({ email })
      });

      // যদি সার্ভার থেকে ৪০১ বা ৪০৩ (Unauthorized) রেসপন্স আসে
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      const result = await res.json();

      if (result && result.success !== false) {
        setData(result);
      } else {
        setError(true);
        toast.error(result.msg || "Failed to load analytics data");
      }
    } catch (err) {
      console.log("ANALYTICS LOAD ERROR:", err);
      setError(true);
      toast.error("Server error. Could not load data.");
    }
  };

  if (error) {
    return (
      <div style={styles.loading}>
        <p style={{ color: "#ef4444" }}>Failed to load charts. Please try refreshing.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.loading}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "30px" }}>📊</span>
          <h2>Loading Analytics...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Analytics</h1>

      <div style={styles.summaryGrid}>
        <div style={styles.card}>
          <h2>₹{Number(data.wallet || 0).toLocaleString("en-IN")}</h2>
          <p>Wallet Balance</p>
        </div>

        <div style={styles.card}>
          <h2>₹{Number(data.totalBonus || 0).toLocaleString("en-IN")}</h2>
          <p>Total Bonus</p>
        </div>

        <div style={styles.card}>
          <h2 style={{ color: String(data.activeStatus).toLowerCase() === "active" ? "#22c55e" : "#ef4444" }}>
            {data.activeStatus || "N/A"}
          </h2>
          <p>Account Status</p>
        </div>
      </div>

      <div style={styles.chartBox}>
        <h2>Monthly Income Growth</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.monthlyData || []}>
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#1e293b", borderRadius: "10px", border: "none" }} />
            <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartBox}>
        <h2>Investment Growth</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.monthlyData || []}>
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#1e293b", borderRadius: "10px", border: "none" }} />
            <Bar dataKey="investment" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartBox}>
        <h2>Monthly Referral Growth</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.monthlyData || []}>
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#1e293b", borderRadius: "10px", border: "none" }} />
            <Bar dataKey="referrals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartBox}>
        <h2>Income Breakdown</h2>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data.incomeBreakdown || []}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label={{ fill: 'white', fontSize: 13 }}
            >
              {(data.incomeBreakdown || []).map((entry, index) => {
                const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6"];
                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
              })}
            </Pie>
            <Tooltip contentStyle={{ background: "#1e293b", borderRadius: "10px", border: "none" }} />
          </PieChart>
        </ResponsiveContainer>
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
  loading: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    textAlign: "center",
    color: "#22c55e",
    fontWeight: "bold",
    marginBottom: "20px"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
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
    padding: "20px",
    borderRadius: "20px",
    marginTop: "20px",
    border: "1px solid #334155"
  }
};
