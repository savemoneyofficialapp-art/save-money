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
      }
    } catch (err) {
      console.log("BANK LOAD ERROR:", err);
    }
  };

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const save = async () => {
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
      alert(data.msg || (data.success ? "Saved" : "Failed"));
    } catch (err) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>

      <div style={styles.header}>
        <h1>BANK DETAILS</h1>
        <p>Add your bank account details<br />for safe withdrawals</p>
      </div>

      <div style={styles.box}>
        <div style={styles.secure}>
          <div style={styles.shield}>🛡️</div>
          <div>
            <h2>Your Security is Our Priority</h2>
            <p>Your details are encrypted and 100% secure.</p>
          </div>
        </div>

        <Input label="Account Holder Name" name="accountHolderName" value={form.accountHolderName} onChange={change} icon="👤" />
        <Input label="Mobile Number" name="mobile" value={form.mobile} onChange={change} icon="📱" />
        <Input label="Bank Name" name="bankName" value={form.bankName} onChange={change} icon="🏦" />
        <Input label="Bank Account Number" name="accountNumber" value={form.accountNumber} onChange={change} icon="💳" />
        <Input label="IFSC Code" name="ifscCode" value={form.ifscCode} onChange={change} icon="IFSC" />
        <Input label="UPI ID (Optional)" name="upiId" value={form.upiId} onChange={change} icon="UPI" />

        <div style={styles.note}>
          ℹ️ Please ensure all details are correct. Incorrect details may cause withdrawal failure.
        </div>

        <button style={styles.submit} onClick={save} disabled={loading}>
          {loading ? "SAVING..." : "SUBMIT DETAILS"} →
        </button>

        <button style={styles.changeBtn} onClick={save} disabled={loading}>
          ✎ UPDATE / CHANGE BANK DETAILS
        </button>

        <p style={styles.safeText}>
          🛡️ Your data is safe with us. We never share your information.
        </p>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, icon }) {
  return (
    <div style={styles.row}>
      <div style={styles.icon}>{icon}</div>
      <label style={styles.label}>{label} {name !== "upiId" && <b>*</b>}</label>
      <input
        style={styles.input}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label}`}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top,#15185c,#020617 70%)",
    color: "white",
    padding: 24,
    fontFamily: "Arial"
  },
  backBtn: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 58,
    height: 58,
    borderRadius: 16,
    border: "1px solid #7c3aed",
    background: "#0f172a",
    color: "white",
    fontSize: 36
  },
  header: {
    textAlign: "center",
    paddingTop: 25,
    marginBottom: 30
  },
  box: {
    maxWidth: 960,
    margin: "0 auto",
    borderRadius: 24,
    border: "1px solid rgba(168,85,247,.5)",
    background: "rgba(2,6,23,.78)",
    overflow: "hidden"
  },
  secure: {
    padding: 28,
    display: "flex",
    alignItems: "center",
    gap: 20,
    background: "linear-gradient(90deg,rgba(126,34,206,.5),rgba(15,23,42,.5))"
  },
  shield: {
    width: 72,
    height: 72,
    borderRadius: 22,
    background: "linear-gradient(135deg,#9333ea,#ec4899)",
    display: "grid",
    placeItems: "center",
    fontSize: 38
  },
  row: {
    display: "grid",
    gridTemplateColumns: "80px 250px 1fr",
    gap: 15,
    alignItems: "center",
    padding: "18px 30px",
    borderBottom: "1px solid rgba(148,163,184,.16)"
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "1px solid rgba(148,163,184,.25)",
    display: "grid",
    placeItems: "center",
    color: "#f472b6",
    fontWeight: 900
  },
  label: {
    fontSize: 20,
    fontWeight: 800
  },
  input: {
    height: 62,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,.3)",
    background: "rgba(15,23,42,.82)",
    color: "white",
    padding: "0 20px",
    fontSize: 18,
    outline: "none"
  },
  note: {
    margin: 28,
    padding: 20,
    borderRadius: 16,
    border: "1px dashed #2563eb",
    background: "rgba(15,23,42,.8)"
  },
  submit: {
    margin: "0 30px 20px",
    width: "calc(100% - 60px)",
    height: 78,
    border: "none",
    borderRadius: 16,
    background: "linear-gradient(90deg,#8b5cf6,#d946ef,#ec4899)",
    color: "white",
    fontSize: 24,
    fontWeight: 900
  },
  changeBtn: {
    margin: "0 30px 20px",
    width: "calc(100% - 60px)",
    height: 70,
    borderRadius: 16,
    border: "1px solid #d946ef",
    background: "transparent",
    color: "#d8b4fe",
    fontSize: 20,
    fontWeight: 900
  },
  safeText: {
    textAlign: "center",
    color: "#cbd5e1",
    paddingBottom: 22
  }
};