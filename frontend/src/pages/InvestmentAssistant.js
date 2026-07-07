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
          ? "হ্যালো! আমি আপনার এআই ইনভেস্টমেন্ট অ্যাসিস্ট্যান্ট। ইনভেস্টমেন্ট, SIP, ওয়ান-টাইম ইনভেস্ট, রেফার করে আয় বা কীভাবে শুরু করবেন—যেকোনো প্রশ্ন আমাকে করতে পারেন।"
          : "Hello! I am your AI Investment Assistant. Feel free to ask me anything about Investments, SIP, One-time investment, Referral earnings, or how to start.";
      
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
      return `📊 আপনার হিসাব অনুযায়ী: প্রতি মাসে ₹${amount.toLocaleString("en-IN")} করে ${years} বছরের জন্য জমালে, আপনার মোট ইনভেস্টমেন্ট হবে ₹${totalInvest.toLocaleString("en-IN")}। আনুমানিক লাভ পাবেন ₹${interest.toLocaleString("en-IN")}, এবং মেয়াদ শেষে মোট ম্যাচিউরিটি পাবেন ₹${maturity.toLocaleString("en-IN")}।`;
    } else {
      return `📊 Calculation: If you invest ₹${amount.toLocaleString("en-IN")} monthly for ${years} years, your total investment will be ₹${totalInvest.toLocaleString("en-IN")}. Estimated interest will be ₹${interest.toLocaleString("en-IN")}, and total maturity will be ₹${maturity.toLocaleString("en-IN")}.`;
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

    if (cleanText.includes("sip") || cleanText.includes("এসআইপি") || cleanText.includes("সিস্টেমেটিক")) {
      return language === "bn"
        ? "💡 SIP (Systematic Investment Plan) হলো প্রতি মাসে একটি নির্দিষ্ট পরিমাণ টাকা (যেমন- ১০০০ বা ২০০০ টাকা) নিয়মিত ইনভেস্ট করার সহজ মাধ্যম। এতে একসাথে বড় অঙ্কের চাপ পড়ে না এবং চক্রবৃদ্ধি হরে ভালো রিটার্ন পাওয়া যায়।"
        : "💡 SIP (Systematic Investment Plan) is a method where you invest a fixed amount of money regularly (e.g., monthly) instead of a lump sum. It helps in averaging costs and multiplying wealth through compounding.";
    }

    if (cleanText.includes("one time") || cleanText.includes("onetime") || cleanText.includes("এককালীন") || cleanText.includes("একসাথে")) {
      return language === "bn"
        ? "💰 One-Time Invest (এককালীন বিনিয়োগ) হলো আপনার কাছে থাকা অলস টাকা একসাথে একবারে নির্দিষ্ট সময়ের জন্য ফিক্সড বা বিনিয়োগ করে দেওয়া। আমাদের এখানে দীর্ঘমেয়াদে ওয়ান-টাইমেও আকর্ষণীয় প্রফিট পাওয়া যায়।"
        : "💰 One-Time Investment means investing a lump sum amount all at once for a specific tenure, rather than making small monthly payments. It offers maximum compounding advantages over time.";
    }

    if (cleanText.includes("refer") || cleanText.includes("রেফার") || cleanText.includes("শেয়ার") || cleanText.includes("share")) {
      return language === "bn"
        ? "👥 রেফার করে আয় করা খুবই সহজ! আপনার ওয়ালেট পেজে একটি ইউনিক রেফারাল লিংক পাবেন। সেই লিংক বন্ধুদের সাথে শেয়ার করুন। তারা যখন আপনার কোড ব্যবহার করে যুক্ত হবে এবং প্ল্যাটফর্ম ব্যবহার করবে, আপনি সরাসরি আপনার ওয়ালেটে রেফারাল বোনাস ও টিম কমিশন পাবেন।"
        : "👥 Earning through referral is easy! Copy your unique Referral Link from the Wallet page and share it with friends. When they sign up and use the platform, you will receive referral rewards, team income, and lifetime commissions.";
    }

    if (cleanText.includes("কীভাবে ইনভেস্ট") || cleanText.includes("how to invest") || cleanText.includes("কিভাবে ইনভেস্ট") || cleanText.includes("স্টার্ট")) {
      return language === "bn"
        ? "🚀 ইনভেস্ট শুরু করতে প্রথমে আপনার ওয়ালেট পেজে যান এবং 'Add Cash' বাটনে ক্লিক করুন। সেখানে দেওয়া অ্যাড্রেসে টাকা পাঠিয়ে ট্রানজেকশন আইডি এবং স্ক্রিনশট সাবমিট করুন। অ্যাডমিন অ্যাপ্রুভ করার পর আপনার ব্যালেন্স অ্যাড হলে আপনি সহজেই ইনভেস্টমেন্ট শুরু করতে পারবেন।"
        : "🚀 To start investing, go to your Wallet page and click 'Add Cash'. Send the deposit amount to the given address, then submit the Transaction ID and screenshot. Once approved by the admin, your balance will be active for investment.";
    }

    if (cleanText.includes("কত টাকা") || cleanText.includes("কত ইনভেস্ট") || cleanText.includes("how much")) {
      return language === "bn"
        ? "📉 ইনভেস্টমেন্ট সবসময় আপনার সঞ্চয়ের উপর নির্ভর করে। তবে নতুনদের জন্য প্রতি মাসে ১,০০০ বা ২,০০০ টাকা দিয়ে SIP শুরু করা সবচেয়ে ভালো সিদ্ধান্ত। আপনার বাজেট বেশি হলে আপনি ওয়ান-টাইম বড় অ্যামাউন্টও ইনভেস্ট করতে পারেন, যেখানে সর্বোচ্চ ২০% পর্যন্ত রিটার্ন মিলবে।"
        : "📉 It depends on your savings. However, starting a monthly SIP with ₹1,000 or ₹2,000 is ideal for beginners. If you have extra savings, a One-Time investment is highly recommended to unlock profit rates up to 20%.";
    }

    if (cleanText.includes("rate") || cleanText.includes("ইন্টারেস্ট") || cleanText.includes("লাভ") || cleanText.includes("profit")) {
      return language === "bn" 
        ? "📈 আমাদের এখানে বিনিয়োগের মেয়াদ অনুযায়ী দুর্দান্ত প্রফিট রেট রয়েছে: \n• ১ বছর মেয়াদে: ১১% লাভ \n• ৩ বছর মেয়াদে: ১৪% লাভ \n• ৫ বছর বা তার বেশি মেয়াদে: ২০% পর্যন্ত বার্ষিক প্রফিট।" 
        : "📈 Our interest/profit rates depend on the tenure: \n• 1 Year: 11% Profit \n• 3 Years: 14% Profit \n• 5 Years or more: Up to 20% Profit annually.";
    }

    if (cleanText.includes("hello") || cleanText.includes("hi") || cleanText.includes("হ্যালো") || cleanText.includes("হাই")) {
      return language === "bn" ? "হ্যালো! বলুন, ইনভেস্টমেন্ট বা আর্নিং সংক্রান্ত কীভাবে সাহায্য করতে পারি?" : "Hello! How can I assist you with your investment or earning queries today?";
    }

    return language === "bn" 
      ? "দুঃখিত, আমি আপনার প্রশ্নটি পুরোপুরি বুঝতে পারিনি। দয়া করে ইনভেস্টমেন্ট, SIP, ওয়ান-টাইম ডিপোজিট বা রেফারাল ইনকাম সম্পর্কে স্পষ্ট করে জিজ্ঞাসা করুন।" 
      : "Sorry, I couldn't completely grasp that. Please ask clearly about Investment, SIP, One-Time savings, or Referral options.";
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
        <div style={styles.popupCard}>
          <div style={styles.iconCircle}>🤖</div>
          <h2 style={styles.title}>AI Investment Assistant</h2>
          <p style={{ textAlign: "center", color: "#e2e8f0", marginBottom: "25px", fontSize: "14px", lineHeight: "20px" }}>
            Unlock smart wealth insights. Choose your language to start / চ্যাট শুরু করতে ভাষা বেছে নিন
          </p>
          <button style={{ ...styles.btn, background: "linear-gradient(135deg, #22c55e, #15803d)", marginBottom: "14px" }} onClick={() => setLanguage("bn")}>
             বাংলা (Bengali)
          </button>
          <button style={{ ...styles.btn, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }} onClick={() => setLanguage("en")}>
             English
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.chatPopupWrapper}>
        <header style={styles.chatHeader}>
          <button style={styles.backBtn} onClick={() => { setLanguage(null); setMessages([]); }}>
            ◀ Language
          </button>
          <div style={{ textAlign: "right" }}>
            <h4 style={{ margin: 0, color: "#22c55e", fontSize: "15px" }}>AI Assistant</h4>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{language === "bn" ? "অনলাইন" : "Online"}</span>
          </div>
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
                  background: msg.sender === "user" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255, 255, 255, 0.15)",
                  backdropFilter: msg.sender === "user" ? "none" : "blur(10px)",
                  border: msg.sender === "user" ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: msg.sender === "user" ? "16px 16px 0px 16px" : "16px 16px 16px 0px",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
              <div style={{ ...styles.messageBubble, background: "rgba(255, 255, 255, 0.1)", color: "#cbd5e1" }}>
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
            placeholder={language === "bn" ? "এখানে আপনার প্রশ্ন লিখুন..." : "Type your query here..."}
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
    // ইনভেস্টমেন্ট ব্যাকগ্রাউন্ড ইমেজ (গ্রাফ এবং গ্রোথ থিম)
    backgroundImage: "linear-gradient(rgba(2, 6, 23, 0.75), rgba(15, 23, 42, 0.85)), url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1470&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "white",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: "20px",
  },
  title: {
    textAlign: "center",
    color: "#22c55e",
    fontSize: "22px",
    margin: "15px 0 10px 0",
    fontWeight: "700"
  },
  iconCircle: {
    width: "60px",
    height: "60px",
    background: "rgba(34, 197, 94, 0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    margin: "0 auto",
    border: "1px solid #22c55e"
  },
  popupCard: {
    background: "rgba(30, 41, 59, 0.65)",
    backdropFilter: "blur(16px)",
    padding: "35px 25px",
    borderRadius: "28px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    textAlign: "center"
  },
  btn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.25)"
  },
  chatPopupWrapper: {
    width: "100%",
    maxWidth: "440px", // একটি পারফেক্ট পপআপ উইন্ডো সাইজ
    height: "80vh",
    maxHeight: "680px",
    background: "rgba(17, 24, 39, 0.75)",
    backdropFilter: "blur(20px)",
    borderRadius: "28px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45)",
    border: "1px solid rgba(255, 255, 255, 0.12)"
  },
  chatHeader: {
    padding: "15px 20px",
    background: "rgba(30, 41, 59, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
  },
  backBtn: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#cbd5e1",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px"
  },
  chatBox: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  messageRow: {
    display: "flex",
    width: "100%"
  },
  messageBubble: {
    maxWidth: "85%",
    padding: "12px 16px",
    fontSize: "14.5px",
    lineHeight: "22px",
    color: "white",
    whiteSpace: "pre-line",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  inputArea: {
    padding: "15px",
    background: "rgba(30, 41, 59, 0.5)",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)"
  },
  chatInput: {
    flex: 1,
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    background: "rgba(15, 23, 42, 0.6)",
    color: "white",
    fontSize: "14.5px",
    outline: "none"
  },
  sendBtn: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};
