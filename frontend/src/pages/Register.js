import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import API from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pan, setPan] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [referCode, setReferCode] = useState("");
  const [agree, setAgree] = useState(false);

  const showPopup = (icon, title, text) => {
    Swal.fire({
      icon,
      title,
      text,
      background: "#1e293b",
      color: "white",
      confirmButtonColor: icon === "success" ? "#22c55e" : "#ef4444"
    });
  };

  const register = async () => {
   
    if (!name || !mobile || !email || !password || !pan || !aadhaar) {
      showPopup("warning", "Oops...", "Please fill all fields");
      return;
    }

    if (!agree) {
  return alert(
    "Please accept Terms & Conditions"
  );
}

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          mobile,
          email,
          password,
          pan,
          aadhaar,
          referCode
        })
      });

      const data = await res.json();

      if (data.msg === "Registered Successfully") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Registered Successfully",
          background: "#1e293b",
          color: "white",
          confirmButtonColor: "#22c55e"
        }).then(() => {
          navigate("/login");
        });
      } else {
        showPopup("error", "Registration Failed", data.msg);
      }

    } catch (err) {
      showPopup("error", "Server Error", "Something went wrong");
      console.log(err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.title}>Create Account</h2>

        <input style={styles.input} placeholder="Full Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input style={styles.input} placeholder="Mobile Number" value={mobile} onChange={(e)=>setMobile(e.target.value)} />
        <input style={styles.input} placeholder="Email ID" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <input style={styles.input} placeholder="PAN Number" value={pan} onChange={(e)=>setPan(e.target.value)} />
        <input style={styles.input} placeholder="Aadhaar Number" value={aadhaar} onChange={(e)=>setAadhaar(e.target.value)} />
        <input style={styles.input} placeholder="Refer Code (Optional)" value={referCode} onChange={(e)=>setReferCode(e.target.value)} />

<div style={styles.checkRow}>

  <input
    type="checkbox"
    checked={agree}
    onChange={(e) => setAgree(e.target.checked)}
  />

  <p style={styles.checkText}>
    I agree to the
    <span
      style={styles.link}
      onClick={() => navigate("/legal/terms")}
    >
      {" "}Terms & Conditions
    </span>
    {" "}and
    <span
      style={styles.link}
      onClick={() => navigate("/legal/privacy")}
    >
      {" "}Privacy Policy
    </span>
  </p>

</div>

        <button style={styles.btn} onClick={register}>
          Register
        </button>

        <p style={styles.legalText}>
  By creating an account, you agree to our
  <span
    style={styles.legalLink}
    onClick={() => navigate("/legal/terms")}
  >
    {" "}Terms
  </span>
  {" "}and
  <span
    style={styles.legalLink}
    onClick={() => navigate("/legal/privacy")}
  >
    {" "}Privacy Policy
  </span>
</p>

        <p style={styles.loginText}>
          Already have account?{" "}
          <span style={styles.link} onClick={()=>navigate("/login")}>
            Go for Login
          </span>
        </p>

      </div>
    </div>
  );
}

const styles = {
  container:{
    minHeight:"100vh",
    background:"linear-gradient(135deg,#020617,#0f172a)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center"
  },

  card:{
    background:"#1e293b",
    padding:"25px",
    borderRadius:"15px",
    width:"320px",
    boxShadow:"0 0 20px rgba(0,0,0,0.4)"
  },

  title:{
    textAlign:"center",
    marginBottom:"15px",
    color:"#22c55e"
  },

  input:{
    width:"100%",
    padding:"12px",
    marginTop:"10px",
    borderRadius:"8px",
    border:"none"
  },

  checkRow:{
  display:"flex",
  alignItems:"center",
  gap:"10px",
  marginTop:"15px"
},

checkText:{
  color:"#cbd5e1",
  fontSize:"12px"
},

link:{
  color:"#38bdf8",
  cursor:"pointer"
},

  btn:{
    marginTop:"15px",
    width:"100%",
    padding:"12px",
    background:"#22c55e",
    border:"none",
    borderRadius:"10px",
    fontWeight:"bold",
    cursor:"pointer"
  },

  legalText:{
  color:"#cbd5e1",
  fontSize:"12px",
  marginTop:"12px",
  textAlign:"center"
},

legalLink:{
  color:"#38bdf8",
  cursor:"pointer"
},

  loginText:{
    marginTop:"15px",
    textAlign:"center",
    color:"#94a3b8"
  },

  link:{
    color:"#3b82f6",
    cursor:"pointer",
    fontWeight:"bold"
  }
};