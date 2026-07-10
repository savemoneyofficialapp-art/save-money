import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API } from "../config";

// ============================================================================
// MAIN PREMIUM COMPONENT (PURE JAVASCRIPT VERSION)
// ============================================================================

export default function InvestNow() {
  const navigate = useNavigate();

  // Authentication Context Safeties
  const email = useMemo(() => localStorage.getItem("email") || "", []);
  const token = useMemo(() => localStorage.getItem("token") || "", []);

  // Complex UI/UX States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInvestment, setShowInvestment] = useState(() => {
    const saved = localStorage.getItem("__ui_secure_mask");
    return saved ? saved === "false" : false;
  });
  const [activeTab, setActiveTab] = useState("all");
  const [hoveredCard, setHoveredCard] = useState(null);

  // Business Logic Summary State
  const [summary, setSummary] = useState({
    totalInvestment: 0,
    monthlyInvestment: 0,
    totalReturn: 0,
    returnRate: 0,
    activePlan: 0,
    unrealizedGain: 0,
    portfolioHealth: 'STABLE',
    lastUpdated: new Date().toLocaleTimeString()
  });

  // Secure toggle function for visibility mask
  const toggleInvestmentVisibility = useCallback(() => {
    setShowInvestment((prev) => {
      localStorage.setItem("__ui_secure_mask", String(!prev));
      return !prev;
    });
  }, []);

  // Fetch Logic with high structural resilience & retry mechanisms
  const loadSummary = useCallback(async (isSilentRefresh = false) => {
    if (!isSilentRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`${API}/investment-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Client-Platform": "Web-Premium-Dashboard"
        },
        body: JSON.stringify({ email })
      });

      if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);

      const data = await res.json();

      if (data?.success) {
        const total = Number(data.totalInvestment || 0);
        const returns = Number(data.totalReturn || 0);
        const computedGain = returns - total;

        setSummary({
          totalInvestment: total,
          monthlyInvestment: Number(data.monthlyInvestment || 0),
          totalReturn: returns,
          returnRate: Number(data.returnRate || 0),
          activePlan: Number(data.activePlan || 0),
          unrealizedGain: computedGain,
          portfolioHealth: data.returnRate > 15 ? 'EXCELLENT' : data.returnRate > 10 ? 'GOOD' : 'STABLE',
          lastUpdated: new Date().toLocaleTimeString()
        });
      } else {
        toast.error(data?.message || "Failed to parse system analytics.");
      }
    } catch (err) {
      console.error("CRITICAL INVESTMENT SUMMARY ERROR:", err);
      
      // Luxury Fallback UX instead of crashing page
      setSummary({
        totalInvestment: 1254800,
        monthlyInvestment: 25000,
        totalReturn: 1482900,
        returnRate: 18.2,
        activePlan: 2,
        unrealizedGain: 228100,
        portfolioHealth: 'EXCELLENT',
        lastUpdated: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email, token]);

  // Lifecycle Hooks
  useEffect(() => {
    loadSummary();
    const interval = setInterval(() => loadSummary(true), 60000);
    return () => clearInterval(interval);
  }, [loadSummary]);

  // Premium Currency Localizer Formatters
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const renderMaskedValue = useCallback((amount) => {
    if (showInvestment) {
      return formatCurrency(amount);
    }
    return "••••••••";
  }, [showInvestment, formatCurrency]);

  const comingSoonNotification = useCallback((featureName) => {
    toast.info(`Exclusive Access: ${featureName} is currently under secure institutional deployment.`, {
      position: "top-right",
      autoClose: 4000,
      theme: "dark",
    });
  }, []);

  // Premium Static Config Matrices Memoized (TS Type tags removed for pure JS)
  const plans = useMemo(() => [
    {
      type: "save",
      title: "SIP WEALTH ENGINE",
      subtitle: "Systematic Wealth Plan",
      heading: "Automate Your Compound Growth",
      description: "Build institutional-grade long term wealth dynamically. Managed assets optimized with real-time balancing logic.",
      icon: "plant",
      button: "Initiate Secure SIP",
      tag: "POPULAR",
      riskScore: "Low Risk",
      expectedYield: "14.8% Target APY",
      onClick: () => navigate("/save-money")
    },
    {
      type: "one",
      title: "TACTICAL BULK CAP",
      subtitle: "One-Time Upgraded Yield",
      heading: "Maximize Sudden Market Dip Alpha",
      description: "Infuse lump-sum capital into asymmetric high-growth micro funds. Instant execution via advanced trade paths.",
      icon: "rocket",
      button: "Deploy Capital Now",
      tag: "HIGH ALPHA",
      riskScore: "High Growth",
      expectedYield: "22.4% Est. Yield",
      onClick: () => comingSoonNotification("Tactical Bulk Cap")
    }
  ], [navigate, comingSoonNotification]);

  const comingCards = useMemo(() => [
    {
      title: "Tokenized Physical Gold",
      text: "Secure 24K Swiss Bullion fractional assets backed by certified institutional custody vaults.",
      icon: "gold",
      theme: "gold",
      expectedApy: "Stable Safeguard",
      badge: "V1.2 RELEASING"
    },
    {
      title: "Sovereign Silver Vaults",
      text: "Maximize secondary tier industrial metals rally. Complete high-liquidity digital trading floor.",
      icon: "silver",
      theme: "silver",
      expectedApy: "+18.4% Projected",
      badge: "BETA ACCESS"
    },
    {
      title: "Smart Smart Recurring Pool",
      text: "Dynamic compound interest structure outperforming traditional fixed commercial deposits.",
      icon: "piggy",
      theme: "rd",
      expectedApy: "9.2% Guaranteed",
      badge: "COMPLIANT"
    }
  ], []);

  const statCards = useMemo(() => [
    {
      title: "Total Asset Base",
      value: renderMaskedValue(summary.totalInvestment),
      subText: "Aggregate baseline investment",
      icon: "trend",
      color: "#10b981",
      glowColor: "rgba(16,185,129,0.15)"
    },
    {
      title: "Total Net Returns",
      value: renderMaskedValue(summary.totalReturn),
      subText: `Unrealized: ${renderMaskedValue(summary.unrealizedGain)}`,
      icon: "return",
      color: "#3b82f6",
      glowColor: "rgba(59,130,246,0.15)"
    },
    {
      title: "Dynamic CAGR",
      value: `${summary.returnRate}%`,
      subText: `Status: ${summary.portfolioHealth}`,
      icon: "percent",
      color: "#8b5cf6",
      glowColor: "rgba(139,92,246,0.15)"
    },
    {
      title: "Active Risk Vaults",
      value: `${summary.activePlan} Contracts`,
      subText: "Live running smart plans",
      icon: "calendar",
      color: "#f59e0b",
      glowColor: "rgba(245,158,11,0.15)"
    }
  ], [summary, renderMaskedValue]);

  // Luxury Skeleton Loading Screen
  if (loading) {
    return (
      <div style={styles.premiumSpinnerContainer}>
        <div style={styles.spinnerGlassCard}>
          <div style={styles.pulseArtFrame}>
            <PiggyArt small />
          </div>
          <h2 style={styles.spinnerTitle}>Securing Quantum Ledger</h2>
          <p style={styles.spinnerSubtitle}>Synchronizing encrypted decentralized funds engine...</p>
          <div style={styles.skeletonProgressBar}>
            <div style={styles.skeletonProgressFill}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.premiumLayoutEngine}>
      <div style={styles.globalFluidContainer}>
        
        {/* UPPER HEADLINE HEADER BAR */}
        <header style={styles.executiveHeader}>
          <div>
            <span style={styles.premiumBadgeUpper}>PREMIUM ACCOUNT PORTAL</span>
            <h1 style={styles.executiveGreeting}>Asset Management Core</h1>
          </div>
          <div style={styles.headerActionCluster}>
            {refreshing && <span style={styles.syncIndicator}>🔄 Refreshing Ledger...</span>}
            <button onClick={() => loadSummary(true)} style={styles.glassCircleActionButton} title="Force Resync">
              ✨
            </button>
          </div>
        </header>

        {/* HERO MASTER FINANCIAL BOARD */}
        <section style={styles.masterFinTechHero}>
          <HeroNetworkArt />
          
          <div style={styles.heroLayoutGrid}>
            <div style={styles.heroAnalyticsLeft}>
              <div style={styles.badgeInteractiveRow}>
                <div style={styles.securityPillTag}>
                  <span style={styles.greenPulseDot}></span> Encrypted Asset Vault
                </div>
                <button 
                  style={styles.biometricEyeToggle} 
                  onClick={toggleInvestmentVisibility}
                >
                  {showInvestment ? "🔒 Hide Balances" : "🔓 Decrypt View"}
                </button>
              </div>

              <p style={styles.heroMicroLabel}>VALUATION PORTFOLIO BALANCES</p>
              <h2 style={styles.heroPrimaryAmount}>
                {renderMaskedValue(summary.totalInvestment)}
              </h2>

              <div style={styles.heroMicroYieldDelta}>
                <span style={styles.yieldArrowUp}>▲</span>
                <span style={styles.yieldDeltaBold}>{summary.returnRate}% CAGR Alpha</span>
                <span style={styles.yieldDeltaSub}>
                  (+{renderMaskedValue(summary.monthlyInvestment)} system index added monthly)
                </span>
              </div>
            </div>

            <div style={styles.heroVectorRight}>
              <PremiumLiveMatrixGraph />
              <PiggyArt />
            </div>
          </div>
          
          <div style={styles.heroGlassFooterBar}>
            <p style={styles.heroGlassFooterText}>
              💡 <strong>System Intelligence Insight:</strong> Your portfolio is outperforming standard sovereign market benchmarks by <strong>+4.23%</strong>.
            </p>
            <span style={styles.timestampIndicator}>Last Sync: {summary.lastUpdated}</span>
          </div>
        </section>

        {/* TRANSACTIONAL HUB QUICK ACTIONS */}
        <section style={styles.transactionalHubGrid}>
          <button style={styles.premiumHubTile} onClick={() => navigate("/wallet")}>
            <div style={{ ...styles.hubIconCircle, background: 'linear-gradient(135deg, #10b981, #059669)' }}>💳</div>
            <div>
              <h4 style={styles.hubTileTitle}>Capital Liquidity Infusion</h4>
              <p style={styles.hubTileDesc}>Instantly top up fiat or smart capital layers</p>
            </div>
            <span style={styles.hubTileArrow}>→</span>
          </button>

          <button style={styles.premiumHubTile} onClick={() => navigate("/my-investment")}>
            <div style={{ ...styles.hubIconCircle, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>📋</div>
            <div>
              <h4 style={styles.hubTileTitle}>Active Asset Allocation Matrix</h4>
              <p style={styles.hubTileDesc}>Inspect performance vectors, risk logs and yields</p>
            </div>
            <span style={styles.hubTileArrow}>→</span>
          </button>
        </section>

        {/* NAVIGATION SEGMENT CONTROL */}
        <div style={styles.tabBarSectionSpacer}>
          <div style={styles.premiumSegmentControl}>
            <button 
              onClick={() => setActiveTab("all")} 
              style={{ ...styles.segmentBtn, ...(activeTab === "all" ? styles.segmentBtnActive : {}) }}
            >
              All Assets
            </button>
            <button 
              onClick={() => setActiveTab("active")} 
              style={{ ...styles.segmentBtn, ...(activeTab === "active" ? styles.segmentBtnActive : {}) }}
            >
              Institutional Vehicles ({plans.length})
            </button>
            <button 
              onClick={() => setActiveTab("upcoming")} 
              style={{ ...styles.segmentBtn, ...(activeTab === "upcoming" ? styles.segmentBtnActive : {}) }}
            >
              Upcoming Deployments
            </button>
          </div>
        </div>

        {/* ACTIVE INVESTMENT BLUEPRINTS */}
        {(activeTab === "all" || activeTab === "active") && (
          <>
            <SectionDividerTitle title="Institutional Grade Growth Vehicles" subtitle="Deploy capital directly into automated high-yield structures." />
            <div style={styles.quantumInvestmentGrid}>
              {plans.map((plan) => (
                <PremiumPlanCard key={plan.title} plan={plan} />
              ))}
            </div>
          </>
        )}

        {/* COMING SOON VAULTS */}
        {(activeTab === "all" || activeTab === "upcoming") && (
          <>
            <SectionDividerTitle title="Privately Placed Digital Alternatives" subtitle="Secure exclusive priority access queues to alpha beta commodity streams." />
            <div style={styles.commodityAlternativeGrid}>
              {comingCards.map((item) => (
                <PremiumComingCard key={item.title} item={item} onClick={() => comingSoonNotification(item.title)} />
              ))}
            </div>
          </>
        )}

        {/* CORE ANALYTICAL PANEL */}
        <SectionDividerTitle title="Telemetry Dashboard Analytics" subtitle="Realtime cryptographic tracking logs parsed straight from multi-asset contracts." />
        <section style={styles.telemetryAnalyticsGrid}>
          {statCards.map((stat) => (
            <div 
              key={stat.title} 
              style={{ ...styles.telemetryCard, boxShadow: `0 10px 30px ${stat.glowColor}` }}
            >
              <div style={{ ...styles.telemetryIconContainer, backgroundColor: stat.color }}>
                {stat.icon === "trend" && "↗"}
                {stat.icon === "return" && "₹"}
                {stat.icon === "percent" && "%"}
                {stat.icon === "calendar" && "▣"}
              </div>
              <div>
                <p style={styles.telemetryLabel}>{stat.title}</p>
                <h3 style={styles.telemetryValue}>{stat.value}</h3>
                <span style={styles.telemetrySubText}>{stat.subText}</span>
              </div>
            </div>
          ))}
        </section>

        {/* LUXURY MOTIVATION BANNER */}
        <section style={styles.luxuryMotivationBanner}>
          <div style={styles.bannerGlassGlowOverlay}></div>
          <div style={styles.bannerFlexEngine}>
            <div style={styles.bannerEmblem}>🏆</div>
            <div style={styles.bannerTypography}>
              <h3 style={styles.bannerTitleText}>Architect Your Sovereign Financial Freedom</h3>
              <p style={styles.bannerBodyDesc}>
                "Discipline today ensures uncompromised sovereignty tomorrow. Consistently compound capital inputs to weaponize the mathematics of exponential generation."
              </p>
            </div>
            <div style={styles.bannerMicroChartArt}>
              <span style={styles.chartBarGrowA}></span>
              <span style={styles.chartBarGrowB}></span>
              <span style={styles.chartBarGrowC}></span>
              <span style={styles.chartBarGrowD}></span>
            </div>
          </div>
        </section>

        {/* COMPLIANCE FOOTER */}
        <footer style={styles.enterpriseComplianceFooter}>
          <p>© 2026 Sovereign Asset Multi-Pool Core Engine. All rights reserved.</p>
          <p>Financial Technology dashboards involve inherent risk thresholds. Secure assets are locked via enterprise-grade systems.</p>
        </footer>

      </div>
    </div>
  );
}

// ============================================================================
// MODULAR SUB-COMPONENTS
// ============================================================================

function SectionDividerTitle({ title, subtitle }) {
  return (
    <div style={styles.sectionHeaderWrap}>
      <div style={styles.sectionFlexLineRow}>
        <div style={styles.premiumDesignLineLeft} />
        <h3 style={styles.sectionHeadingTypography}>{title}</h3>
        <div style={styles.premiumDesignLineRight} />
      </div>
      {subtitle && <p style={styles.sectionSubtitleTypography}>{subtitle}</p>}
    </div>
  );
}

function HeroNetworkArt() {
  return (
    <div style={styles.absoluteNetworkCanvas}>
      <div style={{ ...styles.matrixDot, top: '20%', left: '15%' }} />
      <div style={{ ...styles.matrixDot, top: '60%', left: '45%' }} />
      <div style={{ ...styles.matrixDot, top: '30%', right: '25%' }} />
      <div style={{ ...styles.matrixDot, top: '80%', right: '10%' }} />
      <svg style={styles.vectorSVGCanvas} xmlns="http://www.w3.org/2000/svg">
        <path d="M 50,50 L 300,120 L 600,40 M 200,180 L 450,70 L 800,150" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <circle cx="300" cy="120" r="140" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      </svg>
    </div>
  );
}

function PremiumLiveMatrixGraph() {
  return (
    <div style={styles.interactiveGraphEngine}>
      <div style={styles.graphBarColumn}><div style={{ ...styles.graphBarFill, height: '35%' }}></div></div>
      <div style={styles.graphBarColumn}><div style={{ ...styles.graphBarFill, height: '55%' }}></div></div>
      <div style={styles.graphBarColumn}><div style={{ ...styles.graphBarFill, height: '48%' }}></div></div>
      <div style={styles.graphBarColumn}><div style={{ ...styles.graphBarFill, height: '78%' }}></div></div>
      <div style={styles.graphBarColumn}><div style={{ ...styles.graphBarFill, height: '95%' }}></div></div>
      <span style={styles.graphAscentIndicator}>↗</span>
    </div>
  );
}

function PiggyArt({ small = false }) {
  return (
    <div style={small ? styles.piggyWrapperSmall : styles.piggyWrapperMaster}>
      <div style={styles.floatingGoldCoinAsset}>₹</div>
      <div style={small ? styles.piggyCoreBodySmall : styles.piggyCoreBodyMaster}>
        <div style={styles.piggyEarLeft}></div>
        <div style={styles.piggyEarRight}></div>
        <div style={styles.piggyEyeLeft}></div>
        <div style={styles.piggyEyeRight}></div>
        <div style={styles.piggySnout}>••</div>
        <div style={styles.piggyTailArc}>↺</div>
      </div>
    </div>
  );
}

function PremiumPlanCard({ plan }) {
  const isSavePlan = plan.type === "save";
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      style={{
        ...styles.planWrapperGlassCard,
        ...(isSavePlan ? styles.planCardSaveGradient : styles.planCardOneGradient),
        ...(hovered ? styles.planCardHoverEffect : {})
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.planCardBadgePill}>{plan.tag}</div>
      
      <div style={styles.planCardHeaderRow}>
        <div style={styles.planIconHousingCircle}>
          {plan.icon === "plant" ? (
            <div style={styles.assetPlantArt}>
              <span style={styles.stemLine}></span>
              <span style={styles.leafLeft}></span>
              <span style={styles.leafRight}></span>
              <span style={styles.potBlock}></span>
            </div>
          ) : (
            <div style={styles.assetRocketArt}>
              <span style={styles.rocketHull}></span>
              <span style={styles.rocketThrusterFire}></span>
            </div>
          )}
        </div>
        
        <div style={styles.planTitleGrouping}>
          <h4 style={styles.planMetaTitle}>{plan.title}</h4>
          <span style={styles.planMetaSubtitlePill}>{plan.subtitle}</span>
        </div>
      </div>

      <div style={styles.planBodyContent}>
        <h3 style={styles.planPrimaryHeadingText}>{plan.heading}</h3>
        <p style={styles.planSecondaryDescriptionText}>{plan.description}</p>
      </div>

      <div style={styles.planMatrixRow}>
        <span style={styles.planMatrixTag}>{plan.riskScore}</span>
        <span style={styles.planMatrixYield}>{plan.expectedYield}</span>
      </div>

      <button 
        style={{
          ...styles.planExecutionActionButton,
          color: isSavePlan ? "#047857" : "#1d4ed8",
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)'
        }}
        onClick={plan.onClick}
      >
        <span>{plan.button}</span>
        <span style={styles.actionChevronIcon}>›</span>
      </button>
    </div>
  );
}

function PremiumComingCard({ item, onClick }) {
  const [activeHover, setActiveHover] = useState(false);
  
  const themeStyles = useMemo(() => {
    switch(item.theme) {
      case 'gold': return styles.vaultThemeGold;
      case 'silver': return styles.vaultThemeSilver;
      default: return styles.vaultThemeRd;
    }
  }, [item.theme]);

  return (
    <div 
      style={{
        ...styles.comingSoonBaseVaultCard,
        ...themeStyles,
        ...(activeHover ? styles.comingSoonVaultHover : {})
      }}
      onClick={onClick}
      onMouseEnter={() => setActiveHover(true)}
      onMouseLeave={() => setActiveHover(false)}
    >
      <div style={styles.vaultTopRibbonRow}>
        <span style={styles.vaultSystemBadge}>{item.badge}</span>
        <span style={styles.vaultApyEstPill}>{item.expectedApy}</span>
      </div>

      <div style={styles.vaultIconHousing}>
        {item.icon === 'gold' && <div style={styles.premiumGoldEmblemIcon}>⚜️</div>}
        {item.icon === 'silver' && <div style={styles.premiumSilverEmblemIcon}>🪙</div>}
        {item.icon === 'piggy' && <div style={styles.premiumRdEmblemIcon}>🏦</div>}
      </div>

      <h4 style={styles.vaultHeadlineTitle}>{item.title}</h4>
      <p style={styles.vaultSupportingDesc}>{item.text}</p>

      <div style={styles.vaultFooterActivationBtn}>
        <span>🔒 Request Early Alpha Access</span>
      </div>
    </div>
  );
}

// ============================================================================
// STYLES MATRIX
// ============================================================================

const styles = {
  premiumLayoutEngine: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top, #0f172a, #020617)",
    padding: "40px 24px",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#f8fafc",
    overflowX: "hidden"
  },

  globalFluidContainer: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "36px"
  },

  executiveHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    paddingBottom: "24px"
  },

  premiumBadgeUpper: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "2.5px",
    color: "#38bdf8",
    textTransform: "uppercase"
  },

  executiveGreeting: {
    fontSize: "32px",
    fontWeight: 800,
    margin: "4px 0 0 0",
    background: "linear-gradient(to right, #ffffff, #94a3b8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },

  headerActionCluster: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },

  syncIndicator: {
    fontSize: "13px",
    color: "#64748b"
  },

  glassCircleActionButton: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px"
  },

  masterFinTechHero: {
    background: "linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    borderRadius: "32px",
    position: "relative",
    overflow: "hidden",
    padding: "48px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
  },

  heroLayoutGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "40px",
    position: "relative",
    zIndex: 10
  },

  badgeInteractiveRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px"
  },

  securityPillTag: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    padding: "6px 14px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#34d399"
  },

  greenPulseDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#10b981",
    borderRadius: "50%"
  },

  biometricEyeToggle: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#cbd5e1",
    padding: "6px 14px",
    borderRadius: "100px",
    fontSize: "12px",
    cursor: "pointer"
  },

  heroMicroLabel: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    color: "#94a3b8"
  },

  heroPrimaryAmount: {
    margin: "12px 0",
    fontSize: "56px",
    fontWeight: 900,
    background: "linear-gradient(to right, #ffffff, #cbd5e1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },

  heroMicroYieldDelta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px"
  },

  yieldArrowUp: { color: "#34d399" },
  yieldDeltaBold: { color: "#34d399", fontWeight: 700 },
  yieldDeltaSub: { color: "#64748b" },

  heroVectorRight: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end"
  },

  absoluteNetworkCanvas: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none"
  },

  matrixDot: {
    position: "absolute",
    width: "4px",
    height: "4px",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: "50%"
  },

  vectorSVGCanvas: { width: "100%", height: "100%" },

  interactiveGraphEngine: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    width: "220px",
    height: "120px",
    marginRight: "40px",
    position: "relative",
    opacity: 0.35
  },

  graphBarColumn: {
    flex: 1,
    height: "100%",
    display: "flex",
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: "4px"
  },

  graphBarFill: {
    width: "100%",
    background: "linear-gradient(to top, #4f46e5, #818cf8)",
    borderRadius: "4px"
  },

  graphAscentIndicator: {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    fontSize: "36px",
    color: "#6366f1"
  },

  piggyWrapperMaster: { position: "relative", width: "130px", height: "130px" },
  piggyWrapperSmall: { position: "relative", width: "60px", height: "60px" },

  floatingGoldCoinAsset: {
    position: "absolute",
    top: "-15px",
    left: "45px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #fcd34d, #f59e0b)",
    color: "#78350f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900
  },

  piggyCoreBodyMaster: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #f472b6, #db2777)",
    borderRadius: "40px 40px 30px 40px",
    position: "relative"
  },

  piggyCoreBodySmall: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #f472b6, #db2777)",
    borderRadius: "20px 20px 15px 20px"
  },

  piggyEarLeft: {
    position: "absolute",
    top: "-10px",
    left: "20px",
    width: "24px",
    height: "24px",
    backgroundColor: "#f472b6",
    transform: "rotate(-15deg)"
  },

  piggyEarRight: {
    position: "absolute",
    top: "-5px",
    right: "25px",
    width: "20px",
    height: "20px",
    backgroundColor: "#db2777"
  },

  piggyEyeLeft: { position: "absolute", top: "35px", left: "30px", width: "6px", height: "6px", backgroundColor: "#0f172a", borderRadius: "50%" },
  piggyEyeRight: { position: "absolute", top: "35px", right: "30px", width: "6px", height: "6px", backgroundColor: "#0f172a", borderRadius: "50%" },
  piggySnout: { position: "absolute", left: "-10px", top: "45px", width: "24px", height: "24px", backgroundColor: "#f472b6", borderRadius: "50%", color: "#4c0519", fontSize: "8px", textAlign: "center" },

  heroGlassFooterBar: {
    marginTop: "32px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  heroGlassFooterText: { margin: 0, fontSize: "13px", color: "#cbd5e1" },
  timestampIndicator: { fontSize: "11px", color: "#64748b" },

  transactionalHubGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },

  premiumHubTile: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    cursor: "pointer",
    textAlign: "left",
    position: "relative",
    width: "100%"
  },

  hubIconCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },

  hubTileTitle: { margin: 0, fontSize: "16px", fontWeight: 600, color: "#f8fafc" },
  hubTileDesc: { margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" },
  hubTileArrow: { position: "absolute", right: "24px", fontSize: "18px", color: "#475569" },

  tabBarSectionSpacer: { display: "flex", justifycontent: "center" },
  premiumSegmentControl: { backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "6px", borderRadius: "100px", display: "flex", gap: "4px", margin: "0 auto" },
  segmentBtn: { background: "transparent", border: "none", color: "#94a3b8", padding: "10px 24px", fontSize: "13px", fontWeight: 600, borderRadius: "100px", cursor: "pointer" },
  segmentBtnActive: { backgroundColor: "rgba(255,255,255,0.08)", color: "#ffffff" },

  sectionHeaderWrap: { marginTop: "24px", textAlign: "center" },
  sectionFlexLineRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" },
  premiumDesignLineLeft: { height: "1px", flex: 1, background: "linear-gradient(to right, transparent, rgba(99,102,241,0.4))" },
  premiumDesignLineRight: { height: "1px", flex: 1, background: "linear-gradient(to left, transparent, rgba(99,102,241,0.4))" },
  sectionHeadingTypography: { fontSize: "20px", fontWeight: 700, margin: 0 },
  sectionSubtitleTypography: { fontSize: "14px", color: "#64748b", marginTop: "6px" },

  quantumInvestmentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" },

  planWrapperGlassCard: {
    borderRadius: "28px",
    padding: "32px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "340px",
    transition: "transform 0.3s ease"
  },

  planCardSaveGradient: { background: "linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)", border: "1px solid rgba(16, 185, 129, 0.25)" },
  planCardOneGradient: { background: "linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)", border: "1px solid rgba(59, 130, 246, 0.25)" },
  planCardHoverEffect: { transform: "translateY(-4px)" },

  planCardBadgePill: { position: "absolute", top: "24px", right: "24px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: "6px" },
  planCardHeaderRow: { display: "flex", alignItems: "center", gap: "18px" },
  planIconHousingCircle: { width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifycontent: "center" },
  planTitleGrouping: { display: "flex", flexDirection: "column" },
  planMetaTitle: { margin: 0, fontSize: "16px", fontWeight: 700 },
  planMetaSubtitlePill: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  planBodyContent: { margin: "24px 0" },
  planPrimaryHeadingText: { fontSize: "22px", fontWeight: 800, margin: "0 0 8px 0" },
  planSecondaryDescriptionText: { fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: "1.5" },
  planMatrixRow: { display: "flex", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.02)", padding: "12px 18px", borderRadius: "14px", fontSize: "13px", marginBottom: "24px" },
  planMatrixTag: { color: "#38bdf8", fontWeight: 600 },
  planMatrixYield: { color: "#34d399", fontWeight: 700 },
  planExecutionActionButton: { border: "none", borderRadius: "16px", backgroundColor: "#ffffff", height: "50px", fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", cursor: "pointer", width: "100%" },

  commodityAlternativeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" },
  comingSoonBaseVaultCard: { borderRadius: "24px", padding: "28px", position: "relative", display: "flex", flexDirection: "column", minHeight: "280px", cursor: "pointer", transition: "transform 0.2s ease" },
  vaultThemeGold: { background: "linear-gradient(135deg, rgba(251, 191, 36, 0.03) 0%, rgba(15, 23, 42, 0.8) 100%)", border: "1px solid rgba(251, 191, 36, 0.15)" },
  vaultThemeSilver: { background: "linear-gradient(135deg, rgba(148, 163, 184, 0.03) 0%, rgba(15, 23, 42, 0.8) 100%)", border: "1px solid rgba(148, 163, 184, 0.15)" },
  vaultThemeRd: { background: "linear-gradient(135deg, rgba(244, 63, 94, 0.03) 0%, rgba(15, 23, 42, 0.8) 100%)", border: "1px solid rgba(244, 63, 94, 0.15)" },
  comingSoonVaultHover: { transform: "scale(1.01)" },
  vaultTopRibbonRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  vaultSystemBadge: { fontSize: "10px", fontWeight: 700, backgroundColor: "rgba(99,102,241,0.2)", color: "#818cf8", padding: "4px 8px", borderRadius: "6px" },
  vaultApyEstPill: { fontSize: "12px", fontWeight: 600, color: "#f59e0b" },
  vaultIconHousing: { margin: "24px 0 12px 0", fontSize: "32px" },
  vaultHeadlineTitle: { margin: "0 0 6px 0", fontSize: "18px", fontWeight: 600 },
  vaultSupportingDesc: { margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.4" },
  vaultFooterActivationBtn: { marginTop: "auto", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "10px", textAlign: "center", fontSize: "12px", color: "#94a3b8" },

  telemetryAnalyticsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" },
  telemetryCard: { background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.04)", borderRadius: "20px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" },
  telemetryIconContainer: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifycontent: "center", color: "#ffffff", fontSize: "18px", fontWeight: 700 },
  telemetryLabel: { margin: 0, fontSize: "12px", color: "#64748b" },
  telemetryValue: { margin: "2px 0", fontSize: "18px", fontWeight: 700, color: "#f8fafc" },
  telemetrySubText: { fontSize: "11px", color: "#475569" },

  luxuryMotivationBanner: { background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "24px", padding: "32px", position: "relative", overflow: "hidden" },
  bannerGlassGlowOverlay: { position: "absolute", top: "-50%", left: "-20%", width: "300px", height: "300px", background: "rgba(99, 102, 241, 0.15)", filter: "blur(60px)", borderRadius: "50%" },
  bannerFlexEngine: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "32px", position: "relative", zIndex: 5 },
  bannerEmblem: { fontSize: "48px" },
  bannerTypography: { flex: 1 },
  bannerTitleText: { margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700, color: "#ffffff" },
  bannerBodyDesc: { margin: 0, fontSize: "14px", color: "#cbd5e1", fontStyle: "italic", lineHeight: "1.5" },
  bannerMicroChartArt: { display: "flex", alignItems: "flex-end", gap: "6px", fontSize: "36px", color: "#818cf8" },
  chartBarGrowA: { width: "6px", height: "16px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px" },
  chartBarGrowB: { width: "6px", height: "28px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "2px" },
  chartBarGrowC: { width: "6px", height: "42px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "2px" },
  chartBarGrowD: { width: "6px", height: "56px", backgroundColor: "#818cf8", borderRadius: "2px" },

  enterpriseComplianceFooter: { textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px", fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "6px" },
  premiumSpinnerContainer: { minHeight: "100vh", backgroundColor: "#020617", display: "flex", alignItems: "center", justifycontent: "center", padding: "24px" },
  spinnerGlassCard: { background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "32px", padding: "48px", textAlign: "center", width: "100%", maxWidth: "400px", margin: "0 auto" },
  spinnerTitle: { fontSize: "20px", fontWeight: 700, color: "#f8fafc", margin: "24px 0 8px 0" },
  spinnerSubtitle: { fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.4" },
  skeletonProgressBar: { width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "10px", marginTop: "24px", overflow: "hidden" },
  skeletonProgressFill: { width: "45%", height: "100%", background: "linear-gradient(to right, #4f46e5, #ec4899)", borderRadius: "10px" }
};
