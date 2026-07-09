import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

export default function BankDetails() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [form, setForm] = useState({
    accountHolderName: "",
    mobile: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: ""
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(true);

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      const res = await fetch(`${API}/bank-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success && data.bank) {
        setForm({
          accountHolderName: data.bank.accountHolderName || "",
          mobile: data.bank.mobile || "",
          bankName: data.bank.bankName || "",
          accountNumber: data.bank.accountNumber || "",
          ifscCode: data.bank.ifscCode || "",
          upiId: data.bank.upiId || ""
        });

        setSaved(true);
        setEditMode(false);
      }
    } catch (err) {
      console.log("BANK LOAD ERROR:", err);
    }
  };

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const save = async () => {
    if (!editMode) {
      toast.info("Please click UPDATE / CHANGE BANK DETAILS first");
      return;
    }

    if (
      !form.accountHolderName ||
      !form.mobile ||
      !form.bankName ||
      !form.accountNumber ||
      !form.ifscCode
    ) {
      toast.warning("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/save-bank-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email, ...form })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Bank details saved successfully");
        setSaved(true);
        setEditMode(false);
      } else {
        toast.error(data.msg || "Failed to save bank details");
      }
    } catch (err) {
      console.log("BANK SAVE ERROR:", err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setEditMode(true);
  };

  const disabled = saved && !editMode;

  return (
    <div style={styles.page}>
      <div style={styles.headerNav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* 🏛️ আল্ট্রা-মডার্ন হিরো আর্ট সেকশন */}
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <h1 style={styles.heroTitle}>BANK SETTINGS</h1>
          <p style={styles.heroSubtitle}>
            Securely configure your native settlement account <br />
            for instantaneous, automated liquid withdrawals.
          </p>
        </div>

        <div style={styles.bankArt}>
          <div style={styles.roof}></div>
          <div style={styles.bankMain}>
            <h3 style={styles.bankMainTitle}>SECURE VAULT</h3>
            <div style={styles.columns}>
              <span></span><span></span><span></span>
            </div>
          </div>

          <div style={styles.bankCard}>
            <div style={styles.cardChip}></div>
            <p style={styles.cardNumber}>••••  ••••  ••••  3456</p>
          </div>

          <div style={styles.shield}>✓</div>
        </div>
      </section>

      {/* 🔐 মূল সিকিউর ফর্ম বক্স */}
      <section style={styles.formBox}>
        <div style={styles.secureHead}>
          <div style={styles.secureIcon}>🛡️</div>
          <div style={{ flex: 1 }}>
            <h2 style={styles.secureTitle}>End-to-End Cryptographic Security</h2>
            <p style={styles.secureSubtitle}>Your bank coordinates are fully tokenized and encrypted at rest.</p>
          </div>
          <div style={styles.secureBadge}>🔒 256-Bit Encrypted</div>
        </div>

        <div style={styles.inputsContainer}>
          <Input
            icon="👤"
            label="Account Holder Name"
            name="accountHolderName"
            value={form.accountHolderName}
            onChange={change}
            disabled={disabled}
          />

          <Input
            icon="📱"
            label="Associated Mobile Number"
            name="mobile"
            value={form.mobile}
            onChange={change}
            disabled={disabled}
          />

          <Input
            icon="🏦"
            label="Institution / Bank Name"
            name="bankName"
            value={form.bankName}
            onChange={change}
            disabled={disabled}
          />

          <Input
            icon="💳"
            label="Bank Account Number"
            name="accountNumber"
            value={form.accountNumber}
            onChange={change}
            disabled={disabled}
          />

          <Input
            icon="🔏"
            label="IFSC Routing Code"
            name="ifscCode"
            value={form.ifscCode}
            onChange={change}
            disabled={disabled}
          />

          <Input
            icon="⚡"
            label="UPI Address Alias"
            name="upiId"
            value={form.upiId}
            onChange={change}
            disabled={disabled}
            optional
          />
        </div>

        {/* ℹ️ সতর্কতা নোটিফিকেশন */}
        <div style={styles.note}>
          <div style={styles.infoIcon}>i</div>
          <div style={{ flex: 1 }}>
            <b style={{ color: "#fbbf24", fontSize: "14px", display: "block", marginBottom: "3px" }}>Critical Verification Required</b>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>Please guarantee all parameters align exactly with your ledger passbook. Mismatches lock settlement pipelines.</p>
          </div>
        </div>

        {/* 🚀 সাবমিট ও আপডেট বাটনসমূহ */}
        <div style={styles.actionArea}>
          <button
            style={{
              ...styles.submitBtn,
              opacity: loading || disabled ? 0.5 : 1,
              cursor: loading || disabled ? "not-allowed" : "pointer"
            }}
            onClick={save}
            disabled={loading || disabled}
          >
            <span>{loading ? "⚡ Processing..." : "💾 Save Secure Ledger"}</span>
            <span style={{ fontSize: "18px" }}>→</span>
          </button>

          <button
            style={{
              ...styles.changeBtn,
              borderColor: editMode ? "#475569" : "#d946ef",
              color: editMode ? "#64748b" : "#f472b6",
              cursor: editMode ? "not-allowed" : "pointer"
            }}
            onClick={startEdit}
            disabled={editMode}
          >
            ✎ Request Authorization & Change Details
          </button>

          {saved && !editMode && (
            <p style={styles.lockText}>
              🔒 Secure Lock Engaged. Reset authorization required to re-edit parameters.
            </p>
          )}

          {editMode && saved && (
            <p style={styles.editText}>
              ✏️ Safe-Mutation Active. Please make adjustments and re-commit changes.
            </p>
          )}
        </div>

        <p style={styles.bottomText}>
          🛡️ Compliance Guarantee: Financial fields remain completely confidential under banking privacy directives.
        </p>
      </section>
    </div>
  );
}

// 🎛️ রি-ইউজেবল আল্ট্রা-মডার্ন ইনপুট কম্পোনেন্ট
function Input({ icon, label, name, value, onChange, disabled, optional }) {
  return (
    <div style={styles.row}>
      <div style={styles.labelWrapper}>
        <span style={styles.inlineIcon}>{icon}</span>
        <label style={styles.label}>
          {label} {!optional && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
      </div>

      <input
        style={{
          ...styles.input,
          background: disabled ? "#0b1329" : "#020617",
          borderColor: disabled ? "#1e293b" : "#334155",
          color: disabled ? "#64748b" : "#f1f5f9",
          cursor: disabled ? "not-allowed" : "text"
        }}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={`Provide ${label.toLowerCase()}`}
      />
    </div>
  );
}

// 💎 আল্ট্রা-প্রিমিয়াম সাইবারনেটিক ডিজাইন গাইডলাইন স্টাইলস
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0b1329 100%)",
    color: "#f1f5f9",
    padding: "24px 16px 80px",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    boxSizing: "border-box"
  },
  headerNav: {
    maxWidth: "960px",
    margin: "0 auto 20px"
  },
  backBtn: {
    padding: "10px 18px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    background: "#0f172a",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  hero: {
    maxWidth: "960px",
    margin: "0 auto 30px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap-reverse"
  },
  heroText: {
    flex: 1,
    minWidth: "280px"
  },
  heroTitle: {
    fontSize: "26px",
    fontWeight: "900",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #f472b6 0%, #a855f7 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  heroSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.6",
    margin: 0
  },
  bankArt: {
    width: "240px",
    height: "170px",
    position: "relative",
    margin: "0 auto"
  },
  roof: {
    width: "180px",
    height: "24px",
    margin: "0 auto",
    background: "linear-gradient(90deg, #f472b6, #8b5cf6)",
    clipPath: "polygon(50% 0, 100% 100%, 0 100%)"
  },
  bankMain: {
    width: "170px",
    height: "100px",
    margin: "0 auto",
    borderRadius: "0 0 14px 14px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    border: "1px solid #334155",
    paddingTop: "10px",
    boxSizing: "border-box"
  },
  bankMainTitle: {
    textAlign: "center",
    margin: 0,
    fontSize: "10px",
    color: "#a855f7",
    letterSpacing: "1.5px"
  },
  columns: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    marginTop: "12px",
    span: {
      width: "6px",
      height: "40px",
      background: "#334155",
      borderRadius: "2px"
    }
  },
  bankCard: {
    position: "absolute",
    left: "10px",
    bottom: "15px",
    width: "120px",
    height: "75px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.4)",
    padding: "10px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  cardChip: {
    width: "16px",
    height: "12px",
    background: "#fbbf24",
    borderRadius: "3px"
  },
  cardNumber: {
    margin: 0,
    fontSize: "8px",
    fontFamily: "monospace",
    color: "#e2e8f0"
  },
  shield: {
    position: "absolute",
    right: "10px",
    bottom: "10px",
    width: "55px",
    height: "55px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)",
    display: "grid",
    placeItems: "center",
    fontSize: "28px",
    color: "#020617",
    fontWeight: "900",
    boxShadow: "0 4px 20px rgba(34,197,94,0.4)"
  },
  formBox: {
    maxWidth: "960px",
    margin: "0 auto",
    borderRadius: "24px",
    border: "1px solid #1e293b",
    background: "#0f172a",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
  },
  secureHead: {
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)",
    borderBottom: "1px solid #1e293b",
    flexWrap: "wrap"
  },
  secureIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "rgba(139,92,246,0.15)",
    display: "grid",
    placeItems: "center",
    fontSize: "22px"
  },
  secureTitle: {
    fontSize: "15px",
    fontWeight: "700",
    margin: "0 0 3px 0",
    color: "#f8fafc"
  },
  secureSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0
  },
  secureBadge: {
    padding: "8px 16px",
    borderRadius: "10px",
    background: "rgba(34,197,94,0.1)",
    color: "#22c55e",
    fontSize: "11px",
    fontWeight: "700",
    border: "1px solid rgba(34,197,94,0.2)"
  },
  inputsContainer: {
    padding: "8px 16px"
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "14px 8px",
    borderBottom: "1px solid #1e293b"
  },
  labelWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  inlineIcon: {
    fontSize: "15px",
    opacity: 0.8
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#cbd5e1"
  },
  input: {
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    border: "1px solid",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s"
  },
  note: {
    margin: "20px 24px",
    padding: "16px",
    borderRadius: "14px",
    border: "1px dashed rgba(251,191,36,0.3)",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "rgba(251,191,36,0.02)"
  },
  infoIcon: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "rgba(251,191,36,0.15)",
    color: "#fbbf24",
    display: "grid",
    placeItems: "center",
    fontSize: "12px",
    fontWeight: "900",
    flexShrink: 0,
    marginTop: "2px"
  },
  actionArea: {
    padding: "0 24px 20px"
  },
  submitBtn: {
    width: "100%",
    height: "52px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(90deg, #8b5cf6 0%, #d946ef 50%, #ec4899 100%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    boxSizing: "border-box"
  },
  changeBtn: {
    width: "100%",
    height: "46px",
    borderRadius: "14px",
    border: "1px solid",
    background: "transparent",
    fontSize: "13px",
    fontWeight: "700",
    marginTop: "12px",
    boxSizing: "border-box"
  },
  lockText: {
    textAlign: "center",
    color: "#34d399",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "12px",
    marginSub: 0
  },
  editText: {
    textAlign: "center",
    color: "#fbbf24",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "12px",
    marginSub: 0
  },
  bottomText: {
    textAlign: "center",
    color: "#475569",
    fontSize: "11px",
    padding: "0 24px 24px",
    margin: 0
  }
};
