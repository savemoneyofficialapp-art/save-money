import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function Home() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";
  const localName = localStorage.getItem("name") || "User";

  const [user, setUser] = useState({});
  const [latestUpdate, setLatestUpdate] = useState("No new announcement");

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
      console.log("Home load error:", err);
    }
  };

  const name = user.name || localName || "User";

  const wallet = user.wallet || user.totalWallet || 0;
  const totalInvestment = user.totalInvestment || 0;
  const totalReturn = user.totalReturn || 0;
  const totalReferral = user.totalReferral || user.referralCount || 0;
  const totalWithdraw = user.totalWithdraw || 0;

  const go = (path) => {
    navigate(path);
  };

  return (
    <div style={styles.container}>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <button style={styles.menuBtn}>☰</button>

        <h2 style={styles.topTitle}>
          Welcome, {name}
        </h2>

        <div
          style={styles.bellBox}
          onClick={() => go("/notifications")}
        >
          🔔
          <span style={styles.bellBadge}>3</span>
        </div>
      </div>

      {/* HERO CARD */}
      <div style={styles.heroCard}>

        <div style={styles.avatarBox}>
          👤
        </div>

        <div style={styles.heroUser}>
          <p style={styles.welcomeBack}>
            Welcome Back 👋
          </p>

          <div style={styles.nameRow}>
            <h1 style={styles.userName}>
              {name}
            </h1>

            <span style={styles.vip}>
              VIP
            </span>
          </div>

          <p style={styles.slogan}>
            Save Money, Secure Future 💚
          </p>
        </div>

        <div style={styles.walletCard}>
          <p>Total Wallet</p>
          <h2>₹{Number(wallet).toFixed(2)}</h2>
          <div style={styles.walletIcon}>👛</div>
        </div>

      </div>

      {/* LATEST UPDATE */}
      <div style={styles.updateCard}>
        <div style={styles.updateLeft}>
          <span style={styles.updateIcon}>📢</span>

          <div>
            <h3>Latest Update</h3>
            <p>{latestUpdate}</p>
          </div>
        </div>

        <span style={styles.arrow}>›</span>
      </div>

      {/* STATS */}
      <div style={styles.statsGrid}>
        <StatCard
          title="Total Investment"
          value={`₹${Number(totalInvestment).toFixed(2)}`}
          icon="📈"
          bg={styles.statBlue}
        />

        <StatCard
          title="Total Return"
          value={`₹${Number(totalReturn).toFixed(2)}`}
          icon="📊"
          bg={styles.statGreen}
        />

        <StatCard
          title="Total Referral"
          value={totalReferral}
          icon="👥"
          bg={styles.statPurple}
        />

        <StatCard
          title="Total Withdraw"
          value={`₹${Number(totalWithdraw).toFixed(2)}`}
          icon="⬇️"
          bg={styles.statOrange}
        />
      </div>

      {/* MAIN ACTIONS */}
      <SectionTitle
        title="MAIN ACTIONS"
        color="#00c8ff"
      />

      <div style={styles.sectionBox}>
        <ActionBtn
          title="💰 INVEST NOW"
          sub="Start Investing"
          bg={styles.btnGreen}
          onClick={() => go("/save-money")}
        />

        <ActionBtn
          title="📈 My Investment"
          sub="View Details"
          bg={styles.btnBlue}
          onClick={() => go("/my-investment")}
        />

        <ActionBtn
          title="💵 Wallet"
          sub="Add & Manage"
          bg={styles.btnPurple}
          onClick={() => go("/wallet")}
        />

        <ActionBtn
          title="💸 Withdraw"
          sub="Request Payout"
          bg={styles.btnOrange}
          onClick={() => go("/withdraw")}
        />

        <ActionBtn
          title="👥 Refer & Earn"
          sub="Invite & Earn"
          bg={styles.btnPink}
          onClick={() => go("/refer")}
        />

        <ActionBtn
          title="🧾 Transactions"
          sub="All History"
          bg={styles.btnCyan}
          onClick={() => go("/transactions")}
        />
      </div>

      {/* MORE FEATURES */}
      <SectionTitle
        title="MORE FEATURES"
        color="#facc15"
      />

      <div style={styles.sectionBox}>
        <ActionBtn
          title="✅ KYC Verification"
          sub="Verify Your Account"
          bg={styles.btnSky}
          onClick={() => go("/kyc")}
        />

        <ActionBtn
          title="🎁 Referral Income"
          sub="Check Your Earnings"
          bg={styles.btnViolet}
          onClick={() => go("/referral-income")}
        />

        <ActionBtn
          title="🏦 Bank Details"
          sub="Manage Bank Info"
          bg={styles.btnGold}
          onClick={() => go("/bank-details")}
        />

        <ActionBtn
          title="📊 Investment Plan"
          sub="View All Plans"
          bg={styles.btnPlan}
          onClick={() => go("/investment-plan")}
        />

        <ActionBtn
          title="🔔 Notifications"
          sub="All Notifications"
          bg={styles.btnRed}
          onClick={() => go("/notifications")}
        />

        <ActionBtn
          title="🎧 Support"
          sub="Need Help?"
          bg={styles.btnSupport}
          onClick={() => go("/support")}
        />
      </div>

      {/* BANNER */}
      <div style={styles.banner}>
        <div>
          <h1>
            Grow Your Money
            <br />
            Build Your Future
          </h1>

          <p>Invest Smart, Earn More</p>

          <button onClick={() => go("/save-money")}>
            Invest Now →
          </button>
        </div>

        <div style={styles.bannerImg}>
          💰📈
        </div>
      </div>

      {/* TRUST CARDS */}
      <div style={styles.trustGrid}>
        <TrustCard icon="🔒" title="100% Secure" sub="Your money is safe" />
        <TrustCard icon="⚡" title="Fast Payout" sub="Quick withdrawals" />
        <TrustCard icon="🛡️" title="Trusted Platform" sub="Trusted by users" />
        <TrustCard icon="💬" title="24/7 Support" sub="We are here" />
      </div>

      {/* ABOUT */}
      <div
        style={styles.aboutBar}
        onClick={() => go("/about-company")}
      >
        🏢 About Save Money
      </div>

      <h2 style={styles.helpText}>
        HELP OTHER FOR EARN
      </h2>

      {/* FOOTER */}
      <div style={styles.footer}>
        <h3>Save Money</h3>

        <p>
          Privacy Policy &nbsp; Terms &nbsp; Refund &nbsp;
          Risk Disclosure &nbsp; AML & KYC &nbsp; Disclaimer
        </p>

        <small>
          © 2025 Save Money. All Rights Reserved.
        </small>
      </div>

      {/* QUICK BUTTONS */}
      <div style={styles.quickBtns}>
        <button onClick={() => go("/support")}>📞 CONTACT</button>
        <button onClick={() => go("/wallet")}>💰 WALLET</button>
        <button onClick={() => go("/refer")}>👥 TEAM</button>
      </div>

      {/* BOTTOM NAV */}
      <div style={styles.bottomNav}>
        <NavItem icon="🏠" title="Home" active onClick={() => go("/home")} />
        <NavItem icon="📈" title="Investment" onClick={() => go("/my-investment")} />
        <NavItem icon="👛" title="Wallet" onClick={() => go("/wallet")} />
        <NavItem icon="👥" title="Refer" onClick={() => go("/refer")} />
        <NavItem icon="👤" title="Profile" onClick={() => go("/profile")} />
      </div>

    </div>
  );
}

