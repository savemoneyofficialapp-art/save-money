import { useState } from "react";

export default function Support() {
  // States
  const [subject, setSubject] = useState("");
  const [problem, setProblem] = useState("");

  // টেলিগ্রামে নিয়ে যাওয়ার লজিক
  const handleGetSupport = (e) => {
    e.preventDefault();

    if (!subject.trim() || !problem.trim()) {
      return alert("অনুগ্রহ করে সাবজেক্ট এবং প্রবলেম দুটিই লিখুন।");
    }

    const telegramUsername = "savemoneysupport";
    
    // মেসেজ ফরম্যাট তৈরি (এডমিন যাতে সহজে বুঝতে পারে)
    const formattedMessage = `📌 New Support Request\n\n🔹 Subject: ${subject}\n❌ Problem: ${problem}`;
    
    // URL এনকোড করা
    const encodedMessage = encodeURIComponent(formattedMessage);
    
    // Telegram ডিরেক্ট লিংক
    const telegramUrl = `https://t.me/${telegramUsername}?text=${encodedMessage}`;

    // টেলিগ্রামে রিডাইরেক্ট করা
    window.open(telegramUrl, "_blank");
  };

  return (
    <div style={styles.container}>
      {/* পপআপ মডাল কার্ড */}
      <div style={styles.modalCard}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Start a New Conversation</h3>
        </div>
        
        <form onSubmit={handleGetSupport} style={styles.form}>
          {/* Subject Input */}
          <input
            type="text"
            style={styles.modalInput}
            placeholder="What is your issue about? (Subject)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          
          {/* Problem Input */}
          <textarea
            style={styles.modalTextarea}
            placeholder="Describe your issue in detail..."
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            required
          />
          
          {/* Action Button */}
          <div style={styles.modalActions}>
            <button type="submit" style={styles.submitBtn}>
              Get Support
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 💎 ২য় স্ক্রিনশট এবং আপনার রিকোয়েস্ট অনুযায়ী আল্ট্রা-প্রিমিয়াম স্টাইলশিট
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    // ব্যাকগ্রাউন্ডে একটি প্রিমিয়াম ডার্ক টেক-সাপোর্ট ইমেজ ও ডার্ক ওভারলে দেওয়া হয়েছে
    backgroundImage: "linear-gradient(rgba(11, 19, 41, 0.85), rgba(2, 6, 23, 0.92)), url('https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=1920&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    overflow: "hidden",
    boxSizing: "border-box"
  },

  modalCard: {
    background: "#1e293b", // স্ক্রিনশটের মতো এক্সাক্ট কালার থিম
    width: "90%",
    maxWidth: "450px",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    boxSizing: "border-box"
  },

  modalHeader: {
    marginBottom: "20px"
  },

  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#ffffff"
  },

  form: {
    display: "flex",
    flexDirection: "column"
  },

  modalInput: {
    width: "100%",
    padding: "14px 16px",
    background: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    color: "white",
    marginBottom: "16px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  },

  modalTextarea: {
    width: "100%",
    minHeight: "140px",
    padding: "14px 16px",
    background: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    color: "white",
    marginBottom: "20px",
    fontSize: "14px",
    outline: "none",
    resize: "none",
    lineHeight: "1.5",
    boxSizing: "border-box"
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end"
  },

  submitBtn: {
    padding: "12px 24px",
    background: "#38bdf8", // ২য় স্ক্রিনশটের বাটন কালার ম্যাচিংস
    border: "none",
    color: "#0f172a",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    transition: "background 0.2s, transform 0.1s",
    boxShadow: "0 4px 14px rgba(56, 189, 248, 0.2)"
  }
};
