import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../config";

export default function AdminSupport() {
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null); // লাইভ চ্যাট উইন্ডোর জন্য সিলেক্টেড টিকিট
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch(`${API}/admin-tickets`, {
        headers: {
          authorization: token
        }
      });
      const data = await res.json();
      setTickets(data);
      
      // লাইভ চ্যাট বক্স খোলা থাকলে ডাটা রিফ্রেশ করা
      if (activeTicket) {
        const updated = data.find((t) => t._id === activeTicket._id);
        if (updated) setActiveTicket(updated);
      }
    } catch (err) {
      console.log("Error loading tickets", err);
    }
  };

  const reply = async (id) => {
    if (!replyText.trim()) return alert("Please enter a reply message");

    const res = await fetch(`${API}/reply-ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({
        ticketId: id,
        message: replyText
      })
    });

    const data = await res.json();

    if (data.msg === "Token expired or invalid") {
      localStorage.clear();
      alert("Session expired. Please login again.");
      window.location.href = "/login";
      return;
    }

    setReplyText("");
    await load();
  };

  // 🛑 টিকিট ক্লোজ বা সমাধান করার ফাংশন
  const closeTicket = async (id) => {
    if (!window.confirm("Are you sure you want to mark this ticket as Closed/Resolved?")) return;
    
    try {
      // আপনার ব্যাকএন্ড এপিআই অনুযায়ী টিকিট আপডেট রুট (যেমন: /update-ticket-status বা /reply-ticket এর মাধ্যমে ক্লোজ করা)
      const res = await fetch(`${API}/reply-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          ticketId: id,
          message: "--- This ticket has been marked as RESOLVED & CLOSED by Admin ---"
          // ব্যাকএন্ডে status: "Closed" করার লজিক থাকলে এখানে পাস করতে পারেন, নতুবা মেসেজ ফ্ল্যাগ যাবে
        })
      });

      alert("Ticket pipeline closed successfully.");
      await load();
    } catch (err) {
      alert("Failed to close ticket.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎧 Enterprise Helpdesk & Support Matrix</h2>
      <p style={styles.subtitle}>Manage real-time communication nodes and resolve customer queries.</p>

      <div style={styles.layoutGrid}>
        
        {/* 📋 বামদিকের কলাম: ইনকামিং টিকিটের লিস্ট */}
        <div style={styles.ticketListPanel}>
          <h3 style={styles.panelTitle}>Active Telemetry Queue ({tickets.length})</h3>
          
          {tickets.length === 0 ? (
            <p style={styles.emptyText}>No incoming support signals detected.</p>
          ) : (
            tickets.map((t) => {
              const isSelected = activeTicket?._id === t._id;
              const isClosed = t.status?.toLowerCase() === "closed" || t.status?.toLowerCase() === "resolved";
              
              return (
                <div
                  key={t._id}
                  style={{
                    ...styles.ticketCard,
                    borderLeft: isSelected ? "4px solid #22c55e" : isClosed ? "4px solid #64748b" : "4px solid #3b82f6",
                    background: isSelected ? "#1e293b" : "#0f172a"
                  }}
                  onClick={() => setActiveTicket(t)}
                >
                  <div style={styles.ticketHeader}>
                    <b style={styles.ticketSubject}>{t.subject || "No Subject"}</b>
                    <span style={{
                      ...styles.miniStatusBadge,
                      color: isClosed ? "#94a3b8" : "#22c55e",
                      background: isClosed ? "rgba(100,116,139,0.15)" : "rgba(34,197,94,0.15)"
                    }}>
                      {t.status || "Open"}
                    </span>
                  </div>
                  <p style={styles.ticketEmail}>{t.email}</p>
                </div>
              );
            })
          )}
        </div>

        {/* 💬 ডানদিকের কলাম: লাইভ চ্যাট ইন্টেলিজেন্ট বক্স (একটাই ডেডিকেটেড বক্স) */}
        <div style={styles.chatWindowPanel}>
          {activeTicket ? (
            <div style={styles.chatContainer}>
              
              {/* চ্যাট বক্স হেডার */}
              <div style={styles.chatHeader}>
                <div>
                  <h4 style={styles.chatSubjectTitle}>✉️ {activeTicket.subject}</h4>
                  <p style={styles.chatUserSub}>{activeTicket.email}</p>
                </div>
                
                {/* অ্যাকশন বাটনসমূহ */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {activeTicket.status?.toLowerCase() !== "closed" && (
                    <button style={styles.closeTicketBtn} onClick={() => closeTicket(activeTicket._id)}>
                      🔒 Terminate Session
                    </button>
                  )}
                  <button style={styles.clearActiveBtn} onClick={() => setActiveTicket(null)}>✕</button>
                </div>
              </div>

              {/* মেসেজ স্ক্রলিং এরিয়া (এখানেই সব লাইভ চ্যাট দেখা যাবে) */}
              <div style={styles.messageHistoryBox}>
                <div style={styles.systemLogNode}>
                  📡 Communication Pipeline established. Ticket ID: {activeTicket._id}
                </div>

                {activeTicket.replies?.map((r, i) => {
                  const isAdmin = r.sender?.toLowerCase() === "admin";
                  return (
                    <div
                      key={i}
                      style={{
                        ...styles.msgBubbleWrapper,
                        justifyContent: isAdmin ? "flex-end" : "flex-start"
                      }}
                    >
                      <div
                        style={{
                          ...styles.msgBubble,
                          background: isAdmin ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)" : "#020617",
                          color: isAdmin ? "#020617" : "#f1f5f9",
                          border: isAdmin ? "none" : "1px solid #1e293b",
                          borderBottomRightRadius: isAdmin ? "4px" : "14px",
                          borderBottomLeftRadius: isAdmin ? "14px" : "4px"
                        }}
                      >
                        <span style={styles.bubbleSender}>{isAdmin ? "⚡ Secure Admin Core" : `👤 ${r.sender || "User Node"}`}</span>
                        <p style={styles.bubbleMessageText}>{r.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ইনপুট এবং অ্যাকশন সেকশন */}
              {activeTicket.status?.toLowerCase() === "closed" ? (
                <div style={styles.closedSessionAlert}>
                  🛑 This communication terminal has been CLOSED. No further transmissions allowed.
                </div>
              ) : (
                <div style={styles.chatInputArea}>
                  <textarea
                    style={styles.textarea}
                    placeholder="Type your response code / encrypted message to client node..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button style={styles.sendBtn} onClick={() => reply(activeTicket._id)}>
                    ⚡ Dispatch Reply
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div style={styles.noChatPlaceholder}>
              <div style={styles.radarIcon}>📡</div>
              <h4>No Active Communication Stream</h4>
              <p>Select a data node from the transmission queue on the left to activate secure live chat routing.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// 💎 প্রিমিয়াম আল্ট্রা-ডার্ক সাইবারনেটিক স্টাইলশীট
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0b1329 100%)",
    color: "#f1f5f9",
    padding: "24px 16px 40px",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    boxSizing: "border-box"
  },
  title: {
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "800",
    color: "#f8fafc",
    margin: "0 0 6px 0"
  },
  subtitle: {
    textAlign: "center",
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 30px 0"
  },
  layoutGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    // ডেস্কটপ স্ক্রিনে রেসপন্সিভ সাইড-বাই-সাইড ভিউ এর জন্য মিডিয়া কুয়েরি ছাড়াই ফ্লেক্সিবল গ্রিড দেওয়া হলো
    "@media(minWidth: 768px)": {
      gridTemplateColumns: "1fr 2fr"
    }
  },
  ticketListPanel: {
    background: "#0f172a",
    borderRadius: "20px",
    padding: "16px",
    border: "1px solid #1e293b",
    maxHeight: "75vh",
    overflowY: "auto"
  },
  panelTitle: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    fontWeight: "700",
    color: "#cbd5e1"
  },
  emptyText: {
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center",
    padding: "30px 0"
  },
  ticketCard: {
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "10px",
    cursor: "pointer",
    border: "1px solid #1e293b",
    transition: "all 0.2s ease"
  },
  ticketHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  ticketSubject: {
    fontSize: "14px",
    color: "#f8fafc",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "70%"
  },
  miniStatusBadge: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "8px"
  },
  ticketEmail: {
    margin: "6px 0 0 0",
    fontSize: "12px",
    color: "#64748b"
  },
  chatWindowPanel: {
    background: "#0f172a",
    borderRadius: "20px",
    border: "1px solid #1e293b",
    minHeight: "500px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 15px 30px rgba(0,0,0,0.2)"
  },
  noChatPlaceholder: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    textAlign: "center",
    color: "#64748b"
  },
  radarIcon: {
    fontSize: "40px",
    marginBottom: "14px"
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },
  chatHeader: {
    padding: "16px",
    borderBottom: "1px solid #1e293b",
    background: "#1e293b",
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  chatSubjectTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#f8fafc"
  },
  chatUserSub: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#94a3b8"
  },
  clearActiveBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "none",
    color: "#94a3b8",
    fontSize: "16px",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  closeTicketBtn: {
    background: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    border: "1px solid #ef4444",
    borderRadius: "10px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer"
  },
  messageHistoryBox: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    maxHeight: "45vh",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "#020617"
  },
  systemLogNode: {
    textAlign: "center",
    fontSize: "11px",
    color: "#475569",
    fontFamily: "monospace",
    margin: "5px 0"
  },
  msgBubbleWrapper: {
    display: "flex",
    width: "100%"
  },
  msgBubble: {
    maxWidth: "80%",
    padding: "12px 14px",
    borderRadius: "14px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  bubbleSender: {
    display: "block",
    fontSize: "10px",
    fontWeight: "700",
    marginBottom: "4px",
    opacity: 0.8
  },
  bubbleMessageText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap"
  },
  chatInputArea: {
    padding: "14px",
    borderTop: "1px solid #1e293b",
    background: "#0f172a",
    borderBottomLeftRadius: "20px",
    borderBottomRightRadius: "20px"
  },
  textarea: {
    width: "100%",
    minHeight: "65px",
    borderRadius: "12px",
    padding: "12px",
    background: "#020617",
    color: "white",
    border: "1px solid #1e293b",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    resize: "none"
  },
  sendBtn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#020617",
    fontWeight: "800",
    marginTop: "10px",
    cursor: "pointer",
    fontSize: "13px",
    boxShadow: "0 4px 15px rgba(34,197,94,0.2)"
  },
  closedSessionAlert: {
    background: "rgba(239,68,68,0.1)",
    borderTop: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171",
    padding: "20px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "700",
    borderBottomLeftRadius: "20px",
    borderBottomRightRadius: "20px"
  }
};
