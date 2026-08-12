import { useState } from "react";
import { toast } from "react-toastify";
import { API } from "../config";

export default function AdminAddon() {
  const token = localStorage.getItem("token");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offerList, setOfferList] = useState([]);
  const [loading, setLoading] = useState(false);

    const apiPost = async (path, body) => {
    try {
      const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "" // আপনার প্রজেক্টের অন্যান্য পেজের মতো একই হেডার ফরম্যাট
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
      return toast.info("দয়া করে শুরুর এবং শেষের তারিখ সিলেক্ট করুন");
    }

    setLoading(true);
    const res = await apiPost("/admin-addon-calc", { startDate, endDate });
    setLoading(false);

    if (res && res.success) {
      setOfferList(res.data || []);
      toast.success("অফার হিসাব সফলভাবে সম্পন্ন হয়েছে!");
    } else {
      toast.error(res?.msg || "ডেটা ফেচ করতে ব্যর্থ হয়েছে");
    }
  };

  const handleDistribute = async () => {
    if (offerList.length === 0) return toast.info("বিতরণ করার মতো কোনো ডেটা নেই");

    if (!window.confirm("আপনি কি নিশ্চিতভাবে সবার বাকি টাকা ওয়ালেটে অ্যাড করতে চান?")) return;

    setLoading(true);
    const res = await apiPost("/admin-addon-distribute", { offerList });
    setLoading(false);

    if (res && res.success) {
      toast.success(res.msg);
      setOfferList([]);
    } else {
      toast.error(res?.msg || "টাকা যোগ করতে সমস্যা হয়েছে");
    }
  };

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧩 Add On: Referral Offer Manager (₹799 Flat)</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📅 তারিখ অনুযায়ী রেফার সার্চ ও ক্যালকুলেশন</h2>
        <p style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "20px" }}>
          নির্দিষ্ট তারিখের (যেমন: ৯ থেকে ১৫ তারিখ) মধ্যে ব্যবহারকারীদের রেফার লিস্ট বের করুন এবং ফ্ল্যাট ৭৯৯ টাকা হিসাব করুন।
        </p>

        <div style={styles.filterGrid}>
          <div>
            <label style={styles.label}>শুরুর তারিখ</label>
            <input 
              type="date" 
              style={styles.input} 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div>
            <label style={styles.label}>শেষের তারিখ</label>
            <input 
              type="date" 
              style={styles.input} 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button style={styles.actionBtn} onClick={handleCalculate} disabled={loading}>
              {loading ? "হিসাব হচ্ছে..." : "🔍 সার্চ ও ক্যালকুলেট"}
            </button>
          </div>
        </div>
      </div>

      {offerList.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 ব্যবহারকারীদের অফার সামারি লিস্ট ({offerList.length} জন)</h2>
          
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ইউজার নাম ও ইমেইল</th>
                  <th style={styles.th}>মোট রেফার</th>
                  <th style={styles.th}>পাওয়ার কথা (₹৭৯৯ করে)</th>
                  <th style={styles.th}>ইতিমধ্যে পেয়েছে</th>
                  <th style={styles.th}>বাকি টাকা (ওয়ালেটে যোগ হবে)</th>
                </tr>
              </thead>
              <tbody>
                {offerList.map((item, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>
                      <b style={{ color: "#fff", fontSize: "16px" }}>{item.name}</b>
                      <p style={{ margin: "2px 0 0 0", color: "#cbd5e1", fontSize: "14px" }}>{item.email}</p>
                    </td>
                    <td style={{ ...styles.td, color: "#38bdf8", fontWeight: "bold" }}>{item.referralCount} টি</td>
                    <td style={{ ...styles.td, color: "#22c55e", fontWeight: "bold" }}>{money(item.targetAmount)}</td>
                    <td style={{ ...styles.td, color: "#facc15" }}>{money(item.alreadyReceived)}</td>
                    <td style={{ ...styles.td, color: "#ef4444", fontWeight: "bold", fontSize: "16px" }}>{money(item.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button style={styles.greenFull} onClick={handleDistribute} disabled={loading}>
            🚀 সবার ওয়ালেটে বাকি টাকা অ্যাড অন করে দিন
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0b1329 100%)",
    padding: "30px 20px 100px",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', system-ui, sans-serif"
  },
  title: {
    fontSize: "30px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "25px",
    textAlign: "center"
  },
  section: {
    background: "#0f172a",
    padding: "26px",
    borderRadius: "26px",
    border: "1.5px solid #334155",
    marginBottom: "35px",
    boxShadow: "0 18px 30px -5px rgba(0, 0, 0, 0.3)"
  },
  sectionTitle: {
    margin: "0 0 15px 0",
    fontSize: "22px",
    fontWeight: "800",
    color: "#ffffff",
    borderBottom: "2px solid #1e293b",
    paddingBottom: "10px"
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "15px"
  },
  label: {
    color: "#cbd5e1",
    fontSize: "14px",
    display: "block",
    marginBottom: "6px",
    fontWeight: "600"
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1.5px solid #334155",
    background: "#020617",
    color: "white",
    fontSize: "15px",
    boxSizing: "border-box"
  },
  actionBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    color: "white",
    padding: "14px 24px",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "15px",
    height: "50px"
  },
  tableWrap: {
    overflowX: "auto",
    marginTop: "20px",
    background: "#020617",
    borderRadius: "16px",
    border: "1.5px solid #334155"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px"
  },
  th: {
    background: "#0f172a",
    padding: "16px",
    color: "#ffffff",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "700",
    borderBottom: "2px solid #334155"
  },
  tr: {
    borderBottom: "1px solid #1e293b"
  },
  td: {
    padding: "16px",
    fontSize: "15px",
    color: "#f1f5f9"
  },
  greenFull: {
    width: "100%",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    padding: "16px",
    borderRadius: "16px",
    color: "#020617",
    fontWeight: "800",
    marginTop: "25px",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 10px 20px rgba(34, 197, 94, 0.2)"
  }
};
    
