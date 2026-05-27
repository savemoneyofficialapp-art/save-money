import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function Home() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";
  const localName = localStorage.getItem("name") || "User";

  const [user, setUser] = useState({});

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setUser(data || {});
    } catch (err) {
      console.log("Home error:", err);
    }
  };

  const fileUrl = (file) => {
    if (!file) return "";
    if (file.startsWith("http")) return file;
    return `${API}/uploads/${file}`;
  };

  const name = user.name || localName;
  const photo = fileUrl(user.photo || user.profilePhoto || "");

  const wallet = user.wallet || 0;
  const totalInvestment = user.totalInvestment || 0;
  const totalReturn = user.totalReturn || 0;
  const totalReferral = user.totalReferral || 0;
  const totalWithdraw = user.totalWithdraw || 0;

  const go = (path) => navigate(path);

  return (
    <div style={styles.container}>

      <div style={styles.topBar}>
        <button style={styles.menuBtn}>☰</button>

        <h2 style={styles.topTitle}>Welcome, {name}</h2>

        <div style={styles.bellBox} onClick={() => go("/notifications")}>
          🔔
          <span style={styles.bellBadge}>3</span>
        </div>
      </div>

      <div style={styles.heroCard}>
        <div style={styles.avatarBox}>
          {photo ? (
            <img src={photo} alt="user" style={styles.avatarImg} />
          ) : (
            "👤"
          )}
        </div>

        <div style={styles.heroUser}>
          <p style={styles.welcomeBack}>Welcome Back 👋</p>

          <div style={styles.nameRow}>
            <h1 style={styles.userName}>{name}</h1>
            {user.kycStatus === "approved" && <span style={styles.blueTick}>✔</span>}
          </div>

          <p style={styles.slogan}>Save Money, Secure Future 💚</p>
        </div>

        <div style={styles.walletCard}>
          <p>Total Wallet</p>
          <h2>₹{Number(wallet).toFixed(2)}</h2>
          <span>👛</span>
        </div>
      </div>

      <div style={styles.updateCard}>
        <div style={styles.updateLeft}>
          <span style={styles.updateIcon}>📢</span>
          <div>
            <h3>Latest Update</h3>
            <p>No new announcement</p>
          </div>
        </div>
        <span style={styles.arrow}>›</span>
      </div>

      <div style={styles.statsGrid}>
        <Stat title="Total Investment" value={`₹${totalInvestment}`} icon="📈" bg={styles.statBlue} />
        <Stat title="Total Return" value={`₹${totalReturn}`} icon="📊" bg={styles.statGreen} />
        <Stat title="Total Referral" value={totalReferral} icon="👥" bg={styles.statPurple} />
        <Stat title="Total Withdraw" value={`₹${totalWithdraw}`} icon="⬇️" bg={styles.statOrange} />
      </div>

      <SectionTitle title="MAIN ACTIONS" color="#38bdf8" />

      <div style={styles.sectionBox}>
        <Action title="💰 INVEST NOW" sub="Start Investing" bg={styles.btnGreen} onClick={() => go("/save-money")} />
        <Action title="📈 My Investment" sub="View Details" bg={styles.btnBlue} onClick={() => go("/my-investment")} />
        <Action title="👛 Wallet" sub="Add & Manage" bg={styles.btnPurple} onClick={() => go("/wallet")} />
        <Action title="💸 Withdraw" sub="Request Payout" bg={styles.btnOrange} onClick={() => go("/withdraw")} />
        <Action title="👥 Refer & Earn" sub="Invite & Earn" bg={styles.btnPink} onClick={() => go("/refer")} />
        <Action title="🧾 Transactions" sub="All History" bg={styles.btnCyan} onClick={() => go("/transactions")} />
      </div>

      <SectionTitle title="MORE FEATURES" color="#facc15" />

      <div style={styles.sectionBox}>
        <Action title="✅ KYC Verification" sub="Verify Account" bg={styles.btnSky} onClick={() => go("/kyc")} />
        <Action title="🎁 Daily Reward" sub="Claim Reward" bg={styles.btnViolet} onClick={() => go("/daily-reward")} />
        <Action title="🏦 Bank Details" sub="Manage Bank" bg={styles.btnGold} onClick={() => go("/bank-details")} />
        <Action title="📊 Investment Plan" sub="View Plans" bg={styles.btnPlan} onClick={() => go("/investment-plan")} />
        <Action title="🔔 Notifications" sub="All Alerts" bg={styles.btnRed} onClick={() => go("/notifications")} />
        <Action title="🎧 Support" sub="Need Help?" bg={styles.btnSupport} onClick={() => go("/support")} />
      </div>

      <div style={styles.banner}>
        <div>
          <h1>Grow Your Money<br />Build Your Future</h1>
          <p>Invest Smart, Earn More</p>
          <button onClick={() => go("/save-money")}>Invest Now →</button>
        </div>
        <div style={styles.bannerIcon}>💰📈</div>
      </div>

      <div style={styles.trustGrid}>
        <Trust icon="🔒" title="100% Secure" sub="Your money is safe" />
        <Trust icon="⚡" title="Fast Payout" sub="Quick withdrawals" />
        <Trust icon="🛡️" title="Trusted Platform" sub="Trusted by users" />
        <Trust icon="💬" title="24/7 Support" sub="We are here" />
      </div>

      <div style={styles.aboutBar} onClick={() => go("/about")}>
        🏢 About Save Money
      </div>

      <h2 style={styles.helpText}>HELP OTHER FOR EARN</h2>

      <div style={styles.footer}>
        <h3>Save Money</h3>

        <div style={styles.footerLinks}>
          <span onClick={() => go("/legal/privacy")}>Privacy Policy</span>
          <span onClick={() => go("/legal/terms")}>Terms</span>
          <span onClick={() => go("/legal/refund")}>Refund</span>
          <span onClick={() => go("/legal/risk")}>Risk Disclosure</span>
          <span onClick={() => go("/legal/aml")}>AML & KYC</span>
          <span onClick={() => go("/legal/disclaimer")}>Disclaimer</span>
        </div>

        <small>© 2026 Save Money. All Rights Reserved.</small>
      </div>

      <div style={styles.quickBtns}>
        <button onClick={() => go("/support")}>📞 CONTACT</button>
        <button onClick={() => go("/wallet")}>💰 WALLET</button>
        <button onClick={() => go("/refer")}>👥 TEAM</button>
      </div>

      <div style={styles.bottomNav}>
        <Nav icon="🏠" title="Home" active onClick={() => go("/home")} />
        <Nav icon="📈" title="Investment" onClick={() => go("/my-investment")} />
        <Nav icon="👛" title="Wallet" onClick={() => go("/wallet")} />
        <Nav icon="👥" title="Refer" onClick={() => go("/refer")} />
        <Nav icon="👤" title="Profile" onClick={() => go("/profile")} />
      </div>

    </div>
  );
}

