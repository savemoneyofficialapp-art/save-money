import { useState } from "react";

export default function Support() {
  // States
  const [subject, setSubject] = useState("");
  const [problem, setProblem] = useState("");

  // টেলিগ্রামে রিডাইরেক্ট করার ফাংশন
  const handleTakeSupport = (e) => {
    e.preventDefault();

    if (!subject.trim() || !problem.trim()) {
      return alert("অনুগ্রহ করে সাবজেক্ট এবং প্রবলেম দুটিই লিখুন।");
    }

    const telegramBotUsername = "savemoneysupport";
    
    // মেসেজ ফরম্যাট তৈরি (এডমিন যাতে সহজে বুঝতে পারে)
    const formattedMessage = `📌 New Support Request\n\n🔹 Subject: ${subject}\n❌ Problem: ${problem}`;
    
    // URL এনকোড করা মেসেজ
    const encodedMessage = encodeURIComponent(formattedMessage);
    
    // Telegram ডিরেক্ট চ্যাট লিংক তৈরি
    const telegramUrl = `https://t.me/${telegramBotUsername}?text=${encodedMessage}`;

    // নতুন ট্যাবে টেলিগ্রাম ওপেন করা
    window.open(telegramUrl, "_blank");
  };

  return (
    <div style={styles.container}>
      <div style={styles.supportCard}>
        <div style={styles.header}>
          <h2 style={styles.title}>💬 Live Support</h2>
          <p style={styles.subtitle}>আপনার সমস্যাটি নিচে লিখুন, আমরা দ্রুত সমাধান করার চেষ্টা করব।</p>
        </div>

        <form onSubmit={handleTakeSupport} style={styles.form}>
          {/* Subject Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>সাবজেক্ট লিখো (Subject)</label>
            <input
              type="text"
              style={styles.input}
              placeholder="যেমন: ডিপোজিট সমস্যা, অ্যাকাউন্ট লক ইত্যাদি..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Problem Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>প্রবলেম কি (Describe Problem)</label>
            <textarea
              style={styles.textarea}
              placeholder="আপনার সমস্যাটি বিস্তারিত এখানে লিখুন..."
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" style={styles.submitBtn}>
            🚀 Take Support
          </button>
        </form>
      </div>
    </div>
  );
}

// 💎 আপনার আগের থিমের সাথে মিল রেখে প্রিমিয়াম গ্লাস-মরফিজম স্টাইল
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #020617 0%, #0b1329 100%)",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "20px"
  },

  supportCard: {
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(20px)",
    width: "100%",
    maxWidth: "500px",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255, 255, 255, 0.08)"
  },

  header: {
    textAlign: "center",
    marginBottom: "28px"
  },

  title: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "700",
    color: "#38bdf8"
  },

  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.5"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#e2e8f0"
  },

  input: {
    width: "100%",
    padding: "14px",
    background: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    color: "white",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },

  textarea: {
    width: "100%",
    minHeight: "140px",
    padding: "14px",
    background: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    color: "white",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    resize: "none",
    lineHeight: "1.5"
  },

  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #0284c7, #0369a1)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
    transition: "transform 0.1s, opacity 0.2s",
    marginTop: "10px"
  }
};
