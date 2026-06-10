import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      alert("Please click UPDATE / CHANGE BANK DETAILS first");
      return;
    }

    if (
      !form.accountHolderName ||
      !form.mobile ||
      !form.bankName ||
      !form.accountNumber ||
      !form.ifscCode
    ) {
      alert("Please fill all required fields");
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
        alert("Bank details saved successfully");
        setSaved(true);
        setEditMode(false);
      } else {
        alert(data.msg || "Failed to save bank details");
      }
    } catch (err) {
      console.log("BANK SAVE ERROR:", err);
      alert("Server error");
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
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ←
      </button>

      <section style={styles.hero}>
        <div style={styles.heroText}>
          <h1>BANK DETAILS</h1>
          <p>
            Add your bank account details
            <br />
            for safe withdrawals
          </p>

          <div style={styles.heroLine}>
            <span></span>
            <b></b>
          </div>
        </div>

        <div style={styles.bankArt}>
          <div style={styles.roof}></div>
          <div style={styles.bankMain}>
            <h3>BANK</h3>
            <div style={styles.columns}>
              <span></span><span></span><span></span>
            </div>
          </div>

          <div style={styles.bankCard}>
            <div></div>
            <p>1234&nbsp; 5678&nbsp; 9012&nbsp; 3456</p>
          </div>

          <div style={styles.shield}>✓</div>
        </div>
      </section>

      <section style={styles.formBox}>
        <div style={styles.secureHead}>
          <div style={styles.secureIcon}>🛡️</div>

          <div style={{ flex: 1 }}>
            <h2>Your Security is Our Priority</h2>
            <p>Your details are encrypted and 100% secure.</p>
          </div>

          <div style={styles.secureBadge}>🔒 100% Secure</div>
        </div>

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
          label="Mobile Number"
          name="mobile"
          value={form.mobile}
          onChange={change}
          disabled={disabled}
        />

        <Input
          icon="🏦"
          label="Bank Name"
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
          icon="IFSC"
          label="IFSC Code"
          name="ifscCode"
          value={form.ifscCode}
          onChange={change}
          disabled={disabled}
        />

        <Input
          icon="UPI"
          label="UPI ID (Optional)"
          name="upiId"
          value={form.upiId}
          onChange={change}
          disabled={disabled}
          optional
        />

        <div style={styles.note}>
          <div style={styles.infoIcon}>i</div>
          <div>
            <b>Please ensure all details are correct.</b>
            <p>Incorrect details may cause withdrawal failure.</p>
          </div>
          <div style={styles.moneyIcon}>💵</div>
        </div>

        <button
          style={{
            ...styles.submitBtn,
            opacity: loading || disabled ? 0.65 : 1
          }}
          onClick={save}
          disabled={loading || disabled}
        >
          <span>✈️</span>
          {loading ? "SAVING..." : saved ? "SUBMIT UPDATED DETAILS" : "SUBMIT DETAILS"}
          <b>→</b>
        </button>

        <button
          style={styles.changeBtn}
          onClick={startEdit}
          disabled={editMode}
        >
          ✎ UPDATE / CHANGE BANK DETAILS
        </button>

        {saved && !editMode && (
          <p style={styles.lockText}>
            🔒 Details saved. Click update/change to edit.
          </p>
        )}

        {editMode && saved && (
          <p style={styles.editText}>
            ✏️ Edit mode active. Update your details and submit again.
          </p>
        )}

        <p style={styles.bottomText}>
          🛡️ Your data is safe with us. We never share your information.
        </p>
      </section>
    </div>
  );
}

