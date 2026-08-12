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
                  daysLeft={getDaysLeft(inv?.renewDate || inv?.nextRenewDate)}  
                  isOverdue={isOverdue}            
                  requiredInvestment={inv.totalPlanAmount || inv.amount}
                  investedAmount={currentCardInvestedAmount} 
                  loadInvestments={loadInvestments}
                  setCustomAlert={(val) => setCustomAlert(val)}
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
                  <div style={styles.slipBrandingBox}>
                    <div style={styles.slipTreeIcon}>🌳</div>
                    <div style={styles.slipBrandTextWrap}>
                      <span style={styles.slipBrandTitle}>SAVE MONEY</span>
                      <span style={styles.slipBrandSub}>SIP INVEST PLAN</span>
                    </div>
                  </div>

                  <div style={styles.slipInfoBox}>
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
          <div style={{
            width: "100%",
            maxWidth: "380px",
            background: "white",
            borderRadius: "26px",
            padding: "30px 24px",
            color: "#071747",
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.35)",
            textAlign: "center",
            border: "1px solid rgba(255, 255, 255, 0.8)"
          }}>
            <div style={{ fontSize: "56px", marginBottom: "12px", display: "inline-block" }}>
              {customAlert.type === "details" ? "📊" : "ℹ️"}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "16px", color: "#071747" }}>
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
                cursor: "pointer"
              }} 
              onClick={() => setCustomAlert({ show: false, title: "", message: "", type: "info" })}
            >
              Okay, Got it
            </button>
          </div>
        </div>
      )}

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
        <HeroItem icon="💼" title="Required Investment" value={money(summary.totalInvestment)} />
        <HeroItem icon="💰" title="Invested Amount" value={money(summary.investedAmount || 0)} />
        <HeroItem icon="🌱" title="Total Return (All Time)" value={money(summary.totalReturn)} green />
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
  daysLeft,
  isOverdue,
  requiredInvestment,
  investedAmount,
  loadInvestments,
  setCustomAlert
}) {
  const [renewOpen, setRenewOpen] = useState(false);
  const API = "https://save-money-api.onrender.com";

  const renewDateText = () => {
    if (!inv?.renewDate && !inv?.nextRenewDate) return "N/A";
    return formatDate(inv.renewDate || inv.nextRenewDate);
  };

  const investmentId = inv.investmentId || inv._id || "SM000000";
  const amount = inv.amount || inv.totalAmount || inv.investAmount || 0;
  const monthlyReturn = inv.monthlyReturn || inv.monthlyEmi || inv.emi || 0;
  const years = inv.years || inv.tenure || inv.duration || 0;
  const returnRate = inv.returnRate || inv.interestRate || inv.rate || 0;
  const status = inv.status || "Active";
  const totalReturn = inv.totalReturn || inv.returnAmount || 0;
  const maturityAmount = inv.maturityAmount || Number(amount) + Number(totalReturn);
  
  // আপনার দেওয়া স্ক্রিনশট অনুযায়ী ফিক্সড ৫% প্রোগ্রেস
  const calculatedProgress = 5;

  return (
    <section style={styles.cardContainer}>
      {/* বামপাশের গোল্ডেন গাছ ও বার সেকশন (আপনার স্ক্রিনশট অনুযায়ী হুবহু গোল্ডেন থিম) */}
      <div style={styles.cardLeftSidebar}>
        <div style={styles.sidebarLogoWrap}>
          <div style={styles.sidebarTreeIcon}>🌳</div>
          <h2 style={styles.sidebarBrandTitle}>SAVE MONEY</h2>
          <p style={styles.sidebarBrandSub}>SIP INVEST PLAN</p>
        </div>

        <div style={styles.sidebarGraphicArea}>
          <div style={styles.sidebarChartBars}>
            <div style={{...styles.sBar, height: "30px"}}></div>
            <div style={{...styles.sBar, height: "50px"}}></div>
            <div style={{...styles.sBar, height: "70px"}}></div>
            <div style={{...styles.sBar, height: "95px"}}></div>
          </div>
          <div style={styles.sidebarPlantBox}>🌱</div>
          <div style={styles.sidebarCoinsStack}>
            <div style={styles.sCoin}>₹</div>
            <div style={styles.sCoin}>₹</div>
            <div style={styles.sCoin}>₹</div>
          </div>
        </div>
      </div>

      {/* ডানপাশের মূল ইনভেস্টমেন্ট কন্টেন্ট */}
      <div style={styles.cardRightContent}>
        <div style={styles.cardHeader}>
          <div style={styles.planLogo}>
            <PlantIcon />
          </div>

          <div style={styles.planTitleArea}>
            <h2 style={{ color: "#16c784" }}>
              Save Money <span>(SIP Invest Plan)</span>
            </h2>
            <div style={{ ...styles.activeBadge, color: "#16c784", borderColor: "#16c784" }}>
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
          <Info icon="💰" title="REQUIRED INVESTMENT" value={money(requiredInvestment || amount)} color="#16c784" />
          <Info icon="🪙" title="INVESTED AMOUNT" value={money(investedAmount || monthlyReturn)} color="#16c784" />
          <Info icon="📈" title="EMI / MONTHLY RETURN" value={money(monthlyReturn)} color="#16c784" />
          <Info icon="⌛" title="YEARS / TENURE" value={`${years} Years`} color="#16c784" />
          <Info icon="📅" title="START DATE" value={date(inv.startDate || inv.createdAt)} color="#2563eb" />
          <Info icon="📅" title="END DATE" value={date(inv.endDate || inv.maturityDate)} color="#e11d48" />
          <Info icon="🔄" title="RENEW DATE" value={date(inv.renewDate || inv.endDate || inv.maturityDate)} color="#d97706" />
          <Info icon="%" title="RETURN RATE" value={`${returnRate}%`} color="#16c784" />
          <Info icon="🛡" title="STATUS" value={status} color="#16c784" />
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
              <div style={{ ...styles.progressFillDark, width: `${calculatedProgress}%` }} />
            </div>

            <div style={styles.progressLabels}>
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span style={styles.fivePercentBadge}>{calculatedProgress}%</span>
            </div>
          </div>

          <div style={styles.growthRightCol}>
            <div style={styles.expectedMaturityLabel}>Expected Maturity Amount</div>
            <div style={styles.expectedMaturityValue}>{money(maturityAmount)}</div>
          </div>
        </div>

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
          <button style={styles.viewRenewalDetailsBtn} onClick={() => setRenewOpen(true)}>
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
          <button style={styles.renewBtnItem} onClick={() => setRenewOpen(true)}>
            <span>🔄 RENEW NOW</span>
            <span>›</span>
          </button>
        </div>
      </div>

      {renewOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h2>Renew Information</h2>
            <p>Your SIP renewal is due exactly after 30 days from your investment start date.</p>

            <h3>Renew Due Date</h3>
            <h2 style={{ color: "#16a34a" }}>{renewDateText()}</h2>

            <h3>Days Left For Renew</h3>
            {isOverdue(inv?.renewDate || inv?.nextRenewDate) ? (
              <h1 style={{ color: "#ef4444" }}>Overdue</h1>
            ) : (
              <h1 style={{ color: "#7c3aed" }}>{daysLeft} Days</h1>
            )}

            <p>
              Please renew on or before your renew due date. If the renew date is missed,
              your investment status may become inactive and bonus benefits may be affected.
            </p>

            <button
              style={styles.greenBtn}
              onClick={async () => {
                try {
                  const res = await axios.post(`${API}/renew-invest`, {
                    investmentId: inv._id
                  });

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
                  toast.error(err?.response?.data?.msg || "Renew failed");
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
  page: { minHeight: "100vh", background: "linear-gradient(180deg,#050842 0%,#082a93 38%,#dbeafe 100%)", padding: "24px", fontFamily: "Arial, sans-serif", color: "#101a3a" },
  wrap: { maxWidth: "1080px", margin: "0 auto" },
  loading: { minHeight: "100vh", background: "#050842", color: "white", display: "flex", justifyContent: "center", alignItems: "center" },
  loadingBox: { background: "rgba(255,255,255,.12)", padding: "28px", borderRadius: "28px", textAlign: "center" },
  header: { height: "78px", display: "flex", alignItems: "center", gap: "14px", color: "white" },
  backBtn: { width: "54px", height: "54px", borderRadius: "16px", border: "1px solid rgba(255,255,255,.45)", background: "rgba(255,255,255,.08)", color: "white", fontSize: "34px", cursor: "pointer" },
  headerTitle: { flex: 1, textAlign: "center" },
  rightTop: { display: "flex", alignItems: "center", gap: "12px" },
  secureBadge: { background: "rgba(255,255,255,.12)", borderRadius: "16px", padding: "12px 18px", fontWeight: "900" },
  bellBtn: { position: "relative", border: "none", background: "transparent", color: "white", fontSize: "28px", cursor: "pointer" },
  emptyBox: { marginTop: "40px", background: "white", borderRadius: "30px", padding: "45px 25px", textAlign: "center", boxShadow: "0 18px 35px rgba(15,23,42,.18)" },
  emptyIcon: { fontSize: "80px" },
  emptyBtn: { marginTop: "18px", border: "none", borderRadius: "18px", padding: "15px 26px", background: "linear-gradient(135deg,#16c784,#059669)", color: "white", fontWeight: "900", fontSize: "17px", cursor: "pointer" },
  hero: { position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#2e1065,#4615a8,#1e0b58)", borderRadius: "28px", padding: "24px", minHeight: "225px", color: "white", display: "grid", gridTemplateColumns: "1fr 240px 1fr", gap: "12px", border: "1px solid rgba(255,255,255,.16)", boxShadow: "0 18px 35px rgba(0,0,0,.28)", marginBottom: "16px" },
  heroLeft: { zIndex: 2 },
  heroRight: { zIndex: 2 },
  heroItem: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" },
  heroBottom: { gridColumn: "1 / 4", textAlign: "center", borderTop: "1px solid rgba(255,255,255,.15)", paddingTop: "14px", fontSize: "18px", zIndex: 2 },
  safeArt: { position: "relative", width: "230px", height: "145px", margin: "0 auto" },
  safeBox: { position: "absolute", left: "62px", top: "5px", width: "110px", height: "105px", borderRadius: "20px", background: "linear-gradient(135deg,#a855f7,#5b21b6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd6fe", fontSize: "60px" },
  coin1: { position: "absolute", left: "20px", bottom: "18px", width: "45px", height: "45px", borderRadius: "50%", background: "linear-gradient(135deg,#fde047,#f59e0b)", color: "#92400e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900" },
  coin2: { position: "absolute", left: "58px", bottom: "4px", width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg,#facc15,#f97316)", color: "#92400e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900" },
  shield: { position: "absolute", right: "20px", bottom: "10px", width: "65px", height: "78px", borderRadius: "26px 26px 35px 35px", background: "linear-gradient(135deg,#bbf7d0,#10b981)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", fontWeight: "900", border: "5px solid #dcfce7" },
  
  cardContainer: { display: "flex", background: "#ffffff", borderRadius: "28px", marginTop: "18px", boxShadow: "0 15px 32px rgba(15,23,42,.14)", border: "1px solid rgba(255,255,255,.85)", overflow: "hidden" },
  cardLeftSidebar: { width: "240px", background: "linear-gradient(180deg, #020617 0%, #071747 100%)", borderRight: "1px solid rgba(255,255,255,0.08)", padding: "24px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 },
  sidebarLogoWrap: { textAlign: "center" },
  sidebarTreeIcon: { fontSize: "46px", marginBottom: "6px" },
  sidebarBrandTitle: { color: "white", fontSize: "17px", fontWeight: "900", letterSpacing: "0.5px" },
  sidebarBrandSub: { color: "#34d399", fontSize: "10px", fontWeight: "800", letterSpacing: "1.2px", marginTop: "4px" },
  sidebarGraphicArea: { position: "relative", height: "160px", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "5px" },
  sidebarChartBars: { display: "flex", alignItems: "flex-end", gap: "6px", position: "absolute", left: "10px", bottom: "10px" },
  sBar: { width: "8px", background: "rgba(245, 158, 11, 0.25)", borderRadius: "3px 3px 0 0" },
  sidebarPlantBox: { position: "absolute", left: "55px", bottom: "10px", fontSize: "36px", filter: "drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))" },
  sidebarCoinsStack: { position: "absolute", left: "15px", bottom: "5px", display: "flex", flexDirection: "column" },
  sCoin: { width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg, #fde047, #d97706)", color: "#78350f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "900", boxShadow: "0 3px 8px rgba(0,0,0,0.3)" },
  
  cardRightContent: { flex: 1, padding: "22px", background: "linear-gradient(180deg,#ffffff,#f8fbff)" },
  cardHeader: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" },
  planLogo: { width: "80px", height: "80px", borderRadius: "50%", background: "radial-gradient(circle,#ffffff,#eefdf6)", boxShadow: "0 8px 20px rgba(0,0,0,.1)", display: "flex", alignItems: "center", justifyContent: "center" },
  planTitleArea: { flex: 1 },
  activeBadge: { display: "inline-block", marginTop: "6px", padding: "5px 10px", borderRadius: "6px", border: "1px solid", fontWeight: "900", fontSize: "11px", background: "#f8fffb" },
  darkIdBox: { width: "230px", background: "linear-gradient(135deg, #071747 0%, #0c235c 100%)", borderRadius: "14px", padding: "10px 14px", color: "white", cursor: "pointer", boxShadow: "0 6px 16px rgba(7,23,71,0.25)", border: "1px solid rgba(255,255,255,0.1)" },
  idBoxTopText: { fontSize: "9px", fontWeight: "700", color: "#94a3b8", marginBottom: "3px" },
  idBoxRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: "800" },
  copyIcon: { fontSize: "13px", background: "rgba(255,255,255,0.1)", padding: "3px 6px", borderRadius: "5px" },
  detailsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "1px solid #e5eaf3", borderRadius: "18px", overflow: "hidden", background: "#ffffff" },
  info: { display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRight: "1px solid #e5eaf3", borderBottom: "1px solid #e5eaf3" },
  infoTitleText: { fontSize: "10px", fontWeight: "700", color: "#64748b" },
  infoIcon: { width: "38px", height: "38px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" },
  totalReturnBanner: { marginTop: "14px", background: "linear-gradient(135deg, #f5f3ff 0%, #faf8ff 100%)", border: "1px solid #ede9fe", borderRadius: "16px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  totalReturnLeft: { display: "flex", alignItems: "center", gap: "12px" },
  totalReturnIconBag: { fontSize: "32px", background: "#ede9fe", width: "50px", height: "50px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  totalReturnTitle: { fontSize: "10px", fontWeight: "800", color: "#6b21a8" },
  totalReturnAmount: { fontSize: "22px", fontWeight: "900", color: "#5b21b6", marginTop: "2px" },
  totalReturnChartGraphic: { position: "relative", display: "flex", alignItems: "center" },
  chartCurrencyBadge: { position: "absolute", right: "0", top: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "#c084fc", color: "white", fontSize: "11px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center" },
  darkGrowthBox: { marginTop: "14px", background: "#071747", borderRadius: "18px", padding: "18px", color: "white", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px", alignItems: "center" },
  growthLeftCol: { display: "flex", flexDirection: "column", gap: "8px" },
  growthTextHeader: { fontSize: "15px", fontWeight: "800", display: "flex", flexDirection: "column", gap: "2px" },
  progressTrackDark: { height: "9px", borderRadius: "20px", background: "#1e293b", overflow: "hidden", position: "relative", marginTop: "4px" },
  progressFillDark: { height: "100%", borderRadius: "20px", background: "linear-gradient(90deg, #f59e0b, #fbbf24)" },
  progressLabels: { display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "700", color: "#94a3b8", marginTop: "2px" },
  fivePercentBadge: { background: "#f59e0b", color: "#071747", padding: "1px 5px", borderRadius: "5px", fontWeight: "900", fontSize: "9px" },
  growthRightCol: { textAlign: "right", position: "relative", paddingLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.1)" },
  expectedMaturityLabel: { fontSize: "11px", fontWeight: "700", color: "#94a3b8" },
  expectedMaturityValue: { fontSize: "22px", fontWeight: "900", color: "#4ade80", marginTop: "3px" },
  renewNoticeCard: { marginTop: "14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  renewNoticeLeft: { display: "flex", alignItems: "center", gap: "12px" },
  renewNoticeHourglass: { fontSize: "22px", background: "#fef3c7", width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  renewNoticeTextMain: { fontSize: "13px", fontWeight: "800", color: "#1e293b" },
  renewNoticeDaysLeft: { fontSize: "11px", fontWeight: "700", color: "#d97706", marginTop: "2px" },
  viewRenewalDetailsBtn: { background: "#7c3aed", color: "white", border: "none", borderRadius: "12px", padding: "10px 16px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  actions: { marginTop: "14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" },
  actionBtnItem: { background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "10px 8px", fontSize: "10px", fontWeight: "900", color: "#071747", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
  renewBtnItem: { background: "#071747", border: "1px solid #071747", borderRadius: "12px", padding: "10px 8px", fontSize: "10px", fontWeight: "900", color: "white", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
  bottomBanner: { marginTop: "16px", background: "linear-gradient(135deg,#fff7df,#ffffff)", borderRadius: "22px", padding: "18px", display: "flex", alignItems: "center", gap: "16px" },
  trophy: { fontSize: "64px" },
  bottomText: { flex: 1 },
  bottomBenefits: { display: "flex", gap: "22px" },
  plantIcon: { position: "relative", width: "56px", height: "56px" },
  leafA: { position: "absolute", width: "26px", height: "18px", background: "#22c55e", borderRadius: "100% 0 100% 0", top: "6px", left: "8px" },
  leafB: { position: "absolute", width: "28px", height: "19px", background: "#16a34a", borderRadius: "0 100% 0 100%", top: "6px", right: "6px" },
  stem: { position: "absolute", width: "5px", height: "28px", background: "#15803d", left: "27px", top: "18px", borderRadius: "8px" },
  pot: { position: "absolute", bottom: "0", left: "14px", width: "32px", height: "20px", borderRadius: "0 0 10px 10px", background: "#f59e0b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "12px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modalBox: { width: "100%", maxWidth: "450px", background: "white", borderRadius: "22px", padding: "22px", color: "#071747", boxShadow: "0 25px 50px rgba(0,0,0,.25)" },
  slipRow: { background: "#05082e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "14px", marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", color: "white" },
  slipBrandingBox: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.06)", padding: "8px 10px", borderRadius: "12px" },
  slipTreeIcon: { fontSize: "24px" },
  slipBrandTextWrap: { display: "flex", flexDirection: "column" },
  slipBrandTitle: { fontSize: "11px", fontWeight: "900", color: "white", letterSpacing: "0.5px" },
  slipBrandSub: { fontSize: "8px", fontWeight: "800", color: "#34d399", letterSpacing: "1px" },
  slipInfoBox: { flex: 1, paddingLeft: "4px" },
  greenBtn: { border: "none", borderRadius: "12px", padding: "10px 14px", background: "#16a34a", color: "white", fontWeight: "900", cursor: "pointer", fontSize: "12px" },
  closeBtn: { width: "100%", marginTop: "14px", border: "none", borderRadius: "12px", padding: "13px", background: "#e5e7eb", color: "#071747", fontWeight: "900", cursor: "pointer" },
  detailRow: { display: "flex", justifyContent: "space-between", padding: "12px 8px", borderBottom: "1px solid #f1f5f9", fontSize: "16px" }
};
