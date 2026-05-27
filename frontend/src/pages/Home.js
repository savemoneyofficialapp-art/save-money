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
    background:
      "linear-gradient(180deg,#000814,#020b22,#03112f)",
    color: "white",
    paddingBottom: "170px",
    overflowX: "hidden"
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 18px 10px"
  },

  menuBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "34px"
  },

  topTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "700"
  },

  bellBox: {
    position: "relative",
    fontSize: "28px",
    cursor: "pointer"
  },

  bellBadge: {
    position: "absolute",
    top: "-7px",
    right: "-7px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#ff1744",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "11px",
    fontWeight: "bold"
  },

  heroCard: {
    margin: "15px",
    borderRadius: "28px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background:
      "linear-gradient(135deg,#021526,#042e4b,#10b85b)",
    boxShadow:
      "0 0 35px rgba(0,255,170,0.18)",
    border: "1px solid rgba(0,255,170,0.18)",
    position: "relative",
    overflow: "hidden"
  },

  avatarBox: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "52px",
    background: "#394457"
  },

  heroUser: {
    flex: 1,
    marginLeft: "18px"
  },

  welcomeBack: {
    margin: 0,
    fontSize: "20px",
    color: "#ffffff"
  },

  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "6px"
  },

  userName: {
    margin: 0,
    fontSize: "48px",
    fontWeight: "800"
  },

  vip: {
    background:
      "linear-gradient(135deg,#5b2cff,#8e44ff)",
    padding: "7px 14px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "14px"
  },

  slogan: {
    marginTop: "8px",
    color: "#d4ffe9",
    fontSize: "18px"
  },

  walletCard: {
    width: "210px",
    borderRadius: "24px",
    padding: "20px",
    background:
      "linear-gradient(135deg,#12b85f,#19d978)",
    color: "white",
    boxShadow:
      "0 0 20px rgba(0,255,100,0.3)"
  },

  walletIcon: {
    fontSize: "48px",
    marginTop: "10px"
  },

  updateCard: {
    margin: "15px",
    background:
      "linear-gradient(90deg,#08111d,#111827)",
    borderRadius: "26px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #1d3557"
  },

  updateLeft: {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },

  updateIcon: {
    fontSize: "38px",
    color: "#ffc107"
  },

  arrow: {
    fontSize: "45px",
    color: "#cfd8dc"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    padding: "0 15px"
  },

  statCard: {
    borderRadius: "24px",
    padding: "22px",
    minHeight: "170px",
    position: "relative",
    overflow: "hidden",
    boxShadow:
      "0 0 22px rgba(0,0,0,0.35)"
  },

  statBlue: {
    background:
      "linear-gradient(135deg,#1736ff,#071b7a)"
  },

  statGreen: {
    background:
      "linear-gradient(135deg,#0aa06e,#014737)"
  },

  statPurple: {
    background:
      "linear-gradient(135deg,#742bff,#3b0764)"
  },

  statOrange: {
    background:
      "linear-gradient(135deg,#ff7b00,#9a3412)"
  },

  statIcon: {
    fontSize: "42px",
    marginBottom: "15px"
  },

  sectionTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    marginTop: "35px",
    marginBottom: "20px"
  },

  sectionBox: {
    margin: "0 15px",
    background:
      "linear-gradient(180deg,#06142d,#071223)",
    borderRadius: "30px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    border: "1px solid #163c75"
  },

  actionBtn: {
    border: "none",
    borderRadius: "24px",
    padding: "22px",
    minHeight: "140px",
    textAlign: "left",
    color: "white",
    boxShadow:
      "0 0 22px rgba(0,0,0,0.25)"
  },

  btnGreen: {
    background:
      "linear-gradient(135deg,#00c853,#007e33)"
  },

  btnBlue: {
    background:
      "linear-gradient(135deg,#1e88ff,#004fc4)"
  },

  btnPurple: {
    background:
      "linear-gradient(135deg,#7c3aed,#d946ef)"
  },

  btnOrange: {
    background:
      "linear-gradient(135deg,#ff7b00,#ffb300)"
  },

  btnPink: {
    background:
      "linear-gradient(135deg,#ff006e,#d000ff)"
  },

  btnCyan: {
    background:
      "linear-gradient(135deg,#00acc1,#00e5ff)"
  },

  btnSky: {
    background:
      "linear-gradient(135deg,#00b8d4,#0288d1)"
  },

  btnViolet: {
    background:
      "linear-gradient(135deg,#7b2cff,#b388ff)"
  },

  btnGold: {
    background:
      "linear-gradient(135deg,#ff9800,#ef6c00)"
  },

  btnPlan: {
    background:
      "linear-gradient(135deg,#2979ff,#304ffe)"
  },

  btnRed: {
    background:
      "linear-gradient(135deg,#ff1744,#ff5252)"
  },

  btnSupport: {
    background:
      "linear-gradient(135deg,#00c853,#00e676)"
  },

  banner: {
    margin: "30px 15px 0",
    borderRadius: "30px",
    padding: "30px",
    background:
      "linear-gradient(135deg,#3f0d99,#7b2cff,#8e24aa)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden"
  },

  bannerImg: {
    fontSize: "100px"
  },

  trustGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    padding: "15px",
    marginTop: "18px"
  },

  trustCard: {
    background:
      "linear-gradient(135deg,#06142d,#08111d)",
    borderRadius: "22px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    border: "1px solid #163c75"
  },

  aboutBar: {
    marginTop: "20px",
    background:
      "linear-gradient(90deg,#00acc1,#26c6da)",
    padding: "16px",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "20px"
  },

  helpText: {
    textAlign: "center",
    color: "#00ff66",
    fontSize: "42px",
    marginTop: "35px",
    fontWeight: "900"
  },

  footer: {
    textAlign: "center",
    padding: "35px 20px"
  },

  quickBtns: {
    position: "fixed",
    bottom: "78px",
    left: 0,
    right: 0,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    padding: "0 12px",
    zIndex: 999
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "72px",
    background: "#020817",
    borderTop: "1px solid #163c75",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    zIndex: 999
  },

  navItem: {
    border: "none",
    background: "transparent",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "13px"
  }

};