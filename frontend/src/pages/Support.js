import { useState } from "react";

export default function Support() {
  // States
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [referCode, setReferCode] = useState("");
  const [subject, setSubject] = useState("");
  const [problem, setProblem] = useState("");

  // টেলিগ্রামে নিয়ে যাওয়ার লজিক
  const handleGetSupport = (e) => {
    e.preventDefault();

    if (!name.trim() || !mobile.trim() || !subject.trim() || !problem.trim()) {
      return alert("অনুগ্রহ করে নাম, মোবাইল নম্বর, সাবজেক্ট এবং প্রবলেম ফিল্ডগুলো পূরণ করুন।");
    }

    const telegramUsername = "savemoneysupport";
    
    // মেসেজ ফরম্যাট তৈরি (এডমিন যাতে ইউজারের নাম, মোবাইল, রেফার কোড সহ সহজে বুঝতে পারে)
    const formattedMessage = `📌 New Support Request\n\n👤 Name: ${name}\n📞 Mobile: ${mobile}\n referral Code: ${referCode || "N/A"}\n🔹 Subject: ${subject}\n❌ Problem: ${problem}`;
    
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
          {/* Name Input */}
          <input
            type="text"
            style={styles.modalInput}
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Mobile Number Input */}
          <input
            type="tel"
            style={styles.modalInput}
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />

          {/* Refer Code Input (Optional) */}
          <input
            type="text"
            style={styles.modalInput}
            placeholder="Referral Code (Optional)"
            value={referCode}
            onChange={(e) => setReferCode(e.target.value)}
          />

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

// 💎 স্টাইলশিট অপরিবর্তিত রাখা হয়েছে
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw",
    backgroundImage: "linear-gradient(rgba(11, 19, 41, 0.85), rgba(2, 6, 23, 0.92)), url('https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=1920&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxSizing: "border-box",
    padding: "20px 0"
  },

  modalCard: {
    background: "#1e293b",
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
    minHeight: "120px",
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
    background: "#38bdf8",
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
