import { useEffect, useMemo, useState } from "react";
import { API } from "../config";

export default function Wallet() {
  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const [wallet, setWallet] = useState({
    walletId: "",
    name: "",
    avatar: "",
    balance: 0,
    referral: 0,
    performance: 0,
    team: 0,
    royalty: 0
  });

  const [history, setHistory] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [confirmTransferOpen, setConfirmTransferOpen] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);


  const [historyFilter, setHistoryFilter] = useState("all");
const [showAllHistory, setShowAllHistory] = useState(false);


  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/wallet-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        setWallet({
          walletId: data.walletId || data.user?.walletId || "N/A",
          name: data.name || data.user?.name || "User",
avatar:
  data.avatar ||
  data.user?.photo ||
  data.user?.photoImage ||
  "",
photo: data.user?.photo || "",
photoImage: data.user?.photoImage || "",          balance: Number(data.balance || 0),
          referral: Number(data.referral || 0),
          performance: Number(data.performance || 0),
          team: Number(data.team || 0),
          royalty: Number(data.royalty || 0)
        });

        setHistory(Array.isArray(data.history) ? data.history : []);
      }
    } catch (err) {
      console.log("WALLET LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const money = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN")}.00`;
  };

  const shortMoney = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN")}`;
  };

  const visibleBalance = showBalance ? money(wallet.balance) : "₹ ••••••••";

  const copyWalletId = async () => {
    try {
      await navigator.clipboard.writeText(wallet.walletId);
      alert("Wallet ID copied");
    } catch {
      alert("Copy failed");
    }
  };

  const openAddCash = () => {
    setAddAmount("");
    setAddOpen(true);
  };

 const startUpiPayment = async () => {
  if (!addAmount || Number(addAmount) <= 0) {
    return alert("Enter valid amount");
  }

  try {
    const orderRes = await fetch(`${API}/create-razorpay-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: token || ""
      },
      body: JSON.stringify({
        email,
        amount: Number(addAmount)
      })
    });

    const orderData = await orderRes.json();

    if (!orderData.success) {
      return alert(orderData.msg || "Order create failed");
    }

    const options = {
      key: orderData.key,
      amount: orderData.order.amount,
      currency: "INR",
      name: "Save Money",
      description: "Wallet Add Cash",
      order_id: orderData.order.id,

      handler: async function (response) {
        const verifyRes = await fetch(`${API}/verify-razorpay-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: token || ""
          },
          body: JSON.stringify({
            email,
            amount: Number(addAmount),
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        });

        const verifyData = await verifyRes.json();

        alert(verifyData.msg);

        if (verifyData.success) {
          setAddOpen(false);
          setAddAmount("");
          loadWallet();
        }
      },

      prefill: {
        name: wallet.name,
        email
      },

      theme: {
        color: "#7c3aed"
      }
    };

    const razor = new window.Razorpay(options);
    razor.open();
  } catch (err) {
    console.log("RAZORPAY FRONTEND ERROR:", err);
    alert("Payment failed");
  }
};

  const checkReceiver = async () => {
    if (!receiverWalletId.trim()) {
      return alert("Enter receiver wallet ID");
    }

    if (!transferAmount || Number(transferAmount) <= 0) {
      return alert("Enter valid amount");
    }

    try {
      const res = await fetch(`${API}/wallet-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          walletId: receiverWalletId.trim()
        })
      });

      const data = await res.json();

      if (!data.success) {
        return alert(data.msg || "Receiver not found");
      }

      setReceiverInfo(data.user);
      setConfirmTransferOpen(true);
    } catch (err) {
      console.log("RECEIVER CHECK ERROR:", err);
      alert("Receiver check failed");
    }
  };

  const sendTransfer = async () => {
    try {
      const res = await fetch(`${API}/wallet-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({
          senderEmail: email,
          receiverWalletId: receiverWalletId.trim(),
          amount: Number(transferAmount)
        })
      });

      const data = await res.json();

      alert(data.msg || "Transfer completed");

      if (data.success) {
        setReceiverWalletId("");
        setTransferAmount("");
        setReceiverInfo(null);
        setConfirmTransferOpen(false);
        loadWallet();
      }
    } catch (err) {
      console.log("TRANSFER ERROR:", err);
      alert("Transfer failed");
    }
  };

  const inviteLink = useMemo(() => {
    const ref = wallet.walletId || email;
    return `${window.location.origin}/register?ref=${encodeURIComponent(ref)}`;
  }, [wallet.walletId, email]);

  const openInvite = async () => {
    const text = `Join Save Money and start your saving journey.\n${inviteLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Save Money",
          text,
          url: inviteLink
        });
      } catch {
        setShareOpen(true);
      }
    } else {
      setShareOpen(true);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Referral link copied");
    } catch {
      alert("Copy failed");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>👛</div>
          <h2>Loading Wallet...</h2>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter((item) => {
  if (historyFilter === "all") return true;
  return String(item.type).toLowerCase() === historyFilter;
});

const visibleHistory = showAllHistory
  ? filteredHistory
  : filteredHistory.slice(0, 5);

  return (
    <div style={styles.page}>
      <div style={styles.app}>

        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>My Wallet</h1>
            <div style={styles.titleWave}></div>
            <p style={styles.pageSub}>
              Manage your balance, track transactions and grow more.
            </p>
          </div>

         <button
  style={styles.notifyBtn}
  onClick={() => window.location.href = "/notifications"}
>
  🔔
  <span style={styles.notifyCount}></span>
</button>

<div style={styles.avatar}>
  {wallet.avatar || wallet.photo || wallet.photoImage ? (
    <img
      src={
        wallet.avatar ||
        wallet.photo ||
        `${API}/${wallet.photoImage}`
      }
      alt="user"
      style={styles.avatarImg}
    />
  ) : (
    "👨‍💼"
  )}
</div>
        </header>

        <section style={styles.walletHero}>
          <div style={styles.walletLeft}>
            <p style={styles.heroLabel}>WALLET ID</p>

            <h2 style={styles.walletId}>
              {wallet.walletId}
              <button onClick={copyWalletId}>©☑️</button>
            </h2>

            <div style={styles.dashedLine}></div>

            <p style={styles.heroLabel}>AVAILABLE BALANCE</p>

            <h1 style={styles.balanceText}>
              {visibleBalance}
            </h1>

            <div style={styles.heroActions}>
              <button style={styles.addCashBtn} onClick={openAddCash}>
                <b>＋</b> Add Cash
              </button>

              <button
                style={styles.withdrawBtn}
                onClick={() => setWithdrawOpen(true)}
              >
                💳 Withdraw
              </button>
            </div>
          </div>

          <button
            style={styles.eyeBtn}
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? "👁" : "🙈"}
          </button>

          <WalletIllustration />
        </section>

        <section style={styles.incomePanel}>
          <IncomeCard
            icon="👥"
            title="REFERRAL"
            amount={wallet.referral}
            color="#10b981"
          />

          <IncomeCard
            icon="📈"
            title="PERFORMANCE"
            amount={wallet.performance}
            color="#f59e0b"
          />

          <IncomeCard
            icon="👥"
            title="TEAM"
            amount={wallet.team}
            color="#2563eb"
          />

          <IncomeCard
            icon="👑"
            title="ROYALTY"
            amount={wallet.royalty}
            color="#9333ea"
          />

          <IncomeCard
            icon="👛"
            title="BALANCE"
            amount={wallet.balance}
            color="#14b8a6"
          />
        </section>
{/* Wallet Transfer + Invite */}

        <section style={styles.middleGrid}>

          <div style={styles.transferCard}>

            <div style={styles.transferIcon}>
              ✈️
            </div>

            <h2 style={styles.transferTitle}>
              Wallet Transfer
            </h2>

            <p style={styles.transferSub}>
              Send money to another wallet instantly
            </p>

            <label style={styles.label}>
              Receiver Wallet ID
            </label>

            <div style={styles.inputWrap}>
              <input
                style={styles.transferInput}
                value={receiverWalletId}
                onChange={(e)=>
                  setReceiverWalletId(e.target.value)
                }
                placeholder="Enter Receiver Wallet ID"
              />

              <span style={styles.inputIcon}>
                👤
              </span>
            </div>

            <label style={styles.label}>
              Amount
            </label>

            <div style={styles.inputWrap}>
              <input
                type="number"
                style={styles.transferInput}
                value={transferAmount}
                onChange={(e)=>
                  setTransferAmount(e.target.value)
                }
                placeholder="Enter Amount"
              />

              <span style={styles.inputIcon}>
                💳
              </span>
            </div>

            <button
              style={styles.transferBtn}
              onClick={checkReceiver}
            >
              ✈️ Transfer Now
            </button>

          </div>

          <div style={styles.inviteCard}>

            <div style={styles.inviteTop}>
              Grow More
            </div>

            <h2 style={styles.inviteTitle}>
              Invite Your Friends
            </h2>

            <h3 style={styles.inviteTitle2}>
              & Earn Unlimited Rewards
            </h3>

            <div style={styles.giftBox}>
              🎁
            </div>

            <button
              style={styles.inviteBtn}
              onClick={openInvite}
            >
              Invite Now
            </button>

          </div>

        </section>

        {/* Wallet History */}

        <section style={styles.historyCard}>

          <div style={styles.historyHeader}>

            <div>

              <h2 style={styles.historyTitle}>
                🛡 Wallet History
              </h2>

              <p style={styles.historySub}>
                Your recent wallet transactions
              </p>

            </div>

           <select
  style={styles.filterSelect}
  value={historyFilter}
  onChange={(e) => {
    setHistoryFilter(e.target.value);
    setShowAllHistory(false);
  }}
>
  <option value="all">All Transactions</option>
  <option value="credit">Credit</option>
  <option value="debit">Debit</option>
</select>

          </div>

          <div style={styles.tableHead}>

            <div>TYPE</div>
            <div>DESCRIPTION</div>
            <div>AMOUNT</div>
            <div>STATUS</div>
            <div>DATE & TIME</div>

          </div>

          {history.length === 0 && (

            <div style={styles.emptyHistory}>
              No Wallet History Found
            </div>

          )}

{visibleHistory.map((item,index)=>{

  const rawType = String(item.type || "").toLowerCase();

  const isCredit =
    rawType.includes("credit") ||
    rawType.includes("add") ||
    rawType.includes("deposit") ||
    rawType.includes("bonus");

  const desc =
    item.description ||
    item.note ||
    item.message ||
    item.remark ||
    item.type ||
    "Wallet Transaction";

  return (
            <div
              key={index}
              style={styles.historyRow}
            >

              <div>

                <div
                  style={{
                    ...styles.typeCircle,

                    background:
                      item.type === "credit"
                        ? "#dcfce7"
                        : "#fee2e2"
                  }}
                >
                 {isCredit ? "↓" : "↑"}
                </div>

              </div>

              <div>

                <div style={styles.rowTitle}>
                  {desc}
                </div>

                <div style={styles.rowSub}>
                  {item.note || ""}
                </div>

              </div>

              <div>

                <span
                  style={{
                    color:
                      isCredit
                        ? "#16a34a"
                        : "#dc2626",

                    fontWeight:"700"
                  }}
                >
                  {isCredit
                    ? "+"
                    : "-"}{" "}

                  ₹{Number(item.amount).toLocaleString()}
                </span>

              </div>

              <div>

                <span style={styles.successBadge}>
                  Success
                </span>

              </div>

              <div>

               {item.createdAt || item.date
  ? new Date(item.createdAt || item.date).toLocaleString("en-IN")
  : "N/A"}

              </div>

            </div>

               );
              })}

         {filteredHistory.length > 5 && (
  <button
    style={styles.viewMore}
    onClick={() => setShowAllHistory(!showAllHistory)}
  >
    {showAllHistory ? "Show Less ▲" : "View More ▼"}
  </button>
)}

        </section>

        {/* Bottom */}

        <section style={styles.bottomFeatures}>

          <div style={styles.featureItem}>
            🛡
            <div>
              <b>Secure Transactions</b>
              <p>Your money is 100% safe</p>
            </div>
          </div>

          <div style={styles.featureItem}>
            ⚡
            <div>
              <b>Instant Payments</b>
              <p>Quick transfer in seconds</p>
            </div>
          </div>

          <div style={styles.featureItem}>
            🏆
            <div>
              <b>Trusted Platform</b>
              <p>Used by thousands of users</p>
            </div>
          </div>

        </section>

        {/* Add Cash Modal */}

        {addOpen && (

          <div style={styles.modalOverlay}>

            <div style={styles.modal}>

              <h2>
                Add Cash
              </h2>

              <input
                type="number"
                style={styles.modalInput}
                placeholder="Enter Amount"
                value={addAmount}
                onChange={(e)=>
                  setAddAmount(e.target.value)
                }
              />

              <div style={styles.upiGrid}>

             <button
              style={styles.upiBtn}
               onClick={startUpiPayment}
              >
                Pay with UPI / Card / Wallet
               </button>

               </div>

              <button
                style={styles.closeBtn}
                onClick={() =>
                  setAddOpen(false)
                }
              >
                Close
              </button>

            </div>

          </div>

        )}

        {/* Withdraw Popup */}

        {withdrawOpen && (

          <div style={styles.modalOverlay}>

            <div style={styles.modal}>

              <h2>
                Auto Withdrawal
              </h2>

              <p
                style={{
                  lineHeight:"28px",
                  color:"#64748b"
                }}
              >
                Every month auto withdrawal
                will be processed on the
                5th date if your Save Money
                investment is renewed on time.
              </p>

              <button
                style={styles.closeBtn}
                onClick={() =>
                  setWithdrawOpen(false)
                }
              >
                Okay
              </button>

            </div>

          </div>

        )}
        {/* Transfer Confirm Modal */}

{confirmTransferOpen && receiverInfo && (
  <div style={styles.modalOverlay}>
    <div style={styles.modal}>

      <div style={styles.confirmTop}>
        <div style={styles.confirmAvatar}>
          👤
        </div>

        <h2>Confirm Transfer</h2>

        <p>
          Verify receiver details before sending money
        </p>
      </div>

      <div style={styles.receiverCard}>
        <div>
          <span>Receiver Name</span>
          <h3>{receiverInfo.name}</h3>
        </div>

        <div>
          <span>Wallet ID</span>
          <h4>{receiverWalletId}</h4>
        </div>

        <div>
          <span>Amount</span>
          <h2 style={{ color:"#16a34a" }}>
            ₹{Number(transferAmount).toLocaleString()}
          </h2>
        </div>
      </div>

      <button
        style={styles.sendMoneyBtn}
        onClick={sendTransfer}
      >
        Send Money
      </button>

      <button
        style={styles.cancelBtn}
        onClick={() =>
          setConfirmTransferOpen(false)
        }
      >
        Cancel
      </button>

    </div>
  </div>
)}

{/* Share Modal */}

{shareOpen && (

  <div style={styles.modalOverlay}>

    <div style={styles.modal}>

      <h2>Invite Friends</h2>

      <p>
        Share your referral link
      </p>

      <div style={styles.shareGrid}>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(inviteLink)}`}
          target="_blank"
          rel="noreferrer"
          style={styles.shareBtn}
        >
          WhatsApp
        </a>

        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}`}
          target="_blank"
          rel="noreferrer"
          style={styles.shareBtn}
        >
          Telegram
        </a>

        <button
          style={styles.shareBtn}
          onClick={copyInviteLink}
        >
          Copy Link
        </button>

      </div>

      <button
        style={styles.closeBtn}
        onClick={() => setShareOpen(false)}
      >
        Close
      </button>

    </div>

  </div>

)}

</div>
</div>
);
}

/* ---------- Components ---------- */

function WalletIllustration() {
  return (
    <div style={styles.walletArt}>

      <div style={styles.moneyNote1}></div>
      <div style={styles.moneyNote2}></div>

      <div style={styles.walletBag}>
        ₹
      </div>

      <div style={styles.coin1}>₹</div>
      <div style={styles.coin2}>₹</div>

    </div>
  );
}

function IncomeCard({
  icon,
  title,
  amount,
  color
}) {
  return (
    <div style={styles.incomeCard}>

      <div
        style={{
          ...styles.incomeIcon,
          background: color
        }}
      >
        {icon}
      </div>

      <h4>{title}</h4>

      <h2>
        ₹{Number(amount).toLocaleString()}
      </h2>

      <div
        style={{
          ...styles.incomeWave,
          color
        }}
      >
        ~~~
      </div>

    </div>
  );
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    background: "#f4f7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial"
  },

  loadingCard: {
    background: "white",
    padding: "35px",
    borderRadius: "30px",
    textAlign: "center",
    boxShadow: "0 18px 35px rgba(15,23,42,.12)"
  },

  loadingIcon: {
    fontSize: "70px"
  },

  page: {
    minHeight: "100vh",
    background: "#f4f7ff",
    padding: "26px",
    fontFamily: "Arial, sans-serif",
    color: "#071747"
  },

  app: {
    maxWidth: "1040px",
    margin: "0 auto"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "22px"
  },

  pageTitle: {
    margin: 0,
    fontSize: "38px",
    fontWeight: "900",
    color: "#071747"
  },

  titleWave: {
    width: "105px",
    height: "6px",
    borderRadius: "50px",
    background: "linear-gradient(90deg,#ff8a00,#ec4899,#7c3aed)",
    marginTop: "8px"
  },

  pageSub: {
    color: "#64748b",
    fontSize: "16px",
    marginTop: "9px"
  },

  notifyBtn: {
    marginLeft: "auto",
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    border: "none",
    background: "white",
    boxShadow: "0 10px 25px rgba(15,23,42,.08)",
    fontSize: "24px",
    position: "relative"
  },

  avatar: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    boxShadow: "0 10px 25px rgba(124,58,237,.15)",
    overflow: "hidden"
  },

  walletHero: {
    position: "relative",
    minHeight: "330px",
    borderRadius: "30px",
    padding: "38px",
    color: "white",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 82% 20%,rgba(255,255,255,.22),transparent 20%),linear-gradient(135deg,#1614a8,#7c2cff,#ff4b78)",
    boxShadow: "0 22px 42px rgba(94,42,210,.30)",
    marginBottom: "24px"
  },

  walletLeft: {
    width: "52%",
    position: "relative",
    zIndex: 5
  },

  heroLabel: {
    letterSpacing: "2px",
    fontSize: "13px",
    fontWeight: "900",
    opacity: 0.75
  },

  walletId: {
    fontSize: "30px",
    margin: "8px 0 0",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  dashedLine: {
    borderTop: "1px dashed rgba(255,255,255,.45)",
    margin: "22px 0"
  },

  balanceText: {
    fontSize: "46px",
    margin: "8px 0",
    fontWeight: "900"
  },

  heroActions: {
    display: "flex",
    gap: "16px",
    marginTop: "22px"
  },

  addCashBtn: {
    minWidth: "145px",
    height: "54px",
    border: "none",
    borderRadius: "18px",
    background: "white",
    color: "#1e1b9b",
    fontWeight: "900",
    fontSize: "16px",
    boxShadow: "0 12px 25px rgba(0,0,0,.18)"
  },

  withdrawBtn: {
    minWidth: "145px",
    height: "54px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#ff4b63,#ff8a3d)",
    color: "white",
    fontWeight: "900",
    fontSize: "16px",
    boxShadow: "0 12px 25px rgba(255,80,90,.28)"
  },

  eyeBtn: {
    position: "absolute",
    top: "28px",
    right: "28px",
    width: "46px",
    height: "46px",
    borderRadius: "15px",
    border: "1px solid rgba(255,255,255,.3)",
    background: "rgba(255,255,255,.13)",
    color: "white",
    fontSize: "20px",
    zIndex: 8
  },

  walletArt: {
    position: "absolute",
    right: "70px",
    top: "70px",
    width: "300px",
    height: "230px",
    zIndex: 2
  },

  moneyNote1: {
    position: "absolute",
    right: "78px",
    top: "10px",
    width: "100px",
    height: "72px",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#21d06b,#0ea55f)",
    transform: "rotate(-16deg)",
    boxShadow: "0 15px 22px rgba(0,0,0,.18)"
  },

  moneyNote2: {
    position: "absolute",
    right: "28px",
    top: "28px",
    width: "100px",
    height: "72px",
    borderRadius: "15px",
    background: "linear-gradient(135deg,#41e6c3,#0ea5a0)",
    transform: "rotate(18deg)",
    boxShadow: "0 15px 22px rgba(0,0,0,.18)"
  },

  walletBag: {
    position: "absolute",
    right: "55px",
    bottom: "30px",
    width: "165px",
    height: "132px",
    borderRadius: "28px",
    background: "linear-gradient(145deg,#7c2cff,#ba31ff)",
    color: "#facc15",
    fontSize: "52px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset -14px -12px 0 rgba(0,0,0,.14),0 24px 32px rgba(0,0,0,.25)"
  },

  coin1: {
    position: "absolute",
    right: "18px",
    bottom: "35px",
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f59e0b)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    boxShadow: "0 12px 18px rgba(0,0,0,.18)"
  },

  coin2: {
    position: "absolute",
    right: "82px",
    bottom: "0",
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fde047,#f97316)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    boxShadow: "0 12px 18px rgba(0,0,0,.18)"
  },

  incomePanel: {
    background: "white",
    borderRadius: "28px",
    padding: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: "8px",
    boxShadow: "0 15px 30px rgba(15,23,42,.08)",
    marginBottom: "24px"
  },

  incomeCard: {
    textAlign: "center",
    padding: "12px 8px",
    borderRight: "1px dashed #d9e1f2"
  },

  incomeIcon: {
    width: "58px",
    height: "58px",
    margin: "0 auto 10px",
    borderRadius: "50%",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    boxShadow: "0 10px 20px rgba(15,23,42,.12)"
  },

  incomeWave: {
    fontSize: "30px",
    fontWeight: "900",
    marginTop: "-6px"
  },

  middleGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px",
    marginBottom: "24px"
  },

  transferCard: {
    background: "#070a55",
    color: "white",
    borderRadius: "28px",
    padding: "30px",
    boxShadow: "0 18px 32px rgba(7,10,85,.22)"
  },

  transferIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#2563eb,#06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    marginBottom: "12px"
  },

  transferTitle: {
    margin: 0,
    fontSize: "28px"
  },

  transferSub: {
    color: "#aab1d6",
    marginBottom: "22px"
  },

  label: {
    display: "block",
    fontWeight: "900",
    marginBottom: "8px"
  },

  inputWrap: {
    height: "56px",
    borderRadius: "16px",
    background: "white",
    display: "flex",
    alignItems: "center",
    padding: "0 15px",
    marginBottom: "18px"
  },

  transferInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "16px"
  },

  inputIcon: {
    fontSize: "22px"
  },

  transferBtn: {
    width: "100%",
    height: "58px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#ff7a35,#ec168e)",
    color: "white",
    fontSize: "18px",
    fontWeight: "900",
    boxShadow: "0 12px 24px rgba(236,22,142,.25)"
  },

  inviteCard: {
    background: "linear-gradient(135deg,#fff4d9,#ffffff)",
    borderRadius: "28px",
    padding: "30px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 15px 30px rgba(15,23,42,.08)"
  },

  inviteTop: {
    color: "#f59e0b",
    fontWeight: "900",
    fontSize: "18px"
  },

  inviteTitle: {
    fontSize: "32px",
    margin: "10px 0 0"
  },

  inviteTitle2: {
    color: "#6d28d9",
    fontSize: "24px",
    margin: "6px 0"
  },

  giftBox: {
    fontSize: "115px",
    textAlign: "right",
    filter: "drop-shadow(0 14px 18px rgba(245,158,11,.22))"
  },

  inviteBtn: {
    position: "absolute",
    left: "30px",
    bottom: "30px",
    height: "52px",
    minWidth: "140px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg,#6d28d9,#ec4899)",
    color: "white",
    fontWeight: "900",
    fontSize: "16px"
  },

  historyCard: {
    background: "white",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 15px 30px rgba(15,23,42,.08)",
    marginBottom: "20px"
  },

  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },

  historyTitle: {
    margin: 0,
    fontSize: "28px"
  },

  historySub: {
    color: "#64748b"
  },

  filterSelect: {
    height: "44px",
    borderRadius: "14px",
    border: "1px solid #dbe3ef",
    padding: "0 14px",
    fontWeight: "900"
  },

  tableHead: {
    display: "grid",
    gridTemplateColumns: "70px 1.6fr 1fr 1fr 1.2fr",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "900",
    padding: "12px 0",
    borderBottom: "1px solid #eef2ff"
  },

  historyRow: {
    display: "grid",
    gridTemplateColumns: "70px 1.6fr 1fr 1fr 1.2fr",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid #eef2ff"
  },

  typeCircle: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px"
  },

  rowTitle: {
    fontWeight: "900",
    color: "#071747"
  },

  rowSub: {
    color: "#64748b",
    fontSize: "13px"
  },

  successBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#16a34a",
    padding: "8px 14px",
    borderRadius: "14px",
    fontWeight: "900",
    fontSize: "13px"
  },

  emptyHistory: {
    textAlign: "center",
    padding: "35px",
    color: "#64748b",
    fontWeight: "900"
  },

  viewMore: {
    textAlign: "center",
    color: "#6d28d9",
    fontWeight: "900",
    marginTop: "18px"
  },

  bottomFeatures: {
    background: "white",
    borderRadius: "22px",
    padding: "18px",
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "15px",
    boxShadow: "0 12px 25px rgba(15,23,42,.07)"
  },

  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  modal: {
    width: "90%",
    maxWidth: "430px",
    background: "white",
    borderRadius: "26px",
    padding: "26px",
    color: "#071747",
    boxShadow: "0 25px 50px rgba(0,0,0,.25)"
  },

  modalInput: {
    width: "100%",
    height: "55px",
    borderRadius: "15px",
    border: "1px solid #dbe3ef",
    padding: "0 15px",
    fontSize: "18px",
    outline: "none"
  },

  upiGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "18px"
  },

  upiBtn: {
    height: "48px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "white",
    fontWeight: "900"
  },

  closeBtn: {
    width: "100%",
    height: "50px",
    marginTop: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#e5e7eb",
    color: "#071747",
    fontWeight: "900"
  },

  confirmTop: {
    textAlign: "center"
  },

  confirmAvatar: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    fontSize: "34px"
  },

  receiverCard: {
    background: "#f8fafc",
    borderRadius: "18px",
    padding: "18px",
    marginTop: "16px",
    textAlign: "center"
  },

  sendMoneyBtn: {
    width: "100%",
    height: "52px",
    border: "none",
    borderRadius: "15px",
    background: "#16a34a",
    color: "white",
    fontWeight: "900",
    marginTop: "15px"
  },

  cancelBtn: {
    width: "100%",
    height: "48px",
    border: "none",
    borderRadius: "15px",
    background: "#fee2e2",
    color: "#dc2626",
    fontWeight: "900",
    marginTop: "10px"
  },

  shareGrid: {
    display: "grid",
    gap: "12px",
    marginTop: "18px"
  },

  shareBtn: {
    height: "50px",
    borderRadius: "15px",
    border: "none",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "white",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none"
  },

notifyCount: {
  position: "absolute",
  top: "-5px",
  right: "-5px",
  background: "#ef4444",
  color: "white",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900"
},

avatarImg: {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%"
}

};