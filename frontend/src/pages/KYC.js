import { useEffect, useState } from "react";
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

  const [kycStatus, setKycStatus] = useState("Pending");
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
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data?.success) {
        const u = data.user || {};

        setUser(u);
        setAadhaarNumber(u.aadhaarNumber || "");
        setPanNumber(u.panNumber || "");
        setKycStatus(u.kycStatus || "Pending");
      }
    } catch (err) {
      console.log("KYC INFO ERROR:", err);
    }
  };

  const submitKyc = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return alert("Enter valid 12 digit Aadhaar number");
    }

    if (!panNumber || panNumber.length !== 10) {
      return alert("Enter valid 10 digit PAN number");
    }

    if (!aadhaarFile || !panFile || !photoFile) {
      return alert("Please upload Aadhaar card, PAN card and photo");
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("email", email);
      formData.append("aadhaarNumber", aadhaarNumber);
      formData.append("panNumber", panNumber);
      formData.append("aadhaarCard", aadhaarFile);
      formData.append("panCard", panFile);
      formData.append("photo", photoFile);

      const res = await fetch(`${API}/submit-kyc`, {
        method: "POST",
        headers: {
          authorization: token || ""
        },
        body: formData
      });

      const data = await res.json();

      alert(data.msg || "KYC submitted");

      if (data.success) {
        setKycStatus("Reviewing");
        loadKyc();
      }
    } catch (err) {
      console.log("SUBMIT KYC ERROR:", err);
      alert("KYC submit failed");
    } finally {
      setLoading(false);
    }
  };

  const statusText = kycStatus || "Pending";

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowOne}></div>
      <div style={styles.bgGlowTwo}></div>

      <div style={styles.wrapper}>

        {/* HEADER */}
        <header style={styles.header}>
          <button style={styles.backBtn} onClick={() => window.history.back()}>
            ←
          </button>

          <div style={styles.headerShield}>
            <ShieldLogo />
          </div>

          <div style={styles.headerText}>
            <h1>
              KYC <span>Verification</span>
            </h1>
            <p>Secure your account. Complete KYC to unlock all features.</p>
          </div>

          <div style={styles.topIllustration}>
            <KycHeroArt />
          </div>
        </header>

        {/* PERSONAL INFORMATION */}
        <section style={styles.personalCard}>
          <div style={styles.cardHead}>
            <div style={styles.sectionIcon}>👤</div>

            <h2>Personal Information</h2>

            <button style={styles.editBtn}>
              ✎ Edit
            </button>
          </div>

          <div style={styles.personalBody}>
            <div style={styles.personalGrid}>
              <PersonalInfo
                icon="👤"
                color="#6d5dfc"
                title="Name"
                value={user.name || "N/A"}
              />

              <PersonalInfo
                icon="✉️"
                color="#0284c7"
                title="Email"
                value={user.email || email || "N/A"}
              />

              <PersonalInfo
                icon="📞"
                color="#00b875"
                title="Mobile"
                value={user.mobile || user.phone || "N/A"}
                editable
              />

              <PersonalInfo
                icon="🎁"
                color="#ea580c"
                title="Referral Code"
                value={user.referralCode || user.referCode || "N/A"}
              />

              <PersonalInfo
                icon="👛"
                color="#7c3aed"
                title="Wallet ID"
                value={user.walletId || user.walletAddress || "N/A"}
              />

              <PersonalInfo
                icon="📅"
                color="#db2777"
                title="Account Created Date"
                value={
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleString("en-IN")
                    : "N/A"
                }
              />

              <PersonalInfo
                icon="🆔"
                color="#f59e0b"
                title="Aadhaar Number"
                value={aadhaarNumber || "Not Added"}
              />

              <PersonalInfo
                icon="💳"
                color="#22c55e"
                title="PAN Number"
                value={panNumber || "Not Added"}
              />

              <KycStatus status={statusText} />
            </div>

            <div style={styles.sideKycArt}>
              <IdCardArt />
            </div>
          </div>
        </section>

        {/* UPLOAD DOCUMENTS */}
        <section style={styles.uploadCard}>
          <div style={styles.uploadHead}>
            <div style={styles.sectionIcon}>📄</div>

            <div>
              <h2>Upload Documents</h2>
              <p>
                Please upload clear and valid documents. All documents are secure and encrypted.
              </p>
            </div>
          </div>

          <UploadDocument
            type="aadhaar"
            title="Aadhaar Card"
            desc="Upload front side of your Aadhaar card"
            label="Aadhaar Number"
            placeholder="Enter 12 digit Aadhaar number"
            value={aadhaarNumber}
            onChange={(v) => setAadhaarNumber(v.replace(/\D/g, "").slice(0, 12))}
            file={aadhaarFile}
            setFile={setAadhaarFile}
          />

          <UploadDocument
            type="pan"
            title="PAN Card"
            desc="Upload front side of your PAN card"
            label="PAN Number"
            placeholder="Enter 10 digit PAN number"
            value={panNumber}
            onChange={(v) => setPanNumber(v.toUpperCase().slice(0, 10))}
            file={panFile}
            setFile={setPanFile}
          />

          <PhotoUpload
            file={photoFile}
            setFile={setPhotoFile}
          />

          <button style={styles.submitBtn} onClick={submitKyc} disabled={loading}>
            <span>🛡</span>
            {loading ? "Submitting..." : "Submit KYC"}
            <b>➜</b>
          </button>

          <p style={styles.safeLine}>🔒 Your information is 100% secure and encrypted</p>
        </section>

        {/* PROCESS */}
        <section style={styles.processCard}>
          <div style={styles.processTitle}>
            <span>🪄</span>
            <h2>How KYC Process Works</h2>
          </div>

          <div style={styles.processSteps}>
            <ProcessStep
              no="1"
              icon="☁️"
              title="Upload Documents"
              text="Upload clear images of your Aadhaar, PAN & Photo"
              color="#1d9bf0"
            />

            <ProcessStep
              no="2"
              icon="📋"
              title="Verify Details"
              text="We will verify your information"
              color="#9333ea"
            />

            <ProcessStep
              no="3"
              icon="🔍"
              title="Under Review"
              text="KYC usually takes 5-24 hours"
              color="#14b8a6"
            />

            <ProcessStep
              no="4"
              icon="🛡"
              title="Get Verified"
              text="Once verified, enjoy all features & benefits"
              color="#f59e0b"
            />
          </div>
        </section>

        {/* BOTTOM SECURITY */}
        <section style={styles.securityRow}>
          <SecurityMini
            icon="🛡"
            title="100% Secure"
            text="Your data is safe with us"
            color="#0969ff"
          />

          <SecurityMini
            icon="🔐"
            title="Data Encrypted"
            text="End-to-end encrypted protection"
            color="#22c55e"
          />

          <SecurityMini
            icon="⏱"
            title="Quick Verification"
            text="KYC verification within 24 hours"
            color="#7c3aed"
          />

          <SecurityMini
            icon="✅"
            title="Trusted Platform"
            text="Millions of users trust us"
            color="#f59e0b"
          />
        </section>

      </div>
    </div>
  );
}

