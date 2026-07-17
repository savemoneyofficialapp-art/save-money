import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { toast } from "react-toastify"; 
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
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { API } from "../config";

export default function UserAnalytics() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  
  // 🔍 কোন চার্টটি বড় করে দেখাবে তা ট্র্যাক করার জন্য স্টেট
  const [activeChart, setActiveChart] = useState(null);

  useEffect(() => {
    if (!token || !email) {
      toast.warning("Please login first to view analytics");
      navigate("/login"); 
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
          authorization: token 
        },
        body: JSON.stringify({ email })
      });

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
        <div style={styles.errorBox}>
          <span style={{ fontSize: "40px" }}>⚠️</span>
          <h2 style={{ color: "#ef4444", marginTop: "10px" }}>Error Occurred</h2>
          <p style={{ color: "#94a3b8" }}>Failed to load charts. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.loading}>
        <div style={{ textAlign: "center" }}>
          <div style={styles.spinner}></div>
          <h2 style={{ color: "#3b82f6", marginTop: "15px" }}>Loading Analytics...</h2>
        </div>
      </div>
    );
  }

  const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6"];

  // 🛠️ চার্ট রেন্ডার করার জন্য একটি কমন ফাংশন (যাতে নরমাল ও বড় দুই জায়গাতেই ব্যবহার করা যায়)
  const renderChart = (type, isZoomed = false) => {
    const height = isZoomed ? 400 : 280;
    
    if (type === "income") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data.monthlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={styles.customTooltip} />
            <Line type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (type === "investment") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data.monthlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={styles.customTooltip} />
            <Bar dataKey="investment" name="Investment" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === "referral") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data.monthlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={styles.customTooltip} />
            <Bar dataKey="referrals" name="Referrals" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === "breakdown") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data.incomeBreakdown || []}
              dataKey="value"
              nameKey="name"
              innerRadius={isZoomed ? 80 : 60}
              outerRadius={isZoomed ? 120 : 90}
              paddingAngle={4}
            >
              {(data.incomeBreakdown || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={styles.customTooltip} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📈 Dashboard Analytics</h1>
        <p style={styles.subtitle}>Click on any chart to view it in full screen.</p>
      </div>

      {/* Stats Cards Grid */}
      <div style={styles.summaryGrid}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Wallet Balance</p>
          <h2 style={{ ...styles.cardValue, color: "#3b82f6" }}>
            ₹{Number(data.wallet || 0).toLocaleString("en-IN")}
          </h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Total Bonus</p>
          <h2 style={{ ...styles.cardValue, color: "#8b5cf6" }}>
            ₹{Number(data.totalBonus || 0).toLocaleString("en-IN")}
          </h2>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Account Status</p>
          <h2 style={{ 
            ...styles.cardValue, 
            color: String(data.activeStatus).toLowerCase() === "active" ? "#22c55e" : "#ef4444" 
          }}>
            {data.activeStatus || "N/A"}
          </h2>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .charts-layout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Charts Grid */}
      <div className="charts-layout-grid" style={styles.chartsGrid}>
        
        <div style={styles.chartBox} onClick={() => setActiveChart({ type: "income", title: "Monthly Income Growth" })}>
          <div style={styles.chartHeaderRow}>
            <h3 style={styles.chartTitle}>Monthly Income Growth</h3>
            <span style={styles.zoomIcon}>🔍 Click to zoom</span>
          </div>
          {renderChart("income")}
        </div>

        <div style={styles.chartBox} onClick={() => setActiveChart({ type: "investment", title: "Investment Growth" })}>
          <div style={styles.chartHeaderRow}>
            <h3 style={styles.chartTitle}>Investment Growth</h3>
            <span style={styles.zoomIcon}>🔍 Click to zoom</span>
          </div>
          {renderChart("investment")}
        </div>

        <div style={styles.chartBox} onClick={() => setActiveChart({ type: "referral", title: "Monthly Referral Growth" })}>
          <div style={styles.chartHeaderRow}>
            <h3 style={styles.chartTitle}>Monthly Referral Growth</h3>
            <span style={styles.zoomIcon}>🔍 Click to zoom</span>
          </div>
          {renderChart("referral")}
        </div>

        <div style={styles.chartBox} onClick={() => setActiveChart({ type: "breakdown", title: "Income Breakdown" })}>
          <div style={styles.chartHeaderRow}>
            <h3 style={styles.chartTitle}>Income Breakdown</h3>
            <span style={styles.zoomIcon}>🔍 Click to zoom</span>
          </div>
          {renderChart("breakdown")}
        </div>

      </div>

      {/* 🌟 ZOOM MODAL POPUP (যেকোনো চার্টে ক্লিক করলে এটি ওপেন হবে) */}
      {activeChart && (
        <div style={styles.modalOverlay} onClick={() => setActiveChart(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ ...styles.chartTitle, margin: 0 }}>{activeChart.title}</h3>
              <button style={styles.closeButton} onClick={() => setActiveChart(null)}>✕ Close</button>
            </div>
            <div style={styles.modalBody}>
              {renderChart(activeChart.type, true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stylesheet
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
    color: "#f8fafc",
    padding: "30px 20px"
  },
  header: {
    textAlign: "center",
    marginBottom: "40px"
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: "800",
    background: "linear-gradient(to right, #3b82f6, #22c55e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "8px"
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "0.95rem"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
    marginBottom: "35px"
  },
  card: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(10px)",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  cardLabel: {
    color: "#94a3b8",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "6px"
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: "700",
    margin: "0"
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "25px"
  },
  chartBox: {
    background: "rgba(30, 41, 59, 0.4)",
    padding: "24px",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
    cursor: "pointer",
    transition: "transform 0.2s ease, border-color 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
      borderColor: "rgba(59, 130, 246, 0.3)"
    }
  },
  chartHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  chartTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#f1f5f9",
    margin: 0,
    borderLeft: "4px solid #3b82f6",
    paddingLeft: "10px"
  },
  zoomIcon: {
    fontSize: "0.75rem",
    color: "#64748b",
    background: "rgba(255,255,255,0.03)",
    padding: "4px 8px",
    borderRadius: "8px"
  },
  customTooltip: {
    background: "#0f172a",
    borderRadius: "12px",
    border: "1px solid #334155",
    color: "#fff",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
  },
  /* 🌟 Modal / Popup Styles */
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(2, 6, 23, 0.75)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px"
  },
  modalContent: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "28px",
    width: "100%",
    maxWidth: "700px",
    padding: "30px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    animation: "modalFadeIn 0.25s ease-out"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  },
  closeButton: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "background 0.2s",
    ":hover": {
      background: "#dc2626"
    }
  },
  modalBody: {
    width: "100%"
  },
  loading: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "30px",
    borderRadius: "20px",
    textAlign: "center",
    maxWidth: "400px"
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #1e293b",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto"
  }
};

// CSS Animation Injection
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `;
  document.head.appendChild(styleSheet);
}
