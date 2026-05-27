import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function Home() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email");
  const name = localStorage.getItem("name") || "User";
  const token = localStorage.getItem("token");

  const [user, setUser] = useState({});
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setUser(data || {});
    } catch (err) {
      console.log("Home load error", err);
    }
  };

  const wallet = user.wallet || user.totalWallet || 0;
  const totalInvestment = user.totalInvestment || 0;
  const totalReturn = user.totalReturn || 0;
  const totalReferral = user.totalReferral || user.referralCount || 0;
  const totalWithdraw = user.totalWithdraw || 0;

  return (
    <div style={styles.container}>

      <div style={styles.topbar}>
        <button style={styles.menu}>☰</button>
        <h3>Welcome, {name}</h3>

        <div
          style={styles.bell}
          onClick={() => navigate("/notifications")}
        >
          🔔
          <span style={styles.badge}>3</span>
        </div>
      </div>

      <div style={styles.heroCard}>
        <div style={styles.profileCircle}>👤</div>

        <div style={{ flex: 1 }}>
          <p style={styles.welcome}>Welcome Back 👋</p>
          <h1 style={styles.userName}>{name}</h1>
          <p style={styles.tagline}>Save Money, Secure Future 💚</p>
        </div>

        <div style={styles.walletMini}>
          <p>Total Wallet</p>
          <h2>₹{wallet}</h2>
          <span>👛</span>
        </div>
      </div>

      <div style={styles.updateBox}>
        <div>
          <b>📢 Latest Update</b>
          <p>No new announcement</p>
        </div>
        <span>›</span>
      </div>

      <div style={styles.statsGrid}>
        <Stat title="Total Investment" value={`₹${totalInvestment}`} icon="📈" bg="linear-gradient(135deg,#1d4ed8,#172554)" />
        <Stat title="Total Return" value={`₹${totalReturn}`} icon="📊" bg="linear-gradient(135deg,#059669,#064e3b)" />
        <Stat title="Total Referral" value={totalReferral} icon="👥" bg="linear-gradient(135deg,#7e22ce,#3b0764)" />
        <Stat title="Total Withdraw" value={`₹${totalWithdraw}`} icon="⬇️" bg="linear-gradient(135deg,#ea580c,#7c2d12)" />
      </div>

      <SectionTitle title="MAIN ACTIONS" color="#38bdf8" />

      <div style={styles.actionGrid}>
        <Action title="💰 INVEST NOW" sub="Start Investing" bg="linear-gradient(135deg,#16a34a,#047857)" onClick={() => navigate("/save-money")} />
        <Action title="📈 My Investment" sub="View Details" bg="linear-gradient(135deg,#2563eb,#0f766e)" onClick={() => navigate("/my-investment")} />
        <Action title="💵 Wallet" sub="Add & Manage" bg="linear-gradient(135deg,#7c3aed,#9333ea)" onClick={() => navigate("/wallet")} />
        <Action title="💸 Withdraw" sub="Request Payout" bg="linear-gradient(135deg,#f97316,#ea580c)" onClick={() => navigate("/withdraw")} />
        <Action title="👥 Refer & Earn" sub="Invite & Earn" bg="linear-gradient(135deg,#db2777,#ec4899)" onClick={() => navigate("/refer")} />
        <Action title="🧾 Transactions" sub="All History" bg="linear-gradient(135deg,#0891b2,#0f766e)" onClick={() => navigate("/transactions")} />
      </div>

      <SectionTitle title="MORE FEATURES" color="#facc15" />

      <div style={styles.actionGrid}>
        <Action title="✅ KYC Verification" sub="Verify Your Account" bg="linear-gradient(135deg,#06b6d4,#0891b2)" onClick={() => navigate("/kyc")} />
        <Action title="🎁 Daily Reward" sub="Claim Reward" bg="linear-gradient(135deg,#7c3aed,#a855f7)" onClick={() => navigate("/daily-reward")} />
        <Action title="🏦 Bank Details" sub="Manage Bank Info" bg="linear-gradient(135deg,#d97706,#ea580c)" onClick={() => navigate("/bank-details")} />
        <Action title="📊 Investment Plan" sub="View All Plans" bg="linear-gradient(135deg,#1d4ed8,#2563eb)" onClick={() => navigate("/investment-plan")} />
        <Action title="🔔 Notifications" sub="All Notifications" bg="linear-gradient(135deg,#e11d48,#f43f5e)" onClick={() => navigate("/notifications")} />
        <Action title="🎧 Support" sub="Need Help?" bg="linear-gradient(135deg,#059669,#16a34a)" onClick={() => navigate("/support")} />
      </div>

      <div style={styles.banner}>
        <div>
          <h1>Grow Your Money<br />Build Your Future</h1>
          <p>Invest Smart, Earn More</p>
          <button onClick={() => navigate("/save-money")}>
            Invest Now →
          </button>
        </div>
        <div style={styles.moneyIcon}>💰📈</div>
      </div>

      <div style={styles.trustRow}>
        <Trust icon="🔒" title="100% Secure" sub="Your money is safe" />
        <Trust icon="⚡" title="Fast Payout" sub="Quick withdrawals" />
        <Trust icon="🛡️" title="Trusted Platform" sub="Trusted by users" />
        <Trust icon="💬" title="24/7 Support" sub="We are here" />
      </div>

      <div style={styles.about} onClick={() => navigate("/about-company")}>
        🏢 About Save Money
      </div>

      <h2 style={styles.help}>HELP OTHER FOR EARN</h2>

      <footer style={styles.footer}>
        <h3>Save Money</h3>
        <p>Privacy Policy &nbsp; Terms &nbsp; Refund &nbsp; Risk Disclosure</p>
        <small>© 2026 Save Money. All Rights Reserved.</small>
      </footer>

      <div style={styles.quickRow}>
        <button onClick={() => navigate("/support")}>📞 CONTACT</button>
        <button onClick={() => navigate("/wallet")}>💰 WALLET</button>
        <button onClick={() => navigate("/refer")}>👥 TEAM</button>
      </div>

      <div style={styles.bottomNav}>
        <Nav icon="🏠" title="Home" active onClick={() => navigate("/home")} />
        <Nav icon="📈" title="Investment" onClick={() => navigate("/my-investment")} />
        <Nav icon="👛" title="Wallet" onClick={() => navigate("/wallet")} />
        <Nav icon="👥" title="Refer" onClick={() => navigate("/refer")} />
        <Nav icon="👤" title="Profile" onClick={() => navigate("/profile")} />
      </div>

    </div>
  );
}

