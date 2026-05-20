import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
"https://save-money-yyv1.onrender.com";

const socket = io(`${API}`);

export default function Notifications() {

  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  useEffect(() => {

    if (!email) {
      navigate("/");
      return;
    }

    socket.emit("register", email);
    socket.emit("join", email);

    fetchData();

    socket.on("new-notification", (msg) => {
      const newMsg = normalizeNotification(msg);
      setData(prev => [newMsg, ...prev]);
      setPopup(newMsg);

      setTimeout(() => {
        setPopup(null);
      }, 4000);
    });

    socket.on("new_notification", (msg) => {
      const newMsg = normalizeNotification(msg);
      setData(prev => [newMsg, ...prev]);
      setPopup(newMsg);

      setTimeout(() => {
        setPopup(null);
      }, 4000);
    });

    return () => {
      socket.off("new-notification");
      socket.off("new_notification");
    };

  }, [email, navigate]);

  const normalizeNotification = (n) => {
    return {
      _id: n._id || Date.now(),
      title: n.title || "Notification",
      message: n.message || n.text || "",
      date: n.date || n.createdAt || new Date(),
      read: n.read || false
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/get-notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const result = await res.json();

      const finalData = Array.isArray(result)
        ? result.map(normalizeNotification)
        : [];

      setData(finalData);

    } catch (err) {
      console.log("Notification fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await fetch(`${API}/read-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ id })
      });

      setData(prev =>
        prev.map(n =>
          n._id === id ? { ...n, read: true } : n
        )
      );

    } catch (err) {
      console.log("Read error:", err);
    }
  };

  return (
    <div style={styles.container}>

      {popup && (
        <div style={styles.popup}>
          <b>{popup.title}</b>
          <p>{popup.message}</p>
        </div>
      )}

      <h2 style={styles.title}>Notifications</h2>

      {loading && <p>Loading...</p>}

      {!loading && data.length === 0 && (
        <div style={styles.empty}>
          No notifications yet
        </div>
      )}

      {data.map((n, i) => (
        <div
          key={n._id || i}
          style={{
            ...styles.card,
            borderLeft: n.read
              ? "4px solid #64748b"
              : "4px solid #22c55e"
          }}
          onClick={() => markRead(n._id)}
        >

          <div style={styles.row}>
            <h3 style={styles.cardTitle}>
              {n.title}
            </h3>

            {!n.read && (
              <span style={styles.badge}>
                New
              </span>
            )}
          </div>

          <p style={styles.message}>
            {n.message}
          </p>

          <small style={styles.date}>
            {new Date(n.date).toLocaleString()}
          </small>

        </div>
      ))}

      <button style={styles.btn} onClick={() => navigate("/home")}>
        Back
      </button>

    </div>
  );
}

const styles = {

  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "white",
    padding: "20px",
    position: "relative"
  },

  title: {
    textAlign: "center",
    color: "#22c55e",
    marginBottom: "20px"
  },

  card: {
    background: "#1e293b",
    padding: "14px",
    marginTop: "12px",
    borderRadius: "12px",
    boxShadow: "0 0 12px rgba(0,0,0,0.35)",
    cursor: "pointer"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  cardTitle: {
    margin: 0,
    fontSize: "16px"
  },

  message: {
    color: "#cbd5e1",
    marginTop: "8px"
  },

  date: {
    color: "#94a3b8"
  },

  badge: {
    background: "#22c55e",
    color: "#020617",
    padding: "3px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "bold"
  },

  empty: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#94a3b8"
  },

  popup: {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#22c55e",
    color: "#020617",
    padding: "14px",
    borderRadius: "12px",
    zIndex: 9999,
    width: "260px",
    boxShadow: "0 0 20px rgba(0,0,0,0.5)"
  },

  btn: {
    marginTop: "25px",
    width: "100%",
    padding: "12px",
    background: "#22c55e",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer"
  }

};