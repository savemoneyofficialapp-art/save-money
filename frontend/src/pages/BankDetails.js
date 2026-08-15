import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

const INDIAN_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "AU Small Finance Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Indian Bank",
  "Central Bank of India",
  "Indian Overseas Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",
  "IDBI Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Yes Bank",
  "Federal Bank",
  "IDFC First Bank",
  "RBL Bank",
  "South Indian Bank",
  "Bandhan Bank",
  "City Union Bank",
  "Karur Vysya Bank",
  "Karnataka Bank",
  "DCB Bank",
  "Airtel Payments Bank",
  "India Post Payments Bank",
  "Fino Payments Bank",
  "Paytm Payments Bank"
];

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

  // Bank Searchable Dropdown States
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

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
      }
    } catch (err) {
      console.log("BANK LOAD ERROR:", err);
    }
  };

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const selectBank = (bankName) => {
    setForm({ ...form, bankName });
    setBankDropdownOpen(false);
    setBankSearch("");
  };

  const save = async () => {
    if (saved) {
      toast.info("Bank details already submitted and cannot be changed.");
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

  const filteredBanks = INDIAN_BANKS.filter((bank) =>
    bank.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.headerNav}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <section style={styles.hero}>
        <div style={styles.heroText}>
          <h1 style={styles.heroTitle}>BANK SETTINGS</h1>
          <p style={styles.heroSubtitle}>
            Securely configure your native settlement account <br />
            for instantaneous, automated liquid withdrawals.
          </p>
        </div>
      </section>

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
          <Input icon="👤" label="Account Holder Name" name="accountHolderName" value={form.accountHolderName} onChange={change} disabled={saved} />
          <Input icon="📱" label="Associated Mobile Number" name="mobile" value={form.mobile} onChange={change} disabled={saved} />

          <div style={styles.row}>
            <div style={styles.labelWrapper}>
              <span style={styles.inlineIcon}>🏦</span>
              <label style={styles.label}>Institution / Bank Name <span style={{ color: "#f87171" }}>*</span></label>
            </div>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...styles.input, background: saved ? "#0f172a" : "#020617", borderColor: saved ? "#1e293b" : "#475569", color: saved ? "#94a3b8" : "#f8fafc", cursor: saved ? "not-allowed" : "pointer" }}
                value={bankDropdownOpen ? bankSearch : form.bankName}
                onChange={(e) => { setBankSearch(e.target.value); if (!bankDropdownOpen) setBankDropdownOpen(true); }}
                onClick={() => { if (!saved) { setBankDropdownOpen(true); setBankSearch(form.bankName); } }}
                disabled={saved}
                placeholder="Search or select your bank name..."
              />
              {bankDropdownOpen && !saved && (
                <div style={styles.dropdownList}>
                  {filteredBanks.length > 0 ? (
                    filteredBanks.map((bank, index) => (
                      <div
                        key={index}
                        onClick={() => selectBank(bank)}
                        style={{
                          ...styles.dropdownItem,
                          borderBottom: index < filteredBanks.length - 1 ? "1px solid #1e293b" : "none"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {bank}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "12px 18px", color: "#94a3b8", fontSize: "14px" }}>
                      No bank found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Input icon="💳" label="Bank Account Number" name="accountNumber" value={form.accountNumber} onChange={change} disabled={saved} />
          <Input icon="🔏" label="IFSC Routing Code" name="ifscCode" value={form.ifscCode} onChange={change} disabled={saved} />
          <Input icon="⚡" label="UPI Address Alias" name="upiId" value={form.upiId} onChange={change} disabled={saved} optional />
        </div>

        {saved ? (
          <div style={styles.note}>
            <div style={styles.infoIcon}>!</div>
            <div style={{ flex: 1 }}>
              <b style={{ color: "#f59e0b", fontSize: "16px", display: "block", marginBottom: "5px" }}>Details Locked</b>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "15px", lineHeight: "1.5" }}>
                For security reasons, bank details cannot be modified once submitted. If you need to change your bank details, please contact support.
              </p>
              <button style={styles.supportBtn} onClick={() => navigate("/support")}>
                Contact Support
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.actionArea}>
            <button style={{ ...styles.submitBtn, opacity: loading ? 0.5 : 1 }} onClick={save} disabled={loading}>
              <span>{loading ? "⚡ Processing..." : "💾 Save Secure Ledger"}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Input({ icon, label, name, value, onChange, disabled, optional }) {
  return (
    <div style={styles.row}>
      <div style={styles.labelWrapper}>
        <span style={styles.inlineIcon}>{icon}</span>
        <label style={styles.label}>{label} {!optional && <span style={{ color: "#f87171" }}>*</span>}</label>
      </div>
      <input
        style={{ ...styles.input, background: disabled ? "#0f172a" : "#020617", borderColor: disabled ? "#1e293b" : "#475569", color: disabled ? "#94a3b8" : "#f8fafc", cursor: disabled ? "not-allowed" : "text" }}
        name={name} value={value} onChange={onChange} disabled={disabled} placeholder={`Provide ${label.toLowerCase()}`}
      />
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at 50% 10%, #0f172a 0%, #020617 100%)", color: "#f1f5f9", padding: "32px 20px 80px", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" },
  headerNav: { maxWidth: "960px", margin: "0 auto 24px" },
  backBtn: { padding: "12px 22px", borderRadius: "14px", border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
  hero: { maxWidth: "960px", margin: "0 auto 36px" },
  heroTitle: { fontSize: "32px", fontWeight: "900", margin: "0 0 12px 0", background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroSubtitle: { fontSize: "17px", color: "#94a3b8", lineHeight: "1.6", margin: 0 },
  formBox: { maxWidth: "960px", margin: "0 auto", borderRadius: "26px", border: "1px solid #334155", background: "#0f172a", overflow: "hidden" },
  secureHead: { padding: "24px 28px", display: "flex", alignItems: "center", gap: "20px", background: "linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)", borderBottom: "1px solid #1e293b" },
  secureIcon: { width: "54px", height: "54px", borderRadius: "14px", background: "rgba(99, 102, 241, 0.15)", display: "grid", placeItems: "center", fontSize: "26px" },
  secureTitle: { fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" },
  secureSubtitle: { fontSize: "14px", color: "#94a3b8", margin: 0 },
  secureBadge: { padding: "10px 18px", borderRadius: "12px", background: "rgba(34,197,94,0.1)", color: "#4ade80", fontSize: "13px", fontWeight: "700", border: "1px solid rgba(34,197,94,0.2)" },
  inputsContainer: { padding: "12px 24px" },
  row: { display: "flex", flexDirection: "column", gap: "10px", padding: "20px 8px", borderBottom: "1px solid #1e293b" },
  labelWrapper: { display: "flex", alignItems: "center", gap: "10px" },
  inlineIcon: { fontSize: "20px", opacity: 0.9 },
  label: { fontSize: "16px", fontWeight: "600", color: "#cbd5e1" },
  input: { width: "100%", height: "56px", borderRadius: "14px", border: "1.5px solid", padding: "0 18px", fontSize: "17px", fontWeight: "500", outline: "none", boxSizing: "border-box" },
  dropdownList: { position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "220px", overflowY: "auto", background: "#0f172a", border: "1px solid #475569", borderRadius: "12px", marginTop: "6px", zIndex: 1000, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" },
  dropdownItem: { padding: "12px 18px", fontSize: "15px", color: "#f8fafc", cursor: "pointer" },
  note: { margin: "24px", padding: "20px", borderRadius: "16px", border: "1px dashed rgba(245, 158, 11, 0.4)", display: "flex", alignItems: "flex-start", gap: "16px", background: "rgba(245, 158, 11, 0.02)" },
  infoIcon: { width: "26px", height: "26px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: "900", flexShrink: 0 },
  supportBtn: { marginTop: "12px", padding: "10px 20px", borderRadius: "10px", border: "none", background: "#f59e0b", color: "#000", fontWeight: "bold", cursor: "pointer" },
  actionArea: { padding: "24px" },
  submitBtn: { width: "100%", height: "60px", border: "none", borderRadius: "16px", background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)", color: "#ffffff", fontSize: "18px", fontWeight: "700", cursor: "pointer" }
};
