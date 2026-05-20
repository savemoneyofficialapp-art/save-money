import { useState } from "react";
import axios from "axios";

"https://save-money-yyv1.onrender.com";

export default function AdminNotification() {

  const [email, setEmail] = useState("");
  const [text, setText] = useState("");

  const send = async () => {

    const res = await fetch(`${API}/send-notification`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, text })
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
  };

  return (
    <div style={{padding:"20px"}}>

      <h2>Send Notification</h2>

      <input
        placeholder="User Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <input
        placeholder="Message"
        value={text}
        onChange={(e)=>setText(e.target.value)}
      />

      <button onClick={send}>Send</button>

    </div>
  );
}