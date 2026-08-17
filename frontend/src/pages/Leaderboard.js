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
];

// ৩০ দিনের ডেটা জেনারেট করার ফাংশন
const generate30DaysData = () => {
  const names = [
    "Animesh Das", "Sumit Banerjee", "Priyanka Chatterjee", "Soham Mukherjee", "Debjani Ghosh", 
    "Arindam Kundu", "Tumpa Sen", "Sourav Biswas", "Riya Mondal", "Abhishek Dutta",
    "Sayan Pal", "Piu Sarkar", "Subhajit Adhikari", "Tanmoy Saha", "Barnali Barman",
    "Aritra Majumder", "Moumita Hazra", "Dipak Singh", "Sanchita Sharma", "Kaushik Gupta",
    "Rahul Yadav", "Anjali Kumar", "Bikram Verma", "Pooja Kapoor", "Amitabh Khanna",
    "Sneha Iyer", "Vikash Pillai", "Manisha Roy", "Rajesh Das", "Sunita Banerjee",
    "Arjun Chatterjee", "Megha Mukherjee", "Suresh Ghosh", "Divya Kundu", "Rohan Sen",
    "Neha Biswas", "Karan Mondal", "Swati Dutta", "Vijay Pal", "Anita Sarkar",
    "Sanjay Adhikari", "Ritu Saha", "Amit Barman", "Priya Majumder", "Vivek Hazra",
    "Anil Singh", "Sunil Sharma", "Rekha Gupta", "Deepak Yadav", "Kavita Kumar"
  ];
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
      
      {/* Tab Buttons */}
      <div style={styles.tabContainer}>
        <button onClick={() => setActiveTab("7days")} style={activeTab === "7days" ? styles.activeTab : styles.tab}>7 Days</button>
        <button onClick={() => setActiveTab("30days")} style={activeTab === "30days" ? styles.activeTab : styles.tab}>30 Days</button>
      </div>

      {/* Leaderboard Rows */}
      <div style={styles.list}>
        {(activeTab === "7days" ? leaderboardData7Days : data30Days).map((u, i) => (
          <div key={i} style={styles.row}>
            <span>#{i + 1} {u.name}</span>
            <span>{u.refs} Referrals - <b>₹{u.earning}</b></span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#0f172a", color: "white", padding: "20px", minHeight: "100vh" },
  title: { textAlign: "center", color: "#22c55e" },
  tabContainer: { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" },
  tab: { padding: "10px 20px", cursor: "pointer", background: "#334155", border: "none", color: "white", borderRadius: "5px" },
  activeTab: { padding: "10px 20px", cursor: "pointer", background: "#22c55e", border: "none", color: "white", borderRadius: "5px" },
  row: { background: "#1e293b", padding: "15px", margin: "10px 0", borderRadius: "10px", display: "flex", justifyContent: "space-between" }
};
