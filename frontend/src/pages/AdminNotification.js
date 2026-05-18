import { useState } from "react";

export default function AdminNotification() {

  const [email, setEmail] = useState("");
  const [text, setText] = useState("");

  const send = async () => {

    const res = await fetch(`${process.env.REACT_APP_API}/send-notification`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, text })
    });

    const data = await res.json();
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