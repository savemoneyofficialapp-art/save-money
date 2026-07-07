import { useState, useRef, useEffect } from "react";

export default function InvestmentAssistant() {
  const [language, setLanguage] = useState(null); // 'bn' বা 'en'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // চ্যাট স্ক্রল সবসময় নিচে রাখার জন্য
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

  // ক্যালকুলেশন লজিক (যা আগের কোডে ছিল)
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
      return `আপনার হিসাব অনুযায়ী: যদি আপনি প্রতি মাসে ₹${amount.toLocaleString("en-IN")} করে ${years} বছরের জন্য ইনভেস্ট করেন, তবে আপনার মোট ইনভেস্টমেন্ট হবে ₹${totalInvest.toLocaleString("en-IN")}। আনুমানিক লাভ বা ইন্টারেস্ট পাবেন ₹${interest.toLocaleString("en-IN")}, এবং মেয়াদ শেষে মোট ম্যাচিউরিটি অ্যামাউন্ট হবে ₹${maturity.toLocaleString("en-IN")}।`;
    } else {
      return `According to calculation: If you invest ₹${amount.toLocaleString("en-IN")} monthly for ${years} years, your total investment will be ₹${totalInvest.toLocaleString("en-IN")}. Estimated interest will be ₹${interest.toLocaleString("en-IN")}, and your expected maturity amount will be ₹${maturity.toLocaleString("en-IN")}.`;
    }
  };

  // ইউজারের টেক্সট অ্যানালাইসিস করে এআই রেসপন্স তৈরি
  const generateAIResponse = (text) => {
    const cleanText = text.toLowerCase();
    
    // ১. টেক্সট থেকে সংখ্যা (Amount এবং Years) খুঁজে বের করার চেষ্টা
    const numbers = cleanText.match(/\d+/g);
    
    // যদি ইনভেস্টমেন্ট রিলেটেড কোনো কিওয়ার্ড থাকে এবং সংখ্যা থাকে
    if (
      (cleanText.includes("invest") || cleanText.includes("মাসিক") || cleanText.includes("ইনভেস্ট") || cleanText.includes("জমা") || cleanText.includes("টাকা") || cleanText.includes("পাব")) &&
      numbers && numbers.length >= 2
    ) {
      // সাধারণত ছোট সংখ্যাটি বছর এবং বড় সংখ্যাটি অ্যামাউন্ট হয়
      const num1 = Number(numbers[0]);
      const num2 = Number(numbers[1]);
      
      const amount = Math.max(num1, num2);
      let years = Math.min(num1, num2);

      // বছর যেন অপশনের বাইরের কিছু না হয়ে যায় (১, ৩, ৫, ১০, ২০, ২৫)
      if (years <= 2) years = 1;
      else if (years <= 4) years = 3;
      else if (years <= 7) years = 5;
      else if (years <= 15) years = 10;
      else if (years <= 22) years = 20;
      else years = 25;

      return calculateInvestment(amount, years);
    }

    // ২. সাধারণ ইনভেস্টমেন্ট প্রশ্ন
    if (cleanText.includes("hello") || cleanText.includes("hi") || cleanText.includes("হ্যালো") || cleanText.includes("হাই")) {
      return language === "bn" ? "হ্যালো! বলুন কীভাবে সাহায্য করতে পারি?" : "Hello! How can I assist you with investments today?";
    }

    if (cleanText.includes("rate") || cleanText.includes("ইন্টারেস্ট") || cleanText.includes("লাভ") || cleanText.includes("profit")) {
      return language === "bn" 
        ? "আমাদের এখানে ১ বছরের জন্য ১১%, ৩ বছরের জন্য ১৪%, এবং ৫ বছর বা তার বেশি সময়ের জন্য ২০% পর্যন্ত ইন্টারেস্ট রেট পাওয়া যায়।" 
        : "Our interest rates are: 11% for 1 Year, 14% for 3 Years, and up to 20% for 5 Years or more.";
    }

    // ৩. আউট অফ টপিক গার্ডরেল (ইনভেস্টমেন্ট ছাড়া অন্য কথা বললে)
    if (language === "bn") {
      return "দুঃখিত, আমি শুধুমাত্র ইনভেস্টমেন্ট, সঞ্চয় এবং ফিন্যান্স সংক্রান্ত প্রশ্নের উত্তর দিতে পারি। দয়া করে ইনভেস্টমেন্ট বিষয়ক কিছু জিজ্ঞাসা করুন।";
    } else {
      return "Sorry, I can only assist you with investment, savings, and finance-related queries. Please ask something related to investments.";
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // AI এর টাইপিং এফেক্ট দেওয়ার জন্য একটু ডিলে (Delay)
    setTimeout(() => {
      const aiReply = generateAIResponse(input);
      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
      setLoading(false);
    }, 800);
  };

  // ভাষা নির্বাচন না করা পর্যন্ত এই স্ক্রিন দেখাবে
  if (!language) {
    return (
      <div style={styles.container}>
        <div style={styles.langCard}>
          <h2 style={styles.title}>AI Investment Assistant</h2>
          <p style={{ textAlign: "center", color: "#cbd5e1", marginBottom: "20px" }}>
            Choose your preferred language to start chatting / চ্যাট শুরু করতে আপনার ভাষা বেছে নিন
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
      <header style={styles.chatHeader}>
        <button style={styles.backBtn} onClick={() => { setLanguage(null); setMessages([]); }}>
          ◀ Change Language
        </button>
        <h3 style={{ margin: 0, color: "#22c55e" }}>AI Assistant ({language === "bn" ? "বাংলা" : "English"})</h3>
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
                color: "white",
                borderRadius: msg.sender === "user" ? "18px 18px 0px 18px" : "18px 18px 18px 0px",
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
          placeholder={language === "bn" ? "আপনার প্রশ্ন এখানে টাইপ করুন..." : "Type your query here..."}
        />
        <button style={styles.sendBtn} onClick={handleSend}>
          ➔
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#22c55e",
    marginBottom: "10px"
  },
  langCard: {
    background: "#1e293b",
    padding: "30px",
    borderRadius: "24px",
    width: "90%",
    maxWidth: "400px",
    margin: "auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
  },
  btn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px"
  },
  chatHeader: {
    padding: "15px",
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
    fontSize: "14px"
  },
  chatBox: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  messageRow: {
    display: "flex",
    width: "100%"
  },
  messageBubble: {
    maxWidth: "75%",
    padding: "12px 16px",
    fontSize: "15px",
    lineHeight: "22px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
  },
  inputArea: {
    padding: "15px",
    background: "#1e293b",
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  chatInput: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "white",
    fontSize: "15px",
    outline: "none"
  },
  sendBtn: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    border: "none",
    background: "#22c55e",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};
