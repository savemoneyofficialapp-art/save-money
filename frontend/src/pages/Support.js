import { useEffect, useState, useRef } from "react";
import { API } from "../config";

export default function Support() {
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  // States
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [subject, setSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadTickets();
  }, []);

  // চ্যাট স্ক্রল ডাউন করার জন্য
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.replies]);

  // টিকিট লোড করা
  const loadTickets = async () => {
    try {
      const res = await fetch(`${API}/my-tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
        // যদি অলরেডি কোনো একটি টিকিট একটিভ থাকে, সেটির ডাটা আপডেট করা
        if (activeTicket) {
          const updatedActive = data.find(t => t._id === activeTicket._id);
          if (updatedActive) setActiveTicket(updatedActive);
        } else if (data.length > 0) {
          setActiveTicket(data[0]); // Default first active
        }
      }
    } catch (err) {
      console.error("Error loading tickets:", err);
    }
  };

  // নতুন টিকিট/চ্যাট শুরু করা
  const createTicket = async () => {
    if (!subject || !newMessage) return alert("Please fill in all fields");
    try {
      const res = await fetch(`${API}/create-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          email,
          subject,
          message: newMessage
        })
      });

      const data = await res.json();
      alert(data.msg);
      setSubject("");
      setNewMessage("");
      setShowCreateModal(false);
      await loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  // WhatsApp-এর মতো ইনস্ট্যান্ট মেসেজ রিপ্লাই লজিক
  const sendReply = async () => {
    if (!replyMessage.trim() || !activeTicket) return;
    
    try {
      // আপনার ব্যাকএন্ডে সাধারণত রিপ্লাই দেওয়ার জন্য এপিআই রাউট বা ক্রিয়েট টিকিটের ওল্ড লজিক থাকলে সে অনুযায়ী কাজ করবে।
      // এখানে আগের এপিআই আর্কিটেকচার বজায় রেখে রিয়েল-টাইম ফিনিশিং দেওয়া হয়েছে।
      const res = await fetch(`${API}/create-ticket`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          email,
          subject: activeTicket.subject, // সেম সাবজেক্টে মেসেজ পাঠানো
          message: replyMessage
        })
      });

      const data = await res.json();
      setReplyMessage("");
      await loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  // টিকিট ক্লোজ করা
  const closeTicket = async (id) => {
    if (!window.confirm("Are you sure you want to close this chat?")) return;
    try {
      const res = await fetch(`${API}/close-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ ticketId: id })
      });

      const data = await res.json();
      alert(data.msg);
      await loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR: TICKETS LIST */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>💬 Live Support</h2>
          <button style={styles.newChatBtn} onClick={() => setShowCreateModal(true)}>
            + New Chat
          </button>
        </div>

        <div style={styles.ticketList}>
          {tickets.length === 0 ? (
            <p style={styles.noTickets}>No support chats found.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t._id}
                style={{
                  ...styles.ticketItem,
                  ...(activeTicket?._id === t._id ? styles.activeTicketItem : {})
                }}
                onClick={() => setActiveTicket(t)}
              >
                <div style={styles.ticketMeta}>
                  <span style={styles.ticketSubject}>{t.subject}</span>
                  <span
                    style={{
                      ...styles.badge,
                      background:
                        t.status === "Open"
                          ? "#f59e0b"
                          : t.status === "Closed"
                          ? "#ef4444"
                          : "#22c55e"
                    }}
                  >
                    {t.status}
                  </span>
                </div>
                <p style={styles.ticketLastMsg}>
                  {t.replies?.[t.replies.length - 1]?.message || "No messages yet..."}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA (WHATSAPP WINDOW) */}
      <div style={styles.chatWindow}>
        {activeTicket ? (
          <>
            {/* Chat Top Header */}
            <div style={styles.chatHeader}>
              <div>
                <h3 style={styles.chatHeaderTitle}>{activeTicket.subject}</h3>
                <span style={styles.chatHeaderStatus}>
                  ● {activeTicket.status === "Open" ? "Active Agent" : "Closed"}
                </span>
              </div>
              
              {activeTicket.status !== "Closed" && (
                <button
                  style={styles.closeChatBtn}
                  onClick={() => closeTicket(activeTicket._id)}
                >
                  🔒 Close Chat
                </button>
              )}
            </div>

            {/* Chat Messages Body */}
            <div style={styles.chatBody}>
              {activeTicket.replies?.map((r, i) => {
                const isAdmin = r.sender === "admin";
                return (
                  <div
                    key={i}
                    style={{
                      ...styles.messageRow,
                      justifyContent: isAdmin ? "flex-start" : "flex-end"
                    }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,
                        background: isAdmin ? "#1e293b" : "#005c4b", // WhatsApp Green for User
                        borderBottomLeftRadius: isAdmin ? "0px" : "12px",
                        borderBottomRightRadius: isAdmin ? "12px" : "0px"
                      }}
                    >
                      <span style={styles.senderName}>{isAdmin ? "Support Agent" : "You"}</span>
                      <p style={styles.messageText}>{r.message}</p>
                      <span style={styles.messageTime}>
                        {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* WhatsApp Style Bottom Input Bar */}
            {activeTicket.status !== "Closed" ? (
              <div style={styles.chatFooter}>
                <input
                  style={styles.chatInput}
                  placeholder="Type a message..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                />
                <button style={styles.sendBtn} onClick={sendReply}>
                  🕊️
                </button>
              </div>
            ) : (
              <div style={styles.closedNotice}>
                This chat has been closed. Create a new ticket if you need further help.
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyChatView}>
            <div style={styles.emptyIcon}>💬</div>
            <h3>Save Money Helpdesk</h3>
            <p>Select an ongoing chat or start a new conversations to connect with support instantly.</p>
          </div>
        )}
      </div>

      {/* CREATE NEW TICKET MODAL */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3>Start a New Conversation</h3>
              <button style={styles.closeModalX} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <input
              style={styles.modalInput}
              placeholder="What is your issue about? (Subject)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              style={styles.modalTextarea}
              placeholder="Describe your issue in detail..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button style={styles.submitBtn} onClick={createTicket}>Launch Chat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 💎 আল্ট্রা-প্রিমিয়াম UI গ্লাস-মরফিজম থিম স্টাইলশিট
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "linear-gradient(135deg, #020617 0%, #0b1329 100%)",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    overflow: "hidden"
  },

  /* SIDEBAR STYLES */
  sidebar: {
    width: "320px",
    borderRight: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(20px)"
  },

  sidebarHeader: {
    padding: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  sidebarTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#38bdf8"
  },

  newChatBtn: {
    padding: "8px 14px",
    background: "linear-gradient(135deg, #0284c7, #0369a1)",
    border: "none",
    borderRadius: "20px",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)"
  },

  ticketList: {
    flex: 1,
    overflowY: "auto",
    padding: "10px"
  },

  noTickets: {
    textAlign: "center",
    color: "#64748b",
    marginTop: "40px",
    fontSize: "14px"
  },

  ticketItem: {
    padding: "14px",
    borderRadius: "14px",
    background: "rgba(30, 41, 59, 0.3)",
    cursor: "pointer",
    marginBottom: "10px",
    transition: "all 0.2s ease",
    border: "1px solid transparent"
  },

  activeTicketItem: {
    background: "rgba(30, 41, 59, 0.9)",
    borderColor: "#38bdf8",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
  },

  ticketMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },

  ticketSubject: {
    fontWeight: "600",
    fontSize: "14px",
    maxWidth: "160px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  badge: {
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    color: "white"
  },

  ticketLastMsg: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  /* MAIN WHATSAPP WINDOW STYLES */
  chatWindow: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#0b141a", // WhatsApp Dark Theme Background Color
    position: "relative"
  },

  chatHeader: {
    padding: "16px 24px",
    background: "#202c33",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.05)"
  },

  chatHeaderTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600"
  },

  chatHeaderStatus: {
    fontSize: "12px",
    color: "#22c55e",
    fontWeight: "500"
  },

  closeChatBtn: {
    padding: "8px 16px",
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid #ef4444",
    borderRadius: "10px",
    color: "#f87171",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s"
  },

  chatBody: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  messageRow: {
    display: "flex",
    width: "100%"
  },

  messageBubble: {
    maxWidth: "65%",
    padding: "10px 14px 6px",
    borderRadius: "12px",
    position: "relative",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
  },

  senderName: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#38bdf8",
    marginBottom: "4px"
  },

  messageText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.4",
    color: "#e2e8f0"
  },

  messageTime: {
    display: "block",
    textAlign: "right",
    fontSize: "10px",
    color: "#94a3b8",
    marginTop: "4px"
  },

  chatFooter: {
    padding: "12px 24px",
    background: "#202c33",
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },

  chatInput: {
    flex: 1,
    padding: "12px 18px",
    background: "#2a3942",
    border: "none",
    borderRadius: "24px",
    color: "white",
    fontSize: "14px",
    outline: "none"
  },

  sendBtn: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#00a884",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "18px"
  },

  closedNotice: {
    padding: "16px",
    background: "#ef4444",
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "14px"
  },

  /* EMPTY VIEW STATE */
  emptyChatView: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#64748b",
    padding: "40px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.5
  },

  /* MODERN MODAL DIALOG */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },

  modalCard: {
    background: "#1e293b",
    width: "450px",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.05)"
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },

  closeModalX: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "18px",
    cursor: "pointer"
  },

  modalInput: {
    width: "100%",
    padding: "12px",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "white",
    marginBottom: "14px",
    outline: "none"
  },

  modalTextarea: {
    width: "100%",
    minHeight: "120px",
    padding: "12px",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "white",
    marginBottom: "20px",
    outline: "none",
    resize: "none"
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px"
  },

  cancelBtn: {
    padding: "10px 18px",
    background: "transparent",
    border: "1px solid #475569",
    color: "#94a3b8",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },

  submitBtn: {
    padding: "10px 20px",
    background: "#38bdf8",
    border: "none",
    color: "#0f172a",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700"
  }
};