function StatCard({ title, value, icon, bg }) {
  return (
    <div style={{ ...styles.statCard, ...bg }}>
      <div style={styles.statIcon}>{icon}</div>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function ActionBtn({ title, sub, bg, onClick }) {
  return (
    <button
      style={{ ...styles.actionBtn, ...bg }}
      onClick={onClick}
    >
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

function TrustCard({ icon, title, sub }) {
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

function NavItem({ icon, title, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        background: active ? "#102a5c" : "transparent"
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
    background: "#020817",
    color: "white",
    padding: "0 22px 160px",
    fontFamily: "Arial, sans-serif"
  },

  topBar: {
    height: "70px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  menuBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "34px"
  },

  topTitle: {
    fontSize: "24px",
    fontWeight: "800"
  },

  bellBox: {
    position: "relative",
    fontSize: "28px"
  },

  bellBadge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    background: "#e11d48",
    width: "23px",
    height: "23px",
    borderRadius: "50%",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold"
  },

  heroCard: {
    height: "180px",
    borderRadius: "22px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    background:
      "radial-gradient(circle at 80% 10%, #16a34a 0%, transparent 30%), linear-gradient(135deg,#061426,#052b3a,#08b85e)",
    border: "1px solid rgba(34,197,94,.45)",
    boxShadow: "0 0 30px rgba(34,197,94,.18)",
    gap: "28px"
  },

  avatarBox: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "#253244",
    border: "3px solid #dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "68px"
  },

  heroUser: {
    flex: 1
  },

  welcomeBack: {
    fontSize: "19px",
    fontWeight: "700",
    margin: 0
  },

  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  userName: {
    fontSize: "38px",
    margin: "8px 0",
    fontWeight: "900"
  },

  vip: {
    background: "#6d28d9",
    padding: "7px 12px",
    borderRadius: "9px",
    fontWeight: "800"
  },

  slogan: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700"
  },

  walletCard: {
    width: "230px",
    height: "110px",
    borderRadius: "18px",
    padding: "20px",
    background: "linear-gradient(135deg,#16a34a,#05c46b)",
    boxShadow: "0 12px 25px rgba(0,0,0,.25)"
  },

  walletIcon: {
    fontSize: "42px",
    float: "right"
  },

  updateCard: {
    height: "75px",
    marginTop: "18px",
    borderRadius: "17px",
    padding: "18px 28px",
    background: "linear-gradient(135deg,#111827,#0b1220)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  updateLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px"
  },

  updateIcon: {
    fontSize: "30px"
  },

  arrow: {
    fontSize: "46px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginTop: "22px"
  },

  statCard: {
    height: "145px",
    borderRadius: "17px",
    padding: "22px",
    boxShadow: "0 10px 25px rgba(0,0,0,.35)"
  },

  statBlue: { background: "linear-gradient(135deg,#1337d8,#061b6b)" },
  statGreen: { background: "linear-gradient(135deg,#047857,#064e3b)" },
  statPurple: { background: "linear-gradient(135deg,#6b21a8,#3b0764)" },
  statOrange: { background: "linear-gradient(135deg,#ea580c,#9a3412)" },

  statIcon: {
    fontSize: "34px"
  },

  sectionTitle: {
    margin: "22px 0 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px"
  },

  sectionBox: {
    borderRadius: "20px",
    background: "linear-gradient(180deg,#081a35,#06101f)",
    border: "1px solid #123c70",
    padding: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px"
  },

  actionBtn: {
    height: "110px",
    border: "none",
    borderRadius: "16px",
    color: "white",
    fontWeight: "800",
    textAlign: "center",
    boxShadow: "0 10px 22px rgba(0,0,0,.3)"
  },

  btnGreen: { background: "linear-gradient(135deg,#16a34a,#05c46b)" },
  btnBlue: { background: "linear-gradient(135deg,#2563eb,#0284c7)" },
  btnPurple: { background: "linear-gradient(135deg,#7c3aed,#c026d3)" },
  btnOrange: { background: "linear-gradient(135deg,#ea580c,#f59e0b)" },
  btnPink: { background: "linear-gradient(135deg,#db2777,#ec4899)" },
  btnCyan: { background: "linear-gradient(135deg,#0891b2,#14b8a6)" },
  btnSky: { background: "linear-gradient(135deg,#06b6d4,#0284c7)" },
  btnViolet: { background: "linear-gradient(135deg,#6d28d9,#a78bfa)" },
  btnGold: { background: "linear-gradient(135deg,#c2410c,#f59e0b)" },
  btnPlan: { background: "linear-gradient(135deg,#2563eb,#0ea5e9)" },
  btnRed: { background: "linear-gradient(135deg,#be123c,#f43f5e)" },
  btnSupport: { background: "linear-gradient(135deg,#059669,#22c55e)" },

  banner: {
    marginTop: "24px",
    height: "170px",
    borderRadius: "20px",
    padding: "28px",
    background: "linear-gradient(135deg,#4c1d95,#7e22ce,#6d28d9)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  bannerImg: {
    fontSize: "86px"
  },

  trustGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "14px",
    marginTop: "18px",
    background: "#07152b",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #123c70"
  },

  trustCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  aboutBar: {
    margin: "26px -22px 0",
    height: "54px",
    background: "linear-gradient(90deg,#0891b2,#14b8a6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800"
  },

  helpText: {
    textAlign: "center",
    color: "#22c55e",
    fontSize: "26px",
    fontWeight: "900",
    marginTop: "28px"
  },

  footer: {
    textAlign: "center",
    padding: "25px",
    borderTop: "1px solid #0f2b52",
    color: "#38bdf8"
  },

  quickBtns: {
    position: "fixed",
    bottom: "70px",
    left: "18px",
    right: "18px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    zIndex: 1000
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70px",
    background: "#020817",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    borderTop: "1px solid #0f2b52",
    zIndex: 999
  },

  navItem: {
    border: "none",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  }
};