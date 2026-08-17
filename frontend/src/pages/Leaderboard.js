import { useState } from "react";

const leaderboardData7Days = [
  { name: "Animesh Das", refs: 20, earning: 19000 },
  { name: "Sumit Banerjee", refs: 20, earning: 19000 },
  { name: "Priyanka Chatterjee", refs: 20, earning: 19000 },
  { name: "Soham Mukherjee", refs: 20, earning: 19000 },
  { name: "Debjani Ghosh", refs: 20, earning: 19000 },
  { name: "Arindam Kundu", refs: 20, earning: 19000 },
  { name: "Tumpa Sen", refs: 20, earning: 19000 },
  { name: "Sourav Biswas", refs: 20, earning: 19000 },
  { name: "Riya Mondal", refs: 13, earning: 11900 },
  { name: "Abhishek Dutta", refs: 10, earning: 9500 },
  ...Array.from({ length: 28 }, (_, i) => ({ name: `User ${i + 11}`, refs: 10, earning: 9500 })),
  ...Array.from({ length: 12 }, (_, i) => ({ name: `User ${i + 39}`, refs: 7, earning: 6600 }))
];

const generate30DaysData = () => {
  const names = Array.from({ length: 50 }, (_, i) => `User ${i + 1}`);
  return names.map((name) => {
    const refs = Math.floor(Math.random() * 50) + 5;
    const rate = [499, 599, 699][Math.floor(Math.random() * 3)];
    return { name, refs, earning: refs * rate };
  }).sort((a, b) => b.earning - a.earning);
};

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("7days");
  const data30Days = generate30DaysData();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏆 Leaderboard</h1>
      
      <div style={styles.tabContainer}>
        <button onClick={() => setActiveTab("7days")} style={activeTab === "7days" ? styles.activeTab : styles.tab}>7 Days</button>
        <button onClick={() => setActiveTab("30days")} style={activeTab === "30days" ? styles.activeTab : styles.tab}>30 Days</button>
      </div>

      <div style={styles.list}>
        {(activeTab === "7days" ? leaderboardData7Days : data30Days).map((u, i) => (
          <div key={i} style={styles.row}>
            <div style={styles.rankBadge}>#{i + 1}</div>
            <div style={styles.userInfo}>
              <div style={styles.name}>{u.name}</div>
              <div style={styles.stats}>{u.refs} Referrals</div>
            </div>
            <div style={styles.earning}>₹{u.earning}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#0f172a", color: "white", padding: "20px", minHeight: "100vh", fontFamily: "Arial, sans-serif" },
  title: { textAlign: "center", color: "#22c55e", marginBottom: "20px" },
  tabContainer: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" },
  tab: { padding: "10px 20px", cursor: "pointer", background: "#334155", border: "none", color: "#94a3b8", borderRadius: "8px", fontWeight: "bold" },
  activeTab: { padding: "10px 20px", cursor: "pointer", background: "#22c55e", border: "none", color: "white", borderRadius: "8px", fontWeight: "bold" },
  list: { maxWidth: "600px", margin: "0 auto" },
  row: { background: "#1e293b", padding: "15px", margin: "10px 0", borderRadius: "12px", display: "flex", alignItems: "center", border: "1px solid #334155" },
  rankBadge: { fontSize: "18px", fontWeight: "bold", color: "#fbbf24", marginRight: "15px", width: "40px" },
  userInfo: { flexGrow: 1 },
  name: { fontWeight: "bold", fontSize: "16px" },
  stats: { fontSize: "12px", color: "#94a3b8" },
  earning: { fontWeight: "bold", color: "#22c55e", fontSize: "16px" }
};
