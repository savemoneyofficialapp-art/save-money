import { useState, useRef, useEffect } from "react";

export default function InvestmentAssistant() {
  const [language, setLanguage] = useState(null); // 'bn' বা 'en'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (language) {
      const welcomeMsg =
        language === "bn"
          ? "হ্যালো! আমি আপনার এআই ইনভেস্টমেন্ট অ্যাসিস্ট্যান্ট। ইনভেস্টমেন্ট বা সঞ্চয় নিয়ে আপনার মনে কী প্রশ্ন আছে? (যেমন: '৫০০০ টাকা ৩ বছরের জন্য জমালে কত পাব?')"
          : "Hello! I am your AI Investment Assistant. What questions do you have about investments or savings? (e.g., 'What will I get if I invest 2000 for 5 years?')";
      
      setMessages([{ sender: "ai", text: welcomeMsg }]);
    }
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getRate = (y) => {
    if (y === 1) return 11;
    if (y === 3) return 14;
    return 20;
  };

  const calculateInvestment = (amount, years) => {
    const rate = getRate(years);
    const totalInvest = amount * 12 * years;
    const interest = Math.floor((totalInvest * rate) / 100);
    const maturity = totalInvest + interest;

    if (language === "bn") {
      return `আপনার হিসাব অনুযায়ী: যদি আপনি প্রতি মাসে ₹${amount.toLocaleString("en-IN")} করে ${years} বছরের জন্য ইনভেস্ট করেন, তবে আপনার মোট ইনভেস্টমেন্ট হবে ₹${totalInvest.toLocaleString("en-IN")}। আনুমানিক লাভ পাবেন ₹${interest.toLocaleString("en-IN")}, এবং মোট ম্যাচিউরিটি অ্যামাউন্ট হবে ₹${maturity.toLocaleString("en-IN")}।`;
    } else {
      return `According to calculation: If you invest ₹${amount.toLocaleString("en-IN")} monthly for ${years} years, your total investment will be ₹${totalInvest.toLocaleString("en-IN")}. Estimated interest will be ₹${interest.toLocaleString("en-IN")}, and your expected maturity amount will be ₹${maturity.toLocaleString("en-IN")}.`;
    }
  };

  const generateAIResponse = (text) => {
    const cleanText = text.toLowerCase();
    const numbers = cleanText.match(/\d+/g);
    
    if (
      (cleanText.includes("invest") || cleanText.includes("মাসিক") || cleanText.includes("ইনভেস্ট") || cleanText.includes("জমা") || cleanText.includes("টাকা") || cleanText.includes("পাব")) &&
      numbers && numbers.length >= 2
    ) {
      const num1 = Number(numbers[0]);
      const num2 = Number(numbers[1]);
      const amount = Math.max(num1, num2);
      let years = Math.min(num1, num2);

      if (years <= 2) years = 1;
      else if (years <= 4) years = 3;
      else if (years <= 7) years = 5;
      else if (years <= 15) years = 10;
      else if (years <= 22) years = 20;
      else years = 25;

      return calculateInvestment(amount, years);
    }

    if (cleanText.includes("hello") || cleanText.includes("hi") || cleanText.includes("হ্যালো") || cleanText.includes("হাই")) {
      return language === "bn" ? "হ্যালো! বলুন কীভাবে সাহায্য করতে পারি?" : "Hello! How can I assist you today?";
    }

    if (cleanText.includes("rate") || cleanText.includes("ইন্টারেস্ট") || cleanText.includes("লাভ") || cleanText.includes("profit")) {
      return language === "bn" 
        ? "আমাদের এখানে ১ বছরের জন্য ১১%, ৩ বছরের জন্য ১৪%, এবং ৫ বছর বা তার বেশি সময়ের জন্য ২০% পর্যন্ত ইন্টারেস্ট রেট পাওয়া যায়।" 
        : "Our interest rates are: 11% for 1 Year, 14% for 3 Years, and up to 20% for 5 Years or more.";
    }

    return language === "bn" 
      ? "দুঃখিত, আমি শুধুমাত্র ইনভেস্টমেন্ট, সঞ্চয় এবং ফিন্যান্স সংক্রান্ত প্রশ্নের উত্তর দিতে পারি।" 
      : "Sorry, I can only assist you with investment and finance-related queries.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const aiReply = generateAIResponse(input);
      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
      setLoading(false);
    }, 800);
  };

  if (!language) {
    return (
      <div style={styles.container}>
        <div style={styles.langCard}>
          <h2 style={styles.title}>AI Investment Assistant</h2>
          <p style={{ textAlign: "center", color: "#cbd5e1", marginBottom: "20px", fontSize: "14px" }}>
            Choose your preferred language / ভাষা বেছে নিন
          </p>
          <button style={{ ...styles.btn, background: "#22c55e", marginBottom: "12px" }} onClick={() => setLanguage("bn")}>
            🇧🇩 বাংলা (Bengali)
          </button>
          <button style={styles.btn} onClick={() => setLanguage("en")}>
            🇺🇸 English
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.chatWrapper}>
        <header style={styles.chatHeader}>
          <button style={styles.backBtn} onClick={() => { setLanguage(null); setMessages([]); }}>
            ◀ Language
          </button>
          <h4 style={{ margin: 0, color: "#22c55e" }}>AI Assistant ({language === "bn" ? "বাংলা" : "English"})</h4>
        </header>

        <div style={styles.chatBox}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.messageRow,
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  background: msg.sender === "user" ? "#3b82f6" : "#334155",
                  borderRadius: msg.sender === "user" ? "14px 14px 0px 14px" : "14px 14px 14px 0px",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
              <div style={{ ...styles.messageBubble, background: "#334155", color: "#94a3b8" }}>
                Typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.chatInput}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={language === "bn" ? "প্রশ্ন টাইপ করুন..." : "Type your query..."}
          />
          <button style={styles.sendBtn} onClick={handleSend}>
            ➔
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "white",
    fontFamily: "Arial, sans-serif",
    padding: "15px",
  },
  title: {
    textAlign: "center",
    color: "#22c55e",
    fontSize: "20px",
    margin: "0 0 10px 0"
  },
  langCard: {
    background: "#1e293b",
    padding: "25px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "360px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
    border: "1px solid #334155"
  },
  btn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px"
  },
  chatWrapper: {
    width: "100%",
    maxWidth: "400px", // চ্যাট বক্সের চওড়া ফিক্সড করে দেওয়া হলো
    height: "80vh",    // স্ক্রিনের বাইরে যাবে না, নির্দিষ্ট উচ্চতা থাকবে
    maxHeight: "600px",
    background: "#111827",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
    border: "1px solid #334155"
  },
  chatHeader: {
    padding: "12px 15px",
    background: "#1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #334155"
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "13px"
  },
  chatBox: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  messageRow: {
    display: "flex",
    width: "100%"
  },
  messageBubble: {
    maxWidth: "80%",
    padding: "10px 14px",
    fontSize: "14px",
    lineHeight: "20px",
    color: "white",
  },
  inputArea: {
    padding: "12px",
    background: "#1e293b",
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  chatInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "white",
    fontSize: "14px",
    outline: "none"
  },
  sendBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "none",
    background: "#22c55e",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};