function Stat({ title, value, icon, bg }) {
  return (
    <div style={{ ...styles.statCard, ...bg }}>
      <div style={styles.statIcon}>{icon}</div>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Action({ title, sub, bg, onClick }) {
  return (
    <button style={{ ...styles.actionBtn, ...bg }} onClick={onClick}>
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
      <span>{icon}</span>
      <div>
        <b>{title}</b>
        <p>{sub}</p>
      </div>
    </div>
  );
}

function Nav({ icon, title, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        color: active ? "#ffffff" : "#94a3b8",
        background: active ? "#0f2a5c" : "transparent"
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
    background: "linear-gradient(180deg,#020617,#020b20,#031431)",
    color: "white",
    padding: "0 16px 155px",
    fontFamily: "Arial, sans-serif"
  },

  topBar: {
    height: "62px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  menuBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "28px"
  },

  topTitle: {
    fontSize: "20px",
    fontWeight: "800",
    margin: 0
  },

  bellBox: {
    position: "relative",
    fontSize: "24px"
  },

  bellBadge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    background: "#ef174e",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    fontSize: "11px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  heroCard: {
    borderRadius: "23px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background:
      "radial-gradient(circle at 90% 10%,#22ff88 0%,transparent 32%),linear-gradient(135deg,#03142b,#053451,#0fc96a)",
    border: "1px solid rgba(34,255,136,.55)",
    boxShadow: "0 0 32px rgba(34,255,136,.25)"
  },

  avatarBox: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    border: "3px solid #dbeafe",
    background: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "45px",
    overflow: "hidden"
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  heroUser: {
    flex: 1
  },

  welcomeBack: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700"
  },

  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  userName: {
    margin: "4px 0",
    fontSize: "25px",
    fontWeight: "900"
  },

  blueTick: {
    background: "#2563eb",
    borderRadius: "50%",
    padding: "2px 7px",
    fontSize: "12px"
  },

  slogan: {
    margin: 0,
    fontSize: "12px",
    color: "#dcfce7"
  },

  walletCard: {
    minWidth: "105px",
    borderRadius: "17px",
    padding: "12px",
    background: "linear-gradient(135deg,#09e66d,#00b96b)",
    boxShadow: "0 10px 24px rgba(0,0,0,.35)"
  },

  walletCard: {
    minWidth: "105px",
    borderRadius: "17px",
    padding: "12px",
    background: "linear-gradient(135deg,#16ff75,#00b96b)",
    boxShadow: "0 10px 24px rgba(0,0,0,.35)"
  },

  updateCard: {
    marginTop: "14px",
    borderRadius: "18px",
    padding: "15px",
    background: "linear-gradient(135deg,#1a2133,#071225)",
    border: "1px solid #31527a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 0 16px rgba(56,189,248,.18)"
  },

  updateLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  updateIcon: {
    fontSize: "30px"
  },

  arrow: {
    fontSize: "38px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "16px"
  },

  statCard: {
    minHeight: "116px",
    borderRadius: "18px",
    padding: "15px",
    boxShadow: "0 8px 22px rgba(0,0,0,.35)"
  },

  statBlue: { background: "linear-gradient(135deg,#2457ff,#061b91)" },
  statGreen: { background: "linear-gradient(135deg,#00e987,#006644)" },
  statPurple: { background: "linear-gradient(135deg,#9b35ff,#4c057a)" },
  statOrange: { background: "linear-gradient(135deg,#ff8a00,#c2410c)" },

  statIcon: {
    fontSize: "28px"
  },

  sectionTitle: {
    margin: "24px 0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "11px"
  },

  sectionTitle: {
    margin: "24px 0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "11px"
  },

  sectionBox: {
    background: "linear-gradient(180deg,#061936,#07101e)",
    border: "1px solid #1e40af",
    borderRadius: "22px",
    padding: "13px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    boxShadow: "inset 0 0 25px rgba(59,130,246,.15)"
  },

  actionBtn: {
    border: "none",
    borderRadius: "18px",
    minHeight: "94px",
    color: "white",
    fontWeight: "800",
    textAlign: "center",
    padding: "12px",
    boxShadow: "0 9px 20px rgba(0,0,0,.35)"
  },

  btnGreen: { background: "linear-gradient(135deg,#00ff75,#008f45)" },
  btnBlue: { background: "linear-gradient(135deg,#2f7bff,#0047ff)" },
  btnPurple: { background: "linear-gradient(135deg,#8b5cff,#e000ff)" },
  btnOrange: { background: "linear-gradient(135deg,#ff7a00,#ffc400)" },
  btnPink: { background: "linear-gradient(135deg,#ff007a,#ff37d2)" },
  btnCyan: { background: "linear-gradient(135deg,#00c8ff,#00ffd5)" },
  btnSky: { background: "linear-gradient(135deg,#00d9ff,#0077ff)" },
  btnViolet: { background: "linear-gradient(135deg,#7c3aed,#c084fc)" },
  btnGold: { background: "linear-gradient(135deg,#ff8c00,#ffca28)" },
  btnPlan: { background: "linear-gradient(135deg,#2979ff,#00b0ff)" },
  btnRed: { background: "linear-gradient(135deg,#ff1744,#ff5c8d)" },
  btnSupport: { background: "linear-gradient(135deg,#00e676,#00c853)" },

  banner: {
    marginTop: "18px",
    borderRadius: "22px",
    padding: "20px",
    background: "linear-gradient(135deg,#4c1d95,#8b00ff,#9d00ff)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  bannerIcon: {
    fontSize: "55px"
  },

  trustGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "14px",
    background: "#071831",
    borderRadius: "20px",
    padding: "12px",
    border: "1px solid #1e40af"
  },

  trustCard: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "13px"
  },

  aboutBar: {
    margin: "20px -16px 0",
    padding: "15px",
    background: "linear-gradient(90deg,#06b6d4,#14f1c4)",
    textAlign: "center",
    fontWeight: "900"
  },

  helpText: {
    textAlign: "center",
    color: "#22ff73",
    fontSize: "22px",
    fontWeight: "900",
    marginTop: "22px"
  },

  footer: {
    textAlign: "center",
    padding: "24px 5px"
  },

  footerLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
    color: "#38bdf8",
    marginBottom: "12px",
    cursor: "pointer",
    fontSize: "12px"
  },

  quickBtns: {
    position: "fixed",
    bottom: "66px",
    left: "8px",
    right: "8px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    zIndex: 999
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "62px",
    background: "#020817",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    borderTop: "1px solid #1e40af",
    zIndex: 999
  },

  navItem: {
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  }
};