function Stat({ title, value, icon, bg }) {
  return (
    <div style={{ ...styles.statCard, background: bg }}>
      <div>{icon}</div>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Action({ title, sub, bg, onClick }) {
  return (
    <button style={{ ...styles.actionCard, background: bg }} onClick={onClick}>
      <h3>{title}</h3>
      <p>{sub}</p>
    </button>
  );
}

function SectionTitle({ title, color }) {
  return (
    <div style={styles.sectionTitle}>
      <span></span>
      <h2 style={{ color }}>{title}</h2>
      <span></span>
    </div>
  );
}

function Trust({ icon, title, sub }) {
  return (
    <div style={styles.trustCard}>
      <div>{icon}</div>
      <b>{title}</b>
      <small>{sub}</small>
    </div>
  );
}

function Nav({ icon, title, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navBtn,
        background: active ? "#1e3a8a" : "transparent"
      }}
    >
      <span>{icon}</span>
      <small>{title}</small>
    </button>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#020617,#020617,#06162f)",
    color: "white",
    padding: "16px",
    paddingBottom: "125px",
    fontFamily: "Arial"
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },

  menu: {
    background: "transparent",
    color: "white",
    border: "none",
    fontSize: "26px"
  },

  bell: {
    position: "relative",
    fontSize: "24px",
    cursor: "pointer"
  },

  badge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    background: "#e11d48",
    padding: "3px 7px",
    borderRadius: "50%",
    fontSize: "11px"
  },

  heroCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background:
      "radial-gradient(circle at right,#22c55e,#064e3b,#0f172a)",
    borderRadius: "22px",
    padding: "18px",
    border: "1px solid #10b981",
    boxShadow: "0 0 30px rgba(34,197,94,0.25)"
  },

  profileCircle: {
    width: "78px",
    height: "78px",
    borderRadius: "50%",
    background: "#e5e7eb",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "45px",
    border: "3px solid #bae6fd"
  },

  welcome: {
    margin: 0,
    fontWeight: "bold"
  },

  userName: {
    margin: "5px 0",
    fontSize: "28px"
  },

  tagline: {
    margin: 0,
    color: "#d1fae5"
  },

  walletMini: {
    background: "rgba(34,197,94,0.35)",
    padding: "14px",
    borderRadius: "16px",
    minWidth: "115px"
  },

  updateBox: {
    background: "#111827",
    marginTop: "14px",
    padding: "16px",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "18px"
  },

  statCard: {
    padding: "17px",
    borderRadius: "16px",
    minHeight: "105px",
    boxShadow: "0 0 15px rgba(0,0,0,0.35)"
  },

  sectionTitle: {
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },

  actionGrid: {
    background: "rgba(15,23,42,0.95)",
    border: "1px solid #1e3a8a",
    borderRadius: "18px",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },

  actionCard: {
    border: "none",
    color: "white",
    borderRadius: "16px",
    padding: "18px 10px",
    minHeight: "95px",
    fontWeight: "bold",
    boxShadow: "0 0 18px rgba(0,0,0,0.3)"
  },

  banner: {
    marginTop: "18px",
    background: "linear-gradient(135deg,#4c1d95,#7e22ce)",
    borderRadius: "20px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  moneyIcon: {
    fontSize: "55px"
  },

  trustRow: {
    marginTop: "15px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },

  trustCard: {
    background: "#0f172a",
    borderRadius: "14px",
    padding: "13px",
    border: "1px solid #1e40af",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },

  about: {
    marginTop: "18px",
    background: "linear-gradient(135deg,#0891b2,#0f766e)",
    padding: "16px",
    textAlign: "center",
    borderRadius: "12px",
    fontWeight: "bold"
  },

  help: {
    color: "#22c55e",
    textAlign: "center",
    marginTop: "20px"
  },

  footer: {
    textAlign: "center",
    color: "#38bdf8",
    padding: "15px"
  },

  quickRow: {
    position: "fixed",
    bottom: "63px",
    left: "0",
    right: "0",
    padding: "8px 14px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    background: "#020617"
  },

  bottomNav: {
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    height: "62px",
    background: "#020617",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    borderTop: "1px solid #1e3a8a"
  },

  navBtn: {
    color: "white",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  }
};