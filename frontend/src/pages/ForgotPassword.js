import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api.js";

export default function ForgotPassword() {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 SEND OTP
  const sendOtp = async () => {

    if (!email) {
      alert("Enter your email");
      return;
    }

    setLoading(true);

    const res = await fetch(`${API}/send-email-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setLoading(false);

    alert(data.msg);

    if (data.msg === "OTP sent to email") {
      setStep(2);
    }
  };

  // 🔹 RESET PASSWORD
  const resetPassword = async () => {

    if (!otp || !newPassword) {
      alert("Enter OTP & new password");
      return;
    }

    setLoading(true);

    const res = await fetch(`${API}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();
    
    setLoading(false);

    alert(data.msg);

    if (data.msg === "Password updated successfully") {
      navigate("/");
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h2 style={styles.title}>Forgot Password</h2>
        <p style={styles.sub}>Secure your account 🔐</p>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input
              style={styles.input}
              placeholder="Enter Email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />

            <button style={styles.btn} onClick={sendOtp}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e)=>setOtp(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e)=>setNewPassword(e.target.value)}
            />

            <button style={styles.btn} onClick={resetPassword}>
              {loading ? "Processing..." : "Reset Password"}
            </button>
          </>
        )}

        {/* BACK */}
        <p
          style={styles.back}
          onClick={()=>navigate("/")}
        >
          ← Back to Login
        </p>

      </div>

    </div>
  );
}

const styles = {

  container:{
    minHeight:"100vh",
    background:"linear-gradient(135deg, #0f172a, #020617)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center"
  },

  card:{
    background:"#1e293b",
    padding:"30px",
    borderRadius:"15px",
    width:"300px",
    textAlign:"center",
    boxShadow:"0 0 20px rgba(0,0,0,0.5)"
  },

  title:{
    marginBottom:"5px"
  },

  sub:{
    color:"#94a3b8",
    marginBottom:"20px"
  },

  input:{
    width:"100%",
    padding:"12px",
    marginTop:"10px",
    borderRadius:"8px",
    border:"none",
    outline:"none"
  },

  btn:{
    width:"100%",
    marginTop:"15px",
    padding:"12px",
    background:"#22c55e",
    border:"none",
    borderRadius:"8px",
    fontWeight:"bold",
    cursor:"pointer"
  },

  back:{
    marginTop:"15px",
    fontSize:"14px",
    color:"#38bdf8",
    cursor:"pointer"
  }
};