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
      toast.info("Bank details are locked and cannot be modified.");
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
          &larr; Back
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
            disabled={saved}
          />

          <Input
            icon="📱"
            label="Associated Mobile Number"
            name="mobile"
            value={form.mobile}
            onChange={change}
            disabled={saved}
          />

          <div style={styles.row}>
            <div style={styles.labelWrapper}>
              <span style={styles.inlineIcon}>🏦</span>
              <label style={styles.label}>
                Institution / Bank Name <span style={{ color: "#f87171" }}>*</span>
              </label>
            </div>

            <div style={{ position: "relative" }}>
              <input
                style={{
                  ...styles.input,
                  background: saved ? "#0f172a" : "#020617",
                  borderColor: saved ? "#1e293b" : "#475569",
                  color: saved ? "#94a3b8" : "#f8fafc",
                  cursor: saved ? "not-allowed" : "pointer"
                }}
                value={bankDropdownOpen ? bankSearch : form.bankName}
                onChange={(e) => {
                  setBankSearch(e.target.value);
                  if (!bankDropdownOpen) setBankDropdownOpen(true);
                }}
                onClick={() => {
                  if (!saved) {
                    setBankDropdownOpen(true);
                    setBankSearch(form.bankName);
                  }
                }}
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

          <Input
            icon="💳"
            label="Bank Account Number"
            name="accountNumber"
            value={form.accountNumber}
            onChange={change}
            disabled={saved}
          />

          <Input
            icon="🔏"
            label="IFSC Routing Code"
            name="ifscCode"
            value={form.ifscCode}
            onChange={change}
            disabled={saved}
          />

          <Input
            icon="⚡"
            label="UPI Address Alias"
            name="upiId"
            value={form.upiId}
            onChange={change}
            disabled={saved}
            optional
          />
        </div>

        <div style={styles.note}>
          <div style={styles.infoIcon}>i</div>
          <div style={{ flex: 1 }}>
            <b style={{ color: "#f59e0b", fontSize: "16px", display: "block", marginBottom: "5px" }}>Critical Verification Required</b>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "15px", lineHeight: "1.5" }}>
              Please guarantee all parameters align exactly with your ledger passbook. 
            </p>
          </div>
        </div>

        <div style={styles.actionArea}>
          {!saved ? (
            <button
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
              onClick={save}
              disabled={loading}
            >
              <span>{loading ? "⚡ Processing..." : "💾 Save Secure Ledger"}</span>
              <span style={{ fontSize: "22px" }}>&rarr;</span>
            </button>
          ) : (
            <div style={styles.lockedArea}>
              <p style={styles.lockMessage}>Bank details are locked for security. If you need to change them, please contact support.</p>
              <button style={styles.supportBtn} onClick={() => navigate("/support")}>
                Support &rarr;
              </button>
            </div>
          )}
        </div>

        <p style={styles.bottomText}>
          🛡️ Compliance Guarantee: Financial fields remain completely confidential under banking privacy directives.
        </p>
      </section>
    </div>
  );
}

