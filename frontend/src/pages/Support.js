import { useEffect, useState } from "react";
import axios from "axios";
"https://save-money-yyv1.onrender.com";

export default function Support() {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await fetch(`${API}/my-tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({ email })
    });

    setTickets(await res.json());
  };

  const createTicket = async () => {
    const res = await fetch(`${API}/create-ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({
        email,
        subject,
        message
      })
    });

    const data = await res.json();
    alert(data.msg);

    setSubject("");
    setMessage("");

    load();
  };

  const closeTicket = async (id) => {
    const res = await fetch(`${API}/close-ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({
        ticketId: id
      })
    });

    const data = await res.json();
    alert(data.msg);
    load();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Live Support</h2>

      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <textarea
          style={styles.textarea}
          placeholder="Write your issue"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button style={styles.btn} onClick={createTicket}>
          Create Ticket
        </button>
      </div>

      <h3>Your Tickets</h3>

      {tickets.map((t) => (
        <div key={t._id} style={styles.ticket}>
          <div style={styles.row}>
            <h3>{t.subject}</h3>
            <span
              style={{
                ...styles.status,
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

          {t.replies.map((r, i) => (
            <div
              key={i}
              style={{
                ...styles.reply,
                borderLeft:
                  r.sender === "admin"
                    ? "4px solid #22c55e"
                    : "4px solid #3b82f6"
              }}
            >
              <b>{r.sender === "admin" ? "Admin" : "You"}</b>
              <p>{r.message}</p>
              <small>{new Date(r.date).toLocaleString()}</small>
            </div>
          ))}

          {t.status !== "Closed" && (
            <button
              style={styles.closeBtn}
              onClick={() => closeTicket(t._id)}
            >
              Close Ticket
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "white",
    padding: "20px"
  },

  title: {
    textAlign: "center",
    color: "#22c55e"
  },

  card: {
    background: "#1e293b",
    padding: "18px",
    borderRadius: "18px",
    marginTop: "15px"
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginTop: "10px"
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    marginTop: "10px"
  },

  btn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#22c55e",
    color: "#020617",
    fontWeight: "bold",
    marginTop: "12px"
  },

  ticket: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "16px",
    marginTop: "15px"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  status: {
    padding: "5px 10px",
    borderRadius: "20px",
    color: "white",
    fontSize: "12px"
  },

  reply: {
    background: "#0f172a",
    padding: "12px",
    borderRadius: "10px",
    marginTop: "10px"
  },

  closeBtn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "#ef4444",
    color: "white",
    fontWeight: "bold",
    marginTop: "12px"
  }
};