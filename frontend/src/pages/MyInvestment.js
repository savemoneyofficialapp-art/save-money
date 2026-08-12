import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";
import axios from "axios";

function formatDate(d) {
  if (!d) return "N/A";

  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default function MyInvestment() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "";
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);

  const [statementOpen, setStatementOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [customAlert, setCustomAlert] = useState({ show: false, title: "", message: "", type: "info" });

  const getDaysLeft = (renewDate) => {
    if (!renewDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renew = new Date(renewDate);
    renew.setHours(0, 0, 0, 0);

    const diff = Math.ceil(
      (renew - today) / (1000 * 60 * 60 * 24)
    );

    return diff > 0 ? diff : 0;
  };

  const isOverdue = (renewDate) => {
    if (!renewDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renew = new Date(renewDate);
    renew.setHours(0, 0, 0, 0);

    return today > renew;
  };

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/my-investments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token || ""
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data?.success) {
        setInvestments(Array.isArray(data.investments) ? data.investments : []);
      } else {
        setInvestments([]);
      }
    } catch (err) {
      console.log("MY INVESTMENT ERROR:", err);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  const money = (n) => {
    return `₹ ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const date = (d) => {
    if (!d) return "N/A";

    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const renewDateText = () => {
    if (!selectedPlan?.renewDate && !selectedPlan?.nextRenewDate) return "N/A";

    return formatDate(
      selectedPlan.renewDate || selectedPlan.nextRenewDate
    );
  };

  const downloadSlip = (planId, historyId) => {
    window.open(`${API}/investment-slip/${planId}/${historyId}`, "_blank");
  };

  const summary = useMemo(() => {
    const totalInvestment = investments.reduce(
      (sum, item) => sum + Number(item.totalPlanAmount || item.amount || 0),
      0
    );

    const investedAmount = investments.reduce((sum, item) => {
      if (item.history && Array.isArray(item.history) && item.history.length > 0) {
        const historySum = item.history.reduce((hSum, h) => hSum + Number(h.amount || 0), 0);
        return sum + historySum;
      } else {
        return sum + Number(item.amount || 0);
      }
    }, 0);

    const totalReturn = investments.reduce(
      (sum, item) => sum + Number(item.totalReturn || item.maturityAmount || 0),
      0
    );

    const activeInvestments = investments.filter(
      (item) => String(item.status || "").toLowerCase() === "active"
    ).length;

    const averageReturnRate =
      investments.length > 0
        ? investments.reduce(
            (sum, item) => sum + Number(item.returnRate || item.interestRate || item.rate || 0),
            0
          ) / investments.length
        : 0;

    return {
      totalInvestment,
      investedAmount,
      totalReturn,
      activeInvestments,
      averageReturnRate
    };
  }, [investments]);

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Investment ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const viewDetails = (inv) => {
    const detailsContent = (
      <div style={{ textAlign: "left", marginTop: "10px" }}>
        <div style={styles.detailRow}><span>📋 Plan Name:</span> <b>{inv.planName || inv.plan || "Investment"}</b></div>
        <div style={styles.detailRow}><span>💰 Total Amount:</span> <b>{money(inv.totalPlanAmount || inv.amount)}</b></div>
        <div style={styles.detailRow}><span>🪙 Invested:</span> <b>{money(inv.amount)}</b></div>
        <div style={styles.detailRow}><span>⚡ Status:</span> <b style={{ color: "#16a34a" }}>{inv.status || "Active"}</b></div>
      </div>
    );

    setCustomAlert({
      show: true,
      title: "Investment Details",
      message: detailsContent,
      type: "details"
    });
  };

  const certificate = (inv) => {
    const id = inv?._id || inv?.investmentId;

    if (!id) {
      toast.error("Investment ID not found");
      return;
    }

    window.open(`${API}/investment-certificate/${id}`, "_blank");
  };

  const downloadStatement = (inv) => {
    setSelectedPlan(inv);
    setStatementOpen(true);
  };

  const renewNow = (inv) => {
    setSelectedPlan(inv);
    setRenewOpen(true);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingBox}>
          <h2>Loading My Investment...</h2>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.mainLayoutWrapper}>
      {/* বাম পাশের ফিক্সড ডার্ক সাইডবার */}
      <div style={styles.leftSidebar}>
        <div style={styles.sidebarLogoWrap}>
          <div style={styles.sidebarTreeIcon}>🌳</div>
          <h2 style={styles.sidebarBrandTitle}>SAVE MONEY</h2>
          <p style={styles.sidebarBrandSub}>SIP INVEST PLAN</p>
        </div>

        <div style={styles.sidebarGraphicArea}>
          <div style={styles.sidebarChartBars}>
            <div style={{...styles.sBar, height: "40px"}}></div>
            <div style={{...styles.sBar, height: "65px"}}></div>
            <div style={{...styles.sBar, height: "90px"}}></div>
            <div style={{...styles.sBar, height: "120px"}}></div>
          </div>
          <div style={styles.sidebarPlantBox}>
            🌱
          </div>
          <div style={styles.sidebarCoinsStack}>
            <div style={styles.sCoin}>₹</div>
            <div style={styles.sCoin}>₹</div>
          </div>
        </div>
      </div>

      {/* মূল কন্টেন্ট এরিয়া */}
      <div style={styles.rightContentArea}>
        <div style={styles.page}>
          <div style={styles.wrap}>

            <div style={styles.header}>
              <button style={styles.backBtn} onClick={() => navigate("/home")}>
                ←
              </button>

              <div style={styles.headerTitle}>
                <h1>My Investment</h1>
                <p>Track, manage & grow your wealth</p>
              </div>

              <div style={styles.rightTop}>
                <div style={styles.secureBadge}>🛡 100% Secure</div>
                <button style={styles.bellBtn} onClick={() => navigate("/notifications")}>
                  🔔
                  <span></span>
                </button>
              </div>
            </div>

            {investments.length === 0 ? (
              <EmptyInvestment navigate={navigate} />
            ) : (
              <>
                <SummaryHero summary={summary} money={money} />

                {investments.map((inv, index) => {
                  const currentCardInvestedAmount = inv.history && Array.isArray(inv.history) && inv.history.length > 0
                    ? inv.history.reduce((hSum, h) => hSum + Number(h.amount || 0), 0)
                    : Number(inv.amount || 0);

                  return (
                    <InvestmentCard
                      key={inv._id || inv.investmentId || index}
                      inv={inv}
                      money={money}
                      date={date}
                      copyId={copyId}
                      viewDetails={viewDetails}
                      certificate={certificate}
                      downloadStatement={downloadStatement}
                      renewNow={renewNow}
                      openRenewInfo={openRenewInfo}
                      daysLeft={getDaysLeft(inv?.renewDate || inv?.nextRenewDate)}  
                      isOverdue={isOverdue}            
                      requiredInvestment={inv.totalPlanAmount || inv.amount}
                      investedAmount={currentCardInvestedAmount} 
                    />
                  );
                })}

                <BottomBanner />
              </>
            )}

          </div>

          {statementOpen && selectedPlan && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalBox}>
                <h2>Payment Statement</h2>
                <p>Start SIP payment and all renew payments are listed below.</p>

                {(selectedPlan.history || []).length === 0 ? (
                  <p>No payment slip found</p>
                ) : (
                  selectedPlan.history.map((h, i) => (
                    <div key={i} style={styles.slipRow}>
                      <div>
                        <b>{i === 0 ? "Start SIP Payment" : "Renew Payment"}</b>
                        <p>{formatDate(h.date)}</p>
                        <h3 style={{ color: "#16a34a", fontWeight: "800" }}>
                          ₹ {Number(h.amount || 0).toLocaleString("en-IN")}
                        </h3>
                      </div>

                      <button
                        style={styles.greenBtn}
                        onClick={() =>
                          downloadSlip(selectedPlan._id || selectedPlan.investmentId, h._id)
                        }
                      >
                        Download Slip
                      </button>
                    </div>
                  ))
                )}

                <button style={styles.closeBtn} onClick={() => setStatementOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          )}

          {renewOpen && selectedPlan && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalBox}>
                <h2>Renew Information</h2>

                <p>
                  Your SIP renewal is due exactly after 30 days from your investment start date.
                </p>

                <h3>Renew Due Date</h3>

                <h2 style={{ color: "#16a34a" }}>
                  {renewDateText()}
                </h2>

                <h3>Days Left For Renew</h3>

                {isOverdue(selectedPlan?.renewDate || selectedPlan?.nextRenewDate) ? (
                  <h1 style={{ color: "#ef4444" }}>Overdue</h1>
                ) : (
                  <h1 style={{ color: "#7c3aed" }}>
                    {getDaysLeft(selectedPlan?.renewDate || selectedPlan?.nextRenewDate)} Days
                  </h1>
                )}

                <p>
                  Please renew on or before your renew due date. If the renew date is missed,
                  your investment status may become inactive and bonus / auto withdrawal benefits
                  may be affected.
                </p>

                <button
                  style={styles.greenBtn}
                  onClick={async () => {
                    try {
                      const res = await axios.post(
                        `${API}/renew-invest`,
                        {
                          investmentId: selectedPlan._id
                        }
                      );

                      setRenewOpen(false);

                      setCustomAlert({ 
                        show: true, 
                        title: "Notification", 
                        message: res.data.msg,
                        type: "info"
                      });

                      if (res.data.success) {
                        loadInvestments(); 
                      }

                    } catch (err) {
                      toast.error(
                        err?.response?.data?.msg ||
                        "Renew failed"
                      );
                    }
                  }}
                >
                  Renew Payment
                </button>

                <button style={styles.closeBtn} onClick={() => setRenewOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          )}

          {customAlert.show && (
            <div style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5, 8, 66, 0.4)",
              backdropFilter: "blur(12px)", 
              WebkitBackdropFilter: "blur(12px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}>
              
              <style>{`
                @keyframes popupBounceScale {
                  0% { transform: scale(0.75); opacity: 0; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}</style>

              <div style={{
                width: "100%",
                maxWidth: "380px",
                background: "white",
                borderRadius: "26px",
                padding: "30px 24px",
                color: "#071747",
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.35)",
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                animation: "popupBounceScale 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              }}>
                
                <div style={{ fontSize: "56px", marginBottom: "12px", display: "inline-block" }}>
                  {customAlert.type === "details" ? "📊" : "ℹ️"}
                </div>
                
                <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "16px", color: "#071747", letterSpacing: "-0.5px" }}>
                  {customAlert.title}
                </h2>
                
                <div style={{ fontSize: "17px", fontWeight: "700", color: "#334155", marginBottom: "28px", lineHeight: "1.6" }}>
                  {customAlert.message}
                </div>
                
                <button 
                  style={{ 
                    width: "100%", 
                    padding: "14px", 
                    fontSize: "16px", 
                    fontWeight: "900", 
                    background: customAlert.type === "details" ? "#0969ff" : "#16a34a", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "16px", 
                    cursor: "pointer",
                    boxShadow: "0 8px 22px rgba(0,0,0,0.15)",
                    transition: "transform 0.1s"
                  }} 
                  onClick={() => setCustomAlert({ show: false, title: "", message: "", type: "info" })}
                >
                  Okay, Got it
                </button>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function EmptyInvestment({ navigate }) {
  return (
    <div style={styles.emptyBox}>
      <div style={styles.emptyIcon}>📭</div>
      <h1>No any investment start</h1>
      <p>You have not started any investment yet.</p>

      <button style={styles.emptyBtn} onClick={() => navigate("/invest-now")}>
        Start Investment
      </button>
    </div>
  );
}

function SummaryHero({ summary, money }) {
  return (
    <section style={styles.hero}>
      <div style={styles.heroLeft}>
        <HeroItem
          icon="💼"
          title="Required Investment"
          value={money(summary.totalInvestment)}
        />

        <HeroItem
          icon="💰"
          title="Invested Amount"
          value={money(summary.investedAmount || 0)}
        />

        <HeroItem
          icon="🌱"
          title="Total Return (All Time)"
          value={money(summary.totalReturn)}
          green />
      </div>

      <div style={styles.safeArt}>
        <div style={styles.safeBox}>▣</div>
        <div style={styles.coin1}>₹</div>
        <div style={styles.coin2}>₹</div>
        <div style={styles.shield}>✓</div>
      </div>

      <div style={styles.heroRight}>
        <HeroItem icon="📊" title="Average Return Rate" value={`${summary.averageReturnRate.toFixed(2)}%`} green />
        <HeroItem icon="💼" title="Active Investments" value={summary.activeInvestments} />
      </div>

      <div style={styles.heroBottom}>
        🚀 Invest Today, <b>Secure Tomorrow</b>, Enjoy Freedom Forever.
      </div>
    </section>
  );
}

function HeroItem({ icon, title, value, green }) {
  return (
    <div style={styles.heroItem}>
      <span>{icon}</span>
      <div>
        <p>{title}</p>
        <h2 style={{ color: green ? "#20e58d" : "white" }}>{value}</h2>
      </div>
    </div>
  );
}

function InvestmentCard({
  inv,
  money,
  date,
  copyId,
  viewDetails,
  certificate,
  downloadStatement,
  renewNow,
  daysLeft,
  isOverdue,
  requiredInvestment,
  investedAmount,
}) {
  const isSave =
    String(inv.planType || inv.type || inv.planName || "")
      .toLowerCase()
      .includes("save");

  const theme = isSave
    ? {
        color: "#16c784",
        soft: "#effdf6",
        title: inv.planName || "Save Money",
        sub: inv.planSub || "SIP Invest Plan",
        icon: "plant"
      }
    : {
        color: "#0969ff",
        soft: "#f1f6ff",
        title: inv.planName || "One Time Investment",
        sub: inv.planSub || "Upgrade Money",
        icon: "rocket"
      };

  const investmentId =
    inv.investmentId || inv._id || `${isSave ? "SM" : "OT"}000000`;

  const amount = inv.amount || inv.totalAmount || inv.investAmount || 0;
  const monthlyReturn = inv.monthlyReturn || inv.monthlyEmi || inv.emi || 0;
  const years = inv.years || inv.tenure || inv.duration || 0;
  const returnRate = inv.returnRate || inv.interestRate || inv.rate || 0;
  const status = inv.status || "Active";
  const totalReturn = inv.totalReturn || inv.returnAmount || 0;
  const maturityAmount = inv.maturityAmount || Number(amount) + Number(totalReturn);
  const progress = inv.progress || 5;

  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.planLogo}>
          {theme.icon === "plant" ? <PlantIcon /> : <RocketIcon />}
        </div>

        <div style={styles.planTitleArea}>
          <h2 style={{ color: theme.color }}>
            {theme.title} <span>({theme.sub})</span>
          </h2>

          <div style={{ ...styles.activeBadge, color: theme.color, borderColor: theme.color }}>
            🟢 ACTIVE INVESTMENT
          </div>
        </div>

        <div style={styles.darkIdBox} onClick={() => copyId(investmentId)}>
          <div style={styles.idBoxTopText}>INVESTMENT ID</div>
          <div style={styles.idBoxRow}>
            <b>{String(investmentId)}</b>
            <span style={styles.copyIcon}>📋</span>
          </div>
        </div>
      </div>

      <div style={styles.detailsGrid}>
        <Info icon="💰" title="REQUIRED INVESTMENT" value={money(requiredInvestment || amount)} color={theme.color} />
        <Info icon="🪙" title="INVESTED AMOUNT" value={money(investedAmount || monthlyReturn)} color={theme.color} />
        <Info icon="📈" title="EMI / MONTHLY RETURN" value={money(monthlyReturn)} color={theme.color} />
        <Info icon="⌛" title="YEARS / TENURE" value={`${years} Years`} color={theme.color} />
        <Info icon="📅" title="START DATE" value={date(inv.startDate || inv.createdAt)} color="#2563eb" />
        <Info icon="📅" title="END DATE" value={date(inv.endDate || inv.maturityDate)} color="#e11d48" />
        <Info icon="🔄" title="RENEW DATE" value={date(inv.renewDate || inv.endDate || inv.maturityDate)} color="#d97706" />
        <Info icon="%" title="RETURN RATE" value={`${returnRate}%`} color={theme.color} />
        <Info icon="🛡" title="STATUS" value={status} color={theme.color} />
      </div>

      <div style={styles.totalReturnBanner}>
        <div style={styles.totalReturnLeft}>
          <div style={styles.totalReturnIconBag}>💰</div>
          <div>
            <div style={styles.totalReturnTitle}>TOTAL RETURN</div>
            <div style={styles.totalReturnAmount}>{money(totalReturn)}</div>
          </div>
        </div>
        <div style={styles.totalReturnChartGraphic}>
          <svg width="180" height="45" viewBox="0 0 180 45" fill="none">
            <path d="M5 38C35 35 50 15 80 25C110 35 130 10 175 5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
            <path d="M5 40C40 38 65 20 95 28C125 36 145 15 175 8" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="175" cy="8" r="4" fill="#a855f7"/>
          </svg>
          <div style={styles.chartCurrencyBadge}>₹</div>
        </div>
      </div>

      <div style={styles.darkGrowthBox}>
        <div style={styles.growthLeftCol}>
          <div style={styles.growthTextHeader}>
            <span>Your Investment is</span>
            <span style={{ color: "#22c55e", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              Growing Steadily 📈
            </span>
          </div>

          <div style={styles.progressTrackDark}>
            <div style={{ ...styles.progressFillDark, width: `${progress}%` }} />
          </div>

          <div style={styles.progressLabels}>
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span style={styles.fivePercentBadge}>5%</span>
          </div>
        </div>

        <div style={styles.growthRightCol}>
          <div style={styles.expectedMaturityLabel}>Expected Maturity Amount</div>
          <div style={styles.expectedMaturityValue}>{money(maturityAmount)}</div>
          
          <div style={styles.maturityChartOverlay}>
            <svg width="140" height="35" viewBox="0 0 140 35" fill="none">
              <path d="M5 30C25 28 45 18 65 22C85 26 110 10 135 4" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="135" cy="4" r="3.5" fill="#fbbf24"/>
            </svg>
          </div>
        </div>
      </div>

      {/* রিনিউ নোটিশ কার্ড এবং ভিউ রিনিউ ডিটেইলস বেগুনি বাটন */}
      <div style={styles.renewNoticeCard}>
        <div style={styles.renewNoticeLeft}>
          <div style={styles.renewNoticeHourglass}>⏳</div>
          <div>
            <div style={styles.renewNoticeTextMain}>
              Renew due on {new Date(inv?.renewDate || inv?.nextRenewDate).toLocaleDateString("en-GB")}
            </div>
            <div style={styles.renewNoticeDaysLeft}>{daysLeft} Days Left</div>
          </div>
        </div>
        <button style={styles.viewRenewalDetailsBtn} onClick={() => renewNow(inv)}>
          <span>VIEW RENEWAL DETAILS</span>
          <span>›</span>
        </button>
      </div>

      <div style={styles.actions}>
        <button style={styles.actionBtnItem} onClick={() => viewDetails(inv)}>
          <span>👁 VIEW DETAILS</span>
          <span>›</span>
        </button>
        <button style={styles.actionBtnItem} onClick={() => certificate(inv)}>
          <span>🏅 CERTIFICATE</span>
          <span>›</span>
        </button>
        <button style={styles.actionBtnItem} onClick={() => downloadStatement(inv)}>
          <span>⬇️ STATEMENT</span>
          <span>›</span>
        </button>
        <button style={styles.renewBtnItem} onClick={() => renewNow(inv)}>
          <span>🔄 RENEW NOW</span>
          <span>›</span>
        </button>
      </div>
    </section>
  );
}

function Info({ icon, title, value, color }) {
  return (
    <div style={styles.info}>
      <div style={{ ...styles.infoIcon, color }}>{icon}</div>
      <div>
        <p style={styles.infoTitleText}>{title}</p>
        <h3 style={{ color, fontSize: "15px", fontWeight: "800", marginTop: "2px" }}>{value}</h3>
      </div>
    </div>
  );
}

function PlantIcon() {
  return (
    <div style={styles.plantIcon}>
      <span style={styles.leafA}></span>
      <span style={styles.leafB}></span>
      <span style={styles.stem}></span>
      <span style={styles.pot}>₹</span>
    </div>
  );
}

function RocketIcon() {
  return (
    <div style={styles.rocketIcon}>
      <span style={styles.rocketBody}></span>
      <span style={styles.rocketWindow}></span>
      <span style={styles.rocketFire}></span>
    </div>
  );
}

function BottomBanner() {
  return (
    <section style={styles.bottomBanner}>
      <div style={styles.trophy}>🏆</div>

      <div style={styles.bottomText}>
        <h2>Great Choice!</h2>
        <p>You are building a secure future for you and your family.</p>
      </div>

      <div style={styles.bottomBenefits}>
        <div>🎯 <b>Disciplined<br />Investing</b></div>
        <div>📊 <b>Better<br />Returns</b></div>
        <div>💎 <b>Financial<br />Freedom</b></div>
      </div>
    </section>
  );
}

const styles = {
  mainLayoutWrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#03082e",
  },

  leftSidebar: {
    width: "280px",
    background: "linear-gradient(180deg, #020617 0%, #071747 100%)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: "30px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    boxSizing: "border-box"
  },

  sidebarLogoWrap: {
    textAlign: "center"
  },

  sidebarTreeIcon: {
    fontSize: "52px",
    marginBottom: "10px"
  },

  sidebarBrandTitle: {
    color: "white",
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },

  sidebarBrandSub: {
    color: "#34d399",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.5px",
    marginTop: "4px"
  },

  sidebarGraphicArea: {
    position: "relative",
    height: "220px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingBottom: "10px"
  },

  sidebarChartBars: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    position: "absolute",
    left: "15px",
    bottom: "20px"
  },

  sBar: {
    width: "10px",
    background: "rgba(52, 211, 153, 0.25)",
    borderRadius: "4px 4px 0 0"
  },

  sidebarPlantBox: {
    position: "absolute",
    left: "65px",
    bottom: "20px",
    fontSize: "44px"
  },

  sidebarCoinsStack: {
    position: "absolute",
    left: "20px",
    bottom: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "-10px"
  },

  sCoin: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#f59e0b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "900",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
  },

  rightContentArea: {
    flex: 1,
    overflowY: "auto"
  },

  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#050842 0%,#082a93 38%,#dbeafe 100%)",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#101a3a"
  },

  wrap: {
    maxWidth: "980px",
    margin: "0 auto"
  },

  loading: {
    minHeight: "100vh",
    background: "#050842",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loadingBox: {
    background: "rgba(255,255,255,.12)",
    padding: "28px",
    borderRadius: "28px",
    textAlign: "center"
  },

  header: {
    height: "78px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    color: "white"
  },

  backBtn: {
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,.45)",
    background: "rgba(255,255,255,.08)",
    color: "white",
    fontSize: "34px",
    cursor: "pointer"
  },

  headerTitle: {
    flex: 1,
    textAlign: "center"
  },

  rightTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  secureBadge: {
    background: "rgba(255,255,255,.12)",
    borderRadius: "16px",
    padding: "12px 18px",
    fontWeight: "900"
  },

  bellBtn: {
    position: "relative",
    border: "none",
    background: "transparent",
    color: "white",
    fontSize: "28px",
    cursor: "pointer"
  },

  emptyBox: {
    marginTop: "40px",
    background: "white",
    borderRadius: "30px",
    padding: "45px 25px",
    textAlign: "center",
    boxShadow: "0 18px 35px rgba(15,23,42,.18)"
  },

  emptyIcon: {
    fontSize: "80px"
  },

  emptyBtn: {
    marginTop: "18px",
    border: "none",
    borderRadius: "18px",
    padding: "15px 26px",
    background: "linear-gradient(135deg,#16c784,#059669)",
    color: "white",
    fontWeight: "900",
    fontSize: "17px",
    cursor: "pointer"
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg,#2e1065,#4615a8,#1e0b58)",
    borderRadius: "28px",
    padding: "24px",
    minHeight: "225px",
    color: "white",
    display: "grid",
    gridTemplateColumns: "1fr 240px 1fr",
    gap: "12px",
    border: "1px solid rgba(255,255,255,.16)",
    boxShadow: "0 18px 35px rgba(0,0,0,.28)"
  },

  heroLeft: {
    zIndex: 2
  },

  heroRight: {
    zIndex: 2
  },

  heroItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px"
  },

  heroBottom: {
    gridColumn: "1 / 4",
    textAlign: "center",
    borderTop: "1px solid rgba(255,255,255,.15)",
    paddingTop: "14px",
    fontSize: "18px",
    zIndex: 2
  },

  safeArt: {
    position: "relative",
    width: "230px",
    height: "145px",
    margin: "0 auto"
  },

  safeBox: {
    position: "absolute",
    left: "62px",
    top: "5px",
    width: "110px",
    height: "105px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#a855f7,#5b21b6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ddd6fe",
    fontSize: "60px",
    boxShadow: "inset -12px -12px 0 rgba(0,0,0,.18),0 16px 22px rgba(0,0,0,.25)"
  },

  coin1: {
    position: "absolute",
    left: "20px",
    bottom: "18px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#fde047,#f59e0b)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    boxShadow: "0 8px 16px rgba(0,0,0,.25)"
  },

  coin2: {
    position: "absolute",
    left: "58px",
    bottom: "4px",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#facc15,#f97316)",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  shield: {
    position: "absolute",
    right: "20px",
    bottom: "10px",
    width: "65px",
    height: "78px",
    borderRadius: "26px 26px 35px 35px",
    background: "linear-gradient(135deg,#bbf7d0,#10b981)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px",
    fontWeight: "900",
    border: "5px solid #dcfce7",
    boxShadow: "0 10px 20px rgba(0,0,0,.22)"
  },

  card: {
    background: "linear-gradient(180deg,#ffffff,#f8fbff)",
    borderRadius: "28px",
    padding: "24px",
    marginTop: "14px",
    boxShadow: "0 15px 32px rgba(15,23,42,.14)",
    border: "1px solid rgba(255,255,255,.85)"
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "18px"
  },

  planLogo: {
    width: "98px",
    height: "98px",
    borderRadius: "50%",
    background: "radial-gradient(circle,#ffffff,#eefdf6)",
    boxShadow: "0 10px 24px rgba(0,0,0,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  planTitleArea: {
    flex: 1
  },

  activeBadge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid",
    fontWeight: "900",
    fontSize: "12px",
    background: "#f8fffb"
  },

  darkIdBox: {
    width: "250px",
    background: "linear-gradient(135deg, #071747 0%, #0c235c 100%)",
    borderRadius: "16px",
    padding: "12px 16px",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(7,23,71,0.25)",
    border: "1px solid rgba(255,255,255,0.1)"
  },

  idBoxTopText: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.8px",
    color: "#94a3b8",
    marginBottom: "4px"
  },

  idBoxRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "800"
  },

  copyIcon: {
    fontSize: "14px",
    background: "rgba(255,255,255,0.1)",
    padding: "4px 8px",
    borderRadius: "6px"
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    border: "1px solid #e5eaf3",
    borderRadius: "20px",
    overflow: "hidden",
    background: "#ffffff"
  },

  info: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "16px",
    borderRight: "1px solid #e5eaf3",
    borderBottom: "1px solid #e5eaf3"
  },

  infoTitleText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.3px"
  },

  infoIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
  },

  totalReturnBanner: {
    marginTop: "14px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf8ff 100%)",
    border: "1px solid #ede9fe",
    borderRadius: "18px",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  totalReturnLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  totalReturnIconBag: {
    fontSize: "36px",
    background: "#ede9fe",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  totalReturnTitle: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#6b21a8",
    letterSpacing: "0.5px"
  },

  totalReturnAmount: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#5b21b6",
    marginTop: "2px"
  },

  totalReturnChartGraphic: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },

  chartCurrencyBadge: {
    position: "absolute",
    right: "0",
    top: "-10px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#c084fc",
    color: "white",
    fontSize: "12px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  darkGrowthBox: {
    marginTop: "14px",
    background: "#071747",
    borderRadius: "20px",
    padding: "22px",
    color: "white",
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "20px",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(7,23,71,0.3)"
  },

  growthLeftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  growthTextHeader: {
    fontSize: "16px",
    fontWeight: "800",
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },

  progressTrackDark: {
    height: "10px",
    borderRadius: "20px",
    background: "#1e293b",
    overflow: "hidden",
    position: "relative",
    marginTop: "6px"
  },

  progressFillDark: {
    height: "100%",
    borderRadius: "20px",
    background: "linear-gradient(90deg, #16c784, #22c55e)"
  },

  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    marginTop: "2px"
  },

  fivePercentBadge: {
    background: "#f59e0b",
    color: "#071747",
    padding: "1px 6px",
    borderRadius: "6px",
    fontWeight: "900",
    fontSize: "10px"
  },

  growthRightCol: {
    textAlign: "right",
    position: "relative",
    paddingLeft: "15px",
    borderLeft: "1px solid rgba(255,255,255,0.1)"
  },

  expectedMaturityLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#94a3b8"
  },

  expectedMaturityValue: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#4ade80",
    marginTop: "4px"
  },

  maturityChartOverlay: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "2px"
  },

  // রিনিউ নোটিশ কার্ডের স্টাইল
  renewNoticeCard: {
    marginTop: "14px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
  },

  renewNoticeLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  renewNoticeHourglass: {
    fontSize: "24px",
    background: "#fef3c7",
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  renewNoticeTextMain: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#1e293b"
  },

  renewNoticeDaysLeft: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#d97706",
    marginTop: "2px"
  },

  viewRenewalDetailsBtn: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "12px 18px",
    fontSize: "12px",
    fontWeight: "900",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)"
  },

  actions: {
    marginTop: "14px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px"
  },

  actionBtnItem: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 10px",
    fontSize: "11px",
    fontWeight: "900",
    color: "#071747",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
  },

  renewBtnItem: {
    background: "#071747",
    border: "1px solid #071747",
    borderRadius: "14px",
    padding: "12px 10px",
    fontSize: "11px",
    fontWeight: "900",
    color: "white",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(7,23,71,0.25)"
  },

  bottomBanner: {
    marginTop: "14px",
    background: "linear-gradient(135deg,#fff7df,#ffffff)",
    borderRadius: "24px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 12px 28px rgba(15,23,42,.10)"
  },

  trophy: {
    fontSize: "74px"
  },

  bottomText: {
    flex: 1
  },

  bottomBenefits: {
    display: "flex",
    gap: "26px"
  },

  plantIcon: {
    position: "relative",
    width: "70px",
    height: "70px"
  },

  leafA: {
    position: "absolute",
    width: "32px",
    height: "22px",
    background: "#22c55e",
    borderRadius: "100% 0 100% 0",
    top: "8px",
    left: "10px"
  },

  leafB: {
    position: "absolute",
    width: "34px",
    height: "23px",
    background: "#16a34a",
    borderRadius: "0 100% 0 100%",
    top: "8px",
    right: "8px"
  },

  stem: {
    position: "absolute",
    width: "6px",
    height: "34px",
    background: "#15803d",
    left: "34px",
    top: "24px",
    borderRadius: "10px"
  },

  pot: {
    position: "absolute",
    bottom: "0",
    left: "18px",
    width: "40px",
    height: "26px",
    borderRadius: "0 0 14px 14px",
    background: "#f59e0b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  rocketIcon: {
    position: "relative",
    width: "70px",
    height: "70px"
  },

  rocketBody: {
    position: "absolute",
    width: "30px",
    height: "58px",
    borderRadius: "50% 50% 18px 18px",
    background: "linear-gradient(180deg,#bae6fd,#0284c7)",
    left: "22px",
    top: "0",
    transform: "rotate(28deg)"
  },

  rocketWindow: {
    position: "absolute",
    width: "13px",
    height: "13px",
    borderRadius: "50%",
    background: "#1d4ed8",
    left: "37px",
    top: "19px"
  },

  rocketFire: {
    position: "absolute",
    width: "30px",
    height: "30px",
    background: "linear-gradient(180deg,#facc15,#f97316)",
    borderRadius: "50% 50% 50% 0",
    left: "6px",
    bottom: "5px",
    transform: "rotate(25deg)"
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px"
  },

  modalBox: {
    width: "100%",
    maxWidth: "430px",
    background: "white",
    borderRadius: "22px",
    padding: "22px",
    color: "#071747",
    boxShadow: "0 25px 50px rgba(0,0,0,.25)"
  },

  slipRow: {
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "14px",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px"
  },

  greenBtn: {
    border: "none",
    borderRadius: "12px",
    padding: "11px 14px",
    background: "#16a34a",
    color: "white",
    fontWeight: "900",
    cursor: "pointer"
  },

  closeBtn: {
    width: "100%",
    marginTop: "16px",
    border: "none",
    borderRadius: "12px",
    padding: "13px",
    background: "#e5e7eb",
    color: "#071747",
    fontWeight: "900",
    cursor: "pointer"
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 8px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "16px"
  }
};
