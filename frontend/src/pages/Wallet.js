import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
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
    balance: 0, // Main Wallet
    todayBalance: 0,
    referral: 0,
    performance: 0,
    team: 0,
    royalty: 0,
  });
  
  const [history, setHistory] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [confirmTransferOpen, setConfirmTransferOpen] = useState(false);
  const [depositTxnId, setDepositTxnId] = useState("");
  const [depositScreenshot, setDepositScreenshot] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    loadWallet();
    loadWithdrawStatus();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/wallet-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setWallet({
          walletId: data.walletId || data.user?.walletId || "N/A",
          name: data.name || data.user?.name || "User",
          avatar: data.avatar || data.user?.photo || data.user?.photoImage || "",
          photo: data.user?.photo || "",
          photoImage: data.user?.photoImage || "",
          balance: Number(data.balance || 0),
          todayBalance: Number(data.todayBalance || 0),
          referral: Number(data.referral || 0),
          performance: Number(data.performance || 0),
          team: Number(data.team || 0),
          royalty: Number(data.royalty || 0),
        });

        setHistory(Array.isArray(data.history) ? data.history : []);
      }
    } catch (err) {
      console.log("WALLET LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawStatus = async () => {
    try {
      const res = await fetch(`${API}/auto-withdraw-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) {
        setWithdrawStatus(data);
      }
    } catch (err) {
      console.log("WITHDRAW STATUS ERROR", err);
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
      toast.success("Wallet ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const openAddCash = () => {
    setAddAmount("");
    setAddOpen(true);
  };

  const DEPOSIT_ADDRESS = "0x53D944eDA838748A92F2c361d2F71cD7EcFc8643";

  const submitDepositRequest = async () => {
    if (!addAmount || Number(addAmount) <= 0) {
      return toast.info("Enter valid amount");
    }
    if (!depositTxnId.trim()) {
      return toast.info("Enter transaction ID");
    }
    if (!depositScreenshot) {
      return toast.info("Upload payment screenshot");
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("amount", Number(addAmount));
    formData.append("txnId", depositTxnId);
    formData.append("screenshot", depositScreenshot);

    try {
      const res = await fetch(`${API}/deposit-request`, {
        method: "POST",
        headers: {
          authorization: token || "",
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return toast.error(data.msg || "Deposit request failed");
      }

      toast.info("Deposit request submitted. Admin approval pending.");
      setAddOpen(false);
      setAddAmount("");
      setDepositTxnId("");
      setDepositScreenshot(null);
      loadWallet();
    } catch (err) {
      console.log("DEPOSIT ERROR:", err);
      toast.warning("Server error");
    }
  };

  // ২০০০ টাকা সিকিউরিটি লকসহ আপডেট করা ট্রান্সফার লজিক
  const checkReceiver = async () => {
    if (!receiverWalletId.trim()) {
      return toast.info("Enter receiver wallet ID");
    }

    if (!transferAmount || Number(transferAmount) <= 0) {
      return toast.info("Enter valid amount");
    }

    const currentBalance = Number(wallet.balance || 0);
    
    // ব্যালেন্স ২০০০ বা তার কম হলে ট্রান্সফার ব্লক
    if (currentBalance <= 2000) {
      return toast.warning("You cannot transfer money. Minimum ₹2,000 must remain in your wallet.");
    }

    // সর্বোচ্চ কত টাকা পাঠানো যাবে তার হিসেব (মোট ব্যালেন্স - ২০০০)
    const maxAllowed = currentBalance - 2000;
    if (Number(transferAmount) > maxAllowed) {
      return toast.warning(`You can transfer a maximum of ₹${maxAllowed.toLocaleString("en-IN")} (Keeping ₹2,000 main balance)`);
    }

    try {
      const res = await fetch(`${API}/wallet-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify({
          walletId: receiverWalletId.trim(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        return toast.error(data.msg || "Receiver not found");
      }

      setReceiverInfo(data.user);
      setConfirmTransferOpen(true);
    } catch (err) {
      console.log("RECEIVER CHECK ERROR:", err);
      toast.error("Receiver check failed");
    }
  };

  const sendTransfer = async () => {
    try {
      const res = await fetch(`${API}/wallet-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || "",
        },
        body: JSON.stringify({
          senderEmail: email,
          receiverWalletId: receiverWalletId.trim(),
          amount: Number(transferAmount),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.msg || "Transfer completed");
        setReceiverWalletId("");
        setTransferAmount("");
        setReceiverInfo(null);
        setConfirmTransferOpen(false);
        loadWallet();
      } else {
        toast.error(data.msg || "Transfer failed");
      }
    } catch (err) {
      console.log("TRANSFER ERROR:", err);
      toast.error("Transfer failed");
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
          url: inviteLink,
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
      toast.success("Referral link copied");
    } catch {
      toast.error("Copy failed");
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
            onClick={() => (window.location.href = "/notifications")}
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

            <h1 style={styles.balanceText}>{visibleBalance}</h1>

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

          {/* WalletIllustration Component Fallback/Check */}
          {typeof WalletIllustration !== "undefined" ? <WalletIllustration /> : null}
        </section>

        <section style={styles.incomePanel}>
          <IncomeCard icon="👥" title="REFERRAL" amount={wallet.referral} color="#10b981" />
          <IncomeCard icon="📈" title="PERFORMANCE" amount={wallet.performance} color="#f59e0b" />
          <IncomeCard icon="👥" title="TEAM" amount={wallet.team} color="#2563eb" />
          <IncomeCard icon="👑" title="ROYALTY" amount={wallet.royalty} color="#9333ea" />
          <IncomeCard icon="👛" title="TODAY WALLET" amount={wallet.todayBalance} color="#14b8a6" />
        </section>

        <section style={styles.middleGrid}>
          <div style={styles.transferCard}>
            <div style={styles.transferIcon}>✈️</div>
            <h2 style={styles.transferTitle}>Wallet Transfer</h2>
            <p style={styles.transferSub}>Send money to another wallet instantly</p>

            <label style={styles.label}>Receiver Wallet ID</label>
            <div style={styles.inputWrap}>
              <input
                style={styles.transferInput}
                value={receiverWalletId}
                onChange={(e) => setReceiverWalletId(e.target.value)}
                placeholder="Enter Receiver Wallet ID"
              />
              <span style={styles.inputIcon}>👤</span>
            </div>

            <label style={styles.label}>Amount</label>
            <div style={styles.inputWrap}>
              <input
                type="number"
                style={styles.transferInput}
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Enter Amount"
              />
              <span style={styles.inputIcon}>💳</span>
            </div>

            <button style={styles.transferBtn} onClick={checkReceiver}>
              ✈️ Transfer Now
            </button>
          </div>

          <div style={styles.inviteCard}>
            <div style={styles.inviteTop}>Grow More</div>
            <h2 style={styles.inviteTitle}>Invite Your Friends</h2>
            <h3 style={styles.inviteTitle2}>& Earn Unlimited Rewards</h3>
            <div style={styles.giftBox}>🎁</div>
            <button style={styles.inviteBtn} onClick={openInvite}>
              Invite Now
            </button>
          </div>
        </section>

        <section style={styles.historyCard}>
          <div style={styles.historyHeader}>
            <div>
              <h2 style={styles.historyTitle}>🛡 Wallet History</h2>
              <p style={styles.historySub}>Your recent wallet transactions</p>
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
            <div style={styles.emptyHistory}>No Wallet History Found</div>
          )}

          {visibleHistory.map((item, index) => {
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
              <div key={index} style={styles.historyRow}>
                <div>
                  <div
                    style={{
                      ...styles.typeCircle,
                      background: item.type === "credit" ? "#dcfce7" : "#fee2e2",
                    }}
                  >
                    {isCredit ? "↓" : "↑"}
                  </div>
                </div>

                <div>
                  <div style={styles.rowTitle}>{desc}</div>
                  <div style={styles.rowSub}>{item.note || ""}</div>
                </div>

                <div>
                  <span
                    style={{
                      color: isCredit ? "#16a34a" : "#dc2626",
                      fontWeight: "700",
                    }}
                  >
                    {isCredit ? "+" : "-"} ₹{Number(item.amount).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span style={styles.successBadge}>Success</span>
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

        {addOpen && (
          <div style={styles.depositOverlay}>
            <div style={styles.depositModal}>
              <button style={styles.depositCloseX} onClick={() => setAddOpen(false)}>
                ×
              </button>

              <div style={styles.depositIcon}>💳</div>
              <h2 style={styles.depositTitle}>Add Cash</h2>
              <p style={styles.depositSub}>
                Send payment, upload proof & wait for admin approval.
              </p>

              <label style={styles.depositLabel}>Wallet Address</label>
              <div style={styles.depositAddressBox}>
                <span style={styles.depositAddress}>{DEPOSIT_ADDRESS}</span>
                <button
                  style={styles.copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
                    toast.success("Wallet address copied");
                  }}
                >
                  Copy
                </button>
              </div>

              <label style={styles.depositLabel}>Amount</label>
              <input
                style={styles.depositInput}
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />

              <label style={styles.depositLabel}>Transaction ID</label>
              <input
                style={styles.depositInput}
                type="text"
                placeholder="Enter transaction ID"
                value={depositTxnId}
                onChange={(e) => setDepositTxnId(e.target.value)}
              />

              <label style={styles.depositLabel}>Payment Screenshot</label>
              <label style={styles.fileBox}>
                <span>
                  {depositScreenshot ? depositScreenshot.name : "📤 Upload Screenshot"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setDepositScreenshot(e.target.files[0])}
                />
              </label>

              <button style={styles.submitDepositBtn} onClick={submitDepositRequest}>
                Submit Deposit Request
              </button>
            </div>
          </div>
        )}

        {withdrawOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2>💳 Auto Withdrawal</h2>
              {withdrawStatus && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "15px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                  }}
                >
                  <p>
                    Status :<b>{withdrawStatus.enabled ? " ✅ Active" : " ❌ Paused"}</b>
                  </p>

                  {withdrawStatus.nextWithdrawal && (
                    <p>
                      Next Withdrawal :
                      <b>
                        {new Date(withdrawStatus.nextWithdrawal).toLocaleDateString("en-IN")}
                      </b>
                    </p>
                  )}

                  {withdrawStatus.note?.length > 0 && (
                    <>
                      <h4 style={{ marginTop: "20px", marginBottom: "10px", color: "#0f172a" }}>
                        NOTE :
                      </h4>
                      <ul style={{ paddingLeft: "18px", lineHeight: "28px", fontSize: "14px", color: "#475569" }}>
                        {withdrawStatus.note.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
              <button style={styles.closeBtn} onClick={() => setWithdrawOpen(false)}>
                Okay, I Understand
              </button>
            </div>
          </div>
        )}

        {confirmTransferOpen && receiverInfo && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2>Confirm Transfer</h2>
              <p style={{ margin: "10px 0", color: "#475569" }}>
                Are you sure you want to transfer <b>₹{Number(transferAmount).toLocaleString()}</b> to:
              </p>
              <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "12px", margin: "15px 0" }}>
                <p><b>Name:</b> {receiverInfo.name || "N/A"}</p>
                <p><b>Wallet ID:</b> {receiverInfo.walletId || "N/A"}</p>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  style={{ ...styles.closeBtn, background: "#ef4444", color: "#fff", flex: 1 }}
                  onClick={() => setConfirmTransferOpen(false)}
                >
                  Cancel
                </button>
                <button
                  style={{ ...styles.closeBtn, background: "#10b981", color: "#fff", flex: 1 }}
                  onClick={sendTransfer}
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// IncomeCard সাব-কম্পোনেন্ট (কোড ক্লিয়ার রাখার জন্য)
function IncomeCard({ icon, title, amount, color }) {
  return (
    <div style={{ ...styles.incomeCard, borderLeft: `5px solid ${color}` }}>
      <span style={{ fontSize: "24px" }}>{icon}</span>
      <div>
        <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>{title}</p>
        <h3 style={{ fontSize: "18px", color: "#0f172a", marginTop: "4px" }}>
          ₹ {Number(amount || 0).toLocaleString("en-IN")}
        </h3>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "20px" },
  app: { maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  pageTitle: { fontSize: "28px", color: "#0f172a" },
  titleWave: { width: "50px", height: "4px", background: "#2563eb", borderRadius: "2px", margin: "6px 0" },
  pageSub: { color: "#64748b", fontSize: "14px" },
  notifyBtn: { background: "#fff", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "50%", cursor: "pointer", position: "relative" },
  notifyCount: { position: "absolute", top: "0", right: "0", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%" },
  avatar: { width: "45px", height: "45px", borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  walletHero: { background: "linear-gradient(135deg, #1e3a8a, #0f172a)", padding: "30px", borderRadius: "24px", color: "#fff", position: "relative", display: "flex", justifyContent: "space-between", marginBottom: "30px", overflow: "hidden" },
  walletLeft: { zIndex: 2 },
  heroLabel: { fontSize: "11px", color: "#93c5fd", letterSpacing: "1px", fontWeight: "bold" },
  walletId: { fontSize: "20px", color: "#fff", margin: "5px 0 15px 0", display: "flex", alignItems: "center", gap: "10px" },
  dashedLine: { borderTop: "1px dashed rgba(255,255,255,0.2)", margin: "15px 0" },
  balanceText: { fontSize: "36px", fontWeight: "bold", margin: "8px 0 20px 0" },
  heroActions: { display: "flex", gap: "15px" },
  addCashBtn: { background: "#fff", color: "#1e3a8a", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" },
  withdrawBtn: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" },
  eyeBtn: { position: "absolute", top: "30px", right: "30px", background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", zIndex: 5 },
  incomePanel: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" },
  incomeCard: { background: "#fff", padding: "20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "15px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  middleGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px", marginBottom: "30px" },
  transferCard: { background: "#fff", padding: "30px", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  transferIcon: { fontSize: "30px", marginBottom: "10px" },
  transferTitle: { fontSize: "20px", color: "#0f172a" },
  transferSub: { color: "#64748b", fontSize: "13px", marginBottom: "20px" },
  label: { fontSize: "13px", fontWeight: "bold", color: "#334155", display: "block", marginBottom: "8px", marginTop: "15px" },
  inputWrap: { position: "relative" },
  transferInput: { width: "100%", padding: "14px 14px 14px 40px", borderRadius: "12px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" },
  inputIcon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" },
  transferBtn: { width: "100%", background: "#2563eb", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", marginTop: "20px" },
  inviteCard: { background: "linear-gradient(135deg, #f59e0b, #d97706)", padding: "30px", borderRadius: "24px", color: "#fff", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
  inviteTop: { background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", marginBottom: "15px" },
  inviteTitle: { fontSize: "22px", fontWeight: "bold" },
  inviteTitle2: { fontSize: "16px", fontWeight: "normal", opacity: 0.9, marginTop: "5px" },
  giftBox: { fontSize: "50px", margin: "20px 0" },
  inviteBtn: { background: "#fff", color: "#d97706", border: "none", padding: "12px 35px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" },
  historyCard: { background: "#fff", padding: "30px", borderRadius: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "30px", overflowX: "auto" },
  historyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  historyTitle: { fontSize: "20px", color: "#0f172a" },
  historySub: { color: "#64748b", fontSize: "13px" },
  filterSelect: { padding: "8px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" },
  tableHead: { display: "grid", gridTemplateColumns: "60px 2fr 1fr 1fr 1.5fr", background: "#f8fafc", padding: "12px 20px", borderRadius: "10px", fontWeight: "bold", color: "#64748b", fontSize: "12px", minWidth: "600px" },
  emptyHistory: { textAlign: "center", padding: "40px", color: "#94a3b8" },
  historyRow: { display: "grid", gridTemplateColumns: "60px 2fr 1fr 1fr 1.5fr", padding: "16px 20px", borderBottom: "1px solid #f1f5f9", alignItems: "center", minWidth: "600px" },
  typeCircle: { width: "35px", height: "35px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  rowTitle: { fontWeight: "600", color: "#334155", fontSize: "14px" },
  rowSub: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  successBadge: { background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  viewMore: { width: "100%", background: "none", border: "none", color: "#2563eb", fontWeight: "bold", padding: "15px 0 0 0", cursor: "pointer" },
  bottomFeatures: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" },
  featureItem: { background: "#fff", padding: "20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "15px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", fontSize: "24px" },
  depositOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  depositModal: { background: "#fff", padding: "30px", borderRadius: "24px", maxWidth: "450px", width: "100%", position: "relative", maxHeight: "90vh", overflowY: "auto" },
  depositCloseX: { position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer" },
  depositIcon: { fontSize: "40px", textAlign: "center", marginBottom: "10px" },
  depositTitle: { textAlign: "center", fontSize: "22px", color: "#0f172a" },
  depositSub: { textAlign: "center", color: "#64748b", fontSize: "13px", marginBottom: "20px" },
  depositLabel: { fontSize: "12px", fontWeight: "bold", color: "#475569", display: "block", marginTop: "12px", marginBottom: "6px" },
  depositAddressBox: { background: "#f1f5f9", padding: "12px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  depositAddress: { fontSize: "12px", color: "#334155", wordBreak: "break-all" },
  copyBtn: { background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer" },
  depositInput: { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", outline: "none" },
  fileBox: { display: "block", border: "2px dashed #cbd5e1", padding: "15px", borderRadius: "12px", textAlign: "center", cursor: "pointer", color: "#64748b" },
  submitDepositBtn: { width: "100%", background: "#10b981", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "bold", marginTop: "20px", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", padding: "30px", borderRadius: "24px", maxWidth: "400px", width: "90%", textAlign: "center" },
  closeBtn: { background: "#1e3a8a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginTop: "20px", width: "100%" },
  loadingPage: { minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" },
  loadingCard: { textAlign: "center" },
  loadingIcon: { fontSize: "50px", marginBottom: "15px", animation: "bounce 1s infinite" }
};