function Input({ icon, label, name, value, onChange, disabled, optional }) {
  return (
    <div style={styles.row}>
      <div style={styles.labelWrapper}>
        <span style={styles.inlineIcon}>{icon}</span>
        <label style={styles.label}>
          {label} {!optional && <span style={{ color: "#f87171" }}>*</span>}
        </label>
      </div>

      <input
        style={{
          ...styles.input,
          background: disabled ? "#0f172a" : "#020617",
          borderColor: disabled ? "#1e293b" : "#475569",
          color: disabled ? "#94a3b8" : "#f8fafc",
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 10%, #0f172a 0%, #020617 100%)",
    color: "#f1f5f9",
    padding: "32px 20px 80px",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    boxSizing: "border-box"
  },
  headerNav: {
    maxWidth: "960px",
    margin: "0 auto 24px"
  },
  backBtn: {
    padding: "12px 22px",
    borderRadius: "14px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#e2e8f0",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  hero: {
    maxWidth: "960px",
    margin: "0 auto 36px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "32px",
    flexWrap: "wrap-reverse"
  },
  heroText: {
    flex: 1,
    minWidth: "280px"
  },
  heroTitle: {
    fontSize: "32px",
    fontWeight: "900",
    margin: "0 0 12px 0",
    background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.5px"
  },
  heroSubtitle: {
    fontSize: "17px",
    color: "#94a3b8",
    lineHeight: "1.6",
    margin: 0
  },
  bankArt: {
    width: "240px",
    height: "170px",
    position: "relative",
    margin: "0 auto",
    opacity: 0.95
  },
  roof: {
    width: "180px",
    height: "24px",
    margin: "0 auto",
    background: "linear-gradient(90deg, #6366f1, #a855f7)",
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
    marginTop: "12px"
  },
  bankCard: {
    position: "absolute",
    left: "10px",
    bottom: "15px",
    width: "120px",
    height: "75px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
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
    background: "linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)",
    display: "grid",
    placeItems: "center",
    fontSize: "28px",
    color: "#020617",
    fontWeight: "900",
    boxShadow: "0 4px 20px rgba(34,197,94,0.3)"
  },
  formBox: {
    maxWidth: "960px",
    margin: "0 auto",
    borderRadius: "26px",
    border: "1px solid #334155",
    background: "#0f172a",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
  },
  secureHead: {
    padding: "24px 28px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    background: "linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)",
    borderBottom: "1px solid #1e293b",
    flexWrap: "wrap"
  },
  secureIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "14px",
    background: "rgba(99, 102, 241, 0.15)",
    display: "grid",
    placeItems: "center",
    fontSize: "26px"
  },
  secureTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 4px 0",
    color: "#f8fafc"
  },
  secureSubtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0
  },
  secureBadge: {
    padding: "10px 18px",
    borderRadius: "12px",
    background: "rgba(34,197,94,0.1)",
    color: "#4ade80",
    fontSize: "13px",
    fontWeight: "700",
    border: "1px solid rgba(34,197,94,0.2)"
  },
    inputsContainer: {
    padding: "12px 24px"
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "20px 8px",
    borderBottom: "1px solid #1e293b"
  },
  labelWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  inlineIcon: {
    fontSize: "20px",
    opacity: 0.9
  },
  label: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#cbd5e1"
  },
  input: {
    width: "100%",
    height: "56px",
    borderRadius: "14px",
    border: "1.5px solid",
    padding: "0 18px",
    fontSize: "17px",
    fontWeight: "500",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s"
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: "220px",
    overflowY: "auto",
    background: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "12px",
    marginTop: "6px",
    zIndex: 1000,
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
  },
  dropdownItem: {
    padding: "12px 18px",
    fontSize: "15px",
    color: "#f8fafc",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  note: {
    margin: "24px",
    padding: "20px",
    borderRadius: "16px",
    border: "1.5px dashed rgba(245, 158, 11, 0.4)",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    background: "rgba(245, 158, 11, 0.02)"
  },
  infoIcon: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "rgba(245, 158, 11, 0.15)",
    color: "#fbbf24",
    display: "grid",
    placeItems: "center",
    fontSize: "14px",
    fontWeight: "900",
    flexShrink: 0,
    marginTop: "2px"
  },
  actionArea: {
    padding: "0 24px 24px"
  },
  submitBtn: {
    width: "100%",
    height: "60px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    boxSizing: "border-box"
  },
  lockedArea: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
    textAlign: "center",
    padding: "10px"
  },
  lockMessage: {
    color: "#94a3b8",
    fontSize: "15px",
    margin: 0
  },
  supportBtn: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#6366f1",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer"
  },
  bottomText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
    padding: "0 24px 28px",
    margin: 0
  }
};
