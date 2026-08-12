import { useState } from "react";
import { toast } from "react-toastify";
import { API } from "../config";

export default function AdminAddon() {
  const token = localStorage.getItem("token");

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { msg: text || "Invalid server response" };
    }
  };

  const checkAuthError = (d) => {
    if (
      d?.msg === "Token expired or invalid" ||
      d?.msg === "No token" ||
      d?.msg === "Invalid token" ||
      d?.msg === "Admin access only" ||
      d?.msg === "Admin only"
    ) {
      localStorage.clear();
      alert(d.msg + ". Please login again.");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flatAmount, setFlatAmount] = useState(799); // এখান থেকে অ্যামাউন্ট কন্ট্রোল করতে পারবেন
  const [offerList, setOfferList] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiPost = async (path, body) => {
    try {
      const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify(body)
      });
      const d = await safeJson(res);
      if (checkAuthError && checkAuthError(d)) return null;
      return d;
    } catch (err) {
      console.log("API Error:", err);
      return { success: false, msg: "Network error" };
    }
  };

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      return toast.info("Please select start and end dates.");
    }

    setLoading(true);
    const res = await apiPost("/admin-addon-calc", { startDate, endDate, flatAmount });
    setLoading(false);

    if (res && res.success) {
      setOfferList(res.data || []);
      toast.success("Calculation completed successfully!");
    } else {
      toast.error(res?.msg || "Failed to calculate data.");
    }
  };

  const handleDistribute = async () => {
    if (offerList.length === 0) return toast.info("No data available to distribute.");

    if (!window.confirm("Are you sure you want to add remaining balance to all users' wallets?")) return;

    setLoading(true);
    const res = await apiPost("/admin-addon-distribute", { offerList });
    setLoading(false);

    if (res && res.success) {
      toast.success(res.msg || "Amount added to wallets successfully!");
      setOfferList([]);
    } else {
      toast.error(res?.msg || "Failed to distribute amount.");
    }
  };

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧩 Add On: Referral Offer Manager</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📅 Date & Flat Amount Filter</h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "20px" }}>
          Select the date range and set the flat bonus amount per referral.
        </p>

        <div style={styles.filterGrid}>
          <div>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Flat Amount (₹)</label>
            <input
              type="number"
              value={flatAmount}
              onChange={(e) => setFlatAmount(Number(e.target.value))}
              style={styles.input}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={handleCalculate} style={styles.button} disabled={loading}>
              {loading ? "Calculating..." : "🔍 Search & Calculate"}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📊 Users Offer Summary List ({offerList.length} Users)</h2>

        {offerList.length > 0 ? (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tr}>
                    <th style={styles.th}>User Name & Email</th>
                    <th style={styles.th}>Total Referrals</th>
                    <th style={styles.th}>Target Amount ({money(flatAmount)})</th>
                    <th style={styles.th}>Already Received</th>
                    <th style={styles.th}>Remaining Balance (Wallet)</th>
                  </tr>
                </thead>
                <tbody>
                  {offerList.map((item, index) => (
                    <tr key={index} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: "bold" }}>{item.name}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{item.email}</div>
                      </td>
                      <td style={{ ...styles.td, color: "#38bdf8", fontWeight: "bold" }}>
                        {item.referralCount} Ref
                      </td>
                      <td style={styles.td}>{money(item.targetAmount)}</td>
                      <td style={styles.td}>{money(item.alreadyReceived)}</td>
                      <td style={{ ...styles.td, color: "#4ade80", fontWeight: "bold" }}>
                        {money(item.remainingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={handleDistribute} style={styles.distributeButton} disabled={loading}>
              {loading ? "Processing..." : "🚀 Add Remaining Balance to All Wallets"}
            </button>
          </>
        ) : (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
            No records found. Please search with a date range.
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto", color: "#fff", fontFamily: "sans-serif" },
  title: { fontSize: "24px", marginBottom: "20px" },
  section: { background: "#1e293b", padding: "20px", borderRadius: "10px", marginBottom: "20px" },
  sectionTitle: { fontSize: "18px", marginBottom: "10px" },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" },
  label: { display: "block", fontSize: "13px", marginBottom: "5px", color: "#94a3b8" },
  input: { width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #475569", background: "#0f172a", color: "#fff" },
  button: { width: "100%", padding: "11px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "10px" },
  tr: { borderBottom: "1px solid #334155" },
  th: { padding: "12px", textAlign: "left", background: "#0f172a", color: "#cbd5e1", fontSize: "14px" },
  td: { padding: "12px", fontSize: "14px" },
  distributeButton: { marginTop: "20px", width: "100%", padding: "15px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }
};