function PersonalInfo({ icon, color, title, value, editable }) {
  return (
    <div style={styles.infoItem}>
      <div style={{ ...styles.infoIcon, background: color }}>
        {icon}
      </div>

      <div style={styles.infoText}>
        <p>{title}</p>
        <h3>{value}</h3>
      </div>

      {editable && (
        <button style={styles.smallEdit}>
          ✎ Edit
        </button>
      )}
    </div>
  );
}

function KycStatus({ status }) {
  const normal = String(status || "Pending").toLowerCase();

  const color =
    normal === "approved"
      ? "#22c55e"
      : normal === "reviewing"
      ? "#38bdf8"
      : "#facc15";

  const text =
    normal === "approved"
      ? "Approved"
      : normal === "reviewing"
      ? "Reviewing"
      : "Pending";

  return (
    <div style={styles.infoItem}>
      <div style={{ ...styles.infoIcon, background: "#16a34a" }}>
        🛡
      </div>

      <div style={styles.infoText}>
        <p>KYC Status</p>

        <span
          style={{
            ...styles.statusPill,
            color,
            borderColor: color
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

function UploadDocument({
  type,
  title,
  desc,
  label,
  placeholder,
  value,
  onChange,
  file,
  setFile
}) {
  return (
    <div style={styles.uploadRow}>
      <div style={styles.docPreview}>
        {type === "aadhaar" ? (
          <AadhaarArt />
        ) : (
          <PanArt />
        )}
      </div>

      <div style={styles.uploadMiddle}>
        <h3>{title}</h3>
        <p>{desc}</p>

        <label>{label}</label>

        <input
          style={styles.fieldInput}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <label style={styles.fileBox}>
        <div style={styles.cloudIcon}>☁️</div>
        <h4>{file ? file.name : "Upload Image"}</h4>
        <p>PNG, JPG (Max 2MB)</p>

        <input
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>
    </div>
  );
}

function PhotoUpload({ file, setFile }) {
  return (
    <div style={styles.uploadRow}>
      <div style={styles.docPreview}>
        <UserPhotoArt />
      </div>

      <div style={styles.uploadMiddle}>
        <h3>Your Photo</h3>
        <p>Upload your recent passport size photo</p>
      </div>

      <label style={styles.fileBox}>
        <div style={styles.cloudIcon}>☁️</div>
        <h4>{file ? file.name : "Upload Photo"}</h4>
        <p>PNG, JPG (Max 2MB)</p>

        <input
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>
    </div>
  );
}

function ProcessStep({ no, icon, title, text, color }) {
  return (
    <div style={styles.stepBox}>
      <div style={styles.stepTop}>
        <b style={{ background: color }}>{no}</b>
        <span style={{ borderColor: color, color }}>
          {icon}
        </span>
      </div>

      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

function SecurityMini({ icon, title, text, color }) {
  return (
    <div style={styles.securityMini}>
      <div style={{ ...styles.securityIcon, background: color }}>
        {icon}
      </div>

      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}
function ShieldLogo() {
  return (
    <div style={styles.shieldLogo}>
      <span>✓</span>
    </div>
  );
}

function KycHeroArt() {
  return (
    <div style={styles.heroKycArt}>
      <div style={styles.heroCard3d}>
        <div style={styles.heroAvatar}></div>
        <div style={styles.heroLine1}></div>
        <div style={styles.heroLine2}></div>
      </div>

      <div style={styles.heroLock}>🔒</div>
      <div style={styles.heroShield}>✓</div>
      <div style={styles.heroGlow}></div>
    </div>
  );
}

function IdCardArt() {
  return (
    <div style={styles.idArt}>
      <div style={styles.clip}></div>
      <div style={styles.idAvatar}></div>
      <div style={styles.idLine1}></div>
      <div style={styles.idLine2}></div>
      <div style={styles.idLock}>🔒</div>
    </div>
  );
}

function AadhaarArt() {
  return (
    <div style={styles.aadhaarArt}>
      <div style={styles.aadhaarSun}></div>
      <div style={styles.aadhaarArc1}></div>
      <div style={styles.aadhaarArc2}></div>
      <div style={styles.aadhaarArc3}></div>
      <b>AADHAAR</b>
    </div>
  );
}

function PanArt() {
  return (
    <div style={styles.panArt}>
      <div style={styles.panHeader}></div>
      <div style={styles.panPhoto}></div>
      <div style={styles.panLine1}></div>
      <div style={styles.panLine2}></div>
      <b>PAN</b>
    </div>
  );
}

function UserPhotoArt() {
  return (
    <div style={styles.userArt}>
      <div style={styles.userHair}></div>
      <div style={styles.userFace}></div>
      <div style={styles.userBody}></div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right,#45108a 0%,#170032 40%,#090018 100%)",
    position: "relative",
    overflow: "hidden",
    padding: "25px",
    color: "white",
    fontFamily: "Arial, sans-serif"
  },

  bgGlowOne: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "rgba(168,85,247,.15)",
    top: "-200px",
    right: "-150px",
    filter: "blur(120px)"
  },

  bgGlowTwo: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "rgba(59,130,246,.10)",
    bottom: "-150px",
    left: "-150px",
    filter: "blur(120px)"
  },

  wrapper: {
    maxWidth: "1400px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px"
  },

  backBtn: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,.15)",
    background: "rgba(255,255,255,.05)",
    color: "#b794ff",
    fontSize: "32px",
    cursor: "pointer"
  },

  headerShield: {
    width: "90px",
    height: "90px"
  },

  shieldLogo: {
    width: "90px",
    height: "90px",
    borderRadius: "30px",
    background: "linear-gradient(135deg,#6d5dfc,#b84cff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px",
    fontWeight: "900",
    boxShadow: "0 0 35px rgba(168,85,247,.4)"
  },

  headerText: {
    flex: 1
  },

  topIllustration: {
    width: "260px"
  },

  personalCard: {
    background:
      "linear-gradient(145deg,rgba(35,10,85,.92),rgba(8,0,35,.96))",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "28px",
    padding: "28px",
    marginBottom: "25px",
    boxShadow: "0 0 35px rgba(168,85,247,.15)"
  },

  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px"
  },

  sectionIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#6d5dfc,#b84cff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  editBtn: {
    marginLeft: "auto",
    border: "none",
    background: "#3b82f6",
    color: "white",
    padding: "10px 18px",
    borderRadius: "12px",
    fontWeight: "bold"
  },

  personalBody: {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: "25px"
  },

  personalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px"
  },

  infoItem: {
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.05)",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  infoIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "22px"
  },

  infoText: {
    flex: 1
  },

  smallEdit: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "8px 12px",
    borderRadius: "10px"
  },

  statusPill: {
    display: "inline-block",
    border: "1px solid",
    padding: "7px 14px",
    borderRadius: "20px",
    fontWeight: "bold"
  },

  sideKycArt: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  uploadCard: {
    background:
      "linear-gradient(145deg,rgba(35,10,85,.92),rgba(8,0,35,.96))",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "28px",
    padding: "28px",
    marginBottom: "25px"
  },

  uploadHead: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    marginBottom: "20px"
  },

  uploadRow: {
    display: "grid",
    gridTemplateColumns: "180px 1fr 300px",
    gap: "25px",
    alignItems: "center",
    padding: "20px 0",
    borderBottom: "1px solid rgba(255,255,255,.08)"
  },

  docPreview: {
    height: "150px",
    borderRadius: "20px",
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  uploadMiddle: {},

  fieldInput: {
    width: "100%",
    marginTop: "10px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(168,85,247,.35)",
    background: "rgba(255,255,255,.05)",
    color: "white",
    outline: "none"
  },

  fileBox: {
    height: "130px",
    borderRadius: "20px",
    border: "2px dashed #2563eb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },

  cloudIcon: {
    fontSize: "34px"
  },

  submitBtn: {
    width: "100%",
    height: "68px",
    marginTop: "25px",
    borderRadius: "18px",
    border: "none",
    background:
      "linear-gradient(90deg,#6d5dfc,#ec168e)",
    color: "white",
    fontSize: "22px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px"
  },

  safeLine: {
    textAlign: "center",
    color: "#bdb6d4",
    marginTop: "12px"
  },

  processCard: {
    background:
      "linear-gradient(145deg,rgba(35,10,85,.92),rgba(8,0,35,.96))",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "28px",
    padding: "25px",
    marginBottom: "20px"
  },

  processTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px"
  },

  processSteps: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "18px"
  },

  stepBox: {
    textAlign: "center",
    background: "rgba(255,255,255,.03)",
    borderRadius: "20px",
    padding: "20px"
  },

  stepTop: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "12px"
  },

  securityRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "15px"
  },

  securityMini: {
    background:
      "linear-gradient(145deg,rgba(35,10,85,.92),rgba(8,0,35,.96))",
    border: "1px solid rgba(168,85,247,.25)",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },

  securityIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white"
  },

  heroKycArt: { position: "relative", height: "180px" },
  heroCard3d: { width: "140px", height: "95px", borderRadius: "18px", background: "#fff", margin: "0 auto" },
  heroAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "#cbd5e1", margin: "10px auto" },
  heroLine1: { width: "70%", height: "8px", background: "#e2e8f0", margin: "8px auto", borderRadius: "10px" },
  heroLine2: { width: "50%", height: "8px", background: "#e2e8f0", margin: "8px auto", borderRadius: "10px" },
  heroLock: { position: "absolute", right: "40px", top: "10px", fontSize: "40px" },
  heroShield: { position: "absolute", left: "40px", bottom: "20px", fontSize: "38px", color: "#22c55e" },
  heroGlow: { position: "absolute", inset: 0, background: "rgba(168,85,247,.15)", filter: "blur(60px)" },

  idArt: { width: "200px", height: "250px", borderRadius: "20px", background: "#fff", position: "relative" },
  clip: { width: "70px", height: "20px", background: "#94a3b8", borderRadius: "20px", margin: "10px auto" },
  idAvatar: { width: "60px", height: "60px", borderRadius: "50%", background: "#cbd5e1", margin: "20px auto" },
  idLine1: { width: "80%", height: "10px", background: "#e2e8f0", margin: "12px auto" },
  idLine2: { width: "60%", height: "10px", background: "#e2e8f0", margin: "12px auto" },
  idLock: { position: "absolute", right: "10px", bottom: "10px", fontSize: "32px" },

  aadhaarArt: { textAlign: "center" },
  aadhaarSun: { width: "50px", height: "50px", borderRadius: "50%", background: "#f59e0b", margin: "0 auto 10px" },
  aadhaarArc1: { width: "70px", height: "4px", background: "#16a34a", margin: "4px auto" },
  aadhaarArc2: { width: "90px", height: "4px", background: "#16a34a", margin: "4px auto" },
  aadhaarArc3: { width: "110px", height: "4px", background: "#16a34a", margin: "4px auto" },

  panArt: { position: "relative", width: "120px", height: "90px", background: "#60a5fa", borderRadius: "12px" },
  panHeader: { height: "18px", background: "#1d4ed8" },
  panPhoto: { width: "28px", height: "28px", borderRadius: "50%", background: "#fff", margin: "10px" },
  panLine1: { width: "60px", height: "6px", background: "#fff", marginLeft: "50px" },
  panLine2: { width: "45px", height: "6px", background: "#fff", marginLeft: "50px", marginTop: "8px" },

  userArt: { position: "relative", width: "120px", height: "120px" },
  userHair: { width: "55px", height: "25px", background: "#111827", borderRadius: "20px", margin: "0 auto" },
  userFace: { width: "50px", height: "50px", borderRadius: "50%", background: "#fcd34d", margin: "0 auto" },
  userBody: { width: "70px", height: "40px", background: "#2563eb", borderRadius: "20px", margin: "10px auto" }
};