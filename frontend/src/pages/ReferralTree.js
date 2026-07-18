import { useEffect, useState } from "react";
import { API } from "../config";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function ReferralTree() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");
  
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState(null);
  const [filter, setFilter] = useState("all");
  const [openNodes, setOpenNodes] = useState({});
  const [selectedUser, setSelectedUser] = useState(null); // কাস্টম প্রিমিয়াম পপআপ স্টেট
  
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBusiness: 0,
    levels: {}
  });

  useEffect(() => {
    load();
  }, [filter]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/referral-tree`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email }) 
      });

      const data = await res.json();

      if (data.msg === "Token expired or invalid") {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        alert(data.msg || "Referral tree load failed");
        setTree(null); 
        return;
      }

      setTree(data.tree || null);
      setAnalytics(data.analytics || {
        totalUsers: 0,
        activeUsers: 0,
        totalBusiness: 0,
        levels: {}
      });
    } catch (err) {
      console.log("TREE ERROR:", err);
      alert("Backend error while loading referral tree");
      setTree(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (key, e) => {
    e.stopPropagation(); 
    setOpenNodes({
      ...openNodes,
      [key]: !openNodes[key]
    });
  };

  const handleUserClick = (node, parentName, e) => {
    e.stopPropagation();
    
    // মোবাইল, ইমেইল ও ওয়ালেট ব্যালেন্স সম্পূর্ণ হাইড রেখে বাকি সব ডাটা মডালে পাস করা হচ্ছে
    setSelectedUser({
      name: node.name || "N/A",
      upline: parentName || "Direct / Top Admin",
      level: node.level === 0 ? "Root (You)" : `Level ${node.level}`,
      business: node.business || 0,
      status: node.kycStatus === "approved" ? "Active" : "Inactive",
      // ব্যাকএন্ড থেকে renewDate বা nextRenewDate আসলে তা দেখাবে, না থাকলে dynamic input
      renewStatus: node.isOverdue ? "⚠️ Overdue" : "🔄 Renewed / Safe",
      renewDate: node.nextRenewDate ? new Date(node.nextRenewDate).toLocaleDateString("en-IN") : "30 Days Cycle"
    });
  };

  // রিকার্সিভ ফাংশন: ৭ লেভেল পর্যন্ত মাকড়সার জালের মতো নেটওয়ার্ক জেনারেট করে
  const renderNode = (node, indexPath = "root", parentName = "") => {
    if (!node) return null;
    const isOpen = openNodes[indexPath] || indexPath === "root";
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div style={styles.nodeWrap} key={indexPath}>
        <div style={styles.verticalLine}></div>

        <div
          style={{
            ...styles.nodeCard,
            borderColor: node.kycStatus === "approved" ? "#22c55e" : "#f59e0b",
            boxShadow: node.kycStatus === "approved" ? "0 0 15px rgba(34,197,94,0.15)" : "0 0 15px rgba(245,158,11,0.15)"
          }}
          onClick={(e) => handleUserClick(node, parentName, e)} 
        >
          <div style={styles.cardLeft}>
            <div style={{
              ...styles.avatar,
              background: node.kycStatus === "approved" ? "linear-gradient(135deg,#22c55e,#15803d)" : "linear-gradient(135deg,#f59e0b,#b45309)"
            }}>
              {node.name ? node.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h4 style={styles.levelTag}>
                {node.level === 0 ? "🔥 You" : `🎯 Level ${node.level}`}
              </h4>
              <p style={styles.nameText}>
                {node.name}
                {node.kycStatus === "approved" && <span style={styles.verifyBadge}>✔</span>}
              </p>
              <p style={styles.businessText}>Biz: ₹{node.business || 0}</p>
            </div>
          </div>

          <div style={styles.cardRight}>
            <span style={{
              ...styles.statusDot,
              background: node.kycStatus === "approved" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
              color: node.kycStatus === "approved" ? "#22c55e" : "#f59e0b",
              border: `1px solid ${node.kycStatus === "approved" ? "#22c55e" : "#f59e0b"}`
            }}>
              {node.kycStatus === "approved" ? "Active" : "Inactive"}
            </span>

            {hasChildren && (
              <button 
                style={styles.expandBtn} 
                onClick={(e) => toggleNode(indexPath, e)}
              >
                {isOpen ? "▼ Close" : `▶ Expand (${node.children.length})`}
              </button>
            )}
          </div>
        </div>

        {isOpen && hasChildren && (
          <div style={styles.childrenContainer}>
            {node.children.map((child, i) =>
              renderNode(child, `${indexPath}-${i}`, node.name)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.centerMode}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "15px", fontWeight: "bold" }}>🕷️ Generating 7-Level Web Network...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🕸️ 7 Level Spider Referral Web</h2>
      <p style={styles.subtitle}>Click on any user node to inspect their chain parameters safely.</p>

      {/* 📊 অ্যানালিটিক্স গ্রিড */}
      <div style={styles.analytics}>
        <div style={styles.analyticsCard}>
          <span style={{ fontSize: "24px" }}>👥</span>
          <h3>{analytics.totalUsers}</h3>
          <p>Total Network</p>
        </div>
        <div style={styles.analyticsCard}>
          <span style={{ fontSize: "24px" }}>✅</span>
          <h3 style={{ color: "#22c55e" }}>{analytics.activeUsers}</h3>
          <p>Active Users</p>
        </div>
        <div style={styles.analyticsCard}>
          <span style={{ fontSize: "24px" }}>💼</span>
          <h3 style={{ color: "#38bdf8" }}>₹{analytics.totalBusiness}</h3>
          <p>Total Business</p>
        </div>
      </div>

      {/* 🎛️ ফিল্টার বাটন */}
      <div style={styles.filterRow}>
        {["all", "active", "pending"].map((type) => (
          <button
            key={type}
            style={{
              ...styles.filterBtn,
              background: filter === type ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#1e293b",
              color: filter === type ? "#020617" : "white",
              border: filter === type ? "none" : "1px solid #334155"
            }}
            onClick={() => setFilter(type)}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 📂 লেভেল ব্রেকডাউন সেকশন */}
      <div style={styles.levelGrid}>
        {Object.keys(analytics.levels || {}).map((lvl) => (
          <div key={lvl} style={styles.levelMiniCard}>
            <h4>Lvl {lvl}</h4>
            <p>Users: <b>{analytics.levels[lvl].users}</b></p>
            <p>Biz: <span style={{ color: "#22c55e" }}>₹{analytics.levels[lvl].income}</span></p>
          </div>
        ))}
      </div>

      {/* 🕸️ মাকড়সার জাল থিম মেইন ট্রি */}
      <div style={styles.treeViewport}>
        {tree ? renderNode(tree) : <p style={{ textAlign: "center", color: "#94a3b8" }}>No network data found.</p>}
      </div>

      {/* 📑 ইন্টারেক্টিভ সিকিউর গ্লাস-ব্লুর ইউজার পপআপ মডাল */}
      {selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          
          {/* স্মুথ বাউন্স অ্যানিমেশন ইনজেকশন */}
          <style>{`
            @keyframes popupBounce {
              0% { transform: scale(0.78); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>

          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>📊</span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#f8fafc" }}>Node Parameters</h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.detailRow}><span>👤 Name:</span> <b>{selectedUser.name}</b></div>
              <div style={styles.detailRow}><span>👑 Upline Name:</span> <b style={{ color: "#a855f7" }}>{selectedUser.upline}</b></div>
              <div style={styles.detailRow}><span>🎯 Network Level:</span> <b style={{ color: "#38bdf8" }}>{selectedUser.level}</b></div>
              
              <div style={styles.detailRow}>
                <span>⚡ Status:</span> 
                <b style={{ 
                  color: selectedUser.status === "Active" ? "#22c55e" : "#ef4444",
                  background: selectedUser.status === "Active" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  padding: "2px 8px",
                  borderRadius: "6px"
                }}>
                  {selectedUser.status}
                </b>
              </div>

              <div style={styles.detailRow}>
                <span>🔄 Renew State:</span> 
                <b style={{ color: selectedUser.renewStatus.includes("Overdue") ? "#ef4444" : "#eab308" }}>
                  {selectedUser.renewStatus}
                </b>
              </div>

              <div style={styles.detailRow}><span>📅 Next Renew Date:</span> <b>{selectedUser.renewDate}</b></div>
              <div style={styles.detailRow}><span>💼 Team Business:</span> <b style={{ color: "#22c55e" }}>₹{selectedUser.business}</b></div>
            </div>

            <div style={{ padding: "0 20px 20px" }}>
              <button 
                style={styles.actionBtnPopup}
                onClick={() => setSelectedUser(null)}
              >
                Done, Close Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 💎 প্রিমিয়াম স্পাইডার-ওয়েব ইউআই স্টাইলস
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
    color: "white",
    padding: "20px 16px 100px",
    fontFamily: "'Segoe UI', Roboto, sans-serif"
  },
  centerMode: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #334155",
    borderTop: "4px solid #22c55e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  title: {
    textAlign: "center",
    margin: "10px 0 5px",
    fontWeight: "800",
    letterSpacing: "0.5px"
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "20px"
  },
  analytics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px"
  },
  analyticsCard: {
    background: "rgba(30, 41, 59, 0.7)",
    border: "1px solid #334155",
    padding: "12px 8px",
    borderRadius: "16px",
    textAlign: "center"
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    marginTop: "16px"
  },
  filterBtn: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  levelGrid: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    marginTop: "15px",
    paddingBottom: "5px"
  },
  levelMiniCard: {
    minWidth: "100px",
    background: "#1e293b",
    border: "1px solid #334155",
    padding: "10px",
    borderRadius: "12px",
    fontSize: "11px",
    textAlign: "center"
  },
  treeViewport: {
    marginTop: "25px",
    padding: "10px 0",
    background: "rgba(15, 23, 42, 0.4)",
    borderRadius: "20px",
    border: "1px dashed #334155"
  },
  nodeWrap: {
    position: "relative",
    marginTop: "16px"
  },
  verticalLine: {
    position: "absolute",
    left: "30px",
    top: "-16px",
    height: "16px",
    width: "2px",
    background: "#475569"
  },
  nodeCard: {
    background: "#1e293b",
    borderLeft: "5px solid",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: "15px",
    cursor: "pointer"
  },
  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#020617",
    fontSize: "15px"
  },
  levelTag: {
    margin: 0,
    fontSize: "11px",
    color: "#94a3b8"
  },
  nameText: {
    margin: "2px 0",
    fontWeight: "700",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },
  verifyBadge: {
    background: "#2563eb",
    color: "white",
    fontSize: "9px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  businessText: {
    margin: 0,
    fontSize: "12px",
    color: "#22c55e",
    fontWeight: "600"
  },
  cardRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px"
  },
  statusDot: {
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "bold"
  },
  expandBtn: {
    background: "rgba(56, 189, 248, 0.1)",
    border: "none",
    color: "#38bdf8",
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  childrenContainer: {
    marginLeft: "30px",
    paddingLeft: "15px",
    borderLeft: "2px dashed #475569"
  },
  
  // 🔮 গ্লাস-মর্ফিজম পপআপ স্টাইল শিট
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "20px"
  },
  modalCard: {
    background: "rgba(30, 41, 59, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "26px",
    width: "100%",
    maxWidth: "390px",
    boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.6)",
    animation: "popupBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
  },
  modalHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "none",
    color: "#94a3b8",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  },
  modalBody: {
    padding: "12px 22px 22px"
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "13px 0",
    borderBottom: "1px dashed rgba(255, 255, 255, 0.08)",
    fontSize: "14px",
    color: "#cbd5e1"
  },
  actionBtnPopup: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #38bdf8, #0369a1)",
    border: "none",
    borderRadius: "16px",
    color: "#020617",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(56, 189, 248, 0.2)",
    transition: "transform 0.1s"
  }
};
