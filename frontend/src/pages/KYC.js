import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function KYC() {
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [user, setUser] = useState({});
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [kycStatus, setKycStatus] = useState("pending");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKyc();
  }, []);

  const loadKyc = async () => {
    try {
      const res = await fetch(`${API}/kyc-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        const u = data.user || {};
        setUser(u);
        setAadhaarNumber(u.aadhaarNumber || u.aadhaar || "");
setPanNumber(u.panNumber || u.pan || "");
        setKycStatus(u.kycStatus || "pending");
      }
    } catch (err) {
      console.log("KYC LOAD ERROR:", err);
    }
  };

  const submitKyc = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toast.info("Enter valid 12 digit Aadhaar number");
      return;
    }

    if (!panNumber || panNumber.length !== 10) {
      toast.info("Enter valid 10 digit PAN number");
      return;
    }

    if (!aadhaarFile || !panFile || !photoFile) {
      toast.info("Please upload Aadhaar, PAN and Photo");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("email", email);
      formData.append("aadhaarNumber", aadhaarNumber);
      formData.append("panNumber", panNumber);
      formData.append("aadhaarFile", aadhaarFile);
      formData.append("panFile", panFile);
      formData.append("photo", photoFile);

      const res = await fetch(`${API}/submit-kyc`, {
        method: "POST",
        headers: { authorization: token },
        body: formData
      });

      const data = await res.json();
      toast.success(data.msg || "KYC submitted");

      if (data.success) {
        setKycStatus("reviewing");
        loadKyc();
      }
    } catch (err) {
      console.log("KYC SUBMIT ERROR:", err);
      toast.info("KYC submit failed");
    } finally {
      setLoading(false);
    }
  };

  const statusText =
    kycStatus === "approved"
      ? "Approved"
      : kycStatus === "reviewing"
      ? "Reviewing"
      : "Pending";

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.hero}>
          <button style={styles.backBtn} onClick={() => window.history.back()}>
            ←
          </button>

          <div style={styles.heroIcon}>🛡️</div>

          <div>
            <h1 style={styles.title}>
              KYC <span>Verification</span>
            </h1>
            <p style={styles.subtitle}>
              Secure your account. Complete KYC to unlock all features.
            </p>
          </div>

          <div style={styles.heroArt}>🪪🔐</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.headIcon}>👤</span>
            <h2>Personal Information</h2>
          </div>

          <div style={styles.infoGrid}>
            <Info icon="👤" title="Name" value={user.name || "N/A"} color="#7c3aed" />
            <Info icon="✉️" title="Email" value={user.email || email} color="#0ea5e9" />
            <Info icon="📞" title="Mobile" value={user.mobile || "N/A"} color="#22c55e" />
            <Info icon="🎁" title="Referral Code" value={user.referCode || "N/A"} color="#f97316" />
            <Info icon="👛" title="Wallet ID" value={user.walletId || user.walletAddress || "N/A"} color="#a855f7" />
            <Info icon="📅" title="Account Created Date" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "N/A"} color="#ec4899" />
            <Info icon="🆔" title="Aadhaar Number" value={aadhaarNumber || "Not Added"} color="#facc15" />
            <Info icon="💳" title="PAN Number" value={panNumber || "Not Added"} color="#38bdf8" />

            <div style={styles.statusBox}>
              <span style={styles.statusIcon}>✅</span>
              <div>
                <p>KYC Status</p>
                <b
                  style={{
                    ...styles.status,
                    color:
                      kycStatus === "approved"
                        ? "#22c55e"
                        : kycStatus === "reviewing"
                        ? "#38bdf8"
                        : "#facc15",
                    borderColor:
                      kycStatus === "approved"
                        ? "#22c55e"
                        : kycStatus === "reviewing"
                        ? "#38bdf8"
                        : "#facc15"
                  }}
                >
                  {statusText}
                </b>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHead}>
            <span style={styles.headIcon}>📄</span>
            <div>
              <h2>Upload Documents</h2>
              <p style={styles.muted}>
                Please upload clear and valid documents. All documents are secure and encrypted.
              </p>
            </div>
          </div>

          <DocUpload
            logo="🌈"
            title="Aadhaar Card"
            desc="Upload front side of your Aadhaar card"
            label="Aadhaar Number"
            placeholder="Enter 12 digit Aadhaar number"
            value={aadhaarNumber}
            onChange={(v) => setAadhaarNumber(v.replace(/\D/g, "").slice(0, 12))}
            file={aadhaarFile}
            setFile={setAadhaarFile}
          />

          <DocUpload
            logo="💳"
            title="PAN Card"
            desc="Upload front side of your PAN card"
            label="PAN Number"
            placeholder="Enter 10 digit PAN number"
            value={panNumber}
            onChange={(v) => setPanNumber(v.toUpperCase().slice(0, 10))}
            file={panFile}
            setFile={setPanFile}
          />

          <div style={styles.docRow}>
            <div style={styles.preview}>👨‍💼</div>

            <div style={styles.docMiddle}>
              <h3>Your Photo</h3>
              <p>Upload your recent passport size photo</p>
            </div>

            <FileBox file={photoFile} setFile={setPhotoFile} text="Upload Photo" />
          </div>

          <button style={styles.submitBtn} onClick={submitKyc} disabled={loading}>
            🛡 {loading ? "Submitting..." : "Submit KYC"} →
          </button>

          <p style={styles.safe}>🔒 Your information is 100% secure and encrypted</p>
        </div>

        <div style={styles.process}>
          <h2>✨ How KYC Process Works</h2>

          <div style={styles.steps}>
            <Step no="1" icon="☁️" title="Upload Documents" text="Upload Aadhaar, PAN & Photo" />
            <Step no="2" icon="📋" title="Verify Details" text="We verify your information" />
            <Step no="3" icon="🔍" title="Under Review" text="KYC takes 5-24 hours" />
            <Step no="4" icon="🛡️" title="Get Verified" text="Unlock all features" />
          </div>
        </div>

        <div style={styles.bottom}>
          <Mini icon="🛡️" title="100% Secure" text="Your data is safe" />
          <Mini icon="🔐" title="Data Encrypted" text="Protected information" />
          <Mini icon="⏱️" title="Quick Verification" text="Within 24 hours" />
          <Mini icon="✅" title="Trusted Platform" text="Safe verification" />
        </div>

      </div>
    </div>
  );
}

function Info({ icon, title, value, color }) {
  return (
    <div style={styles.info}>
      <span style={{ ...styles.infoIcon, background: color }}>{icon}</span>
      <div>
        <p>{title}</p>
        <b>{value}</b>
      </div>
    </div>
  );
}

function DocUpload({ logo, title, desc, label, placeholder, value, onChange, file, setFile }) {
  return (
    <div style={styles.docRow}>
      <div style={styles.preview}>{logo}</div>

      <div style={styles.docMiddle}>
        <h3>{title}</h3>
        <p>{desc}</p>

        <label>{label}</label>
        <input
          style={styles.input}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <FileBox file={file} setFile={setFile} text="Upload Image" />
    </div>
  );
}

function FileBox({ file, setFile, text }) {
  return (
    <label style={styles.fileBox}>
      <span>☁️</span>
      <b>{file ? file.name : text}</b>
      <small>PNG, JPG (Max 2MB)</small>
      <input
        type="file"
        hidden
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
    </label>
  );
}

function Step({ no, icon, title, text }) {
  return (
    <div style={styles.step}>
      <b>{no}</b>
      <span>{icon}</span>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

function Mini({ icon, title, text }) {
  return (
    <div style={styles.mini}>
      <span>{icon}</span>
      <div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right,#4c1d95,#12002f 45%,#050014)",
    color: "white",
    padding: "22px",
    fontFamily: "Arial, sans-serif"
  },

  container: {
    maxWidth: "1150px",
    margin: "0 auto"
  },

  hero: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "24px"
  },

  backBtn: {
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,.15)",
    background: "rgba(255,255,255,.06)",
    color: "#c084fc",
    fontSize: "30px",
    cursor: "pointer"
  },

  heroIcon: {
    width: "82px",
    height: "82px",
    borderRadius: "24px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px",
    boxShadow: "0 0 28px rgba(168,85,247,.45)"
  },

  title: {
    margin: 0,
    fontSize: "42px",
    fontWeight: "900"
  },

  subtitle: {
    color: "#c4b5fd",
    fontSize: "17px"
  },

  heroArt: {
    marginLeft: "auto",
    fontSize: "86px",
    filter: "drop-shadow(0 0 20px #a855f7)"
  },

  card: {
    background: "linear-gradient(145deg,rgba(42,15,92,.95),rgba(10,0,35,.98))",
    border: "1px solid rgba(168,85,247,.28)",
    borderRadius: "28px",
    padding: "26px",
    marginBottom: "22px",
    boxShadow: "0 0 32px rgba(168,85,247,.16)"
  },

  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px"
  },

  headIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#7c3aed,#ec4899)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  muted: {
    color: "#a7a3b7"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },

  info: {
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: "17px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "13px"
  },

  infoIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px"
  },

  statusBox: {
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: "17px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "13px"
  },

  statusIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  status: {
    display: "inline-block",
    padding: "7px 16px",
    borderRadius: "20px",
    border: "1px solid",
    fontWeight: "900"
  },

  docRow: {
    display: "grid",
    gridTemplateColumns: "150px 1fr 270px",
    gap: "22px",
    alignItems: "center",
    padding: "20px 0",
    borderBottom: "1px solid rgba(255,255,255,.08)"
  },

  preview: {
    height: "130px",
    borderRadius: "20px",
    background: "linear-gradient(145deg,#1f0758,#0b0225)",
    border: "1px solid rgba(255,255,255,.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "58px"
  },

  docMiddle: {},

  input: {
    width: "100%",
    marginTop: "8px",
    padding: "14px",
    borderRadius: "13px",
    border: "1px solid rgba(168,85,247,.55)",
    background: "rgba(255,255,255,.05)",
    color: "white",
    outline: "none"
  },

  fileBox: {
    height: "118px",
    borderRadius: "20px",
    border: "2px dashed #2563eb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
    textAlign: "center"
  },

  submitBtn: {
    width: "100%",
    height: "66px",
    marginTop: "22px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(90deg,#6d5dfc,#ec168e)",
    color: "white",
    fontSize: "22px",
    fontWeight: "900",
    cursor: "pointer"
  },

  safe: {
    textAlign: "center",
    color: "#a7a3b7"
  },

  process: {
    background: "linear-gradient(145deg,rgba(42,15,92,.92),rgba(10,0,35,.95))",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "26px",
    padding: "24px",
    marginBottom: "18px"
  },

  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "14px",
    textAlign: "center"
  },

  step: {
    background: "rgba(255,255,255,.035)",
    borderRadius: "18px",
    padding: "16px"
  },

  bottom: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "12px"
  },

  mini: {
    background: "linear-gradient(145deg,rgba(42,15,92,.92),rgba(10,0,35,.95))",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "20px",
    padding: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "center"
  }
};
