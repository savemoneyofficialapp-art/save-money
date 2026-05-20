import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchWithAuth }
from "../utils/fetchWithAuth";
import axios from "axios";
import API from "../api.js";


export default function KYC() {

  const email = localStorage.getItem("email");

  const [user, setUser] = useState({});
  const [mobileEdit, setMobileEdit] = useState(false);
  const [newMobile, setNewMobile] = useState("");

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  // 🔹 FETCH USER
  const fetchUser = async () => {
    try {
      const res = await fetchWithAuth(`${API}/user/` + email);
      const data = await res.json();
      setUser(data);
      setNewMobile(data.mobile);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  // 🔹 UPDATE MOBILE
  const updateMobile = async () => {

    if (!newMobile) {
      toast.warning("Enter mobile number");
      return;
    }

    const res = await fetchWithAuth(`${API}/update-mobile`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, mobile: newMobile })
    });

    const data = await res.json();
    toast.success(data.msg);

    setMobileEdit(false);
    fetchUser();
  };

  // 🔹 SUBMIT KYC
  const submitKYC = async () => {

    if (!aadhaarFile || !panFile || !photo) {
      toast.warning("PLEASE UPLOAD ALL DOCUMENT");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("aadhaarFile", aadhaarFile);
    formData.append("panFile", panFile);
    formData.append("photo", photo);

    const res = await fetchWithAuth(`${API}/submit-kyc`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    toast.success(data.msg);

    fetchUser();
  };

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>KYC Verification</h2>

      {/* USER INFO */}
      <div style={styles.card}>

        <p><b>Name:</b> {user.name}</p>
        <p><b>Email:</b> {user.email}</p>

        {/* MOBILE EDIT */}
        <p>
          <b>Mobile:</b>{" "}
          {mobileEdit ? (
            <>
              <input
                value={newMobile}
                onChange={(e)=>setNewMobile(e.target.value)}
                style={styles.input}
              />
              <button onClick={updateMobile} style={styles.smallBtn}>Save</button>
            </>
          ) : (
            <>
              {user.mobile}
              <span
                onClick={()=>setMobileEdit(true)}
                style={styles.editBtn}
              >
                ✏ Edit
              </span>
            </>
          )}
        </p>

        <p><b>PAN:</b> {user.pan}</p>
        <p><b>Aadhaar:</b> {user.aadhaar}</p>

        {/* STATUS */}
        <p>
          <b>Status:</b>{" "}
          {user.kycStatus === "approved" ? (
            <span style={styles.approved}>✔ Approved</span>
          ) : user.kycStatus === "pending" ? (
            <span style={styles.pending}>⏳ Pending</span>
          ) : (
            <span style={styles.notSubmitted}>❗ Not Submitted</span>
          )}
        </p>

      </div>

      {/* UPLOAD */}
      <div style={styles.card}>

        <h3>Upload Documents</h3>

        <div style={styles.uploadBox}>
          <p>Aadhaar Card</p>
          <input type="file" onChange={(e)=>setAadhaarFile(e.target.files[0])}/>
        </div>

        <div style={styles.uploadBox}>
          <p>PAN Card</p>
          <input type="file" onChange={(e)=>setPanFile(e.target.files[0])}/>
        </div>

        <div style={styles.uploadBox}>
          <p>Your Photo</p>
          <input type="file" onChange={(e)=>setPhoto(e.target.files[0])}/>
        </div>

        <button style={styles.btn} onClick={submitKYC}>
          Submit KYC
        </button>

      </div>

    </div>
  );
}

const styles = {

  container:{
    padding:"20px",
    minHeight:"100vh",
    background:"linear-gradient(135deg,#020617,#0f172a)",
    color:"white"
  },

  title:{
    textAlign:"center",
    marginBottom:"20px"
  },

  card:{
    background:"#1e293b",
    padding:"20px",
    borderRadius:"12px",
    marginBottom:"20px",
    boxShadow:"0 0 15px rgba(0,0,0,0.4)"
  },

  input:{
    padding:"6px",
    borderRadius:"6px",
    marginRight:"5px"
  },

  editBtn:{
    marginLeft:"10px",
    color:"#38bdf8",
    cursor:"pointer"
  },

  smallBtn:{
    padding:"5px 10px",
    background:"#22c55e",
    border:"none",
    borderRadius:"6px",
    cursor:"pointer"
  },

  uploadBox:{
    marginTop:"10px",
    padding:"10px",
    background:"#334155",
    borderRadius:"8px"
  },

  btn:{
    marginTop:"15px",
    padding:"12px",
    width:"100%",
    background:"#22c55e",
    border:"none",
    borderRadius:"10px",
    fontWeight:"bold",
    cursor:"pointer"
  },

  approved:{ color:"#22c55e", fontWeight:"bold" },
  pending:{ color:"#f59e0b", fontWeight:"bold" },
  notSubmitted:{ color:"#ef4444", fontWeight:"bold" }
};