function Input({ icon, label, name, value, onChange, disabled, optional }) {
  return (
    <div style={styles.row}>
      <div style={styles.iconCircle}>{icon}</div>

      <label style={styles.label}>
        {label} {!optional && <b>*</b>}
      </label>

      <input
        style={{
          ...styles.input,
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? "not-allowed" : "text"
        }}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={`Enter ${label}`}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right,rgba(168,85,247,.35),transparent 26%),radial-gradient(circle at top left,rgba(37,99,235,.25),transparent 28%),linear-gradient(180deg,#020617,#030014 75%)",
    color: "#fff",
    padding: "28px 24px 40px",
    fontFamily: "Arial, sans-serif"
  },

  backBtn: {
    position: "absolute",
    top: 28,
    left: 28,
    width: 66,
    height: 66,
    borderRadius: 18,
    border: "1px solid rgba(168,85,247,.55)",
    background: "rgba(15,23,42,.72)",
    color: "#fff",
    fontSize: 42,
    cursor: "pointer",
    boxShadow: "0 0 25px rgba(124,58,237,.25)"
  },

  hero: {
    maxWidth: 960,
    margin: "0 auto 26px",
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 28,
    textAlign: "center"
  },

  heroText: {
    flex: 1
  },

  heroLine: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginTop: 22
  },

  bankArt: {
    width: 310,
    height: 220,
    position: "relative"
  },

  roof: {
    width: 250,
    height: 34,
    margin: "8px auto 0",
    background: "linear-gradient(90deg,#f472b6,#d946ef,#8b5cf6)",
    clipPath: "polygon(50% 0,100% 100%,0 100%)",
    filter: "drop-shadow(0 0 22px rgba(217,70,239,.55))"
  },

  bankMain: {
    width: 235,
    height: 135,
    margin: "0 auto",
    borderRadius: "0 0 18px 18px",
    background: "linear-gradient(135deg,#db47ff,#7c3aed)",
    boxShadow: "0 0 35px rgba(217,70,239,.42)",
    paddingTop: 12
  },

  columns: {
    display: "flex",
    justifyContent: "center",
    gap: 18,
    marginTop: 16
  },

  bankCard: {
    position: "absolute",
    left: 4,
    bottom: 20,
    width: 140,
    height: 72,
    borderRadius: 12,
    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
    boxShadow: "0 14px 26px rgba(0,0,0,.35)",
    padding: 12,
    fontSize: 11
  },

  shield: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 84,
    height: 84,
    borderRadius: "26px",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    display: "grid",
    placeItems: "center",
    fontSize: 56,
    fontWeight: 900,
    boxShadow: "0 0 35px rgba(59,130,246,.48)"
  },

  formBox: {
    maxWidth: 960,
    margin: "0 auto",
    borderRadius: 26,
    border: "1px solid rgba(168,85,247,.55)",
    background: "linear-gradient(180deg,rgba(15,23,42,.9),rgba(2,6,23,.92))",
    overflow: "hidden",
    boxShadow: "0 0 45px rgba(124,58,237,.22)"
  },

  secureHead: {
    padding: "30px 34px",
    display: "flex",
    alignItems: "center",
    gap: 22,
    background:
      "linear-gradient(90deg,rgba(88,28,135,.68),rgba(15,23,42,.42))",
    borderBottom: "1px solid rgba(148,163,184,.16)"
  },

  secureIcon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    display: "grid",
    placeItems: "center",
    fontSize: 42,
    boxShadow: "0 0 24px rgba(236,72,153,.4)"
  },

  secureBadge: {
    padding: "15px 26px",
    borderRadius: 999,
    background: "rgba(88,28,135,.58)",
    color: "#f0abfc",
    fontWeight: 900,
    whiteSpace: "nowrap"
  },

  row: {
    display: "grid",
    gridTemplateColumns: "88px 250px 1fr",
    alignItems: "center",
    gap: 16,
    padding: "19px 34px",
    borderBottom: "1px solid rgba(148,163,184,.14)"
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(15,23,42,.95)",
    border: "1px solid rgba(148,163,184,.25)",
    display: "grid",
    placeItems: "center",
    color: "#f472b6",
    fontWeight: 900,
    fontSize: 24
  },

  label: {
    fontSize: 20,
    fontWeight: 900
  },

  input: {
    height: 68,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,.28)",
    background: "rgba(15,23,42,.82)",
    color: "#fff",
    padding: "0 22px",
    fontSize: 19,
    outline: "none"
  },

  note: {
    margin: 32,
    padding: 22,
    borderRadius: 18,
    border: "1px dashed rgba(59,130,246,.7)",
    display: "flex",
    alignItems: "center",
    gap: 20,
    background: "rgba(15,23,42,.65)"
  },

  infoIcon: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#4338ca,#7c3aed)",
    display: "grid",
    placeItems: "center",
    fontSize: 30,
    fontWeight: 900
  },

  moneyIcon: {
    marginLeft: "auto",
    fontSize: 55
  },

  submitBtn: {
    margin: "0 36px 22px",
    width: "calc(100% - 72px)",
    height: 88,
    border: "none",
    borderRadius: 17,
    background: "linear-gradient(90deg,#8b5cf6,#d946ef,#ec4899)",
    color: "#fff",
    fontSize: 24,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 36px",
    cursor: "pointer"
  },

  changeBtn: {
    margin: "0 36px 18px",
    width: "calc(100% - 72px)",
    height: 74,
    borderRadius: 17,
    border: "1px solid #d946ef",
    background: "transparent",
    color: "#d8b4fe",
    fontSize: 20,
    fontWeight: 900,
    cursor: "pointer"
  },

  lockText: {
    textAlign: "center",
    color: "#a7f3d0",
    fontWeight: 800
  },

  editText: {
    textAlign: "center",
    color: "#facc15",
    fontWeight: 800
  },

  bottomText: {
    textAlign: "center",
    color: "#cbd5e1",
    padding: "0 16px 26px"
  }
};