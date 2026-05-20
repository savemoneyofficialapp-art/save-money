import { useEffect, useState } from "react";
import axios from "axios";

import API from "../api";

export default function AdminSupport() {
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await fetch(`${API}/admin-tickets`, {
      headers: {
        authorization: token
      }
    });

    setTickets(await res.json());
  };

  const reply = async (id) => {
    const res = await fetch(`${API}/reply-ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token
      },
      body: JSON.stringify({
        ticketId: id,
        message: replyText[id]
      })
    });

    const data = await res.json();

if (
  data.msg === "Token expired or invalid"
) {

  localStorage.clear();

  alert("Session expired. Please login again.");

  window.location.href = "/login";

  return;
}

    alert(data.msg);

    setReplyText({
      ...replyText,
      [id]: ""
    });

    load();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin Support Tickets</h2>

      {tickets.map((t) => (
        <div key={t._id} style={styles.ticket}>
          <h3>{t.subject}</h3>
          <p>{t.email}</p>
          <b>Status: {t.status}</b>

          {t.replies.map((r, i) => (
            <div key={i} style={styles.reply}>
              <b>{r.sender}</b>
              <p>{r.message}</p>
            </div>
          ))}

          <textarea
            style={styles.textarea}
            placeholder="Admin reply"
            value={replyText[t._id] || ""}
            onChange={(e) =>
              setReplyText({
                ...replyText,
                [t._id]: e.target.value
              })
            }
          />

          <button style={styles.btn} onClick={() => reply(t._id)}>
            Reply
          </button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "20px"
  },

  title: {
    color: "#22c55e",
    textAlign: "center"
  },

  ticket: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "16px",
    marginTop: "15px"
  },

  reply: {
    background: "#0f172a",
    padding: "10px",
    borderRadius: "10px",
    marginTop: "10px"
  },

  textarea: {
    width: "100%",
    minHeight: "80px",
    borderRadius: "10px",
    padding: "10px",
    marginTop: "10px"
  },

  btn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "#22c55e",
    color: "#020617",
    fontWeight: "bold",
    marginTop: "10px"
  }
};