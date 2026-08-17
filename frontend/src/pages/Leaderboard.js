import { useState } from "react";

// ৭ দিনের সম্পূর্ণ ৫০ জনের লিস্ট (প্রথম ১০ জন আসল নাম + বাকি ৪০ জন)
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
  // বাকি ৪০ জন (৭ দিনের জন্য)
  { name: "Sayan Pal", refs: 10, earning: 9500 },
  { name: "Piu Sarkar", refs: 10, earning: 9500 },
  { name: "Subhajit Adhikari", refs: 10, earning: 9500 },
  { name: "Tanmoy Saha", refs: 10, earning: 9500 },
  { name: "Barnali Barman", refs: 10, earning: 9500 },
  { name: "Aritra Majumder", refs: 10, earning: 9500 },
  { name: "Moumita Hazra", refs: 10, earning: 9500 },
  { name: "Dipak Singh", refs: 10, earning: 9500 },
  { name: "Sanchita Sharma", refs: 10, earning: 9500 },
  { name: "Kaushik Gupta", refs: 10, earning: 9500 },
  { name: "Rahul Yadav", refs: 10, earning: 9500 },
  { name: "Anjali Kumar", refs: 10, earning: 9500 },
  { name: "Bikram Verma", refs: 10, earning: 9500 },
  { name: "Pooja Kapoor", refs: 10, earning: 9500 },
  { name: "Amitabh Khanna", refs: 10, earning: 9500 },
  { name: "Sneha Iyer", refs: 10, earning: 9500 },
  { name: "Vikash Pillai", refs: 10, earning: 9500 },
  { name: "Manisha Roy", refs: 10, earning: 9500 },
  { name: "Rajesh Das", refs: 10, earning: 9500 },
  { name: "Sunita Banerjee", refs: 10, earning: 9500 },
  { name: "Arjun Chatterjee", refs: 7, earning: 6600 },
  { name: "Megha Mukherjee", refs: 7, earning: 6600 },
  { name: "Suresh Ghosh", refs: 7, earning: 6600 },
  { name: "Divya Kundu", refs: 7, earning: 6600 },
  { name: "Rohan Sen", refs: 7, earning: 6600 },
  { name: "Neha Biswas", refs: 7, earning: 6600 },
  { name: "Karan Mondal", refs: 7, earning: 6600 },
  { name: "Swati Dutta", refs: 7, earning: 6600 },
  { name: "Vijay Pal", refs: 7, earning: 6600 },
  { name: "Anita Sarkar", refs: 7, earning: 6600 },
  { name: "Sanjay Adhikari", refs: 7, earning: 6600 },
  { name: "Ritu Saha", refs: 7, earning: 6600 }
];

// ৩০ দিনের জন্য নির্দিষ্ট ৫০ জনের বাঙালি ও ভারতীয় নামের লিস্ট
const leaderboardData30Days = [
  { name: "Animesh Das", refs: 48, earning: 33552 },
  { name: "Sumit Banerjee", refs: 45, earning: 31455 },
  { name: "Priyanka Chatterjee", refs: 44, earning: 30756 },
  { name: "Soham Mukherjee", refs: 42, earning: 29358 },
  { name: "Debjani Ghosh", refs: 40, earning: 27960 },
  { name: "Arindam Kundu", refs: 39, earning: 27261 },
  { name: "Tumpa Sen", refs: 38, earning: 26562 },
  { name: "Sourav Biswas", refs: 37, earning: 25863 },
  { name: "Riya Mondal", refs: 36, earning: 25164 },
  { name: "Abhishek Dutta", refs: 35, earning: 24465 },
  { name: "Sayan Pal", refs: 34, earning: 23766 },
  { name: "Piu Sarkar", refs: 33, earning: 23067 },
  { name: "Subhajit Adhikari", refs: 32, earning: 22368 },
  { name: "Tanmoy Saha", refs: 31, earning: 21669 },
  { name: "Barnali Barman", refs: 30, earning: 20970 },
  { name: "Aritra Majumder", refs: 29, earning: 20271 },
  { name: "Moumita Hazra", refs: 28, earning: 19572 },
  { name: "Dipak Singh", refs: 27, earning: 18873 },
  { name: "Sanchita Sharma", refs: 26, earning: 18174 },
  { name: "Kaushik Gupta", refs: 25, earning: 17475 },
  { name: "Rahul Yadav", refs: 24, earning: 16776 },
  { name: "Anjali Kumar", refs: 23, earning: 16077 },
  { name: "Bikram Verma", refs: 22, earning: 15378 },
  { name: "Pooja Kapoor", refs: 21, earning: 14679 },
  { name: "Amitabh Khanna", refs: 20, earning: 13980 },
  { name: "Sneha Iyer", refs: 19, earning: 13281 },
  { name: "Vikash Pillai", refs: 18, earning: 12582 },
  { name: "Manisha Roy", refs: 17, earning: 11883 },
  { name: "Rajesh Das", refs: 16, earning: 11184 },
  { name: "Sunita Banerjee", refs: 15, earning: 10485 },
  { name: "Arjun Chatterjee", refs: 14, earning: 9786 },
  { name: "Megha Mukherjee", refs: 13, earning: 9087 },
  { name: "Suresh Ghosh", refs: 12, earning: 8388 },
  { name: "Rama Basu Biswas", refs: 3, earning: 7689 },
  { name: "Rohan Sen", refs: 10, earning: 6990 },
  { name: "Neha Biswas", refs: 9, earning: 6291 },
  { name: "Karan Mondal", refs: 8, earning: 5592 },
  { name: "Swati Dutta", refs: 7, earning: 4893 },
  { name: "Vijay Pal", refs: 6, earning: 4194 },
  { name: "Anita Sarkar", refs: 5, earning: 3495 },
  { name: "Sanjay Adhikari", refs: 12, earning: 8388 },
  { name: "Ritu Saha", refs: 11, earning: 7689 },
  { name: "Amit Barman", refs: 10, earning: 6990 },
  { name: "Priya Majumder", refs: 9, earning: 6291 },
  { name: "Vivek Hazra", refs: 8, earning: 5592 },
  { name: "Anil Singh", refs: 7, earning: 4893 },
  { name: "Sunil Sharma", refs: 6, earning: 4194 },
  { name: "Rekha Gupta", refs: 5, earning: 3495 },
  { name: "Deepak Yadav", refs: 15, earning: 10485 },
  { name: "Kavita Kumar", refs: 14, earning: 9786 }
].sort((a, b) => b.earning - a.earning);

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("7days");

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
        {(activeTab === "7days" ? leaderboardData7Days : leaderboardData30Days).map((u, i) => (
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
