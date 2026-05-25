import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { API } from "../config";


export default function KYC() {
  const email = localStorage.getItem("email");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});

  const [mobileEdit, setMobileEdit] = useState(false);
  const [newMobile, setNewMobile] = useState("");

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [aadhaar, setAadhaar] = useState("");
const [pan, setPan] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetchWithAuth(`${API}/get-user-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      console.log(data);

      if (data?.msg) {
        toast.error(data.msg);
        setLoading(false);
        return;
      }

      setUser(data || {});
      setNewMobile(data?.mobile || "");
      setAadhaar(data?.aadhaar || data?.aadhaarNumber || "");
setPan(data?.pan || data?.panNumber || "");
      localStorage.setItem("user", JSON.stringify(data || {}));
      setLoading(false);
    } catch (err) {
      console.log("Fetch error:", err);
      toast.error("User data load failed");
      setLoading(false);
    }
  };

  const updateMobile = async () => {
    if (!newMobile) {
      toast.warning("Enter mobile number");
      return;
    }

    try {
      const res = await fetchWithAuth(`${API}/update-mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mobile: newMobile })
      });

      const data = await res.json();
      toast.success(data.msg || "Mobile updated");

      setMobileEdit(false);
      fetchUser();
    } catch (err) {
      console.log(err);
      toast.error("Mobile update failed");
    }
  };

  const submitKYC = async () => {
    if (user?.kycStatus === "approved") {
      toast.info("Your KYC is already approved");
      return;
    }

    if (!aadhaar || !pan) {
  toast.warning("Please enter Aadhaar and PAN number");
  return;
}

if (!aadhaarFile || !panFile || !photo) {
  toast.warning("PLEASE UPLOAD ALL DOCUMENT");
  return;
}

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("aadhaarFile", aadhaarFile);
      formData.append("panFile", panFile);
      formData.append("photo", photo);
      formData.append("aadhaar", aadhaar);
      formData.append("pan", pan);

      const res = await fetchWithAuth(`${API}/submit-kyc`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      toast.success(data.msg || "KYC submitted");

      setAadhaarFile(null);
      setPanFile(null);
      setPhoto(null);

      fetchUser();
    } catch (err) {
      console.log(err);
      toast.error("KYC submit failed");
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading KYC...
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <div style={styles.headerCard}>
        <h2 style={styles.title}>KYC Verification</h2>

        <div style={styles.statusPill}>
          {user?.kycStatus === "approved" ? (
            <span style={styles.approved}>✔ Approved</span>
          ) : user?.kycStatus === "pending" ? (
            <span style={styles.pending}>⏳ Pending</span>
          ) : user?.kycStatus === "rejected" ? (
            <span style={styles.rejected}>✖ Rejected</span>
          ) : (
            <span style={styles.notSubmitted}>❗ Not Submitted</span>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Registered Information</h3>

        <Info label="Name" value={user?.name || user?.fullName || "N/A"} verified={user?.kycStatus === "approved"} />
        <Info label="Email" value={user?.email || email || "N/A"} />
        
        <div style={styles.infoBox}>
          <p style={styles.label}>Mobile Number</p>

          {mobileEdit ? (
            <div style={styles.mobileRow}>
              <input
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
                style={styles.input}
                placeholder="Enter mobile number"
              />

              <button onClick={updateMobile} style={styles.saveBtn}>
                Save
              </button>
            </div>
          ) : (
            <div style={styles.mobileView}>
              <b>{user?.mobile || user?.phone || "N/A"}</b>

              <button
                onClick={() => setMobileEdit(true)}
                style={styles.editBtn}
              >
                ✏ Edit
              </button>
            </div>
          )}
        </div>

        <Info label="PAN Number" value={user?.pan || user?.panNumber || "N/A"} />
        <Info label="Aadhaar Number" value={user?.aadhaar || user?.aadhaarNumber || "N/A"} />
        <Info label="Refer Code" value={user?.referCode || user?.referralCode || "N/A"} />
        <Info label="Wallet ID" value={user?.walletId || "N/A"} />
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Upload Documents</h3>

        <input
  style={styles.input}
  placeholder="Enter Aadhaar Number"
  value={aadhaar}
  onChange={(e) => setAadhaar(e.target.value)}
  disabled={user?.kycStatus === "approved"}
/>

<input
  style={{ ...styles.input, marginTop: "12px" }}
  placeholder="Enter PAN Number"
  value={pan}
  onChange={(e) => setPan(e.target.value.toUpperCase())}
  disabled={user?.kycStatus === "approved"}
/>

        <UploadBox
          title="Aadhaar Card"
          file={aadhaarFile}
          onChange={(e) => setAadhaarFile(e.target.files[0])}
        />

        <UploadBox
          title="PAN Card"
          file={panFile}
          onChange={(e) => setPanFile(e.target.files[0])}
        />

        <UploadBox
          title="Your Photo"
          file={photo}
          onChange={(e) => setPhoto(e.target.files[0])}
        />

        <button
          style={{
            ...styles.btn,
            background: user?.kycStatus === "approved" ? "#64748b" : "#22c55e"
          }}
          onClick={submitKYC}
        >
          {user?.kycStatus === "approved" ? "KYC Already Approved" : "Submit KYC"}
        </button>
      </div>

      <div style={styles.notice}>
        Your registered information is securely stored and used only for verification and account security purposes.
      </div>

    </div>
  );
}

function Info({ label, value, verified }) {
  return (
    <div style={styles.infoBox}>
      <p style={styles.label}>{label}</p>
      <div style={styles.infoValue}>
        <b>{value}</b>
        {verified && <span style={styles.blueTick}>✔</span>}
      </div>
    </div>
  );
}

function UploadBox({ title, file, onChange }) {
  return (
    <div style={styles.uploadBox}>
      <p>{title}</p>

      <label style={styles.fileLabel}>
        Choose File
        <input
          type="file"
          accept="image/*"
          onChange={onChange}
          style={{ display: "none" }}
        />
      </label>

      <small style={styles.fileName}>
        {file ? file.name : "No file selected"}
      </small>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
    color: "white"
  },

  loading: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  headerCard: {
    background: "linear-gradient(135deg,#22c55e,#2563eb)",
    color: "#020617",
    padding: "22px",
    borderRadius: "22px",
    textAlign: "center",
    boxShadow: "0 0 25px rgba(0,0,0,0.35)"
  },

  title: {
    margin: 0,
    fontSize: "25px"
  },

  statusPill: {
    marginTop: "12px"
  },

  card: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "20px",
    marginTop: "20px",
    boxShadow: "0 0 18px rgba(0,0,0,0.35)",
    border: "1px solid #334155"
  },

  sectionTitle: {
    color: "#22c55e",
    marginTop: 0
  },

  infoBox: {
    background: "#0f172a",
    padding: "13px",
    borderRadius: "14px",
    marginTop: "12px"
  },

  label: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "13px"
  },

  infoValue: {
    marginTop: "6px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  blueTick: {
    background: "#2563eb",
    color: "white",
    borderRadius: "50%",
    padding: "2px 7px",
    fontSize: "12px"
  },

  mobileRow: {
    display: "flex",
    gap: "8px",
    marginTop: "8px"
  },

  mobileView: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px"
  },

  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "none"
  },

  editBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "10px",
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  saveBtn: {
    padding: "10px 14px",
    background: "#22c55e",
    border: "none",
    borderRadius: "10px",
    color: "#020617",
    fontWeight: "bold",
    cursor: "pointer"
  },

  uploadBox: {
    marginTop: "13px",
    padding: "14px",
    background: "#334155",
    borderRadius: "14px"
  },

  fileLabel: {
    display: "inline-block",
    padding: "10px 14px",
    background: "#3b82f6",
    borderRadius: "10px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  fileName: {
    display: "block",
    marginTop: "8px",
    color: "#cbd5e1"
  },

  btn: {
    marginTop: "18px",
    padding: "14px",
    width: "100%",
    border: "none",
    borderRadius: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#020617"
  },

  approved: {
    color: "#020617",
    background: "#bbf7d0",
    padding: "8px 15px",
    borderRadius: "20px",
    fontWeight: "bold"
  },

  pending: {
    color: "#020617",
    background: "#fde68a",
    padding: "8px 15px",
    borderRadius: "20px",
    fontWeight: "bold"
  },

  rejected: {
    color: "white",
    background: "#ef4444",
    padding: "8px 15px",
    borderRadius: "20px",
    fontWeight: "bold"
  },

  notSubmitted: {
    color: "white",
    background: "#ef4444",
    padding: "8px 15px",
    borderRadius: "20px",
    fontWeight: "bold"
  },

  notice: {
    marginTop: "20px",
    background: "#0f172a",
    padding: "15px",
    borderRadius: "14px",
    color: "#cbd5e1",
    lineHeight: "24px"
  }
};